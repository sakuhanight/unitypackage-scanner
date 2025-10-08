import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { PackageParser } from './services/packageParser';
import { PatternMatcher } from './services/scanner/patternMatcher';
import { ScanProgress } from '../shared/types';

class Application {
  private mainWindow: BrowserWindow | null = null;
  private packageParser: PackageParser;
  private patternMatcher: PatternMatcher;
  
  constructor() {
    this.packageParser = new PackageParser();
    this.patternMatcher = new PatternMatcher();
    
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();
    });

    app.on('window-all-closed', async () => {
      // 一時ファイルをクリーンアップ
      await this.packageParser.cleanupAll();
      
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', async () => {
      // アプリケーション終了前のクリーンアップ
      await this.packageParser.cleanupAll();
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
        preload: path.join(__dirname, '../../preload.js'),
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
    // パッケージスキャン機能
    ipcMain.handle('scan-package', async (_, { filePath }) => {
      console.log(`Scanning package: ${filePath}`);
      
      try {
        // 進行状況の通知設定
        this.packageParser.setProgressCallback((progress: ScanProgress) => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('scan-progress', progress);
          }
        });

        // パッケージ解析を実行
        const packageInfo = await this.packageParser.parsePackage(filePath);

        // パターンマッチングを実行
        const findings = this.patternMatcher.scanFiles(packageInfo.extractedFiles);

        const criticalCount = findings.filter(f => f.severity === 'critical').length;
        const warningCount = findings.filter(f => f.severity === 'warning').length;
        const infoCount = findings.filter(f => f.severity === 'info').length;

        const result = {
          id: Date.now().toString(),
          filePath,
          scanDate: new Date().toISOString(),
          status: 'completed' as const,
          findings: findings,
          summary: {
            critical: criticalCount,
            warning: warningCount,
            info: infoCount,
            total: findings.length
          },
          packageInfo
        };

        return {
          success: true,
          data: result
        };

      } catch (error) {
        console.error('Package scanning failed:', error);
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : '不明なエラーが発生しました',
            code: 'SCAN_FAILED'
          }
        };
      }
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

    // ファイルダイアログ
    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        title: 'UnityPackageファイルを選択',
        filters: [
          { name: 'Unity Package', extensions: ['unitypackage'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });
  }
}

new Application();