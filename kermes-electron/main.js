import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import path from "path";
import { execSync } from "child_process";
import colorLogger from "./util/colorLogger.js";
import { fileURLToPath } from "url";
import escpos from "escpos";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    //fullscreen: true,
    autoHideMenuBar: true,
    title: "Kermes POS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  //mainWindow.maximize();
}

function printTestPage(selectedPrinter, cartData) {
  const printWindow = new BrowserWindow({ show: false });

  // Format cart items as HTML rows
  const itemsHtml = cartData.items.map(item => `
    <tr>
      <td style="text-align:left;">${item.name}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${item.price.toFixed(2)} €</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <style>
          body { width: 300px; font-size: 18px; font-family: monospace; }
          h1 { font-size: 24px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { padding: 2px 0; }
          th { border-bottom: 1px solid #000; }
          tfoot td { border-top: 1px solid #000; font-weight: bold; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Kermes POS</h1>
        <div class="center">--------------------------</div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Ürün</th>
              <th style="text-align:center;">Adet</th>
              <th style="text-align:right;">Fiyat</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align:left;">Toplam</td>
              <td style="text-align:right;">${cartData.total.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
        <div class="center">--------------------------</div>
        <div class="center">Teşekkürler!</div>
      </body>
    </html>
  `;

  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  printWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      printWindow.webContents.print({
        silent: false,
        printBackground: true,
        deviceName: selectedPrinter.name,
      }, (success, errorType) => {
        if (!success) console.error('Print failed:', errorType);
        else console.log('Print job sent to printer:', selectedPrinter.name);
        printWindow.close();
      });
    }, 500);
  });
}

function printESCPOS() {
  const device = new escpos.USB();
  const printerRaw = new escpos.Printer(device);

  device.open(() => {
    printerRaw
      .align("CT")
      .text("My Shop")
      .text("———————")
      .table(["Item", "Qty", "€"])
      .cut() // ESC/POS cut
      .cashdraw() // if supported by escpos lib
      .close();
  });
}

function printWithPythonWin(cartData) {
  const scriptPath = path.join(__dirname, "print_receipt_win.py");
  // Print each item as a separate receipt (simulate cut)
  cartData.items.forEach(item => {
    const singleCart = {
      items: [item],
      total: item.price * item.quantity
    };
    const python = spawn("python", [scriptPath], {
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true
    });
    python.stdin.write(JSON.stringify(singleCart));
    python.stdin.end();
  });
}

app.on("ready", async () => {
  createWindow();

  //mainWindow.loadURL('http://localhost:3000'); // Load your website
  const kermesPosPath = path.join(__dirname, "../kermes-pos/build/index.html");
  mainWindow.loadFile(kermesPosPath);
  //mainWindow.webContents.openDevTools();
  //colorLogger.info('Application is ready.');

  ipcMain.handle("list-printers", () => {
    try {
      const output = execSync("wmic printer get name").toString();
      const printers = output
        .split("\n")
        .slice(1)
        .filter((line) => line.trim() !== "")
        .map((name) => ({ name: name.trim() }));
      return printers;
    } catch (error) {
      console.error("Failed to list printers:", error);
      return [];
    }
  });

  ipcMain.on("print-cart", async (event, { cartData, selectedPrinter }) => {
    console.log("Received cart data:", cartData);
    console.log("Selected printer:", selectedPrinter.name);

    // Here you would format the cartData for printing
    printWithPythonWin(cartData);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
