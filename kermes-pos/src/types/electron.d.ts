interface Window {
  electronAPI?: {
    listPrinters: () => Promise<{ name: string; description?: string; status?: number; isDefault?: boolean }[]>;
    printCart: (cartData: { items: { name: string; quantity: number; price: number }[]; total: number }, selectedPrinter: { name: string }) => void;
    changeKursName: (newKursName: string) => void;
    isDev: () => Promise<boolean>;
    getVersion: () => Promise<string>;
    update: {
      open: () => void;
      check: () => void;
      download: () => void;
      install: () => void;
      onStatus: (callback: (payload: any) => void) => () => void;
      onProgress: (callback: (payload: any) => void) => () => void;
    };
  };
}