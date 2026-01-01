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
        // Migrate old product_order localStorage to order field if needed
        this.migrateOldOrderFormat();
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
        this.products = typedProducts;
        this.initializeOrderField();
      }
    } else {
      this.products = typedProducts;
      this.initializeOrderField();
      // Save the initial products to localStorage
      this.saveProducts();
    }
  }

  /**
   * Migrate from old product_order localStorage format (global order)
   * to per-category order field on products
   */
  private migrateOldOrderFormat(): void {
    const storedOrder = localStorage.getItem('product_order');
    if (storedOrder) {
      try {
        const orderMap = JSON.parse(storedOrder);
        const categoryOrder: Record<string, number> = {};

        // Convert global order to per-category order
        this.products.forEach((product) => {
          const category = product.category;
          if (!categoryOrder[category]) {
            categoryOrder[category] = 0;
          }
          // Assign order within category
          if (product.order === undefined) {
            product.order = categoryOrder[category]++;
          }
        });

        this.saveProducts();
        localStorage.removeItem('product_order'); // Clean up old format
      } catch (error) {
        console.error('Error migrating old order format:', error);
        this.initializeOrderField();
      }
    } else {
      this.initializeOrderField();
    }
  }

  /**
   * Initialize order field for products that don't have it
   */
  private initializeOrderField(): void {
    const categoryOrder: Record<string, number> = {};

    this.products.forEach((product) => {
      const category = product.category;
      if (!categoryOrder[category]) {
        categoryOrder[category] = 0;
      }
      if (product.order === undefined) {
        product.order = categoryOrder[category]++;
      }
    });

    this.saveProducts();
  }

  getAllProducts(): Product[] {
    // Return products sorted by category order, then by order within category
    const categoryOrder = { food: 0, drink: 1, dessert: 2 };
    return [...this.products].sort((a, b) => {
      const catA = categoryOrder[a.category] ?? 999;
      const catB = categoryOrder[b.category] ?? 999;
      if (catA !== catB) return catA - catB;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  getProductsByCategory(category: string): Product[] {
    return this.getAllProducts().filter((p) => p.category === category);
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
    
    // Set order to the count of products in this category
    const categoryProducts = this.products.filter(p => p.category === product.category);
    const newOrder = Math.max(...categoryProducts.map(p => p.order ?? 0), -1) + 1;

    // Add the product with the new ID and order
    this.products.push({ ...product, id: newId, order: newOrder });
    this.saveProducts();
  }

  updateProduct(product: Product): void {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.products[index] = product;
      this.saveProducts();
    }
  }

  /**
   * Update the order of a product within its category
   */
  updateProductOrder(productId: string, newOrder: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const oldOrder = product.order ?? 0;
    const category = product.category;

    // Get all products in the same category sorted by order
    const categoryProducts = this.products
      .filter(p => p.category === category)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (newOrder < 0 || newOrder >= categoryProducts.length) return;

    // Remove product from old position
    const filtered = categoryProducts.filter(p => p.id !== productId);

    // Insert at new position
    filtered.splice(newOrder, 0, product);

    // Update order field for all affected products
    filtered.forEach((p, index) => {
      const prodIndex = this.products.findIndex(prod => prod.id === p.id);
      if (prodIndex !== -1) {
        this.products[prodIndex].order = index;
      }
    });

    this.saveProducts();
  }

  deleteProduct(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    this.products = this.products.filter(p => p.id !== productId);

    // Reorder remaining products in the same category
    if (product) {
      const category = product.category;
      const categoryProducts = this.products
        .filter(p => p.category === category)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      categoryProducts.forEach((p, index) => {
        const prodIndex = this.products.findIndex(prod => prod.id === p.id);
        if (prodIndex !== -1) {
          this.products[prodIndex].order = index;
        }
      });
    }

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
        // Ensure order fields are initialized
        this.initializeOrderField();
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
    this.products = typedProducts.map(p => ({ ...p }));
    this.initializeOrderField();
    this.saveProducts();
  }

  private saveProducts(): void {
    localStorage.setItem('products', JSON.stringify(this.products));
  }
}

export const productService = new ProductService(); 