import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 py-20 px-4 sm:px-8 bg-gradient-to-b from-background to-[#f7f7f7] dark:to-[#181818] transition-colors duration-500">
        <Image
          src="/Logo.png"
          alt="Kermes POS Logo"
          width={96}
          height={96}
          className="mb-6 drop-shadow-lg animate-fade-in"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center animate-slide-down">
          Kermes POS
        </h1>
        <p className="text-lg sm:text-xl text-center max-w-2xl mb-8 animate-fade-in delay-100">
          The modern, open-source Point of Sale app for events, cafes, and small businesses. Fast, beautiful, and works offline. Built with Electron, React, and love.
        </p>
        <a
          href="https://github.com/Tsunari/KermesPOS/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ffb347] to-[#ffcc33] blur opacity-70 group-hover:opacity-100 transition-all duration-300 animate-pulse"></span>
          <span className="relative z-10 flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background font-semibold text-lg shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Download Latest Release
          </span>
        </a>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-8 bg-background dark:bg-[#181818] transition-colors duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 animate-fade-in">Features</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-100">
            <Image src="/next.svg" alt="Fast" width={48} height={48} className="mb-3 dark:invert" />
            <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
            <p>Instant checkout, blazing performance, and smooth UI for busy events and shops.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-200">
            <Image src="/window.svg" alt="Offline" width={48} height={48} className="mb-3 dark:invert" />
            <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
            <p>All sales and statistics are saved locally. No internet required for daily use.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-300">
            <Image src="/file.svg" alt="Export" width={48} height={48} className="mb-3 dark:invert" />
            <h3 className="font-semibold text-lg mb-2">Export & Analytics</h3>
            <p>Export sales to CSV, view beautiful statistics, and manage your data easily.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-400">
            <Image src="/globe.svg" alt="Open Source" width={48} height={48} className="mb-3 dark:invert" />
            <h3 className="font-semibold text-lg mb-2">Open Source</h3>
            <p>Free, transparent, and customizable. Contribute or adapt for your needs.</p>
          </div>
        </div>
      </section>

      {/* Screenshots Section (placeholder) */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-b from-background to-[#f7f7f7] dark:to-[#181818] transition-colors duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 animate-fade-in">Screenshots</h2>
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto animate-fade-in delay-200">
          <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
            POS UI Screenshot
          </div>
          <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
            Statistics Page
          </div>
          <div className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center text-gray-400 text-lg font-semibold">
            Receipt Print Preview
          </div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6 animate-fade-in delay-300">More screenshots coming soon!</p>
      </section>

      {/* Footer */}
      <footer className="py-8 flex flex-col items-center gap-2 bg-background dark:bg-[#181818] border-t border-gray-200 dark:border-gray-700 animate-fade-in">
        <a
          href="https://github.com/Tsunari/KermesPOS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline hover:underline-offset-4"
        >
          <Image src="/globe.svg" alt="GitHub" width={18} height={18} className="dark:invert" />
          View on GitHub
        </a>
        <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Kermes POS. All rights reserved.</span>
      </footer>
    </div>
  );
}
