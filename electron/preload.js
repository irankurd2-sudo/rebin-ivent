const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-sale', callback);
    ipcRenderer.on('menu-add-product', callback);
    ipcRenderer.on('menu-export-data', callback);
    ipcRenderer.on('menu-import-data', callback);
    ipcRenderer.on('menu-navigate', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});