import React, { createContext, useContext, useState } from 'react';

// Define the shape of your global variables here
export interface VariableContextType {
  kursName: string;
  setKursName: (name: string) => void;
  fixedGridMode: boolean;
  setFixedGridMode: (mode: boolean) => void;
  cardsPerRow: number;
  setCardsPerRow: (count: number) => void;
  // Add more variables and setters as needed
}

const defaultValues: VariableContextType = {
  kursName: 'Münih Fatih Kermes',
  setKursName: () => {},
  fixedGridMode: false,
  setFixedGridMode: () => {},
  cardsPerRow: 8,
  setCardsPerRow: () => {},
  // Add more default values as needed
};

export const VariableContext = createContext<VariableContextType>(defaultValues);

export const VariableContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add more variables here as needed
  const [kursName, setKursName] = useState<string>(
    localStorage.getItem('kursName') || 'Münih Fatih Kermes'
  );

  const [fixedGridMode, setFixedGridModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('fixedGridMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [cardsPerRow, setCardsPerRowState] = useState<number>(() => {
    const saved = localStorage.getItem('cardsPerRow');
    return saved ? parseInt(saved, 10) : 9; // changed from 6 to 9
  });

  // Save kursName to localStorage on change
  const handleSetKursName = (name: string) => {
    setKursName(name);
    localStorage.setItem('kursName', name);
  };

  const handleSetFixedGridMode = (mode: boolean) => {
    setFixedGridModeState(mode);
    localStorage.setItem('fixedGridMode', JSON.stringify(mode));
  };

  const handleSetCardsPerRow = (count: number) => {
    setCardsPerRowState(count);
    localStorage.setItem('cardsPerRow', count.toString());
  };

  // Add more state and handlers as needed
  return (
    <VariableContext.Provider value={{
      kursName,
      setKursName: handleSetKursName,
      fixedGridMode,
      setFixedGridMode: handleSetFixedGridMode,
      cardsPerRow,
      setCardsPerRow: handleSetCardsPerRow,
      // Add more variables and setters here
    }}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariableContext = () => useContext(VariableContext);
