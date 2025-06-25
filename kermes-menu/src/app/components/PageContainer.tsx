"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  const pathname = usePathname();
  const isMainPage = pathname === '/';

  return (
    <div className={`w-full max-w-md mx-auto px-4 py-6 ${className}`}>
      {!isMainPage && (
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-black text-sm font-medium">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Geri Dön
        </Link>
      )}
      {children}
    </div>
  );
}