import Link from 'next/link';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RateReviewIcon from '@mui/icons-material/RateReview';
import InfoIcon from '@mui/icons-material/Info';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PageContainer from './components/PageContainer';
import Image from 'next/image';
import { Info, PointOfSale, School, Settings } from '@mui/icons-material';
import { SpeedDialIcon } from '@mui/material';

const navCards = [
  { label: 'Menü', href: '/menu', icon: <RestaurantMenuIcon fontSize="large" className="text-black" /> },
  //{ label: 'İncelemeler', href: '/reviews', icon: <RateReviewIcon fontSize="large" className="text-black" /> },
  //{ label: 'Ayarlar', href: '/settings', icon: <Settings fontSize="large" className="text-black" /> },
  { label: 'İletişim', href: '/contact', icon: <ContactMailIcon fontSize="large" className="text-black" /> },
  { label: 'Hakkımızda', href: '/about', icon: <InfoIcon fontSize="large" className="text-black" /> },
  { label: 'Üniversite Yurtlarımız', href: 'https://www.vikz-studentenwohnheime.de', icon: <School fontSize="large" className="text-black" />, external: true },
  { label: 'Kermes POS', href: 'https://kermespos.web.app/', icon: <PointOfSale fontSize="large" className="text-black" />, external: true },
];

export default function Home() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center w-full px-2 py-8 gap-4">
        {/* Hero SVG header */}
        <div className="w-full flex justify-center mb-4">
          <a href="https://kermespos.web.app/" target="_blank" rel="noopener noreferrer" className="w-fit">
            <Image
              src="/Mintika_round_b-cropped.svg"
              alt="Mintika Hero Logo"
              width={120}
              height={120}
              className="drop-shadow-lg rounded-full cursor-pointer"
              priority
            />
          </a>
        </div>
        <h1 className="text-3xl font-extrabold text-black mb-6 text-center tracking-tight leading-tight">
          <span className="block">Kermesimize</span>
          <span className="block">Hoşgeldiniz</span>
        </h1>
        <div className="w-full flex flex-col gap-4">
          {navCards.map(card => (
            card.external ? (
              <a
                key={card.href}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 transition rounded-2xl shadow p-4 text-lg font-semibold text-black border border-gray-200"
              >
                <span>{card.icon}</span>
                <span>{card.label}</span>
              </a>
            ) : (
              <Link
                key={card.href}
                href={card.href}
                className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 transition rounded-2xl shadow p-4 text-lg font-semibold text-black border border-gray-200"
              >
                <span>{card.icon}</span>
                <span>{card.label}</span>
              </Link>
            )
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
