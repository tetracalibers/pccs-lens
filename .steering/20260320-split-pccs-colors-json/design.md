# 設計: PCCS Colors JSON 分割

## 分割ファイル構成

| ファイル | 抽出条件 | 件数 |
|---|---|---|
| `pccs_v24.json` | `!isNeutral && toneSymbol === 'v'` | 24件 |
| `pccs_s12.json` | `!isNeutral && toneSymbol === 's' && hueNumber % 2 === 0` | 12件 |
| `pccs_even12.json` | `!isNeutral && toneSymbol !== 'v' && toneSymbol !== 's' && hueNumber % 2 === 0` | 120件 |
| `pccs_odd12.json` | `!isNeutral && toneSymbol !== 'v' && hueNumber % 2 === 1` | 132件 |
| `pccs_neutral.json` | `isNeutral === true` | 17件 |

合計: 305件

## 消費パターンの対応

| 消費元 | 旧データ | 新データ |
|---|---|---|
| `lookup.ts` | `pccs_colors_full.json` (305件) | 5ファイル結合 |
| `ToneAreaDiagram.svelte` | `pccs_colors_full.json` (305件) | 5ファイル結合 |
| `ToneImageDiagram.svelte` | `pccs_colors_full.json` (305件) | 5ファイル結合 |
| `approximate/+page.svelte` | `pccs_colors.json` (161件) | v24+other12+neutral |
| `analyze/+page.svelte` | `pccs_colors.json` (161件) | v24+other12+neutral |

## 削除ファイル

- `app/src/lib/data/pccs_colors.json`
- `app/src/lib/data/pccs_colors_full.json`
- `data/pccs_colors.csv`
- `data/pccs_colors_full.csv`
- `scripts/convert-csv-to-json.mjs`（git管理上すでに削除済み）
- `app/package.json` の `"convert"` スクリプト
