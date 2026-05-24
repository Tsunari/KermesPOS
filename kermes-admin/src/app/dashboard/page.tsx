"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import SettingsIcon from "@mui/icons-material/Settings";
import { getDoc } from "firebase/firestore";
import KermesLoading from "../../components/KermesLoading";
import KermesAppBar from "../../components/KermesAppBar";

const SETTINGS_DOC = "settings/main";

type KermesSettings = {
  active: boolean;
  activeKermesId: string;
};

type KermesRecord = {
  id: string;
  name: string;
  assetFolder: string;
  festivalImage: string;
  menuImage: string;
  ikramImage: string;
  aboutImage: string;
  aboutTitle: string;
  aboutMarkdown: string;
  aboutText?: string;
  sponsorImages: string[];
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
  if (!existingIds.includes(baseId)) {
    return baseId;
  }

  let counter = 2;
  while (existingIds.includes(`${baseId}-${counter}`)) {
    counter += 1;
  }

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
  const [settings, setSettings] = useState<KermesSettings>({ active: true, activeKermesId: "" });
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

  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      setIsAuth(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    getDoc(doc(db, SETTINGS_DOC))
      .then((snap) => {
        if (snap.exists())
          setSettings({
            active: snap.data()?.active ?? true,
            activeKermesId: snap.data()?.activeKermesId ?? "",
          });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "kermeses"), (snapshot) => {
      const records = snapshot.docs.map((entry) => {
        const data = entry.data() as Partial<KermesRecord>;

        return {
          id: entry.id,
          name: data.name ?? entry.id,
          assetFolder: data.assetFolder ?? `/kermeses/${entry.id}`,
          festivalImage: data.festivalImage ?? "",
          menuImage: data.menuImage ?? "",
          ikramImage: data.ikramImage ?? "",
          aboutImage: data.aboutImage ?? "",
          aboutTitle: data.aboutTitle ?? "",
          aboutMarkdown: data.aboutMarkdown ?? stripLegacyContent(data.aboutText ?? ""),
          sponsorImages: Array.isArray(data.sponsorImages) ? data.sponsorImages : [],
        };
      });

      setKermeses(records);
    });

    return () => unsubscribe();
  }, []);

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

      // Filter out template-basic for custom list sorting
      const customFolders = records.filter((item) => item.id !== TEMPLATE_FOLDER.id);
      
      // Sort custom folders alphabetically by ID (latest ones appear at the end)
      customFolders.sort((a, b) => a.id.localeCompare(b.id));

      const catalog = [...customFolders, TEMPLATE_FOLDER];
      setFolderCatalog(catalog);

      // Default the selected folder in the kermes creation flow to the latest custom folder
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
    return draft ?? kermeses.find((item) => item.id === selectedKermesId) ?? null;
  }, [draft, kermeses, selectedKermesId]);

  const editFlowFolder = useMemo(() => {
    if (!selectedRecord) {
      return TEMPLATE_FOLDER;
    }

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
    const nextSelectedId = selectedKermesId || settings.activeKermesId || kermeses[0]?.id || "";

    if (!nextSelectedId) {
      setDraft(null);
      return;
    }

    if (nextSelectedId !== selectedKermesId) {
      setSelectedKermesId(nextSelectedId);
      return;
    }

    const nextDraft = kermeses.find((item) => item.id === nextSelectedId) ?? null;
    setDraft(nextDraft);
  }, [kermeses, selectedKermesId, settings.activeKermesId]);

  async function handleSwitchChange() {
    const nextSettings = {
      ...settings,
      active: !settings.active,
    };

    setSettings(nextSettings);
    await setDoc(doc(db, SETTINGS_DOC), {
      ...nextSettings,
    });
  }

  async function handleActivateKermes(kermesId: string) {
    setSaving(true);
    setMessage("");

    try {
      const nextSettings = {
        ...settings,
        active: true,
        activeKermesId: kermesId,
      };

      setSettings(nextSettings);
      await setDoc(doc(db, SETTINGS_DOC), nextSettings);
      setSelectedKermesId(kermesId);
      setMessage("Aktif kermes güncellendi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateKermes() {
    const baseId = slugifyKermesId(newKermesName);

    if (!baseId) {
      setMessage("Kermes adı gerekli.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const existingIds = kermeses.map((item) => item.id);
      const kermesId = uniqueKermesId(baseId, existingIds);
      const selectedFolder = createFlowFolder;
      const assetFolder = selectedFolder.assetFolder || `/kermeses/${kermesId}`;
      const availableImages = selectedFolder.availableImages || [];

      // Smart file name matcher to support JPG, PNG, MP4, etc. dynamically
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
        sponsorImages: newKermesSponsorImages,
      };

      await setDoc(doc(db, "kermeses", kermesId), newRecord);
      await setDoc(doc(db, SETTINGS_DOC), {
        ...settings,
        active: true,
        activeKermesId: kermesId,
      });

      setSettings((prev) => ({ ...prev, active: true, activeKermesId: kermesId }));
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
    if (!selectedRecord) {
      setMessage("Düzenlenecek kermes seçin.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await setDoc(doc(db, "kermeses", selectedRecord.id), selectedRecord);
      setMessage("Kermes içeriği kaydedildi.");
    } finally {
      setSaving(false);
    }
  }

  function updateSelectedRecord(field: keyof KermesRecord, value: string) {
    if (!selectedRecord) {
      return;
    }

    const nextDraft: KermesRecord = {
      ...selectedRecord,
      [field]: field === "sponsorImages" ? parseImageList(value) : value,
    } as KermesRecord;

      setDraft(nextDraft);
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
      let nextList;
      if (selectedList.includes(imagePath)) {
        nextList = selectedList.filter(s => s !== imagePath);
      } else {
        nextList = [...selectedList, imagePath];
      }
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
            <button
              type="button"
              onClick={selectAllVisible}
              className="text-[9px] text-green-600 hover:underline font-semibold"
            >
              Hepsini seç
            </button>
            <span className="text-[9px] text-gray-300">|</span>
            <button
              type="button"
              onClick={deselectAllVisible}
              className="text-[9px] text-red-500 hover:underline font-semibold"
            >
              Temizle
            </button>
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
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleFile(imagePath)}
                />
                <span className="font-mono break-all">
                  {filename} {isMissing ? "(dosya bulunamadı)" : ""}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  function toggleSponsorImage(imagePath: string) {
    if (!selectedRecord) {
      return;
    }

    const currentImages = draft?.sponsorImages ?? selectedRecord.sponsorImages;
    const nextImages = currentImages.includes(imagePath)
      ? currentImages.filter((item) => item !== imagePath)
      : [...currentImages, imagePath];

    setDraft({
      ...selectedRecord,
      sponsorImages: nextImages,
    });
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
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
          Yönetim Paneli
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 relative">
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white flex items-center justify-between">
              Ayarlar
              <a
                href="/settings"
                className="absolute top-6 right-6"
                title="Ayarları görüntüle"
              >
                <SettingsIcon className="!h-6 !w-6 mb-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition" />
              </a>
            </h2>
            <div className="flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">
                Kermesmenu aktif
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.active}
                  onChange={handleSwitchChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-all"></div>
                <div className="absolute left-1 top-1 bg-white dark:bg-neutral-900 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-neutral-700 space-y-3">
              <label className="block text-sm font-medium text-black dark:text-white">
                Aktif kermes
              </label>
              <select
                value={settings.activeKermesId}
                onChange={(event) => handleActivateKermes(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-black dark:text-white"
              >
                <option value="">Seçin</option>
                {kermeses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
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

        <div className="w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
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

        <div className="w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Kermes içerikleri
            </h2>
            {message ? <span className="text-sm text-blue-600 dark:text-blue-400">{message}</span> : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {kermeses.map((item) => {
                const isActive = settings.activeKermesId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedKermesId(item.id)}
                    className={`w-full text-left rounded-xl border p-4 transition ${isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-300'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-black dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.id}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.assetFolder}</p>
                      </div>
                      {isActive ? <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Aktif</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-semibold text-black dark:text-white">Seçili kermes düzenle</h3>
                {selectedRecord ? (
                  <button
                    type="button"
                    onClick={() => handleActivateKermes(selectedRecord.id)}
                    disabled={saving}
                    className="rounded-lg bg-black text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    Aktif yap
                  </button>
                ) : null}
              </div>

              {selectedRecord ? (
                <div className="space-y-3">
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
                    <input
                      value={draft?.assetFolder ?? selectedRecord.assetFolder}
                      disabled
                      className="mt-1 w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 px-3 py-2 text-black dark:text-white font-mono"
                    />
                  </label>
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
                      placeholder={DEFAULT_ABOUT_MARKDOWN}
                      rows={12}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2 text-black dark:text-white font-mono text-sm leading-relaxed"
                    />
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      Basit Markdown yazabilirsiniz. Ornek: **kalin**, *italik*, - madde, [link](https://...)
                      <span className="block font-mono mt-1">Ortalamak icin: :::center ... :::</span>
                    </span>
                  </div>
                  <label className="block text-sm text-black dark:text-white">
                    Sponsor görselleri
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 p-3">
                      {editFlowSponsorChoices.map((imagePath) => {
                        const isSelected = (draft?.sponsorImages ?? selectedRecord.sponsorImages).includes(imagePath);

                        return (
                          <label key={imagePath} className="flex items-center gap-2 text-xs text-black dark:text-white">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSponsorImage(imagePath)}
                            />
                            <span className="font-mono break-all">{imagePath}</span>
                          </label>
                        );
                      })}
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveSelectedKermes}
                    disabled={saving}
                    className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 disabled:opacity-60"
                  >
                    {saving ? "Kaydediliyor..." : "Seçili kermesi kaydet"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Düzenlemek için listeden bir kermes seçin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
