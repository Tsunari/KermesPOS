import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, exec } from "child_process";
import path from "path";
import { execSync } from "child_process";
import colorLogger from "./util/colorLogger.js";
import { fileURLToPath } from "url";
import escpos from "escpos";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let currentPythonProcess = null;
let pythonPrintProcesses = [];
let kursName = "Münih Fatih";

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
	const basePath = getBasePath();
  const scriptPath = path.join(basePath, "print_receipt_win.py");
  const pythonExe = path.join(basePath, "python-3.13.3-embed-amd64", "python.exe");
  cartData.items.forEach(item => {
		const singleCart = {
			items: [item],
      total: item.price * item.quantity
    };
    const proc = spawn(pythonExe, [scriptPath, kursName], {
			stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true
    });
    proc.stdin.write(JSON.stringify(singleCart));
    proc.stdin.end();
    pythonPrintProcesses.push(proc);
    proc.on('exit', () => {
			// Remove finished process from array
      pythonPrintProcesses = pythonPrintProcesses.filter(p => p !== proc);
    });
  });
}

function resetWindowsPrintSpooler() {
	  try {
    console.log("Stopping print spooler...");
    execSync('net stop spooler', { stdio: 'inherit' });

    console.log("Clearing print queue...");
    execSync('del /Q /F "%systemroot%\\System32\\spool\\PRINTERS\\*"', { stdio: 'inherit' });

    console.log("Starting print spooler...");
    execSync('net start spooler', { stdio: 'inherit' });

    console.log("Print spooler reset complete.");
  } catch (err) {
    console.error("Failed to reset printer queue:", err.message);
  }
  // exec('net stop spooler && net start spooler', { windowsHide: true }, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error('Failed to reset print spooler:', error);
  //   } else {
  //     console.log('Print spooler reset successfully.');
  //   }
  // });
}

function getBasePath() {
	return app.isPackaged
		? path.join(process.resourcesPath, 'app.asar.unpacked')
		: __dirname;
}


app.on("ready", async () => {
  createWindow();

  // mainWindow.loadURL('http://localhost:3000'); // Load your website
  const kermesPosPath = path.join(getBasePath(), "../kermes-pos/build/index.html");
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
    // Kill any previous print jobs before starting new ones
    // pythonPrintProcesses.forEach(proc => proc.kill());
    // pythonPrintProcesses = [];
    printWithPythonWin(cartData);
		console.log("Selected printer:", selectedPrinter);
		console.log("cartData:", cartData);
		fs.writeFileSync('test.json', JSON.stringify(cartData), 'utf8')
  });

  ipcMain.on("cancel-print", () => {
    resetWindowsPrintSpooler();
    pythonPrintProcesses.forEach(proc => proc.kill());
    pythonPrintProcesses = [];
		// Also clear the Windows print queue using the Python script
    const basePath = getBasePath();
    const scriptPath = path.join(basePath, "print_receipt_win.py");
    const pythonExe = path.join(basePath, "python-3.13.3-embed-amd64", "python.exe");
    const clearProc = spawn(pythonExe, [scriptPath, "--clear-queue"], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
