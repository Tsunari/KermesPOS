"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import PageContainer from '../../components/PageContainer';
import CenteredImage from '../../components/CenteredImage';
import LoadingScreen from '../../components/LoadingScreen';
import DoneIcon from '@mui/icons-material/Done';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useActiveKermes } from '../../hooks/useActiveKermes';

type MarkdownBlock =
  | { type: 'normal'; content: string }
  | { type: 'center'; content: string };

function parseCenteredMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const pattern = /:::\s*center\s*([\s\S]*?):::/gi;
  const blocks: MarkdownBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) !== null) {
    const start = match.index;
    const end = pattern.lastIndex;

    if (start > cursor) {
      const normalContent = markdown.slice(cursor, start).trim();
      if (normalContent) {
        blocks.push({ type: 'normal', content: normalContent });
      }
    }

    blocks.push({ type: 'center', content: match[1].trim() });
    cursor = end;
  }

  const tail = markdown.slice(cursor).trim();
  if (tail) {
    blocks.push({ type: 'normal', content: tail });
  }

  return blocks.length > 0 ? blocks : [{ type: 'normal', content: markdown }];
}

function renderMarkdownBlocks(blocks: MarkdownBlock[]): ReactNode {
  return blocks.map((block, index) => {
    if (block.type === 'center') {
      return (
        <div key={`center-${index}`} className="text-center w-full flex flex-col items-center justify-center">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-center w-full text-base leading-relaxed">{children}</p>,
              h1: ({ children }) => <h1 className="text-center w-full text-2xl font-bold mt-4 mb-2 text-black">{children}</h1>,
              h2: ({ children }) => <h2 className="text-center w-full text-xl font-bold mt-3 mb-2 text-black">{children}</h2>,
              h3: ({ children }) => <h3 className="text-center w-full text-lg font-bold mt-2 mb-1 text-black">{children}</h3>,
              h4: ({ children }) => <h4 className="text-center w-full text-base font-bold mt-2 mb-1 text-black">{children}</h4>,
              h5: ({ children }) => <h5 className="text-center w-full text-sm font-bold mt-2 mb-1 text-black">{children}</h5>,
              h6: ({ children }) => <h6 className="text-center w-full text-xs font-bold mt-2 mb-1 text-black">{children}</h6>,
              ul: ({ children }) => <ul className="list-none p-0 m-0 text-center w-full flex flex-col items-center my-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-none p-0 m-0 text-center w-full flex flex-col items-center my-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-center w-full my-0.5">{children}</li>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 text-center w-full">{children}</blockquote>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-semibold transition-colors duration-200 inline-block"
                >
                  {children}
                </a>
              ),
            }}
          >
            {block.content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <ReactMarkdown
        key={`normal-${index}`}
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-left text-base leading-relaxed">{children}</p>,
          h1: ({ children }) => <h1 className="text-left text-2xl font-bold mt-6 mb-3 text-black">{children}</h1>,
          h2: ({ children }) => <h2 className="text-left text-xl font-bold mt-5 mb-2 text-black">{children}</h2>,
          h3: ({ children }) => <h3 className="text-left text-lg font-semibold mt-4 mb-2 text-black">{children}</h3>,
          h4: ({ children }) => <h4 className="text-left text-base font-semibold mt-3 mb-2 text-black">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-left">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-left">{children}</ol>,
          li: ({ children }) => <li className="text-left my-0.5">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 text-left">{children}</blockquote>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-semibold transition-colors duration-200 inline-block"
            >
              {children}
            </a>
          ),
        }}
      >
        {block.content}
      </ReactMarkdown>
    );
  });
}

export default function AboutPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { kermesData, loading } = useActiveKermes();

  const aboutTitle = kermesData?.aboutTitle || 'Geleneksel Mıntıka Kermesimiz Başlıyor!';
  const aboutMarkdown = kermesData?.aboutMarkdown || `:::center
### **Gönülleri Birleştiren Kermesimize Hoş Geldiniz!**
:::

Büyük bir heyecan, birlik ve coşkuyla düzenlediğimiz kermesimiz; bu sefer de gönüllerimizi birleştirmek, bereketli sofralarda buluşmak ve hayırlı bir amaca katkı sağlamak üzere kapılarını açıyor!

:::center
📍 **Kermes Adresimiz:**

**[Address Line 1],**
**[Address Line 2]**
[Google Haritalar Yol Tarifi için Tıklayın](https://www.google.com/maps/place/)
:::

---
:::center
### Birbirinden Leziz Tatlar & İkramlar
:::
Kermesimiz süresince özenle hazırlanan zengin el emeği lezzetler sizleri bekliyor:
* **Geleneksel ev yemekleri** ve sıcacık gözlemeler,
* **Tandır, döner ve enfes ızgara çeşitleri**,
* **Ev yapımı şerbetler**, tatlılar ve taze çay/kahve ikramları.

---
:::center
### Bu Kermesin Geliri Nereye Gidiyor?
:::
Kermesimizden elde edilecek tüm hayır gelirleri, gençlerimizin ilim, güzel ahlak ve kardeşlik bilinciyle yetişeceği yurt ve eğitim faaliyetlerine bağışlanacaktır.

> *"Bir hayra vesile olan, onu yapan gibidir."* (Hadis-i Şerif)

Gençlerimizin daha iyi imkanlarda yetişmesi için yapacağınız her yardım ve ziyaret, hayır dualarımızda yer alacaktır. Destek sizden, bereket Allah'tan!

:::center
### 📢 Tüm Aileleri ve Gönül Dostlarını Bekliyoruz!
Kardeşliğimizi pekiştirmek ve soframıza bereket katmak için ailenizle, dostlarınızla birlikte hepinizi bekliyoruz!
:::`;

  const rawAboutImage = kermesData?.aboutImage || '/kermeses/template-basic/about.svg';
  const aboutImages = rawAboutImage.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  const markdownBlocks = parseCenteredMarkdownBlocks(aboutMarkdown);

  if (loading) {
    return (
      <PageContainer>
        <LoadingScreen />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <h1 className="text-3xl font-extrabold text-black mb-3 mt-0 text-center tracking-tight">Hakkımızda</h1>
      <div className="bg-white/90 rounded-2xl shadow-lg p-5 border border-gray-200 mt-4 mb-5">
        <div className="text-gray-700 text-base text-center space-y-6">
          <p className="text-xl font-semibold">{aboutTitle}</p>
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            {renderMarkdownBlocks(markdownBlocks)}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 items-center justify-center mb-5 w-full">
        {aboutImages.map((src, index) => (
          <CenteredImage
            key={index}
            src={src}
            alt={`Hakkımızda Görseli ${index + 1}`}
            priority={index === 0}
          />
        ))}
      </div>
      <div className="bg-white/90 rounded-2xl shadow-lg p-5 border border-gray-200 mt-0 mb-4">
        <div className="text-gray-700 text-base text-center space-y-6">
          {(() => {
            const bankItems = [
              kermesData?.bankName ? { label: kermesData.bankName, value: kermesData.bankName } : null,
              kermesData?.bankIban ? { label: `IBAN: ${kermesData.bankIban}`, value: kermesData.bankIban } : null,
              kermesData?.bankReference ? { label: `VZ: ${kermesData.bankReference}`, value: kermesData.bankReference } : null,
            ].filter(Boolean) as { label: string; value: string }[];

            if (bankItems.length === 0) return null;

            return bankItems.map((item, idx) => (
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
            ));
          })()}
        </div>
      </div>
      {kermesData?.paypalLink && (
        <div className="bg-white/90 rounded-2xl shadow-lg p-0 border border-gray-200 mt-0 mb-4">
          <div className="text-gray-700 text-base text-center space-y-6">
            <a
              href={kermesData.paypalLink}
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
      )}
    </PageContainer>
  );
}