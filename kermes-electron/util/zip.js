import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const electronDir = path.join(__dirname, '..');
const buildDir = path.join(electronDir, 'build');
const distDir = path.join(electronDir, 'dist');

try {
  console.log(`[Zip] Compressing ${buildDir} into ${distDir}/frontend-update.zip...`);
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const zip = new AdmZip();
  // addLocalFolder automatically maps all nested files using standard forward slashes (/)
  zip.addLocalFolder(buildDir);
  
  const zipPath = path.join(distDir, 'frontend-update.zip');
  zip.writeZip(zipPath);
  console.log(`[Zip] Frontend zip created successfully: ${zipPath}`);
} catch (err) {
  console.error('[Zip] Failed to create zip file:', err);
  process.exit(1);
}
