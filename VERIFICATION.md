# 検証記録

2026-10-10 ローカル本番ビルド（Vite preview）、Chromium / Playwright CLIで検証。

- `npm test`: 8件成功（全30テーマ、パス、保存復元、日次切替、二重計上防止、不正データ、ローカル日付、抽選範囲）
- `npm run build`: TypeScript型チェックと本番ビルド成功
- `tests/browser-smoke.js`: 30項目成功。初期記録、選択テーマの復元、Enterキー操作、一時停止・再開、モーション停止、reduced-motion、ヒントの非重複、完了記録、削除確認のキャンセル、30テーマ終了、翌日切替、破損データ復旧など
- 画面幅: 1920×1080、1366×768、1280×720、390×844。横方向のはみ出しなし
- 1280×720の対話終了ボタンは画面内に収まる（下端675px）
- localStorageアクセスがSecurityErrorになる環境も、警告を表示して動作継続
- ブラウザの未処理例外0、検証中コンソールエラー・警告0
- トップ、対話、記録のスクリーンショットを確認。画像は `output/playwright/` に保存（Git対象外）

## GitHub Pages公開検証

- 公開URL: https://papua2129.github.io/shaberika/
- リポジトリ: https://github.com/papua2129/shaberika
- GitHub Actions: https://github.com/papua2129/shaberika/actions/runs/38012181846 （テスト・ビルド・デプロイ成功）
- 公開URLがHTTP 200で応答することを確認
- 専用のテストブラウザで `tests/browser-smoke.js` の接続先だけを公開URLに変更し、30項目を再実行して全件成功
- CSS/JavaScriptを含めHTTPエラー0、コンソールエラー0、未処理例外0
- ハッシュ付きURLへの直接アクセス・再読み込み、保存復元、ルーレット、対話、記録画面を検証
- 公開画面のスクリーンショットを取得し、アプリ内ブラウザでも表示を目視確認

## 既知の制約・未検証

参考画像は未提供のため画像との照合は未実施。Firefox/Safari/実機Chromebookでの検証は未実施。複数タブからの同時書き込みには原子的な排他処理を設けていないため、1タブでの利用を推奨する。
