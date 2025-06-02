"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ForkRightOutlinedIcon from '@mui/icons-material/ForkRightOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import ScreenshotPopup from "../components/ScreenshotPopup";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import RemoteMarkdown from "../components/RemoteMarkdown";

export default function Home() {
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState<"todo" | "changelog" | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/Tsunari/KermesPOS/releases/latest")
      .then((res) => res.json())
      .then((data) => {
        type GithubAsset = {
          name: string;
          browser_download_url: string;
        };
        const asset = (data.assets as GithubAsset[] | undefined)?.find((a) =>
          /\.(exe|msi|zip|AppImage|dmg)$/i.test(a.name)
        );
        if (asset) {
          setDownloadUrl(asset.browser_download_url);
        }
      })
      .catch(error => {
        console.error("Error fetching latest release from GitHub:", error);
      });
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!downloadUrl) return;
    setIsLoading(true);
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
          src="/Mintika.svg"
          alt="Kermes POS Logo"
          width={200}
          height={200}
          className="mb-8 mt-6 drop-shadow-lg animate-fade-in dark:invert"
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
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-black to-white dark:from-white dark:to-black shadow-md">
              <svg className="w-5 h-5 animate-bounce-slow text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0l-4-4m4 4l4-4" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
              </svg>
            </span>
            {isLoading ? "Downloading..." : (downloadUrl ? "Download Latest Release" : "Fetching Release...")}
          </span>
        </button>
        <div className="h-4" />
        <button
          onClick={() => window.open("https://kermesprogram.web.app/", "_blank", "noopener,noreferrer")}
          className="relative group inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full cursor-pointer"
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
          {/* Feature 1: Lightning Fast */}
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-100">
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shadow-md">
              <BoltOutlinedIcon className="text-black dark:text-white" sx={{ fontSize: '30px' }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
            <p>Instant checkout, blazing performance, and smooth UI for busy events and shops.</p>
          </div>
          {/* Feature 2: Works Offline */}
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-200">
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shadow-md">
              <CloudOffOutlinedIcon className="text-black dark:text-white" sx={{ fontSize: '30px' }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
            <p>All sales and statistics are saved locally. No internet required for daily use.</p>
          </div>
          {/* Feature 3: Export & Analytics */}
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-300">
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shadow-md">
              <DownloadOutlinedIcon className="text-black dark:text-white" sx={{ fontSize: '30px' }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Export & Analytics</h3>
            <p>Export sales to CSV, view beautiful statistics, and manage your data easily.</p>
          </div>
          {/* Feature 4: Open Source */}
          <div className="p-6 rounded-xl bg-white/80 dark:bg-black/40 shadow-lg flex flex-col items-center text-center animate-fade-in delay-400">
            <span className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shadow-md">
              <ForkRightOutlinedIcon className="text-black dark:text-white" sx={{ fontSize: '30px' }} />
            </span>
            <h3 className="font-semibold text-lg mb-2">Open Source</h3>
            <p>Free, transparent, and customizable. Contribute or adapt for your needs.</p>
          </div>
        </div>
      </section>

      {/* Project Info Section with Popups */}
      <section className="py-12 px-4 sm:px-8 bg-background dark:bg-[#181818] transition-colors duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 animate-fade-in">Project Info</h2>
        <div className="flex flex-col items-center">
          <List className="w-full max-w-md bg-white/80 dark:bg-black/40 rounded-2xl shadow-xl divide-y divide-gray-200 dark:divide-gray-800">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setOpen("todo")}
                sx={{ alignItems: 'flex-start', py: 2.2, px: 3, borderRadius: '16px 16px 0 0' }}
              >
                <ListItemIcon sx={{ mt: 0.5, minWidth: 44 }}>
                  <AssignmentIcon className="text-black dark:text-white" fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={<span className="font-semibold text-base sm:text-lg text-black dark:text-white">Project TODO</span>}
                  secondary={<span className="block text-[1.05rem] text-gray-700 dark:text-gray-300 mt-1 leading-snug">See what’s planned and in progress for Kermes POS.</span>}
                  sx={{ my: 0, '.MuiListItemText-secondary': { fontWeight: 500, lineHeight: 1.5 } }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setOpen("changelog")}
                sx={{ alignItems: 'flex-start', py: 2.2, px: 3, borderRadius: '0 0 16px 16px' }}
              >
                <ListItemIcon sx={{ mt: 0.5, minWidth: 44 }}>
                  <HistoryIcon className="text-black dark:text-white" fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={<span className="font-semibold text-base sm:text-lg text-black dark:text-white">Changelog</span>}
                  secondary={<span className="block text-[1.05rem] text-gray-700 dark:text-gray-300 mt-1 leading-snug">Read the latest updates and release notes.</span>}
                  sx={{ my: 0, '.MuiListItemText-secondary': { fontWeight: 500, lineHeight: 1.5 } }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </div>
        {/* Dialogs for Project Info */}
        <Dialog open={open === "todo"} onClose={() => setOpen(null)} maxWidth="md" fullWidth PaperProps={{
          sx: (theme) => ({
            borderRadius: 4, boxShadow: 12, p: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(ellipse at top left, #23272f 60%, #181818 100%)'
              : 'radial-gradient(ellipse at top left, #fffbe7 60%, #f7f7f7 100%)',
            maxHeight: '90vh', color: theme.palette.text.primary, transition: 'background 0.3s',
          })
        }}>
          <div className="relative flex flex-col" style={{ minHeight: 400 }}>
            <IconButton onClick={() => setOpen(null)} sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: (theme) => theme.palette.action.hover } }} aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
            <h2 className="text-2xl font-bold mb-2 mt-8 text-center">Project TODO</h2>
            <div className="flex-1 overflow-auto px-0 sm:px-6 pb-6 pt-2">
              <RemoteMarkdown url="https://raw.githubusercontent.com/Tsunari/KermesPOS/main/TODO.md" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }} />
            </div>
          </div>
        </Dialog>
        <Dialog open={open === "changelog"} onClose={() => setOpen(null)} maxWidth="md" fullWidth PaperProps={{
          sx: (theme) => ({
            borderRadius: 4, boxShadow: 12, p: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(ellipse at top left, #23272f 60%, #181818 100%)'
              : 'radial-gradient(ellipse at top left, #fff3e0 60%, #f7f7f7 100%)',
            maxHeight: '90vh', color: theme.palette.text.primary, transition: 'background 0.3s',
          })
        }}>
          <div className="relative flex flex-col" style={{ minHeight: 400 }}>
            <IconButton onClick={() => setOpen(null)} sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: (theme) => theme.palette.action.hover } }} aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
            <h2 className="text-2xl font-bold mb-2 mt-8 text-center">Changelog</h2>
            <div className="flex-1 overflow-auto px-0 sm:px-6 pb-6 pt-2">
              <RemoteMarkdown url="https://raw.githubusercontent.com/Tsunari/KermesPOS/main/CHANGELOG.md" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }} />
            </div>
          </div>
        </Dialog>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
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
          <GitHubIcon sx={{ fontSize: '1.125rem' }} />
          View on GitHub
        </a>
        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Kermes POS. All rights reserved.</span>
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