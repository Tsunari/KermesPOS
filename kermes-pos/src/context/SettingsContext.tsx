import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Settings = {
  useDoubleClick: boolean;
  notifications: boolean;
  security: boolean;
  appearance: boolean;
  autoBackup: boolean;
  showDescription: boolean;
  showScrollbars: boolean;
  showPageScrollbars: boolean;
  showComponentScrollbars: boolean;
};

type SettingsContextType = {
  useDoubleClick: boolean;
  setUseDoubleClick: (value: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  security: boolean;
  setSecurity: (value: boolean) => void;
  appearance: boolean;
  setAppearance: (value: boolean) => void;
  autoBackup: boolean;
  setAutoBackup: (value: boolean) => void;
  showDescription: boolean;
  setShowDescription: (value: boolean) => void;
  showScrollbars: boolean;
  setShowScrollbars: (value: boolean) => void;
  showPageScrollbars: boolean;
  setShowPageScrollbars: (value: boolean) => void;
  showComponentScrollbars: boolean;
  setShowComponentScrollbars: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      useDoubleClick: false,
      notifications: true,
      security: false,
      appearance: false,
      autoBackup: false,
      showDescription: false,
      showScrollbars: true,
      showPageScrollbars: false,
      showComponentScrollbars: true,
    };
  });

  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        useDoubleClick: settings.useDoubleClick,
        setUseDoubleClick: (value) => updateSetting('useDoubleClick', value),
        notifications: settings.notifications,
        setNotifications: (value) => updateSetting('notifications', value),
        security: settings.security,
        setSecurity: (value) => updateSetting('security', value),
        appearance: settings.appearance,
        setAppearance: (value) => updateSetting('appearance', value),
        autoBackup: settings.autoBackup,
        setAutoBackup: (value) => updateSetting('autoBackup', value),
        showDescription: settings.showDescription,
        setShowDescription: (value) => updateSetting('showDescription', value),
        showScrollbars: settings.showScrollbars,
        setShowScrollbars: (value) => updateSetting('showScrollbars', value),
        showPageScrollbars: settings.showPageScrollbars,
        setShowPageScrollbars: (value) => updateSetting('showPageScrollbars', value),
        showComponentScrollbars: settings.showComponentScrollbars,
        setShowComponentScrollbars: (value) => updateSetting('showComponentScrollbars', value),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};