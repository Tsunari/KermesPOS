"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseInit";
import Image from "next/image";
import Link from "next/link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PageContainer from "./components/PageContainer";

type KermesEntry = {
  id: string;
  name: string;
  active: boolean;
};

export default function Home() {
  const [kermeses, setKermeses] = useState<KermesEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "kermeses"),
      (snap) => {
        const list = snap.docs
          .map((entry) => {
            const data = entry.data();
            return {
              id: entry.id,
              name: data.name ?? entry.id,
              active: data.active !== false, // Default to true if undefined
            };
          })
          .filter((k) => k.active); // Only showcase active locations
        
        setKermeses(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading active kermeses:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[85vh] bg-white">
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center w-full px-2 py-6 gap-6 select-none">
        
        {/* Premium Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/Mintika_round_b-cropped.svg"
            alt="Mintika Brand Logo"
            width={110}
            height={110}
            className="drop-shadow-xl rounded-full border-4 border-gray-50 shadow-md animate-scale-up"
            priority
          />
          <div className="space-y-1 mt-2">
            <h1 className="text-3xl font-black text-black tracking-tight leading-none">
              Mıntıka Kermesleri
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-600 via-green-500 to-teal-500 bg-clip-text text-transparent">
              Online Menü & Ön Sipariş Portalı
            </p>
          </div>
        </div>

        {/* Dynamic Card List Container */}
        <div className="w-full flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">
              Lütfen konum seçin
            </span>
            <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">
              {kermeses.length} Aktif
            </span>
          </div>

          {kermeses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 border border-gray-100 bg-gray-50/50 rounded-3xl text-center gap-4">
              <LocationOnIcon className="text-gray-300 !h-12 !w-12 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800">Şu Anda Aktif Kermes Yok</h3>
                <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed mx-auto">
                  Yakında açılacak kermeslerimiz için bu sayfayı takip etmeye devam edin.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {kermeses.map((kermes) => (
                <Link
                  key={kermes.id}
                  href={`/${kermes.id}`}
                  className="group flex items-center justify-between bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:border-black hover:shadow-md transition-all duration-300 cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 border border-gray-100 text-black rounded-2xl group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <LocationOnIcon fontSize="medium" />
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black text-black tracking-tight leading-tight group-hover:translate-x-0.5 transition-transform duration-300">
                        {kermes.name}
                      </h2>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-wide">
                        Aktif Menü
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-300 group-hover:text-black transition-colors duration-300 pr-1">
                    <ChevronRightIcon fontSize="medium" className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer brand trademark */}
        <p className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase mt-8 select-none">
          © {new Date().getFullYear()} Kermes POS. All rights reserved.
        </p>

      </div>
    </PageContainer>
  );
}
