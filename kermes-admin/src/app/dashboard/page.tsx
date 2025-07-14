"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SETTINGS_PATH = "/settings.json";

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
    // Fetch settings.json from public folder
    fetch(SETTINGS_PATH)
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleSwitchChange() {
    const newSettings = { ...settings, active: !settings.active };
    setSettings(newSettings);
    // Save to settings.json in public folder
    fetch(SETTINGS_PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
  }

  if (!isAuth) return null;
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Settings Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">
            Settings
          </h2>
          <div className="flex items-center justify-between">
            <span className="font-medium text-black dark:text-white">
              Kermes menu active
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
            Graphs and statistics coming soon...
          </span>
        </div>
      </div>
    </div>
  );
}
