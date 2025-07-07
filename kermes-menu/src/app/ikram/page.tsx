"use client";
import PageContainer from '../components/PageContainer';
import CenteredImage from '../components/CenteredImage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
// import Snackbar from '../components/Snackbar';
import { useState } from 'react';

export default function FestivalPage() {
    // const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    return (
        <PageContainer>
            <CenteredImage
                src="/Ikram.jpg"
                alt="Kermesimiz"
                outerClassName='mt-5 mb-5'
            />
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
                                    //setSnackbarOpen(true);
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
                    {/* <p>Veya hızlıca:</p> */}
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
            {/* <Snackbar open={snackbarOpen} text="Copied" icon={<DoneIcon className="text-green-400" fontSize="small" />} onClose={() => setSnackbarOpen(false)} /> */}
        </PageContainer>
    );
}
