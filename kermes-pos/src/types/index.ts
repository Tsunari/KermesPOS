export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink' | 'dessert';
  description?: string;
  image?: string;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Receipt {
  items: CartItem[];
  total: number;
  date: Date;
  orderNumber: string;
} 