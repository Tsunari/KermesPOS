"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ForkRightOutlinedIcon from '@mui/icons-material/ForkRightOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import ScreenshotPopup from "../components/ScreenshotPopup";

export default function Home() {
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch latest release asset from GitHub
    fetch("https://api.github.com/repos/Tsunari/KermesPOS/releases/latest")
      .then((res) => res.json())
      .then((data) => {
        // Find the first asset that looks like a Windows or general installer
        type GithubAsset = {
          name: string;
          browser_download_url: string;
        };
        const asset = (data.assets as GithubAsset[] | undefined)?.find((a) =>
          /\.(exe|msi|zip|AppImage|dmg)$/i.test(a.name)
        );
        if (asset) setDownloadUrl(asset.browser_download_url);
      });
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!downloadUrl) return;
    setIsLoading(true);
    // Create a temporary link and click it
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 py-16 px-4 sm:px-8 bg-gradient-to-b from-background to-[#f7f7f7] dark:to-[#181818] transition-colors duration-500">
        <Image
          src="/pic.png"
          alt="Kermes POS Logo"
          width={194}
          height={194}
          className="mb-6 drop-shadow-lg animate-fade-in dark:invert"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 mt-2 text-center animate-slide-down">
          Kermes POS
        </h1>
        <p className="text-lg sm:text-xl text-center max-w-2xl mb-8 animate-fade-in delay-100">
          The modern, open-source Point of Sale app for events, cafes, and small businesses. Fast, beautiful, and works offline. Built with Electron, React, and love.
        </p>
        <button
          onClick={handleDownload}
          disabled={!downloadUrl || isLoading}
          className="relative group inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ffb347] to-[#ffcc33] blur opacity-70 group-hover:opacity-100 transition-all duration-300 animate-pulse"></span>
          <span className="relative z-10 flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background font-semibold text-lg shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
        {/* Modern animated plus/download icon */}
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-black to-white dark:from-white dark:to-black shadow-md">
          <svg className="w-5 h-5 animate-bounce-slow text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0l-4-4m4 4l4-4" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
          </svg>
        </span>
        {isLoading ? "Downloading..." : "Download Latest Release"}
          </span>
        </button>
        <div className="h-4" /> {/* Add vertical space between buttons */}
        <button
          onClick={() => window.open("https://kermesprogram.web.app/", "_blank", "noopener,noreferrer")}
          className="relative group inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ffb347] to-[#ffcc33] blur opacity-70 group-hover:opacity-100 transition-all duration-300 animate-pulse"></span>
          <span className="relative z-10 flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background font-semibold text-lg shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95">            
        {"Try it out in the browser"}
          </span>
        </button>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-8 bg-background dark:bg-[#181818] transition-colors duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 animate-fade-in">Features</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-100">
            {/* Fast: Lightning bolt icon (Material Design) */}
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br">
              <BoltOutlinedIcon className="w-7 h-7 text-black dark:text-white" style={{ fontSize: 45 }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
            <p>Instant checkout, blazing performance, and smooth UI for busy events and shops.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-200">
            {/* Offline: CloudOff icon (Material Design) */}
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br">
              <CloudOffOutlinedIcon className="w-7 h-7 text-black dark:text-white" style={{ fontSize: 45 }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
            <p>All sales and statistics are saved locally. No internet required for daily use.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-300">
            {/* Export: Download icon (Material Design) */}
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br">
              <DownloadOutlinedIcon className="w-7 h-7 text-black dark:text-white" style={{ fontSize: 45 }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Export & Analytics</h3>
            <p>Export sales to CSV, view beautiful statistics, and manage your data easily.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-400">
            {/* Open Source: ForkRight icon (Material Design) */}
            <span className="mb-3 flex items-center justify-center w-12 h-12 ">
              <ForkRightOutlinedIcon className="w-7 h-7 text-black dark:text-white" style={{ fontSize: 45 }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Open Source</h3>
            <p>Free, transparent, and customizable. Contribute or adapt for your needs.</p>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-b from-background to-[#f7f7f7] dark:to-[#181818] transition-colors duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 animate-fade-in">Screenshots</h2>
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto animate-fade-in delay-200">
          <ScreenshotPopup
            customThumbnail={
              <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
                POS UI Screenshot
              </div>
            }
            fullImageSrc="/cart.png"
            altText="POS UI Screenshot"
          />
          <ScreenshotPopup
            customThumbnail={
              <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
                Statistics Page
              </div>
            }
            fullImageSrc="/statistics.png"
            altText="Statistics Page"
            
          />
          <ScreenshotPopup
            customThumbnail={
              <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
                Receipt Print Preview
              </div>
            }
            fullImageSrc="/receipt_preview.png"
            altText="Receipt Print Preview"
            //imageClassName="scale-50"
            imageWidth={375}
          />
        </div>

        <div className="mt-10 flex flex-col items-center animate-fade-in delay-300">
          <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-2">
            Have questions or want to get in touch?
          </p>
            <a
            href="mailto:talebelergfc@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#ffffff] to-[#8d8d8d] dark:from-[#232323] dark:to-[#444444] text-black dark:text-white font-semibold shadow hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
            </svg>
            Contact Us: talebelergfc@gmail.com
            </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 flex flex-col items-center gap-2 bg-background dark:bg-[#181818] border-t border-gray-200 dark:border-gray-700 animate-fade-in">
        <a
          href="https://github.com/Tsunari/KermesPOS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline hover:underline-offset-4"
        >
          <GitHubIcon className="w-4 h-4" style={{ fontSize: 18 }} />
          View on GitHub
        </a>
        <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Kermes POS. All rights reserved.</span>
      </footer>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.2s infinite cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}
