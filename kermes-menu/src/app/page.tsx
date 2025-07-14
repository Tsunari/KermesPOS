import Link from 'next/link';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PageContainer from './components/PageContainer';
import Image from 'next/image';
import { CardGiftcard, Festival, Recommend, School } from '@mui/icons-material';

const navCards = [
  { label: 'Kermesimiz', href: '/festival', icon: Festival },
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

export default function Home() {
  
  const active = false;

  return (
    <PageContainer>
      <div className="flex flex-col items-center w-full px-2 py-8 gap-4">
        {active ? (
          <>
            {/* Hero SVG header */}
            <div className="w-full flex justify-center mb-4">
              <a 
                className="w-fit">
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
            <h1 className="text-3xl font-extrabold text-black mb-6 text-center tracking-tight leading-tight">
              <span className="block">Kermesimize</span>
              <span className="block">Hoşgeldiniz</span>
            </h1>
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
