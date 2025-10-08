const { contextBridge, ipcRenderer } = require('electron');

// 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // パッケージスキャン
  scanPackage: (filePath, options) =>
    ipcRenderer.invoke('scan-package', { filePath, options }),

  // 進行状況の監視
  onScanProgress: (callback) => {
    const subscription = (event, progress) => callback(progress);
    ipcRenderer.on('scan-progress', subscription);
    
    // サブスクリプション解除用の関数を返す
    return () => ipcRenderer.off('scan-progress', subscription);
  },

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