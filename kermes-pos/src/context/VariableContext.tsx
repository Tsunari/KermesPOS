import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/index';
import { CartTransaction } from '../services/cartTransactionService';
import { firestoreSyncService, PlaceProfile } from '../services/firestoreSyncService';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getDb } from '../firebaseInit';

interface OnlineOrderSummary {
  id: string;
  queueNumber: string;
  items: unknown[];
  total: number;
  status: string;
  createdAt?: { seconds?: number } | null;
  updatedAt?: string;
  kermesId: string;
}

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
  // Online orders integration
  profile: PlaceProfile | null;
  setProfile: (profile: PlaceProfile | null) => void;
  onlineOrders: OnlineOrderSummary[];
  setOnlineOrders: (orders: OnlineOrderSummary[]) => void;
  onlineOrdersEnabled: boolean;
  setOnlineOrdersEnabled: (enabled: boolean) => void;
  editingOnlineOrderId: string | null;
  setEditingOnlineOrderId: (id: string | null) => void;
  importedOrderId: string | null;
  setImportedOrderId: (id: string | null) => void;
  /** The kermesId from settings/main.activeKermesId — single source of truth for all Firestore paths. */
  activeKermesId: string;
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
  profile: null,
  setProfile: () => {},
  onlineOrders: [],
  setOnlineOrders: () => {},
  onlineOrdersEnabled: false,
  setOnlineOrdersEnabled: () => {},
  editingOnlineOrderId: null,
  setEditingOnlineOrderId: () => {},
  importedOrderId: null,
  setImportedOrderId: () => {},
  activeKermesId: '',
};

export const VariableContext = createContext<VariableContextType>(defaultValues);

export const VariableContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Online pre-ordering states
  const [profile, setProfile] = useState<PlaceProfile | null>(() => {
    return firestoreSyncService.getPlaceProfile();
  });
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrderSummary[]>([]);
  const [onlineOrdersEnabled, setOnlineOrdersEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('onlineOrdersEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [editingOnlineOrderId, setEditingOnlineOrderId] = useState<string | null>(null);
  const [importedOrderId, setImportedOrderId] = useState<string | null>(null);

  /**
   * activeKermesId is fetched from Firestore settings/main.activeKermesId (set by the admin panel).
   * This is the SINGLE SOURCE OF TRUTH — used for all Firestore paths so that POS and
   * kermes-menu always operate on the same documents, regardless of profile.kermesId.
   */
  const [activeKermesId, setActiveKermesId] = useState<string>('');

  // Resolve activeKermesId from Firestore settings/main whenever the profile changes
  useEffect(() => {
    if (!profile) {
      setActiveKermesId('');
      return;
    }
    getDoc(doc(getDb(), 'settings', 'main'))
      .then((snap) => {
        if (snap.exists()) {
          setActiveKermesId(snap.data()?.activeKermesId ?? profile.kermesId ?? '');
        } else {
          setActiveKermesId(profile.kermesId ?? '');
        }
      })
      .catch(() => {
        setActiveKermesId(profile.kermesId ?? '');
      });
  }, [profile]);

  // Real-time Firestore online orders listener
  useEffect(() => {
    if (!profile || !onlineOrdersEnabled || !activeKermesId) {
      setOnlineOrders([]);
      return;
    }

    const db = getDb();

    // Subscribe to pending pre-orders for this kermes
    const q = query(
      collection(db, 'online_orders'),
      where('kermesId', '==', activeKermesId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          queueNumber: data.queueNumber ?? '',
          items: data.items ?? [],
          total: data.total ?? 0,
          status: data.status ?? 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          kermesId: data.kermesId ?? ''
        };
      });

      // Sort ascending by createdAt (first in, first out)
      orders.sort((a, b) => {
        const timeA = a.createdAt?.seconds ?? 0;
        const timeB = b.createdAt?.seconds ?? 0;
        return timeA - timeB;
      });

      setOnlineOrders(orders);
    }, (error) => {
      console.error('Firestore online_orders subscription error:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [profile, onlineOrdersEnabled, activeKermesId]);

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

  const handleSetOnlineOrdersEnabled = (enabled: boolean) => {
    setOnlineOrdersEnabledState(enabled);
    localStorage.setItem('onlineOrdersEnabled', JSON.stringify(enabled));
  };

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
      // Online orders integration
      profile,
      setProfile,
      onlineOrders,
      setOnlineOrders,
      onlineOrdersEnabled,
      setOnlineOrdersEnabled: handleSetOnlineOrdersEnabled,
      editingOnlineOrderId,
      setEditingOnlineOrderId,
      importedOrderId,
      setImportedOrderId,
      activeKermesId,
    }}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariableContext = () => useContext(VariableContext);
