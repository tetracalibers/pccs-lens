# 設計：F1 初回実装（要件1〜2）

## 実装アプローチ

ロジック層（純粋関数）とUI層（Svelteコンポーネント）を分離して実装する。

## 新規作成ファイル

### ロジック層（`app/src/lib/color/`）

#### `convert.ts`

HEXコードをCIE L\*a\*b\*に変換する関数群。

```
hexToLab(hex: string): Lab
  ├── hexToRgb(hex): { r, g, b }  // 0-255
  ├── rgbToLinear(rgb): { r, g, b }  // ガンマ補正除去（sRGB→線形RGB）
  ├── linearToXyz(rgb): { x, y, z }  // D65光源基準のCIE XYZ
  └── xyzToLab(xyz): { L, a, b }  // CIE L*a*b*
```

#### `ciede2000.ts`

CIEDE2000（ΔE₀₀）を計算する関数。CIE 142-2001仕様に基づく内部実装。

```
deltaE2000(lab1: Lab, lab2: Lab): number
```

型定義：
```typescript
type Lab = { L: number; a: number; b: number };
```

#### `approximate.ts`

PCCS近似（最近傍探索）を行う関数。

```
findClosestPccs(
  inputHex: string,
  colors: PCCSColor[],
  topN: number
): Array<{ color: PCCSColor; deltaE: number }>
```

### 型定義（`app/src/lib/data/types.ts`）

```typescript
export type AchromaticBucket = 'W' | 'ltGy' | 'mGy' | 'dkGy' | 'Bk';

export type PCCSColor = {
  notation: string;
  hex: string;
  toneSymbol: string | null;
  hueNumber: number | null;
  isNeutral: boolean;
  achromaticBucket: AchromaticBucket | null;
};

export type JISColor = {
  name: string;
  reading: string;
  hex: string;
  examLevel: 2 | 3 | null;
};

export type ApproximateResult = {
  color: PCCSColor;
  deltaE: number;
};
```

### UIコンポーネント（`app/src/lib/components/`）

#### `ColorPicker.svelte`

カラーピッカー＋HEX入力欄の複合コンポーネント。

Props:
```typescript
let { value = $bindable('#EE0026') }: { value: string } = $props();
```

- `<input type="color">` とHEXテキスト入力欄を並列表示
- 両者を同期させる（どちらを操作しても `value` が更新される）
- HEX入力のバリデーション：`/^#[0-9A-Fa-f]{6}$/` に合致しない場合はエラーメッセージを表示し、`value` は更新しない

### ページ（`app/src/routes/approximate/+page.svelte`）

- `ColorPicker` コンポーネントを配置
- `value` の変化を `$effect` で監視し、`findClosestPccs` を呼び出す
- 結果を8件のカードとして表示する

#### 結果カードの表示内容

| 要素 | 内容 |
|---|---|
| 色スウォッチ | `background-color: [hex]` のボックス |
| PCCS表記 | `notation`（例：`v2`） |

### 共通レイアウト（`app/src/routes/+layout.svelte`）

ナビゲーションバーを追加する。

- ブランド名「PCCS Lens」
- ナビリンク：「近似」（`/approximate`）、「配色分析」（`/analyze`）

## ユニットテスト

各ロジックファイルと同ディレクトリに `.spec.ts` を配置。

| テストファイル | 主なテストケース |
|---|---|
| `convert.spec.ts` | 既知HEX値のLab変換結果検証 |
| `ciede2000.spec.ts` | 同一色はΔE₀₀=0、既知テストベクタ検証 |
| `approximate.spec.ts` | 最近傍が正しい順序で返されること |

## 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `app/src/routes/+layout.svelte` | ナビゲーションバーを追加 |
| `app/src/routes/+page.svelte` | トップページを整理（/approximate へ誘導） |

## 影響範囲

- 新規ファイルの追加のみ（既存ロジックへの変更なし）
- `+layout.svelte`・`+page.svelte` の軽微な変更
