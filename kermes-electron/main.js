/**
 * Main Electron application file for Kermes POS.
 * Handles the creation of the main application window, printer management, 
 * and inter-process communication (IPC) for printing functionality.
 * 
 * @module
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { execSync } from 'child_process';
import USBPrinter from './usbPrinter.js';
import colorLogger from './util/colorLogger.js';
import { fileURLToPath } from 'url';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

/**
 * Creates the main application window.
 * Configures the window properties and loads the application interface.
 * 
 * @function
 */
function createWindow() {
  console.log(USBPrinter.mapPrinterToUSBDevice("Star TSP100 Cutter (TSP143)"));
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    //fullscreen: true,
    autoHideMenuBar: true,
    title: 'Kermes POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  //mainWindow.maximize();  

}

/**
 * Event handler for the 'ready' event of the Electron app.
 * Initializes the application, creates the main window, and sets up IPC handlers.
 * 
 * @event
 */
app.on('ready', async () => {
    // // Check if the app is running as admin
    // const isAdmin = await isElevated();
    // isAdmin().then((elevated) => {
    //   if (!elevated) {
    //     // Relaunch the app with admin privileges
    //     const options = {
    //       name: 'KermesProgram',
    //     };
    //     sudo.exec(`"${process.execPath}"`, options, (error) => {
    //       if (error) {
    //         console.error('Failed to relaunch as admin:', error);
    //         app.quit();
    //       } else {
    //         app.quit(); // Quit the current instance
    //       }
    //     });
    //   } else {
    //     createWindow(); // Create the main window if already running as admin
    //   }
    // });

  createWindow();

  // mainWindow.loadURL('http://localhost:3000'); // Load your website
  const kermesPosPath = path.join(__dirname, '../kermes-pos/build/index.html');
  mainWindow.loadFile(kermesPosPath);
  //mainWindow.webContents.openDevTools();

  //colorLogger.info('Application is ready.');


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

  /**
  * Attempts to print the provided cart data to the selected printer.
  * 
  * @async
  * @function
  * @param {Object} cartData - The data of the cart to be printed.
  * @param {Array<Object>} cartData.items - The items in the cart.
  * @param {string} cartData.items[].name - The name of the item.
  * @param {number} cartData.items[].quantity - The quantity of the item.
  * @param {number} cartData.items[].price - The price of the item.
  * @param {number} cartData.total - The total price of the cart.
  * @param {Object} selectedPrinter - The selected printer object.
  * @param {string} selectedPrinter.name - The name of the selected printer.
  */
  async function print_attempt(cartData, selectedPrinter) {
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
      printer.close();
    }
  }

  /**
 * Handles the IPC event to print the cart data.
 * Uses the `node-thermal-printer` library to send print commands to the printer.
 * 
 * @event
 * @param {Object} event - The IPC event object.
 * @param {Object} args - The arguments passed from the renderer process.
 * @param {Object} args.cartData - The data of the cart to be printed.
 * @param {Object} args.selectedPrinter - The selected printer object.
 */
  ipcMain.on('print-cart', async (event, { cartData, selectedPrinter }) => {
    let printer = new ThermalPrinter({
      type: PrinterTypes.STAR, // Set the correct driver type
      // interface: 'usb', // Specify the interface (e.g., 'usb', 'tcp://IP:PORT', etc.)
    });

    //let isConnected = await printer.isPrinterConnected();
    //let execute = await printer.execute();
    //let raw = await printer.raw(Buffer.from('Hello World'));

    try {
      printer.print("Hello World");
      printer.cut();
    } catch (error) {
      console.error('Error printing:', error);
    }
    

  });
});

/**
 * Event handler for the 'window-all-closed' event of the Electron app.
 * Quits the application when all windows are closed, except on macOS.
 * 
 * @event
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});