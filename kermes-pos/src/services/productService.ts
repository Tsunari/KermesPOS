import { Product } from '../types/index';
import productsData from '../data/products.json';

// Type assertion to ensure the JSON data matches our Product type
const typedProducts = productsData.products as Product[];

class ProductService {
  private products: Product[];

  constructor() {
    // Try to load from localStorage first, fall back to JSON file if nothing exists
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        this.products = JSON.parse(savedProducts) as Product[];
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
        this.products = typedProducts;
      }
    } else {
      this.products = typedProducts;
      // Save the initial products to localStorage
      this.saveProducts();
    }
  }

  getAllProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Product): void {
    // Generate a new ID based on the category
    let newId = '';
    if (product.category === 'food') {
      // Find the highest food ID and increment
      const foodIds = this.products
        .filter(p => p.category === 'food')
        .map(p => parseInt(p.id.substring(1))); // Extract the number after the first digit
      const maxFoodId = Math.max(...foodIds, 0);
      newId = `1${(maxFoodId + 1).toString().padStart(3, '0')}`;
    } else if (product.category === 'drink') {
      // Find the highest drink ID and increment
      const drinkIds = this.products
        .filter(p => p.category === 'drink')
        .map(p => parseInt(p.id.substring(1))); // Extract the number after the first digit
      const maxDrinkId = Math.max(...drinkIds, 0);
      newId = `2${(maxDrinkId + 1).toString().padStart(3, '0')}`;
    } else if (product.category === 'dessert') {
      // Find the highest dessert ID and increment
      const dessertIds = this.products
        .filter(p => p.category === 'dessert')
        .map(p => parseInt(p.id.substring(1))); // Extract the number after the first digit
      const maxDessertId = Math.max(...dessertIds, 0);
      newId = `3${(maxDessertId + 1).toString().padStart(3, '0')}`;
    } else {
      // Default ID generation
      newId = Date.now().toString();
    }
    
    // Add the product with the new ID
    this.products.push({ ...product, id: newId });
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

  // Export products to a JSON file
  exportProducts(): string {
    return JSON.stringify({ products: this.products }, null, 2);
  }

  // Import products from a JSON string
  importProducts(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.products)) {
        this.products = data.products as Product[];
        this.saveProducts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing products:', error);
      return false;
    }
  }

  // Reset to default products from JSON file
  resetToDefault(): void {
    this.products = typedProducts;
    this.saveProducts();
  }

  private saveProducts(): void {
    localStorage.setItem('products', JSON.stringify(this.products));
  }
}

export const productService = new ProductService(); 