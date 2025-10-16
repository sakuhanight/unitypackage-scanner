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


  // バージョン情報
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-version'),

  // ファイルダイアログ
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('open-file-dialog'),

  // ファイルデータ送信（ドラッグ&ドロップ用）
  processDroppedFile: async (file: File): Promise<string | null> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return ipcRenderer.invoke('process-dropped-file', {
      name: file.name,
      data: buffer
    });
  },


  // 進行状況の監視
  onScanProgress: (callback: (progress: any) => void) => {
    const subscription = (_: any, progress: any) => callback(progress);
    ipcRenderer.on('scan-progress', subscription);
    
    // サブスクリプション解除用の関数を返す
    return () => ipcRenderer.off('scan-progress', subscription);
  },

  // ファイルドロップイベントの監視
  onFileDropped: (callback: (filePath: string) => void) => {
    return ipcRenderer.on('file-dropped', (_, filePath) => callback(filePath));
  },

});

// グローバル型定義
declare global {
  interface Window {
    electronAPI: {
      scanPackage: (filePath: string, options?: any) => Promise<Result<ScanResult>>;
      getVersion: () => Promise<string>;
      openFileDialog: () => Promise<string | null>;
      processDroppedFile: (file: File) => Promise<string | null>;
      onScanProgress: (callback: (progress: any) => void) => () => void;
      onFileDropped: (callback: (filePath: string) => void) => any;
    };
  }
}