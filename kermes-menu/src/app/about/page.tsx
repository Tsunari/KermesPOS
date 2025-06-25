"use client";
import PageContainer from '../components/PageContainer';

export default function AboutPage() {
  return (
    <PageContainer>
      <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-8">
        <h1 className="text-3xl font-extrabold text-black mb-4 text-center tracking-tight">Hakkımızda</h1>
        <p className="text-gray-700 text-base text-center">
          Kermeslerimiz, lezzetli yemekler, sıcak atmosfer ve unutulmaz anlar sunarlar. Her yıl düzenlenen etkinliklerimizde, çeşitli mutfaklardan yemekler, tatlılar ve içecekler bulabilirsiniz. Katılımınızla topluluğumuza destek oluyorsunuz!
        </p>
      </div>
    </PageContainer>
  );
} 