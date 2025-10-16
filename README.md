# ゆにぱけスキャナー

**UnityPackageファイルの安全性をチェックする無料ツール**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-0.9.0-blue.svg)](https://github.com/sakuhanight/unitypackage-scanner/releases)

![App Screenshot](docs/images/screenshot.png)

## 🎯 なにができる？

ゆにぱけスキャナーは、**第三者製のUnityPackageファイルを使用する前に安全性をチェック**できるツールです。

- 🔍 **危険なコードパターンを自動検出**
- 📱 **ドラッグ&ドロップで簡単操作**
- 🔒 **完全オフライン動作（ネット接続不要）**
- 💰 **完全無料・オープンソース**

## 📥 ダウンロード

### システム要件
- **Windows**: Windows 10 以降（64bit）

> **📝 注意**: 現在のバージョン（v0.9.0）はWindows専用です。macOS・Linux版は将来のバージョンで対応予定です。

### インストール方法
1. [📦 最新版をダウンロード](https://github.com/sakuhanight/unitypackage-scanner/releases)
2. `unitypackage-scanner-Setup-0.9.0.exe` をダウンロード
3. ダウンロードしたファイルを実行してインストール
4. インストーラーの指示に従ってセットアップを完了

### 将来対応予定のプラットフォーム
- **macOS**: macOS 11 (Big Sur) 以降（v1.0.0以降で対応予定）
- **Linux**: Ubuntu 20.04 以降（v1.0.0以降で対応予定）

## 🚀 使い方

### 1. ファイルを選択
UnityPackageファイル（.unitypackage）をアプリにドラッグ&ドロップするか、「ファイルを選択」ボタンから選択

### 2. スキャン実行
自動的にファイルの分析が開始されます

### 3. 結果確認
- **✅ 問題なし**: 危険なパターンは検出されませんでした
- **⚠️ 注意が必要**: 警告レベル以上のパターンが検出されました

### 4. 詳細確認（必要に応じて）
「詳細を見る」で具体的な検出内容を確認できます

## 🔍 検出できる危険パターン

| 危険度 | 検出内容 | 例 |
|--------|----------|-----|
| 🔴 **Critical** | システムに重大な影響を与える可能性 | プロセス実行、レジストリ操作 |
| 🟡 **Warning** | 注意が必要な機能 | ネットワーク通信、ファイル操作 |
| 🔵 **Info** | 情報として把握しておきたい機能 | 外部DLL、リフレクション |

## ⚠️ 重要なお知らせ

### 制限事項
- **完璧ではありません**: すべての脅威を検出できるわけではありません
- **誤検出の可能性**: 安全なコードが危険として検出される場合があります  
- **最終判断はあなた自身**: 分析結果を参考に、最終的な安全性はご自身で判断してください

### 免責事項
この分析結果はパターンマッチングによるものです。製作者（朔日工房/鴇峰朔華）は分析結果の正確性・完全性について**一切の責任を負いません**。

## 🆘 サポート・お問い合わせ

- **バグ報告・機能要望**: [GitHub Issues](https://github.com/sakuhanight/unitypackage-scanner/issues)
- **使い方の質問**: [GitHub Discussions](https://github.com/sakuhanight/unitypackage-scanner/discussions)

## 📄 詳細情報

- **技術仕様**: [SPECIFICATION.md](SPECIFICATION.md)
- **変更履歴**: [CHANGELOG.md](CHANGELOG.md)
- **ライセンス**: [MIT License](LICENSE)

---

**製作**: 朔日工房 (tsuitachi-studio) / 鴇峰朔華  
**ウェブサイト**: https://tsuitachi.net  
**バージョン**: 0.9.0