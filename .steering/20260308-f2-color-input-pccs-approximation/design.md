# 設計：F2 セクション1 - カラーコード入力とPCCS近似色の編集（機能1・3）

## 実装アプローチ

### 新規作成ファイル

- `app/src/routes/analyze/+page.svelte` — F2ページ本体
- `app/src/lib/components/ColorEntryItem.svelte` — 1色分の入力・近似色・代替候補をまとめるコンポーネント

### 変更ファイル

なし（既存コンポーネント・関数を再利用のみ）

---

## データ構造

### ColorEntry（ページレベルの状態）

`functional-design.md` のモデル定義に準拠。

```typescript
type ColorEntry = {
  id: string                        // crypto.randomUUID()
  inputHex: string                  // ユーザー入力色
  approximatedPCCS: PCCSColor       // CIEDE2000 1位（不変）
  alternatePCCS: [PCCSColor, PCCSColor]  // CIEDE2000 2〜3位
  selectedPCCS: PCCSColor           // 代替候補選択後の値（初期値 = approximatedPCCS）
}
```

> 今回は `displayedPCCS`（セクション4調整後）は未使用。`selectedPCCS` が最終表示値となる。

---

## コンポーネント設計

### `app/src/routes/analyze/+page.svelte`

**状態**

```typescript
let entries: ColorEntry[] = $state(initialEntries())  // 初期2色
```

**関数**

| 関数 | 処理 |
|---|---|
| `initialEntries()` | 2件の ColorEntry をランダムHEXで生成して返す |
| `randomHex()` | `#RRGGBB` 形式のランダムHEXを生成 |
| `makeEntry(hex)` | `findClosestPccs` で上位3件を取得し ColorEntry を生成 |
| `addEntry()` | entries に1件追加（上限6色） |
| `removeEntry(id)` | 指定IDのエントリを削除（下限2色） |
| `onHexChange(id, hex)` | 入力色変更時に近似色・代替候補を再計算 |
| `onSelectAlternate(id, alternate)` | 代替候補を近似色に昇格し、旧近似色を代替候補プールに戻してΔE₀₀昇順に並べ直す |

**テンプレート構造**

```
<main>
  <h1>配色の分析と調整</h1>
  <section class="approximation-section">
    <h2>カラーコード入力とPCCS近似色</h2>
    <ul class="entry-list">
      {#each entries as entry (entry.id)}
        <ColorEntryItem
          bind:inputHex={entry.inputHex}
          selectedPCCS={entry.selectedPCCS}
          alternatePCCS={entry.alternatePCCS}
          showRemove={entries.length > 2}
          onHexChange={(hex) => onHexChange(entry.id, hex)}
          onSelectAlternate={(alt) => onSelectAlternate(entry.id, alt)}
          onRemove={() => removeEntry(entry.id)}
        />
      {/each}
    </ul>
    {#if entries.length < 6}
      <button onclick={addEntry}>＋ 色を追加</button>
    {/if}
  </section>
</main>
```

---

### `app/src/lib/components/ColorEntryItem.svelte`

**props**

```typescript
let {
  inputHex = $bindable(),
  selectedPCCS,
  alternatePCCS,
  showRemove,
  onHexChange,
  onSelectAlternate,
  onRemove,
}: {
  inputHex: string
  selectedPCCS: PCCSColor
  alternatePCCS: [PCCSColor, PCCSColor]
  showRemove: boolean
  onHexChange: (hex: string) => void
  onSelectAlternate: (alternate: PCCSColor) => void
  onRemove: () => void
} = $props()
```

**テンプレート構造**

```
<li class="color-entry">
  <div class="input-row">
    <ColorPicker bind:value={inputHex} oninput={onHexChange} />
    {#if showRemove}
      <button onclick={onRemove}>×</button>
    {/if}
  </div>
  <div class="approx-row">
    <!-- 近似色 -->
    <div class="approx-badge">
      <span class="swatch" style="background-color: {selectedPCCS.hex}" />
      <span class="notation">{selectedPCCS.notation}</span>
      <span class="label">近似</span>
    </div>
    <!-- 代替候補 -->
    <div class="alternates">
      {#each alternatePCCS as alt}
        <button class="alt-swatch" onclick={() => onSelectAlternate(alt)}
          style="background-color: {alt.hex}" title={alt.notation}
          aria-label="{alt.notation} に変更"
        />
      {/each}
    </div>
  </div>
</li>
```

---

## 代替候補昇格ロジック

```
onSelectAlternate(id, alternate):
  entry = entries.find(id)
  oldSelected = entry.selectedPCCS
  newAlternates = [oldSelected, ...entry.alternatePCCS.filter(a => a !== alternate)]
  newAlternates = newAlternates
    .map(c => ({ color: c, deltaE: deltaE2000(hexToLab(entry.inputHex), hexToLab(c.hex)) }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, 2)
    .map(r => r.color)
  entry.selectedPCCS = alternate
  entry.alternatePCCS = newAlternates
```

---

## 影響範囲の分析

| 対象 | 変更の有無 | 理由 |
|---|---|---|
| `approximate/+page.svelte` | なし | 独立したページ |
| `lib/color/approximate.ts` | なし | 既存関数を再利用 |
| `lib/components/ColorPicker.svelte` | なし | そのまま利用 |
| `lib/data/types.ts` | なし | 既存型を利用（ColorEntryはページローカルで定義） |
| `+layout.svelte` | なし | `/analyze` リンクは既に存在 |
