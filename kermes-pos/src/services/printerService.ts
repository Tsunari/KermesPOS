import { CartItem } from '../types/index';

// Printer configuration
interface PrinterConfig {
  printerName: string;
  paperWidth: number; // in mm
  fontSize: number;
  bold: boolean;
}

// Default configuration for TSP100III Series
const defaultConfig: PrinterConfig = {
  printerName: 'TSP100III',
  paperWidth: 72, // Standard 72mm paper width
  fontSize: 12,
  bold: true,
};

// ESC/POS commands for the TSP100III
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_RIGHT = ESC + 'a' + '\x02';
const FONT_SIZE_NORMAL = GS + '!' + '\x00';
const FONT_SIZE_LARGE = GS + '!' + '\x11';
const FONT_SIZE_XLARGE = GS + '!' + '\x22';
const CUT_PAPER = GS + 'V' + '\x41' + '\x00';

// Format price with currency symbol
const formatPrice = (price: number): string => {
  return price.toFixed(2) + '€';
};

// Generate receipt header
const generateHeader = (): string => {
  return (
    INIT +
    ALIGN_CENTER +
    BOLD_ON +
    FONT_SIZE_XLARGE +
    'KERMES POS\n' +
    FONT_SIZE_NORMAL +
    'Receipt\n' +
    new Date().toLocaleString() + '\n' +
    '--------------------------------\n' +
    BOLD_OFF +
    ALIGN_LEFT
  );
};

// Generate receipt footer
const generateFooter = (): string => {
  return (
    ALIGN_CENTER +
    BOLD_ON +
    'Thank you for your purchase!\n' +
    BOLD_OFF +
    ALIGN_LEFT +
    CUT_PAPER
  );
};

// Generate item receipt
const generateItemReceipt = (item: CartItem): string => {
  const { product, quantity } = item;
  
  return (
    INIT +
    ALIGN_CENTER +
    BOLD_ON +
    FONT_SIZE_LARGE +
    product.name + '\n' +
    FONT_SIZE_NORMAL +
    BOLD_OFF +
    ALIGN_LEFT +
    `Category: ${product.category}\n` +
    `Quantity: ${quantity}\n` +
    `Price: ${formatPrice(product.price)} each\n` +
    `Total: ${formatPrice(product.price * quantity)}\n` +
    '--------------------------------\n'
  );
};

// Generate full cart receipt
const generateCartReceipt = (items: CartItem[], total: number): string => {
  let receipt = generateHeader();
  
  items.forEach(item => {
    receipt += generateItemReceipt(item);
  });
  
  receipt +=
    ALIGN_RIGHT +
    BOLD_ON +
    `TOTAL: ${formatPrice(total)}\n` +
    BOLD_OFF +
    ALIGN_LEFT +
    generateFooter();
    
  return receipt;
};

// Print a single item
export const printItem = async (item: CartItem, config: PrinterConfig = defaultConfig): Promise<boolean> => {
  try {
    const receipt = generateItemReceipt(item);
    return await sendToPrinter(receipt, config);
  } catch (error) {
    console.error('Error printing item:', error);
    return false;
  }
};

// Print the entire cart
export const printCart = async (items: CartItem[], total: number, config: PrinterConfig = defaultConfig): Promise<boolean> => {
  try {
    const receipt = generateCartReceipt(items, total);
    return await sendToPrinter(receipt, config);
  } catch (error) {
    console.error('Error printing cart:', error);
    return false;
  }
};

// Send data to the printer
const sendToPrinter = async (data: string, config: PrinterConfig): Promise<boolean> => {
  // This is a placeholder for the actual printer communication
  // In a real implementation, you would use a library like node-thermal-printer
  // or a browser-based solution like WebUSB API for direct printer communication
  
  console.log('Sending to printer:', config.printerName);
  console.log('Data:', data);
  
  // For now, we'll just simulate successful printing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

// Get available printers
export const getAvailablePrinters = async (): Promise<string[]> => {
  // This is a placeholder for getting available printers
  // In a real implementation, you would use a library or API to detect printers
  
  return ['TSP100III', 'Default Printer'];
};

// Update printer configuration
export const updatePrinterConfig = (config: Partial<PrinterConfig>): PrinterConfig => {
  return { ...defaultConfig, ...config };
}; 