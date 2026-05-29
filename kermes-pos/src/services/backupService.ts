import { Product } from '../types/index';
import { Session } from '../types/session';
import { CartTransaction, cartTransactionService } from './cartTransactionService';
import { productService } from './productService';
import { sessionService } from './sessionService';

export interface FullBackupData {
  version: string;
  timestamp: number;
  products: Product[];
  sessions: Session[];
  transactions: CartTransaction[];
}

export interface BackupMetadata {
  timestamp: number;
  productsCount: number;
  sessionsCount: number;
  transactionsCount: number;
  isAuto?: boolean;
}

class BackupService {
  private backupsKey = 'kermes_full_backups';

  /**
   * Export all system data as a structured JSON object
   */
  async exportFullBackup(): Promise<string> {
    const products = productService.getAllProducts();
    const sessions = await sessionService.getAllSessions();
    const transactions = await cartTransactionService.getTransactions();

    const data: FullBackupData = {
      version: '1.0.0',
      timestamp: Date.now(),
      products,
      sessions,
      transactions,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Validate if a JSON string matches the FullBackupData schema
   */
  validateBackupData(jsonString: string): { valid: boolean; error?: string; parsedData?: FullBackupData } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Backup must be a JSON object' };
      }
      if (!Array.isArray(data.products)) {
        return { valid: false, error: 'Backup is missing the "products" catalog array' };
      }
      if (!Array.isArray(data.sessions)) {
        return { valid: false, error: 'Backup is missing the "sessions" history array' };
      }
      if (!Array.isArray(data.transactions)) {
        return { valid: false, error: 'Backup is missing the "transactions" audit array' };
      }
      return { valid: true, parsedData: data as FullBackupData };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Malformed JSON syntax' };
    }
  }

  /**
   * Import complete system state and write to respective stores
   */
  async importFullBackup(jsonString: string): Promise<boolean> {
    const validation = this.validateBackupData(jsonString);
    if (!validation.valid || !validation.parsedData) {
      console.error('Invalid backup import:', validation.error);
      return false;
    }

    const { products, sessions, transactions } = validation.parsedData;

    try {
      // 1. Create a quick safety snapshot of current databases before overwrite
      await this.createLocalFullBackup(true);

      // 2. Restore Products to localStorage (calls sync and updates memory catalog)
      localStorage.setItem('products', JSON.stringify(products));

      // 3. Restore Sessions to IndexedDB
      await sessionService.importRawSessions(sessions);

      // 4. Restore Transactions to IndexedDB
      await cartTransactionService.importRawTransactions(transactions);

      return true;
    } catch (error) {
      console.error('Failed to import full system backup:', error);
      return false;
    }
  }

  /**
   * Create a local full system backup snapshot in localStorage (max 3 backups)
   */
  async createLocalFullBackup(isAuto: boolean = false): Promise<void> {
    try {
      const products = productService.getAllProducts();
      const sessions = await sessionService.getAllSessions();
      const transactions = await cartTransactionService.getTransactions();

      const backupsString = localStorage.getItem(this.backupsKey);
      const backups = backupsString ? JSON.parse(backupsString) : [];

      const newBackup = {
        timestamp: Date.now(),
        products,
        sessions,
        transactions,
        isAuto,
      };

      backups.unshift(newBackup);

      // Keep only 3 local backups to save localStorage space
      if (backups.length > 3) {
        backups.pop();
      }

      localStorage.setItem(this.backupsKey, JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to save local system backup:', error);
    }
  }

  /**
   * Retrieve list of all local full backups metadata
   */
  getLocalFullBackups(): BackupMetadata[] {
    try {
      const backupsString = localStorage.getItem(this.backupsKey);
      if (!backupsString) return [];
      const backups = JSON.parse(backupsString) as (FullBackupData & { isAuto?: boolean })[];
      return backups.map(b => ({
        timestamp: b.timestamp,
        productsCount: b.products?.length || 0,
        sessionsCount: b.sessions?.length || 0,
        transactionsCount: b.transactions?.length || 0,
        isAuto: b.isAuto,
      }));
    } catch (error) {
      console.error('Failed to read local full backups list:', error);
      return [];
    }
  }

  /**
   * Restore the complete system state from a local backup snapshot
   */
  async restoreFromFullBackup(timestamp: number): Promise<boolean> {
    try {
      const backupsString = localStorage.getItem(this.backupsKey);
      if (!backupsString) return false;
      const backups = JSON.parse(backupsString) as (FullBackupData)[];
      const target = backups.find(b => b.timestamp === timestamp);

      if (target) {
        // Save safety copy of current databases before doing overwrite so user can undo it
        const currentProducts = productService.getAllProducts();
        const currentSessions = await sessionService.getAllSessions();
        const currentTransactions = await cartTransactionService.getTransactions();

        // Overwrite active databases
        localStorage.setItem('products', JSON.stringify(target.products));
        await sessionService.importRawSessions(target.sessions);
        await cartTransactionService.importRawTransactions(target.transactions);

        // Update local snapshots list: replace the restored slot with current products to allow undoing!
        const updatedBackups = backups.map(b => {
          if (b.timestamp === timestamp) {
            return {
              timestamp: Date.now(),
              products: currentProducts,
              sessions: currentSessions,
              transactions: currentTransactions,
              isAuto: true,
            };
          }
          return b;
        });
        localStorage.setItem(this.backupsKey, JSON.stringify(updatedBackups));

        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to restore from local full snapshot:', error);
      return false;
    }
  }

  /**
   * Delete a local system backup snapshot
   */
  deleteLocalFullBackup(timestamp: number): void {
    try {
      const backupsString = localStorage.getItem(this.backupsKey);
      if (!backupsString) return;
      const backups = JSON.parse(backupsString) as (FullBackupData)[];
      const filtered = backups.filter(b => b.timestamp !== timestamp);
      localStorage.setItem(this.backupsKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete local full backup:', error);
    }
  }
}

export const backupService = new BackupService();
