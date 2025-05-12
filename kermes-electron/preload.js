const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes Electron APIs to the renderer process via the `contextBridge`.
 * 
 * @namespace electron
 * @property {Function} print - Sends a request to the main process to print the given text.
 * @param {string} text - The text to be printed.
 * @returns {Promise<any>} - Resolves with the result of the print operation.
 * 
 * @property {Function} nativePrint - Sends a request to the main process to perform a native print operation.
 * @param {any} content - The content to be printed natively.
 * @returns {Promise<any>} - Resolves with the result of the native print operation.
 */
contextBridge.exposeInMainWorld('electron', {
  print: (text) => ipcRenderer.invoke('print', text),
  nativePrint: (content) => ipcRenderer.invoke('native-print', content)
});

/**
 * Exposes additional Electron APIs to the renderer process via the `contextBridge`.
 * 
 * @namespace electronAPI
 * @property {Function} listPrinters - Sends a request to the main process to list available printers.
 * @returns {Promise<any>} - Resolves with the list of available printers.
 * 
 * @property {Function} printCart - Sends a request to the main process to print a cart using the selected printer.
 * @param {any} cartData - The data of the cart to be printed.
 * @param {string} selectedPrinter - The name of the printer to use for printing.
 * 
 * @property {Function} cancelPrintRequest - Sends a request to the main process to cancel the print operation.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  listPrinters: () => ipcRenderer.invoke('list-printers'),
  printCart: (cartData, selectedPrinter) => ipcRenderer.send('print-cart', { cartData, selectedPrinter }),
  cancelPrintRequest: () => ipcRenderer.send('cancel-print'),
});