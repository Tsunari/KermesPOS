const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const escpos = require('escpos');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load your React app
  mainWindow.loadURL('http://localhost:3000');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle print requests from renderer process
ipcMain.handle('print', async (event, text) => {
  try {
    // Find USB printer
    const devices = escpos.USB.findPrinter();
    console.log('Available printers:', devices);

    if (devices.length === 0) {
      throw new Error('No printer found');
    }

    const device = new escpos.USB(devices[0]);
    const printer = new escpos.Printer(device);

    return new Promise((resolve, reject) => {
      device.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        printer
          .text(text || 'Test Print')
          .cut()
          .close();
        resolve('Print successful');
      });
    });
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
});

// Handle native print requests
ipcMain.handle('native-print', async (event, content) => {
  try {
    console.log('Native print request received');
    console.log('Content length:', content.length);

    // Create a new window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    console.log('Created print window');

    // Load the content
    await printWindow.loadURL(`data:text/html,${encodeURIComponent(content)}`);
    console.log('Loaded content into print window');

    // Wait for content to load
    await new Promise((resolve, reject) => {
      printWindow.webContents.on('did-finish-load', resolve);
      printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        reject(new Error(`Failed to load content: ${errorDescription}`));
      });
    });

    console.log('Content finished loading');

    // Print using native dialog
    const options = {
      silent: false,
      printBackground: true,
      deviceName: '',
      margins: {
        marginType: 'none'
      }
    };

    console.log('Starting print with options:', options);
    
    // Use a promise to handle the print operation
    const printPromise = new Promise((resolve, reject) => {
      printWindow.webContents.print(options, (success, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    const success = await printPromise;
    console.log('Print result:', success);
    
    // Clean up
    printWindow.destroy();
    console.log('Print window destroyed');
    
    return success ? 'Print successful' : 'Print failed';
  } catch (error) {
    console.error('Native print error:', error);
    throw error;
  }
});