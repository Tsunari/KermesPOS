"use client";
import { useEffect, useState } from "react";

const SETTINGS_PATH = "/settings.json";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(SETTINGS_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch settings.json");
        return res.json();
      })
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Settings JSON</h1>
      <pre className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-2xl text-sm text-black dark:text-white overflow-x-auto">
        {JSON.stringify(settings, null, 2)}
      </pre>
    </div>
  );
}
