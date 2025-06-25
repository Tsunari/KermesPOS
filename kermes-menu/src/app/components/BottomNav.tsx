"use client";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RateReviewIcon from '@mui/icons-material/RateReview';
import InfoIcon from '@mui/icons-material/Info';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { label: 'Menu', icon: <RestaurantMenuIcon />, href: '/menu' },
  { label: 'Reviews', icon: <RateReviewIcon />, href: '/reviews' },
  { label: 'About', icon: <InfoIcon />, href: '/about' },
  { label: 'Allergens', icon: <LocalDiningIcon />, href: '/allergens' },
  { label: 'Contact', icon: <ContactMailIcon />, href: '/contact' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [value, setValue] = useState(pathname);

  return (
    <>
      {/* Mobile: Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-50 bg-black border-t border-gray-800 sm:hidden">
        <BottomNavigation
          showLabels
          value={pathname}
          onChange={(event, newValue) => setValue(newValue)}
          className="w-full bg-black"
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.href}
              label={item.label}
              icon={item.icon}
              component={Link}
              href={item.href}
              value={item.href}
              sx={{ color: pathname === item.href ? 'white' : 'rgba(255,255,255,0.6)' }}
              style={{ minWidth: 0 }}
            />
          ))}
        </BottomNavigation>
      </nav>
      {/* Desktop: Top Navigation */}
      <nav className="hidden sm:flex justify-center w-full max-w-md mx-auto bg-black border-b border-gray-800 py-2 sticky top-0 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center px-4 py-1 transition text-xs font-medium ${pathname === item.href ? 'text-white' : 'text-gray-400'} hover:text-white`}
          >
            <span className="mb-0.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
} 