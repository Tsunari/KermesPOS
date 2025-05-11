import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { execSync } from 'child_process';
import colorLogger from './util/colorLogger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
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
function printTestPage(selectedPrinter) {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <html>
      <head>
        <style>
          body { width: 300px; font-size: 18px; }
          h1 { font-size: 24px; }
          p { margin: 8px 0; }can
        </style>
      </head>
      <body>
        <h1>Test Print</h1>
        <p>This is a test page for your thermal printer.</p>
        <p>--------------------------</p>
        <p>Thank you for using Kermes POS!</p>
        <p>--------------------------</p>
        <p>0123456789</p>
        <p>ABCDEFGHIJ</p>
      </body>
    </html>
  `));
  printWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      printWindow.webContents.printToPDF({
        silent: true,
        printBackground: true,
        deviceName: selectedPrinter.name,
      }, (success, errorType) => {
        if (!success) console.error('Print failed:', errorType);
        else console.log('Print job sent to printer:', selectedPrinter.name);
        printWindow.close();
      });
    }, 500); // Wait 500ms to ensure rendering
  });
}

app.on('ready', async () => {
  createWindow();

  mainWindow.loadURL('http://localhost:3000'); // Load your website
  // const kermesPosPath = path.join(__dirname, '../kermes-pos/build/index.html');
  // mainWindow.loadFile(kermesPosPath);
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


  
  ipcMain.on('print-cart', async (event, { cartData, selectedPrinter }) => {
    console.log('Received cart data:', cartData);
    console.log('Selected printer:', selectedPrinter.name);

    // Here you would format the cartData for printing
    printTestPage(selectedPrinter);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});