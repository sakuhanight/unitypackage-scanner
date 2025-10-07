# コーディング規約 (Coding Conventions)

ゆにぱけスキャナー開発における統一されたコーディング規約

## 📋 目次

- [TypeScript](#typescript)
- [React](#react)
- [ファイル・ディレクトリ構成](#ファイルディレクトリ構成)
- [命名規約](#命名規約)
- [コメント・ドキュメント](#コメントドキュメント)
- [エラーハンドリング](#エラーハンドリング)
- [パフォーマンス](#パフォーマンス)
- [セキュリティ](#セキュリティ)

## 🔧 TypeScript

### 基本方針

- **厳格な型定義**: `any`の使用を避け、適切な型を定義する
- **null安全**: `strictNullChecks`を有効にし、undefinedチェックを徹底する
- **型推論の活用**: 明示的な型注釈が必要な場合のみ記述する

### 型定義

```typescript
// ✅ Good: 明確な型定義
interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

interface ScanProgress {
  stage: 'parsing' | 'analyzing' | 'complete';
  percentage: number;
  currentFile?: string;
}

// ❌ Bad: any型の使用
interface BadResult {
  data: any;
  status: any;
}
```

### 関数定義

```typescript
// ✅ Good: 明確な引数・戻り値型
const analyzePackage = async (
  filePath: string,
  options: AnalysisOptions
): Promise<AnalysisResult[]> => {
  // 実装
};

// ✅ Good: オプショナル引数の適切な使用
const createAnalysisReport = (
  results: AnalysisResult[],
  format: 'json' | 'markdown' = 'json'
): string => {
  // 実装
};

// ❌ Bad: 型注釈なし
const analyzePackage = async (filePath, options) => {
  // 実装
};
```

### Enum vs Union Types

```typescript
// ✅ Good: Union Typesを優先
type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type AnalysisSeverity = 'critical' | 'warning' | 'info';

// ✅ Good: 値が必要な場合のみEnum
enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNAL_SERVER_ERROR = 500
}

// ❌ Bad: 不要なEnum
enum BadLogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}
```

### Generic Types

```typescript
// ✅ Good: 再利用可能なGeneric型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Repository<T, K> {
  findById(id: K): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: K): Promise<boolean>;
}

// ✅ Good: Generic関数
const createValidator = <T>(
  schema: Schema<T>
): ((data: unknown) => data is T) => {
  return (data): data is T => {
    return schema.validate(data);
  };
};
```

## ⚛️ React

### コンポーネント定義

```typescript
// ✅ Good: 関数コンポーネント + TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size = 'medium',
  disabled = false,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ❌ Bad: Props型定義なし
export const Button = (props) => {
  return <button {...props} />;
};
```

### Hooks

```typescript
// ✅ Good: カスタムフック
interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw new AuthenticationError('Login failed', error);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    authService.logout();
  }, []);

  return { isAuthenticated, user, login, logout };
};

// ✅ Good: useEffect依存配列の管理
export const ScanProgress: React.FC<{ scanId: string }> = ({ scanId }) => {
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  useEffect(() => {
    const unsubscribe = scanService.subscribeToProgress(
      scanId,
      setProgress
    );
    return unsubscribe;
  }, [scanId]); // 依存配列を明示的に管理
};
```

### State Management

```typescript
// ✅ Good: Context + Reducer
interface AppState {
  currentScreen: Screen;
  scanResults: ScanResult[];
  settings: AppSettings;
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'ADD_SCAN_RESULT'; payload: ScanResult }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'ADD_SCAN_RESULT':
      return {
        ...state,
        scanResults: [...state.scanResults, action.payload]
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    default:
      return state;
  }
};
```

## 📁 ファイル・ディレクトリ構成

### ディレクトリ構造

```
src/
├── main/               # Electronメインプロセス
├── renderer/           # Reactレンダラープロセス
├── shared/             # 共通定義
└── types/              # 型定義（shared配下に移動予定）
```

### ファイル命名規則

```typescript
// ✅ Good: ファイル名とエクスポート名の一致
// authService.ts
export class AuthService { }

// Button.tsx
export const Button: React.FC = () => { };

// types.ts (複数の型をエクスポート)
export interface User { }
export interface Session { }

// ❌ Bad: ファイル名とエクスポート名の不一致
// auth.ts
export class AuthenticationService { }
```

### index.ts での再エクスポート

```typescript
// ✅ Good: components/index.ts
export { Button } from './Button';
export { Modal } from './Modal';
export { ProgressBar } from './ProgressBar';

// ✅ Good: services/index.ts
export { AuthService } from './authService';
export { ScanService } from './scanService';
export { StorageService } from './storageService';

// 使用側
import { Button, Modal } from '../components';
import { AuthService, ScanService } from '../services';
```

### ファイルサイズの目安

- **コンポーネント**: 200行以下
- **サービスクラス**: 300行以下
- **型定義ファイル**: 制限なし
- **1000行を超える場合**: 分割を検討

## 🏷️ 命名規約

### 変数・関数

```typescript
// ✅ Good: camelCase
const userName = 'sakuha';
const apiEndpoint = 'https://api.example.com';
const isAuthenticated = true;

const getUserById = (id: string): User => { };
const validateApiKey = (key: string): boolean => { };

// ❌ Bad: snake_case, PascalCase
const user_name = 'sakuha';
const ApiEndpoint = 'https://api.example.com';
const IsAuthenticated = true;
```

### 定数

```typescript
// ✅ Good: SCREAMING_SNAKE_CASE
const API_TIMEOUT_MS = 30000;
const MAX_FILE_SIZE_MB = 100;
const DEFAULT_ANALYSIS_DEPTH = 'standard';

// ✅ Good: 設定オブジェクト
const APP_CONFIG = {
  API_TIMEOUT_MS: 30000,
  MAX_FILE_SIZE_MB: 100,
  SUPPORTED_PROVIDERS: ['claude', 'openai', 'gemini'] as const
} as const;
```

### クラス・インターフェース

```typescript
// ✅ Good: PascalCase
class AuthenticationService { }
interface AnalysisResult { }
type ApiProvider = 'claude' | 'openai' | 'gemini';

// ✅ Good: Interface vs Type の使い分け
interface Props {  // コンポーネントのProps
  title: string;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';  // Union types
```

### ファイル・ディレクトリ

```typescript
// ✅ Good: camelCase（ファイル）
authService.ts
scanResults.tsx
analysisTypes.ts

// ✅ Good: kebab-case（ディレクトリ）
auth-flow/
scan-results/
analysis-types/

// ✅ Good: PascalCase（Reactコンポーネント）
Button.tsx
AnalysisResult.tsx
AuthFlow.tsx
```

## 💬 コメント・ドキュメント

### コメントの方針

- **コードが自己説明的になるよう努める**
- **なぜそうするかを説明する（何をするかではなく）**
- **複雑なロジックや制約条件を説明する**

```typescript
// ✅ Good: 理由を説明
// Claude APIは4096トークン制限があるため、大きなファイルは分割して送信
const chunkAnalysisData = (data: string): string[] => {
  const CHUNK_SIZE = 3000; // 安全マージンを考慮
  // 実装
};

// APIキーの形式検証（プロバイダーごとに異なる）
const validateApiKey = (provider: string, key: string): boolean => {
  switch (provider) {
    case 'claude':
      // Claude: sk-ant-で始まる形式
      return /^sk-ant-[a-zA-Z0-9]{40,}$/.test(key);
    // その他の実装
  }
};

// ❌ Bad: コードを単純に説明
// ユーザー名を取得する
const getUserName = () => { };

// ファイルサイズをチェックする
if (file.size > MAX_SIZE) { }
```

### JSDoc

```typescript
/**
 * UnityPackageファイルを解析してメタデータを抽出します
 * 
 * @param filePath - 解析対象の.unitypackageファイルパス
 * @param options - 解析オプション
 * @returns 解析結果のPromise
 * 
 * @throws {FileNotFoundError} ファイルが存在しない場合
 * @throws {InvalidFormatError} .unitypackage形式でない場合
 * 
 * @example
 * ```typescript
 * const result = await parseUnityPackage('/path/to/package.unitypackage', {
 *   extractAssets: true,
 *   validateScripts: true
 * });
 * ```
 */
export const parseUnityPackage = async (
  filePath: string,
  options: ParseOptions = {}
): Promise<PackageMetadata> => {
  // 実装
};
```

## 🚨 エラーハンドリング

### カスタムエラークラス

```typescript
// ✅ Good: 具体的なエラークラス
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PackageParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PackageParseError';
  }
}

// ✅ Good: 使用例
try {
  await authenticateWithClaude(apiKey);
} catch (error) {
  if (error instanceof AuthenticationError) {
    showUserMessage(`${error.provider}の認証に失敗しました: ${error.message}`);
    logger.warn('Authentication failed', { provider: error.provider, cause: error.cause });
  } else {
    logger.error('Unexpected authentication error', error);
    showUserMessage('予期しないエラーが発生しました');
  }
}
```

### Result型パターン

```typescript
// ✅ Good: Result型による安全なエラーハンドリング
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const parseApiKey = (input: string): Result<string, string> => {
  if (!input.trim()) {
    return { success: false, error: 'APIキーが入力されていません' };
  }
  
  if (input.length < 10) {
    return { success: false, error: 'APIキーが短すぎます' };
  }
  
  return { success: true, data: input.trim() };
};

// 使用例
const result = parseApiKey(userInput);
if (result.success) {
  console.log('Valid API key:', result.data);
} else {
  console.error('Invalid API key:', result.error);
}
```

## ⚡ パフォーマンス

### React最適化

```typescript
// ✅ Good: React.memo + 適切な依存関係
interface ScanResultItemProps {
  result: ScanResult;
  onSelect: (id: string) => void;
}

export const ScanResultItem = React.memo<ScanResultItemProps>(
  ({ result, onSelect }) => {
    const handleClick = useCallback(() => {
      onSelect(result.id);
    }, [onSelect, result.id]);

    return (
      <div onClick={handleClick}>
        <h3>{result.title}</h3>
        <p>{result.summary}</p>
      </div>
    );
  }
);

// ✅ Good: useMemo for expensive calculations
export const AnalysisStats: React.FC<{ results: ScanResult[] }> = ({ results }) => {
  const stats = useMemo(() => {
    return {
      critical: results.filter(r => r.severity === 'critical').length,
      warning: results.filter(r => r.severity === 'warning').length,
      info: results.filter(r => r.severity === 'info').length
    };
  }, [results]);

  return <div>{/* stats表示 */}</div>;
};
```

### 非同期処理

```typescript
// ✅ Good: 適切な並行処理
const analyzePackageFiles = async (files: FileData[]): Promise<AnalysisResult[]> => {
  // 小さなファイルは並行処理
  const smallFiles = files.filter(f => f.size < 1024 * 1024); // 1MB未満
  const largeFiles = files.filter(f => f.size >= 1024 * 1024);

  const [smallResults, largeResults] = await Promise.all([
    Promise.all(smallFiles.map(file => analyzeFile(file))),
    // 大きなファイルは順次処理（メモリ使用量を抑制）
    sequentialAnalysis(largeFiles)
  ]);

  return [...smallResults, ...largeResults];
};

const sequentialAnalysis = async (files: FileData[]): Promise<AnalysisResult[]> => {
  const results: AnalysisResult[] = [];
  for (const file of files) {
    results.push(await analyzeFile(file));
  }
  return results;
};
```

## 🔒 セキュリティ

### 機密情報の取り扱い

```typescript
// ✅ Good: APIキーのマスキング
const maskApiKey = (key: string): string => {
  if (key.length <= 8) return '*'.repeat(key.length);
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
};

// ✅ Good: ログに機密情報を出力しない
logger.info('Authentication attempt', {
  provider: 'claude',
  keyLength: apiKey.length,
  keyPrefix: apiKey.slice(0, 6) // プレフィックスのみ
});

// ❌ Bad: 機密情報をログ出力
logger.info('Authentication', { apiKey }); // 絶対にNG
```

### 入力検証

```typescript
// ✅ Good: 厳格な入力検証
const validateFilePath = (path: string): Result<string, string> => {
  // パストラバーサル攻撃の防止
  if (path.includes('../') || path.includes('..\\')) {
    return { success: false, error: '無効なファイルパスです' };
  }
  
  // 拡張子チェック
  if (!path.endsWith('.unitypackage')) {
    return { success: false, error: '.unitypackageファイルを選択してください' };
  }
  
  return { success: true, data: path };
};

// ✅ Good: サニタイゼーション
const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // HTMLタグ・クォートを除去
    .slice(0, 1000); // 長さ制限
};
```

---

## 📏 コードレビューチェックリスト

### 実装前
- [ ] 型定義は適切か
- [ ] エラーハンドリングは考慮されているか
- [ ] パフォーマンスに問題はないか
- [ ] セキュリティリスクはないか

### 実装後
- [ ] 命名規約に従っているか
- [ ] 不要なコメントはないか
- [ ] テストは十分か
- [ ] ドキュメントは更新されているか

---

この規約に従うことで、保守性が高く安全なコードベースを維持できます。新しいパターンや改善点があれば、チーム内で議論して規約を更新していきましょう。