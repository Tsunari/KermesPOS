const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  print: (text) => ipcRenderer.invoke('print', text),
  nativePrint: (content) => ipcRenderer.invoke('native-print', content)
});

contextBridge.exposeInMainWorld('electronAPI', {
  listPrinters: () => ipcRenderer.invoke('list-printers'),
  printCart: (cartData, selectedPrinter) => ipcRenderer.send('print-cart', { cartData, selectedPrinter }),
});