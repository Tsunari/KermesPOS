const { contextBridge, ipcRenderer } = require('electron');

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
  changeKursName: (kursName) => ipcRenderer.send('change-kurs-name', kursName),
});