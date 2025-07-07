"use client";
import PageContainer from '../components/PageContainer';
import Image from 'next/image';
import { useState } from 'react';

export default function MenuPage() {
    const [imgError, setImgError] = useState(false);
    return (
        <PageContainer>
            <div className="flex justify-center items-center mt-15 w-full">
                <div className="flex justify-center items-center w-full">
                    {!imgError ? (
                        <Image
                            src="/MPG-Sponsor.jpg"
                            alt="Sponsor Resimler"
                            width={225}
                            height={800}
                            className="rounded-2xl shadow-lg object-contain outline-2 outline-black"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                            priority
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div
                            className="rounded-2xl shadow-lg outline-2 outline-black flex items-center justify-center bg-gray-200"
                            style={{ width: 600, height: 800, maxWidth: '100%', minHeight: 200 }}
                        >
                            <span className="text-black text-xl font-semibold text-center w-full block">Sponsor Resimler</span>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}