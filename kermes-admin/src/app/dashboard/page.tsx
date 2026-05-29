"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import KermesLoading from "../../components/KermesLoading";
import KermesAppBar from "../../components/KermesAppBar";

type KermesRecord = {
  id: string;
  name: string;
  assetFolder: string;
  currency: "EUR" | "USD" | "TRY";
  festivalImage: string;
  menuImage: string;
  ikramImage: string;
  aboutImage: string;
  aboutTitle: string;
  aboutMarkdown: string;
  aboutText?: string;
  sponsorImages: string[];
  active: boolean;
  onlineOrderingEnabled: boolean;
  bankName?: string;
  bankIban?: string;
  bankReference?: string;
  paypalLink?: string;
  enabledSections?: {
    festival?: boolean;
    order?: boolean;
    menu?: boolean;
    about?: boolean;
    sponsor?: boolean;
    ikram?: boolean;
    yurtlar?: boolean;
    contact?: boolean;
  };
};

type FolderCatalogEntry = {
  id: string;
  label: string;
  assetFolder: string;
  sponsorImages: string[];
  availableImages?: string[];
};

const TEMPLATE_FOLDER: FolderCatalogEntry = {
  id: "template-basic",
  label: "template-basic",
  assetFolder: "/kermeses/template-basic",
  sponsorImages: [
    "/kermeses/template-basic/sponsor/01.svg",
    "/kermeses/template-basic/sponsor/02.svg",
    "/kermeses/template-basic/sponsor/03.svg",
  ],
};

const DEFAULT_ABOUT_TITLE = "Geleneksel Mıntıka Kermesimiz Başlıyor!";
const DEFAULT_ABOUT_MARKDOWN = `:::center
### **Gönülleri Birleştiren Kermesimize Hoş Geldiniz!**
:::

Büyük bir heyecan, birlik ve coşkuyla düzenlediğimiz kermesimiz; bu sefer de gönüllerimizi birleştirmek, bereketli sofralarda buluşmak ve hayırlı bir amaca katkı sağlamak üzere kapılarını açıyor!

:::center
📍 **Kermes Adresimiz:**

**[Address Line 1],**
**[Address Line 2]**
[Google Haritalar Yol Tarifi için Tıklayın](https://www.google.com/maps/place/)
:::

---
:::center
### Birbirinden Leziz Tatlar & İkramlar
:::
Kermesimiz süresince özenle hazırlanan zengin el emeği lezzetler sizleri bekliyor:
* **Geleneksel ev yemekleri** ve sıcacık gözlemeler,
* **Tandır, döner ve enfes ızgara çeşitleri**,
* **Ev yapımı şerbetler**, tatlılar ve taze çay/kahve ikramları.

---
:::center
### Bu Kermesin Geliri Nereye Gidiyor?
:::
Kermesimizden elde edilecek tüm hayır gelirleri, gençlerimizin ilim, güzel ahlak ve kardeşlik bilinciyle yetişeceği yurt ve eğitim faaliyetlerine bağışlanacaktır.

> *"Bir hayra vesile olan, onu yapan gibidir."* (Hadis-i Şerif)

Gençlerimizin daha iyi imkanlarda yetişmesi için yapacağınız her yardım ve ziyaret, hayır dualarımızda yer alacaktır. Destek sizden, bereket Allah'tan!

:::center
### 📢 Tüm Aileleri ve Gönül Dostlarını Bekliyoruz!
Kardeşliğimizi pekiştirmek ve soframıza bereket katmak için ailenizle, dostlarınızla birlikte hepinizi bekliyoruz!
:::`;

function slugifyKermesId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseImageList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueKermesId(baseId: string, existingIds: string[]) {
  if (!existingIds.includes(baseId)) return baseId;
  let counter = 2;
  while (existingIds.includes(`${baseId}-${counter}`)) counter += 1;
  return `${baseId}-${counter}`;
}

function stripLegacyContent(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [kermeses, setKermeses] = useState<KermesRecord[]>([]);
  const [folderCatalog, setFolderCatalog] = useState<FolderCatalogEntry[]>([TEMPLATE_FOLDER]);
  const [selectedKermesId, setSelectedKermesId] = useState("");
  const [draft, setDraft] = useState<KermesRecord | null>(null);
  const [newKermesName, setNewKermesName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(TEMPLATE_FOLDER.id);
  const [newKermesSponsorImages, setNewKermesSponsorImages] = useState<string[]>([...TEMPLATE_FOLDER.sponsorImages]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAllFiles, setShowAllFiles] = useState<Record<string, boolean>>({});

  const [adminRole, setAdminRole] = useState<"super_admin" | "tenant_admin">("tenant_admin");
  const [adminTenantId, setAdminTenantId] = useState<string>("");

  // Auth check
  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      setIsAuth(true);
      const storedRole = sessionStorage.getItem("adminRole");
      setAdminRole(storedRole === "super_admin" ? "super_admin" : "tenant_admin");
      setAdminTenantId(sessionStorage.getItem("adminTenantId") || "");
    } else {
      router.replace("/");
    }
  }, [router]);

  // Kermeses subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "kermeses"), (snapshot) => {
      const records = snapshot.docs.map((entry) => {
        const data = entry.data() as Partial<KermesRecord>;
        const currency: KermesRecord["currency"] = data.currency === "USD" || data.currency === "TRY" ? data.currency : "EUR";
        return {
          id: entry.id,
          name: data.name ?? entry.id,
          assetFolder: data.assetFolder ?? `/kermeses/${entry.id}`,
          currency,
          festivalImage: data.festivalImage ?? "",
          menuImage: data.menuImage ?? "",
          ikramImage: data.ikramImage ?? "",
          aboutImage: data.aboutImage ?? "",
          aboutTitle: data.aboutTitle ?? "",
          aboutMarkdown: data.aboutMarkdown ?? stripLegacyContent(data.aboutText ?? ""),
          sponsorImages: Array.isArray(data.sponsorImages) ? data.sponsorImages : [],
          active: data.active !== false,
          onlineOrderingEnabled: data.onlineOrderingEnabled !== false,
          bankName: data.bankName ?? "",
          bankIban: data.bankIban ?? "",
          bankReference: data.bankReference ?? "",
          paypalLink: data.paypalLink ?? "",
          enabledSections: data.enabledSections ?? {},
        };
      });
      setKermeses(records);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const displayKermeses = useMemo(() => {
    return adminRole === "super_admin"
      ? kermeses
      : kermeses.filter((k) => k.id === adminTenantId);
  }, [kermeses, adminRole, adminTenantId]);

  // Folder catalog subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "kermesFolders"), (snapshot) => {
      const records = snapshot.docs.map((entry) => {
        const data = entry.data() as Partial<FolderCatalogEntry>;
        return {
          id: entry.id,
          label: data.label ?? entry.id,
          assetFolder: data.assetFolder ?? `/kermeses/${entry.id}`,
          sponsorImages: Array.isArray(data.sponsorImages) ? data.sponsorImages : [],
          availableImages: Array.isArray(data.availableImages) ? data.availableImages : [],
        };
      });

      const customFolders = records.filter((item) => item.id !== TEMPLATE_FOLDER.id);
      customFolders.sort((a, b) => a.id.localeCompare(b.id));

      const catalog = [...customFolders, TEMPLATE_FOLDER];
      setFolderCatalog(catalog);

      if (customFolders.length > 0) {
        const latestFolder = customFolders[customFolders.length - 1];
        setSelectedFolderId(latestFolder.id);
        setNewKermesSponsorImages(
          latestFolder.sponsorImages.length > 0 ? [...latestFolder.sponsorImages] : [...TEMPLATE_FOLDER.sponsorImages]
        );
      } else {
        setSelectedFolderId(TEMPLATE_FOLDER.id);
        setNewKermesSponsorImages([...TEMPLATE_FOLDER.sponsorImages]);
      }
    });
    return () => unsubscribe();
  }, []);

  const createFlowFolder = useMemo(
    () => folderCatalog.find((entry) => entry.id === selectedFolderId) ?? TEMPLATE_FOLDER,
    [folderCatalog, selectedFolderId]
  );

  const createFlowSponsorChoices =
    createFlowFolder.sponsorImages.length > 0 ? createFlowFolder.sponsorImages : TEMPLATE_FOLDER.sponsorImages;

  const selectedRecord = useMemo(() => {
    return draft ?? kermeses.find((item) => item.id === (adminRole === "tenant_admin" ? adminTenantId : selectedKermesId)) ?? null;
  }, [draft, kermeses, selectedKermesId, adminRole, adminTenantId]);

  const isDirty = useMemo(() => {
    if (!draft) return false;
    const original = kermeses.find((item) => item.id === selectedKermesId);
    if (!original) return false;
    
    return (
      draft.name !== original.name ||
      draft.assetFolder !== original.assetFolder ||
      draft.currency !== original.currency ||
      draft.festivalImage !== original.festivalImage ||
      draft.menuImage !== original.menuImage ||
      draft.ikramImage !== original.ikramImage ||
      draft.aboutImage !== original.aboutImage ||
      draft.aboutTitle !== original.aboutTitle ||
      draft.aboutMarkdown !== original.aboutMarkdown ||
      draft.active !== original.active ||
      draft.onlineOrderingEnabled !== original.onlineOrderingEnabled ||
      draft.bankName !== original.bankName ||
      draft.bankIban !== original.bankIban ||
      draft.bankReference !== original.bankReference ||
      draft.paypalLink !== original.paypalLink ||
      JSON.stringify(draft.sponsorImages) !== JSON.stringify(original.sponsorImages) ||
      JSON.stringify(draft.enabledSections) !== JSON.stringify(original.enabledSections)
    );
  }, [draft, kermeses, selectedKermesId]);

  const editFlowFolder = useMemo(() => {
    if (!selectedRecord) return TEMPLATE_FOLDER;
    return folderCatalog.find((entry) => entry.assetFolder === selectedRecord.assetFolder) ?? TEMPLATE_FOLDER;
  }, [folderCatalog, selectedRecord]);

  const editFlowSponsorChoices =
    editFlowFolder.sponsorImages.length > 0 ? editFlowFolder.sponsorImages : TEMPLATE_FOLDER.sponsorImages;

  useEffect(() => {
    setNewKermesSponsorImages((prev) => {
      const sanitized = prev.filter((item) => createFlowSponsorChoices.includes(item));
      return sanitized.length > 0 ? sanitized : [];
    });
  }, [createFlowSponsorChoices]);

  useEffect(() => {
    if (adminRole === "tenant_admin" && adminTenantId) {
      if (selectedKermesId !== adminTenantId) {
        setSelectedKermesId(adminTenantId);
      }
      const nextDraft = kermeses.find((item) => item.id === adminTenantId) ?? null;
      setDraft(nextDraft);
    } else {
      const nextSelectedId = selectedKermesId || kermeses[0]?.id || "";
      if (!nextSelectedId) { setDraft(null); return; }
      if (nextSelectedId !== selectedKermesId) { setSelectedKermesId(nextSelectedId); return; }
      const nextDraft = kermeses.find((item) => item.id === nextSelectedId) ?? null;
      setDraft(nextDraft);
    }
  }, [kermeses, selectedKermesId, adminRole, adminTenantId]);

  async function handleCreateKermes() {
    if (isDirty) {
      if (!window.confirm("Kaydedilmemiş değişiklikleriniz var. Değişiklikleri kaydetmeden yeni kermes oluşturmak istediğinize emin misiniz?")) {
        return;
      }
    }
    const baseId = slugifyKermesId(newKermesName);
    if (!baseId) { setMessage("Kermes adı gerekli."); return; }

    setSaving(true);
    setMessage("");
    try {
      const existingIds = kermeses.map((item) => item.id);
      const kermesId = uniqueKermesId(baseId, existingIds);
      const selectedFolder = createFlowFolder;
      const assetFolder = selectedFolder.assetFolder || `/kermeses/${kermesId}`;
      const availableImages = selectedFolder.availableImages || [];

      const findAssetFiles = (prefix: string) => {
        const matches = availableImages.filter((img: string) => {
          const filename = img.split('/').pop()?.toLowerCase() || '';
          return (
            filename.startsWith(prefix + ".") ||
            filename.startsWith(prefix + "-") ||
            filename.startsWith(prefix + "_") ||
            filename === prefix
          );
        });
        return matches.length > 0 ? matches.join(", ") : "";
      };

      const newRecord: KermesRecord = {
        id: kermesId,
        name: newKermesName.trim(),
        assetFolder,
        festivalImage: findAssetFiles("festival"),
        menuImage: findAssetFiles("menu"),
        ikramImage: findAssetFiles("ikram"),
        aboutImage: findAssetFiles("about"),
        aboutTitle: DEFAULT_ABOUT_TITLE,
        aboutMarkdown: DEFAULT_ABOUT_MARKDOWN,
        currency: "EUR",
        sponsorImages: newKermesSponsorImages,
        active: true,
        onlineOrderingEnabled: true,
        bankName: "",
        bankIban: "",
        bankReference: "",
        paypalLink: "",
      };

      await setDoc(doc(db, "kermeses", kermesId), newRecord);
      setNewKermesName("");
      setSelectedFolderId(selectedFolder.id);
      setNewKermesSponsorImages([]);
      setSelectedKermesId(kermesId);
      setDraft(newRecord);
      setMessage(`Yeni kermes oluşturuldu: ${kermesId}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSelectedKermes() {
    if (!selectedRecord) { setMessage("Düzenlenecek kermes seçin."); return; }
    setSaving(true);
    setMessage("");
    try {
      await setDoc(doc(db, "kermeses", selectedRecord.id), selectedRecord);
      setMessage("Kermes içeriği kaydedildi.");
    } finally {
      setSaving(false);
    }
  }

  function handleRevert() {
    if (!selectedKermesId) return;
    const original = kermeses.find((item) => item.id === selectedKermesId);
    if (original) {
      setDraft({ ...original });
      setMessage("Değişiklikler geri alındı.");
    }
  }

  async function handleDeleteSelectedKermes() {
    if (!selectedRecord) return;
    const kermesId = selectedRecord.id;
    if (!window.confirm(`"${selectedRecord.name}" (${kermesId}) kermesini silmek istediğinize emin misiniz? Bu işlem kalıcıdır ve kermesle ilişkili tüm içerikleri silecektir.`)) {
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, "kermeses", kermesId));



      // 3. Clear local editor state
      setSelectedKermesId("");
      setDraft(null);
      setMessage("Kermes başarıyla silindi.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      setMessage(`Silme hatası: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSelectedKermesActive() {
    if (!selectedRecord) return;
    const nextActive = !selectedRecord.active;
    updateSelectedRecord("active", nextActive);
    try {
      await setDoc(doc(db, "kermeses", selectedRecord.id), {
        ...selectedRecord,
        active: nextActive
      });
    } catch (err) {
      console.error("Error toggling kermes active:", err);
    }
  }

  async function handleToggleSelectedKermesOnlineOrdering() {
    if (!selectedRecord) return;
    const nextVal = !selectedRecord.onlineOrderingEnabled;
    updateSelectedRecord("onlineOrderingEnabled", nextVal);
    try {
      await setDoc(doc(db, "kermeses", selectedRecord.id), {
        ...selectedRecord,
        onlineOrderingEnabled: nextVal
      });
    } catch (err) {
      console.error("Error toggling kermes online ordering:", err);
    }
  }

  function updateSelectedRecord(field: keyof KermesRecord, value: string | boolean | string[]) {
    if (!selectedRecord) return;
    const nextDraft: KermesRecord = {
      ...selectedRecord,
      [field]: field === "sponsorImages" && typeof value === "string" ? parseImageList(value) : value,
    } as KermesRecord;
    setDraft(nextDraft);
  }

  function toggleEnabledSection(sectionKey: string) {
    if (!selectedRecord) return;
    const currentSections = draft?.enabledSections ?? selectedRecord.enabledSections ?? {};
    const nextSections = {
      ...currentSections,
      [sectionKey]: currentSections[sectionKey as keyof typeof currentSections] === false ? true : false,
    };
    
    setDraft({
      ...selectedRecord,
      ...draft,
      enabledSections: nextSections,
    } as KermesRecord);
  }

  const renderFileSelector = (field: "festivalImage" | "menuImage" | "ikramImage" | "aboutImage") => {
    if (!selectedRecord) return null;
    const currentValue = (draft?.[field] ?? selectedRecord[field] ?? "") as string;
    const selectedList = currentValue.split(',').map(s => s.trim()).filter(Boolean);
    const folderImages = editFlowFolder.availableImages || [];
    const allOptions = Array.from(new Set([...folderImages, ...selectedList]));
    if (allOptions.length === 0) return null;

    const isShowingAll = showAllFiles[field] ?? false;
    const prefix = field.replace("Image", "").toLowerCase();
    const displayOptions = isShowingAll
      ? allOptions
      : allOptions.filter((imagePath) => {
          const filename = imagePath.split('/').pop()?.toLowerCase() || '';
          return (
            selectedList.includes(imagePath) ||
            filename.includes(prefix) ||
            (prefix === "about" && filename.includes("hakkimizda"))
          );
        });

    const toggleFile = (imagePath: string) => {
      const nextList = selectedList.includes(imagePath)
        ? selectedList.filter(s => s !== imagePath)
        : [...selectedList, imagePath];
      updateSelectedRecord(field, nextList.join(", "));
    };

    const selectAllVisible = () => {
      const nextList = Array.from(new Set([...selectedList, ...displayOptions]));
      updateSelectedRecord(field, nextList.join(", "));
    };

    const deselectAllVisible = () => {
      const nextList = selectedList.filter(s => !displayOptions.includes(s));
      updateSelectedRecord(field, nextList.join(", "));
    };

    return (
      <div className="mt-2 p-2 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-700 max-h-36 overflow-y-auto space-y-1">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Klasördeki dosyalar (Çoklu Seçim):</p>
          <div className="flex items-center gap-2 pr-1">
            <button type="button" onClick={selectAllVisible} className="text-[9px] text-green-600 hover:underline font-semibold">Hepsini seç</button>
            <span className="text-[9px] text-gray-300">|</span>
            <button type="button" onClick={deselectAllVisible} className="text-[9px] text-red-500 hover:underline font-semibold">Temizle</button>
            <span className="text-[9px] text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setShowAllFiles(prev => ({ ...prev, [field]: !isShowingAll }))}
              className="text-[9px] text-blue-600 hover:underline font-semibold"
            >
              {isShowingAll ? "İlgili olanlar" : `Tümünü göster (${allOptions.length})`}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {displayOptions.map((imagePath) => {
            const isSelected = selectedList.includes(imagePath);
            const isMissing = !folderImages.includes(imagePath);
            const filename = imagePath.split('/').pop() || '';
            return (
              <label key={imagePath} className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 p-1 rounded ${isMissing ? 'text-red-500 font-semibold' : 'text-black dark:text-white'}`}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleFile(imagePath)} />
                <span className="font-mono break-all">{filename} {isMissing ? "(dosya bulunamadı)" : ""}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  function toggleSponsorImage(imagePath: string) {
    if (!selectedRecord) return;
    const currentImages = draft?.sponsorImages ?? selectedRecord.sponsorImages;
    const nextImages = currentImages.includes(imagePath)
      ? currentImages.filter((item) => item !== imagePath)
      : [...currentImages, imagePath];
    setDraft({ ...selectedRecord, sponsorImages: nextImages });
  }

  function toggleCreateSponsorImage(imagePath: string) {
    setNewKermesSponsorImages((prev) =>
      prev.includes(imagePath) ? prev.filter((item) => item !== imagePath) : [...prev, imagePath]
    );
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
      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col items-center gap-8 bg-gray-50 dark:bg-neutral-900 ml-20 md:ml-20">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white self-start">
          Yönetim Paneli
        </h1>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-6xl">
          <a
            href="/analytics"
            className="group bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 flex items-center gap-5 border border-transparent hover:border-blue-500/30 hover:shadow-lg transition-all"
          >
            <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-500/20 transition-all">
              <QueryStatsIcon className="!h-8 !w-8" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-black dark:text-white">Satış Analitiği</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                Oturum bazlı satış verileri, gelir grafikleri ve ürün sıralamaları
              </p>
            </div>
          </a>

          {adminRole === "super_admin" && (
            <a
              href="/management"
              className="group bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 flex items-center gap-5 border border-transparent hover:border-indigo-500/30 hover:shadow-lg transition-all"
            >
              <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-500/20 transition-all">
                <ManageAccountsIcon className="!h-8 !w-8" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-black dark:text-white">Hesap Yönetimi</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  POS cihazlarına ait satış noktası hesaplarını oluşturun ve yönetin
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Config Cards Grid */}
        {adminRole === "super_admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
            {/* Settings Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 relative">
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-white flex items-center justify-between">
                Kermes Ayarları
              </h2>
              {selectedRecord ? (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Seçili Konum: <span className="font-extrabold text-blue-600 dark:text-blue-400">{selectedRecord.name}</span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700">
                    <span className="text-sm font-semibold text-black dark:text-white">Kermesi Yayına Al (Aktif)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRecord.active !== false}
                        onChange={handleToggleSelectedKermesActive}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-all"></div>
                      <div className="absolute left-1 top-1 bg-white dark:bg-neutral-900 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-black dark:text-white">Online Sipariş Sistemi Aktif</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRecord.onlineOrderingEnabled !== false}
                        onChange={handleToggleSelectedKermesOnlineOrdering}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-all"></div>
                      <div className="absolute left-1 top-1 bg-white dark:bg-neutral-900 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ayarlarını yönetmek için soldan veya aşağıdan bir kermes seçin.
                </p>
              )}
            </div>

            {/* Create Kermes Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center justify-center">
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-white self-start">
                Yeni kermes oluştur
              </h2>
              <input
                value={newKermesName}
                onChange={(event) => setNewKermesName(event.target.value)}
                placeholder="Kermes adı"
                className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-black dark:text-white"
              />
              <select
                value={selectedFolderId}
                onChange={(event) => setSelectedFolderId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-black dark:text-white"
              >
                {folderCatalog.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.label} ({folder.assetFolder})
                  </option>
                ))}
              </select>
              <div className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 p-3">
                <p className="text-sm font-medium text-black dark:text-white mb-2">
                  Yeni kermes sponsor secimi ({createFlowFolder.label})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {createFlowSponsorChoices.map((imagePath) => (
                    <label key={imagePath} className="flex items-center gap-2 text-xs text-black dark:text-white">
                      <input
                        type="checkbox"
                        checked={newKermesSponsorImages.includes(imagePath)}
                        onChange={() => toggleCreateSponsorImage(imagePath)}
                      />
                      <span className="font-mono break-all">{imagePath}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateKermes}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Kermesi oluştur ve aktif et"}
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 self-start">
                Kermes klasörleri Firestore&apos;daki <span className="font-mono">kermesFolders</span> koleksiyonundan gelir.
              </p>
            </div>
          </div>
        )}



        {/* Kermes Content Editor */}
        <div className="w-full max-w-6xl bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold text-black dark:text-white">Kermes içerikleri</h2>
            {message ? <span className="text-sm text-blue-600 dark:text-blue-400">{message}</span> : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kermes List */}
            <div className="space-y-3">
              {displayKermeses.map((item) => {
                const isSelected = selectedKermesId === item.id;
                const isKermesActive = item.active !== false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isDirty) {
                        if (!window.confirm("Kaydedilmemiş değişiklikleriniz var. Değişiklikleri kaydetmeden başka bir kermese geçmek istediğinize emin misiniz?")) {
                          return;
                        }
                      }
                      setSelectedKermesId(item.id);
                    }}
                    className={`w-full text-left rounded-xl border p-4 transition ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-300'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-black dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.id}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.assetFolder}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isKermesActive ? 'bg-green-600 text-white' : 'bg-neutral-400 dark:bg-neutral-600 text-white'}`}>
                        {isKermesActive ? 'Yayında' : 'Kapalı'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kermes Editor */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                  Seçili kermes düzenle
                  {isDirty && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Kaydedilmedi
                    </span>
                  )}
                </h3>
              </div>

              {selectedRecord ? (
                <div className="space-y-3">
                  {/* Dynamic tenant toggles */}
                  {adminRole !== "super_admin" && (
                    <div className="flex gap-4 py-2 border-b border-gray-200 dark:border-neutral-700 flex-wrap">
                      <label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={draft?.active !== false}
                          onChange={(event) => updateSelectedRecord("active", event.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Kermes Aktif (Menüyü Yayına Al)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={draft?.onlineOrderingEnabled !== false}
                          onChange={(event) => updateSelectedRecord("onlineOrderingEnabled", event.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Online Sipariş Sistemi Aktif</span>
                      </label>
                    </div>
                  )}

                  <label className="block text-sm text-black dark:text-white">
                    Kermes adı
                    <input
                      value={draft?.name ?? selectedRecord.name}
                      onChange={(event) => updateSelectedRecord("name", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                    />
                  </label>
                  <label className="block text-sm text-black dark:text-white">
                    Asset klasörü
                    <select
                      value={draft?.assetFolder ?? selectedRecord.assetFolder}
                      disabled={adminRole !== "super_admin"}
                      onChange={(event) => {
                        if (!selectedRecord) return;
                        const newFolder = event.target.value;
                        
                        // Construct the next draft state atomically
                        const nextDraft: KermesRecord = {
                          ...selectedRecord,
                          assetFolder: newFolder,
                        };
                        
                        const matchedFolder = folderCatalog.find(f => f.assetFolder === newFolder);
                        if (matchedFolder) {
                          const available = matchedFolder.availableImages || [];
                          const findAssetFiles = (prefix: string) => {
                            const matches = available.filter((img: string) => {
                              const filename = img.split('/').pop()?.toLowerCase() || '';
                              return (
                                filename.startsWith(prefix + ".") ||
                                filename.startsWith(prefix + "-") ||
                                filename.startsWith(prefix + "_") ||
                                filename === prefix
                              );
                            });
                            return matches.length > 0 ? matches.join(", ") : "";
                          };
                          nextDraft.festivalImage = findAssetFiles("festival");
                          nextDraft.menuImage = findAssetFiles("menu");
                          nextDraft.ikramImage = findAssetFiles("ikram");
                          nextDraft.aboutImage = findAssetFiles("about");
                          if (matchedFolder.sponsorImages.length > 0) {
                            nextDraft.sponsorImages = matchedFolder.sponsorImages;
                          }
                        }
                        
                        // Commit to React state exactly once
                        setDraft(nextDraft);
                      }}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-black dark:text-white ${adminRole === "super_admin" ? "border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 cursor-pointer" : "border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"}`}
                    >
                      {folderCatalog.map((folder) => (
                        <option key={folder.id} value={folder.assetFolder}>
                          {folder.label} ({folder.assetFolder})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-black dark:text-white">
                    Para birimi
                    <select
                      value={draft?.currency ?? selectedRecord.currency}
                      onChange={(event) => updateSelectedRecord("currency", event.target.value as KermesRecord["currency"])}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                    >
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dollar ($)</option>
                      <option value="TRY">Lira (₺)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      POS ve menü bu değeri Firestore’dan takip eder.
                    </p>
                  </label>

                  {/* Active Menu Cards Toggles */}
                  <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-gray-250 dark:border-neutral-700/80 space-y-2.5">
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block">
                      Aktif Menü Kartları / Sayfalar
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "festival", label: "Kermesimiz (Festival)" },
                        { key: "order", label: "Online Ön Sipariş" },
                        { key: "menu", label: "Menü" },
                        { key: "about", label: "Hakkımızda" },
                        { key: "sponsor", label: "Sponsorlarımız" },
                        { key: "ikram", label: "Talebeleye İkram" },
                        { key: "yurtlar", label: "Yurt Tanıtımı" },
                        { key: "contact", label: "İletişim" },
                      ].map((sec) => {
                        const isEnabled = (draft?.enabledSections?.[sec.key as keyof typeof draft.enabledSections] ?? selectedRecord.enabledSections?.[sec.key as keyof typeof selectedRecord.enabledSections]) !== false;
                        return (
                          <label key={sec.key} className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleEnabledSection(sec.key)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{sec.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block text-sm text-black dark:text-white">
                    Festival görsel yolu
                    <input
                      value={draft?.festivalImage ?? selectedRecord.festivalImage}
                      onChange={(event) => updateSelectedRecord("festivalImage", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono"
                    />
                    {renderFileSelector("festivalImage")}
                  </label>
                  <label className="block text-sm text-black dark:text-white">
                    Menü görsel yolu
                    <input
                      value={draft?.menuImage ?? selectedRecord.menuImage}
                      onChange={(event) => updateSelectedRecord("menuImage", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono"
                    />
                    {renderFileSelector("menuImage")}
                  </label>
                  <label className="block text-sm text-black dark:text-white">
                    İkram görsel yolu
                    <input
                      value={draft?.ikramImage ?? selectedRecord.ikramImage}
                      onChange={(event) => updateSelectedRecord("ikramImage", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono"
                    />
                    {renderFileSelector("ikramImage")}
                  </label>
                  <label className="block text-sm text-black dark:text-white">
                    Hakkımızda görsel yolu
                    <input
                      value={draft?.aboutImage ?? selectedRecord.aboutImage ?? ""}
                      onChange={(event) => updateSelectedRecord("aboutImage", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono"
                    />
                    {renderFileSelector("aboutImage")}
                  </label>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-black dark:text-white font-medium">Hakkımızda başlığı</label>
                      <button
                        type="button"
                        onClick={() => updateSelectedRecord("aboutTitle", DEFAULT_ABOUT_TITLE)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                        title="Şablon başlığını yükler"
                      >
                        Şablonu yükle
                      </button>
                    </div>
                    <input
                      value={draft?.aboutTitle ?? selectedRecord.aboutTitle}
                      onChange={(event) => updateSelectedRecord("aboutTitle", event.target.value)}
                      placeholder={DEFAULT_ABOUT_TITLE}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-black dark:text-white font-medium">Hakkımızda metni (Markdown destekli)</label>
                      <button
                        type="button"
                        onClick={() => updateSelectedRecord("aboutMarkdown", DEFAULT_ABOUT_MARKDOWN)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                        title="Şablon içeriğini yükler"
                      >
                        Şablonu yükle
                      </button>
                    </div>
                    <textarea
                      value={draft?.aboutMarkdown ?? selectedRecord.aboutMarkdown}
                      onChange={(event) => updateSelectedRecord("aboutMarkdown", event.target.value)}
                      rows={8}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono text-xs"
                    />
                  </div>

                  {/* Payment Info */}
                  <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-700 space-y-3">
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block">Banka &amp; Ödeme Bilgileri</span>
                    <label className="block text-sm text-black dark:text-white">
                      Hesap Sahibi / Kurum Adı
                      <input
                        value={draft?.bankName ?? selectedRecord.bankName ?? ""}
                        onChange={(event) => updateSelectedRecord("bankName", event.target.value)}
                        placeholder="ör. URVE-Regionalverband München e.V."
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                      />
                    </label>
                    <label className="block text-sm text-black dark:text-white">
                      IBAN
                      <input
                        value={draft?.bankIban ?? selectedRecord.bankIban ?? ""}
                        onChange={(event) => updateSelectedRecord("bankIban", event.target.value)}
                        placeholder="ör. DE39 7015 0000 1005 1226 82"
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono"
                      />
                    </label>
                    <label className="block text-sm text-black dark:text-white">
                      Ödeme Açıklaması (Verwendungszweck)
                      <input
                        value={draft?.bankReference ?? selectedRecord.bankReference ?? ""}
                        onChange={(event) => updateSelectedRecord("bankReference", event.target.value)}
                        placeholder="ör. Mitgliedsbeitrag Rosenheim"
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                      />
                    </label>
                    <label className="block text-sm text-black dark:text-white">
                      PayPal Linki
                      <input
                        value={draft?.paypalLink ?? selectedRecord.paypalLink ?? ""}
                        onChange={(event) => updateSelectedRecord("paypalLink", event.target.value)}
                        placeholder="ör. https://www.paypal.me/URVEmuenchen"
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-black dark:text-white font-medium block">Sponsor görselleri</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {editFlowSponsorChoices.map((imagePath) => (
                        <label key={imagePath} className="flex items-center gap-2 text-xs text-black dark:text-white">
                          <input
                            type="checkbox"
                            checked={(draft?.sponsorImages ?? selectedRecord.sponsorImages).includes(imagePath)}
                            onChange={() => toggleSponsorImage(imagePath)}
                          />
                          <span className="font-mono break-all">{imagePath}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSelectedKermes}
                    disabled={saving}
                    className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 disabled:opacity-60"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  {adminRole === "super_admin" && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedKermes}
                      disabled={saving}
                      className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-2 mt-2 disabled:opacity-60 transition-colors duration-200"
                    >
                      {saving ? "Siliniyor..." : "Kermesi Sil"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Soldan bir kermes seçin.</p>
              )}
            </div>
          </div>
        </div>

        {/* Folder Catalog */}
        {adminRole === "super_admin" && (
          <div className="w-full max-w-6xl bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">Klasör kataloğu (otomatik)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bu liste Firestore&apos;daki <span className="font-mono">kermesFolders</span> koleksiyonundan gelir.
              Koleksiyon verisini repodaki <span className="font-mono">kermes-menu/public/kermeses</span> klasöründen senkron scripti doldurur.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Senkron komutu: <span className="font-mono">npm --prefix kermes-admin run sync:kermes-folders</span>
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900">
              <p className="text-sm font-medium text-black dark:text-white mb-2">
                Runtime folder kayitlari (Firestore: kermesFolders)
              </p>
              <div className="space-y-2 max-h-44 overflow-auto">
                {folderCatalog.map((folder) => (
                  <div key={folder.id} className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">{folder.label}</span>
                    <span className="font-mono"> ({folder.assetFolder})</span>
                    <span> - sponsor secenekleri: {folder.sponsorImages.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Floating Banner */}
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl p-4 flex items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Kaydedilmemiş Değişiklikler Var</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">Değişiklikleri kaydetmeyi veya geri almayı seçebilirsiniz.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRevert}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors cursor-pointer"
              >
                Geri Al
              </button>
              <button
                type="button"
                onClick={handleSaveSelectedKermes}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
