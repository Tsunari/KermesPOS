interface Window {
  electron: {
    print: (text: string) => Promise<string>;
    nativePrint: (content: string) => Promise<string>;
  };
} 