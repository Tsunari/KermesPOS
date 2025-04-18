import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SettingsContextType {
  useDoubleClick: boolean;
  setUseDoubleClick: (value: boolean) => void;
  devMode: boolean;
  setDevMode: (value: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  security: boolean;
  setSecurity: (value: boolean) => void;
  appearance: boolean;
  setAppearance: (value: boolean) => void;
  language: boolean;
  setLanguage: (value: boolean) => void;
  autoBackup: boolean;
  setAutoBackup: (value: boolean) => void;
}

type Settings = {
  useDoubleClick: boolean;
  devMode: boolean;
  notifications: boolean;
  security: boolean;
  appearance: boolean;
  language: boolean;
  autoBackup: boolean;
};

const defaultSettings: Settings = {
  useDoubleClick: true,
  devMode: false,
  notifications: true,
  security: true,
  appearance: false,
  language: false,
  autoBackup: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('kermesSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('kermesSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings((prev: Settings) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{
      useDoubleClick: settings.useDoubleClick,
      setUseDoubleClick: (value) => updateSetting('useDoubleClick', value),
      devMode: settings.devMode,
      setDevMode: (value) => updateSetting('devMode', value),
      notifications: settings.notifications,
      setNotifications: (value) => updateSetting('notifications', value),
      security: settings.security,
      setSecurity: (value) => updateSetting('security', value),
      appearance: settings.appearance,
      setAppearance: (value) => updateSetting('appearance', value),
      language: settings.language,
      setLanguage: (value) => updateSetting('language', value),
      autoBackup: settings.autoBackup,
      setAutoBackup: (value) => updateSetting('autoBackup', value),
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 