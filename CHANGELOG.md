# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2025-01-16

### Added
- ドラッグ&ドロップによるファイル選択機能
- パターンマッチングエンジンによるセキュリティスキャン
- ファイル拡張子検出機能
- 進行状況表示とリアルタイム更新
- エクスポート機能（JSON、Markdown、テキスト形式）
- 一元化された定数管理システム (constants.ts)
- Unity 2022.3.22f1対応

### Changed
- VRChat特化機能を削除し、汎用UnityPackage対応に変更
- UIを汎用的なUnityPackage分析ツール向けに更新
- セキュリティパターンを汎用的な内容に統一

### Fixed
- ドラッグ&ドロップ時のファイルパス取得問題
- プログレス監視のメモリリーク問題
- タイトルバー非表示によるウィンドウ移動不可問題
- IPCハンドラーの登録漏れ

### Technical
- Electron + TypeScript + React アーキテクチャ
- パターンマッチングによる静的解析
- セキュリティを重視した設計
- オフライン動作対応
- クロスプラットフォーム対応（Windows、macOS、Linux）

### Security
- コンテキスト分離とプリロードスクリプトによる安全なIPC通信
- ファイルシステムアクセスの制限
- パストラバーサル攻撃防止