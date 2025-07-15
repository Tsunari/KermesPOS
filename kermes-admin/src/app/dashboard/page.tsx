"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import SettingsIcon from "@mui/icons-material/Settings";
import { getDoc } from "firebase/firestore";
import KermesLoading from "../../components/KermesLoading";
import KermesAppBar from "../../components/KermesAppBar";

const SETTINGS_DOC = "settings/main";

export default function Dashboard() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [settings, setSettings] = useState({ active: true });
  const [loading, setLoading] = useState(true);

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
          setSettings({ active: snap.data()?.active ?? true });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSwitchChange() {
    const newSettings = { active: !settings.active };
    setSettings(newSettings);
    await setDoc(doc(db, SETTINGS_DOC), newSettings);
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
          {/* Settings Card */}
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
          </div>
          {/* Placeholder for future graph/stat cards */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">
              Grafikler ve istatistikler yakında...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
