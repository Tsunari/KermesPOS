interface Window {
  electronAPI?: {
    listPrinters: () => Promise<{ name: string; description?: string; status?: number; isDefault?: boolean }[]>;
    printCart: (cartData: { items: { name: string; quantity: number; price: number }[]; total: number }, selectedPrinter: { name: string }) => void;
  };
}