"use client";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseInit";
import KermesLoading from "../../components/KermesLoading";

const SETTINGS_DOC = "settings/main";

type KermesSettings = {
  active: boolean;
  activeKermesId: string;
  showActiveKermesName?: boolean;
};

type KermesRecord = {
  id: string;
  name: string;
  assetFolder: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<KermesSettings | null>(null);
  const [kermeses, setKermeses] = useState<KermesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(doc(db, SETTINGS_DOC))
      .then((snap) => {
        if (snap.exists()) {
          setSettings({
            active: snap.data()?.active ?? true,
            activeKermesId: snap.data()?.activeKermesId ?? "",
            showActiveKermesName: snap.data()?.showActiveKermesName ?? false,
          });
        }
        else setError("No settings found");
      })
      .catch((err) => {
        setError(err.message);
      });

    const unsubscribe = onSnapshot(collection(db, "kermeses"), (snapshot) => {
      setKermeses(
        snapshot.docs.map((entry) => {
          const data = entry.data() as Partial<KermesRecord>;

          return {
            id: entry.id,
            name: data.name ?? entry.id,
            assetFolder: data.assetFolder ?? `/kermeses/${entry.id}`,
          };
        })
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <KermesLoading message="Loading..." />;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Kermes Ayarları</h1>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 text-sm text-black dark:text-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Settings JSON</h2>
          <pre className="whitespace-pre-wrap">
        {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 text-sm text-black dark:text-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Kermes kayıtları</h2>
          <div className="space-y-3">
            {kermeses.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 dark:border-neutral-700 p-3">
                <p className="font-semibold">{item.name}</p>
                <p className="text-gray-500 dark:text-gray-400">{item.id}</p>
                <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{item.assetFolder}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
