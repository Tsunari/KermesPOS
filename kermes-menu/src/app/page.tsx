"use client";
import Link from 'next/link';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PageContainer from './components/PageContainer';
import Image from 'next/image';
import { CardGiftcard, Festival, Recommend, School, ShoppingBag } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../firebaseInit";

const navCards = [
  { label: 'Kermesimiz', href: '/festival', icon: Festival },
  { label: 'Online Ön Sipariş (Kasada Hızlı Teslim)', href: '/order', icon: ShoppingBag },
  { label: 'Menü', href: '/menu', icon: RestaurantMenuIcon },
  { label: 'Hakkımızda', href: '/about', icon: InfoIcon },
  { label: 'Sponsorlarımız', href: '/sponsor', icon: Recommend },
  { label: 'Talebeleye İkram', href: '/ikram', icon: CardGiftcard },
  { label: 'Yurtlarımızın Tanıtımı', href: '/yurtlar', icon: School },
  { label: 'İletişim', href: '/contact', icon: ContactMailIcon, external: false },
  // { label: 'İncelemeler', href: '/reviews', icon: RateReviewIcon /> },
  // { label: 'Ayarlar', href: '/settings', icon: Settings /> },
  // { label: 'Kermes POS', href: 'https://kermespos.web.app/', icon: PointOfSale, external: true },
];

const SETTINGS_DOC = "settings/main";

type KermesSettings = {
  active: boolean;
  activeKermesId: string;
  showActiveKermesName?: boolean;
};

type KermesRecord = {
  name: string;
  assetFolder: string;
};

export default function Home() {
  const [settings, setSettings] = useState<KermesSettings | null>(null);
  const [activeKermes, setActiveKermes] = useState<KermesRecord | null>(null);
  const [hasSavedTicket, setHasSavedTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTicketState = () => {
      try {
        const raw = localStorage.getItem('menu.onlineOrder.recent');
        const parsed = raw ? JSON.parse(raw) : null;
        setHasSavedTicket(Boolean(parsed?.orderId));
      } catch {
        setHasSavedTicket(false);
      }
    };

    updateTicketState();
    window.addEventListener('storage', updateTicketState);
    return () => window.removeEventListener('storage', updateTicketState);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, SETTINGS_DOC), (snap) => {
      if (snap.exists()) {
        setSettings({
          active: snap.data()?.active ?? false,
          activeKermesId: snap.data()?.activeKermesId ?? "",
          showActiveKermesName: snap.data()?.showActiveKermesName ?? false,
        });
      } else {
        setSettings({ active: false, activeKermesId: "", showActiveKermesName: false });
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!settings?.activeKermesId) {
      setActiveKermes(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "kermeses", settings.activeKermesId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<KermesRecord>;
        setActiveKermes({
          name: data.name ?? snap.id,
          assetFolder: data.assetFolder ?? `/kermeses/${snap.id}`,
        });
      } else {
        setActiveKermes(null);
      }
    });

    return () => unsub();
  }, [settings?.activeKermesId]);

  if (loading || settings === null) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="flex flex-col items-center gap-6">
            <span className="relative flex h-16 w-16">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-30"></span>
              <span className="relative inline-flex rounded-full h-16 w-16 bg-gray-100 shadow-lg"></span>
              <span className="absolute inset-0 flex items-center justify-center">
                <Image src="/Mintika_round_b-cropped.svg" alt="Mintika Logo" width={40} height={40} className="rounded-full" />
              </span>
            </span>
            {/* <span className="text-xl font-bold text-black tracking-tight">Loading...</span> */}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center w-full px-2 py-3 gap-3">
        {settings.active ? (
          <>
            <div className="w-full flex justify-end mb-1">
              <Link
                href="/order?ticket=1"
                className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition ${
                  hasSavedTicket
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag fontSize="small" />
                Fişim
              </Link>
            </div>

            {/* Hero SVG header */}
            <div className="w-full flex justify-center mb-2">
              <a className="w-fit">
                <Image
                  src="/Mintika_round_b-cropped.svg"
                  alt="Mintika Hero Logo"
                  width={120}
                  height={120}
                  className="drop-shadow-lg rounded-full"
                  priority
                />
              </a>
            </div>
            <h1 className="text-3xl font-extrabold text-black mb-3 text-center tracking-tight leading-tight">
              <span className="block">Kermesimize</span>
              <span className="block">Hoşgeldiniz</span>
            </h1>
            {activeKermes && settings.showActiveKermesName ? (
              <div className="mb-1 rounded-2xl bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700 shadow-sm">
                Aktif kermes: {activeKermes.name}
              </div>
            ) : null}
            <div className="w-full flex flex-col gap-4">
              {navCards.map(card => {
                const Icon = card.icon;
                return card.external ? (
                  <a
                    key={card.href}
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 transition rounded-2xl shadow p-4 text-lg font-semibold text-black border border-gray-200"
                  >
                    <span><Icon fontSize="large" className="text-black" /></span>
                    <span>{card.label}</span>
                  </a>
                ) : (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 transition rounded-2xl shadow p-4 text-lg font-semibold text-black border border-gray-200"
                  >
                    <span><Icon fontSize="large" className="text-black" /></span>
                    <span>{card.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-96">
            <span className="text-4xl font-bold text-gradient bg-gradient-to-r from-blue-500 via-green-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
              Tekrar Görüşme dileğiyle
            </span>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
