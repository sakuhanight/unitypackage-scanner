import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';


class Application {
  private mainWindow: BrowserWindow | null = null;
  
  constructor() {
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

  private createWindow(): void {
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
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // 開発環境での設定
    const isDev = !app.isPackaged;
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // ウィンドウの準備ができたら表示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // モックスキャン機能
    ipcMain.handle('scan-package', async (_, { filePath }) => {
      console.log(`Mock scanning package: ${filePath}`);
      
      // 模擬的なスキャン処理（実装段階では実際のロジックに置き換える）
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
              severity: 'warning' as const,
              category: 'network',
              pattern: 'UnityWebRequest',
              filePath: 'Assets/Scripts/NetworkManager.cs',
              lineNumber: 42,
              context: 'var request = UnityWebRequest.Get("https://api.example.com");',
              description: 'ネットワーク通信が検出されました'
            },
            {
              id: '2', 
              severity: 'info' as const,
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
    ipcMain.handle('update-settings', async (_, settings) => {
      console.log('Updating settings:', settings);
      // 実装段階では electron-store などを使用して永続化
      return;
    });
  }
}

new Application();