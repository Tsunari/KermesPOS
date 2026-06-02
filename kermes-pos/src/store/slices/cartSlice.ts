import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types/index';

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      // Always add a new cart item, even if the product already exists
      state.items.push({ product: action.payload, quantity: 1 });

      state.total = state.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
    },
    addToCartWithQuantity: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }

      state.total = state.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload
      );
      state.total = state.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
    },
    decrementProduct: (state, action: PayloadAction<string>) => {
      const lastIndex = [...state.items].reverse().findIndex(item => item.product.id === action.payload);
      if (lastIndex >= 0) {
        const actualIndex = state.items.length - 1 - lastIndex;
        const item = state.items[actualIndex];
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items.splice(actualIndex, 1);
        }
        state.total = state.items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addToCart, addToCartWithQuantity, removeFromCart, decrementProduct, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer; 