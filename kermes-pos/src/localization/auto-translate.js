// auto-translate.js
// Node.js script to scan for translation keys, add missing keys, and auto-translate using Google Translate API (free, unofficial)
// Usage: node --experimental-modules auto-translate.js

import fs from 'fs';
import path from 'path';
import { translate as googleTranslate } from '@vitalets/google-translate-api';
import * as deepl from 'deepl-node';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALE_DIR = __dirname;
const SRC_DIR = path.resolve(LOCALE_DIR, '..');

const LANGS = ['en', 'tr', 'de'];

// DeepL Translator setup
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const translator = new deepl.Translator(DEEPL_API_KEY, { serverUrl: 'https://api-free.deepl.com/v2' });

// 1. Recursively get all source files in the codebase (no glob needed)
function getAllSourceFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Find all translation keys in the codebase (t('...'))
function findAllKeys() {
  const files = getAllSourceFiles(SRC_DIR);
  // console.log('Scanning files:', files); // Debug output
  const keyRegex = /t\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  const keys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content))) {
      keys.add(match[1]);
    }
  }
  // console.log('Found translation keys:', Array.from(keys)); // Debug output
  return Array.from(keys);
}

// 2. Load all locale files
function loadLocales() {
  const locales = {};
  for (const lang of LANGS) {
    const file = path.join(LOCALE_DIR, `${lang}.json`);
    locales[lang] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return locales;
}

// 3. Save all locale files
function saveLocales(locales) {
  for (const lang of LANGS) {
    const file = path.join(LOCALE_DIR, `${lang}.json`);
    fs.writeFileSync(file, JSON.stringify(locales[lang], null, 2));
  }
}

// 4. Set nested key in object (e.g. 'app.statistics.title')
function setNested(obj, key, value) {
  const parts = key.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = value;
}

// 5. Get nested key in object
function getNested(obj, key) {
  const value = key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  // Treat empty string or null as missing
  return value === '' || value === null ? undefined : value;
}

function getMissingTranslationKeys(keys, locales) {
  const missing = {};
  for (const lang of LANGS) {
    missing[lang] = [];
    for (const key of keys) {
      if (getNested(locales[lang], key) === undefined) {
        missing[lang].push(key);
      }
    }
  }
  return missing;
}

// Main
async function main() {
  let keys = findAllKeys();
  // Filter out obviously invalid keys (e.g., single letters, empty, or no dot)
  keys = keys.filter(k => k && k.length > 2 && k.includes('.'));
  // Remove unwanted keys
  const unwanted = [
    '.MuiSwitch-root',
    '.MuiIconButton-root',
    'app.product.categories.${category}', // treat as string, not template
    '...',
    'No transactions to export.'
  ];
  keys = keys.filter(k => !unwanted.includes(k));
  const locales = loadLocales();
  let changed = false;
  let missingKeys = [];
  const missing = getMissingTranslationKeys(keys, locales);
  // Print missing keys in red color
  console.log('\x1b[31m%s\x1b[0m', JSON.stringify(missing, null, 2));

  for (const key of keys) {
    // Extract the last word after the last dot
    const lastWord = key.split('.').pop();
    // Convert camelCase or PascalCase to spaced, capitalized string
    const spaced = lastWord
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/^./, s => s.toUpperCase());
    // English: only set if missing
    if (getNested(locales['en'], key) === undefined) {
      setNested(locales['en'], key, spaced);
      changed = true;
    }
    // Other languages: only set if missing
    for (const lang of LANGS) {
      if (lang === 'en') continue;
      if (getNested(locales[lang], key) === undefined) {
        try {
          // Try Google Translate first
          const res = await googleTranslate(spaced, { to: lang });
          setNested(locales[lang], key, res.text);
          console.log(`Auto-translated '${spaced}' to [${lang}] (Google): ${res.text}`);
          changed = true;
        } catch (e) {
          if (e && e.message && e.message.match(/429|too many requests|rate limit/i)) {
            // Fallback to DeepL
            try {
              let deeplLang = lang.toUpperCase();
              if (deeplLang === 'TR') deeplLang = 'TR';
              if (deeplLang === 'DE') deeplLang = 'DE';
              const res = await translator.translateText(spaced, null, deeplLang);
              setNested(locales[lang], key, res.text);
              console.log(`Auto-translated '${spaced}' to [${lang}] (DeepL): ${res.text}`);
              changed = true;
            } catch (deeplErr) {
              console.error(`DeepL also failed for '${spaced}' to [${lang}]`, deeplErr);
            }
          } else {
            console.error(`Failed to translate '${spaced}' to [${lang}]`, e);
          }
        }
      }
    }
  }
  if (changed) {
    saveLocales(locales);
    console.log('Locales updated!');
    if (missingKeys.length) {
      console.log('Added or translated keys:', missingKeys);
    }
  } else {
    console.log('No changes needed.');
  }
}

main();

