import { Product } from '../types';
import productsData from '../data/products.json';

// Type assertion to ensure the JSON data matches our Product type
const typedProducts = productsData.products as Product[];

class ProductService {
  private products: Product[];

  constructor() {
    // Clear localStorage to ensure we use the products from the JSON file
    localStorage.removeItem('products');
    this.products = typedProducts;
    this.loadProducts(); // Load any saved products from localStorage
  }

  getAllProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Product): void {
    this.products.push(product);
    this.saveProducts();
  }

  updateProduct(product: Product): void {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.products[index] = product;
      this.saveProducts();
    }
  }

  deleteProduct(productId: string): void {
    this.products = this.products.filter(p => p.id !== productId);
    this.saveProducts();
  }

  private saveProducts(): void {
    // In a real application, this would make an API call
    // For now, we'll just update the local state
    localStorage.setItem('products', JSON.stringify(this.products));
  }

  private loadProducts(): void {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts) as Product[];
        this.products = parsed;
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
      }
    }
  }
}

export const productService = new ProductService(); 