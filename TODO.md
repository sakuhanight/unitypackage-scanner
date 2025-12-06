# 今後の対応手順 (macOS対応)

現在、macOS版のビルドは「開発用」として一時的にセキュリティ設定を緩和しています。
一般配布に向けて、以下の手順で正式な署名設定を行う必要があります。

## 1. 証明書の取得

Apple Developer Programに登録済みのアカウントを使用して、配布用証明書を作成します。

1.  **Xcodeを開く**
    *   メニューバーの `Xcode` -> `Settings...` (または `Preferences...`) を開く。
2.  **アカウントを選択**
    *   `Accounts` タブを選択。
    *   Apple IDでサインインしていることを確認。
3.  **証明書の作成**
    *   右下の `Manage Certificates...` をクリック。
    *   左下の `+` ボタンをクリック。
    *   **`Developer ID Application`** を選択して作成する。
    *   `Done` で閉じる。

## 2. 証明書の確認

ターミナルで以下のコマンドを実行し、証明書が認識されているか確認します。

```bash
security find-identity -v -p codesigning
```

出力に `Developer ID Application: ...` が含まれていればOKです。

## 3. `package.json` の設定を戻す

証明書が用意できたら、`package.json` を編集してセキュリティ設定を有効化します。

**変更前 (現在の一時的な設定):**
```json
"mac": {
  "category": "public.app-category.developer-tools",
  "hardenedRuntime": false,
  "gatekeeperAssess": false
},
```

**変更後 (本来あるべき設定):**
```json
"mac": {
  "category": "public.app-category.developer-tools",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist"
},
```

## 4. ビルドと署名

以下のコマンドでビルドを行います。`electron-builder` が自動的に証明書を検出して署名を行います。

```bash
pnpm run dist
```

## 5. 公証 (Notarization)

配布するためには、Appleによる公証が必要です。
`electron-builder` の設定に `notarize` オプションを追加するか、`electron-notarize` を使用して構成する必要があります。
（これにはApple IDのアプリ用パスワードなどの環境変数設定も必要になります）
