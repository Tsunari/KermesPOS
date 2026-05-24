"use client";
import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import CenteredImage from '../components/CenteredImage';
import LoadingScreen from '../components/LoadingScreen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { useActiveKermes } from '../hooks/useActiveKermes';

export default function FestivalPage() {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const { kermesData, loading } = useActiveKermes();

    const rawImage = kermesData?.ikramImage || '/kermeses/template-basic/ikram.svg';
    const ikramImages = rawImage.split(/[\n,]+/).map((src) => src.trim()).filter(Boolean);

    if (loading) {
        return (
            <PageContainer>
                <LoadingScreen />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="flex flex-col gap-6 w-full items-center mt-5 mb-5">
                {ikramImages.map((src, index) => (
                    <CenteredImage
                        key={index}
                        src={src}
                        alt={`İkram Görseli ${index + 1}`}
                        priority={index === 0}
                    />
                ))}
            </div>
            <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-5 mb-5">
                <div className="text-gray-700 text-base text-center space-y-6">
                    { [
                        {
                            label: "URVE-Regionalverband München e.V.",
                            value: "URVE-Regionalverband München e.V.",
                        },
                        {
                            label: "IBAN: DE39 7015 0000 1005 1226 82",
                            value: "DE39 7015 0000 1005 1226 82",
                        },
                        {
                            label: "VZ: İsim / Spende / Talebe İkram",
                            value: "İsim / Spende / Talebe İkram",
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-center space-x-2 mb-5 last:mb-0">
                            <span>{item.label}</span>
                            <button
                                type="button"
                                className="p-1 rounded hover:bg-gray-200"
                                onClick={() => {
                                    navigator.clipboard.writeText(item.value);
                                    setCopiedIdx(idx);
                                    setTimeout(() => setCopiedIdx(null), 5000);
                                }}
                                aria-label="Copy to clipboard"
                            >
                                {copiedIdx === idx ? (
                                    <DoneIcon className="text-gray-500" fontSize="small" />
                                ) : (
                                    <ContentCopyIcon className="text-gray-500" fontSize="small" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white/90 rounded-2xl shadow-lg p-0 border border-gray-200 mt-0 mb-5">
                <div className="text-gray-700 text-base text-center space-y-6">
                    <a
                      href="https://www.paypal.me/URVEmuenchen"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <CenteredImage
                        width={150}
                        innerClassName="flex justify-center items-center"
                        outerClassName=""
                        border={false}
                        src="/paypal.png"
                        alt="PayPal Logo"
                      />
                    </a>
                </div>
            </div>    
        </PageContainer>
    );
}
