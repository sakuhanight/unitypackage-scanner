const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;


class Application {
  constructor() {
    this.mainWindow = null;
    
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // 開発環境での設定
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }

    // ウィンドウの準備ができたら表示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupIPC() {
    // モックスキャン機能
    ipcMain.handle('scan-package', async (event, { filePath }) => {
      console.log(`Mock scanning package: ${filePath}`);
      
      // 模擬的なスキャン処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        data: {
          id: Date.now().toString(),
          filePath,
          scanDate: new Date().toISOString(),
          status: 'completed',
          findings: [
            {
              id: '1',
              severity: 'warning',
              category: 'network',
              pattern: 'UnityWebRequest',
              filePath: 'Assets/Scripts/NetworkManager.cs',
              lineNumber: 42,
              context: 'var request = UnityWebRequest.Get("https://api.example.com");',
              description: 'ネットワーク通信が検出されました'
            },
            {
              id: '2', 
              severity: 'info',
              category: 'reflection',
              pattern: 'Assembly.Load',
              filePath: 'Assets/Scripts/PluginLoader.cs',
              lineNumber: 15,
              context: 'Assembly.Load("SomeAssembly");',
              description: 'リフレクションによる動的ロードが検出されました'
            }
          ],
          summary: {
            critical: 0,
            warning: 1,
            info: 1,
            total: 2
          }
        }
      };
    });

    // 設定の取得
    ipcMain.handle('get-settings', async () => {
      return {
        theme: 'light',
        language: 'ja',
        patternPreset: 'standard',
        customPatterns: [],
        excludePaths: [],
        maxFileSize: 10485760 // 10MB
      };
    });

    // 設定の更新
    ipcMain.handle('update-settings', async (event, settings) => {
      console.log('Updating settings:', settings);
      return;
    });
  }
}

new Application();