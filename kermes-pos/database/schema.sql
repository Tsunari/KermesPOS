CREATE TABLE IF NOT EXISTS cart_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    items_count INTEGER NOT NULL,
    items_data TEXT NOT NULL,  -- JSON string of cart items
    payment_method TEXT
); 