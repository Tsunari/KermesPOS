import { CartItem, Product } from '../types/index';

export interface CartTransaction {
    id: number;
    transaction_date: string;
    total_amount: number;
    items_count: number;
    items_data: string;
    payment_method: string;
}

interface DailyStats {
    date: string;
    transaction_count: number;
    total_revenue: number;
    total_items: number;
}

interface CategoryStats {
    categories: string;
    count: number;
}

export interface ProductStats {
    product: Product;
    count: number;
    revenue: number;
}

export interface DateRangeStats {
    totalRevenue: number;
    totalItems: number;
    transactionCount: number;
    productStats: ProductStats[];
}

class CartTransactionService {
    private db: IDBDatabase | null = null;
    private dbName = 'kermes_pos';
    private storeName = 'transactions';

    constructor() {
        this.initDB();
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error('Error opening database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('transaction_date', 'transaction_date', { unique: false });
                }
            };
        });
    }

    async saveTransaction(cartItems: CartItem[], totalAmount: number, paymentMethod: string): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const itemsData = JSON.stringify(cartItems);
            const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            const transactionData = {
                transaction_date: new Date().toISOString(),
                total_amount: totalAmount,
                items_count: itemsCount,
                items_data: itemsData,
                payment_method: paymentMethod
            };

            const request = store.add(transactionData);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getTransactions(): Promise<CartTransaction[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDailyStats(): Promise<DailyStats[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const transactions = request.result;
                const stats = new Map<string, DailyStats>();

                transactions.forEach((tx: CartTransaction) => {
                    const date = new Date(tx.transaction_date).toISOString().split('T')[0];
                    if (!stats.has(date)) {
                        stats.set(date, {
                            date,
                            transaction_count: 0,
                            total_revenue: 0,
                            total_items: 0
                        });
                    }
                    const stat = stats.get(date)!;
                    stat.transaction_count++;
                    stat.total_revenue += tx.total_amount;
                    stat.total_items += tx.items_count;
                });

                resolve(Array.from(stats.values()).sort((a, b) => b.date.localeCompare(a.date)));
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getCategoryStats(): Promise<CategoryStats[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const transactions = request.result;
                const stats = new Map<string, number>();

                transactions.forEach((tx: CartTransaction) => {
                    const items = JSON.parse(tx.items_data) as CartItem[];
                    items.forEach(item => {
                        const category = item.product.category;
                        stats.set(category, (stats.get(category) || 0) + item.quantity);
                    });
                });

                resolve(Array.from(stats.entries()).map(([categories, count]) => ({
                    categories,
                    count
                })).sort((a, b) => b.count - a.count));
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Export all transactions as CSV
    async exportTransactionsAsCSV(): Promise<void> {
        const transactions = await this.getTransactions();
        if (!transactions.length) {
            alert('No transactions to export.');
            return;
        }
        const header = [
            'ID', 'Date', 'Total Amount', 'Items Count', 'Items Data', 'Payment Method'
        ];
        const rows = transactions.map(tx => [
            tx.id,
            tx.transaction_date,
            tx.total_amount,
            tx.items_count,
            tx.items_data.replace(/"/g, '""'),
            tx.payment_method
        ]);
        const csvContent = [header, ...rows]
            .map(row => row.map(String).map(val => `"${val}"`).join(','))
            .join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Clear all transactions from IndexedDB
    async clearAllTransactions(): Promise<void> {
        if (!window.confirm('Are you sure you want to delete all transaction data? This cannot be undone.')) return;
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).clear();
            tx.oncomplete = () => {
                window.location.reload();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    async deleteTransaction(id: number): Promise<void> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateTransaction(id: number, updates: Partial<CartTransaction>): Promise<void> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const transaction = getRequest.result;
                if (!transaction) {
                    reject(new Error('Transaction not found'));
                    return;
                }
                const updated = { ...transaction, ...updates };
                const putRequest = store.put(updated);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Get product statistics for a specific date range
     * @param startDate - Start of the date range (inclusive)
     * @param endDate - End of the date range (inclusive)
     * @param productId - Optional: Filter by specific product ID
     * @param products - Array of all products for reference
     */
    async getProductStatsByDateRange(
        startDate: Date,
        endDate: Date,
        products: Product[],
        productId?: string
    ): Promise<DateRangeStats> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const transactions = request.result;
                
                // Normalize dates to compare (start of day)
                const startTime = new Date(startDate);
                startTime.setHours(0, 0, 0, 0);
                const endTime = new Date(endDate);
                endTime.setHours(23, 59, 59, 999);

                // Filter transactions by date range
                const filteredTransactions = transactions.filter((tx: CartTransaction) => {
                    const txDate = new Date(tx.transaction_date);
                    return txDate >= startTime && txDate <= endTime;
                });

                // Calculate product stats
                const productStatsMap = new Map<string, ProductStats>();
                let totalRevenue = 0;
                let totalItems = 0;
                const transactionCount = filteredTransactions.length;

                filteredTransactions.forEach((tx: CartTransaction) => {
                    totalRevenue += tx.total_amount;
                    
                    try {
                        const items = JSON.parse(tx.items_data) as CartItem[];
                        items.forEach((item: CartItem) => {
                            // If productId filter is specified, only include that product
                            if (productId && item.product.id !== productId) {
                                return;
                            }

                            const product = products.find(p => p.id === item.product.id);
                            if (product) {
                                totalItems += item.quantity;
                                
                                const existing = productStatsMap.get(product.id);
                                if (existing) {
                                    existing.count += item.quantity;
                                    existing.revenue += item.quantity * product.price;
                                } else {
                                    productStatsMap.set(product.id, {
                                        product,
                                        count: item.quantity,
                                        revenue: item.quantity * product.price
                                    });
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error parsing transaction items:', error);
                    }
                });

                const productStats = Array.from(productStatsMap.values())
                    .sort((a, b) => b.revenue - a.revenue);

                resolve({
                    totalRevenue,
                    totalItems,
                    transactionCount,
                    productStats
                });
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get transactions within a date range
     */
    async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<CartTransaction[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const transactions = request.result;
                
                const startTime = new Date(startDate);
                startTime.setHours(0, 0, 0, 0);
                const endTime = new Date(endDate);
                endTime.setHours(23, 59, 59, 999);

                const filtered = transactions.filter((tx: CartTransaction) => {
                    const txDate = new Date(tx.transaction_date);
                    return txDate >= startTime && txDate <= endTime;
                });

                resolve(filtered);
            };

            request.onerror = () => reject(request.error);
        });
    }
}

export const cartTransactionService = new CartTransactionService();