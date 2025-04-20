const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  print: (text) => ipcRenderer.invoke('print', text),
  nativePrint: (content) => ipcRenderer.invoke('native-print', content)
});