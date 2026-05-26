"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import { firebaseConfig } from "../../../firebaseConfig";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import KermesLoading from "../../components/KermesLoading";
import KermesAppBar from "../../components/KermesAppBar";
import type { POSAccount } from "../../types/sync";

export default function Management() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [posAccounts, setPosAccounts] = useState<POSAccount[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"place" | "tenant_admin">("place");
  const [newKermesId, setNewKermesId] = useState("");
  const [newKermesName, setNewKermesName] = useState("");
  const [posLoading, setPosLoading] = useState(false);
  const [posSuccess, setPosSuccess] = useState("");
  const [posError, setPosError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const filteredAccounts = posAccounts.filter((acc) => {
    const matchesSearch =
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.kermesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.kermesId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && acc.status !== "suspended") ||
      (statusFilter === "suspended" && acc.status === "suspended");

    return matchesSearch && matchesStatus;
  });

  async function handleToggleStatus(uid: string, currentStatus?: string) {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const statusLabel = nextStatus === "active" ? "aktife" : "askıya";
    
    if (!window.confirm(`Bu hesabı ${statusLabel} almak istediğinize emin misiniz?`)) return;

    setPosLoading(true);
    setPosError("");
    setPosSuccess("");

    try {
      const posDocRef = doc(db, "pos_accounts", uid);
      const posSnap = await getDoc(posDocRef);
      if (posSnap.exists()) {
        await setDoc(posDocRef, { status: nextStatus }, { merge: true });
      } else {
        await setDoc(doc(db, "admin_accounts", uid), { status: nextStatus }, { merge: true });
      }
      setPosSuccess(`Hesap başarıyla ${statusLabel} alındı.`);
    } catch (err: unknown) {
      console.error("Account toggle status failure:", err);
      setPosError(err instanceof Error ? err.message : "Durum güncellenirken hata oluştu.");
    } finally {
      setPosLoading(false);
    }
  }

  // Auth check
  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      const role = sessionStorage.getItem("adminRole");
      if (role !== "super_admin") {
        router.replace("/dashboard");
        return;
      }
      setIsAuth(true);
      setLoading(false);
    } else {
      router.replace("/");
    }
  }, [router]);

  // Live subscription to pos_accounts and admin_accounts
  useEffect(() => {
    const unsubPos = onSnapshot(collection(db, "pos_accounts"), (snapPos) => {
      const posList = snapPos.docs.map(d => ({ id: d.id, ...d.data(), type: "Cashier" } as any));
      
      const unsubAdmin = onSnapshot(collection(db, "admin_accounts"), (snapAdmin) => {
        const adminList = snapAdmin.docs
          .map(d => ({ id: d.id, ...d.data(), kermesId: d.data().tenantId, kermesName: "Dashboard Admin", type: "Admin" } as any))
          .filter(acc => acc.role === "tenant_admin");
        
        const merged = [...posList, ...adminList];
        merged.sort((a, b) => a.email.localeCompare(b.email));
        setPosAccounts(merged);
      });
      
      return () => unsubAdmin();
    });
    return () => unsubPos();
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword || !newKermesId.trim()) {
      setPosError("Lütfen zorunlu alanları doldurun (e-posta, şifre ve konum kodu).");
      return;
    }

    setPosLoading(true);
    setPosError("");
    setPosSuccess("");

    // Normalise the kermesId slug: lowercase, spaces → hyphens
    const normalisedId = newKermesId.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    try {
      // Use a uniquely named temp app to avoid "already exists" Firebase errors on repeated calls
      const tempApp = initializeApp(firebaseConfig, `TempReg_${Date.now()}`);
      const tempAuth = getAuth(tempApp);

      const credential = await createUserWithEmailAndPassword(tempAuth, newEmail, newPassword);
      const uid = credential.user.uid;

      if (newRole === "tenant_admin") {
        await setDoc(doc(db, "admin_accounts", uid), {
          uid,
          email: newEmail,
          role: "tenant_admin",
          tenantId: normalisedId,
          createdAt: new Date().toISOString(),
          status: "active",
        });
      } else {
        await setDoc(doc(db, "pos_accounts", uid), {
          email: newEmail,
          role: "place",
          kermesId: normalisedId,
          kermesName: newKermesName.trim() || normalisedId,
          createdAt: new Date().toISOString(),
          status: "active",
        });
      }

      await signOut(tempAuth);

      setPosSuccess(`"${newEmail}" hesabı başarıyla oluşturuldu!`);
      setNewEmail("");
      setNewPassword("");
      setNewKermesId("");
      setNewKermesName("");
    } catch (err: unknown) {
      console.error("Account registration failure:", err);
      setPosError(err instanceof Error ? err.message : "Hesap oluşturulurken bir hata oluştu.");
    } finally {
      setPosLoading(false);
    }
  }

  async function handleDelete(uid: string, email: string) {
    if (!window.confirm(`"${email}" hesabını silmek istediğinize emin misiniz?`)) return;

    setPosLoading(true);
    setPosError("");
    setPosSuccess("");

    try {
      const posDocRef = doc(db, "pos_accounts", uid);
      const posSnap = await getDoc(posDocRef);
      if (posSnap.exists()) {
        await deleteDoc(posDocRef);
      } else {
        await deleteDoc(doc(db, "admin_accounts", uid));
      }
      setPosSuccess("Hesap veritabanından silindi. (Firebase Auth kaydını konsol üzerinden de kaldırabilirsiniz.)");
    } catch (err: unknown) {
      console.error("Account deletion failure:", err);
      setPosError(err instanceof Error ? err.message : "Hesap silinirken bir hata oluştu.");
    } finally {
      setPosLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("isAdmin");
    router.replace("/");
  }

  if (!isAuth) return null;
  if (loading) return <KermesLoading message="Yükleniyor..." />;

  return (
    <div className="flex min-h-screen">
      <KermesAppBar onLogout={handleLogout} />
      <div className="flex-1 p-8 flex flex-col items-center gap-8 bg-gray-50 dark:bg-neutral-900 ml-20 md:ml-20">

        {/* Page Header */}
        <div className="w-full max-w-5xl flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ManageAccountsIcon className="!h-7 !w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Hesap Yönetimi</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              POS cihazlarında kullanılacak satış noktası giriş hesaplarını oluşturun ve yönetin
            </p>
          </div>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Registration Form */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-neutral-700 pb-4">
              <AddIcon className="text-indigo-500 !h-5 !w-5" />
              <h2 className="text-lg font-bold text-black dark:text-white">Yeni Hesap Oluştur</h2>
            </div>

            {posSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold">{posSuccess}</p>
              </div>
            )}
            {posError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{posError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">

              {/* Account Type / Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Hesap Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition cursor-pointer"
                  disabled={posLoading}
                >
                  <option value="place">Satış Noktası (POS Register Cashier)</option>
                  <option value="tenant_admin">Yönetici (Tenant Admin Dashboard)</option>
                </select>
              </div>

              {/* Credentials */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="satisnoktasi@kermes.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  required
                  disabled={posLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  required
                  disabled={posLoading}
                />
              </div>

              {/* Location binding */}
              <div className="border-t border-gray-100 dark:border-neutral-700 pt-4 flex flex-col gap-4">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide">Konum Bilgisi</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Konum Kodu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ulm, munih-fatih, augsburg..."
                    value={newKermesId}
                    onChange={(e) => setNewKermesId(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-4 py-3 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                    required
                    disabled={posLoading}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Benzersiz konum tanımlayıcı, analitik sorgularında kullanılır. Otomatik normalize edilir.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Görünen Konum Adı
                  </label>
                  <input
                    type="text"
                    placeholder="Münih Fatih, Ulm, Augsburg..."
                    value={newKermesName}
                    onChange={(e) => setNewKermesName(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                    disabled={posLoading}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Boş bırakılırsa konum kodu kullanılır.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={posLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {posLoading
                  ? <span className="inline-block w-4 h-4 border-2 border-t-2 border-t-white border-white/30 rounded-full animate-spin" />
                  : <AddIcon className="!h-4 !w-4" />
                }
                {posLoading ? "Oluşturuluyor..." : "Hesabı Oluştur"}
              </button>
            </form>
          </div>

          {/* Accounts Table */}
          <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-black dark:text-white">Kayıtlı Hesaplar</h2>
                <span className="text-xs font-bold bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  {filteredAccounts.length} / {posAccounts.length} hesap
                </span>
              </div>
              
              {/* Search & Filter widgets */}
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Ara (E-posta, konum)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-3 py-2 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 px-3 py-2 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Sadece Aktifler</option>
                  <option value="suspended">Sadece Askıdakiler</option>
                </select>
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <ManageAccountsIcon className="!h-12 !w-12 text-gray-200 dark:text-neutral-700 mb-3" />
                <p className="text-sm text-gray-400 font-semibold">Kayıtlı POS hesabı bulunamadı</p>
                <p className="text-xs text-gray-400 mt-1">Kriterlere uygun hesap yok veya henüz hesap oluşturulmadı.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-700 text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">
                      <th className="px-6 py-3">E-posta</th>
                      <th className="px-6 py-3">Konum</th>
                      <th className="px-6 py-3">Oluşturulma</th>
                      <th className="px-6 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {filteredAccounts.map((acc: any) => (
                      <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900/40 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-black dark:text-white">{acc.email}</p>
                            {acc.status === "suspended" ? (
                              <span className="text-[9px] font-bold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full uppercase">
                                Askıda
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase">
                                Aktif
                              </span>
                            )}
                            {acc.type === "Admin" ? (
                              <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase">
                                Yönetici
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase">
                                Kasa
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5 break-all">{acc.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-black dark:text-white">{acc.kermesName || acc.kermesId}</p>
                          <p className="text-[9px] font-mono text-gray-400 mt-0.5">{acc.kermesId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("de-DE") : "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc.id, acc.status)}
                            disabled={posLoading}
                            className={`p-2 rounded-lg transition disabled:opacity-40 ${
                              acc.status === "suspended" 
                                ? "text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30" 
                                : "text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            }`}
                            title={acc.status === "suspended" ? "Hesabı Aktifleştir" : "Hesabı Askıya Al"}
                          >
                            {acc.status === "suspended" ? <CheckCircleIcon className="!h-4 !w-4" /> : <BlockIcon className="!h-4 !w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(acc.id, acc.email)}
                            disabled={posLoading}
                            className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-40"
                            title="Hesabı sil"
                          >
                            <DeleteIcon className="!h-4 !w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
