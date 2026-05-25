import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types/index';
import { CartTransaction } from '../services/cartTransactionService';

// Define the shape of your global variables here
export interface VariableContextType {
  kursName: string;
  setKursName: (name: string) => void;
  fixedGridMode: boolean;
  setFixedGridMode: (mode: boolean) => void;
  cardsPerRow: number;
  setCardsPerRow: (count: number) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  recentOrdersOpen: boolean;
  setRecentOrdersOpen: (open: boolean) => void;
  recentOrdersDockPosition: 'left' | 'right';
  setRecentOrdersDockPosition: (pos: 'left' | 'right') => void;
  editingTransaction: CartTransaction | null;
  setEditingTransaction: (tx: CartTransaction | null) => void;
}

const defaultValues: VariableContextType = {
  kursName: 'Münih Fatih',
  setKursName: () => {},
  fixedGridMode: false,
  setFixedGridMode: () => {},
  cardsPerRow: 8,
  setCardsPerRow: () => {},
  products: [],
  setProducts: () => {},
  recentOrdersOpen: false,
  setRecentOrdersOpen: () => {},
  recentOrdersDockPosition: 'left',
  setRecentOrdersDockPosition: () => {},
  editingTransaction: null,
  setEditingTransaction: () => {},
};

export const VariableContext = createContext<VariableContextType>(defaultValues);

export const VariableContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add more variables here as needed
  const [kursName, setKursName] = useState<string>(
    localStorage.getItem('kursName') || 'Münih Fatih'
  );

  const [fixedGridMode, setFixedGridModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('fixedGridMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cardsPerRow, setCardsPerRowState] = useState<number>(() => {
    const saved = localStorage.getItem('cardsPerRow');
    return saved ? parseInt(saved, 10) : 8;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrdersOpen, setRecentOrdersOpen] = useState<boolean>(false);
  const [recentOrdersDockPosition, setRecentOrdersDockPositionState] = useState<'left' | 'right'>(() => {
    const saved = localStorage.getItem('recentOrdersDockPosition');
    return (saved === 'left' || saved === 'right') ? saved : 'left';
  });
  const [editingTransaction, setEditingTransaction] = useState<CartTransaction | null>(null);

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

  const handleSetRecentOrdersDockPosition = (pos: 'left' | 'right') => {
    setRecentOrdersDockPositionState(pos);
    localStorage.setItem('recentOrdersDockPosition', pos);
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
      products,
      setProducts,
      recentOrdersOpen,
      setRecentOrdersOpen,
      recentOrdersDockPosition,
      setRecentOrdersDockPosition: handleSetRecentOrdersDockPosition,
      editingTransaction,
      setEditingTransaction,
      // Add more variables and setters here
    }}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariableContext = () => useContext(VariableContext);
