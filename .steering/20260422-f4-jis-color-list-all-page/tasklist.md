# タスクリスト: F4 慣用色名一覧リストページの実装

## 凡例

- `[ ]` 未着手
- `[x]` 完了

## ステータス

未着手

---

## Phase 1: ユーティリティ層

### T1-1: 並び順ロジックの実装（`sort.ts`）

- [ ] `app/src/lib/jis-color-map/sort.ts` を新規作成
  - `sortJisColors(colors: JISColor[]): JISColor[]` をエクスポート
  - 有彩色: `parseMunsell(jisColor.munsell)` で色相を取得し `munsellHueRank(hue)` を第1ソートキー（昇順）、`value` を第2ソートキー（降順）、`chroma` を第3ソートキー（降順）でソート
  - 無彩色（`munsell` が `N` で始まるもの）: 有彩色の末尾に配置し、`value` 降順でソート
  - `munsellHueRank` が `null` を返す不正値は `console.error` を出力したうえで無彩色グループの後ろに退避
  - 最終的に `[有彩色ソート済み, 無彩色ソート済み, 不正値]` を結合して返す
- **作業対象ファイル**: `app/src/lib/jis-color-map/sort.ts`（新規作成）
- **完了条件**: 型チェック（`npm run check`）が通る。`sortJisColors` 単体で呼び出し、先頭が 2RP 付近の有彩色、末尾が無彩色（N）になっていることをコンソールで確認できる

### T1-2: 並び順ロジックのユニットテスト（`sort.spec.ts`）

- [ ] `app/src/lib/jis-color-map/sort.spec.ts` を新規作成
  - 有彩色が色相ランク昇順・同色相内で明度降順・同明度内で彩度降順になるケースをテスト
  - 無彩色が末尾に配置されるケースをテスト（有彩色が1色以上存在する場合）
  - 全無彩色の配列を渡したとき明度降順になるケースをテスト
  - `munsellHueRank` が `null` を返す不正なマンセル値を含む色が末尾に退避されるケースをテスト
  - 空配列を渡したとき空配列が返るケースをテスト
- **作業対象ファイル**: `app/src/lib/jis-color-map/sort.spec.ts`（新規作成）
- **完了条件**: テストがすべてパスする。`npm run check` が通る
- **依存タスク**: T1-1

### T1-3: データ取得関数の追加（`getSortedAllJisColors`）

- [ ] `app/src/lib/data/jis-colors.ts` に `getSortedAllJisColors(): JISColor[]` を追加
  - `sortJisColors(JIS_COLORS)` を呼び出して返すだけのシンプルな実装
  - ※確認事項3に基づき、各 `JISColor` がどの `ColorFamily` に属するかの判定は `JIS_COLORS_BY_GROUP.get(family.id)` に含まれる `id` セットとの照合で行う（線形探索で問題ない見込み）
- **作業対象ファイル**: `app/src/lib/data/jis-colors.ts`（更新）
- **完了条件**: `npm run check` が通る。関数を呼び出したとき JIS_COLORS と同じ件数の配列が返る
- **依存タスク**: T1-1

---

## Phase 2: 共通コンポーネント（級タグ共通化）

### T2-1: 級タグ共通コンポーネントの新規作成（`JisExamLevelBadge.svelte`）

- [ ] `app/src/lib/components/jis-color-map/JisExamLevelBadge.svelte` を新規作成
  - Props: `examLevel: 2 | 3 | null`
  - `examLevel === 2` → `2級` バッジ（`.level.level-2`、背景 `var(--color-grade-2)`）
  - `examLevel === 3` → `3級` バッジ（`.level.level-3`、背景 `var(--color-grade-3)`）
  - `examLevel === null` → `visibility: hidden` のスペーサー（`.level.level-none`）
  - スタイルは `JisColorCompareSection.svelte` の `.level` / `.level-2` / `.level-3` / `.level-none` を移植
- **作業対象ファイル**: `app/src/lib/components/jis-color-map/JisExamLevelBadge.svelte`（新規作成）
- **完了条件**: 型チェックが通る

### T2-2: `JisColorCompareSection.svelte` の内部書き換え

- [ ] `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte` を更新
  - `{#if jis.examLevel !== null} ... {:else} ... {/if}` ブロックを `<JisExamLevelBadge examLevel={jis.examLevel} />` 1行に置き換える
  - `<style>` ブロックから `.level` / `.level-2` / `.level-3` / `.level-none` のスタイル定義を削除する
  - Props・スロットなど外部インタフェースは一切変更しない
- **作業対象ファイル**: `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte`（更新）
- **完了条件**: 型チェックが通る。既存の `/jis-color-map/[family]` ページを実際に表示し、級タグの見た目・挙動が置き換え前と完全に一致する（退行なし）
- **依存タスク**: T2-1

---

## Phase 3: 新規コンポーネント

### T3-1: 慣用色名詳細セクションの実装（`JisColorDetailSection.svelte`）

- [ ] `app/src/lib/components/jis-color-map/JisColorDetailSection.svelte` を新規作成
  - Props: `family: JISColorFamily`, `jisColors: JISColor[]`（並び順確定済み・該当 family の色のみ）
  - コンポーネント内に `splitOriginDescription(text: string): string[]` を定義（`text.split(/\s+/).filter((s) => s.length > 0)`）
  - 1色 = 1エントリ（`<article class="entry" id={jisColor.id}>`）を `{#each jisColors}` でループ描画
  - 各エントリに表示する情報:
    - アイコン（`JIS_COLOR_ICON_MAP.get(jisColor.iconKey)`、`aria-hidden="true"`）
    - 角丸正方形の色スウォッチ（`jisColor.hex` で塗りつぶし）
    - `<JisExamLevelBadge examLevel={jisColor.examLevel} />`
    - `<h3 class="color-name" id={jisColor.id}>` に慣用色名（`scroll-margin-top` 付き）
    - 読み（`jisColor.reading`）
    - PCCS近似値（`PCCS_ALL_MAP.get(approx.notation)` で `PCCSColor` を解決し `PccsSwatch` で表示。`undefined` になる場合は描画スキップ）
    - 由来説明（`splitOriginDescription` で分割し `<br>` で改行）
    - 系統色名・マンセル値（`<dl>` で表示）
    - 比較ページへのリンク（`resolve("/jis-color-map/[family]", { family: family.id })`）
  - デスクトップ（`min-width: 641px`）: `.entry-main` を `display: grid; grid-template-columns: auto 1fr;` で横並び
  - モバイル（`max-width: 640px`）: `grid-template-columns: 1fr;` で縦積み
  - ※確認事項5に基づき、`PCCS_ALL_MAP` にない notation は描画をスキップする（`filter` で除去）
  - ※確認事項6に基づき、ページ `<h1>` との見出し階層を考慮し `<h3>` で慣用色名を表示する
  - ※確認事項2に基づき、`scroll-margin-top` の値は実装時にナビゲーションバーの高さを確認して決定する
- **作業対象ファイル**: `app/src/lib/components/jis-color-map/JisColorDetailSection.svelte`（新規作成）
- **完了条件**: 型チェックが通る。1つの family データを渡して全エントリが正しく描画される（仮ページで目視確認）
- **依存タスク**: T1-1、T2-1

### T3-2: 全一覧ページへのリンクカードの実装（`JisColorAllListCard.svelte`）

- [ ] `app/src/lib/components/jis-color-map/JisColorAllListCard.svelte` を新規作成
  - Props: `checkerColors: [string, string, string, string, string, string, string]`
  - タイトル「慣用色名 全一覧」・説明文「由来やPCCS近似値など、色の詳細を学ぼう」はコンポーネント内固定値
  - リンク先は `resolve("/jis-color-map/all")` で固定
  - `.card-checker` は `grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);` の 3×3 グリッド（9セル）
  - 7色を `<span class="checker-cell">` として配置し、末尾2セル（8・9番目）は空のまま
  - `aspect-ratio: 1`・`min-width: 88px` は `FamilyCard.svelte` の設計と共通
  - `FamilyCard.svelte` の外部インタフェースは一切変更しない（独立実装）
  - ※確認事項7に基づき、末尾2セルの空部分の見た目（背景色・枠線の有無）は実装時に目視確認して決定する
- **作業対象ファイル**: `app/src/lib/components/jis-color-map/JisColorAllListCard.svelte`（新規作成）
- **完了条件**: 型チェックが通る。7色の模様が正しく表示される（仮ページで目視確認）

---

## Phase 4: 新規ページ（`/jis-color-map/all`）

### T4-1: ルートファイルの作成（`+page.ts`・`+page.svelte`）

- [ ] `app/src/routes/jis-color-map/all/` ディレクトリを作成
- [ ] `app/src/routes/jis-color-map/all/+page.ts` を新規作成
  - `export const ssr = false` のみ記述（`[family]/+page.ts` と同様のパターン）
- [ ] `app/src/routes/jis-color-map/all/+page.svelte` を新規作成
  - `<svelte:head><title>慣用色名 全一覧 — PCCS Lens</title></svelte:head>`
  - `Breadcrumb` でパンくずリスト（慣用色名マップ > 全一覧）
  - `<h1>慣用色名 全一覧</h1>`
  - アイコン群（`.icon-index`）: `getSortedAllJisColors()` を `sortedColors` に格納し `{#each sortedColors}` でループ。各アイコンは `<a href="#{jisColor.id}" aria-label={jisColor.name}><Icon ... aria-hidden="true" /></a>`
  - 慣用色名詳細セクション: `JIS_COLOR_FAMILIES` を `{#each}` でループし、family ごとに `JisColorDetailSection` を描画
  - `sortedColorsByFamily` の構築: `sortedColors` を `JIS_COLORS_BY_GROUP.get(family.id)` の `id` セットで照合して family 別に分類する
  - ※確認事項1に基づき、`scroll-behavior: smooth` がグローバル CSS に未設定であれば `+page.svelte` の `<style>` に `:global(html) { scroll-behavior: smooth; }` を追加する（実装時に既存グローバル CSS を確認して判断する）
- **作業対象ファイル**: `app/src/routes/jis-color-map/all/+page.ts`（新規作成）、`app/src/routes/jis-color-map/all/+page.svelte`（新規作成）
- **完了条件**: `/jis-color-map/all` にアクセスして全慣用色のアイコン群と詳細セクションが表示される。型チェックが通る
- **依存タスク**: T1-3、T3-1

---

## Phase 5: トップページ改修

### T5-1: トップページへの「一覧で覚える」セクション追加

- [ ] `app/src/routes/jis-color-map/+page.svelte` を更新
  - スクリプト部に `JIS_COLORS_BY_GROUP` と各 `ColorFamily` からランダムに1色を選ぶロジックを追加:
    ```ts
    const pickOneFromFamily = (familyId: ColorFamily): string => {
      const colors = JIS_COLORS_BY_GROUP.get(familyId) ?? []
      return colors.length === 0 ? "#cccccc" : colors[Math.floor(Math.random() * colors.length)].hex
    }
    const allListCheckerColors = JIS_COLOR_FAMILIES.map((f) => pickOneFromFamily(f.id)) as
      [string, string, string, string, string, string, string]
    ```
  - `JisColorAllListCard` をインポートし、`FamilyCard` グリッドの上に「一覧で覚える」セクションを追加
  - 既存の `FamilyCard` グリッドを「比較して覚える」セクションで囲む（requirements.md §5 の HTML 構造に従う）
  - 既存の `.grid` スタイルや `Heading1` の表示に影響を与えない
- **作業対象ファイル**: `app/src/routes/jis-color-map/+page.svelte`（更新）
- **完了条件**: `/jis-color-map` トップページに「一覧で覚える」セクションとリンクカードが表示される。7色の模様が正しく表示される。`FamilyCard` グリッドの表示が変わっていない。型チェックが通る
- **依存タスク**: T3-2

---

## Phase 6: 品質チェックと受け入れ条件の確認

### T6-1: 静的解析（型チェック・リント・フォーマット）

- [ ] `npm run check` を実行し、型エラーが0件であることを確認
- [ ] `npm run lint` を実行し、リントエラーが0件であることを確認
- [ ] `npm run format` を実行してコードを整形
- **完了条件**: すべてのコマンドが正常終了する（受け入れ条件16の確認）

### T6-2: 動作確認（受け入れ条件 1〜15 の網羅検証）

- [ ] `npm run dev` で開発サーバーを起動
- [ ] 受け入れ条件 1: `/jis-color-map/all` にアクセスするとページが表示される
- [ ] 受け入れ条件 2: ページの `<title>` が「慣用色名 全一覧 — PCCS Lens」になっている
- [ ] 受け入れ条件 3: パンくずリスト（慣用色名マップ > 全一覧）が表示される
- [ ] 受け入れ条件 4: 全慣用色のアイコンがマンセル色相順（起点2RP）で並んでいる（先頭が赤系、末尾が無彩色であることを目視確認）
- [ ] 受け入れ条件 5: 各アイコンがその慣用色の HEX 色で塗りつぶされている
- [ ] 受け入れ条件 6: アイコンをクリックすると該当する慣用色名見出しにスムーズにスクロールする（アンカー遷移が機能する）
- [ ] 受け入れ条件 7: アイコン群の下に慣用色名詳細セクションがマンセル色相順で並んでいる
- [ ] 受け入れ条件 8: 各エントリに「アイコン・色スウォッチ・慣用色名（`id` 属性付き）・読み・PCCS近似値・由来説明・系統色名・マンセル値・比較ページへのリンク」が表示される
- [ ] 受け入れ条件 9: `originDescription` にスペースを含む色の由来説明が、空白の位置で改行されて表示される
- [ ] 受け入れ条件 10: `examLevel` が `2` または `3` の色に級タグが表示され、`null` の色には非表示（スペーサー）になっている
- [ ] 受け入れ条件 11: 「比較ページへのリンク」をクリックすると対応する `/jis-color-map/[family.id]/` に遷移する
- [ ] 受け入れ条件 12: `/jis-color-map` に「一覧で覚える」セクションとリンクカードが追加されている
- [ ] 受け入れ条件 13: リンクカードのタイトルが「慣用色名 全一覧」、説明文が「由来やPCCS近似値など、色の詳細を学ぼう」で表示される
- [ ] 受け入れ条件 14: リンクカードの `.card-checker` が全7系統からランダムに1色ずつ選んだ7色の模様で表示される
- [ ] 受け入れ条件 15: デスクトップ幅で詳細セクションのレイアウトが横並びになり、640px 以下の幅で縦並びになる
- [ ] 既存ページの退行確認: `/jis-color-map/[family]`（例: `/jis-color-map/red`）の表示が正常であり、級タグの見た目・挙動が変わっていない（T2-2 の退行チェック）

### T6-3: ドキュメント更新

- [ ] `docs/repository-structure.md` に今回追加したファイル・ディレクトリを反映する
  - 新規: `lib/jis-color-map/sort.ts`、`lib/components/jis-color-map/JisExamLevelBadge.svelte`、`lib/components/jis-color-map/JisColorDetailSection.svelte`、`lib/components/jis-color-map/JisColorAllListCard.svelte`、`routes/jis-color-map/all/`
- **完了条件**: `repository-structure` スキルを使って更新済みであること、または更新内容が `docs/repository-structure.md` に反映されていること

---

## 変更ファイル一覧

### 新規作成

| ファイルパス | 種別 |
|---|---|
| `app/src/lib/jis-color-map/sort.ts` | TSモジュール（並び順ロジック） |
| `app/src/lib/jis-color-map/sort.spec.ts` | テストファイル |
| `app/src/lib/components/jis-color-map/JisExamLevelBadge.svelte` | Svelteコンポーネント（級タグ） |
| `app/src/lib/components/jis-color-map/JisColorDetailSection.svelte` | Svelteコンポーネント（慣用色名詳細セクション） |
| `app/src/lib/components/jis-color-map/JisColorAllListCard.svelte` | Svelteコンポーネント（全一覧リンクカード） |
| `app/src/routes/jis-color-map/all/+page.ts` | SvelteKitルート |
| `app/src/routes/jis-color-map/all/+page.svelte` | SvelteKitルート |

### 更新

| ファイルパス | 変更内容 |
|---|---|
| `app/src/lib/data/jis-colors.ts` | `getSortedAllJisColors()` 関数を追加 |
| `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte` | 級タグのインライン実装を `JisExamLevelBadge` 使用に置き換え |
| `app/src/routes/jis-color-map/+page.svelte` | 「一覧で覚える」セクションと `JisColorAllListCard` を追加 |
| `docs/repository-structure.md` | 新規ファイルの追加を反映 |

### 変更しない

- `app/src/lib/components/jis-color-map/FamilyCard.svelte`
- `app/src/lib/color/munsell.ts`
- `app/src/lib/jis-color-map/family-checker.ts`
- `app/src/lib/jis-color-map/family-copy.ts`
- `app/src/routes/jis-color-map/[family]/+page.svelte`
- `app/src/routes/jis-color-map/[family]/+page.ts`

---

## 進捗メモ

- Phase 1 完了後に `npm run check` を実行し、型エラーを早期検知する
- Phase 3 のコンポーネントは、本番ページを作る前に `+page.svelte` に仮配置して見た目を目視確認するとスムーズ
- T2-2 完了後は必ず既存の `/jis-color-map/[family]` ページで退行確認を行う
- Phase 6 の動作確認は `npm run dev` で起動後、複数ブラウザ幅（デスクトップ・モバイル）で行う
