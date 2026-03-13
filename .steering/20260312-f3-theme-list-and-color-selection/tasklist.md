# タスクリスト：F3 イメージ別配色シミュレータ（機能1〜4）

## ステータス凡例
- `[ ]` 未着手
- `[x]` 完了

---

## フェーズ1：ロジック層

- [x] **1-1** `src/lib/patterns/types.ts` を作成する
- [x] **1-2** `src/lib/patterns/themes.ts` を作成する
- [x] **1-3** `src/lib/patterns/suggest.ts` を作成する
- [x] **1-4** `src/lib/patterns/lookup.ts` を作成する
- [x] **1-5** `src/lib/patterns/suggest.spec.ts` を作成する（24テスト全通過）

---

## フェーズ2：UIコンポーネント

- [x] **2-1** `src/lib/components/patterns/HueSelector.svelte` を作成する
- [x] **2-2** `src/lib/components/patterns/ToneSelector.svelte` を作成する
- [x] **2-3** `src/lib/components/patterns/ThemeColorSchemePreview.svelte` を作成する
- [x] **2-4** `src/lib/components/patterns/ThemeColorPicker.svelte` を作成する（設計時に追加）

---

## フェーズ3：ルート

- [x] **3-1** `src/routes/patterns/+page.svelte` を作成する
- [x] **3-2** `src/routes/patterns/[theme]/+page.ts` を作成する
- [x] **3-3** `src/routes/patterns/[theme]/+page.svelte` を作成する

---

## フェーズ4：既存ファイルの変更

- [x] **4-1** `src/routes/+layout.svelte` を更新する（ナビに「配色シミュレータ」追加）

---

## フェーズ5：品質チェック

- [x] **5-1** `npm run check` — 0 errors, 1 warning（意図的な初期値キャプチャのため許容）
- [x] **5-2** `npm run lint` — 通過
