// auto-translate.js
// Node.js script to scan for translation keys, add missing keys, and auto-translate using Google Translate API (free, unofficial)
// Usage: node auto-translate.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const translate = require('@vitalets/google-translate-api');

const LANGS = ['en', 'tr', 'de'];
const LOCALE_DIR = path.join(__dirname);
const FILES = LANGS.map(lang => path.join(LOCALE_DIR, `${lang}.json`));

// 1. Find all translation keys in the codebase (t('...'))
function findAllKeys() {
  const files = glob.sync(path.join(__dirname, '../src/**/*.{ts,tsx,js,jsx}'));
  // Improved regex: allow spaces and more characters inside the key
  const keyRegex = /t\(["'`]([\w\d_.\- ]+)["'`]/g;
  const keys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content))) {
      keys.add(match[1]);
    }
  }
  console.log('Found translation keys:', Array.from(keys)); // Debug output
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

async function main() {
  const keys = findAllKeys();
  const locales = loadLocales();
  let changed = false;
  let missingKeys = [];

  for (const key of keys) {
    // English: use key as fallback value
    const enVal = getNested(locales['en'], key);
    if (enVal === undefined || enVal === "") {
      setNested(locales['en'], key, key);
      changed = true;
    }
    // Other languages: auto-translate if missing or empty
    for (const lang of LANGS) {
      if (lang === 'en') continue;
      const val = getNested(locales[lang], key);
      if (val === undefined || val === "") {
        try {
          const res = await translate(key, { to: lang });
          setNested(locales[lang], key, res.text);
          console.log(`Auto-translated '${key}' to [${lang}]: ${res.text}`);
          changed = true;
        } catch (e) {
          console.error(`Failed to translate '${key}' to [${lang}]`, e);
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
