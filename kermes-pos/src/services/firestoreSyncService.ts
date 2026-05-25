import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { auth, db } from "../firebaseInit";
import { Session } from "../types/session";
import { CartTransaction, cartTransactionService } from "./cartTransactionService";
import { CartItem } from "../types/index";

export interface PlaceProfile {
  email: string;
  role: string;
  kermesId: string;
  kermesName: string;
}

export type SyncStatusType = "idle" | "syncing" | "success" | "error";

class FirestoreSyncService {
  private profileKey = "pos.placeProfile";

  getPlaceProfile(): PlaceProfile | null {
    const data = localStorage.getItem(this.profileKey);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  setPlaceProfile(profile: PlaceProfile | null) {
    if (profile) {
      localStorage.setItem(this.profileKey, JSON.stringify(profile));
      localStorage.setItem("pos.kermesId", profile.kermesId);
      localStorage.setItem("pos.kermesName", profile.kermesName);
    } else {
      localStorage.removeItem(this.profileKey);
      localStorage.removeItem("pos.kermesId");
      localStorage.removeItem("pos.kermesName");
    }
  }

  async loginPlace(email: string, password: string): Promise<PlaceProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch place profile details
    const profileSnap = await getDoc(doc(db, "pos_accounts", uid));
    if (!profileSnap.exists()) {
      await signOut(auth);
      throw new Error("Bu hesap bir kermes satış noktası olarak kayıtlı değil.");
    }

    const data = profileSnap.data();
    if (data.role !== "place" || !data.kermesId) {
      await signOut(auth);
      throw new Error("Geçersiz hesap türü veya eksik kermes tanımlaması.");
    }

    if (data.status === "suspended") {
      await signOut(auth);
      throw new Error("Bu satış noktası hesabı yönetici tarafından askıya alındı. Giriş yapılamaz.");
    }

    const profile: PlaceProfile = {
      email: data.email || email,
      role: data.role,
      kermesId: data.kermesId,
      kermesName: data.kermesName || "Kermes Satış Noktası"
    };

    this.setPlaceProfile(profile);
    return profile;
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.setPlaceProfile(null);
  }

  /**
   * Sync a local POS session and all its associated transactions to Firestore.
   * Performs full reconciliation (creates, updates, and deletes matched transactions).
   */
  async syncSession(
    session: Session, 
    transactions: CartTransaction[], 
    onProgress?: (progress: number, stepText: string) => void
  ): Promise<void> {
    const profile = this.getPlaceProfile();
    if (!profile) {
      throw new Error("Kullanıcı oturumu bulunamadı. Lütfen önce giriş yapın.");
    }

    const { kermesId, kermesName } = profile;
    const sessionId = `${kermesId}_${session.id}`;

    onProgress?.(5, "Hesap ve oturum yetkisi doğrulanıyor...");

    // 0.1 Check POS account suspended status
    const uid = auth.currentUser?.uid;
    if (uid) {
      const profileSnap = await getDoc(doc(db, "pos_accounts", uid));
      if (profileSnap.exists()) {
        const pData = profileSnap.data();
        if (pData.status === "suspended") {
          throw new Error("Bu satış noktası hesabı yönetici tarafından askıya alındı. Senkronizasyon yapılamaz.");
        }
      }
    }

    // 0.2 Check if the existing session is locked or completed
    const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
    if (sessionSnap.exists()) {
      const sData = sessionSnap.data();
      if (sData.status === "locked") {
        throw new Error("Bu oturum yönetici tarafından kilitlendi. Daha fazla senkronizasyon yapılamaz.");
      }
      if (sData.status === "completed") {
        throw new Error("Bu oturum yönetici tarafından tamamlandı. Daha fazla senkronizasyon yapılamaz.");
      }
    }

    onProgress?.(10, "İşlem verileri çözümleniyor...");

    // 1. Calculate thorough session-level aggregates
    let totalRevenue = 0;
    let totalOrders = transactions.length;
    let totalItems = 0;

    const categoryAggregates: Record<string, { count: number; revenue: number }> = {};
    const paymentAggregates: Record<string, { count: number; revenue: number }> = {
      cash: { count: 0, revenue: 0 },
      card: { count: 0, revenue: 0 }
    };
    const hourlyAggregates: Record<string, { orders: number; revenue: number }> = {};
    const productRankingsMap: Record<string, { id: string; name: string; count: number; revenue: number }> = {};

    transactions.forEach(tx => {
      totalRevenue += tx.total_amount;
      
      // Pay aggregate
      const method = tx.payment_method === "card" ? "card" : "cash";
      paymentAggregates[method].count += 1;
      paymentAggregates[method].revenue += tx.total_amount;

      // Hourly aggregate (group by hour e.g., "14:00")
      try {
        const txDate = new Date(tx.transaction_date);
        const hourKey = `${String(txDate.getHours()).padStart(2, "0")}:00`;
        if (!hourlyAggregates[hourKey]) {
          hourlyAggregates[hourKey] = { orders: 0, revenue: 0 };
        }
        hourlyAggregates[hourKey].orders += 1;
        hourlyAggregates[hourKey].revenue += tx.total_amount;
      } catch (err) {
        console.error("Hourly grouping error:", err);
      }

      // Parse items for Category & Product aggregates
      try {
        const items = JSON.parse(tx.items_data) as CartItem[];
        items.forEach(item => {
          totalItems += item.quantity;

          // Category
          const category = item.product.category || "Other";
          if (!categoryAggregates[category]) {
            categoryAggregates[category] = { count: 0, revenue: 0 };
          }
          categoryAggregates[category].count += item.quantity;
          categoryAggregates[category].revenue += item.quantity * item.product.price;

          // Product ranking
          const prodId = item.product.id;
          if (!productRankingsMap[prodId]) {
            productRankingsMap[prodId] = {
              id: prodId,
              name: item.product.name,
              count: 0,
              revenue: 0
            };
          }
          productRankingsMap[prodId].count += item.quantity;
          productRankingsMap[prodId].revenue += item.quantity * item.product.price;
        });
      } catch (err) {
        console.error("Failed to parse items data:", err);
      }
    });

    // Sort product rankings descending
    const productRankings = Object.values(productRankingsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 30); // Keep top 30 most popular products

    onProgress?.(30, "Bulut oturum verileri hazırlanıyor...");

    // 2. Upload compiled session metrics document
    const sessionDocData = {
      id: sessionId,
      kermesId,
      kermesName,
      name: session.name,
      description: session.description || "",
      status: session.status,
      startDate: session.startDate,
      endDate: session.endDate || null,
      totalRevenue,
      totalOrders,
      itemsCount: totalItems,
      categoryAggregates,
      paymentAggregates,
      hourlyAggregates,
      productRankings,
      syncedAt: new Date().toISOString(),
      syncedBy: profile.email
    };

    await setDoc(doc(db, "sessions", sessionId), sessionDocData);

    onProgress?.(50, "İşlemler bulut veritabanına aktarılıyor...");

    // 3. Upload raw transactions to sales collection
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const salesDocId = `${kermesId}_${session.id}_${tx.id}`;
      
      let itemsList: CartItem[] = [];
      try {
        itemsList = JSON.parse(tx.items_data) as CartItem[];
      } catch (err) {
        console.error("Parser failure:", err);
      }

      const salesDocData = {
        id: salesDocId,
        kermesId,
        kermesName,
        sessionId,
        transactionDate: tx.transaction_date,
        totalAmount: tx.total_amount,
        itemsCount: tx.items_count,
        items: itemsList.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          category: item.product.category || "Other",
          price: item.product.price,
          quantity: item.quantity
        })),
        paymentMethod: tx.payment_method,
        syncedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "sales", salesDocId), salesDocData);
      
      const percent = Math.floor(50 + (i / transactions.length) * 35);
      onProgress?.(percent, `İşlemler yükleniyor (${i + 1}/${transactions.length})...`);
    }

    onProgress?.(90, "Eski silinen işlemler temizleniyor...");

    // 4. Reconciliation of Deletions: Fetch existing transactions in Firestore for this session, delete those missing locally.
    try {
      const q = query(collection(db, "sales"), where("sessionId", "==", sessionId));
      const querySnap = await getDocs(q);
      
      const localSalesIds = new Set(transactions.map(tx => `${kermesId}_${session.id}_${tx.id}`));
      
      for (const salesDoc of querySnap.docs) {
        if (!localSalesIds.has(salesDoc.id)) {
          console.log(`Reconciliation: Deleting removed sale from Firestore: ${salesDoc.id}`);
          await deleteDoc(doc(db, "sales", salesDoc.id));
        }
      }
    } catch (err) {
      console.error("Reconciliation deletions cleanup failure:", err);
    }

    onProgress?.(95, "Lokal kayıtlar güncelleniyor...");

    // 5. Update local IndexedDB transaction records to synced: true
    for (const tx of transactions) {
      await cartTransactionService.updateTransaction(tx.id, {
        synced: true,
        kermes_id: kermesId
      });
    }

    onProgress?.(100, "Bulut senkronizasyonu başarıyla tamamlandı!");
  }
}

export const firestoreSyncService = new FirestoreSyncService();
