const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const USBPrinter = require('./usbPrinter');

let mainWindow;

app.on('ready', () => {
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

  ipcMain.on('print-cart', (event, { cartData, selectedPrinter }) => {
    console.log('Received print request:', cartData, selectedPrinter);
    const device = USBPrinter.listDevices().find(
      (device) => device.product === selectedPrinter.name
    );

    if (!device) {
      console.error('Selected printer not found among USB devices');
      return;
    }

    const printer = new USBPrinter(device);

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