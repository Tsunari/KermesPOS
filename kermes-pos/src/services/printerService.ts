import { CartItem } from "../types/index";

// Printer configuration
interface PrinterConfig {
  printerName: string;
  paperWidth: number; // in mm
  fontSize: number;
  bold: boolean;
}

// Default configuration for TSP100III Series
const defaultConfig: PrinterConfig = {
  printerName: "TSP100III",
  paperWidth: 80,
  fontSize: 12,
  bold: true,
};

// ESC/POS commands for the TSP100III
const ESC = "\x1B";
const GS = "\x1D";
const INIT = ESC + "@";
const BOLD_ON = ESC + "E" + "\x01";
const BOLD_OFF = ESC + "E" + "\x00";
const ALIGN_LEFT = ESC + "a" + "\x00";
const ALIGN_CENTER = ESC + "a" + "\x01";
const ALIGN_RIGHT = ESC + "a" + "\x02";
const FONT_SIZE_NORMAL = GS + "!" + "\x00";
const FONT_SIZE_LARGE = GS + "!" + "\x11";
const FONT_SIZE_XLARGE = GS + "!" + "\x22";
const CUT_PAPER = GS + "V" + "\x41" + "\x00";
const EXIT = ESC + "@"; // Exit command to reset printer

// Format price with currency symbol
const formatPrice = (price: number): string => {
  return price.toFixed(2) + "€";
};

export const generateReceiptContent = (
  cartItems: CartItem[],
  total: number
): string => {
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = item.product.category || "Other";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

  const categoryOrder = ["food", "drink", "dessert", "Other"];

  let receiptContent = `
    KERMES POS RECEIPT
    =================
    Date: ${new Date().toLocaleString()}
    =================
  `;

  categoryOrder.forEach((category) => {
    if (groupedItems[category] && groupedItems[category].length > 0) {
      receiptContent += `
    ${category.toUpperCase()}
    ${"-".repeat(category.length)}
      `;

      groupedItems[category].forEach((item) => {
        receiptContent += `
    ${item.product.name}
      ${item.quantity} x ${item.product.price
          .toFixed(2)
          .replace(".", ",")}€ = ${(item.product.price * item.quantity)
          .toFixed(2)
          .replace(".", ",")}€
      `;
      });

      receiptContent += `
    ${"-".repeat(20)}
      `;
    }
  });

  receiptContent += `
    TOTAL: ${total.toFixed(2).replace(".", ",")}€
    =================
    Thank you for your purchase!
  `;

  return receiptContent;
};

// Generate item receipt
const generateItemReceipt = (item: CartItem): string => {
  const { product, quantity } = item;

  return (
    INIT +
    ALIGN_CENTER +
    BOLD_ON +
    FONT_SIZE_LARGE +
    product.name +
    "\n" +
    FONT_SIZE_NORMAL +
    BOLD_OFF +
    ALIGN_LEFT +
    `Category: ${product.category}\n` +
    `Quantity: ${quantity}\n` +
    `Price: ${formatPrice(product.price)} each\n` +
    `Total: ${formatPrice(product.price * quantity)}\n` +
    `Date: ${new Date().toLocaleString()}\n` +
    "--------------------------------\n" +
    CUT_PAPER // Add paper cut after each item
  );
};

// Generate full cart receipt
const generateCartReceipt = (items: CartItem[]): string => {
  let receipt = "";

  items.forEach((item) => {
    receipt += generateItemReceipt(item);
  });

  receipt += EXIT; // Add exit command at the end

  return receipt;
};

// Print the entire cart
export const printCart = async (
  items: CartItem[],
  total: number,
  config: PrinterConfig = defaultConfig
): Promise<boolean> => {
  try {
    const receipt = generateCartReceipt(items);
    return await sendToPrinter(receipt, config);
  } catch (error) {
    console.error("Error printing cart:", error);
    return false;
  }
};

// Send data to the printer
const sendToPrinter = async (
  data: string,
  config: PrinterConfig
): Promise<boolean> => {
  try {
    const response = await fetch("http://localhost:3001/api/print", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log("Print server response:", result);
    return true;
  } catch (error) {
    console.error("Error sending to printer:", error);
    return false;
  }
};

// Get available printers
export const getAvailablePrinters = async (): Promise<string[]> => {
  // This is a placeholder for getting available printers
  // In a real implementation, you would use a library or API to detect printers

  return ["TSP100III", "Default Printer"];
};

// Update printer configuration
export const updatePrinterConfig = (
  config: Partial<PrinterConfig>
): PrinterConfig => {
  return { ...defaultConfig, ...config };
};
