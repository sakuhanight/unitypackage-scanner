// Electron API型定義
export interface ElectronAPI {
  scanPackage: (filePath: string, options?: any) => Promise<{
    success: boolean;
    data?: any;
    error?: { message: string };
  }>;
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<void>;
  getVersion: () => Promise<string>;
  openFileDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};