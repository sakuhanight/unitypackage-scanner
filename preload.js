const { contextBridge, ipcRenderer } = require('electron');

// 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // パッケージスキャン
  scanPackage: (filePath, options) =>
    ipcRenderer.invoke('scan-package', { filePath, options }),

  // 設定管理
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  updateSettings: (settings) =>
    ipcRenderer.invoke('update-settings', settings),

  // バージョン情報
  getVersion: () =>
    ipcRenderer.invoke('get-version'),

  // ファイルダイアログ
  openFileDialog: () =>
    ipcRenderer.invoke('open-file-dialog')
});