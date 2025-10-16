import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { PackageParser } from './services/packageParser';
import { PatternMatcher } from './services/scanner/patternMatcher';
import { ScanProgress } from '../shared/types';
import { AppConstants, FileConstants, DevConstants } from './constants';

class Application {
  private mainWindow: BrowserWindow | null = null;
  private packageParser: PackageParser;
  private patternMatcher: PatternMatcher;
  
  constructor() {
    this.packageParser = new PackageParser();
    this.patternMatcher = new PatternMatcher();
    
    app.whenReady().then(async () => {
      // パターンマッチャーを初期化
      await this.patternMatcher.initialize();
      
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

    // ファイルを開く（macOS対応）
    app.on('open-file', (event, filePath) => {
      event.preventDefault();
      if (filePath.endsWith('.unitypackage') && this.mainWindow) {
        this.mainWindow.webContents.send('file-dropped', filePath);
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: AppConstants.WINDOW_WIDTH,
      height: AppConstants.WINDOW_HEIGHT,
      minWidth: AppConstants.MIN_WINDOW_WIDTH,
      minHeight: AppConstants.MIN_WINDOW_HEIGHT,
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'default' : 'default',
      frame: true,
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
      this.mainWindow.loadURL(DevConstants.DEV_SERVER_URL);
      // 本番リリースではDevToolsを無効化
      // this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    // ウィンドウの準備ができたら表示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // ファイルドロップハンドラーを設定
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.protocol === 'file:') {
        event.preventDefault();
        // ファイルパスを抽出
        const filePath = decodeURIComponent(parsedUrl.pathname);
        if (filePath.endsWith('.unitypackage')) {
          // レンダラープロセスにファイルパスを送信
          this.mainWindow?.webContents.send('file-dropped', filePath);
        }
      }
    });
  }

  private setupIPC(): void {
    // パッケージスキャン機能
    ipcMain.handle('scan-package', async (_, { filePath }) => {
      
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


    // ファイルダイアログ
    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        title: 'UnityPackageファイルを選択',
        filters: FileConstants.FILE_FILTERS,
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    // バージョン情報
    ipcMain.handle('get-version', async () => {
      return app.getVersion();
    });

    // ドロップされたファイルの処理
    ipcMain.handle('process-dropped-file', async (_, { name, data }) => {
      try {
        const fs = await import('fs-extra');
        const tempPath = path.join(os.tmpdir(), 'unitypackage-scanner-drop', name);
        
        // 一時ディレクトリを作成
        await fs.ensureDir(path.dirname(tempPath));
        
        // ファイルを一時的に保存
        await fs.writeFile(tempPath, data);
        
        return tempPath;
      } catch (error) {
        console.error('Failed to process dropped file:', error);
        return null;
      }
    });

  }
}

new Application();