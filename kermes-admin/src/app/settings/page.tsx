"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import KermesLoading from "../../components/KermesLoading";

const SETTINGS_DOC = "settings/main";

export default function SettingsPage() {
  const [settings, setSettings] = useState<{ active: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(doc(db, SETTINGS_DOC))
      .then((snap) => {
        if (snap.exists()) setSettings({ active: snap.data()?.active ?? true });
        else setError("No settings found");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <KermesLoading message="Loading..." />;
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
