# Shinobi Keys

忍者の世界観で楽しむ、落下式ローマ字タイピング修行ゲームです。  
制限時間内にスコアを伸ばし、コインでガチャを回して **121 体** の忍者を集めながら、何度でも修行に挑めます。

---

## アプリケーション概要

Shinobi Keys は、ブラウザで遊べる **日本語ローマ字タイピングゲーム** です。画面上部から落下する敵手裏剣に表示された日本語を入力し、手裏剣や刀で迎撃します。

「短時間で遊べるタイピングゲーム」と「キャラ収集・能力差分」を組み合わせ、繰り返しプレイしやすい構成にしました。

- 落下式タイピング（**同時出題は常に 1 問**）
- 難易度 3 段階・制限時間制（終了は時間切れのみ。HP UI なし）
- 600 問以上の問題バンクとローマ字表記ゆれ対応
- 全 **121 体** のキャラクター収集・能力差分
- ガチャ・忍録による入手と選択
- プレイ記録の localStorage 保存（オフライン完結）
- PC / スマホ対応 UI（320px 幅でも主要操作可能）

---

## 主な機能


| 機能       | 内容                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------ |
| タイピング    | 日本語表示＋ローマ字入力。複数正解パターン（例: `sushi` / `susi`）に対応。1 問ずつ出題し、成功・失敗後に次へ進行                               |
| 難易度      | 修行生（60 秒）・忍者（90 秒）・忍頭（120 秒）。難易度ごとに 200 問以上、合計 600 問以上                                           |
| スコア・コンボ  | 正解でスコア加算。連続成功でコンボ倍率上昇。4 / 8 / 12 問の連続成功で時間・コイン報酬                                                 |
| コイン      | 撃破マイルストーン・連続成功報酬・リザルト成績ボーナスで獲得                                                                   |
| キャラクター   | 全 121 体（N 23 / R 23 / SR 24 / SSR 24 / UR 22 / 神忍 5）。CSS・装備表現のみ（外部画像なし）                          |
| キャラクター能力 | スコア補正・時間延長・コンボ補正・コイン補正・連続成功関連・ノーミスボーナスなど。プレイ開始時に固定                                               |
| ガチャ      | 単発 100 コイン / 10 連 900 コイン。排出率 N 54.9% / R 25% / SR 12% / SSR 6% / UR 2% / 神忍 0.1%。SR 以上はレア度別開封演出 |
| 忍録       | 全キャラをレア度別に一覧。所持はカラー・未所持は「未発見」表示。所持キャラのみ選択可能。神忍は専用枠                                               |
| プレイ記録    | 難易度別ベスト・履歴を localStorage（`shinobi-keys-data`、schema v3）に保存                                       |
| 設定・音声    | 音量・ミュート・モーション設定。Web Audio API による効果音・簡易 BGM                                                      |
| 画面遷移     | ハッシュルーティング（`#title` など）とブラウザ戻る / 進むの連動。一時停止（ボタン / Esc）                                           |


---



## 技術スタック


| 区分      | 技術                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| フロントエンド | ![REACT](https://img.shields.io/badge/REACT-2F2F2F?style=for-the-badge&logo=react&logoColor=61DAFB) ![TYPESCRIPT](https://img.shields.io/badge/TYPESCRIPT-2F2F2F?style=for-the-badge&logo=typescript&logoColor=3178C6) ![VITE](https://img.shields.io/badge/VITE-2F2F2F?style=for-the-badge&logo=vite&logoColor=646CFF) ![TAILWINDCSS](https://img.shields.io/badge/TAILWINDCSS-2F2F2F?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8) |
| テスト     | ![VITEST](https://img.shields.io/badge/VITEST-2F2F2F?style=for-the-badge&logo=vitest&logoColor=6E9F18) ![PLAYWRIGHT](https://img.shields.io/badge/PLAYWRIGHT-2F2F2F?style=for-the-badge&logo=playwright&logoColor=2EAD33)                                                                                                                                                                                                                     |
| データ保存   | ![LOCAL_STORAGE](https://img.shields.io/badge/LOCAL_STORAGE-2F2F2F?style=for-the-badge&logo=html5&logoColor=E34F26)                                                                                                                                                                                                                                                                                                                           |
| 開発ツール   | ![ESLINT](https://img.shields.io/badge/ESLINT-2F2F2F?style=for-the-badge&logo=eslint&logoColor=4B32C3) ![GIT](https://img.shields.io/badge/GIT-2F2F2F?style=for-the-badge&logo=git&logoColor=F05032) ![GITHUB](https://img.shields.io/badge/GITHUB-2F2F2F?style=for-the-badge&logo=github&logoColor=white)                                                                                                                                    |


バックエンド・認証・クラウド同期はありません。プレイデータは端末内のみに保存されます。

---



## アプリの画面


| タイトル画面                                   | ゲーム画面                                           |
| ---------------------------------------- | ----------------------------------------------- |
| ![タイトル画面](docs/screenshots/pc-title.png) | ![ゲーム画面](docs/screenshots/pc-gameplay.png)      |
| ガチャ画面                                    | 忍録画面                                            |
| ![ガチャ画面](docs/screenshots/pc-gacha.png)  | ![忍録画面](docs/screenshots/pc-shinobi-record.png) |


---



## ローカル起動



### 前提

- Node.js / npm（`package.json` に engines は未指定）
- モダンブラウザ（Chrome / Firefox / Safari / Edge）



### 開発サーバー

```bash
npm install
npm run dev
# 表示された URL（通常 http://localhost:5173）をブラウザで開く
```



### ビルド・プレビュー

```bash
npm run build
npm run preview
```



### テスト

```bash
npm run lint
npm run test          # Vitest（33 ファイル / 210 テスト）
npm run test:e2e      # Playwright 検証 4 本（要 build + preview）
```

Playwright を初めて使う場合:

```bash
npx playwright install chromium
```

`test:e2e` は次のスクリプトを順に実行します。


| スクリプト                                           | 確認内容              |
| ----------------------------------------------- | ----------------- |
| `scripts/final-browser-check.mjs`               | 画面遷移・記録・設定・320px  |
| `scripts/gameplay-browser-check.mjs`            | ゲームプレイ・一時停止       |
| `scripts/gacha-browser-check.mjs`               | ガチャ UI・演出         |
| `scripts/shinobi-record-page-browser-check.mjs` | 忍録 121 体・所持 / 未所持 |


---



## ディレクトリ構成（主要部分）

```
src/
├── screens/          # タイトル・ゲーム・ガチャ・忍録など
├── components/       # UI 部品（game / gacha / shinobi-record など）
├── features/game/    # ゲーム reducer・ロジック
├── config/           # 難易度・キャラ・ガチャ設定
├── data/problems/    # 難易度別タイピング問題
├── utils/            # ローマ字判定・ガチャ・ストレージ
├── hooks/            # 履歴連携・入力・落下ループ
└── audio/            # Web Audio 管理

scripts/              # キャラ生成・Playwright 検証
```

---



## 今後の展望

- 今後は、ミスしやすいキーや苦手な問題を記録し、  
プレイヤーごとに練習内容を調整できる機能を追加
- イベント・限定ガチャの追加(季節イベントなど)
- 実績バッジの追加
- リアルタイム1対1対戦
  - 2人に同じ問題が出ます。
    正しく速く打つほど、相手へ攻撃できます。
- フレンド対戦

などが今後の展望になります！😁😄😀