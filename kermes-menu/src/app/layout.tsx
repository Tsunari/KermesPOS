import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import BottomNav from './components/BottomNav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kermes Menu",
  description: "Kermes Menu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-gray-500 w-full h-full ${geistMono.variable} ${geistSans.variable}`}>
        <div className="w-full h-screen flex flex-col xl:justify-center xl:items-center xl:p-8">
          <div className="w-full h-full bg-white flex flex-col xl:max-w-md xl:rounded-3xl xl:shadow-xl xl:overflow-hidden xl:h-[850px] xl:w-[400px]">
            {/* All page content should be placed inside <main> to ensure consistent layout */}
            <main className="flex-1 w-full overflow-y-auto no-scrollbar">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
