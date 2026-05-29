"use client";

import Link from 'next/link';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PageContainer from '../components/PageContainer';
import Image from 'next/image';
import { CardGiftcard, Festival, Recommend, School, ShoppingBag } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useActiveKermes } from '../hooks/useActiveKermes';

const navCards = [
  { label: 'Kermesimiz', href: '/festival', icon: Festival },
  { label: <>Online Ön Sipariş<br />(Kasada Hızlı Teslim)</>, href: '/order', icon: ShoppingBag },
  { label: 'Menü', href: '/menu', icon: RestaurantMenuIcon },
  { label: 'Hakkımızda', href: '/about', icon: InfoIcon },
  { label: 'Sponsorlarımız', href: '/sponsor', icon: Recommend },
  { label: 'Talebeleye İkram', href: '/ikram', icon: CardGiftcard },
  { label: 'Yurtlarımızın Tanıtımı', href: '/yurtlar', icon: School },
  { label: 'İletişim', href: '/contact', icon: ContactMailIcon, external: false },
];

export default function TenantHome() {
  const { settings, kermesData } = useActiveKermes();
  const [hasSavedTicket, setHasSavedTicket] = useState(false);

  useEffect(() => {
    if (!kermesData?.id) return;
    const updateTicketState = () => {
      try {
        const raw = localStorage.getItem(`menu.${kermesData.id}.onlineOrder.recent`);
        const parsed = raw ? JSON.parse(raw) : null;
        setHasSavedTicket(Boolean(parsed?.orderId));
      } catch {
        setHasSavedTicket(false);
      }
    };

    updateTicketState();
    window.addEventListener('storage', updateTicketState);
    return () => window.removeEventListener('storage', updateTicketState);
  }, [kermesData?.id]);

  if (!settings || !kermesData) return null;

  return (
    <PageContainer>
      <div className="flex flex-col items-center w-full px-2 py-3 gap-3">
        <div className="w-full flex justify-end mb-1">
          <Link
            href={`/${kermesData.id}/order?ticket=1`}
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
        
        <div className="w-full flex flex-col gap-4">
          {navCards.filter(card => {
            const key = card.href.replace('/', '');
            const enabledSections = kermesData?.enabledSections ?? {};
            return enabledSections[key as keyof typeof enabledSections] !== false;
          }).map(card => {
            const Icon = card.icon;
            const tenantHref = `/${kermesData.id}${card.href}`;
            return (
              <Link
                key={card.href}
                href={tenantHref}
                className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 transition rounded-2xl shadow p-4 text-lg font-semibold text-black border border-gray-200"
              >
                <span><Icon fontSize="large" className="text-black" /></span>
                <span>{card.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
