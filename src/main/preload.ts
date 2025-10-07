import { contextBridge, ipcRenderer } from 'electron';

// 型定義
export interface ScanResult {
  id: string;
  filePath: string;
  scanDate: string;
  status: 'completed' | 'error';
  findings: ScanFinding[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
}

export interface ScanFinding {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'network' | 'fileSystem' | 'process' | 'native' | 'reflection' | 'registry';
  pattern: string;
  filePath: string;
  lineNumber: number;
  context: string;
  description: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'ja' | 'en';
  patternPreset: 'strict' | 'standard' | 'relaxed';
  customPatterns: any[];
  excludePaths: string[];
  maxFileSize: number;
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // パッケージスキャン
  scanPackage: (filePath: string, options?: any): Promise<Result<ScanResult>> =>
    ipcRenderer.invoke('scan-package', { filePath, options }),

  // 設定管理
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('get-settings'),

  updateSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke('update-settings', settings),

  // バージョン情報
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-version'),

  // ファイルダイアログ
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('open-file-dialog')
});

// グローバル型定義
declare global {
  interface Window {
    electronAPI: {
      scanPackage: (filePath: string, options?: any) => Promise<Result<ScanResult>>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
      getVersion: () => Promise<string>;
      openFileDialog: () => Promise<string | null>;
    };
  }
}