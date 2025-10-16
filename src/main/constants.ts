/**
 * アプリケーション全体で使用する定数定義
 * 将来の設定機能で変更可能な値も含む
 */

import * as path from 'path';
import * as os from 'os';

/**
 * パス関連の定数
 */
export class PathConstants {
  /**
   * リソースディレクトリのパスを取得
   */
  static getResourcesPath(): string {
    // 開発環境とビルド環境でのパス解決
    const isDev = process.env.NODE_ENV === 'development' || !__dirname.includes('dist');
    if (isDev) {
      return path.join(process.cwd(), 'src/main/resources');
    } else {
      return path.join(__dirname, '../resources');
    }
  }

  /**
   * パターンファイルディレクトリのパスを取得
   */
  static getPatternsPath(): string {
    return path.join(PathConstants.getResourcesPath(), 'patterns');
  }

  /**
   * 一時ディレクトリのパスを取得
   */
  static getTempPath(): string {
    return path.join(os.tmpdir(), 'unitypackage-scanner');
  }
}

/**
 * パターンマッチング関連の定数
 */
export class PatternConstants {
  /**
   * パターンファイルディレクトリのパスを取得
   */
  static getPatternsPath(): string {
    return PathConstants.getPatternsPath();
  }
  // デフォルトパターンファイル名（設定で変更可能）
  static readonly DEFAULT_PATTERN_FILE = 'default-patterns.json';
  
  
  // マルウェア検出パターンファイル名
  static readonly MALWARE_PATTERN_FILE = 'malware-detection.json';
  
  // デフォルトプリセット名（設定で変更可能）
  static readonly DEFAULT_PRESET = 'standard';
  
  // 利用可能なプリセット
  static readonly AVAILABLE_PRESETS = [
    'strict',
    'standard', 
    'relaxed'
  ] as const;

  /**
   * デフォルトパターンファイルの完全パスを取得
   */
  static getDefaultPatternPath(): string {
    return path.join(PathConstants.getPatternsPath(), PatternConstants.DEFAULT_PATTERN_FILE);
  }


  /**
   * 指定されたパターンファイルの完全パスを取得
   */
  static getPatternFilePath(filename: string): string {
    return path.join(PathConstants.getPatternsPath(), filename);
  }
}

/**
 * 拡張子検出関連の定数
 */
export class ExtensionConstants {
  // デフォルト拡張子定義ファイル名（設定で変更可能）
  static readonly DEFAULT_EXTENSION_FILE = 'file-extensions.json';
  
  // デフォルト拡張子プリセット名（設定で変更可能）
  static readonly DEFAULT_EXTENSION_PRESET = 'standard';

  /**
   * デフォルト拡張子定義ファイルの完全パスを取得
   */
  static getDefaultExtensionPath(): string {
    return path.join(PathConstants.getPatternsPath(), ExtensionConstants.DEFAULT_EXTENSION_FILE);
  }
}

/**
 * スキャン処理関連の定数
 */
export class ScanConstants {
  // デフォルト最大ファイルサイズ (500MB)（設定で変更可能）
  static readonly DEFAULT_MAX_FILE_SIZE = 524288000;
  
  // スクリプトファイル読み込み上限サイズ (1MB)
  static readonly SCRIPT_MAX_SIZE = 1024 * 1024;
  
  // 進行状況更新間隔（ミリ秒）
  static readonly PROGRESS_UPDATE_INTERVAL = 100;
  
  // 一時ディレクトリ名プレフィックス
  static readonly TEMP_DIR_PREFIX = 'unitypackage-';
}

/**
 * アプリケーション情報の定数
 */
export class AppConstants {
  // アプリケーション名
  static readonly APP_NAME = 'ゆにぱけスキャナー';
  
  // アプリケーション説明
  static readonly APP_DESCRIPTION = 'UnityPackageファイルのセキュリティ分析ツール';
  
  // 対応Unity版本
  static readonly SUPPORTED_UNITY_VERSION = 'Unity 2022.3.22f1';
  
  // ウィンドウサイズ
  static readonly WINDOW_WIDTH = 1200;
  static readonly WINDOW_HEIGHT = 800;
  static readonly MIN_WINDOW_WIDTH = 800;
  static readonly MIN_WINDOW_HEIGHT = 600;
}

/**
 * UI関連の定数
 */
export class UIConstants {
  // デフォルトテーマ（設定で変更可能）
  static readonly DEFAULT_THEME = 'light' as const;
  
  // デフォルト言語（設定で変更可能）
  static readonly DEFAULT_LANGUAGE = 'ja' as const;
  
  // 免責事項表示設定（設定で変更可能）
  static readonly SHOW_DISCLAIMER_ON_STARTUP = true;
  
  // 利用可能なテーマ
  static readonly AVAILABLE_THEMES = ['light', 'dark'] as const;
  
  // 利用可能な言語
  static readonly AVAILABLE_LANGUAGES = ['ja', 'en'] as const;
}

/**
 * ファイル処理関連の定数
 */
export class FileConstants {
  // 対応ファイル拡張子
  static readonly SUPPORTED_EXTENSIONS = ['.unitypackage'] as const;
  
  // ファイルフィルター（ダイアログ用）
  static readonly FILE_FILTERS = [
    { name: 'Unity Package', extensions: ['unitypackage'] },
    { name: 'All Files', extensions: ['*'] }
  ];
  
  // GUID正規表現パターン
  static readonly GUID_PATTERN = /^[a-fA-F0-9]{32}$/;
  
  // パストラバーサル攻撃防止パターン
  static readonly PATH_TRAVERSAL_PATTERNS = ['../', '../'];
}

/**
 * セキュリティ関連の定数
 */
export class SecurityConstants {
  // 危険度レベル
  static readonly SEVERITY_LEVELS = ['critical', 'warning', 'info'] as const;
  
  // カテゴリ一覧
  static readonly SCAN_CATEGORIES = [
    'network',
    'fileSystem', 
    'process',
    'native',
    'reflection',
    'registry',
    'dll',
    'executable',
    'script',
    'archive',
  ] as const;
  
}

/**
 * 開発・デバッグ関連の定数
 */
export class DevConstants {
  // デバッグモード（環境変数から取得）
  static readonly DEBUG_MODE = process.env.NODE_ENV === 'development';
  
  // ログレベル
  static readonly LOG_LEVEL = DevConstants.DEBUG_MODE ? 'debug' : 'info';
  
  // 開発サーバーURL
  static readonly DEV_SERVER_URL = 'http://localhost:5173';
}

/**
 * 将来の設定機能で変更可能な値のデフォルト設定
 */
export class SettingsDefaults {
  // 外観設定
  static readonly THEME = UIConstants.DEFAULT_THEME;
  static readonly LANGUAGE = UIConstants.DEFAULT_LANGUAGE;
  static readonly SHOW_DISCLAIMER = UIConstants.SHOW_DISCLAIMER_ON_STARTUP;
  
  // スキャン設定
  static readonly PATTERN_FILE = PatternConstants.DEFAULT_PATTERN_FILE;
  static readonly PATTERN_PRESET = PatternConstants.DEFAULT_PRESET;
  static readonly EXTENSION_FILE = ExtensionConstants.DEFAULT_EXTENSION_FILE;
  static readonly EXTENSION_PRESET = ExtensionConstants.DEFAULT_EXTENSION_PRESET;
  static readonly MAX_FILE_SIZE = ScanConstants.DEFAULT_MAX_FILE_SIZE;
  
  // 高度な設定
  static readonly CUSTOM_PATTERNS: any[] = [];
  static readonly EXCLUDE_PATHS: string[] = [];
  static readonly AUTO_SCAN = false;
  static readonly SAVE_REPORTS = false;
  static readonly REPORTS_DIRECTORY = '';
  static readonly CHECK_FOR_UPDATES = true;
}

// 型定義のエクスポート
export type Theme = typeof UIConstants.AVAILABLE_THEMES[number];
export type Language = typeof UIConstants.AVAILABLE_LANGUAGES[number];
export type SeverityLevel = typeof SecurityConstants.SEVERITY_LEVELS[number];
export type ScanCategory = typeof SecurityConstants.SCAN_CATEGORIES[number];
export type PresetName = typeof PatternConstants.AVAILABLE_PRESETS[number];