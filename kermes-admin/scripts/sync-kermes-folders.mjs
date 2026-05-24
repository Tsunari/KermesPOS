import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAAm-0IYvRfBivW1qYSWo5m_Gcdg_CWVw",
  authDomain: "kermesprogram.firebaseapp.com",
  projectId: "kermesprogram",
  storageBucket: "kermesprogram.firebasestorage.app",
  messagingSenderId: "828348520479",
  appId: "1:828348520479:web:1fc8e6f74f8eaab395dd2a",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KERMESES_ROOT = path.resolve(__dirname, "../../kermes-menu/public/kermeses");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".mp4", ".webm", ".mov"]);

function toPosix(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

async function listDirectories(rootPath) {
  const entries = await readdir(rootPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function listSponsorImages(folderName) {
  const sponsorPath = path.join(KERMESES_ROOT, folderName, "sponsor");

  try {
    const entries = await readdir(sponsorPath, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((fileName) => `/kermeses/${folderName}/sponsor/${toPosix(fileName)}`);
  } catch {
    return [];
  }
}

async function listAvailableImages(folderName) {
  const folderPath = path.join(KERMESES_ROOT, folderName);
  try {
    const entries = await readdir(folderPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((fileName) => `/kermeses/${folderName}/${toPosix(fileName)}`);
  } catch {
    return [];
  }
}

async function syncKermesFolders() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const folderNames = await listDirectories(KERMESES_ROOT);

  if (folderNames.length === 0) {
    console.log("No folders found under kermes-menu/public/kermeses.");
    return;
  }

  let syncedCount = 0;

  for (const folderName of folderNames) {
    const sponsorImages = await listSponsorImages(folderName);
    const availableImages = await listAvailableImages(folderName);

    await setDoc(
      doc(db, "kermesFolders", folderName),
      {
        label: folderName,
        assetFolder: `/kermeses/${folderName}`,
        sponsorImages,
        availableImages,
      },
      { merge: true }
    );

    syncedCount += 1;
    console.log(`Synced folder: ${folderName} (${sponsorImages.length} sponsor images, ${availableImages.length} main assets)`);
  }

  console.log(`Done. Synced ${syncedCount} folder records to Firestore collection kermesFolders.`);
}

syncKermesFolders().catch((error) => {
  console.error("Failed to sync kermes folders:", error);
  process.exitCode = 1;
});
