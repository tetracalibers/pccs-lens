# タスクリスト: JIS慣用色へのPCCS近似値追加

## 実装タスク

### 1. 型定義の更新

- [ ] `app/src/lib/data/types.ts` の `JISColor` に `approximatePccs` フィールドを追加
  - タプル型で最低1件を型レベルで保証
  - 完了条件: 型定義がコンパイル可能

### 2. 事前計算スクリプトの新規作成

- [ ] `app/scripts/` ディレクトリを作成
- [ ] `app/scripts/add-pccs-approximations.mjs` を新規作成
  - 5つの PCCS JSON を結合して候補セットを構築（v24 / s12 / even12 / odd12 / neutral）
  - `jis_colors.json` を `fs/promises` で読み込み
  - 各エントリに対し `chroma.deltaE` で全PCCS色との色差を計算
  - 採用ロジック:
    - 1位は無条件で採用
    - 2位・3位は `ΔE ≤ 10` かつ `ΔE ≤ 1位ΔE × 1.5` を両方満たす間だけ追加
  - `deltaE` は小数点2桁に丸める
  - 結果を `jis_colors.json` へ上書き保存（整形なし、素の `JSON.stringify`）
  - 完了条件: `node scripts/add-pccs-approximations.mjs` がエラーなく完走する

### 3. npm script の追加

- [ ] `app/package.json` の `scripts` に以下を追加:
  ```
  "data:pccs-approx": "node scripts/add-pccs-approximations.mjs && prettier --write src/lib/data/jis_colors.json"
  ```
  - 完了条件: `npm run data:pccs-approx` で整形済みのJSONが書き出される

### 4. スクリプト実行とデータ生成

- [ ] `cd app && npm run data:pccs-approx` を実行
- [ ] `jis_colors.json` の差分を確認
  - 完了条件: 全130エントリに `approximatePccs` が追加され、全て配列長 1 以上

### 5. 生成物の妥当性確認

- [ ] 空配列が1件も存在しないことを確認（`approximatePccs": \[\]` が0件）
- [ ] サンプル目視確認:
  - 「桜色」(#fdeeef, 10RP 9/2.5) → `p24` / `p23` 近辺が1位に来ることを期待
  - 「朱色」(#e94709, 6R 5.5/14) → `v6` / `v5` 近辺が1位に来ることを期待
  - 「ランプブラック」(#24130d, N1) → `Bk` 相当の無彩色が1位に来ることを期待
- [ ] 1位のΔEが大きい（例: ΔE > 10）エントリをリストアップし、妥当性を目視確認
  - 完了条件: 明らかに不自然な近似結果がないこと

### 6. 品質チェック

- [ ] `cd app && npm run check`（型チェック）が通ること
- [ ] `cd app && npm run lint`（ESLint）が通ること
- [ ] `cd app && npm run format`（prettier）で差分が出ないこと
- [ ] `cd app && npm run test`（vitest）が通ること
  - 完了条件: 全チェックが成功

### 7. ドキュメント更新（必要な場合のみ）

- [ ] `docs/` 配下のドキュメント（特に `architecture.md` / `repository-structure.md`）と実装の整合性を確認
  - `scripts/` ディレクトリが新設されたため、`repository-structure.md` に記載追加が必要か判断
  - `JISColor` 型の更新に伴って `color-analysis-rules.md` への追記が必要か判断
  - 完了条件: 必要な更新があれば反映する

## 全体の完了条件

- 全タスクがチェック済み
- `jis_colors.json` に全130エントリ分の `approximatePccs` が記録され、空配列がない
- `npm run check` / `lint` / `test` が全て成功
