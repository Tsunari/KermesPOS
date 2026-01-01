/**
 * Session represents a Kermes event/activity period
 * Used to organize and track sales across different events
 */
export interface Session {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string; // ISO 8601 format - can be manually set for retroactive linking
  endDate?: string; // ISO 8601 format (null if ongoing) - can be manually set
  createdAt: string; // ISO 8601 format - automatic, when session was created
  updatedAt: string; // ISO 8601 format
  hasManualDateRange?: boolean; // True if user manually set dates for retroactive linking
  
  // Computed stats (not stored, calculated from transactions)
  transactionCount?: number;
  totalRevenue?: number;
  totalItems?: number;
}

export interface SessionStats {
  transactionCount: number;
  totalRevenue: number;
  totalItems: number;
  averageOrderValue: number;
  topProducts?: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface CreateSessionInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date; // Optional end date for manual date range linking
}
