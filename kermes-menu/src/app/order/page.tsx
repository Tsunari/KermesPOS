"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  onSnapshot,
  doc,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../../firebaseInit";
import { useActiveKermes } from "../hooks/useActiveKermes";
import { useLanguage } from "../hooks/useLanguage";
import PageContainer from "../components/PageContainer";
import LoadingScreen from "../components/LoadingScreen";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WifiOffIcon from "@mui/icons-material/WifiOff";

const ORDER_RECOVERY_KEY = "menu.onlineOrder.recent";

interface Product {
  id: string;
  name: string;
  price: number;
  category: "food" | "drink" | "dessert";
  description?: string;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoredOrderTicket {
  orderId: string;
  kermesId: string;
  queueNumber: string;
  savedAt: number;
}

interface SubmittedOrderView {
  orderId: string;
  queueNumber: string;
  items: CartItem[];
  total: number;
  status: "pending" | "imported" | "completed" | "cancelled";
}

function readStoredTicket(): StoredOrderTicket | null {
  try {
    const raw = localStorage.getItem(ORDER_RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrderTicket;
    if (!parsed?.orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredTicket(ticket: StoredOrderTicket) {
  localStorage.setItem(ORDER_RECOVERY_KEY, JSON.stringify(ticket));
}

function clearStoredTicket() {
  localStorage.removeItem(ORDER_RECOVERY_KEY);
}

function OrderPageContent() {
  const { kermesData, loading: kermesLoading } = useActiveKermes();
  const { lang, setLang, t } = useLanguage();
  const searchParams = useSearchParams();
  const ticketMode = searchParams.get("ticket") === "1";

  // Firestore system configs
  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null);
  const [posListening, setPosListening] = useState<boolean | null>(null);
  const [systemLoading, setSystemLoading] = useState(true);

  // Products and cart states
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrderView | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [ticketHydrated, setTicketHydrated] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // Selected Category tab
  const [activeTab, setActiveTab] = useState<"food" | "drink" | "dessert">("food");

  const activeKermesId = kermesData?.id || "";

  const restoreSavedTicket = () => {
    const stored = readStoredTicket();
    if (!stored) {
      setTrackedOrderId(null);
      setTicketHydrated(true);
      return;
    }

    // If active kermes is known and differs, do not reuse stale ticket.
    if (activeKermesId && stored.kermesId && stored.kermesId !== activeKermesId) {
      clearStoredTicket();
      setTrackedOrderId(null);
      setTicketHydrated(true);
      return;
    }

    setTrackedOrderId(stored.orderId);
    setTicketHydrated(true);
  };

  // 1. Listen to Global Config & POS Listening states
  useEffect(() => {
    if (kermesLoading) return;

    // If no kermesId, mark as closed immediately
    if (!activeKermesId) {
      setGlobalEnabled(false);
      setPosListening(false);
      setSystemLoading(false);
      return;
    }

    // Safety timeout: don't hang on loading indefinitely
    const safetyTimer = setTimeout(() => setSystemLoading(false), 5000);

    // Listen to global admin enable
    const unsubGlobal = onSnapshot(
      doc(db, "system_config", "online_ordering"),
      (snap) => {
        if (snap.exists()) {
          setGlobalEnabled(snap.data()?.enabled ?? false);
        } else {
          setGlobalEnabled(false);
        }
      },
      () => setGlobalEnabled(false)
    );

    // Listen to POS active listening
    const unsubPos = onSnapshot(
      doc(db, "system_config", `pos_listening_${activeKermesId}`),
      (snap) => {
        if (snap.exists()) {
          setPosListening(snap.data()?.active ?? false);
        } else {
          setPosListening(false);
        }
        setSystemLoading(false);
        clearTimeout(safetyTimer);
      },
      () => {
        setPosListening(false);
        setSystemLoading(false);
        clearTimeout(safetyTimer);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubGlobal();
      unsubPos();
    };
  }, [kermesLoading, activeKermesId]);

  // Hydrate previously submitted ticket from local storage.
  useEffect(() => {
    if (kermesLoading) return;
    restoreSavedTicket();
  }, [kermesLoading, activeKermesId]);

  // Listen only to the tracked order document while on this page.
  useEffect(() => {
    if (!trackedOrderId) {
      setSubmittedOrder(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "online_orders", trackedOrderId), (snap) => {
      if (!snap.exists()) {
        clearStoredTicket();
        setTrackedOrderId(null);
        setSubmittedOrder(null);
        return;
      }

      const data = snap.data();
      if (activeKermesId && data?.kermesId && data.kermesId !== activeKermesId) {
        clearStoredTicket();
        setTrackedOrderId(null);
        setSubmittedOrder(null);
        return;
      }

      const mappedItems: CartItem[] = (Array.isArray(data?.items) ? data.items : []).map((item: any) => ({
        product: {
          id: item.productId ?? "",
          name: item.name ?? "",
          price: Number(item.price) || 0,
          category: item.category === "drink" || item.category === "dessert" ? item.category : "food",
          inStock: true,
        },
        quantity: Number(item.quantity) || 1,
      }));

      const nextSubmitted: SubmittedOrderView = {
        orderId: snap.id,
        queueNumber: data?.queueNumber ?? "#----",
        items: mappedItems,
        total: Number(data?.total) || 0,
        status: (data?.status as SubmittedOrderView["status"]) || "pending",
      };

      setSubmittedOrder(nextSubmitted);
      writeStoredTicket({
        orderId: snap.id,
        kermesId: data?.kermesId ?? activeKermesId,
        queueNumber: nextSubmitted.queueNumber,
        savedAt: Date.now(),
      });
    });

    return () => unsubscribe();
  }, [trackedOrderId, activeKermesId]);

  // 2. Subscribe to Dynamic Products (onSnapshot for real-time stock updates)
  useEffect(() => {
    if (!activeKermesId) return;

    // onSnapshot: customers see "Sold Out" instantly when cashier toggles stock
    const unsubProducts = onSnapshot(
      doc(db, "kermes_products", activeKermesId),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.products)) {
          const list = (snap.data().products as Product[]).filter((p: any) => !p.hidden);
          setProducts(list);
        } else {
          fetchFallbackProducts();
        }
      },
      () => {
        fetchFallbackProducts();
      }
    );

    return () => unsubProducts();
  }, [activeKermesId]);

  const fetchFallbackProducts = () => {
    fetch("/data/products.json")
      .then((res) => {
        if (!res.ok) throw new Error("Fallback products failed");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((err) => console.error("Error fetching fallback products:", err));
  };

  if (kermesLoading || systemLoading || !ticketHydrated) {
    return (
      <PageContainer>
        <LoadingScreen />
      </PageContainer>
    );
  }

  // Check ordering authorization
  const isOrderingOpen = globalEnabled === true && posListening === true;

  if (ticketMode && !submittedOrder && !trackedOrderId) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center bg-gray-100 rounded-full shadow-lg border border-gray-200">
            <ShoppingBagIcon className="text-gray-400 !h-10 !w-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight leading-snug">
            {t("no_saved_ticket_title") || "No active ticket on this device"}
          </h2>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            {t("no_saved_ticket_desc") || "Place a new order first, then you can reopen your ticket from here."}
          </p>

          <Link
            href="/order"
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-2xl shadow transition text-sm mt-4"
          >
            {t("start_new_order") || "Start New Order"}
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!isOrderingOpen && !submittedOrder) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center bg-gray-100 rounded-full shadow-lg border border-gray-200">
            <WifiOffIcon className="text-gray-400 !h-10 !w-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight leading-snug">
            {t("online_ordering_closed")}
          </h2>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            {t("online_ordering_closed_desc")}
          </p>

          <Link
            href="/"
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-2xl shadow transition text-sm mt-4"
          >
            <ArrowBackIcon fontSize="small" />
            {t("home")}
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Cart Helper functions
  const addToCart = (product: Product) => {
    if (!product.inStock) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: nextQty } : item
      );
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Submit Pre-Order to Firestore
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || submitting || !activeKermesId) return;

    setSubmitting(true);
    try {
      let queueNumber = submittedOrder?.queueNumber || "";
      if (!editingOrderId) {
        // Queue numbers are generated with a per-kermes counter to avoid collisions.
        const queueCounterRef = doc(db, "queue_counters", activeKermesId);
        queueNumber = await runTransaction(db, async (tx) => {
          const counterSnap = await tx.get(queueCounterRef);
          const current = counterSnap.exists() ? Number(counterSnap.data()?.value) || 0 : 0;
          const next = current + 1;
          tx.set(
            queueCounterRef,
            {
              value: next,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          return `#${String(next).padStart(4, "0")}`;
        });
      }

      const orderData = {
        kermesId: activeKermesId,
        queueNumber,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          category: item.product.category,
        })),
        total: cartTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let orderId = editingOrderId;

      if (editingOrderId) {
        const orderRef = doc(db, "online_orders", editingOrderId);
        await runTransaction(db, async (tx) => {
          const orderSnap = await tx.get(orderRef);
          if (!orderSnap.exists()) {
            throw new Error("order_not_found");
          }
          const currentStatus = orderSnap.data()?.status;
          if (currentStatus !== "pending") {
            throw new Error("order_not_editable");
          }
          tx.update(orderRef, {
            items: orderData.items,
            total: orderData.total,
            updatedAt: serverTimestamp(),
          });
        });
      } else {
        const orderRef = await addDoc(collection(db, "online_orders"), orderData);
        orderId = orderRef.id;
      }

      const nextSubmitted: SubmittedOrderView = {
        orderId: orderId || "",
        queueNumber,
        items: [...cart],
        total: cartTotal,
        status: "pending",
      };

      setSubmittedOrder(nextSubmitted);
      setTrackedOrderId(orderId || null);
      setEditingOrderId(null);
      writeStoredTicket({
        orderId: orderId || "",
        kermesId: activeKermesId,
        queueNumber,
        savedAt: Date.now(),
      });

      clearCart();
    } catch (err) {
      console.error("Order submission failure:", err);
      const typedErr = err as Error;
      if (typedErr?.message === "order_not_editable") {
        alert(t("order_edit_not_allowed") || "This order can no longer be modified.");
      } else {
        alert(t("order_submit_error") || "Sipariş gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startModifyOrder = () => {
    if (!submittedOrder || submittedOrder.status !== "pending") return;
    setEditingOrderId(submittedOrder.orderId);
    setCart([...submittedOrder.items]);
    setSubmittedOrder(null);
    setCartOpen(true);
  };

  const cancelSubmittedOrder = async () => {
    if (!submittedOrder || submittedOrder.status !== "pending") return;
    setUpdatingTicket(true);
    try {
      const orderRef = doc(db, "online_orders", submittedOrder.orderId);
      await runTransaction(db, async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error("order_not_found");
        }
        const currentStatus = orderSnap.data()?.status;
        if (currentStatus !== "pending") {
          throw new Error("order_not_editable");
        }
        tx.update(orderRef, {
          status: "cancelled",
          updatedAt: serverTimestamp(),
        });
      });
    } catch (err) {
      const typedErr = err as Error;
      if (typedErr?.message === "order_not_editable") {
        alert(t("order_edit_not_allowed") || "This order can no longer be modified.");
      } else {
        alert(t("order_cancel_error") || "Order could not be cancelled. Please try again.");
      }
    } finally {
      setUpdatingTicket(false);
    }
  };

  const clearRecoveredTicket = () => {
    clearStoredTicket();
    setTrackedOrderId(null);
    setSubmittedOrder(null);
  };

  const statusMeta: Record<SubmittedOrderView["status"], { label: string; className: string }> = {
    pending: {
      label: t("order_status_pending") || "Waiting at cashier",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    imported: {
      label: t("order_status_imported") || "Imported at cashier",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    },
    completed: {
      label: t("order_status_completed") || "Completed",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    cancelled: {
      label: t("order_status_cancelled") || "Cancelled",
      className: "bg-rose-100 text-rose-800 border border-rose-200",
    },
  };

  // Render Order Receipt Card
  if (submittedOrder) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center py-8 px-4 gap-6 select-none">
          <div className="flex flex-col items-center gap-2 text-center animate-fade-in">
            <CheckCircleOutlineIcon className="text-green-500 !h-16 !w-16 drop-shadow-md animate-scale-up" />
            <h1 className="text-2xl font-extrabold text-black tracking-tight mt-2">
              {t("order_submitted")}
            </h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${statusMeta[submittedOrder.status]?.className || "bg-gray-100 text-gray-700 border border-gray-200"}`}
            >
              {statusMeta[submittedOrder.status]?.label || submittedOrder.status}
            </span>
          </div>

          {/* Premium Queue Ticket Card */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden relative flex flex-col items-center px-6 py-8 gap-5 border-dashed border-b-2">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 via-teal-400 to-green-500" />
            <TypographyWithClass tag="p" className="text-xs uppercase font-extrabold text-gray-400 tracking-widest mt-1">
              {t("queue_number_title")}
            </TypographyWithClass>
            <div className="text-5xl font-black text-black tracking-tight py-2 px-6 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner select-all animate-bounce">
              {submittedOrder.queueNumber}
            </div>
            <p className="text-xs font-semibold text-red-500 leading-snug text-center max-w-xs bg-red-50 p-3 rounded-2xl border border-red-100">
              {t("queue_number_desc")}
            </p>
            <p className="text-[10px] text-gray-400 text-center font-medium leading-normal italic px-2">
              {t("warning_payment")}
            </p>
          </div>

          {/* Receipt Items Details Card */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl shadow p-5 flex flex-col gap-3">
            <TypographyWithClass tag="h3" className="text-xs uppercase font-bold text-gray-400 tracking-wide">
              {t("order_details") || "Sipariş Detayı"}
            </TypographyWithClass>
            <div className="flex flex-col gap-2">
              {submittedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-semibold text-black py-0.5 border-b border-gray-100/50">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>{t("currency")}{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">{t("total")}</span>
              <span className="text-lg font-black text-black">
                {t("currency")}{submittedOrder.total.toFixed(2)}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-center bg-black hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition text-sm text-center"
          >
            {t("home")}
          </Link>

          <button
            onClick={clearRecoveredTicket}
            className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-black font-bold py-3 rounded-2xl border border-gray-200 shadow-sm transition text-sm text-center"
          >
            {t("start_new_order") || "Start New Order"}
          </button>

          {submittedOrder.status === "pending" && (
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                onClick={startModifyOrder}
                className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-black font-bold py-3 rounded-2xl border border-gray-200 shadow-sm transition text-sm text-center"
              >
                {t("modify_preorder") || "Modify Pre-order"}
              </button>
              <button
                onClick={cancelSubmittedOrder}
                disabled={updatingTicket}
                className="w-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 rounded-2xl border border-rose-200 shadow-sm transition text-sm text-center disabled:opacity-60"
              >
                {updatingTicket
                  ? (t("cancelling_order") || "Cancelling...")
                  : (t("cancel_preorder") || "Cancel Pre-order")}
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // Filter products by active category tab
  const categoryProducts = products.filter((p) => p.category === activeTab);

  return (
    <PageContainer>
      <div className="flex flex-col h-full w-full relative select-none">
        
        {/* Sticky Header with Language Toggles */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 flex items-center justify-between z-40">
          <h1 className="text-lg font-black text-black tracking-tight">{t("menu_title")}</h1>
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200/50">
            {(["tr", "en", "de"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg transition-all ${
                  lang === l ? "bg-black text-white shadow-smScale" : "text-gray-500 hover:text-black"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className="flex bg-white px-2 py-3 border-b border-gray-100 gap-1 overflow-x-auto no-scrollbar">
          {(["food", "drink", "dessert"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-extrabold uppercase rounded-xl border transition-all text-center leading-none ${
                activeTab === tab
                  ? "bg-black text-white border-black shadow"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t(`categories.${tab}`)}
            </button>
          ))}
        </div>

        {/* Scrollable Products list */}
        <div className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-28">
          {categoryProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm font-medium">
              Bu kategoride ürün bulunmuyor.
            </div>
          ) : (
            categoryProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => product.inStock && addToCart(product)}
                className={`bg-white rounded-2xl border p-4 flex justify-between items-center shadow-sm cursor-pointer transition-all ${
                  product.inStock 
                    ? "border-gray-200 hover:border-black hover:shadow-md" 
                    : "border-gray-150 bg-gray-50/50 opacity-60"
                }`}
              >
                <div className="flex-1 pr-4">
                  <h3 className="text-sm font-extrabold text-black leading-snug">{product.name}</h3>
                  {product.description && (
                    <p className="text-[11px] text-gray-400 mt-1 leading-normal line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {!product.inStock && (
                    <span className="inline-block mt-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {t("out_of_stock")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-base font-black text-black">
                    {t("currency")}{product.price.toFixed(2)}
                  </span>
                  {product.inStock && (
                    <button className="bg-black hover:bg-gray-800 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl shadow transition">
                      {t("add_to_basket")}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Mobile Cart trigger footer */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-3.5 z-40 max-w-md mx-auto rounded-t-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500 font-bold">
                {cartCount} {t("items")}
              </span>
              <span className="text-lg font-black text-black leading-tight">
                {t("currency")}{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg transition text-sm"
            >
              <ShoppingBagIcon fontSize="small" />
              {t("show_basket")}
            </button>
          </div>
        )}

        {/* Slide-up Glassmorphic Cart Sheet */}
        {cartOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[32px] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden p-6 animate-slide-up">
              
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <TypographyWithClass tag="h2" className="text-lg font-black text-black tracking-tight">
                  {t("cart_title")}
                </TypographyWithClass>
                <IconButtonWithClass onClick={() => setCartOpen(false)}>
                  <CloseIcon fontSize="medium" className="text-black" />
                </IconButtonWithClass>
              </div>

              {/* Items scrollable panel */}
              <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3 py-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex-1 pr-3">
                      <h4 className="text-sm font-extrabold text-black">{item.product.name}</h4>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">
                        {t("currency")}{item.product.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="px-3 py-1.5 hover:bg-gray-150 transition font-black text-sm text-black"
                        >
                          -
                        </button>
                        <span className="px-1 text-sm font-extrabold text-black min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="px-3 py-1.5 hover:bg-gray-150 transition font-black text-sm text-black"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-black text-black min-w-[50px] text-right">
                        {t("currency")}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout details */}
              <div className="mt-4 pt-4 border-t border-gray-150 flex flex-col gap-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-gray-500">{t("total")}</span>
                  <span className="text-xl font-black text-black">
                    {t("currency")}{cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full flex items-center justify-center bg-black hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? t("submitting")
                    : editingOrderId
                      ? (t("save_preorder_changes") || "Save Pre-order Changes")
                      : t("submit_order")}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <LoadingScreen />
        </PageContainer>
      }
    >
      <OrderPageContent />
    </Suspense>
  );
}

// Small layout semantic typography helpers to ensure consistent tags
function TypographyWithClass({ tag: Tag = "p", className = "", children }: any) {
  return <Tag className={`text-black dark:text-black ${className}`}>{children}</Tag>;
}

function IconButtonWithClass({ onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
    >
      {children}
    </button>
  );
}
