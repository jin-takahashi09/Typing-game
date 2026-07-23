# Shinobi Keys — Phase 5 実装計画

**ステータス:** 計画のみ（未着手）  
**前提:** Phase 4 コミット済み（`438254b feat: implement phase 4 local records`）  
**スコープ:** 効果音・BGM・音量/ミュート・一時停止・設定画面・遊び方画面・モーション設定。オンライン機能は対象外

---

## 1. Phase 5 の目的

Phase 4 で確立した `StoredAppData.settings` を UI と接続し、**演出（音・モーション）と操作性（一時停止・遊び方）** を追加する。音やブラウザ制限が失敗してもゲーム本体は壊れない設計を必須とする。

---

## 2. 優先原則（必須）

| # | 原則 | 実装方針 |
|---|------|----------|
| 1 | 音が鳴らなくてもゲームは正常動作 | SoundManager は失敗を握りつぶし、呼び出し側は戻り値を待たない |
| 2 | 自動再生制限に対応 | 初回ユーザー操作（タイトルの「修行を始める」等）で `AudioContext.resume()` |
| 3 | タブ非表示時に停止 | `visibilitychange` で BGM pause + ゲーム自動一時停止 |
| 4 | 一時停止中は落下・生成・入力・経過時間を停止 | `status: 'paused'` + rAF `enabled=false` + 入力無効 + 経過時間フリーズ |
| 5 | 再開後に速度が急増しない | rAF 再開時 `lastTimeRef = null`（既存 `useGameLoop` の cleanup と同方針） |
| 6 | 再戦時に音・タイマーが重複しない | SoundManager はシングルトン。GameScreen remount + タイマー clear（Phase 2 維持） |
| 7 | `prefers-reduced-motion` を考慮 | `motionPreference: 'system' \| 'reduced' \| 'full'` で CSS/演出を切替 |
| 8 | 壊れた設定値から安全に復旧 | Phase 4 の `normalizeSettings` を拡張（volume clamp, enum 検証） |

---

## 3. SoundManager / 音管理の設計

### 3.1 責務

`src/audio/SoundManager.ts`（新規）を単一窓口とする。

```ts
type SfxId =
  | 'typeCorrect'
  | 'typeMiss'
  | 'destroy'
  | 'damage'
  | 'stageUp'
  | 'gameOver'
  | 'uiClick'
  | 'pause'
  | 'resume'

interface SoundManager {
  /** ユーザー操作後に呼ぶ。自動再生制限解除 */
  unlock(): Promise<void>
  isUnlocked(): boolean
  setVolume(volume: number): void      // 0–1
  setMuted(muted: boolean): void
  playSfx(id: SfxId, options?: { playbackRate?: number }): void
  startBgm(track?: 'game' | 'title'): void
  pauseBgm(): void
  resumeBgm(): void
  stopBgm(): void
  dispose(): void
}
```

### 3.2 アーキテクチャ

```text
UI / GameScreen
    │
    ▼
soundFacade (React 用薄いラッパ or 直接呼び出し)
    │
    ▼
SoundManager (シングルトン)
    ├── AudioContext
    ├── GainNode (masterVolume)
    ├── SFX 生成 or Buffer 再生
    └── BGM Oscillator / BufferSource
```

- **シングルトン:** `getSoundManager()` で取得。再戦・画面遷移で多重生成しない
- **React 非依存:** 純 TS。フックは `useSoundSettings` 程度に限定
- **失敗耐性:** `unlock` / `play` は内部 try/catch。例外を外へ投げない

### 3.3 Web Audio API の使用方針

| 用途 | API | 理由 |
|------|-----|------|
| 効果音 | `OscillatorNode` + `GainNode` + 短い ADSR | 外部ファイル不要・即再生・容量 0 |
| BGM | 低音のゆっくりしたオシレータ / ノイズ寄りループ | 同上。差し替え可能な abstraction |
| 音量 | 単一 `GainNode`（master） | settings.volume × muted |
| ミュート | `gain.value = 0` または再生スキップ | muted 時は play 自体を no-op 可 |

**Phase 5 では音声ファイル（mp3/ogg）は使わない。**  
理由: アセット手配・ライセンス・読み込み失敗を避け、ゲーム結合を優先。将来 `AudioBuffer` 差し替え可能なインターフェースにしておく。

```ts
// 将来差し替え用の内部インターフェース
interface SfxPlayer {
  play(id: SfxId): void
}
// Phase 5: OscillatorSfxPlayer
// Phase 6+: SampleSfxPlayer (optional)
```

### 3.4 BGM・効果音の種類

| ID | 種類 | タイミング | 生成イメージ |
|----|------|------------|--------------|
| `typeCorrect` | SFX | 正解キー | 短い高音クリック |
| `typeMiss` | SFX | ミスキー | 低い短いノイズ |
| `destroy` | SFX | ターゲット撃破 | 上昇スイープ |
| `damage` | SFX | 底到達ダメージ | 下降トーン |
| `stageUp` | SFX | ステージ上昇 | 短いファンファーレ |
| `gameOver` | SFX | ゲームオーバー | 低音ドローン |
| `uiClick` | SFX | ボタン操作 | 極短いクリック |
| `pause` / `resume` | SFX | 一時停止トグル | 短い UI 音 |
| `bgm:title` | BGM | タイトル/メニュー | 低音量・低テンポ（任意） |
| `bgm:game` | BGM | プレイ中 | 控えめループ |

**音量バランス:** BGM は SFX より小さく（例: BGM gain = master × 0.25）。SFX 過多を防ぐ。

### 3.5 自動再生制限への対応

1. アプリ起動時は `AudioContext` を `suspended` のまま作成してもよい
2. 最初の明確なユーザー操作で `unlock()`:
   - 「修行を始める」
   - 設定のミュート解除
   - タイトルの任意クリック（任意）
3. unlock 前の `playSfx` は無音 no-op（キューイングしない）
4. unlock 後に BGM 開始（ゲーム開始時）

### 3.6 タブ非表示・フォーカス喪失

```ts
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    soundManager.pauseBgm()
    // GameScreen: 自動 pause（playing → paused）
  }
})
```

- タブ復帰時は **自動 resume しない**（ユーザーが Esc / 再開ボタンで再開）
- 理由: 不意に落下が進むのを防ぐ

---

## 4. 一時停止の設計

### 4.1 ゲーム状態

`GameStatus` を拡張:

```ts
export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover'
```

### 4.2 一時停止時に止めるもの

| 対象 | 停止方法 |
|------|----------|
| rAF 落下・生成 | `useGameLoop({ enabled: status === 'playing' })` |
| キー入力（タイピング） | `useKeyboardInput({ enabled: status === 'playing' })` |
| 経過時間 | `elapsedMs` は `playing` 中のみ加算。`pausedAtMs` / `pausedTotalMs` で補正 |
| BGM | `pauseBgm()` |
| スポーンタイマー | rAF 停止に伴い加算停止 |
| HUD 統計更新 interval | playing 中のみ |

### 4.3 止めないもの

| 対象 | 理由 |
|------|------|
| Esc / 再開ボタン | 一時停止解除のため |
| 設定画面への導線（任意） | Phase 5 ではゲーム中はオーバーレイのみ。設定変更はタイトル側優先でも可 |

### 4.4 再開時の速度急増防止

既存 `useGameLoop` は `enabled=false` 時に `lastTimeRef = null` をセットする。再開時は最初のフレームで delta 計算をスキップするため、**大きな delta によるジャンプは起きない**。

追加確認:

- `maxDeltaMs`（現行 50）を維持
- pause → resume で `spawnTimerRef` をリセットしない（中断位置から再開）か、リセットするかは **リセットしない**（自然な再開）を採用

### 4.5 経過時間の正しい計測

```ts
// 概念
elapsedMs = now - gameStartedAtMs - pausedTotalMs
// pause 開始時: pausedAtMs = now
// resume 時: pausedTotalMs += now - pausedAtMs
```

HUD / WPM / リザルトは補正後の `elapsedMs` を使う。一時停止中に WPM が異常値にならない。

### 4.6 UI

- ゲーム中 **Esc** で pause / resume トグル
- 一時停止オーバーレイ: 「一時停止」「再開」「タイトルへ」（タイトルへは確認ダイアログ任意）
- モバイル: 画面上に Pause ボタン（コンパクト）

### 4.7 reducer actions（案）

```ts
| { type: 'PAUSE_GAME' }
| { type: 'RESUME_GAME' }
```

- `PAUSE_GAME`: status → paused（playing のときのみ）
- `RESUME_GAME`: status → playing（paused のときのみ）
- gameover / ready では無視

---

## 5. 設定データ構造

Phase 4 の `StoredSettings` を拡張・接続する。

### 5.1 現行（Phase 4）

```ts
interface StoredSettings {
  volume: number              // 0–1
  muted: boolean
  lastDifficulty: DifficultyId | null
  motionPreference: MotionPreference  // 'system' | 'reduced' | 'full'
}
```

### 5.2 Phase 5 で追加検討（必要なら schema v2）

```ts
interface StoredSettings {
  volume: number
  muted: boolean
  lastDifficulty: DifficultyId | null
  motionPreference: MotionPreference
  /** BGM と SFX を分ける場合（任意）。分けないなら volume のみ */
  sfxVolume?: number   // 省略時は volume と同値扱い
  bgmVolume?: number   // 省略時は volume * 0.25
}
```

**方針:** Phase 5 初期は **master volume + muted + motionPreference** のみ。分離は UI が複雑になるため後回し可。計画では単一 volume を推奨。

### 5.3 schema version

| 変更 | version |
|------|---------|
| settings フィールド追加のみ（欠損補完） | **v1 のまま**（normalize でデフォルト） |
| 破壊的変更が必要になった場合 | v2 + migrate |

Phase 5 では原則 **version 1 維持 + normalize 拡張**。

### 5.4 保存タイミング

- 設定画面で変更 → 即 `saveStoredData`（debounce 200–300ms 可）
- ミュートトグルも同様
- 保存失敗時は UI に短い警告（Phase 4 の saveError パターン流用）

### 5.5 壊れた値の復旧

既存 `normalizeSettings` を強化:

| フィールド | 不正時 |
|------------|--------|
| volume | NaN / 範囲外 → clamp 0–1、デフォルト 0.7 |
| muted | 非 boolean → false |
| motionPreference | 未知 → `'system'` |
| lastDifficulty | 未知 → null |

---

## 6. 設定画面の構成

### 6.1 画面 ID

`AppScreen` に `'settings'` を追加。

### 6.2 レイアウト（1 画面・カードなし寄り）

```text
設定
├── 音声
│   ├── 音量スライダー (0–100%)
│   └── ミュート トグル
├── モーション
│   └── system / reduced / full の選択
├── （任意）テスト再生ボタン「音を確認」
└── タイトルへ戻る
```

### 6.3 挙動

- 音量変更 → SoundManager.setVolume + storage 保存
- ミュート → setMuted + 保存。ミュート中はスライダー操作で自動 unmute するかは **unmute しない**（明示トグル）を推奨
- モーション変更 → CSS 変数 / `data-motion` 属性を `document.documentElement` に反映
- 「音を確認」→ unlock + playSfx('uiClick')

---

## 7. 遊び方画面の構成

### 7.1 画面 ID

`AppScreen` に `'howto'` を追加。

### 7.2 内容（最低限）

1. **目的:** 落下する日本語をローマ字で入力し、手裏剣を撃ち落とす
2. **操作:**
   - A–Z キーで入力
   - Esc で一時停止 / 再開
   - 同一先頭文字の複数ターゲットは最も下を優先ロック
3. **ルール:**
   - 正解で撃破・スコア・コンボ
   - ミスでコンボリセット
   - ターゲットが底に到達すると防衛が減る
   - 防衛 0 でゲームオーバー
4. **表示の見方:** 日本語 + 代表ローマ字、入力進捗の色分け
5. **難易度の違い:** 修行生 / 忍者 / 忍頭の短い説明
6. **記録:** プレイ結果は自動保存される旨

### 7.3 UI

- スクロール可能な単一ページ
- 「修行を始める」CTA → difficulty
- 「タイトルへ戻る」

---

## 8. モーション設定

### 8.1 解決ロジック

```ts
function resolveReducedMotion(preference: MotionPreference): boolean {
  if (preference === 'reduced') return true
  if (preference === 'full') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

### 8.2 影響範囲

| 要素 | reduced 時 |
|------|------------|
| 落下アニメ | 継続（ゲーム性のため）。ただしシェイク・slash を短縮/無効 |
| target-miss-shake | 無効 or 1 フレーム |
| slash / combo popup | 簡略 or 即時表示 |
| stage up scale | 無効 |
| CSS transitions | `--duration-fast: 0` 系に切替 |

落下そのものを止めない（遊びが成立しなくなるため）。

---

## 9. 画面遷移

```text
title ──┬── howto
        ├── settings
        ├── records（Phase 4）
        └── difficulty → game ⇄ paused(overlay)
                              ↓
                           result
```

| 遷移 | 操作 |
|------|------|
| title → howto / settings / records | 各ボタン |
| howto / settings → title | 戻る |
| game → paused | Esc / Pause ボタン |
| paused → game | Esc / 再開 |
| paused → title | 確認後（任意） |

TitleScreen の「遊び方」「設定」を有効化する。

---

## 10. 変更予定ファイル一覧

### 10.1 新規

| ファイル | 役割 |
|----------|------|
| `src/audio/SoundManager.ts` | Web Audio シングルトン |
| `src/audio/sfxPresets.ts` | オシレータ周波数・長さの定義 |
| `src/audio/SoundManager.test.ts` | unlock / mute / volume（jsdom mock） |
| `src/hooks/usePageVisibility.ts` | タブ非表示検知 |
| `src/hooks/useMotionPreference.ts` | reduced motion 解決 |
| `src/screens/SettingsScreen.tsx` | 設定画面 |
| `src/screens/HowToScreen.tsx` | 遊び方画面 |
| `src/components/game/PauseOverlay.tsx` | 一時停止 UI |
| `src/utils/elapsedTime.ts` | pause 補正付き経過時間（純粋関数） |
| `src/utils/elapsedTime.test.ts` | 経過時間計算テスト |
| `src/features/game/pauseLogic.test.ts` | PAUSE/RESUME reducer テスト |

### 10.2 変更

| ファイル | 変更内容 |
|----------|----------|
| `src/types/app.ts` | `'settings' \| 'howto'`、必要なら GameStatus |
| `src/types/game.ts` | `paused` status、PAUSE/RESUME actions |
| `src/types/records.ts` | settings コメント整備（必要なら拡張） |
| `src/features/game/gameReducer.ts` | PAUSE / RESUME |
| `src/hooks/useGameLoop.ts` | pause 再開時 lastTime クリア確認（ほぼ現行で可） |
| `src/hooks/useKeyboardInput.ts` | Esc を別コールバックで許可する API 拡張 |
| `src/screens/GameScreen.tsx` | pause・visibility・SFX 呼び出し・経過時間補正 |
| `src/screens/TitleScreen.tsx` | howto / settings 有効化、unlock 導線 |
| `src/App.tsx` | 画面ルーティング、settings 保存、SoundManager 接続 |
| `src/utils/storageSchema.ts` | settings normalize 強化 |
| `src/styles/index.css` | `[data-motion='reduced']` 用ルール |
| `src/components/game/GameHud.tsx` | Pause ボタン（任意） |

### 10.3 作成しないもの

- 音声アセットファイル（mp3 等）
- オンラインランキング
- 空の将来用プレイヤー実装ファイル（差し替えはインターフェースコメントで十分）

---

## 11. 実装ステップ（Phase 5 内）

### Step 1 — 一時停止基盤
- GameStatus `paused`、reducer、Esc、PauseOverlay
- 経過時間補正
- visibility → auto pause
- Vitest: pause/resume、elapsed

### Step 2 — SoundManager
- Oscillator ベース SFX / BGM
- unlock / volume / mute
- ゲームイベントへの配線（失敗しても続行）

### Step 3 — 設定画面
- volume / mute / motion UI
- storage 保存・読込
- Title から遷移

### Step 4 — 遊び方画面
- 操作・ルール説明
- Title から遷移

### Step 5 — モーション
- data-motion 属性
- reduced 時の演出カット

### Step 6 — 品質
- lint / test / build
- Playwright: pause、設定遷移、音なしでもクリア可能

---

## 12. テスト方針

### 12.1 純粋関数・reducer

| 対象 | ケース |
|------|--------|
| gameReducer PAUSE/RESUME | playing→paused→playing、不正遷移無視 |
| elapsedTime | pause 中に増えない、resume 後も正しい |
| normalizeSettings | volume 範囲外、壊れた motionPreference |
| resolveReducedMotion | system/reduced/full × matchMedia |

### 12.2 SoundManager（モック）

| ケース | 期待 |
|--------|------|
| unlock 前の play | 例外なし・無音 |
| muted 時の play | no-op |
| setVolume(1.5) | clamp |
| dispose 後の play | 例外なし |
| AudioContext 生成失敗 | ゲーム継続可能（モック throw） |

### 12.3 統合（手動 / Playwright）

- Esc で落下停止、再開で速度ジャンプなし
- タブ切替で自動 pause
- 設定変更がリロード後も残る
- 音なし（モック / ミュート）で撃破〜リザルトまで完走
- 再戦後に BGM / rAF が二重にならない

---

## 13. 想定リスクと対策

| # | リスク | 対策 |
|---|--------|------|
| 1 | 自動再生制限で音が出ない | unlock をユーザー操作に紐付け。出なくてもエラーにしない |
| 2 | AudioContext 過多でリーク | シングルトン + dispose on 不要時、再戦で再生成しない |
| 3 | pause 後の巨大 delta | lastTime null 化 + maxDeltaMs |
| 4 | Esc が入力と競合 | typing キーと分離。paused 中は typing 無効 |
| 5 | visibility と手動 pause の競合 | auto-pause フラグを持ち、復帰時は手動再開必須 |
| 6 | settings 保存失敗 | ゲームは継続、短い警告のみ |
| 7 | reduced motion と落下の混同 | 落下は維持、装飾のみ削減 |
| 8 | BGM がうるさい / 邪魔 | 低音量・ミュート容易・設定画面から即変更 |
| 9 | StrictMode 二重 effect | SoundManager はモジュール単一、unlock 冪等 |
| 10 | モバイルで Esc なし | 画面上 Pause ボタン必須 |

---

## 14. Phase 5 完了条件

- [ ] SoundManager 経由で SFX/BGM が鳴る（またはミュート/制限時は無音で正常動作）
- [ ] 音量・ミュートが設定画面で変更でき、localStorage に残る
- [ ] モーション設定が反映され、prefers-reduced-motion を考慮できる
- [ ] Esc / ボタンで一時停止・再開でき、落下・入力・経過時間が止まる
- [ ] タブ非表示で自動一時停止
- [ ] 再開後にターゲットが急加速しない
- [ ] 遊び方画面・設定画面がタイトルから開ける
- [ ] 再戦時に音・タイマーが重複しない
- [ ] Vitest 追加、lint / test / build 成功

---

## 15. Phase 5 で実装しないもの

- 外部音声ファイルの本格サウンドパック
- オンラインランキング / バックエンド
- Canvas 描画への移行
- ローマ字規則の大幅拡張（必要なら別タスク）
- 一時停止中の設定画面フル遷移（オーバーレイ内の簡易音量は任意）

---

## 16. Phase 6 への引き継ぎ

Phase 5 完了時点で以下が揃う:

- 音・一時停止・設定・遊び方を含むフルローカル体験
- storage settings の実運用
- モーションアクセシビリティの基礎

Phase 6 では Vitest 拡充、バランス調整、a11y フォーカストラップ、README、storage 異常系の総点検を行う。
