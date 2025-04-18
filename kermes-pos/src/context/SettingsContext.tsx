import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  useDoubleClick: boolean;
  setUseDoubleClick: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [useDoubleClick, setUseDoubleClick] = useState(true);

  return (
    <SettingsContext.Provider value={{ useDoubleClick, setUseDoubleClick }}>
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