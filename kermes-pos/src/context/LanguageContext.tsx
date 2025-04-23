import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../localization/en.json';
import de from '../localization/de.json';
import tr from '../localization/tr.json';

export type Language = 'en' | 'de' | 'tr';

interface Translation {
  common: {
    settings: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    active: string;
    configure: string;
  };
  settings: {
    title: string;
    appearance: {
      title: string;
      darkMode: string;
      darkModeDescription: string;
      pageScrollbars: string;
      pageScrollbarsDescription: string;
      componentScrollbars: string;
      componentScrollbarsDescription: string;
    };
    language: {
      title: string;
      selectLanguage: string;
      languages: {
        en: string;
        de: string;
        tr: string;
      };
    };
    notifications: {
      title: string;
      enable: string;
      description: string;
    };
    security: {
      title: string;
      enable: string;
      description: string;
    };
    backup: {
      title: string;
      autoBackup: string;
      description: string;
    };
    developer: {
      title: string;
      devMode: string;
      devModeDescription: string;
      defineDefault: string;
      defineDefaultDescription: string;
      defineDefaultSuccess: string;
    };
    doubleClick: string;
    doubleClickDescription: string;
    showDescription: string;
    showDescriptionDescription: string;
    about: {
      title: string;
      description: string;
      version: string;
    };
  };
  products: {
    title: string;
    add: string;
    edit: string;
    delete: string;
    name: string;
    price: string;
    description: string;
    category: string;
    stock: string;
    barcode: string;
    image: string;
    actions: string;
    noProducts: string;
    searchPlaceholder: string;
  };
  sales: {
    title: string;
    newSale: string;
    addToCart: string;
    removeFromCart: string;
    cart: string;
    total: string;
    subtotal: string;
    tax: string;
    discount: string;
    payment: string;
    cash: string;
    card: string;
    complete: string;
    receipt: string;
    print: string;
    noItems: string;
  };
  reports: {
    title: string;
    daily: string;
    weekly: string;
    monthly: string;
    custom: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    totalSales: string;
    totalProducts: string;
    averageSale: string;
    topProducts: string;
    export: string;
  };
  printer: {
    title: string;
    selectPrinter: string;
    paperWidth: string;
    fontSize: string;
    bold: string;
    saveSettings: string;
    success: string;
    error: string;
  };
}

const translations: Record<Language, Translation> = {
  en,
  de,
  tr,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 