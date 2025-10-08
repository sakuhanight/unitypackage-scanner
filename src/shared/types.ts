/**
 * 共通型定義
 */

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
  packageInfo?: PackageInfo;
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

export interface PackageInfo {
  fileName: string;
  fileSize: number;
  extractedPath: string;
  fileCount: number;
  scriptCount: number;
  dllCount: number;
  assetCount: number;
  extractedFiles: ExtractedFile[];
}

export interface ExtractedFile {
  path: string;
  type: 'script' | 'dll' | 'asset' | 'texture' | 'model' | 'audio' | 'meta' | 'other';
  size: number;
  content?: string; // C#ファイルの場合のみ
  guid?: string; // UnityPackageのGUID
}

export interface ScanProgress {
  stage: 'extracting' | 'analyzing' | 'scanning' | 'completed';
  progress: number; // 0-100
  currentFile?: string;
  message?: string;
}

export interface ScanOptions {
  maxFileSize?: number;
  tempDir?: string;
  patterns?: DetectionPattern[];
}

export interface DetectionPattern {
  name: string;
  category: ScanFinding['category'];
  severity: ScanFinding['severity'];
  regex: string;
  description: string;
}