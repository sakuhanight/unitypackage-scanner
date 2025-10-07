# ゆにぱけスキャナー (unitypackage-scanner) 仕様書 v2.0

## 1. プロジェクト概要

### 1.1 プロジェクト名
- **日本語名**: ゆにぱけスキャナー
- **英語名**: unitypackage-scanner
- **略称**: upkg-scanner

### 1.2 目的
UnityPackage（.unitypackage）ファイルの内容をパターンマッチング技術により分析・検証するデスクトップアプリケーション

**基本方針**:
- **AIは使用しない** - パターンマッチングによる検出のみ
- 完全無償で公開（オープンソース）
- ユーザーのローカル環境で完結
- インターネット接続不要

### 1.3 対象ユーザー
- Unity開発者
- 第三者製UnityPackageを使用前にチェックしたい開発者
- パッケージの安全性を確認したい開発者

### 1.4 技術スタック
- **フロントエンド**: Electron + TypeScript + React
- **スタイリング**: Tailwind CSS v4
- **パッケージマネージャ**: pnpm
- **パッケージング**: Electron Builder
- **解析エンジン**: 正規表現 + パターンマッチング
- **テスト**: Vitest (ユニットテスト), Playwright (E2Eテスト)
- **CI/CD**: GitHub Actions
- **コード品質**: ESLint, Prettier

## 2. 機能要件

### 2.1 コア機能

#### 2.1.1 UnityPackageファイル読み込み
- ドラッグ&ドロップ対応
- ファイルブラウザからの選択
- 対応形式: `.unitypackage`
- ファイルサイズ制限: 500MB（設定で変更可能）

#### 2.1.2 パッケージ解析
- .unitypackage（tar.gz形式）の解凍
- 含まれるファイル一覧の抽出
- メタデータの解析:
  - スクリプトファイル（.cs）
  - DLLファイル（.dll）
  - アセットファイル（.prefab, .asset, .mat等）
  - 依存関係情報

#### 2.1.3 パターンマッチング検出

**検出対象カテゴリ:**

1. **ネットワーク通信**
  - `UnityWebRequest`
  - `WWW`
  - `HttpClient`, `WebClient`
  - `Socket`, `TcpClient`, `UdpClient`
  - URL文字列（`http://`, `https://`）

2. **ファイルシステムアクセス**
  - `File.Delete`, `File.WriteAllBytes`
  - `Directory.Delete`, `Directory.Create`
  - `StreamWriter`, `FileStream`
  - `Path.Combine` with external paths

3. **プロセス実行**
  - `Process.Start`
  - `ProcessStartInfo`
  - `System.Diagnostics.Process`

4. **ネイティブコード**
  - `DllImport`
  - `Marshal.GetDelegateForFunctionPointer`
  - `LoadLibrary`, `GetProcAddress`
  - 疑わしいDLLファイル（kernel32.dll, user32.dll等）

5. **リフレクション（悪用可能）**
  - `Assembly.Load`, `Assembly.LoadFrom`
  - `Type.GetType`
  - `Activator.CreateInstance`
  - `MethodInfo.Invoke`

6. **レジストリアクセス**
  - `Registry.SetValue`
  - `RegistryKey.SetValue`

7. **暗号化・難読化の兆候**
  - Base64エンコード文字列
  - 長いハードコード文字列
  - 難読化されたコード（意味不明な変数名の集中）

#### 2.1.4 結果表示

**スキャン結果:**
- 重大度別分類:
  - 🔴 Critical（重大）: プロセス実行、レジストリ操作
  - 🟡 Warning（警告）: ネットワーク通信、ファイル操作
  - 🔵 Info（情報）: リフレクション、外部DLL
  - ✅ Safe（安全）: 問題なし

**詳細情報:**
- 検出箇所のファイルパス
- 該当行番号（可能な場合）
- 検出されたパターン
- 推奨される対処法

**シンプルビュー:**
- ✅ 問題なし / ⚠️ 注意が必要 の2択表示
- ワンクリックで詳細表示

**免責事項（結果画面に常時表示）:**
```
この分析結果はパターンマッチングによるものです。
製作者（朔日工房/鴇峰朔華）は分析結果の正確性・
完全性について一切の責任を負いません。
```

#### 2.1.5 エクスポート機能
- JSON形式
- Markdown形式
- テキスト形式

### 2.2 設定機能

#### 2.2.1 検出パターンのカスタマイズ
- デフォルトパターンセットの選択:
  - 厳格（すべてのパターンを検出）
  - 標準（推奨）
  - 緩和（明らかに危険なもののみ）
- カスタムパターンの追加（上級者向け）

#### 2.2.2 除外設定
- 特定のファイルパスを検出から除外
- 特定のパターンを無視

#### 2.2.3 アプリケーション設定
- テーマ（Light / Dark）
- 言語（日本語 / English）
- ログレベル設定

## 3. 非機能要件

### 3.1 パフォーマンス
- パッケージ解析: 100MB以下のファイルで10秒以内
- スキャン実行: 1000行のコードで1秒以内
- UI応答性: 操作後100ms以内にフィードバック

### 3.2 セキュリティ
- 解析中のファイルは一時ディレクトリに展開、終了後削除
- サンドボックス環境での解析（実行はしない）
- 外部通信なし（完全オフライン動作）

### 3.3 互換性
- 対応OS: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)
- Electron: 最新LTS版
- Node.js: 18.x以上

### 3.4 ユーザビリティ
- 初回起動時の注意事項表示（利用規約同意必須）
- わかりやすいエラーメッセージ
- 処理中のプログレスバー表示

## 4. アーキテクチャ

### 4.1 ディレクトリ構成
```
unitypackage-scanner/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI（テスト・ビルド）
│   │   ├── release.yml         # リリース自動化
│   │   └── pr-check.yml        # PR時のチェック
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── pattern_request.md  # 新規パターン追加リクエスト
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── main/                 # Electronメインプロセス
│   │   ├── index.ts
│   │   ├── ipc/             # IPC通信ハンドラ
│   │   ├── services/
│   │   │   ├── packageParser.ts    # tar.gz解析
│   │   │   └── scanner/
│   │   │       ├── patternMatcher.ts   # パターンマッチングエンジン
│   │   │       ├── patterns/
│   │   │       │   ├── network.ts
│   │   │       │   ├── fileSystem.ts
│   │   │       │   ├── process.ts
│   │   │       │   ├── native.ts
│   │   │       │   ├── reflection.ts
│   │   │       │   └── registry.ts
│   │   │       └── analyzer.ts
│   ├── renderer/             # Reactフロントエンド
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── ResultSimple.tsx
│   │   │   ├── ResultDetail.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   ├── styles/
│   │   │   └── globals.css      # Tailwind設定
│   │   └── utils/
│   └── shared/              # 共通型定義
│       ├── types.ts
│       └── patterns.ts      # 検出パターン定義
├── tests/
│   ├── unit/                # ユニットテスト
│   │   ├── scanner/
│   │   │   ├── patternMatcher.test.ts
│   │   │   └── analyzer.test.ts
│   │   └── services/
│   │       └── packageParser.test.ts
│   ├── e2e/                 # E2Eテスト
│   │   ├── scanning.spec.ts
│   │   └── ui.spec.ts
│   └── fixtures/            # テスト用データ
│       └── sample-packages/
├── resources/               # アプリリソース
│   └── patterns/            # デフォルトパターンファイル
├── docs/                    # ドキュメント
│   ├── CONTRIBUTING.md
│   ├── PATTERN_GUIDE.md     # パターン追加ガイド
│   └── API.md
├── .eslintrc.js
├── .prettierrc
├── .npmrc                   # pnpm設定
├── pnpm-lock.yaml          # pnpmロックファイル
├── pnpm-workspace.yaml     # workspace設定（将来的な拡張用）
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── package.json
├── tsconfig.json
└── electron-builder.json
```

### 4.2 データフロー

#### スキャンフロー
1. ユーザーがファイルをドロップ
2. メインプロセスでパッケージ解析（tar.gz展開）
3. C#ファイルとDLLファイルを抽出
4. パターンマッチングエンジンでスキャン
5. 結果を集計・分類
6. レンダラープロセスに結果を返却
7. UIに結果を表示

### 4.3 状態管理
- React Context API
- 設定: electron-store
- スキャン結果: メモリ内（セッション単位）

## 5. UI/UX設計

### 5.0 初回起動フロー

#### 5.0.1 注意事項ダイアログ（初回必須表示）
```
┌─────────────────────────────────────────┐
│ ゆにぱけスキャナー - ご利用にあたって    │
├─────────────────────────────────────────┤
│                                         │
│ 【重要な注意事項】                      │
│                                         │
│ ✓ パターンマッチングによる検出です      │
│ ✓ すべての脅威を検出できるわけでは      │
│   ありません                            │
│ ✓ 誤検出の可能性もあります              │
│ ✓ 最終判断はご自身で行ってください      │
│                                         │
│ 【製作者情報】                          │
│ サークル名: 朔日工房                    │
│ 製作者: 鴇峰朔華                        │
│                                         │
│ ※本ツールの分析結果について、製作者は  │
│   一切の責任を負いません                │
│                                         │
│ ご利用前に必ず [利用規約] をお読みください│
│                                         │
│ ☑ 利用規約に同意する（必須）            │
│ □ 次回から表示しない                    │
│                                         │
│              [同意して続ける]           │
└─────────────────────────────────────────┘
```

### 5.1 メイン画面
```
┌─────────────────────────────────────────┐
│ ゆにぱけスキャナー            [_][□][×]│
├─────────────────────────────────────────┤
│                                         │
│   ┌───────────────────────────────┐   │
│   │         📦                    │   │
│   │                               │   │
│   │  .unitypackageファイルを      │   │
│   │    ここにドロップ             │   │
│   │                               │   │
│   │  またはクリックして選択       │   │
│   └───────────────────────────────┘   │
│                                         │
│   [⚙ 設定]                    [📖 ヘルプ]│
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 スキャン中画面
```
┌─────────────────────────────────────────┐
│ ゆにぱけスキャナー            [_][□][×]│
├─────────────────────────────────────────┤
│                                         │
│  📦 MyAwesomePackage.unitypackage       │
│                                         │
│  スキャン中...                          │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░  65%                │
│                                         │
│  ✓ パッケージを展開しました             │
│  ✓ ファイルを抽出中... (23/45)         │
│  ⏳ パターンマッチング実行中...         │
│                                         │
│              [キャンセル]               │
│                                         │
└─────────────────────────────────────────┘
```

### 5.3 結果表示画面（シンプル表示）
```
┌─────────────────────────────────────────┐
│ ゆにぱけスキャナー            [_][□][×]│
├─────────────────────────────────────────┤
│                                         │
│  📦 MyAwesomePackage.unitypackage       │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  │         ⚠️  注意が必要          │  │
│  │                                 │  │
│  │   3件の警告が検出されました     │  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  または                                 │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  │         ✅  問題なし            │  │
│  │                                 │  │
│  │   危険なパターンは検出されませんでした│
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│            [詳細を見る]                 │
│            [新しくスキャン]             │
│            [結果をエクスポート]         │
│                                         │
└─────────────────────────────────────────┘
```

### 5.4 詳細結果画面
```
┌─────────────────────────────────────────────────┐
│ スキャン結果 - MyAwesomePackage    [×]          │
├─────────────────────────────────────────────────┤
│ 【免責事項】                                    │
│ この分析結果はパターンマッチングによるものです。│
│ 製作者（朔日工房/鴇峰朔華）は分析結果の         │
│ 正確性・完全性について一切の責任を負いません。  │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📊 スキャン概要                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│ スキャン日時: 2025/10/07 14:32                 │
│ ファイル数: 45個（スクリプト: 12, DLL: 2）     │
│ パッケージサイズ: 12.3 MB                       │
│                                                 │
│ 🔍 検出された問題                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│                                                 │
│ 🔴 Critical (0)                                 │
│                                                 │
│ 🟡 Warning (3)                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ 🟡 ネットワーク通信の検出                  │ │
│ │ 📄 Scripts/NetworkManager.cs (Line 45)    │ │
│ │ 💬 検出パターン: UnityWebRequest            │ │
│ │    外部サーバーへの通信が含まれています。  │ │
│ │    通信先を確認してください。              │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ ┌───────────────────────────────────────────┐ │
│ │ 🟡 ファイルシステムアクセス                │ │
│ │ 📄 Scripts/SaveManager.cs (Line 23)       │ │
│ │ 💬 検出パターン: File.WriteAllBytes        │ │
│ │    ファイルへの書き込みが含まれています。  │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ 🔵 Info (2)                                     │
│ [すべて表示]                                    │
│                                                 │
│ ✅ 問題なし                                     │
│ • プロセス実行: 検出されませんでした            │
│ • レジストリ操作: 検出されませんでした          │
│ • 疑わしいDLL: 検出されませんでした             │
│                                                 │
│ 📋 検出されたURL一覧                            │
│ • https://api.example.com/v1/data              │
│ • https://cdn.example.com/assets               │
│                                                 │
│         [エクスポート]  [閉じる]                │
└─────────────────────────────────────────────────┘
```

### 5.5 設定画面
```
┌─────────────────────────────────────────┐
│ 設定                          [×]        │
├─────────────────────────────────────────┤
│                                         │
│ 【検出パターン】                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                         │
│ プリセット:                             │
│ ◉ 標準（推奨）                          │
│ ○ 厳格（すべて検出）                    │
│ ○ 緩和（明らかに危険なもののみ）        │
│                                         │
│ 個別設定:                               │
│ ☑ ネットワーク通信                      │
│ ☑ ファイルシステム                      │
│ ☑ プロセス実行                          │
│ ☑ ネイティブコード                      │
│ ☑ リフレクション                        │
│ ☑ レジストリアクセス                    │
│                                         │
│ 【除外設定】                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                         │
│ 除外するファイルパス:                   │
│ [Plugins/ThirdParty/*]                  │
│ [+ 追加]                                │
│                                         │
│ 【アプリケーション】                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                         │
│ テーマ: ◉ ライト  ○ ダーク             │
│ 言語:   [日本語 ▼]                     │
│                                         │
│ 最大ファイルサイズ:                     │
│ [500] MB                                │
│                                         │
│ □ 起動時に注意事項を表示する            │
│                                         │
│ 【情報】                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                         │
│ バージョン: 1.0.0                       │
│ 製作: 朔日工房 / 鴇峰朔華               │
│ [利用規約] [ライセンス] [GitHub]       │
│                                         │
│              [保存]  [キャンセル]       │
└─────────────────────────────────────────┘
```

## 6. 開発フェーズ

### 実装アプローチ
**モックファースト開発**:
1. 完全なUIモックを作成（ダミーデータ使用）
2. ユーザーフローを確認・調整
3. 段階的に実際の機能を実装していく

#### Phase 1: UIモック作成
**目標**: 全画面のUIモックを完成させる（機能は未実装）

- [ ] プロジェクトセットアップ
  - [ ] Electron + React + TypeScript環境構築
  - [ ] 基本的なディレクトリ構成
  - [ ] ビルド・開発環境整備

- [ ] UIコンポーネント作成（全てモック）
  - [ ] 注意事項ダイアログ
  - [ ] メイン画面
  - [ ] スキャン中画面
  - [ ] 結果表示画面（シンプル表示）
  - [ ] 詳細結果画面
  - [ ] 設定画面

- [ ] ダミーデータの準備
  - [ ] サンプルスキャン結果データ
  - [ ] 各種状態のモックデータ

- [ ] 画面遷移の実装
  - [ ] ルーティング設定
  - [ ] 画面間の遷移確認

**Phase 1完了の定義**:
- 全画面が表示される
- 画面遷移が動作する
- デザインが確認できる

#### Phase 2: パッケージ解析機能
**目標**: UnityPackageファイルの解析機能を実装

- [ ] ファイル処理
  - [ ] ドラッグ&ドロップの実装
  - [ ] .unitypackageファイルの読み込み
  - [ ] tar.gzの展開処理

- [ ] パッケージ解析
  - [ ] ファイル構造の解析
  - [ ] メタデータの抽出
  - [ ] スクリプトファイル（.cs）の抽出
  - [ ] DLLファイルの抽出
  - [ ] アセット情報の取得

**Phase 2完了の定義**:
- .unitypackageファイルをドロップできる
- ファイルが展開される
- 中身のファイル一覧が取得できる

#### Phase 3: パターンマッチングエンジン
**目標**: 検出パターンの実装

- [ ] パターン定義
  - [ ] ネットワーク通信パターン
  - [ ] ファイルシステムパターン
  - [ ] プロセス実行パターン
  - [ ] ネイティブコードパターン
  - [ ] リフレクションパターン
  - [ ] レジストリパターン

- [ ] マッチングエンジン
  - [ ] 正規表現エンジン実装
  - [ ] C#コード解析
  - [ ] DLLファイル名チェック
  - [ ] URL抽出

- [ ] 結果集計
  - [ ] 重大度判定
  - [ ] カテゴリ分類
  - [ ] 統計情報生成

**Phase 3完了の定義**:
- パターンマッチングが動作する
- 検出結果が取得できる
- コンソールで結果が確認できる

#### Phase 4: 結果表示の実装
**目標**: スキャン結果の表示

- [ ] シンプル表示
  - [ ] ✅/⚠️の判定表示
  - [ ] サマリー情報表示

- [ ] 詳細表示
  - [ ] 検出項目一覧表示
  - [ ] ファイルパス表示
  - [ ] 行番号表示（可能な場合）
  - [ ] URL一覧表示

- [ ] エクスポート機能
  - [ ] JSON形式
  - [ ] Markdown形式
  - [ ] テキスト形式

**Phase 4完了の定義**:
- 結果が画面に表示される
- 詳細画面が動作する
- エクスポートができる

#### Phase 5: 設定機能とブラッシュアップ
**目標**: アプリの完成

- [ ] 設定機能
  - [ ] パターンプリセット選択
  - [ ] 個別パターンのON/OFF
  - [ ] 除外設定
  - [ ] テーマ切り替え

- [ ] UI/UX改善
  - [ ] アニメーション追加
  - [ ] エラーメッセージの改善
  - [ ] ローディング表示の改善

- [ ] ドキュメント整備
  - [ ] README完成版
  - [ ] 利用規約完成版
  - [ ] ライセンス情報
  - [ ] 使い方ガイド

**Phase 5完了の定義**:
- 全ての基本機能が動作する
- ドキュメントが揃っている
- 配布可能な品質

#### Phase 6: テストとリリース準備
**目標**: 公開準備

- [ ] テスト
  - [ ] 機能テスト
  - [ ] 実際のUnityPackageでのテスト
  - [ ] 誤検出の確認と調整

- [ ] パフォーマンス最適化
  - [ ] 大容量ファイルへの対応
  - [ ] スキャン速度の改善

- [ ] リリース準備
  - [ ] インストーラー作成
  - [ ] コード署名
  - [ ] GitHub Release準備

**Phase 6完了の定義**:
- 安定して動作する
- インストーラーが完成
- 公開可能な状態

## 7. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 誤検出（false positive） | 中 | パターンの精度向上、除外設定の提供 |
| 見逃し（false negative） | 高 | 複数パターンでの検出、定期的なパターン更新 |
| 大容量ファイルの処理 | 中 | ストリーミング処理、サイズ制限 |
| 難読化されたコード | 高 | 難読化の兆候検出、免責事項の明記 |

## 8. ユーザーへの注意事項

アプリ内に以下を明記:
- **パターンマッチングには限界がある**
- **すべての脅威を検出できるわけではない**
- **誤検出の可能性もある**
- **最終判断はユーザー自身が行う**
- **分析結果について製作者は責任を負わない**
- **オープンソースプロジェクトである**

## 9. 今後の拡張可能性

- より高度なパターン追加
- 機械学習による検出精度向上（将来的な検討）
- コミュニティからのパターン投稿機能
- バッチ処理（複数ファイル一括スキャン）
- CLI版の提供
- CI/CD統合
- 多言語対応
- プラグインシステム（カスタムパターン追加）

## 11. 開発ワークフロー・CI/CD

### 11.1 開発環境セットアップ

**必須要件:**
- Node.js 18.x 以上
- pnpm 8.x 以上

**pnpmのインストール:**
```bash
# npmを使用してpnpmをグローバルインストール
npm install -g pnpm

# または、公式スクリプトを使用
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

**プロジェクトのセットアップ:**
```bash
# リポジトリのクローン
git clone https://github.com/朔日工房/unitypackage-scanner.git
cd unitypackage-scanner

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# テストの実行
pnpm test        # ユニットテスト
pnpm test:e2e    # E2Eテスト
pnpm test:watch  # ウォッチモード

# コード品質チェック
pnpm lint        # ESLint
pnpm format      # Prettier
pnpm type-check  # TypeScript型チェック

# ビルド
pnpm build       # 本番ビルド
pnpm build:win   # Windows向け
pnpm build:mac   # macOS向け
pnpm build:linux # Linux向け
```

**pnpm使用の理由:**
- **高速**: npmやyarnより高速なインストール
- **ディスク効率**: ハードリンクによる重複排除
- **厳格な依存関係**: Phantom dependenciesを防止
- **モノレポ対応**: workspace機能が優秀

### 11.2 GitHub Actions CI/CD

#### 11.2.1 CI ワークフロー (.github/workflows/ci.yml)

**トリガー条件:**
- `push` to `main` / `develop`
- Pull Request作成・更新

**実行内容:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm type-check
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Generate coverage
        run: pnpm test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.os }}
          path: dist/
```

**必須条件:**
- すべてのテストが通過
- Lintエラーなし
- TypeScript型エラーなし
- すべてのOSでビルド成功

#### 11.2.2 リリースワークフロー (.github/workflows/release.yml)

**トリガー条件:**
- タグのプッシュ（例: `v1.0.0`）

**実行内容:**
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build:${{ matrix.os }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Code sign (Windows)
        if: matrix.os == 'windows-latest'
        run: # コード署名処理
      
      - name: Code sign (macOS)
        if: matrix.os == 'macos-latest'
        run: # コード署名処理
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/*.exe
            dist/*.dmg
            dist/*.AppImage
            dist/*.deb
            dist/*.rpm
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**成果物:**
- Windows: `.exe` インストーラー
- macOS: `.dmg` インストーラー
- Linux: `.AppImage`, `.deb`, `.rpm`

#### 11.2.3 PRチェックワークフロー (.github/workflows/pr-check.yml)

**トリガー条件:**
- Pull Request作成・更新

**実行内容:**
- コードフォーマットチェック
- コミットメッセージ規約チェック
- 変更ファイルサイズチェック
- 依存関係の脆弱性スキャン
- ライセンスチェック

### 11.3 テスト戦略

#### 11.3.1 ユニットテスト

**対象:**
- パターンマッチングエンジン
- パッケージ解析ロジック
- ユーティリティ関数

**フレームワーク:** Vitest

**カバレッジ目標:**
- 行カバレッジ: 80%以上
- 分岐カバレッジ: 75%以上

**例:**
```typescript
// tests/unit/scanner/patternMatcher.test.ts
import { describe, it, expect } from 'vitest';
import { PatternMatcher } from '@/main/services/scanner/patternMatcher';

describe('PatternMatcher', () => {
  it('should detect UnityWebRequest pattern', () => {
    const code = 'UnityWebRequest.Get("https://example.com")';
    const matcher = new PatternMatcher();
    const results = matcher.scan(code);
    
    expect(results).toHaveLength(1);
    expect(results[0].pattern).toBe('UnityWebRequest');
    expect(results[0].category).toBe('network');
  });
  
  it('should not detect in comments', () => {
    const code = '// UnityWebRequest.Get("https://example.com")';
    const matcher = new PatternMatcher();
    const results = matcher.scan(code);
    
    expect(results).toHaveLength(0);
  });
});
```

#### 11.3.2 E2Eテスト

**対象:**
- ファイルアップロード
- スキャン実行
- 結果表示
- エクスポート機能

**フレームワーク:** Playwright

**例:**
```typescript
// tests/e2e/scanning.spec.ts
import { test, expect } from '@playwright/test';

test('should scan UnityPackage and show results', async ({ page }) => {
  await page.goto('/');
  
  // ファイルをアップロード
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('./tests/fixtures/sample.unitypackage');
  
  // スキャン完了を待つ
  await page.waitForSelector('[data-testid="scan-complete"]');
  
  // 結果を確認
  const result = await page.locator('[data-testid="scan-result"]');
  await expect(result).toContainText('注意が必要');
  
  // 詳細を表示
  await page.click('[data-testid="view-details"]');
  await expect(page.locator('[data-testid="detail-view"]')).toBeVisible();
});
```

#### 11.3.3 テスト用フィクスチャ

```
tests/fixtures/
├── sample-packages/
│   ├── safe-package.unitypackage       # 問題なし
│   ├── network-package.unitypackage    # ネットワーク通信あり
│   ├── dangerous-package.unitypackage  # 危険なコード含む
│   └── large-package.unitypackage      # 大容量テスト用
└── expected-results/
    ├── safe-package.json
    ├── network-package.json
    └── dangerous-package.json
```

### 11.4 Issue・PR管理

#### 11.4.1 Issueテンプレート

**バグレポート (.github/ISSUE_TEMPLATE/bug_report.md):**
```markdown
## バグの説明
<!-- バグの内容を簡潔に説明してください -->

## 再現手順
1. 
2. 
3. 

## 期待される動作
<!-- 本来どうあるべきか -->

## 実際の動作
<!-- 何が起こったか -->

## 環境
- OS: [例: Windows 11]
- アプリバージョン: [例: v1.0.0]
- Node.js: [例: 18.16.0]

## スクリーンショット
<!-- もしあれば -->

## 追加情報
<!-- その他、関連する情報 -->
```

**機能リクエスト (.github/ISSUE_TEMPLATE/feature_request.md):**
```markdown
## 提案する機能
<!-- 機能の概要 -->

## 解決したい問題
<!-- この機能がなぜ必要か -->

## 提案する解決策
<!-- どのように実装するか -->

## 代替案
<!-- 他に考えられる方法 -->

## 追加情報
<!-- その他、関連する情報 -->
```

**パターン追加リクエスト (.github/ISSUE_TEMPLATE/pattern_request.md):**
```markdown
## 追加したい検出パターン

### パターン名
<!-- 例: Reflection.Emit -->

### カテゴリ
<!-- network / fileSystem / process / native / reflection / registry -->

### 重大度
<!-- critical / warning / info -->

### 検出する理由
<!-- なぜこのパターンを検出すべきか -->

### サンプルコード
```csharp
// 検出対象となるコード例
```

### 正規表現（案）
<!-- もしあれば -->

### 参考資料
<!-- 関連するドキュメントやリンク -->
```

#### 11.4.2 PRテンプレート

```markdown
## 変更内容
<!-- このPRで何を変更したか -->

## 関連Issue
Closes #

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 破壊的変更
- [ ] ドキュメント更新
- [ ] パフォーマンス改善
- [ ] リファクタリング
- [ ] テスト追加

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] 自己レビューを実施した
- [ ] コメントを追加した（特に理解しにくい部分）
- [ ] ドキュメントを更新した
- [ ] テストを追加した
- [ ] すべてのテストが通過する
- [ ] 依存関係の変更がある場合、package.jsonを更新した

## スクリーンショット（UI変更の場合）
<!-- Before/After -->

## テスト方法
<!-- レビュアーがどうやって確認できるか -->
```

#### 11.4.3 コントリビューションガイド

**CONTRIBUTING.md:**
```markdown
# コントリビューションガイド

## はじめに
ゆにぱけスキャナーへのコントリビューションを歓迎します！

## 開発の流れ
1. Issueを作成または既存のIssueを確認
2. リポジトリをフォーク
3. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
4. 変更をコミット (`git commit -m 'Add amazing feature'`)
5. ブランチをプッシュ (`git push origin feature/amazing-feature`)
6. Pull Requestを作成

## コミットメッセージ規約
Conventional Commitsに従ってください:
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` その他

## コードスタイル
- ESLint・Prettierの設定に従う
- `npm run lint`でチェック
- `npm run format`で自動整形

## テスト
- 新機能には必ずテストを追加
- `npm run test`で全テスト実行
- カバレッジを下げない

## パターン追加ガイド
詳細は[PATTERN_GUIDE.md](docs/PATTERN_GUIDE.md)を参照

## 質問・議論
- GitHub Discussionsを使用
- 小さな質問はIssueでも可
```

### 11.5 リリースプロセス

#### 11.5.1 バージョニング

**Semantic Versioning 2.0.0:**
- MAJOR: 破壊的変更
- MINOR: 後方互換性のある機能追加
- PATCH: 後方互換性のあるバグ修正

#### 11.5.2 リリース手順

1. **開発完了**
  - `develop`ブランチで開発
  - PRでmainにマージ

2. **バージョン更新**
   ```bash
   # package.jsonのバージョンを更新
   pnpm version patch|minor|major
   # または手動で編集
   ```

3. **CHANGELOGの更新**
   ```bash
   # CHANGELOGを更新
   vim CHANGELOG.md
   git add CHANGELOG.md
   git commit -m "chore: update changelog for v1.0.0"
   ```

4. **タグプッシュ**
   ```bash
   git push origin v1.0.0
   ```

5. **GitHub Actions自動実行**
  - ビルド
  - テスト
  - パッケージング
  - Release作成

6. **リリースノート確認・編集**
  - 自動生成されたノートを確認
  - 必要に応じて手動編集

#### 11.5.3 リリースチェックリスト

- [ ] CHANGELOGを更新
- [ ] READMEのバージョン表記を更新
- [ ] ドキュメントを更新
- [ ] 全テスト通過確認
- [ ] 各OS版の動作確認
- [ ] リリースノート作成
- [ ] タグプッシュ

## 12. コード品質管理

### 12.1 静的解析

**ESLint設定 (.eslintrc.js):**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react/react-in-jsx-scope': 'off'
  }
};
```

**Prettier設定 (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 12.2 Tailwind CSS v4設定

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        success: '#5CB85C',
        warning: '#F0AD4E',
        error: '#D9534F'
      }
    }
  },
  plugins: []
};
```

**globals.css:**
```css
@import "tailwindcss";

@theme {
  /* カスタムテーマ設定 */
}
```

### 12.3 依存関係管理

**pnpm特有の設定 (.npmrc):**
```ini
# pnpmの厳格モード
strict-peer-dependencies=true

# 公開レジストリの設定
registry=https://registry.npmjs.org/

# オプション: スクリプト実行時のシェル
script-shell=/bin/bash

# Hoisting設定（Phantom dependencies防止）
hoist-pattern[]=*eslint*
hoist-pattern[]=*prettier*
```

**workspace設定（将来的な拡張用）:**
`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  # 将来的にCLI版やライブラリ版を追加する場合
```

**依存関係の管理ルール:**
- **Dependabot:** 自動的に依存関係を更新
- **pnpm audit:** セキュリティ脆弱性チェック
  ```bash
  pnpm audit
  pnpm audit --fix  # 自動修正
  ```
- **License Checker:** ライセンス互換性確認
  ```bash
  pnpm dlx license-checker --summary
  ```
- **依存関係の更新:**
  ```bash
  pnpm update          # 全依存関係を更新
  pnpm update --latest # 最新版に更新
  pnpm outdated        # 古い依存関係をチェック
  ```

### 12.4 パフォーマンスモニタリング

- ビルドサイズの監視
- バンドルサイズの最適化
- 起動時間の計測
- メモリ使用量の監視

### 10.1 パターンファイル形式（JSON）

```json
{
  "version": "1.0.0",
  "patterns": {
    "network": {
      "severity": "warning",
      "patterns": [
        {
          "pattern": "UnityWebRequest",
          "description": "外部サーバーへの通信",
          "regex": "UnityWebRequest\\s*\\."
        },
        {
          "pattern": "WWW",
          "description": "HTTP通信（旧API）",
          "regex": "new\\s+WWW\\s*\\("
        }
      ]
    },
    "process": {
      "severity": "critical",
      "patterns": [
        {
          "pattern": "Process.Start",
          "description": "外部プロセスの実行",
          "regex": "Process\\.Start\\s*\\("
        }
      ]
    }
  }
}
```

### 10.2 カスタムパターンの追加

ユーザーは設定画面から独自のパターンを追加可能（上級者向け）:
- パターン名
- 正規表現
- 重大度（Critical / Warning / Info）
- 説明文