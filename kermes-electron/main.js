import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  globalShortcut,
} from "electron";
import { spawn, exec } from "child_process";
import path from "path";
import { execSync } from "child_process";
import colorLogger from "./util/colorLogger.js";
import { fileURLToPath } from "url";
import fs from "fs";
import pkg from "electron-updater";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { autoUpdater } = pkg;

let mainWindow;
let currentPythonProcess = null;
let pythonPrintProcesses = [];
let kursName = "Münih Fatih Kermes";
let updateWindow = null;
let lastUpdateStatus = { status: "idle", info: null };

function sendUpdateStatus(channel, payload) {
  // Send to update window if open
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.webContents.send(channel, payload);
  }
  // Also log for visibility
  console.log(`[update] ${channel}:`, payload);
}

function openUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }
  const isDark = nativeTheme.shouldUseDarkColors;
  const iconPath = isDark
    ? path.join(__dirname, "assets", "Logo-dark-m.ico")
    : path.join(__dirname, "assets", "Logo-light-m.ico");
  updateWindow = new BrowserWindow({
    width: 460,
    height: 520,
    title: "Updates",
    icon: iconPath,
    parent: mainWindow,
    modal: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });
  // Load update UI directly from the packaged ASAR (assets are safe in asar)
  const updateHtml = path.join(__dirname, "assets", "update.html");
  updateWindow.loadFile(updateHtml).catch(() => {
    // As a fallback, load a minimal inline page
    updateWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<!doctype html><html><head><meta charset='utf-8'><title>Updates</title></head><body><h3>Update UI missing</h3><p>The update.html could not be loaded.</p></body></html>`
        )
    );
  });
  updateWindow.on("closed", () => {
    updateWindow = null;
  });
  // push last known status on open
  setTimeout(() => {
    sendUpdateStatus("update:status", lastUpdateStatus);
  }, 200);
}

function setupAutoUpdater() {
  try {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on("checking-for-update", () => {
      lastUpdateStatus = { status: "checking", info: null };
      sendUpdateStatus("update:status", lastUpdateStatus);
    });
    autoUpdater.on("update-available", (info) => {
      lastUpdateStatus = { status: "available", info };
      sendUpdateStatus("update:status", lastUpdateStatus);
    });
    autoUpdater.on("update-not-available", (info) => {
      lastUpdateStatus = { status: "not-available", info };
      sendUpdateStatus("update:status", lastUpdateStatus);
    });
    autoUpdater.on("error", (err) => {
      lastUpdateStatus = {
        status: "error",
        info: { message: err?.message || String(err) },
      };
      sendUpdateStatus("update:status", lastUpdateStatus);
    });
    autoUpdater.on("download-progress", (progressObj) => {
      lastUpdateStatus = { status: "downloading", info: progressObj };
      sendUpdateStatus("update:progress", progressObj);
    });
    autoUpdater.on("update-downloaded", (info) => {
      lastUpdateStatus = { status: "downloaded", info };
      sendUpdateStatus("update:status", lastUpdateStatus);
    });
  } catch (e) {
    console.warn("autoUpdater setup failed:", e);
  }
}

// Dev simulation for testing update flow without a server
let simulateTimer = null;
function simulateUpdateFlow() {
  if (simulateTimer) return;
  let percent = 0;
  const step = () => {
    if (percent === 0) {
      lastUpdateStatus = { status: "checking", info: null };
      sendUpdateStatus("update:status", lastUpdateStatus);
      setTimeout(() => {
        lastUpdateStatus = {
          status: "available",
          info: { version: "dev-1.0.1" },
        };
        sendUpdateStatus("update:status", lastUpdateStatus);
      }, 600);
    }
    if (percent >= 100) {
      lastUpdateStatus = {
        status: "downloaded",
        info: { version: "dev-1.0.1" },
      };
      sendUpdateStatus("update:status", lastUpdateStatus);
      clearInterval(simulateTimer);
      simulateTimer = null;
      return;
    }
    percent = Math.min(100, percent + Math.round(5 + Math.random() * 15));
    sendUpdateStatus("update:progress", {
      percent,
      transferred: percent,
      total: 100,
      bytesPerSecond: 5000000,
    });
  };
  simulateTimer = setInterval(step, 400);
  step();
}

function createWindow() {
  const isDark = nativeTheme.shouldUseDarkColors;
  const iconPath = isDark
    ? path.join(__dirname, "assets", "Logo-dark-m.ico")
    : path.join(__dirname, "assets", "Logo-light-m.ico");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // fullscreen: true,
    autoHideMenuBar: true,
    title: "Kermes POS",
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  mainWindow.maximize();
  mainWindow.show();
}

function printTestPage(selectedPrinter, cartData) {
  const printWindow = new BrowserWindow({ show: false });

  // Format cart items as HTML rows
  const itemsHtml = cartData.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:left;">${item.name}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${item.price.toFixed(2)} €</td>
    </tr>
  `
    )
    .join("");

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

  printWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );
  printWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
          deviceName: selectedPrinter.name,
        },
        (success, errorType) => {
          if (!success) console.error("Print failed:", errorType);
          else console.log("Print job sent to printer:", selectedPrinter.name);
          printWindow.close();
        }
      );
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
  const pythonExe = path.join(
    basePath,
    "python-3.13.3-embed-amd64",
    "python.exe"
  );
  cartData.items.forEach((item) => {
    const singleCart = {
      items: [item],
      total: item.price * item.quantity,
    };
    // console.log("Current kurs name:", kursName);
    const proc = spawn(pythonExe, [scriptPath, kursName], {
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true,
    });
    proc.stdin.write(JSON.stringify(singleCart));
    proc.stdin.end();
    pythonPrintProcesses.push(proc);
    proc.on("exit", () => {
      // Remove finished process from array
      pythonPrintProcesses = pythonPrintProcesses.filter((p) => p !== proc);
    });
  });
}

function resetWindowsPrintSpooler() {
  try {
    console.log("Stopping print spooler...");
    execSync("net stop spooler", { stdio: "inherit" });

    console.log("Clearing print queue...");
    execSync('del /Q /F "%systemroot%\\System32\\spool\\PRINTERS\\*"', {
      stdio: "inherit",
    });

    console.log("Starting print spooler...");
    execSync("net start spooler", { stdio: "inherit" });

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
    ? path.join(process.resourcesPath, "app.asar.unpacked")
    : __dirname;
}

app.on("ready", async () => {
  createWindow();

  // Register global shortcut to open update UI for testing
  try {
    globalShortcut.register("Control+Shift+U", () => openUpdateWindow());
  } catch {}

  setupAutoUpdater();

  if (app.isPackaged) {
    mainWindow.loadFile("build/index.html");
    // Initial background check; full flow can be initiated from UI
    autoUpdater.checkForUpdates().catch(() => {});
  } else {
    const kermesPosPath = path.join(__dirname, "build/index.html");
    //mainWindow.loadFile(kermesPosPath);
    mainWindow.loadURL("http://localhost:3000");
  }
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

  ipcMain.on("change-kurs-name", (event, newKursName) => {
    console.log("Kurs name changed to:", newKursName);
    kursName = newKursName;
  });

  // Update IPC
  ipcMain.on("update:open", () => openUpdateWindow());
  ipcMain.on("update:check", async () => {
    if (!app.isPackaged) {
      // In dev, simulate by default
      openUpdateWindow();
      simulateUpdateFlow();
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      lastUpdateStatus = {
        status: "error",
        info: { message: e?.message || String(e) },
      };
      sendUpdateStatus("update:status", lastUpdateStatus);
    }
  });
  ipcMain.on("update:download", async () => {
    if (!app.isPackaged) {
      simulateUpdateFlow();
      return;
    }
    try {
      await autoUpdater.downloadUpdate();
    } catch (e) {
      lastUpdateStatus = {
        status: "error",
        info: { message: e?.message || String(e) },
      };
      sendUpdateStatus("update:status", lastUpdateStatus);
    }
  });
  ipcMain.on("update:install", () => {
    if (!app.isPackaged) {
      // Simulate install by closing window
      lastUpdateStatus = { status: "idle", info: null };
      if (updateWindow && !updateWindow.isDestroyed()) updateWindow.close();
      return;
    }
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (e) {
      lastUpdateStatus = {
        status: "error",
        info: { message: e?.message || String(e) },
      };
      sendUpdateStatus("update:status", lastUpdateStatus);
    }
  });
  ipcMain.handle("app:is-dev", () => !app.isPackaged);

  ipcMain.on("print-cart", async (event, { cartData, selectedPrinter }) => {
    // Kill any previous print jobs before starting new ones
    // pythonPrintProcesses.forEach(proc => proc.kill());
    // pythonPrintProcesses = [];
    printWithPythonWin(cartData);
    console.log("Selected printer:", selectedPrinter);
    console.log("cartData:", cartData);
    //fs.writeFileSync('test.json', JSON.stringify(cartData), 'utf8')
  });

  ipcMain.on("cancel-print", () => {
    resetWindowsPrintSpooler();
    pythonPrintProcesses.forEach((proc) => proc.kill());
    pythonPrintProcesses = [];
    // Also clear the Windows print queue using the Python script
    const basePath = getBasePath();
    const scriptPath = path.join(basePath, "print_receipt_win.py");
    const pythonExe = path.join(
      basePath,
      "python-3.13.3-embed-amd64",
      "python.exe"
    );
    const clearProc = spawn(pythonExe, [scriptPath, "--clear-queue"], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true,
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  try {
    globalShortcut.unregisterAll();
  } catch {}
});
