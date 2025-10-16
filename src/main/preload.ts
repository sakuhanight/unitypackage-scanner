import { contextBridge, ipcRenderer } from 'electron';
import { ScanResult, ScanProgress, ScanOptions } from '../shared/types';

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // パッケージスキャン
  scanPackage: (filePath: string, options?: ScanOptions): Promise<Result<ScanResult>> =>
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
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = (_: any, progress: ScanProgress) => callback(progress);
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
      scanPackage: (filePath: string, options?: ScanOptions) => Promise<Result<ScanResult>>;
      getVersion: () => Promise<string>;
      openFileDialog: () => Promise<string | null>;
      processDroppedFile: (file: File) => Promise<string | null>;
      onScanProgress: (callback: (progress: ScanProgress) => void) => () => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFileDropped: (callback: (filePath: string) => void) => any;
    };
  }
}