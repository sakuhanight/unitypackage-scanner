# ゆにぱけスキャナー (Unity Package Scanner)

UnityPackage（.unitypackage）ファイルの内容をAIで分析・検証するデスクトップアプリケーション

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ 特徴

- 🤖 **AI分析**: Claude、OpenAI、Gemini APIを使用してUnityPackageを分析
- 🔒 **セキュリティチェック**: 悪意のあるコードやセキュリティリスクを検出
- 📊 **詳細レポート**: 分析結果をカテゴリ別に表示（Critical/Warning/Info）
- 🎯 **ドラッグ&ドロップ**: 簡単操作でファイルを分析
- 🌐 **多言語対応**: 日本語・英語に対応
- 💾 **エクスポート**: JSON、Markdown形式で結果を出力

## 🚀 ダウンロード

[Releases ページ](https://github.com/sakuhanight/unitypackage-scanner/releases)から最新版をダウンロードしてください。

### 対応OS
- Windows 10 以降
- macOS 11 以降  
- Linux (Ubuntu 20.04 以降)

## 📋 必要なもの

このアプリを使用するには、以下のいずれかのAI APIキーが必要です：

- **Claude API** (Anthropic) - 推奨
- **OpenAI API** (ChatGPT)
- **Gemini API** (Google)

**重要**: APIキーは各自で取得・管理していただき、API使用料金はユーザー様負担となります。

### APIキーの取得方法

#### Claude API
1. [console.anthropic.com](https://console.anthropic.com) にアクセス
2. アカウント作成・ログイン
3. API Keys > Create Key でキーを生成

#### OpenAI API
1. [platform.openai.com](https://platform.openai.com) にアクセス
2. アカウント作成・ログイン
3. API keys からキーを生成

#### Gemini API
1. [makersuite.google.com](https://makersuite.google.com) にアクセス
2. アカウント作成・ログイン
3. API key を取得

## 🎯 使い方

### 1. 初回セットアップ
1. アプリを起動
2. 利用規約に同意
3. 使用するAIプロバイダーを選択
4. APIキーを設定
5. 接続テストで確認

### 2. UnityPackageの分析
1. メイン画面で.unitypackageファイルをドラッグ&ドロップ
2. または「ファイルを選択」でブラウザから選択
3. 分析完了まで待機
4. 結果を確認

### 3. 結果の確認
- **シンプル表示**: ✅問題なし / ⚠️注意が必要
- **詳細表示**: 検出された問題をカテゴリ別に表示
- **エクスポート**: 結果をファイルに保存

## 🔍 分析項目

- **セキュリティリスク**: 悪意のあるコードやセキュリティホールの検出
- **パフォーマンス**: Update内でのGameObject.Findなど、パフォーマンス問題の検出
- **ベストプラクティス**: 古いAPIの使用や非推奨機能の検出
- **依存関係**: 外部ライブラリや依存関係の問題
- **コード品質**: コーディング規約違反やポテンシャルなバグ

## ⚙️ 設定

### 分析オプション
- **簡易**: 基本的なチェックのみ
- **標準**: 推奨設定（デフォルト）
- **詳細**: より深い分析（時間がかかります）

### その他設定
- ダークモード/ライトモード
- 言語切り替え（日本語/English）
- 最大ファイルサイズ制限

## 🚨 重要な注意事項

### 免責事項
- **分析結果はAIによるものであり、完全性を保証するものではありません**
- **製作者（朔日工房/鴇峰朔華）は分析結果の正確性・完全性について一切の責任を負いません**
- **最終的な判断は必ずご自身で行ってください**

### セキュリティ
- APIキーは暗号化してローカルに保存されます
- 分析中のファイルは一時的に展開され、終了後に削除されます
- 通信はすべてHTTPS暗号化されています

### プライバシー
- 分析対象ファイルの内容は選択したAIプロバイダーに送信されます
- 各プロバイダーのプライバシーポリシーをご確認ください
- 機密性の高いプロジェクトでの使用は慎重にご検討ください

## 🛠️ 開発者向け情報

### 技術スタック
- Electron + TypeScript + React
- AI統合: Claude API, OpenAI API, Google Gemini API
- パッケージング: Electron Builder

### 開発環境のセットアップ
```bash
# リポジトリをクローン
git clone https://github.com/sakuhanight/unitypackage-scanner.git
cd unitypackage-scanner

# 依存関係をインストール
pnpm install

# 開発サーバー起動
pnpm run dev

# ビルド
pnpm run build
```

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🤝 コントリビュート

プルリクエストやイシューの報告を歓迎します！

### 報告・要望
- バグ報告: [Issues](https://github.com/sakuhanight/unitypackage-scanner/issues)
- 機能要望: [Issues](https://github.com/sakuhanight/unitypackage-scanner/issues)

## 👥 製作者

**朔日工房 (tsuitachi-studio)**
- 製作者: 鴇峰朔華 (Tokimine Sakuha)
- ウェブサイト: https://tsuitachi.net
- GitHub: [@sakuhanight](https://github.com/sakuhanight)

## 🙏 謝辞

このプロジェクトは以下の技術・サービスを使用して作られています：
- [Electron](https://electronjs.org/)
- [React](https://reactjs.org/)
- [Anthropic Claude API](https://www.anthropic.com/)
- [OpenAI API](https://openai.com/)
- [Google Gemini API](https://developers.generativeai.google/)

---

**注意**: このツールの分析結果に基づく判断・決定について、製作者は一切の責任を負いません。必ずご自身の判断で使用してください。