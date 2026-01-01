import { Session, CreateSessionInput } from '../types/session';

export class SessionService {
  private db: IDBDatabase | null = null;
  private dbName = 'kermes_pos';
  private sessionStoreName = 'sessions';
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't await in constructor, store promise instead
    this.initPromise = this.initDB();
  }

  /**
   * Check if a date range overlaps with any existing session's manual date range
   * @param startDate Start date of the range to check
   * @param endDate End date of the range to check (optional)
   * @param excludeSessionId Session ID to exclude from check (for editing)
   * @returns The conflicting session if found, null otherwise
   */
  async checkDateRangeOverlap(
    startDate: Date,
    endDate: Date | undefined,
    excludeSessionId?: string
  ): Promise<Session | null> {
    await this.initPromise;
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.getAllSessions();
    
    // Only check sessions with manual date ranges
    const sessionsWithManualDates = sessions.filter(
      (s: Session) => s.hasManualDateRange && s.id !== excludeSessionId
    );

    for (const session of sessionsWithManualDates) {
      const sessionStart = new Date(session.startDate);
      const sessionEnd = session.endDate ? new Date(session.endDate) : new Date('2100-12-31'); // Far future if no end
      const checkEnd = endDate || new Date('2100-12-31');

      // Check for overlap: ranges overlap if start1 <= end2 AND start2 <= end1
      if (startDate <= sessionEnd && sessionStart <= checkEnd) {
        return session; // Found overlap
      }
    }

    return null; // No overlap
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Open database at version 2 (matches cartTransactionService)
        console.log('SessionService: Opening database with version 2');
        const request = indexedDB.open(this.dbName, 2);

        request.onerror = () => {
          console.error('SessionService: Error opening database', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('SessionService: Database opened successfully, version:', this.db.version);
          resolve();
        };

        request.onupgradeneeded = (event) => {
          console.log('SessionService: Database upgrade triggered from version', event.oldVersion, 'to', event.newVersion);
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create sessions object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.sessionStoreName)) {
            console.log('SessionService: Creating sessions object store');
            const store = db.createObjectStore(this.sessionStoreName, { keyPath: 'id' });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('startDate', 'startDate', { unique: false });
            console.log('SessionService: Sessions object store created');
          }
          
          // Also ensure transactions store exists (in case this runs first)
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
            txStore.createIndex('transaction_date', 'transaction_date', { unique: false });
          }
        };

        request.onblocked = () => {
          console.warn('SessionService: Database open blocked - close other tabs or wait');
        };
      } catch (error) {
        console.error('SessionService: Error in initDB', error);
        reject(error);
      }
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('SessionService: Database not initialized');
    }
  }

  /**
   * Create a new session
   */
  async createSession(input: CreateSessionInput): Promise<Session> {
    await this.ensureDB();

    // Pause any other active sessions first
    try {
      const allSessions = await this.getAllSessions();
      for (const session of allSessions) {
        if (session.status === 'active') {
          console.log('SessionService: Auto-pausing active session', session.id);
          await this.pauseSession(session.id);
        }
      }
    } catch (error) {
      console.warn('SessionService: Could not pause active sessions', error);
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.sessionStoreName, 'readwrite');
        const store = transaction.objectStore(this.sessionStoreName);

        const now = new Date().toISOString();
        const session: Session = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: input.name,
          description: input.description,
          status: 'active',
          startDate: input.startDate.toISOString(),
          createdAt: now,
          updatedAt: now,
          hasManualDateRange: false, // Only true if user explicitly set dates for retroactive linking
        };
        
        // Mark as manual date range only if user provided different dates
        if (input.endDate) {
          session.hasManualDateRange = true;
          session.endDate = input.endDate.toISOString();
        }

        console.log('SessionService: Creating session', session.id);
        const request = store.add(session);

        request.onsuccess = () => {
          console.log('SessionService: Session created successfully', session.id);
          resolve(session);
        };
        request.onerror = () => {
          console.error('SessionService: Error creating session', request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('SessionService: Transaction error', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in createSession', error);
        reject(error);
      }
    });
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      try {
        console.log('SessionService: Loading all sessions');
        const transaction = this.db!.transaction(this.sessionStoreName, 'readonly');
        const store = transaction.objectStore(this.sessionStoreName);
        const request = store.getAll();

        request.onsuccess = () => {
          const sessions = request.result as Session[];
          console.log('SessionService: Sessions loaded successfully', sessions.length);
          resolve(sessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        };
        request.onerror = () => {
          console.error('SessionService: Error loading sessions', request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('SessionService: Transaction error', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in getAllSessions', error);
        reject(error);
      }
    });
  }

  /**
   * Get active session (if any)
   */
  async getActiveSession(): Promise<Session | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.sessionStoreName, 'readonly');
        const store = transaction.objectStore(this.sessionStoreName);
        const index = store.index('status');
        const request = index.getAll('active');

        request.onsuccess = () => {
          const sessions = request.result as Session[];
          resolve(sessions.length > 0 ? sessions[0] : null);
        };
        request.onerror = () => {
          console.error('SessionService: Error getting active session', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in getActiveSession', error);
        reject(error);
      }
    });
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<Session | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.sessionStoreName, 'readonly');
        const store = transaction.objectStore(this.sessionStoreName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          console.error('SessionService: Error getting session', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in getSessionById', error);
        reject(error);
      }
    });
  }

  /**
   * Update session
   */
  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.sessionStoreName, 'readwrite');
        const store = transaction.objectStore(this.sessionStoreName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const session = getRequest.result as Session;
          if (!session) {
            reject(new Error('Session not found'));
            return;
          }

          const updated: Session = {
            ...session,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          console.log('SessionService: Updating session', id);
          const putRequest = store.put(updated);
          putRequest.onsuccess = () => {
            console.log('SessionService: Session updated successfully', id);
            resolve(updated);
          };
          putRequest.onerror = () => {
            console.error('SessionService: Error updating session', putRequest.error);
            reject(putRequest.error);
          };
        };

        getRequest.onerror = () => {
          console.error('SessionService: Error getting session for update', getRequest.error);
          reject(getRequest.error);
        };

        transaction.onerror = () => {
          console.error('SessionService: Transaction error', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in updateSession', error);
        reject(error);
      }
    });
  }

  /**
   * End/Complete a session
   */
  async completeSession(id: string): Promise<Session> {
    return this.updateSession(id, {
      status: 'completed',
      endDate: new Date().toISOString(),
    });
  }

  /**
   * Pause a session
   */
  async pauseSession(id: string): Promise<Session> {
    return this.updateSession(id, {
      status: 'paused',
    });
  }

  /**
   * Resume a paused session
   */
  async resumeSession(id: string): Promise<Session> {
    // Pause any other active sessions first
    try {
      const allSessions = await this.getAllSessions();
      for (const session of allSessions) {
        if (session.status === 'active' && session.id !== id) {
          console.log('SessionService: Auto-pausing active session', session.id);
          await this.pauseSession(session.id);
        }
      }
    } catch (error) {
      console.warn('SessionService: Could not pause active sessions', error);
    }

    return this.updateSession(id, {
      status: 'active',
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      try {
        console.log('SessionService: Deleting session', id);
        const transaction = this.db!.transaction(this.sessionStoreName, 'readwrite');
        const store = transaction.objectStore(this.sessionStoreName);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log('SessionService: Session deleted successfully', id);
          resolve();
        };
        request.onerror = () => {
          console.error('SessionService: Error deleting session', request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('SessionService: Transaction error', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('SessionService: Exception in deleteSession', error);
        reject(error);
      }
    });
  }

  /**
   * Get transactions for a session
   */
  async getSessionTransactions(sessionId: string, transactions: any[]): Promise<any[]> {
    const session = await this.getSessionById(sessionId);
    if (!session) return [];

    const startTime = new Date(session.startDate);
    const endTime = session.endDate ? new Date(session.endDate) : new Date();

    // Filter transactions: prioritize session_id field, fallback to date range
    return transactions.filter((tx) => {
      // If transaction has explicit session_id, use that
      if (tx.session_id) {
        return tx.session_id === sessionId;
      }
      // Otherwise fall back to date range filtering (for old transactions)
      const txDate = new Date(tx.transaction_date);
      return txDate >= startTime && txDate <= endTime;
    });
  }

  /**
   * Determine which session a transaction belongs to
   */
  async getTransactionSession(transactionDate: string, sessions: Session[]): Promise<Session | null> {
    const txDate = new Date(transactionDate);

    // Find the session this transaction belongs to
    for (const session of sessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())) {
      const startTime = new Date(session.startDate);
      const endTime = session.endDate ? new Date(session.endDate) : new Date();

      if (txDate >= startTime && txDate <= endTime) {
        return session;
      }
    }

    return null;
  }

  /**
   * Retroactively link transactions to a session by date range
   * Updates all transactions within the session's date range to have this session's ID
   */
  async linkTransactionsByDateRange(sessionId: string): Promise<number> {
    try {
      await this.ensureDB();
      console.log('SessionService: Linking transactions by date range for session', sessionId);
      
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get all transactions from the transactions store
      const allTransactions: any[] = await new Promise((resolve, reject) => {
        const txRequest = indexedDB.open(this.dbName);
        txRequest.onsuccess = () => {
          const db = txRequest.result;
          const transaction = db.transaction('transactions', 'readonly');
          const store = transaction.objectStore('transactions');
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        };
        txRequest.onerror = () => reject(txRequest.error);
      });

      const startTime = new Date(session.startDate);
      const endTime = session.endDate ? new Date(session.endDate) : new Date();

      // Filter transactions that fall within this session's date range
      const transactionsToLink = allTransactions.filter(tx => {
        // Only link if it doesn't already have a session_id, or if it should be moved to this session
        const txDate = new Date(tx.transaction_date);
        return txDate >= startTime && txDate <= endTime && !tx.session_id;
      });

      if (transactionsToLink.length === 0) {
        console.log('SessionService: No transactions to link');
        return 0;
      }

      // Update all matching transactions
      let linkedCount = 0;
      await new Promise<void>((resolve, reject) => {
        const txRequest = indexedDB.open(this.dbName);
        txRequest.onsuccess = () => {
          const db = txRequest.result;
          const transaction = db.transaction('transactions', 'readwrite');
          const store = transaction.objectStore('transactions');
          
          transactionsToLink.forEach(tx => {
            const updatedTx = { ...tx, session_id: sessionId };
            store.put(updatedTx);
            linkedCount++;
          });

          transaction.oncomplete = () => {
            console.log('SessionService: Linked', linkedCount, 'transactions to session', sessionId);
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        txRequest.onerror = () => reject(txRequest.error);
      });

      return linkedCount;
    } catch (error) {
      console.error('SessionService: Error linking transactions by date range', error);
      throw error;
    }
  }

  /**
   * Link transactions by date range with automatic unlinking from other active/paused sessions
   * Returns { linkedCount, unlinkedCount } for UI feedback
   */
  async linkTransactionsByDateRangeWithUnlink(sessionId: string): Promise<{ linkedCount: number; unlinkedCount: number }> {
    try {
      await this.ensureDB();
      console.log('SessionService: Linking transactions with unlink for session', sessionId);
      
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Prevent changing dates on completed sessions
      if (session.status === 'completed') {
        throw new Error('Cannot modify date range of completed sessions');
      }

      // Get all transactions
      const allTransactions: any[] = await new Promise((resolve, reject) => {
        const txRequest = indexedDB.open(this.dbName);
        txRequest.onsuccess = () => {
          const db = txRequest.result;
          const transaction = db.transaction('transactions', 'readonly');
          const store = transaction.objectStore('transactions');
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        };
        txRequest.onerror = () => reject(txRequest.error);
      });

      const startTime = new Date(session.startDate);
      const endTime = session.endDate ? new Date(session.endDate) : new Date();

      // Find transactions to link (within date range, no session_id yet)
      const transactionsToLink = allTransactions.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        return txDate >= startTime && txDate <= endTime && !tx.session_id;
      });

      // Find transactions to unlink (within date range, belong to other active/paused sessions)
      const transactionsToUnlink = allTransactions.filter(tx => {
        if (!tx.session_id || tx.session_id === sessionId) return false;
        const txDate = new Date(tx.transaction_date);
        return txDate >= startTime && txDate <= endTime;
      });

      // Update transactions in database
      let linkedCount = 0;
      let unlinkedCount = 0;

      await new Promise<void>((resolve, reject) => {
        const txRequest = indexedDB.open(this.dbName);
        txRequest.onsuccess = () => {
          const db = txRequest.result;
          const transaction = db.transaction('transactions', 'readwrite');
          const store = transaction.objectStore('transactions');
          
          // Link new transactions
          transactionsToLink.forEach(tx => {
            const updatedTx = { ...tx, session_id: sessionId };
            store.put(updatedTx);
            linkedCount++;
          });
          
          // Unlink from other sessions
          transactionsToUnlink.forEach(tx => {
            const updatedTx = { ...tx, session_id: undefined };
            store.put(updatedTx);
            unlinkedCount++;
          });

          transaction.oncomplete = () => {
            console.log('SessionService: Linked', linkedCount, 'and unlinked', unlinkedCount, 'transactions for session', sessionId);
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        txRequest.onerror = () => reject(txRequest.error);
      });

      return { linkedCount, unlinkedCount };
    } catch (error) {
      console.error('SessionService: Error linking transactions with unlink', error);
      throw error;
    }
  }

  /**
   * Clear manual date range from a session
   * Resets to auto-generated dates (creation date) and unlinks retroactively linked transactions
   */
  async clearManualDateRange(sessionId: string): Promise<Session> {
    try {
      await this.ensureDB();
      console.log('SessionService: Clearing manual date range for session', sessionId);
      
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Reset to creation date (no end date for ongoing)
      const updated = await this.updateSession(sessionId, {
        startDate: session.createdAt,
        endDate: undefined,
        hasManualDateRange: false,
      });

      console.log('SessionService: Manual date range cleared for session', sessionId);
      return updated;
    } catch (error) {
      console.error('SessionService: Error clearing manual date range', error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();
