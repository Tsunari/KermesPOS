export type POSAccount = {
  id: string;
  email: string;
  role: string;
  kermesId: string;
  kermesName: string;
  createdAt: string;
  status?: "active" | "suspended";
};

export type SyncedSession = {
  id: string;
  kermesId: string;
  kermesName: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  totalRevenue: number;
  totalOrders: number;
  itemsCount: number;
  categoryAggregates?: Record<string, { count: number; revenue: number }>;
  paymentAggregates?: {
    cash: { count: number; revenue: number };
    card: { count: number; revenue: number };
  };
  hourlyAggregates?: Record<string, { orders: number; revenue: number }>;
  productRankings?: Array<{ id: string; name: string; count: number; revenue: number }>;
  syncedAt: string;
  syncedBy: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  category: string;
};

export type LiveSale = {
  id: string;
  kermesId: string;
  kermesName: string;
  sessionId: string;
  transactionDate: string;
  totalAmount: number;
  itemsCount: number;
  items?: CartItem[];
  paymentMethod: string;
  syncedAt: string;
};
