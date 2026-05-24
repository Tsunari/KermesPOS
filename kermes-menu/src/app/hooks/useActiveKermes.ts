import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseInit';

export type KermesSettings = {
  active: boolean;
  activeKermesId: string;
};

export type KermesRecord = {
  id: string;
  name: string;
  assetFolder: string;
  festivalImage: string;
  menuImage: string;
  ikramImage: string;
  aboutImage: string;
  aboutTitle: string;
  aboutMarkdown: string;
  sponsorImages: string[];
};

export function useActiveKermes() {
  const [settings, setSettings] = useState<KermesSettings | null>(null);
  const [kermesData, setKermesData] = useState<KermesRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings/main'), (snap) => {
      if (snap.exists()) {
        setSettings({
          active: snap.data()?.active ?? false,
          activeKermesId: snap.data()?.activeKermesId ?? '',
        });
      } else {
        setSettings(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings?.activeKermesId) {
      setKermesData(null);
      if (settings) setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'kermeses', settings.activeKermesId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setKermesData({
          id: snap.id,
          name: data?.name ?? snap.id,
          assetFolder: data?.assetFolder ?? `/kermeses/${snap.id}`,
          festivalImage: data?.festivalImage ?? '',
          menuImage: data?.menuImage ?? '',
          ikramImage: data?.ikramImage ?? '',
          aboutImage: data?.aboutImage ?? '',
          aboutTitle: data?.aboutTitle ?? '',
          aboutMarkdown: data?.aboutMarkdown ?? data?.aboutText ?? '',
          sponsorImages: Array.isArray(data?.sponsorImages) ? data?.sponsorImages : [],
        });
      } else {
        setKermesData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [settings?.activeKermesId]);

  return { settings, kermesData, loading };
}
