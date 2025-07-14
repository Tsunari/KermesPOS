"use client";
import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import Image from 'next/image';
import CenteredImage from '../components/CenteredImage';
import DoneIcon from '@mui/icons-material/Done';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function AboutPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  return (
    <PageContainer>
      <h1 className="text-3xl font-extrabold text-black mb-3 mt-1 text-center tracking-tight">Hakkımızda</h1>
      <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-8 mb-8">
        <div className="text-gray-700 text-base text-center space-y-6">
          <p className="text-xl font-semibold">🌟 Münih Mıntıka Kermesi -<br/>Bu Sene Neu Ulm’de Sizlerle!</p>

          <p>
            Her sene farklı şehirlerde büyük bir heyecan ve coşkuyla icra ettiğimiz Münih Mıntıka Kermesimiz, bu sene de gönüllerimizi birleştirmek, dostluklarımızı pekiştirmek ve hayırda yarışmak için{' '}
            <br />
            <span className="inline-flex items-center">
              <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1"
              height="1em"
              viewBox="0 0 24 24"
              width="1em"
              fill="currentColor"
              style={{ verticalAlign: 'middle' }}
              >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <a
              href="https://maps.google.com/?q=Neu+Ulm+Reuttier+Str.+128"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-600 underline hover:text-blue-800"
              >
              Neu Ulm Reuttier Str. 128
              </a>
            </span>
            <br />
            adresinde siz kıymetli misafirlerimizle buluşuyor.
          </p>

          <div>
            <p className="font-semibold mb-2">🍽 Birbirinden lezzetli tatlar, hediyelikler ve ikramlar sizleri bekliyor!</p>
            <ul className="list-disc list-inside text-left inline-block text-gray-700">
              <li>Geleneksel ev yemekleri</li>
              <li>Tandır, döner ve ızgara çeşitleri</li>
              <li>Çay, kahve, tatlı ikramları</li>
              <li>Taze gözleme, börek ve poğaçalar</li>
              <li>Osmanlı şerbeti, limonata ve daha nice sürpriz lezzetler</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">🕌 Bu Kermesimizin Geliri Nereye?</p>
            <p>
              Bu seneki kermesimizin tüm geliri, gençlerimizin ilim ve ahlakla yetişeceği, güzel ahlakın ve kardeşliğin yeşereceği yeni açılacak olan <span className="font-bold">Rosenheim Talebe Yurdumuza</span> bağışlanacaktır.<br/>
              Yurtlarımız, sadece barınma değil; manevi eğitim, kardeşlik, sorumluluk ve ümmet bilinci kazandıran yuvamızdır.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">❤ Destek Sizden, Bereket Allah’tan</p>
            <ul className="list-disc list-inside text-left inline-block text-gray-700">
              <li>Gençlerimiz daha iyi imkanlarda eğitim görecek,</li>
              <li>Yeni yurt binamız en kısa zamanda hizmete girecek,</li>
              <li>Bu hayra vesile olan her kardeşimiz dualarımızda yer alacaktır.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">🔊 Haydi, Sen de Katıl!</p>
            <p>
              Bu güzel hayra ortak olmak, soframıza bereket katmak ve kardeşliğimizi pekiştirmek için ailenizle, dostlarınızla birlikte kermesimize bekliyoruz.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center mb-5 w-full">
        <div className="flex justify-center items-center w-full">
            <Image
                src="/Rosenheim.jpg"
                alt="Menu"
                width={600}
                height={800}
                className="rounded-2xl shadow-lg object-contain outline-2 outline-black"
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                priority
            />
        </div>
      </div>
      {/* <div className="flex justify-center items-center w-full">
        <div className="flex justify-center items-center w-full">
            <Image
                src="/Rosenheim-Üye.jpg"
                alt="Menu"
                width={600}
                height={800}
                className="rounded-2xl shadow-lg object-contain outline-2 outline-black"
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                priority
            />
        </div>
      </div> */}
      <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-0 mb-5">
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
                            label: "VZ: Mitgliedsbeitrag Rosenheim",
                            value: "Mitgliedsbeitrag Rosenheim",
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
    </PageContainer>
  );
}