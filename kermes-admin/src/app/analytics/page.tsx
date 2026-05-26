"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import KermesLoading from "../../components/KermesLoading";
import KermesAppBar from "../../components/KermesAppBar";
import type { SyncedSession, LiveSale } from "../../types/sync";

const formatDateStr = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE");
};

export default function Analytics() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [syncedSessions, setSyncedSessions] = useState<SyncedSession[]>([]);
  const [liveSalesFeed, setLiveSalesFeed] = useState<LiveSale[]>([]);
  const [selectedKermesId, setSelectedKermesId] = useState("");
  const [selectedAnalyticsSessionId, setSelectedAnalyticsSessionId] = useState<string>("all");

  const [adminRole, setAdminRole] = useState<"super_admin" | "tenant_admin">("tenant_admin");
  const [adminTenantId, setAdminTenantId] = useState<string>("");

  // Restore persisted selection after mount (SSR-safe)
  useEffect(() => {
    const role = sessionStorage.getItem("adminRole") || "tenant_admin";
    const tId = sessionStorage.getItem("adminTenantId") || "";
    if (role === "super_admin") {
      const savedKermes = localStorage.getItem("analytics_selected_kermes");
      if (savedKermes) setSelectedKermesId(savedKermes);
    } else {
      if (tId) setSelectedKermesId(tId);
    }
    const savedSession = localStorage.getItem("analytics_selected_session");
    if (savedSession) setSelectedAnalyticsSessionId(savedSession);
  }, []);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedTransactions, setExpandedTransactions] = useState<LiveSale[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [transactionCache, setTransactionCache] = useState<Record<string, LiveSale[]>>({});

  async function handleDeleteSession(sessionId: string, sessionName: string) {
    if (!window.confirm(`"${sessionName}" oturumunu ve bu oturuma ait tüm satış kayıtlarını buluttan tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    setLoading(true);
    try {
      // 1. Delete the session document
      const docRef = doc(db, "sessions", sessionId);
      await deleteDoc(docRef);

      // 2. Query and delete all associated sales
      const q = query(collection(db, "sales"), where("sessionId", "==", sessionId));
      const querySnap = await getDocs(q);
      
      const deletePromises = querySnap.docs.map(d => deleteDoc(doc(db, "sales", d.id)));
      await Promise.all(deletePromises);

      alert("Oturum ve ilişkili tüm satış kayıtları buluttan başarıyla silindi.");
      
      // If the deleted session was the currently selected session in analytics, reset the selected session filter
      if (selectedAnalyticsSessionId === sessionId) {
        setSelectedAnalyticsSessionId("all");
        localStorage.removeItem("analytics_selected_session");
      }
    } catch (err) {
      console.error("Session delete failure:", err);
      alert("Oturum silinirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // Auth check
  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      setIsAuth(true);
      const r = (sessionStorage.getItem("adminRole") as any) || "tenant_admin";
      const tId = sessionStorage.getItem("adminTenantId") || "";
      setAdminRole(r);
      setAdminTenantId(tId);
      if (r === "tenant_admin" && tId) {
        setSelectedKermesId(tId);
      }
      setLoading(false);
    } else {
      router.replace("/");
    }
  }, [router]);

  // Sessions subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sessions"), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SyncedSession));
      list.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
      setSyncedSessions(list);
    });
    return () => unsubscribe();
  }, []);

  // Live Sales Feed subscription (capped at 10)
  useEffect(() => {
    if (!selectedKermesId) { setLiveSalesFeed([]); return; }
    let q;
    if (selectedAnalyticsSessionId === "all") {
      q = query(collection(db, "sales"), where("kermesId", "==", selectedKermesId));
    } else {
      q = query(collection(db, "sales"), where("sessionId", "==", selectedAnalyticsSessionId));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveSale));
      sales.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      setLiveSalesFeed(sales.slice(0, 10));
    });
    return () => unsubscribe();
  }, [selectedKermesId, selectedAnalyticsSessionId]);

  // Lazy-load transaction details with browser-side cache
  useEffect(() => {
    if (!expandedSessionId) {
      setExpandedTransactions([]);
      return;
    }
    if (transactionCache[expandedSessionId]) {
      setExpandedTransactions(transactionCache[expandedSessionId]);
      return;
    }
    setTxLoading(true);
    const q = query(collection(db, "sales"), where("sessionId", "==", expandedSessionId));
    import("firebase/firestore").then(({ getDocs }) => {
      getDocs(q)
        .then((snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSale));
          list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
          setTransactionCache(prev => ({ ...prev, [expandedSessionId]: list }));
          setExpandedTransactions(list);
          setTxLoading(false);
        })
        .catch((err: unknown) => {
          console.error("Failed to lazy load session sales:", err);
          setTxLoading(false);
        });
    });
  }, [expandedSessionId]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Derive available kermes locations from synced sessions (not from CMS)
  const availableLocations = useMemo(() => {
    const map = new Map<string, string>();
    syncedSessions.forEach(s => {
      if (s.kermesId) map.set(s.kermesId, s.kermesName || s.kermesId);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [syncedSessions]);

  const filteredSessions = useMemo(
    () => syncedSessions.filter(s => s.kermesId === selectedKermesId),
    [syncedSessions, selectedKermesId]
  );

  const sessionsForAnalytics = useMemo(() => {
    if (selectedAnalyticsSessionId === "all") {
      return filteredSessions;
    }
    return filteredSessions.filter(s => s.id === selectedAnalyticsSessionId);
  }, [filteredSessions, selectedAnalyticsSessionId]);

  // Compile aggregates from session summaries (1 read per session, not per transaction)
  const aggregates = useMemo(() => {
    let revenue = 0, orders = 0, items = 0;
    const categories: Record<string, { count: number; revenue: number }> = {};
    const payments = { cash: { count: 0, revenue: 0 }, card: { count: 0, revenue: 0 } };
    const hourly: Record<string, { orders: number; revenue: number }> = {};
    const products: Record<string, { id: string; name: string; count: number; revenue: number }> = {};

    sessionsForAnalytics.forEach(s => {
      revenue += s.totalRevenue || 0;
      orders += s.totalOrders || 0;
      items += s.itemsCount || 0;

      if (s.categoryAggregates) {
        Object.entries(s.categoryAggregates).forEach(([cat, val]) => {
          if (!categories[cat]) categories[cat] = { count: 0, revenue: 0 };
          categories[cat].count += val.count || 0;
          categories[cat].revenue += val.revenue || 0;
        });
      }

      if (s.paymentAggregates) {
        Object.entries(s.paymentAggregates).forEach(([method, val]) => {
          if (method === "cash" || method === "card") {
            payments[method as "cash" | "card"].count += val.count || 0;
            payments[method as "cash" | "card"].revenue += val.revenue || 0;
          }
        });
      }

      if (s.hourlyAggregates) {
        Object.entries(s.hourlyAggregates).forEach(([hour, val]) => {
          if (!hourly[hour]) hourly[hour] = { orders: 0, revenue: 0 };
          hourly[hour].orders += val.orders || 0;
          hourly[hour].revenue += val.revenue || 0;
        });
      }

      if (s.productRankings) {
        s.productRankings.forEach(p => {
          if (!products[p.id]) products[p.id] = { id: p.id, name: p.name, count: 0, revenue: 0 };
          products[p.id].count += p.count || 0;
          products[p.id].revenue += p.revenue || 0;
        });
      }
    });

    const sortedProducts = Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return { revenue, orders, items, categories, payments, hourly, products: sortedProducts };
  }, [sessionsForAnalytics]);

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

        {/* Analytics Portal */}
        <div className="w-full max-w-6xl bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 lg:p-8 flex flex-col gap-8">

          {/* Header + Location Selector */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-700 pb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <QueryStatsIcon className="!h-7 !w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
                  Satış Analitiği
                  {selectedKermesId && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Senkronize edilmiş satış noktası oturum ve finansal verileri
                </p>
              </div>
            </div>

            {/* Location & Session Selectors */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Location selector — only shown for super_admin */}
              {adminRole === "super_admin" && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-4 py-2 rounded-xl">
                  <LocationOnIcon className="text-gray-400 !h-5 !w-5" />
                  <select
                    value={selectedKermesId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedKermesId(id);
                      setSelectedAnalyticsSessionId("all");
                      setExpandedSessionId(null);
                      if (id) localStorage.setItem("analytics_selected_kermes", id);
                      else localStorage.removeItem("analytics_selected_kermes");
                    }}
                    className="bg-transparent border-none text-xs font-bold text-black dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" className="dark:bg-neutral-950">Satış Noktası Seçin</option>
                    {availableLocations.map(opt => (
                      <option key={opt.id} value={opt.id} className="dark:bg-neutral-950">{opt.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Session selector */}
              {selectedKermesId && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-4 py-2 rounded-xl animate-fade-in">
                  <CloudQueueIcon className="text-gray-400 !h-5 !w-5" />
                  <select
                    value={selectedAnalyticsSessionId}
                    onChange={(e) => {
                      const sessId = e.target.value;
                      setSelectedAnalyticsSessionId(sessId);
                      if (sessId !== "all") {
                        localStorage.setItem("analytics_selected_session", sessId);
                      } else {
                        localStorage.removeItem("analytics_selected_session");
                      }
                    }}
                    className="bg-transparent border-none text-xs font-bold text-black dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="dark:bg-neutral-950">Tüm Oturumlar (Toplu)</option>
                    {filteredSessions.map(session => {
                      const startStr = formatDateStr(session.startDate);
                      const endStr = formatDateStr(session.endDate);
                      const dateRangeStr = startStr ? ` (${startStr}${endStr ? ` - ${endStr}` : ""})` : "";
                      return (
                        <option key={session.id} value={session.id} className="dark:bg-neutral-950">
                          {session.name}{dateRangeStr}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          {!selectedKermesId ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700 px-8">
              <CloudQueueIcon className="mx-auto !h-12 !w-12 text-gray-300 dark:text-neutral-700 mb-4" />
              {availableLocations.length === 0 ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">
                    Henüz senkronize edilmiş oturum bulunamadı.
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-5">
                    Analitik verisi POS uygulamasından bir oturum senkronize edildiğinde burada görünür.
                  </p>
                  <ol className="text-left inline-flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 font-black text-indigo-500 dark:text-indigo-400">1.</span>
                      <span><span className="font-semibold text-black dark:text-white">Hesap oluşturun</span> — Hesap Yönetimi sayfasında bir POS satış noktası hesabı ekleyin ve giriş bilgilerini kasa operatörüne iletin.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 font-black text-indigo-500 dark:text-indigo-400">2.</span>
                      <span><span className="font-semibold text-black dark:text-white">POS&apos;ta giriş yapın</span> — Kasa operatörü POS uygulamasında Senkronizasyon ekranına gidip oluşturulan hesapla oturum açar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 font-black text-indigo-500 dark:text-indigo-400">3.</span>
                      <span><span className="font-semibold text-black dark:text-white">Oturumu senkronize edin</span> — Kermes bitiminde satış verileri buluta yüklenir; buradan otomatik olarak görünür hale gelir.</span>
                    </li>
                  </ol>
                  <a
                    href="/management"
                    className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    Hesap Yönetimine Git
                  </a>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                  Analizleri görüntülemek için sağ üstten bir satış noktası seçin.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8">

              {/* KPI Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50/20 to-blue-100/10 dark:from-neutral-900 dark:to-neutral-950 p-5 rounded-2xl border border-blue-500/10 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Toplam Hasılat</p>
                      <h2 className="text-2xl font-black mt-2 text-blue-600 dark:text-blue-400 tracking-tight">
                        €{aggregates.revenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                      <TrendingUpIcon className="!h-4 !w-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50/20 to-green-100/10 dark:from-neutral-900 dark:to-neutral-950 p-5 rounded-2xl border border-green-500/10 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Sipariş Sayısı</p>
                      <h2 className="text-2xl font-black mt-2 text-green-600 dark:text-green-400 tracking-tight">{aggregates.orders}</h2>
                    </div>
                    <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                      <ShowChartIcon className="!h-4 !w-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50/20 to-purple-100/10 dark:from-neutral-900 dark:to-neutral-950 p-5 rounded-2xl border border-purple-500/10 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Ort. Sepet Tutarı</p>
                      <h2 className="text-2xl font-black mt-2 text-purple-600 dark:text-purple-400 tracking-tight">
                        €{(aggregates.orders > 0 ? aggregates.revenue / aggregates.orders : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                      <BarChartIcon className="!h-4 !w-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50/20 to-orange-100/10 dark:from-neutral-900 dark:to-neutral-950 p-5 rounded-2xl border border-orange-500/10 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Satılan Ürün</p>
                      <h2 className="text-2xl font-black mt-2 text-orange-600 dark:text-orange-400 tracking-tight">{aggregates.items}</h2>
                    </div>
                    <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                      <PieChartIcon className="!h-4 !w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Categories + Payment Methods */}
                <div className="bg-gray-50 dark:bg-neutral-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-neutral-800 flex flex-col gap-5">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Kategori Dağılımı</h3>
                  <div className="flex flex-col gap-3">
                    {Object.entries(aggregates.categories).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Oturum kaydı bulunamadı.</p>
                    ) : (
                      Object.entries(aggregates.categories).map(([cat, val]) => {
                        const percent = aggregates.revenue > 0 ? (val.revenue / aggregates.revenue) * 100 : 0;
                        const catColor = cat === "food" ? "bg-blue-500" : cat === "drink" ? "bg-cyan-500" : cat === "dessert" ? "bg-pink-500" : "bg-gray-500";
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-black dark:text-white">
                              <span className="capitalize">{cat}</span>
                              <span>€{val.revenue.toFixed(2)} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                              <div className={`${catColor} h-full rounded-full`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <hr className="border-gray-200/60 dark:border-neutral-800" />
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Ödeme Yöntemleri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-gray-100 dark:border-neutral-800 text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Nakit</p>
                      <p className="text-base font-black text-green-600 dark:text-green-400 mt-1">€{aggregates.payments.cash.revenue.toFixed(2)}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{aggregates.payments.cash.count} sipariş</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-gray-100 dark:border-neutral-800 text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Kart</p>
                      <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">€{aggregates.payments.card.revenue.toFixed(2)}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{aggregates.payments.card.count} sipariş</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Timeline Chart */}
                <div className="bg-gray-50 dark:bg-neutral-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-neutral-800 flex flex-col gap-5">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                      {selectedAnalyticsSessionId === "all" 
                        ? "Oturum Bazlı Zaman Akışı (Günlük Trend)" 
                        : "Saatlik Hasılat Akışı (Gün İçi Trend)"}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedAnalyticsSessionId !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnalyticsSessionId("all");
                            localStorage.removeItem("analytics_selected_session");
                          }}
                          className="text-[10px] bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-black dark:text-white px-2 py-0.5 rounded font-bold transition cursor-pointer"
                        >
                          ← Tüm Oturumlara Dön
                        </button>
                      )}
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                        {selectedAnalyticsSessionId === "all" ? "Günlük" : "Saatlik"}
                      </span>
                    </div>
                  </div>

                  {selectedAnalyticsSessionId === "all" ? (
                    filteredSessions.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center min-h-[160px]">
                        <p className="text-xs text-gray-400 italic">Zaman serisi verisi bulunamadı.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-end gap-3 min-h-[160px]">
                        <div className="flex justify-between items-end h-40 px-2 gap-2 overflow-x-auto scrollbar-thin">
                          {(() => {
                            const chronologicalSessions = [...filteredSessions].sort(
                              (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                            );
                            const maxRevenue = Math.max(...chronologicalSessions.map(s => s.totalRevenue), 1);
                            return chronologicalSessions.map(session => {
                              const heightPercent = (session.totalRevenue / maxRevenue) * 100;
                              const label = new Date(session.startDate).toLocaleDateString("de-DE", { 
                                day: "2-digit", 
                                month: "2-digit" 
                              });
                              return (
                                <div key={session.id} className="flex-1 min-w-[32px] flex flex-col items-center gap-1.5 h-full justify-end group">
                                  <div className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white rounded px-1.5 py-0.5 pointer-events-none mb-0.5 whitespace-nowrap z-10">
                                    €{session.totalRevenue.toFixed(0)}
                                  </div>
                                  <div
                                    onClick={() => {
                                      setSelectedAnalyticsSessionId(session.id);
                                      localStorage.setItem("analytics_selected_session", session.id);
                                    }}
                                    className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all cursor-pointer shadow-sm hover:scale-x-105"
                                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                    title={`${session.name} — €${session.totalRevenue.toFixed(2)} (${session.totalOrders} sipariş)`}
                                  />
                                  <span className="text-[8px] text-gray-400 font-extrabold">{label}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )
                  ) : (
                    Object.keys(aggregates.hourly).length === 0 ? (
                      <div className="flex-1 flex items-center justify-center min-h-[160px]">
                        <p className="text-xs text-gray-400 italic">Saatlik veri bulunamadı.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-end gap-3 min-h-[160px]">
                        <div className="flex justify-between items-end h-40 px-2 gap-2">
                          {(() => {
                            const sortedHours = Object.keys(aggregates.hourly).sort();
                            const maxRevenue = Math.max(...Object.values(aggregates.hourly).map(h => h.revenue), 1);
                            return sortedHours.map(hour => {
                              const val = aggregates.hourly[hour];
                              const heightPercent = (val.revenue / maxRevenue) * 100;
                              return (
                                <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                  <div className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white rounded px-1 py-0.5 pointer-events-none mb-0.5 z-10">
                                    €{val.revenue.toFixed(0)}
                                  </div>
                                  <div
                                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm hover:bg-blue-600 dark:hover:bg-blue-500 transition-all cursor-pointer shadow-sm"
                                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                    title={`${hour} — €${val.revenue.toFixed(2)} (${val.orders} sipariş)`}
                                  />
                                  <span className="text-[8px] text-gray-400 font-semibold">{hour}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Product Leaderboard */}
                <div className="bg-gray-50 dark:bg-neutral-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-neutral-800 flex flex-col gap-5">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">En Çok Satan Ürünler</h3>
                  <div className="flex flex-col gap-2.5 flex-1 justify-center">
                    {aggregates.products.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Satış kaydı bulunamadı.</p>
                    ) : (
                      aggregates.products.map((prod, idx) => (
                        <div key={prod.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-950 rounded-xl border border-gray-100 dark:border-neutral-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-400 w-4">#{idx + 1}</span>
                            <div>
                              <p className="text-xs font-extrabold text-black dark:text-white leading-tight">{prod.name}</p>
                              <p className="text-[9px] text-gray-400">{prod.count} porsiyon</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">€{prod.revenue.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sessions + Lazy-Loaded Audit Logs */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">Satış Noktaları & Oturumlar</h3>
                {filteredSessions.length === 0 ? (
                  <div className="p-4 bg-blue-50/30 dark:bg-neutral-900/30 border border-blue-200/20 rounded-xl text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      Bu satış noktası için henüz senkronize edilmiş oturum bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => {
                      const isExpanded = expandedSessionId === session.id;
                      return (
                        <div key={session.id} className="bg-gray-50 dark:bg-neutral-900/40 rounded-2xl border border-gray-200/50 dark:border-neutral-800 overflow-hidden transition-all">
                          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-black dark:text-white capitalize">{session.name}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  session.status === "completed"
                                    ? "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300"
                                    : session.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                    : session.status === "locked"
                                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                                }`}>
                                  {session.status === "active" ? "Aktif" :
                                   session.status === "paused" ? "Duraklatıldı" :
                                   session.status === "completed" ? "Tamamlandı" :
                                   session.status === "locked" ? "Kilitli" : session.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {session.syncedBy} • Yükleme: {new Date(session.syncedAt).toLocaleDateString("de-DE")} {new Date(session.syncedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Hasılat</p>
                                <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">€{session.totalRevenue.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Sipariş</p>
                                <p className="text-sm font-black text-black dark:text-white mt-1">{session.totalOrders}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Complete Button (visible only if NOT completed and NOT locked) */}
                                {session.status !== "completed" && session.status !== "locked" && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`"${session.name}" oturumunu kalıcı olarak tamamlamak istediğinize emin misiniz? Bu işlem geri alınamaz ve oturuma daha fazla veri yüklenemez.`)) {
                                        try {
                                          await setDoc(doc(db, "sessions", session.id), { status: "completed" }, { merge: true });
                                        } catch (err) {
                                          console.error("Session complete failed:", err);
                                          alert("Oturum tamamlanamadı.");
                                        }
                                      }
                                    }}
                                    className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl transition flex items-center justify-center"
                                    title="Oturumu Tamamla (Kalıcı)"
                                  >
                                    <CheckCircleIcon className="!h-4 !w-4" />
                                  </button>
                                )}

                                {/* Lock/Unlock Toggle Button (visible only if NOT completed) */}
                                {session.status !== "completed" && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextStatus = session.status === "locked" ? "active" : "locked";
                                      const actionWord = nextStatus === "locked" ? "kilitlemek" : "kilit açmak";
                                      if (window.confirm(`"${session.name}" oturumunu ${actionWord} istediğinize emin misiniz?`)) {
                                        try {
                                          await setDoc(doc(db, "sessions", session.id), { status: nextStatus }, { merge: true });
                                        } catch (err) {
                                          console.error("Session lock toggle failed:", err);
                                          alert("Oturum durumu güncellenemedi.");
                                        }
                                      }
                                    }}
                                    className={`p-2 rounded-xl transition flex items-center justify-center ${
                                      session.status === "locked"
                                        ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                        : "text-neutral-500 hover:text-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    }`}
                                    title={session.status === "locked" ? "Oturum Kilidini Aç" : "Oturumu Kilitle"}
                                  >
                                    {session.status === "locked" ? <LockOpenIcon className="!h-4 !w-4" /> : <LockIcon className="!h-4 !w-4" />}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                  className="text-xs bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 hover:border-blue-500 hover:text-blue-500 text-black dark:text-white font-bold px-3 py-1.5 rounded-xl transition"
                                >
                                  {isExpanded ? "Logları Gizle" : "Logları İncele"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(session.id, session.name)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                                  title="Oturumu ve tüm satış loglarını buluttan sil"
                                >
                                  <DeleteIcon className="!h-4 !w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200/50 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950">
                              <h5 className="text-[10px] uppercase font-extrabold text-gray-400 mb-3 tracking-wider">İşlem Detay Logları</h5>
                              {txLoading ? (
                                <div className="py-8 text-center flex flex-col items-center justify-center">
                                  <span className="inline-block w-5 h-5 border-2 border-t-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></span>
                                  <p className="text-xs text-gray-400 mt-2 font-semibold">İşlemler yükleniyor...</p>
                                </div>
                              ) : expandedTransactions.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-4 text-center">Bu oturumda kaydedilmiş işlem detayı bulunmuyor.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-neutral-800">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200/50 dark:border-neutral-800 text-[9px] uppercase font-bold text-gray-400">
                                        <th className="p-3 w-28">Saat</th>
                                        <th className="p-3 w-24">Ödeme</th>
                                        <th className="p-3">Sipariş İçeriği</th>
                                        <th className="p-3 text-right w-24">Tutar</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-850 text-xs text-black dark:text-white">
                                      {expandedTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900 transition">
                                          <td className="p-3 font-medium">
                                            {new Date(tx.transactionDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                          </td>
                                          <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${tx.paymentMethod === "card" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"}`}>
                                              {tx.paymentMethod}
                                            </span>
                                          </td>
                                          <td className="p-3 text-gray-500 dark:text-gray-400 font-mono">
                                            {tx.items ? tx.items.map(it => `${it.name} (${it.quantity}x)`).join(", ") : "Eksik içerik"}
                                          </td>
                                          <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                                            €{tx.totalAmount.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Sales Feed */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">Son Satışlar (Canlı Akış — Max 10)</h3>
                {liveSalesFeed.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Bulut üzerinde kayıtlı işlem bulunmamaktadır.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveSalesFeed.map((sale) => (
                      <div key={sale.id} className="bg-gray-50 dark:bg-neutral-900/30 p-4 rounded-xl border border-gray-200/50 dark:border-neutral-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-black dark:text-white font-mono break-all leading-tight">
                            {sale.items ? sale.items.map(it => `${it.name} (${it.quantity}x)`).join(", ") : "Eksik içerik"}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1.5 font-semibold">
                            {new Date(sale.transactionDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} • {sale.paymentMethod === "card" ? "Kart" : "Nakit"}
                          </p>
                        </div>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 ml-4 shrink-0">€{sale.totalAmount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
