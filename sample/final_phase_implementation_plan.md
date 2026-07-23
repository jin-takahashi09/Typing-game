# Shinobi Keys — Final Phase 実装計画

**ステータス:** 計画のみ（未着手）  
**前提:** Phase 5 コミット済み（`890bc0a feat: implement phase 5 audio pause and settings`）  
**スコープ:** UI/レスポンシブ・a11y・記録初期化・バランス・問題検証・パフォーマンス・README・公開準備。新機能の大規模追加は行わない

---

## 1. Final Phase の目的

Phase 1–5 で揃ったローカル完結型タイピングゲームを、**公開・長期間プレイに耐える品質**へ仕上げる。見た目・操作性・データ健全性・ドキュメント・ビルドを一通り点検し、既知の粗を潰す。

---

## 2. 対象画面と改善内容

| 画面 | 改善内容 |
|------|----------|
| **TitleScreen** | 狭い幅での余白・ベストスコア行の折り返し、フォーカス順、メイン CTA 強調 |
| **DifficultyScreen** | カードが縦積みで押しやすいタップ領域、選択中の視覚＋テキスト、開始ボタン固定/到達容易 |
| **GameScreen / HUD** | 小画面で Score / Stage / Difficulty / 統計が重ならないレイアウト、一時停止ボタン到達性 |
| **PauseOverlay** | フォーカストラップ、Esc で再開、ダイアログラベル、狭い画面スクロール |
| **ResultScreen** | NEW BEST を色以外でも伝える（文言・アイコン）、統計の可読性 |
| **RecordsScreen** | 空状態維持、記録削除 UI・確認ダイアログ、削除後の即時反映 |
| **SettingsScreen** | ラベル関連付け強化、保存失敗メッセージの一貫性 |
| **HowToScreen** | 見出し階層、キーボード操作の明示、狭い幅での読みやすさ |

共通:

- 余白・フォントサイズのブレークポイント整理（`sm` / `md`）
- `prefers-reduced-motion` / `data-motion='reduced'` の抜け漏れ確認
- console error / warning ゼロを目標に修正

---

## 3. レスポンシブ方針

### 3.1 ブレークポイント（目安）

| 区分 | 幅 | 方針 |
|------|-----|------|
| スマートフォン | 〜639px | HUD を 2 段 or 縮小タイポ。ターゲット文字は折り返さず縮小可。Pause ボタン常時表示 |
| タブレット | 640–1023px | 現行寄り。余白をやや圧縮 |
| PC | 1024px〜 | 現行 max-width パネルを維持 |

### 3.2 必須確認

- [ ] 小さい画面で HUD と落下ターゲットが重なりすぎない
- [ ] 横幅の狭い端末でも難易度選択・一時停止・設定スライダーが操作できる
- [ ] ゲームエリアが画面外に大きくはみ出さない
- [ ] リザルト・記録の 2 列グリッドが極小幅で 1 列に落ちる

### 3.3 実装方針

- Tailwind の既存ブレークポイントを活用（新規デザインシステムは作らない）
- GameHud: モバイルで Difficulty ラベル短縮、統計を 1 行コンパクト維持
- `viewport` meta は Vite 既定を確認し、必要なら `index.html` を明記

---

## 4. アクセシビリティ対応

| 項目 | 方針 |
|------|------|
| フォーカス移動 | 画面遷移後、主要見出しまたは先頭インタラクティブ要素へ `focus()` / `autofocus` / `useEffect` |
| ラベル | ボタン文言・`aria-label`・`aria-labelledby`。range / checkbox は `<label>` 関連付け |
| キーボードのみ | Tab で全主要操作、Enter/Space で決定、Esc で pause/閉じる（既存） |
| フォーカストラップ | PauseOverlay・確認ダイアログ内で Tab 循環 |
| 色だけ依存の回避 | NEW BEST はバッジ文言、ミスはシェイク＋音（ミュート時も視覚）、ロックオンは枠線＋「入力中」相当の current char |
| モーション軽減 | 全画面で `data-motion` / CSS を再点検（タイトル装飾・リザルト scale 含む） |
| コントラスト | アクセント色テキストが背景上で読めるか目視確認 |

---

## 5. 記録削除・初期化機能

### 5.1 スコープ

- **プレイ記録の初期化**（best / recentPlays / aggregates をデフォルトへ）
- 設定（音量・ミュート・モーション）は **残す**（別ボタン「設定も含めて全消去」は任意。Final では記録のみを推奨）

### 5.2 UI

RecordsScreen（または Settings）に:

1. 「記録を削除」ボタン
2. **確認ダイアログ**（必須）
   - 文言例: 「難易度別ベストとプレイ履歴をすべて削除します。この操作は取り消せません。」
   - 「削除する」/「キャンセル」
3. 削除成功後、同一画面の表示を **即時更新**（空状態メッセージへ）
4. タイトルのベストスコア表示も App state 経由で即時消える

### 5.3 実装

```ts
// 純粋関数
function clearPlayRecords(data: StoredAppData): StoredAppData

// I/O
clearPlayRecords + saveStoredData
// 失敗時: エラー表示、画面クラッシュなし
```

- 確認なしでの即削除は禁止
- タイトルへ戻る・中断プレイは従来通り記録しない（Phase 5 維持）

---

## 6. 難易度別バランス調整方針

`difficultyConfig.ts` を単一ソースとして微調整する。大規模なルール変更はしない。

| 難易度 | 観点 | 調整候補 |
|--------|------|----------|
| 修行生 | 導入のしやすさ | spawn 間隔・fallSpeed・maxActive・missDamage |
| 忍者 | 標準の緊張感 | 同時数 3 のまま、stage 上昇ペース |
| 忍頭 | やり込み | 落下速度上限感、長文問題の出現頻度（文字数フィルタ） |

検証方法:

- 手動で各難易度 2–3 分プレイ
- 「即死しすぎ」「暇すぎ」をログし、定数を ±10–20% 程度で調整
- 変更は config のみ。ハードコードを増やさない

---

## 7. 問題データの最終検証

### 7.1 自動検証（Vitest 拡充）

既存 `typingProblems.test.ts` を拡張:

| チェック | 内容 |
|----------|------|
| 必須フィールド | displayText / reading / romajiPatterns 非空 |
| 日本語表示 | 英語-only display 禁止（既存） |
| 代表ローマ字完成 | matcher で `romajiPatterns[0]` が全件完成（Phase 3 既存を維持） |
| 全候補完成 | 各 `romajiPatterns[i]` も完成できること |
| ID 一意 | 重複 ID 禁止 |
| display≈reading | かな表示と reading の整合（許容差ルールを定義） |
| カテゴリ | difficultyConfig の categories に含まれること |

### 7.2 人手レビュー

- 同一意味の重複問題（例: 同語の別 ID）をマージまたは削除
- 不自然なカタカナ長音・外来語 reading を見直す
- IT 用語の代表ローマ字が入力しやすいか確認

### 7.3 成果物

- 問題数は難易度あたり 15 以上を維持
- 検証テストが CI（ローカル `npm test`）で失敗したら merge 不可相当

---

## 8. パフォーマンス確認項目

| 項目 | 確認方法 |
|------|----------|
| rAF 単一 | GameScreen remount / StrictMode で二重ループがないこと |
| タイマー解除 | 画面離脱後に setTimeout が残らない（既存 clearTimers） |
| AudioContext | 再戦で BGM が二重にならない（Phase 5 維持・回帰） |
| リスナー | keydown / visibilitychange が unmount で解除 |
| 再レンダー | 落下中に React が毎フレーム更新していないこと（targetsRef 方針維持） |
| 長時間 | 10–15 分プレイでメモリ肥大・音切れ・入力遅延がないか目視 |
| console | DevTools で error / 予期せぬ warning なし |

---

## 9. 本番環境向け設定

| 項目 | 方針 |
|------|------|
| `npm run build` | 成功必須。`dist/` を静的ホスト想定 |
| `npm run preview` | 本番相当の起動確認 |
| base path | ルート配信前提。サブパスが必要なら `vite.config` の `base` を README に明記 |
| 環境変数 | 現状不要。安易に追加しない |
| source map | 本番はデフォルトで可。秘匿情報なし |
| 参考 HTML | `sample/simple_typing_game.html` は変更しない |
| デプロイ先 | GitHub Pages / Netlify / Cloudflare Pages のいずれか想定を README に 1 例記載（実装は任意） |

Final Phase では **実際のクラウドデプロイは任意**。必須はビルド成功とローカル preview。

---

## 10. README に記載する内容

現行 README を全面更新する。

1. **概要** — 日本語表示＋ローマ字入力の忍者タイピングゲーム
2. **機能一覧** — 難易度 3 種、WPM/正確率、記録、音、一時停止、設定、遊び方
3. **必要環境** — Node バージョン目安
4. **起動手順** — `npm install` / `dev` / `build` / `preview` / `test` / `lint`
5. **操作方法** — A–Z、Esc、ロックオンの説明（短く）
6. **データ保存** — localStorage キー、記録削除の場所
7. **アクセシビリティ** — モーション設定の場所
8. **ディレクトリ概要** — `src/` のざっくり構成
9. **参考** — `sample/simple_typing_game.html` は参照のみ
10. **ライセンス** — 未定なら「個人学習用」等の一文

README だけで **起動と主要機能が理解できる** ことを完了条件とする。

---

## 11. 最終テスト項目

### 11.1 Vitest（拡充）

- 記録クリア関数・確認フロー用の純関数
- 問題データ検証の拡張
- 既存 74 件の回帰

### 11.2 手動 / Playwright（`scripts/final-browser-check.mjs` 想定）

- [ ] タイトル → 全画面遷移（difficulty / game / result / records / settings / howto）
- [ ] 小 tip 幅（例: 375px）で HUD が破綻しない
- [ ] キーボードのみでタイトル〜難易度開始まで到達
- [ ] 記録削除の確認キャンセル / 実行、即時空状態
- [ ] モーション軽減で slash / shake が抑制
- [ ] 再戦後 BGM・入力が正常
- [ ] タブ非表示で pause、復帰で自動再開しない
- [ ] `npm run build` + `preview` で起動
- [ ] console error なし

### 11.3 品質ゲート

```bash
npm run lint
npm run test
npm run build
```

すべて成功で Final Phase 完了条件の一部とする。

---

## 12. 変更予定ファイル一覧

### 新規

| ファイル | 役割 |
|----------|------|
| `sample/final_phase_implementation_plan.md` | 本計画（作成済み） |
| `src/utils/clearPlayRecords.ts` | 記録初期化の純粋関数 |
| `src/utils/clearPlayRecords.test.ts` | 削除ロジックテスト |
| `src/components/common/ConfirmDialog.tsx` | 確認ダイアログ（フォーカストラップ） |
| `src/data/typingProblems.integrity.test.ts` | 問題整合の追加検証（または既存拡張） |
| `scripts/final-browser-check.mjs` | 最終 E2E |
| `public/` や `favicon` | 必要なら最小アイコン（任意） |

### 変更

| ファイル | 変更内容 |
|----------|----------|
| `README.md` | 全面更新 |
| `src/screens/RecordsScreen.tsx` | 削除ボタン・ダイアログ・即時反映 |
| `src/App.tsx` | clear records ハンドラ、フォーカス補助（任意） |
| `src/components/game/GameHud.tsx` | レスポンシブ微調整 |
| `src/screens/*Screen.tsx` | a11y・空状態・余白 |
| `src/styles/index.css` | 小画面・reduced motion 抜け漏れ |
| `src/config/difficultyConfig.ts` | バランス微調整 |
| `src/data/typingProblems.ts` | 問題修正・重複整理 |
| `index.html` | title / viewport / lang 確認 |
| `package.json` | 必要なら `engines` 記載 |

### 変更しないもの

- オンラインランキング / バックエンド / アカウント
- 外部音声ファイル導入
- Canvas 化
- 参考 HTML の改変
- 空の将来用ファイルの乱造

---

## 13. 実装ステップ（Final 内）

### Step 1 — データ健全性
- 問題検証テスト拡充、問題データ修正
- clearPlayRecords + 確認ダイアログ

### Step 2 — UI / レスポンシブ / a11y
- 全画面の余白・HUD・フォーカス・ラベル
- モーション軽減の総点検

### Step 3 — バランス
- difficultyConfig 微調整と短時間プレイ確認

### Step 4 — パフォーマンス / リーク
- 再戦・長時間・console 確認

### Step 5 — ドキュメントと公開準備
- README 更新、build / preview、final E2E

### Step 6 — 品質ゲート
- lint / test / build 全成功、完了報告

---

## 14. 想定リスクと対策

| # | リスク | 対策 |
|---|--------|------|
| 1 | 小画面で HUD 過多 | 情報優先度を維持し、モバイルは縮小・折りたたみ |
| 2 | フォーカストラップ不備でキーボード操作不能 | ConfirmDialog / Pause で共通フック化してテスト |
| 3 | 記録削除の誤操作 | 確認ダイアログ必須、設定は消さない |
| 4 | 問題修正で matcher 破綻 | 全候補 Vitest 必須 |
| 5 | バランス変更で難易度崩壊 | 変更幅を小さく、難易度ごとに短時間検証 |
| 6 | a11y 対応で見た目が崩れる | 既存トークンを維持し、構造変更を最小に |
| 7 | E2E が遅い・不安定 | 忍頭で短時間シナリオ、待機は明示セレクタ |
| 8 | README 肥大化 | 起動・操作・機能に絞り、内部設計は sample 計画へ誘導 |

---

## 15. Final Phase 完了条件

- [ ] 主要画面がスマホ幅でも操作・視認可能
- [ ] キーボードのみで主要フローが可能
- [ ] 適切なラベル・フォーカス移動・色以外の情報手がかり
- [ ] モーション軽減が全画面で有効
- [ ] 記録を確認付きで削除でき、即時 UI 更新
- [ ] 問題データの自動検証が通る
- [ ] 長時間/再戦でリスナー・音・タイマーが重複しない
- [ ] console error なし（許容 warning は明示）
- [ ] `lint` / `test` / `build` 成功、preview 起動可
- [ ] README だけで起動と機能が分かる

---

## 16. Final Phase で実装しないもの

- オンライン機能・クラウド同期・ユーザーアカウント
- 外部音声パック
- 新難易度の追加（必要なら既存 3 種の調整のみ）
- 大規模なビジュアルリブランド
- ネイティブアプリ化

---

## 17. リリース後の任意フォロー

- GitHub Pages 等へのデプロイ実作業
- 追加問題パック
- サンプル音声ファイルへの差し替え（SoundManager インターフェース維持）
- より厳密な a11y 監査（axe 等）
