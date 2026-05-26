import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseInit';
import { usePathname } from 'next/navigation';

export type KermesSettings = {
  active: boolean;
  activeKermesId: string;
  showActiveKermesName?: boolean;
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
  // Tenant-level explicit online ordering flag (may be undefined/null if not set)
  onlineOrderingEnabled?: boolean | null;
};

type ActiveKermesContextType = {
  settings: KermesSettings | null;
  kermesData: KermesRecord | null;
  loading: boolean;
};

const ActiveKermesContext = createContext<ActiveKermesContextType>({
  settings: null,
  kermesData: null,
  loading: true,
});

export function ActiveKermesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tenantId = pathname ? pathname.split('/').filter(Boolean)[0] || '' : '';
  const [settings, setSettings] = useState<KermesSettings | null>(null);
  const [kermesData, setKermesData] = useState<KermesRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'kermeses', tenantId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Self-healing database fallback for undefined active field
        const isActive = data?.active !== false; 
        
        setSettings({
          active: isActive,
          activeKermesId: snap.id,
          showActiveKermesName: data?.showActiveKermesName !== false,
        });

        setKermesData({
          id: snap.id,
          name: data?.name ?? snap.id,
          assetFolder: data?.assetFolder ?? `/kermeses/${snap.id}`,
          festivalImage: data?.festivalImage ?? '',
          menuImage: data?.menuImage ?? '',
          ikramImage: data?.ikramImage ?? '',
          aboutImage: data?.aboutImage ?? '',
          aboutTitle: data?.aboutTitle ?? 'Geleneksel Mıntıka Kermesimiz Başlıyor!',
          aboutMarkdown: data?.aboutMarkdown ?? data?.aboutText ?? '',
          sponsorImages: Array.isArray(data?.sponsorImages) ? data?.sponsorImages : [],
          bankName: data?.bankName ?? '',
          bankIban: data?.bankIban ?? '',
          bankReference: data?.bankReference ?? '',
          paypalLink: data?.paypalLink ?? '',
          enabledSections: data?.enabledSections ?? {},
          onlineOrderingEnabled: typeof data?.onlineOrderingEnabled === 'boolean' ? data.onlineOrderingEnabled : null,
        });
      } else {
        setSettings(null);
        setKermesData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tenant kermes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <ActiveKermesContext.Provider value={{ settings, kermesData, loading }}>
      {children}
    </ActiveKermesContext.Provider>
  );
}

export function useActiveKermes() {
  return useContext(ActiveKermesContext);
}
