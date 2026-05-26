"use client";

import React from "react";
import Image from "next/image";
import { ActiveKermesProvider, useActiveKermes } from "../hooks/useActiveKermes";
import PageContainer from "../components/PageContainer";

function TenantLayoutInner({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useActiveKermes();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-6">
          <span className="relative flex h-16 w-16">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-30"></span>
            <span className="relative inline-flex rounded-full h-16 w-16 bg-gray-100 shadow-lg"></span>
            <span className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/Mintika_round_b-cropped.svg"
                alt="Mintika Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center w-full min-h-[70vh] gap-4 text-center px-4">
          <Image
            src="/Mintika_round_b-cropped.svg"
            alt="Mintika Logo"
            width={80}
            height={80}
            className="rounded-full opacity-60"
          />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Kermes Bulunamadı</h2>
          <p className="text-sm text-gray-500">
            Aradığınız kermes adresi geçerli değil veya yayından kaldırılmış olabilir.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!settings.active) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center w-full min-h-[75vh] text-center px-4 gap-6">
          <Image
            src="/Mintika_round_b-cropped.svg"
            alt="Mintika Logo"
            width={100}
            height={100}
            className="rounded-full drop-shadow-md"
          />
          <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-green-500 to-teal-500 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            Tekrar Görüşmek<br/>Dileğiyle
          </span>
          <p className="text-sm font-medium text-gray-500 max-w-xs">
            Bu konuma ait kermesimiz şu anda kapalıdır. İlginiz için teşekkür ederiz!
          </p>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
}

export default function TenantClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveKermesProvider>
      <TenantLayoutInner>{children}</TenantLayoutInner>
    </ActiveKermesProvider>
  );
}
