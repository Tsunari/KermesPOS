import React, { createContext, useContext, useState } from 'react';

// Define the shape of your global variables here
export interface VariableContextType {
  kursName: string;
  setKursName: (name: string) => void;
  // Add more variables and setters as needed
}

const defaultValues: VariableContextType = {
  kursName: 'Münih Fatih Kermes',
  setKursName: () => {},
  // Add more default values as needed
};

export const VariableContext = createContext<VariableContextType>(defaultValues);

export const VariableContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add more variables here as needed
  const [kursName, setKursName] = useState<string>(
    localStorage.getItem('kursName') || 'Münih Fatih Kermes'
  );

  // Save kursName to localStorage on change
  const handleSetKursName = (name: string) => {
    setKursName(name);
    localStorage.setItem('kursName', name);
  };

  // Add more state and handlers as needed
  return (
    <VariableContext.Provider value={{
      kursName,
      setKursName: handleSetKursName,
      // Add more variables and setters here
    }}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariableContext = () => useContext(VariableContext);
