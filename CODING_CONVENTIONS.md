# Coding Conventions - ゆにぱけスキャナー

このドキュメントは、ゆにぱけスキャナー（UnityPackage Scanner）プロジェクトにおけるコーディング規約を定めています。

## 📋 目次

1. [基本原則](#基本原則)
2. [TypeScript 規約](#typescript-規約)
3. [React + Redux 規約](#react--redux-規約)
4. [ファイル・ディレクトリ構成](#ファイルディレクトリ構成)
5. [命名規約](#命名規約)
6. [コメント規約](#コメント規約)
7. [エラーハンドリング](#エラーハンドリング)
8. [Electron 規約](#electron-規約)
9. [CSS/Tailwind 規約](#csstailwind-規約)
10. [テスト規約](#テスト規約)
11. [Git 規約](#git-規約)
12. [ツール設定](#ツール設定)

## 🎯 基本原則

### コード品質の原則
- **可読性を最優先** - コードは書くより読まれることが多い
- **一貫性を保つ** - プロジェクト全体で統一されたスタイル
- **シンプルさを追求** - 複雑さより明確さを選ぶ
- **セキュリティファースト** - セキュリティ分析ツールとして安全性を重視
- **パフォーマンス意識** - 大容量ファイルの処理を考慮

### プロジェクト特有の原則
- **AIを使用しない** - パターンマッチングのロジックは明確に
- **オフライン完結** - 外部通信は行わない
- **クロスプラットフォーム対応** - OS固有の実装を避ける

## 📝 TypeScript 規約

### 基本設定

**tsconfig.json の必須設定:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 型定義

**✅ 推奨:**
```typescript
// 明示的な型定義
interface ScanResult {
  readonly id: string;
  readonly severity: 'critical' | 'warning' | 'info';
  readonly pattern: string;
  readonly filePath: string;
  readonly lineNumber?: number;
}

// ユニオン型は型安全性を重視
type DetectionCategory = 'network' | 'fileSystem' | 'process' | 'native' | 'reflection' | 'registry';

// 関数の戻り値型を明示
function analyzePackage(filePath: string): Promise<ScanResult[]> {
  // ...
}
```

**❌ 避けるべき:**
```typescript
// any の使用
function processData(data: any): any {
  // ...
}

// 型推論に頼りすぎる複雑な型
const result = complexOperation().map(x => x.transform().filter());
```

### 型ガード・ユーティリティ型

**型ガードの実装:**
```typescript
// カスタム型ガード
function isCriticalResult(result: ScanResult): result is ScanResult & { severity: 'critical' } {
  return result.severity === 'critical';
}

// 型の絞り込み
function processCriticalResults(results: ScanResult[]): void {
  results.filter(isCriticalResult).forEach(result => {
    // result.severity は 'critical' として推論される
    handleCriticalIssue(result);
  });
}
```

### エラーハンドリング

**Result型パターンの使用:**
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function scanPackage(filePath: string): Promise<Result<ScanResult[]>> {
  try {
    const results = await performScan(filePath);
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 使用例
const scanResult = await scanPackage('/path/to/package');
if (scanResult.success) {
  // scanResult.data は ScanResult[] として推論される
  displayResults(scanResult.data);
} else {
  // scanResult.error は Error として推論される
  logError(scanResult.error);
}
```

## ⚛️ React + Redux 規約

### コンポーネント定義

**関数コンポーネントを使用:**
```typescript
// ✅ 推奨: 関数コンポーネント + TypeScript
interface ScanProgressProps {
  readonly progress: number;
  readonly currentFile: string;
  readonly onCancel: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ 
  progress, 
  currentFile, 
  onCancel 
}) => {
  return (
    <div className="scan-progress">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <p className="current-file">{currentFile}</p>
      <button onClick={onCancel} type="button">
        キャンセル
      </button>
    </div>
  );
};
```

**❌ 避けるべき:**
```typescript
// クラスコンポーネント（新規では使用しない）
class ScanProgress extends React.Component<ScanProgressProps> {
  render() {
    // ...
  }
}
```

### hooks の使用

**カスタムhooksでロジックを分離:**
```typescript
// カスタムhook
export function useScanResults(packagePath: string | null) {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (path: string) => {
    setIsScanning(true);
    setError(null);
    
    try {
      const scanResult = await window.electronAPI.scanPackage(path);
      if (scanResult.success) {
        setResults(scanResult.data);
      } else {
        setError(scanResult.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { results, isScanning, error, startScan };
}

// コンポーネントでの使用
export const ScanContainer: React.FC = () => {
  const { results, isScanning, error, startScan } = useScanResults();
  
  // ...
};
```

### 状態管理

**Redux Toolkit を使用した状態管理:**

#### Redux Slice の定義

```typescript
// store/slices/scanSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ScanResult } from '@/shared/types/scan';

interface ScanState {
  readonly status: 'idle' | 'scanning' | 'completed' | 'error';
  readonly progress: number;
  readonly currentFile: string;
  readonly result: ScanResult | null;
  readonly error: string | null;
}

const initialState: ScanState = {
  status: 'idle',
  progress: 0,
  currentFile: '',
  result: null,
  error: null,
};

export const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    startScan: (state) => {
      state.status = 'scanning';
      state.progress = 0;
      state.error = null;
    },
    updateProgress: (state, action: PayloadAction<{ progress: number; currentFile: string }>) => {
      state.progress = action.payload.progress;
      state.currentFile = action.payload.currentFile;
    },
    setScanResult: (state, action: PayloadAction<ScanResult>) => {
      state.status = 'completed';
      state.result = action.payload;
      state.progress = 100;
    },
    setScanError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    resetScan: (state) => {
      return initialState;
    },
  },
});

export const { startScan, updateProgress, setScanResult, setScanError, resetScan } = scanSlice.actions;
export default scanSlice.reducer;
```

#### Store の設定

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import scanReducer from './slices/scanSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import { scanApi } from './api/scanApi';

export const store = configureStore({
  reducer: {
    scan: scanReducer,
    settings: settingsReducer,
    ui: uiReducer,
    [scanApi.reducerPath]: scanApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // RTK Query のアクションを無視
        ignoredActions: [scanApi.util.resetApiState.type],
      },
    }).concat(scanApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 型安全な hooks
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### RTK Query の使用

```typescript
// store/api/scanApi.ts
import { createApi, ipcRenderer } from '@reduxjs/toolkit/query/react';
import type { ScanResult, ScanOptions } from '@/shared/types/scan';

// IPC ベース query の定義
const ipcBaseQuery = () => {
  return async ({ endpoint, data }: { endpoint: string; data?: any }) => {
    try {
      const result = await window.electronAPI[endpoint](data);
      return { data: result };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };
};

export const scanApi = createApi({
  reducerPath: 'scanApi',
  baseQuery: ipcBaseQuery(),
  tagTypes: ['Scan', 'Settings'],
  endpoints: (builder) => ({
    scanPackage: builder.mutation<ScanResult, { filePath: string; options?: ScanOptions }>({
      query: ({ filePath, options }) => ({
        endpoint: 'scanPackage',
        data: { filePath, options },
      }),
      invalidatesTags: ['Scan'],
    }),
    getSettings: builder.query<AppSettings, void>({
      query: () => ({ endpoint: 'getSettings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<void, Partial<AppSettings>>({
      query: (settings) => ({
        endpoint: 'updateSettings',
        data: settings,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useScanPackageMutation, useGetSettingsQuery, useUpdateSettingsMutation } = scanApi;
```

#### コンポーネントでの使用

```typescript
// components/scan/ScanContainer.tsx
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { useScanPackageMutation } from '@/store/api/scanApi';
import { startScan, setScanResult, setScanError } from '@/store/slices/scanSlice';

export const ScanContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, progress, currentFile, result, error } = useAppSelector((state) => state.scan);
  
  const [scanPackage, { isLoading }] = useScanPackageMutation();

  const handleScanStart = useCallback(async (filePath: string) => {
    dispatch(startScan());
    
    try {
      const result = await scanPackage({ filePath }).unwrap();
      dispatch(setScanResult(result));
    } catch (error) {
      dispatch(setScanError(error.message));
    }
  }, [dispatch, scanPackage]);

  return (
    <div>
      {status === 'scanning' && (
        <ScanProgress progress={progress} currentFile={currentFile} />
      )}
      {status === 'completed' && result && (
        <ScanResults results={result} />
      )}
      {status === 'error' && error && (
        <ErrorMessage message={error} />
      )}
    </div>
  );
};
```

## 📁 ファイル・ディレクトリ構成

### ディレクトリ構造

```
src/
├── main/                     # Electron メインプロセス
│   ├── index.ts             # エントリーポイント
│   ├── ipc/                 # IPC通信ハンドラ
│   │   ├── index.ts
│   │   ├── scan.ts
│   │   └── settings.ts
│   └── services/            # ビジネスロジック
│       ├── packageParser.ts
│       └── scanner/
│           ├── index.ts
│           ├── patternMatcher.ts
│           ├── analyzer.ts
│           └── patterns/
│               ├── index.ts
│               ├── network.ts
│               ├── fileSystem.ts
│               ├── process.ts
│               ├── native.ts
│               ├── reflection.ts
│               └── registry.ts
├── renderer/                # React フロントエンド
│   ├── App.tsx
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── common/          # 汎用コンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── scan/            # スキャン関連
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   └── ResultDisplay/
│   │   │       ├── index.tsx
│   │   │       ├── SimpleView.tsx
│   │   │       └── DetailView.tsx
│   │   └── settings/        # 設定関連
│   │       ├── SettingsModal.tsx
│   │       ├── PatternSettings.tsx
│   │       └── AppSettings.tsx
│   ├── hooks/               # カスタムhooks
│   │   ├── useScanResults.ts
│   │   ├── useSettings.ts
│   │   └── useTheme.ts
│   ├── store/               # Redux状態管理
│   │   ├── index.ts         # Store設定
│   │   ├── slices/          # Redux slices
│   │   │   ├── scanSlice.ts
│   │   │   ├── settingsSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── api/             # RTK Query APIs
│   │       └── scanApi.ts
│   ├── utils/               # ユーティリティ関数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── styles/              # スタイル関連
│   │   └── globals.css
│   └── types/               # レンダラー固有の型
│       └── renderer.d.ts
└── shared/                  # 共通の型・定数
    ├── types/
    │   ├── scan.ts
    │   ├── settings.ts
    │   └── ipc.ts
    ├── constants/
    │   ├── patterns.ts
    │   └── app.ts
    └── utils/
        ├── validation.ts
        └── serialization.ts
```

### ファイル命名規約

**ファイル名:**
- **コンポーネント**: PascalCase (例: `ScanProgress.tsx`)
- **hooks**: camelCase + use prefix (例: `useScanResults.ts`)
- **ユーティリティ**: camelCase (例: `formatters.ts`)
- **型定義**: camelCase (例: `scanTypes.ts`)
- **定数**: camelCase (例: `appConstants.ts`)

**ディレクトリ名:**
- kebab-case または camelCase (例: `scan-results` または `scanResults`)
- 機能別にグループ化

## 🏷️ 命名規約

### TypeScript

**変数・関数:**
```typescript
// ✅ 推奨
const scanResults = [];
const isScanning = false;
const getCurrentTimestamp = () => Date.now();

// ❌ 避けるべき
const scan_results = []; // snake_case
const IsScanning = false; // PascalCase for variables
```

**定数:**
```typescript
// ✅ 推奨
const DEFAULT_SCAN_TIMEOUT = 30000;
const SUPPORTED_FILE_EXTENSIONS = ['.unitypackage'] as const;

// 設定オブジェクト
const SCAN_PATTERNS = {
  NETWORK: /UnityWebRequest\s*\./g,
  PROCESS: /Process\.Start\s*\(/g,
} as const;
```

**クラス・インターフェース:**
```typescript
// ✅ 推奨
class PatternMatcher {}
interface ScanResult {}
type PatternCategory = string;

// プレフィックスの使用は避ける
// ❌ 避けるべき
interface IScanResult {} // I プレフィックス
class CPatternMatcher {} // C プレフィックス
```

### React コンポーネント

**コンポーネント名:**
```typescript
// ✅ 推奨: 機能を表す具体的な名前
const ScanProgressIndicator: React.FC = () => {};
const PackageFileUploader: React.FC = () => {};
const SecurityResultSummary: React.FC = () => {};

// ❌ 避けるべき: 抽象的すぎる名前
const Container: React.FC = () => {};
const Component: React.FC = () => {};
const Widget: React.FC = () => {};
```

**Props命名:**
```typescript
interface ComponentProps {
  // Boolean props は is/has/can/should などで始める
  readonly isLoading: boolean;
  readonly hasErrors: boolean;
  readonly canCancel: boolean;
  readonly shouldAutoStart: boolean;
  
  // イベントハンドラは on で始める
  readonly onFileSelected: (file: File) => void;
  readonly onScanComplete: (results: ScanResult[]) => void;
  readonly onError: (error: Error) => void;
  
  // データ props は具体的な名前
  readonly scanResults: ScanResult[];
  readonly selectedFile: File | null;
  readonly progressPercentage: number;
}
```

## 💬 コメント規約

### TSDoc の使用

**関数・メソッド:**
```typescript
/**
 * UnityPackageファイルをスキャンして潜在的なセキュリティリスクを検出する
 * 
 * @param filePath - スキャン対象のUnityPackageファイルのパス
 * @param options - スキャンオプション
 * @returns スキャン結果のPromise
 * 
 * @throws {PackageParseError} パッケージの解析に失敗した場合
 * @throws {ScanTimeoutError} スキャンがタイムアウトした場合
 * 
 * @example
 * ```typescript
 * const results = await scanUnityPackage('/path/to/package.unitypackage', {
 *   timeout: 30000,
 *   strictMode: true
 * });
 * ```
 */
export async function scanUnityPackage(
  filePath: string,
  options: ScanOptions = {}
): Promise<ScanResult[]> {
  // 実装...
}
```

**複雑なロジック:**
```typescript
export function analyzeCodePattern(code: string, pattern: RegExp): PatternMatch[] {
  // コメントや文字列リテラル内のマッチを除外するため、
  // まずコードを構文解析してから検索を実行
  const cleanCode = removeCommentsAndStrings(code);
  
  // パターンマッチングを実行
  // 注意: 複数行にわたるパターンも考慮する必要がある
  const matches: PatternMatch[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = pattern.exec(cleanCode)) !== null) {
    // マッチした位置から元のコード内での行番号を計算
    const lineNumber = calculateLineNumber(code, match.index);
    
    matches.push({
      pattern: match[0],
      index: match.index,
      lineNumber,
      context: extractContext(code, match.index)
    });
  }
  
  return matches;
}
```

**TODO・FIXME:**
```typescript
// TODO(sakuha): 暗号化されたパッケージへの対応を追加 (Issue #123)
// FIXME: 大容量ファイルでメモリ使用量が多くなる問題を修正
// HACK: 一時的な回避策 - 将来的にはより良い実装に変更予定
```

## 🚨 エラーハンドリング

### エラークラスの定義

```typescript
// ベースエラークラス
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 具体的なエラークラス
export class PackageParseError extends AppError {
  readonly code = 'PACKAGE_PARSE_ERROR';
  readonly userMessage = 'パッケージファイルの解析に失敗しました';
}

export class ScanTimeoutError extends AppError {
  readonly code = 'SCAN_TIMEOUT';
  readonly userMessage = 'スキャンがタイムアウトしました';
}

export class UnsupportedFileError extends AppError {
  readonly code = 'UNSUPPORTED_FILE';
  readonly userMessage = 'サポートされていないファイル形式です';
}
```

### エラーハンドリングパターン

**Result型を使用した関数型エラーハンドリング:**
```typescript
type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// リポジトリ層
export async function parsePackageFile(filePath: string): Promise<Result<PackageInfo>> {
  try {
    const packageInfo = await performParsing(filePath);
    return { success: true, data: packageInfo };
  } catch (error) {
    if (error instanceof PackageParseError) {
      return { success: false, error };
    }
    return { success: false, error: new PackageParseError('パッケージの解析に失敗', error as Error) };
  }
}

// サービス層
export async function scanPackage(filePath: string): Promise<Result<ScanResult[]>> {
  const parseResult = await parsePackageFile(filePath);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }
  
  // スキャン実行...
  return { success: true, data: results };
}

// UI層
const handleScanClick = async () => {
  const result = await scanPackage(selectedFile.path);
  
  if (result.success) {
    setScanResults(result.data);
    setCurrentView('results');
  } else {
    showErrorMessage(result.error.userMessage);
    logError('Scan failed', result.error);
  }
};
```

## ⚡ Electron 規約

### IPC通信

**型安全なIPC:**
```typescript
// shared/types/ipc.ts
export interface IPCInvokeMap {
  'scan-package': {
    input: { filePath: string; options?: ScanOptions };
    output: Result<ScanResult[]>;
  };
  'get-settings': {
    input: void;
    output: AppSettings;
  };
  'update-settings': {
    input: Partial<AppSettings>;
    output: void;
  };
}

// main/ipc/scan.ts
export function setupScanHandlers() {
  ipcMain.handle('scan-package', async (event, { filePath, options }) => {
    try {
      const results = await scanUnityPackage(filePath, options);
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error as AppError };
    }
  });
}

// renderer/types/electron.d.ts
declare global {
  interface Window {
    electronAPI: {
      scanPackage: (filePath: string, options?: ScanOptions) => Promise<Result<ScanResult[]>>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
    };
  }
}
```

### セキュリティ

**contextIsolation を有効にしたpreload:**
```typescript
// main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 型安全なIPC呼び出し
  scanPackage: (filePath: string, options?: ScanOptions) =>
    ipcRenderer.invoke('scan-package', { filePath, options }),
    
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),
    
  updateSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke('update-settings', settings),
    
  // セキュリティ: 必要最小限のAPIのみ公開
  // ファイルシステムへの直接アクセスは提供しない
});
```

## 🎨 CSS/Tailwind 規約

### Tailwind CSS クラス

**クラス名の順序:**
```tsx
// ✅ 推奨: 論理的グループ順序
<div className="
  flex flex-col items-center justify-center
  w-full h-screen
  p-4 m-2
  bg-white border border-gray-300 rounded-lg shadow-md
  text-gray-800 text-lg font-semibold
  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
  transition-colors duration-200
">
  コンテンツ
</div>

// ❌ 避けるべき: ランダムな順序
<div className="bg-white text-lg flex p-4 hover:bg-gray-50 w-full rounded-lg">
```

**カスタムコンポーネントでのスタイル管理:**
```tsx
// ✅ 推奨: 条件付きスタイリング
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  variant,
  size,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className || ''}`.trim();
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
```

### カスタムCSS

**CSS Custom Properties の使用:**
```css
/* styles/globals.css */
@import "tailwindcss";

:root {
  /* アプリ固有のカラーパレット */
  --color-primary: #4A90E2;
  --color-success: #5CB85C;
  --color-warning: #F0AD4E;
  --color-error: #D9534F;
  
  /* セマンティックカラー */
  --color-critical: var(--color-error);
  --color-warning-level: var(--color-warning);
  --color-info: var(--color-primary);
  --color-safe: var(--color-success);
}

[data-theme="dark"] {
  --color-primary: #6BA3F5;
  /* ダークテーマ用の色調整 */
}
```

## 🧪 テスト規約

### ユニットテスト

**テストファイル命名:**
- `*.test.ts` - ユニットテスト
- `*.spec.ts` - 統合テスト
- `*.e2e.ts` - E2Eテスト

**テスト構造:**
```typescript
// tests/unit/scanner/patternMatcher.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatternMatcher } from '@/main/services/scanner/patternMatcher';

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;
  
  beforeEach(() => {
    matcher = new PatternMatcher();
  });
  
  describe('network patterns', () => {
    it('should detect UnityWebRequest usage', () => {
      // Arrange
      const code = 'var request = UnityWebRequest.Get("https://example.com");';
      
      // Act
      const results = matcher.scanCode(code);
      
      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        pattern: 'UnityWebRequest',
        category: 'network',
        severity: 'warning'
      });
    });
    
    it('should not detect patterns in comments', () => {
      // Arrange
      const code = '// UnityWebRequest.Get("https://example.com");';
      
      // Act
      const results = matcher.scanCode(code);
      
      // Assert
      expect(results).toHaveLength(0);
    });
    
    it('should handle multiline patterns', () => {
      // Arrange
      const code = `
        var request = UnityWebRequest
          .Get("https://example.com");
      `;
      
      // Act
      const results = matcher.scanCode(code);
      
      // Assert
      expect(results).toHaveLength(1);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(() => matcher.scanCode('')).not.toThrow();
      expect(matcher.scanCode('')).toEqual([]);
    });
    
    it('should handle very large files', () => {
      const largeCode = 'var x = 1;\n'.repeat(100000);
      
      expect(() => matcher.scanCode(largeCode)).not.toThrow();
    });
  });
});
```

### E2Eテスト

**Playwright テスト:**
```typescript
// tests/e2e/scanning.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Package Scanning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // 初回起動時の注意事項ダイアログを処理
    if (await page.isVisible('[data-testid="disclaimer-dialog"]')) {
      await page.click('[data-testid="agree-button"]');
    }
  });
  
  test('should successfully scan a safe package', async ({ page }) => {
    // ファイルアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/safe-package.unitypackage'));
    
    // スキャン開始を確認
    await expect(page.locator('[data-testid="scan-progress"]')).toBeVisible();
    
    // スキャン完了を待つ（最大30秒）
    await page.waitForSelector('[data-testid="scan-complete"]', { timeout: 30000 });
    
    // 結果確認
    await expect(page.locator('[data-testid="result-status"]')).toContainText('✅ 問題なし');
    
    // スクリーンショット撮影（視覚的回帰テスト）
    await expect(page.locator('[data-testid="scan-results"]')).toHaveScreenshot('safe-package-results.png');
  });
  
  test('should detect network patterns', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/network-package.unitypackage'));
    
    await page.waitForSelector('[data-testid="scan-complete"]', { timeout: 30000 });
    
    // 警告レベルの結果を確認
    await expect(page.locator('[data-testid="result-status"]')).toContainText('⚠️ 注意が必要');
    
    // 詳細表示
    await page.click('[data-testid="view-details-button"]');
    await expect(page.locator('[data-testid="detail-view"]')).toBeVisible();
    
    // ネットワーク通信の検出を確認
    await expect(page.locator('[data-testid="warning-network"]')).toBeVisible();
    await expect(page.locator('[data-testid="warning-network"]')).toContainText('UnityWebRequest');
  });
  
  test('should export results in different formats', async ({ page }) => {
    // ... スキャン実行後
    
    // エクスポートボタンクリック
    await page.click('[data-testid="export-button"]');
    
    // JSON形式でエクスポート
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json"]')
    ]);
    
    expect(download.suggestedFilename()).toBe('scan-results.json');
    
    // ダウンロードされたファイルの内容確認
    const downloadPath = await download.path();
    const content = await readFileSync(downloadPath, 'utf-8');
    const results = JSON.parse(content);
    
    expect(results).toHaveProperty('scanDate');
    expect(results).toHaveProperty('results');
    expect(Array.isArray(results.results)).toBe(true);
  });
});
```

## 📚 Git 規約

### コミットメッセージ

**Conventional Commits 規約:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**コミットタイプ:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイルの変更（機能に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・変更
- `chore`: ビルドプロセスや補助ツールの変更
- `perf`: パフォーマンス改善
- `ci`: CI設定の変更

**例:**
```
feat(scanner): add reflection pattern detection

リフレクションによるコード実行パターンの検出機能を追加
- Assembly.Load の検出を追加
- Type.GetType の検出を追加
- 重大度をWarningに設定

Closes #42
```

### ブランチ戦略

**Git Flow ベースの戦略:**
- `main`: 本番リリース用（保護ブランチ）
- `develop`: 開発用統合ブランチ
- `feature/*`: 新機能開発
- `bugfix/*`: バグ修正
- `hotfix/*`: 緊急修正
- `release/*`: リリース準備

**ブランチ命名:**
```
feature/add-registry-patterns
bugfix/fix-large-file-memory-leak
hotfix/security-vulnerability-fix
release/v1.2.0
```

### プルリクエスト

**マージ前チェックリスト:**
- [ ] すべてのテストが通過
- [ ] コードレビュー完了
- [ ] ドキュメント更新済み
- [ ] CHANGELOGを更新
- [ ] ブレイキングチェンジがある場合はマイグレーションガイド作成

## 🛠️ ツール設定

### ESLint設定

**.eslintrc.js:**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // TypeScript関連
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // React関連
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // セキュリティ関連（セキュリティツールとして重要）
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // 一般的な品質ルール
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn', // 本番では error に変更
    'no-debugger': 'error',
    'no-alert': 'warn',
    
    // import/export関連
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external', 
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }]
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json'
      }
    }
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  }
};
```

### Prettier設定

**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### package.json スクリプト

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "electron src/main/index.ts",
    "dev:renderer": "vite",
    "build": "npm run build:main && npm run build:renderer",
    "build:main": "tsc -p tsconfig.main.json",
    "build:renderer": "vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "type-check:main": "tsc -p tsconfig.main.json --noEmit",
    "type-check:renderer": "tsc -p tsconfig.renderer.json --noEmit",
    "package": "electron-builder",
    "package:dir": "electron-builder --dir",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux"
  }
}
```

---

## 📋 チェックリスト

### コードレビュー時のチェックポイント

**コード品質:**
- [ ] 型安全性は担保されているか
- [ ] エラーハンドリングは適切か
- [ ] パフォーマンスを考慮した実装か
- [ ] セキュリティリスクはないか
- [ ] 可読性・保守性は高いか

**アーキテクチャ:**
- [ ] 適切な責務分離ができているか
- [ ] 依存関係は最小化されているか
- [ ] 再利用性は考慮されているか
- [ ] テスタビリティは高いか

**UI/UX:**
- [ ] アクセシビリティは考慮されているか
- [ ] レスポンシブデザインは適用されているか
- [ ] エラー状態の表示は適切か
- [ ] ローディング状態の表示は適切か

**テスト:**
- [ ] 適切なテストケースが書かれているか
- [ ] エッジケースは考慮されているか
- [ ] テストカバレッジは十分か

この規約に従うことで、保守性が高く安全なコードベースを維持できます。不明点があれば、チーム内で議論して改善していきましょう。

---

*製作者: 朔日工房 (tsuitachi-studio) / 鴇峰朔華*  
*最終更新: 2025年10月*