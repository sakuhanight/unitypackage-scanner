import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// 開発環境判定を改善
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // 開発時はpreloadを無効にする
      ...(isDev ? {} : { preload: path.join(__dirname, 'preload.js') }),
    },
    titleBarStyle: 'default',
    show: false,
  });

  // 開発時はViteサーバー、本番時は静的ファイル
  if (isDev) {
    console.log('Development mode: Loading from Vite server');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Production mode: Loading from file system');
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers (モック用)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('mock-scan-package', async (_event, filePath: string) => {
  // モック実装 - 実際のスキャンは後のフェーズで実装
  return {
    success: true,
    message: `Mock scan for ${filePath}`,
  };
});

ipcMain.handle('mock-auth-test', async (_event, provider: string, apiKey: string) => {
  // モック実装 - 実際の認証は後のフェーズで実装
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
  return {
    success: apiKey.length > 10,
    provider,
    error: apiKey.length <= 10 ? 'APIキーが短すぎます' : undefined,
  };
});