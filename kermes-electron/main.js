import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { execSync } from 'child_process';
import USBPrinter from './usbPrinter.js';
import colorLogger from './util/colorLogger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

app.on('ready', () => {
  console.log(USBPrinter.mapPrinterToUSBDevice("Star TSP100 Cutter (TSP143)"));
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadURL('http://localhost:3000'); // Load your website

  //colorLogger.info('Application is ready.');

  // List all available printers using a fallback method
  ipcMain.handle('list-printers', () => {
    try {
      const output = execSync('wmic printer get name').toString();
      const printers = output
        .split('\n')
        .slice(1)
        .filter((line) => line.trim() !== '')
        .map((name) => ({ name: name.trim() }));
      return printers;
    } catch (error) {
      console.error('Failed to list printers:', error);
      return [];
    }
  });

  ipcMain.on('print-cart', async (event, { cartData, selectedPrinter }) => {
    console.log('Received print request:', cartData, selectedPrinter);
    // const devices = await USBPrinter.listDevices(); // Await the asynchronous method
    // const device = devices.find(
    //   (device) => device.product === selectedPrinter.name
    // );
    const device = await USBPrinter.mapPrinterToUSBDevice(selectedPrinter.name);
    console.log("USBPrinter Info: " + new USBPrinter(device.vendorId, device.productId));
    if (!device) {
      console.error('Selected printer not found among USB devices');
      return;
    }
    const printer = new USBPrinter(device.vendorId, device.productId); // Pass vendorId and productId

    try {
      printer.open();

      printer.align('center');
      printer.printText('KERMES POS RECEIPT');
      printer.printText('===================');

      cartData.items.forEach((item) => {
        printer.align('left');
        printer.printText(`${item.name} x${item.quantity} - $${item.price}`);
        printer.cut(); // Cut after each item
      });

      printer.align('right');
      printer.printText(`Total: $${cartData.total}`);
      printer.cut();

      printer.close();
    } catch (error) {
      console.error('Error printing receipt:', error);
      printer.close();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});