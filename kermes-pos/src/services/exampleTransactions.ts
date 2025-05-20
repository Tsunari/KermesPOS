// Example: Array of many CartTransaction objects for testing/demo
// Save as: kermes-pos/exampleTransactions/exampleTransactions.ts

import { CartTransaction } from "./cartTransactionService";

export const exampleTransactions: CartTransaction[] = [
  {
    id: 1,
    transaction_date: '2025-05-20T10:15:00.000Z',
    total_amount: 25.50,
    items_count: 3,
    items_data: JSON.stringify([
      { product: { id: 'p1', name: 'Börek', price: 5, category: 'food' }, quantity: 2 },
      { product: { id: 'p2', name: 'Baklava', price: 7, category: 'food' }, quantity: 1 }
    ]),
    payment_method: 'cash'
  },
  {
    id: 2,
    transaction_date: '2025-05-20T11:00:00.000Z',
    total_amount: 12.00,
    items_count: 2,
    items_data: JSON.stringify([
      { product: { id: 'p3', name: 'Çay', price: 2, category: 'drink' }, quantity: 2 },
      { product: { id: 'p4', name: 'Kola', price: 4, category: 'drink' }, quantity: 1 }
    ]),
    payment_method: 'card'
  },
  {
    id: 3,
    transaction_date: '2025-05-18T12:30:00.000Z',
    total_amount: 30.00,
    items_count: 4,
    items_data: JSON.stringify([
      { product: { id: 'p5', name: 'Kebap', price: 10, category: 'food' }, quantity: 3 },
      { product: { id: 'p6', name: 'Ayran', price: 2, category: 'drink' }, quantity: 1 }
    ]),
    payment_method: 'cash'
  },
  {
    id: 4,
    transaction_date: '2025-05-17T09:45:00.000Z',
    total_amount: 18.00,
    items_count: 2,
    items_data: JSON.stringify([
      { product: { id: 'p7', name: 'Simit', price: 3, category: 'food' }, quantity: 2 },
      { product: { id: 'p8', name: 'Su', price: 1, category: 'drink' }, quantity: 2 },
      { product: { id: 'p9', name: 'Tatlı', price: 5, category: 'food' }, quantity: 1 }
    ]),
    payment_method: 'cash'
  },
  // ...add more transactions for a huge dataset...
  ...Array.from({ length: 162 }, (_, i) => ({
    id: 5 + i,
    transaction_date: `2025-05-19T${String(10 + (i % 10)).padStart(2, '0')}:${String(10 + (i * 3) % 60).padStart(2, '0')}:00.000Z`,
    total_amount: 10 + (i % 5) * 5,
    items_count: 1 + (i % 4),
    items_data: JSON.stringify([
      { product: { id: `p${10 + i}`, name: `Ürün ${i + 1}`, price: 2 + (i % 7), category: i % 2 === 0 ? 'food' : 'drink' }, quantity: 1 + (i % 3) }
    ]),
    payment_method: i % 2 === 0 ? 'cash' : 'card'
  }))
];

// Prepare statistics data from exampleTransactions

export interface TransactionStatistics {
  totalTransactions: number;
  totalRevenue: number;
  paymentMethodCounts: Record<string, number>;
  itemsSoldCount: number;
  categoryTotals: Record<string, number>;
}

export function getTransactionStatistics(transactions: CartTransaction[]): TransactionStatistics {
  let totalRevenue = 0;
  let itemsSoldCount = 0;
  const paymentMethodCounts: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  transactions.forEach(tx => {
    totalRevenue += tx.total_amount;
    itemsSoldCount += tx.items_count;
    paymentMethodCounts[tx.payment_method] = (paymentMethodCounts[tx.payment_method] || 0) + 1;

    try {
      const items = JSON.parse(tx.items_data) as Array<{ product: { category: string }, quantity: number }>;
      items.forEach(item => {
        const cat = item.product.category;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
      });
    } catch {
      // ignore parse errors
    }
  });

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    paymentMethodCounts,
    itemsSoldCount,
    categoryTotals
  };
}

// Example usage:
// const stats = getTransactionStatistics(exampleTransactions);