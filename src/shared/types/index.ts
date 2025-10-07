// 基本的な型定義

export type Screen = 
  | 'welcome'
  | 'setup'
  | 'main'
  | 'scanning'
  | 'results'
  | 'settings';

export type AIProvider = 'claude' | 'openai' | 'gemini';

export type AuthStatus = 'not_configured' | 'configured' | 'connecting' | 'failed';

export type AnalysisSeverity = 'critical' | 'warning' | 'info';

export type AnalysisCategory = 'security' | 'performance' | 'best_practice' | 'dependencies';

export interface AuthResult {
  success: boolean;
  provider: AIProvider;
  error?: string;
  token?: string;
}

export interface AnalysisResult {
  id: string;
  severity: AnalysisSeverity;
  category: AnalysisCategory;
  title: string;
  message: string;
  filePath?: string;
  recommendation?: string;
}

export interface ScanResult {
  id: string;
  fileName: string;
  fileSize: number;
  scanDate: Date;
  provider: AIProvider;
  results: AnalysisResult[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'ja' | 'en';
  maxFileSize: number;
  analysisDepth: 'quick' | 'standard' | 'deep';
  showWelcomeDialog: boolean;
}

export interface ScanProgress {
  stage: 'parsing' | 'analyzing' | 'complete';
  percentage: number;
  currentFile?: string;
  message?: string;
}

// モックデータ用の型
export interface MockData {
  scanResults: ScanResult[];
  sampleAnalysisResults: AnalysisResult[];
}