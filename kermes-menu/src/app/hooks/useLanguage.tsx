"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../../localization/en.json';
import tr from '../../localization/tr.json';
import de from '../../localization/de.json';

const translations: Record<string, any> = { en, tr, de };

interface LanguageContextType {
  lang: 'en' | 'tr' | 'de';
  setLang: (lang: 'en' | 'tr' | 'de') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'tr',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<'en' | 'tr' | 'de'>('tr');

  useEffect(() => {
    // Only apply a saved preference if the user explicitly set one before.
    // Default is always Turkish — no browser auto-detection.
    const saved = localStorage.getItem('menu.lang');
    if (saved === 'en' || saved === 'tr' || saved === 'de') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: 'en' | 'tr' | 'de') => {
    setLangState(newLang);
    localStorage.setItem('menu.lang', newLang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let val: any = translations[lang];
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = val[k];
      } else {
        return key;
      }
    }
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
