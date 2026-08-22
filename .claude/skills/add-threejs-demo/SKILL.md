---
name: add-threejs-demo
description: 引数で受け取った記事に、素のThree.jsで実装したデモを掲載するスキル。CG記事（`app/src/routes/cg/**`）ではデモとあわせて「そのデモで実際に動いているコード」も掲載し、色彩記事（`color-theory`・`color-fields`）ではデモだけを置いてThree.jsのコードは載せない。記事に `:::Todo` があればデモ案を提案せずその内容で実装し（懸念やより良い案があるときだけ代替案を示す）、`:::Todo` が無ければ記事を解析してデモ案を表で提案し、採否と挿入位置の合意を得てから1案ずつ実装して記事へ差し込む（import・デモ直前の `:::Action`・コンポーネント使用箇所・CG記事のみ掲載コードのtsコードブロック・フロントマターの `visual` フラグ）。掲載コードは実際に動いている `scene.ts` から作る（読者が書き下せる形に整えてよく、逐語一致は求めない）。記事にThree.jsのデモを載せたい・追加したい場合に使用する。
---

# 記事へのThree.jsデモ掲載スキル

記事に、**素の Three.js で実装したデモ**を掲載する。CG記事では、あわせて**そのデモで実際に動いているコード**も載せる。

デモの狙いは 2 つある。

- **内容の理解を助ける** — 静的な図解では伝わりにくい空間・変換・投影などを、操作しながら確かめられるようにする
- **応用例を示し、読者の創作への橋渡しになる** — 記事の理論が実際のコードでどう書かれるかを見せる

後者のため、デモとあわせて**そのデモで実際に動いているコード**を記事に載せる。**掲載コードが「一度も実行されていないコード」になることを避けるのが、このスキルで最も重視する点。**

**2 つ目の狙いとコードの掲載は CG記事に限る。** 色彩記事（`color-theory`・`color-fields`）では 1 つ目の狙いだけを取り、Three.js のコードは記事に載せない（→「色彩記事のとき」）。

仕様は `spec/add-threejs-demo.md` に固めてある。判断に迷ったらそちらを参照する。

## 適用範囲

- CG記事（`app/src/routes/cg/**/+page.svx`）に Three.js のデモを載せるとき
- 色彩記事（`app/src/routes/color-theory/*/+page.svx`・`app/src/routes/color-fields/*/+page.svx`）に Three.js のデモを載せるとき（→「色彩記事のとき」）
- `app/src/lib/demo/threejs/` 配下に Three.js のデモを新規作成・編集するとき

対象外:

- **既存の Threlte 製 3D デモ**（`PCCSColorSolid3D.svelte`・`MunsellColorSolid3D.svelte`）— Threlte 実装のまま据え置く。**素の Three.js へ移植しない。** 一方で、**新規の 3D デモは色彩記事でも素の Three.js（このスキル）で作る。** 同じ記事に Threlte 製と Three.js 製が並んでよい
- **静的な SVG 図解** — `svg-diagram-component` の担当
- **記事本文の執筆** — `author-style-writer` の担当（→「本文には手を入れない」）

## 引数

```
/add-threejs-demo <記事slug> [<デモの内容>]
```

- **`<記事slug>`（必須）** — 記事の slug（例: `basic-transformations`・`pccs-color-system`）
- **`<デモの内容>`（省略可）** — 作りたいデモの内容。指定の有無で動作パターンが分かれる

### 記事slugの解決

CG記事の実体は `cg/<ユニット>/<記事slug>` で、slug 単体ではパスが確定しない。色彩記事は `color-theory/<記事slug>`・`color-fields/<記事slug>` の 1 階層。**どちらで見つかったかで、デモの置き場所とコードを載せるかどうかが変わる**ので、両方を検索して実体を解決する。

```bash
find app/src/routes/cg -maxdepth 2 -type d -name "<記事slug>"
find app/src/routes/color-theory app/src/routes/color-fields -maxdepth 1 -type d -name "<記事slug>"
```

- **0 件・複数ヒットの場合は、確認して止める。** 推測でどれかに決めない（CG記事と色彩記事の両方に当たった場合も同じ）
- slug が重複する場合は、ユニット込みで `transformation/basic-transformations` のように渡してもらう
- **`draft: true` の記事も対象とする**（このスキルは執筆直後に呼ばれる想定）
- `cg/` 配下で見つかったら、このまま以降の節に従う。`color-theory/`・`color-fields/` 配下で見つかったら、あわせて「色彩記事のとき」の差分を適用する

### 動作パターン

`<デモの内容>` の有無と、記事に `:::Todo` が残っているかで分かれる。

- **パターンA-1（`<デモの内容>` なし ＋ 記事に `:::Todo` あり）** — **デモ案を提案せず、`:::Todo` の内容をデモの内容として実装する**（→「パターンA-1」）
- **パターンA-2（`<デモの内容>` なし ＋ `:::Todo` なし）** — 記事を解析してデモ案を提案し、ユーザーの採否を待ってから実装する（→「パターンA-2」）
- **パターンB（`<デモの内容>` あり）** — 提案フェーズを飛ばし、指定された内容のデモを実装する。**`:::Todo` があっても引数の指定が優先**（引数に対応する `:::Todo` が本文にあれば、その位置に差し込んでブロックを置き換える）

A-1 と A-2 の分岐は、記事を読む前にこれで判定する。

```bash
grep -n ':::Todo' <対象記事の +page.svx>
```

## 色彩記事のとき（`color-theory`・`color-fields`）

対象が色彩記事だったときは、以降の節に次の差分を当てる。ここに挙げていない節（`:::Action` の書き方・`<デモ名>Demo.svelte` の書き方・`_shared` の API・見た目・Tweakpane・アニメーション・品質チェック）は CG記事と同じ。

### 記事に Three.js のコードを載せない

**色彩記事にはデモだけを置き、コードブロックを付けない。**「記事への反映」の手順 3 を丸ごと省き、「掲載コードの規約」は適用しない。

- 色彩記事の読者に持ち帰ってもらうのは色の理論であって Three.js の書き方ではない。コードを載せる狙い（応用例を示す）を取らない
- したがって**デモの狙いは「内容の理解を助ける」の 1 点**。3 次元・連続量・視点移動が効く題材（色立体、色空間、分光分布の立体表示など）に絞る
- コードを載せない代わりに、**デモの作りをコードの見せやすさで妥協しなくてよい**（→「`scene.ts` の書き方の差分」）

### 置き場所

```
app/src/lib/demo/threejs/color/<デモ名>/
  scene.ts
  <デモ名>Demo.svelte
```

- **`color-theory`・`color-fields` で分けず、記事slugも挟まない。** 色彩記事のルートは 1 階層で slug 衝突の心配が薄く、デモは記事よりも題材（色立体・スペクトルなど）に紐づいて複数の記事から使われうる。既存の SVG 図解も `lib/demo/color/<題材>/` と題材で分かれている
- **`<デモ名>` は記事slugではなく、デモの内容から決める。** kebab-case（例: `pccs-color-solid`・`spectral-distribution`）
- コンポーネントは `<デモ名>Demo.svelte`、公開関数は `create<デモ名>Scene`（CG記事と同じ）。**頭字語は既存の色彩デモに合わせて大文字のままにする**（`pccs-color-solid` → `PCCSColorSolidDemo.svelte`・`createPCCSColorSolidScene`）
- 記事からの import は `$lib/demo/threejs/color/<デモ名>/<デモ名>Demo.svelte`

### `scene.ts` の書き方の差分

記事に載らないので、掲載を前提にした次の制約を外す。

- **`_shared` の型を import してよい** — 同じ形の型をローカルに宣言し直さない（あの重複は、掲載コードが `three` だけで動くようにするためのもの）

  ```ts
  import type { ThreeSceneContext } from "$lib/demo/threejs/_shared/types"

  export type PCCSColorSolidParams = { tone: string }

  export const createPCCSColorSolidScene = ({ scene, params }: ThreeSceneContext<PCCSColorSolidParams>) => {
    // ...
  }
  ```

- **色データ・色計算のモジュールを import してよい** — `$lib/data/pccs`（`PCCS_ALL`）・`$lib/data/munsell-hue`・`$lib/color/**`・`chroma-js`。**色の値を `scene.ts` に手で書き写さない。** 既存デモと同じ出典から取る
- **「記事に載せやすい単位」で設計する責任はない** — ヘルパー関数への分割や行数は、デモの正確さと読みやすさだけで決めてよい

変わらないもの:

- 公開 API は `create<デモ名>Scene` の 1 関数、`params` は `update()` の中で読む、経過時間依存のアニメーションを書かない
- **サイトの配色モード（CSS 変数）を読まない。** 背景がライト／ダーク共通の固定色なので、シーン側もモードで分岐させない

### 色を歪めないための約束

色そのものが記事の主題になるため、レンダリングで色が変わる要因を持ち込まない。

- **色票・スペクトルなど「その色を見せる」対象は `MeshBasicMaterial`** にする。`MeshStandardMaterial` ＋ ライトでは陰影で明度・彩度が変わり、指定した色として読めなくなる（既存の `PCCSColorSolid3D` も `MeshBasicMaterial`）
- **トーンマッピングは既定の `NoToneMapping` のまま。** 素の `WebGLRenderer` の既定なので何も書かなくてよい（Threlte の `<Canvas>` は AgX が既定で高彩度の色が褪せる。素の Three.js ではこれが起きない）
- **立体感のためにライトを使うのは、色の見えを読み取らせないデモに限る。** 使った場合は完了報告に書く
- **背景色は無彩色に保つ。** 背景の明度は図の色の見えを変える（明度対比）。既定の `DEMO_BACKGROUND`（暗めのニュートラルグレー）から変えるときも、無彩色で、かつライト／ダーク共通の固定色にする（`background` prop）

### デモ案の提案（パターンA-2）の差分

表から**「視点」と「記事に載るコード」の 2 列を落とす**。残る列は `#` / 何を見せるか / 操作 / 挿入位置 / この案の弱み。守ること（件数は記事次第・上限 5 案・弱み必須・挿入位置込み）は同じ。

- **「この記事に 3D デモは向かない」と申告して止まる判断は、CG記事より多くなる。** 色彩記事は 2 次元の図解で足りる題材が多い。平面の図で読み取れるものにデモを作らない（`svg-diagram-component` の担当）

### `:::Todo` の実装（パターンA-1）の差分

流れは同じだが、**`:::Todo` の内容が平面の図で読み取れるもので、「静的な2次元の図で足りる」と判断する場面が CG記事より多くなる。** そのときも打ち切らず、判断を伝えたうえで**3D・操作にするなら何を見せられるか**（色立体として回して見る、トーンや色相を動かして連続的に変える、など）を代替案として示し、指示を待つ（→「懸念・代替案があるとき」）。

### 記事への反映の差分

手順 3（`:::Foldable` のコードブロック）を省く。残りは同じ。

1. import（`CanvasWrapper` と `<デモ名>Demo`）
2. 合意した挿入位置に `:::Action` ＋ `<CanvasWrapper>`
3. ~~掲載コード~~ — **書かない**
4. フロントマターに `visual: true`（色彩記事のフロントマターは `group` ではなく `grades` を持つが、足すのは `visual: true` だけ）
5. `:::Action` 以外の説明文は書かない

### 完了報告の差分

「記事に載せたコード」の項目を落とす。かわりに次を書く。

- **色データの出典**（`$lib/data/pccs` など。手で書いた色があればその値と根拠）
- **色を歪めない設定として何を選んだか**（マテリアル・ライトの有無・背景色を変えた場合はその値）

## パターンA-1：`:::Todo` の実装

記事に `:::Todo` が残っているときは、**デモ案を提案しない。** `:::Todo` の本文がデモの内容の指定なので、それを `<デモの内容>` として読み、パターンB と同じ流れで実装する。

- **`:::Todo` の本文をそのまま指定として読む。** 「図の名前」だけの短いものと、描き方の補足が続くものがある（→ `writing-guides/syntax-guide.md` ルール4）。書かれていない部分は実装側の裁量で埋める
- **挿入位置を改めて合意しない。** `:::Todo` が置かれている位置がそのまま挿入位置になる
- **`:::Todo` ブロックは丸ごと置き換える** — 開始行から閉じの `:::` までを、`:::Action` ＋ `<CanvasWrapper>`（CG記事はさらに掲載コード）に差し替え、`TODO` の文字列を記事に残さない（→「記事への反映」）
- **材料にするのは `:::Todo` だけ。** `:::Add` / `:::Delete` / `:::Fix` / `:::Pending` は新規デモの依頼ではないので拾わない（→「パターンA-2」の「守ること」）
- **静的な2次元の図で足りると判断したときは、`svg-diagram-component` へ回して終わりにしない。** その旨を伝えたうえで、**3D・操作にするなら何をどう見せられるかを代替案として示し、指示を待つ**（→「懸念・代替案があるとき」）。勝手にデモ化もせず、静的な図と決めつけて打ち切りもしない
- **デモとして実装する `:::Todo` が 1 つで、懸念も無ければ、確認を取らずそのまま実装に入る**
- **`:::Todo` が複数あるときは、本文の出現順に 1 つずつ実装する**（→「実装の粒度」）。最初の 1 本に着手する前に、拾った `:::Todo` の本文・このスキルで実装するか（静的な図で足りると判断したものは代替案つきで）・実装順だけを短く一覧で示す。**デモ案の表は作らない**

### 懸念・代替案があるとき

`:::Todo` 通りに実装することへの懸念や、より良い見せ方があるときは、**実装に着手する前に**「`:::Todo` 通りの案」と「代替案」を並べて示し、どちらで進めるかの指示を待つ。

懸念になるもの（例）:

- **静的な2次元の図で足りる** — 平面の図のほうが正確に読める題材。この場合の対比は「静的な図で足りるという判断（＝`svg-diagram-component` の担当）」と「**3D・操作にするなら何を見せられるか**」の 2 案にする。3D にしたときに何が増えるか（回して見える奥行き、動かして変わる量）を具体的に書き、静的な図を選ぶ判断材料にする
- **操作が記事の主題から外れる** — `:::Todo` が求める操作を足すと、主題でないパラメータが前に出る（→「Tweakpane」）
- **1 つのデモに要素を詰め込みすぎている** — 分けたほうが各々を読み取りやすい（デモ2本に割る代替案）
- **色の見えが歪む作りになる** — 色彩記事で、陰影やライティングが指定した色を変えてしまう（→「色を歪めないための約束」）
- **掲載コードが主題から離れる** — CG記事で、その絵を出すのに記事の主題と関係ないコードが大半を占める（→「掲載コードの規約」）

守ること:

- **代替案は懸念があるときだけ出す。** 無ければ黙って `:::Todo` 通りに実装する。提案フェーズを取り戻すために代替案をひねり出さない
- **示すのは「`:::Todo` 通り」と代替案の対比だけ。** パターンA-2 の 5 案の表には戻さない
- **懸念の中身（`:::Todo` 通りだと何が読み取れなくなるか）を書く。** 「〜のほうがよいと思います」だけの提示にしない
- **`svg-diagram-component` を案内するだけで止まってよいのは、3D・操作にしても足せるものが本当に無いときだけ。** 「静的な図で足りる」という判断を、3D案を考えずに済ませる理由にしない
- **静的な図で進めると決まったら、`/svg-diagram-component <図の名前>` をそのままコピペできる形で案内し、`:::Todo` は消さずに残す**（デモを実装しないので置き換えるものが無い）
- **`:::Todo` 通りで進めるよう指示されたら、そのまま実装する。** 一度示した懸念を蒸し返さない
- **`:::Todo` の中身が引数で渡された場合（パターンB）も同じ。** 懸念があるなら実装前に代替案を示す（指定の届き方で判断を変えない）

## パターンA-2：デモ案の提案（`:::Todo` が無いとき）

対象記事の `+page.svx` を通読したうえで、会話上に**表**で案を列挙し、**番号で採否をもらう**。

- **`AskUserQuestion` は使わない。** 選択肢が 2〜4 個に固定されるため、案の件数が記事ごとに変わるこの用途に合わない
- ユーザーは `1と3` のように番号で返す（実装順の指定を含むこともある）

表の列は次のとおり。

| 列 | 内容 |
| --- | --- |
| `#` | 案番号 |
| 視点 | 理解 / 応用 |
| 何を見せるか | デモで見えるもの |
| 操作 | Tweakpane で操作するパラメータ（操作なしも可） |
| 記事に載るコード | `scene.ts` から載せる部分の見込み |
| 挿入位置 | どの節の直後に入れるか |
| この案の弱み | 不採用の理由になりうる限界 |

**色彩記事では「視点」「記事に載るコード」の 2 列を落とす**（→「色彩記事のとき」）。

守ること:

- **案は記事の地の文から起こす。** この分岐は `:::Todo` が無いとき（＝プレースホルダという手掛かりが無いとき）のものなので、記事の主題のうち静的な図では確かめにくいもの（空間・変換・投影・連続量）を自分で探す
- **`:::Add` / `:::Delete` / `:::Fix` / `:::Pending` のブロックは案の材料にしない。** `:::Add` は文章の加筆メモ、`:::Delete` は削除予定の記述、`:::Pending` は採否を検討中の文章（いずれも `author-style-writer` の担当）、`:::Fix` は**すでにあるもの**への修正指示で、いずれも新しいデモの依頼ではない。`:::Fix{target="demo"}` は既存デモの修正依頼なので、このスキル（新規デモの掲載）ではなく個別の修正作業として扱う
- **件数は記事次第。** 「1 つの視点に 1 デモ」に縛らない。片方の視点が 0 案でもよい
- **提示は 5 案程度を上限とする**
- **各案に必ず「弱み」を書く。** 自分の案を売り込むだけの提案にしない
- **挿入位置まで案に含める**（採否の合意と同時に挿入位置も合意される）
- **「この記事に Three.js デモは向かない」と申告して止まってよい**（例: 知的財産権・CGの歴史のような、空間や変換を扱わない記事）。無理に案を作らない

## 実装の粒度

**採用された案を 1 つずつ実装して都度報告する。** 複数案が採用されても、一度にまとめて実装しない。**`:::Todo` が複数あるとき（パターンA-1）も同じ**で、出現順に 1 本ずつ実装して都度報告し、次に進んでよいかを確認する。

## ファイル構成

```
app/src/lib/demo/threejs/
  _shared/                              記事に載らない定型処理（既に整備済み。→「_shared の API」）
  <ユニット>/<記事slug>/<デモ名>/
    scene.ts                            記事に載せる本体。three にのみ依存
    <デモ名>Demo.svelte                 薄い殻（ThreeDemoCanvas への配線）
```

- **ディレクトリはユニット込み**（`threejs/transformation/basic-transformations/`）。CG記事は今後大量に増えるため、slug の将来的な衝突を避け、記事の在り処と対応が取れるようにする
- **デモごとにサブディレクトリを作る**（1 デモが 2 ファイル以上になる）
- `<デモ名>` のディレクトリ名は kebab-case、Svelte コンポーネントは `<デモ名>Demo.svelte`（PascalCase）、`scene.ts` の公開関数は `create<デモ名>Scene`

例: `threejs/transformation/basic-transformations/translation-matrix/` に `scene.ts` と `TranslationMatrixDemo.svelte`、公開関数は `createTranslationMatrixScene`。

**色彩記事のデモは `threejs/color/<デモ名>/` に置く**（ユニットも記事slugも挟まない。→「色彩記事のとき」）。

## 責務分担

| | 記事に載るか | 担当 |
| --- | --- | --- |
| `_shared/` | 載らない | renderer 生成・描画ループ・リサイズ・破棄・画面外での停止・OrbitControls・Tweakpane パネルの生成とテーマ・WebGL 非対応／コンテキストロストの案内 |
| `scene.ts` | **載る**（色彩記事では載らない） | その記事固有のシーン構築・行列計算・ジオメトリ生成・パラメータ適用 |
| `<デモ名>Demo.svelte` | 載らない | `ThreeDemoCanvas` への配線（パラメータの初期値と Tweakpane のバインディング） |

**`scene.ts` は `_shared` を import しない。`three` にのみ依存させる。** 記事に載せたコードがそのまま読者の手元で動く条件なので、型の import であっても例外にしない。**色彩記事のデモは `scene.ts` が記事に載らないため、この制約を外す**（→「色彩記事のとき」）。

## `scene.ts` の書き方

```ts
import { BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, Matrix4, PerspectiveCamera, Scene } from "three"

/** Tweakpane で操作するパラメータ */
export type TranslationParams = { tx: number; ty: number }

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）。
// TypeScript は構造的部分型なので、import なしでも ThreeDemoCanvas に渡せる。
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: TranslationParams
}

export const createTranslationScene = ({ scene, params }: SceneContext) => {
  const geometry = new EdgesGeometry(new BoxGeometry(1, 1, 1))
  const material = new LineBasicMaterial({ color: "#e8e8ee" })
  const box = new LineSegments(geometry, material)
  box.matrixAutoUpdate = false
  scene.add(box)

  const translation = new Matrix4()

  return {
    // 描画の直前に毎フレーム呼ばれる。params の現在値をシーンへ反映する
    update: () => {
      box.matrix.copy(translation.makeTranslation(params.tx, params.ty, 0))
    },
    // 自分が作った geometry・material・texture は自分で破棄する
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}
```

規約:

- **公開 API は `export const create<デモ名>Scene = (ctx) => ({ update?, dispose? })` の 1 関数**（パラメータの型は別途 export してよい）
- `params` は `update()` の中で読む。`scene.ts` 側で値を保持しない
- 描画は**操作された直後だけ**走る。`update()` に経過時間依存のアニメーションを書かない（→「アニメーション」）
- `ctx.camera` は位置・fov・near・far が適用済み。**カメラ自体が記事の主題（投影・視錐台など）の場合は `scene.ts` 側で上書きしてよい**（`ThreeDemoCanvas` に `orbit={false}` を渡してカメラ操作を切る）
- `ctx.renderer` は、**そのデモに固有で、かつ必須の renderer 設定**（`localClippingEnabled` など）を `scene.ts` 側で書くために渡している。それが無いと読者の手元で同じ絵にならないため、記事に載るコードに含める。全デモに共通の定型設定は `_shared` の担当
- **`scene.ts` を「記事に載せやすい単位」で設計する責任は実装側にある**（→「掲載コードの規約」）。色彩記事のデモではこの責任を負わない（→「色彩記事のとき」）

## `<デモ名>Demo.svelte` の書き方

```svelte
<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createTranslationScene, type TranslationParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: TranslationParams = { tx: 0, ty: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="平行移動した立方体の3次元表示（ドラッグで回転）"
  createScene={createTranslationScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [3, 2, 4] }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "tx", { min: -2, max: 2, step: 0.01, label: "tx" })
    pane.addBinding(p, "ty", { min: -2, max: 2, step: 0.01, label: "ty" })
  }}
/>
```

- **`params` は `$state` にしない。** Three.js が毎フレーム直接読み、Tweakpane が直接書き換えるので、Svelte のリアクティビティは要らない
- 操作のないデモでは `buildPane` を省略する（パネル自体が作られない）
- `{#if browser}` ガードや canvas のマウントは `ThreeDemoCanvas` の中で済んでいる。**ここで書かない**

## `_shared` の API

`app/src/lib/demo/threejs/_shared/` は整備済みで、**通常は触らない**。デモから使うのは `ThreeDemoCanvas.svelte` だけ。

### `ThreeDemoCanvas.svelte` の props

| prop | 必須 | 既定 | 内容 |
| --- | --- | --- | --- |
| `ariaLabel` | ✓ | — | ラッパに付ける説明（何が描かれ、どう操作するか） |
| `createScene` | ✓ | — | `scene.ts` の `create<デモ名>Scene` |
| `params` | ✓ | — | Tweakpane と `scene.ts` が共有するプレーンオブジェクト |
| `aspectRatio` | | `"1 / 1"` | canvas の `aspect-ratio`。**デモごとに変更可**（変換・投影は横長のほうが見やすいことがある）。**Tweakpane パネルまで含めた見た目が縦長にならない値にする**（→「アスペクト比」） |
| `background` | | `DEMO_BACKGROUND` | 背景色。ライト／ダーク共通の固定色 |
| `camera` | | fov 45 / near 0.1 / far 100 / position `[3, 3, 5]` | `{ fov, near, far, position }` |
| `orbit` | | 減衰つき回転・ズーム有効／パン無効 | `{ target, enablePan, enableZoom, enableRotate, minDistance, maxDistance, minPolarAngle, maxPolarAngle }`、または `false` で OrbitControls を付けない |
| `buildPane` | | なし | `(pane, params) => void`。Tweakpane のバインディングを組み立てる |

### `_shared` が引き受けていること

- renderer の生成（DPR 上限は `min(devicePixelRatio, 2)`）
- **要求されたときだけ描く描画ループ** — `invalidate()` が呼ばれた次のフレームで 1 回描画する。Tweakpane の `change` と OrbitControls の `change` が自動で繋がっているため、デモ側で描画を要求する必要はない
- `ResizeObserver` によるリサイズ（canvas の実寸から `camera.aspect` を更新）
- **画面外でのループ停止**（`IntersectionObserver`）。1 記事に複数デモが並んでも、見えているものだけが描画される
- `dispose`（renderer・OrbitControls・`scene.ts` の `dispose()`）
- **WebGL 非対応・コンテキストロスト時のメッセージ表示**（どういう環境なら動くかを明記した文面が `constants.ts` にある）
- Tweakpane パネルの生成と、サイトのライト／ダークに追従する `--tp-*` テーマ変数

`_shared` を変更する必要が出た場合は、**それが「記事に載らない定型処理」かどうかを判断してから**手を入れる。記事固有のロジックは `scene.ts` に置く。

## 記事への反映

デモ 1 本ごとに、対象記事（`+page.svx`）へ次を行う。

1. `<script>` ブロックにデモコンポーネントの import を追加する（`CanvasWrapper` が未 import であればあわせて追加する）

   ```svelte
   <script>
     import CanvasWrapper from "$lib/demo/CanvasWrapper.svelte"
     import TranslationMatrixDemo from "$lib/demo/threejs/transformation/basic-transformations/translation-matrix/TranslationMatrixDemo.svelte"
   </script>
   ```

2. 合意した挿入位置に `<CanvasWrapper>` で包んで差し込み、**その直前に `:::Action` を置く**（文面は →「`:::Action` の書き方」）。**`:::Todo` を元にした場合（パターンA-1）は、その位置の `:::Todo` ブロック全体（開始行から閉じの `:::` まで）をこの差し込みで置き換える**

   ```svelte
   :::Action{fixme}
   txとtyを動かして、立方体が座標軸に沿ってどう動くかを観察してみよう
   :::

   <CanvasWrapper>
     <TranslationMatrixDemo />
   </CanvasWrapper>
   ```

   `:::Action` とデモの間には空行を 1 行だけ置く。デモの直前に既に `:::Action` があるときは、それを活かして重ねて足さない（内容が今回のデモと合っていなければ書き換える。**書き換えたら `{fixme}` を付ける**）。

3. **その直後に `:::Foldable` で包んだ ` ```ts ` のコードブロック**で掲載コードを置く（**色彩記事ではこの手順を丸ごと省く。** →「色彩記事のとき」）

   ````markdown
   :::Foldable{title="Three.jsによる実装概要"}

   ```ts
   const scene = new Scene()
   ```

   :::
   ````

   タイトルは `Three.jsによる実装概要` 固定。補足（「デモの実装」など）は足さない。既定で折りたたまれた状態になり、読者がタイトル行を押したときだけ開く。中身のコードブロックには shiki のハイライトが掛かる。`Foldable` は `guide-content.svelte` が export しているので、記事側の `import` は不要。

4. フロントマターに `visual: true` が無ければ追加する

   ```yaml
   ---
   layout: guide-content
   title: 基本的な変換
   group: ["CG", "ImgP"]
   visual: true
   ---
   ```

   `lib/meta/guide-pages.ts` が `import.meta.glob` でビルド時にフロントマターを集約し、`lib/components/m-directive/PageLink.svelte` が一覧リンクに `図解` タグを描画する。**追加の登録作業は不要。** 「Web」タグは新設しない（`図解` タグで代替する）

5. **`:::Action` 以外の説明文は書かない**

### `:::Action` の書き方

デモの直前に置く、**操作と着眼点を対にした短い誘導**。読者がパネルを触る前に「何を動かすと、どこに何が起きるか」を掴める文にする。

- **必ず `:::Action{fixme}` と書く。** `{fixme}` は「AIが書いたまま人手が入っていない下書き」の印で、付けると `:::Fix` と同じ琥珀の背景＋`! ACTION：要編集` のラベルで表示され、公開時チェック（`/publish-article` のゲート）で引っかかる。**外すのは著者が文面を直したとき**で、このスキルが外すことはない（→ `writing-guides/syntax-guide.md` ルール4）
- **「どのパラメータを動かすと何が起きるか」「どこに着目すれば記事の主題が読み取れるか」を必ず対で書く。** 「デモで確認してみよう」のように、動かす対象も読み取りの中身も無い文にしない
- **パラメータ名は Tweakpane のラベルと一致させる。** 読者がパネル上で探せることを優先する（`buildPane` の `label` をそのまま使う）
- **操作パラメータの無いデモ**（OrbitControls だけ）は、ドラッグ・ズームで何が見えるかを書く（例: 「ドラッグで回転させて、3 つの軸がどの向きに伸びているかを見てみよう」）
- **着眼点が 2 つ以上あって 1 文に収まらないときは、導入の 1 文＋箇条書きにする**

  ```markdown
  :::Action
  次の点に着目して、デモを観察してみよう

  - 投影面までの距離を変えることで、ビューボリュームの大きさがどう変わるか
  - クリッピング面を動かすことで、ビューボリュームに収まる範囲がどう変わるか
  :::
  ```

- **文体は casual な意志形**（「〜してみよう」「〜に注目しよう」「〜を観察してみよう」「〜を確認しよう」）。本文の丁寧体（です・ます）にしない。`:::Action` の中だけ地の文とレジスターが変わるのがこのサイトの書き方（→ `writing-guides/stylistic-quirks.md`「本文とActionのレジスターの二層構造」）
- **強調ディレクティブ（`:Anki[]`・`:Mark[]`）を自分から書かない。** 既存記事の Action にある `:Mark[]` は著者が付けたもので、AI 側から選ぶものではない（→ `writing-guides/syntax-guide.md`）
- **記事の地の文で既に説明した語で書く。** Action で新しい用語を導入しない
- **文面は下書きの扱い。** そのまま採用されるとは限らないので、完了報告に文面を載せて著者が直せるようにする（記事の側でも `{fixme}` がその印になる）

### 本文には手を入れない

**地の文を 1 文字も変更しない。** このスキルが記事に加えるのは、import・デモ直前の `:::Action`・コンポーネント使用箇所・コードブロック（CG記事のみ）・フロントマターの `visual: true` だけ。

- **デモの説明文や、地の文からデモへの言及は書かない。** いずれも本文であり `author-style-writer` の担当。デモに触れるのは直前の `:::Action` の中だけに閉じる
- **既にある地の文を `:::Action` に合わせて書き換えない。** 合わせるのは Action の側
- Action に収まらなかった「何を操作でき、何が読み取れるか」は完了報告に添える。著者が本文へ言及を書き足すときの材料になる

## 掲載コードの規約

**この節は CG記事にだけ適用する。** 色彩記事では Three.js のコードを記事に載せない（→「色彩記事のとき」）。

- **記事に載せるコードは、実際に動いている `scene.ts` から作る。** 記事用に書き下ろしたり、他の API から翻訳したりしてはならない
- **`scene.ts` と逐語一致させる必要はない。** 記事側は「読者がそのまま書き下せる形」を優先し、デモの都合で入っている構造は外してよい
  - 関数の殻を外し、中身をトップレベルのコードとして並べる
  - 引数を実データに置き換える（`createWireframeGeometry(vertices, edges)` → `createWireframeGeometry(VERTICES, EDGES)`）
  - `update()`・`dispose()` に渡すためだけの戻り値を落とす
  - 関数の doc コメント（`/** */`）を、ブロックの見出しになる `//` コメントに変える
- **定数・パラメータはデモの初期値に合わせる。** 掲載コードが描く絵と、デモの初期表示を一致させる（「面を外す」トグルの既定がオンなら、掲載コードも面を外した状態にする）
- **やってはいけない改変** — 処理を `// 省略` で削る、実装には無い API・値に書き換える、そのままでは動かないコードにする
- **行数の上限は設けない。** 短さのために、デモと同じ絵を出すのに要るコードを落とさない
- 載せるのは、**その記事の主題が現れている部分**（行列の組み立て、投影の計算など）と、**そのコードだけで初期表示と同じ絵になるのに要る部分**（面の枠線、基準となる点や線など）。renderer の生成やリサイズは `_shared` にあるので混ざらない
- 既定では**載せない**もの（長いだけで主題が薄れる） — 頂点座標・インデックスなどのデータ定義、色などの定数、`update()`・`dispose()` の後処理。マテリアルの生成と `scene.add()` は載せる
- **`three` の API を使わない処理も載せない。** 多角形を三角形へ分割するような純粋な配列操作は、`scene.ts` に置いたまま掲載コードから外す（記事に載せるのは three の API が現れている部分）
- **どこまで載せるかは最終的に著者が決める。** 完了報告で何を載せ何を外したかを伝え、指示があればその形に直す

## 見た目

`ThreeDemoCanvas` が既に満たしているので、デモ側で CSS を書く必要はない。

- canvas のラッパ: `width: 100%` ＋ `aspect-ratio` ＋ 枠線 ＋ `touch-action: none` ＋ `cursor: grab`
- 枠線は `light-dark()` でライト／ダークに追従（枠はシーンではなくページ側の要素）
- ラッパに `role="img"` ＋ `aria-label`、Tweakpane パネルはその外（兄弟要素）
- アクセシビリティへの特別な配慮は要件としない（Tweakpane を素直に使う）

### アスペクト比

**デモ全体（canvas ＋ その下の Tweakpane パネル）が、幅に対して縦長にならないようにする。** パネルは canvas の外（下）に積まれるので、`aspectRatio` を `1 / 1` のままにするとパネルのぶんだけ全体が縦長になる。スクロールしながらでは図と操作が同時に見えず、狭い画面ほど破綻する。

- **`aspectRatio` はパネルの高さを見込んで横長側に取る。** 操作パラメータがあるデモで `1 / 1` を選ばない
- 目安（`buildPane` のバインディング数で決める）
  - 操作なし（`buildPane` を省略） — `1 / 1` のままでよい
  - 1〜2 個 — `16 / 10` 程度
  - 3 個以上 — `16 / 9` 以上の横長にする（フォルダやボタンを足した場合も同様に広げる）
- 縦方向に情報が伸びるデモ（色立体など）でも、`1 / 1` より縦長の値（`4 / 5` など）は使わない。縦に見せたいものはカメラ側（`position`・fov）で収める

### 背景色

**ライト／ダーク共通の固定色**（`_shared/constants.ts` の `DEMO_BACKGROUND`）。理由は 2 つ。

- 軸ラベルや線の色を、両モードで可読な 1 色に決められる
- `scene.ts` にテーマの分岐が入らないため、**掲載コードの見え方が読者の手元と一致する**

`scene.ts` の中で色は**リテラルで書く**（CSS 変数を読まない）。この背景の上で両モードとも可読な色を選ぶ。

色彩記事のデモは、色データを既存モジュールから取れる一方、背景の明度が色の見えを変える点に注意が要る（→「色を歪めないための約束」）。

### 軸・グリッド

`AxesHelper`・`GridHelper` の色・スケール・ラベルの見せ方は**まだ規約化していない**。デモごとに判断し、**採用した値を完了報告に書く。** 最初の数本で実態が固まってから規約化する。

### 数式はキャンバスに描かない

**キャンバス（Three.js のシーン）の中に数式を描画しない。** 数式を見せる必要があるときは、**Tweakpane のパネルにテキストとして表示する。**

- Three.js にテキスト描画の仕組みは無く、`CanvasTexture` のスプライトなどで自前に組むことになる。分数・添字・記号の組版が崩れやすく、拡大縮小でも解像度が破綻する
- 記事本文の数式（KaTeX）と見た目が揃わない
- パネルに出せば、パラメータの操作とその結果の式が同じ場所に並んで見える

書き方は、`params` に表示用の文字列フィールドを持たせ、`scene.ts` の更新処理でその時点の値を組み立てて書き戻し、`buildPane` では `readonly: true` のバインディングとして出す（例: `bresenham-selection` の `judgement`・`update`）。

- 式は**プレーンテキストで 1 行に組める形に落とす**（`d + 2(dy - dx) = -5 + 6 = 1` のように）。分数の縦組みや LaTeX 記法が要る式はデモで見せず、記事本文に書く
- キャンバスに置いてよいのは、軸ラベル・点や辺の名前といった**短い記号ラベル**まで（→「軸・グリッド」）
- `readonly` のバインディングもパネルの高さを取るので、`aspectRatio` を決めるときのバインディング数に数える（→「アスペクト比」）

## Tweakpane

- **操作を用意するのは、記事の主題に関わるパラメータだけ。** 主題から外れるもの（形状モデルの記事における光の向きなど）は固定値にし、パネルに出さない
- `tweakpane` と `@tweakpane/core`（型定義用）は `devDependencies` に入っている
- **ロードは SvelteKit のコード分割任せ。** 明示的な動的 import はしない（デモを載せた記事のチャンクにだけ入る）
- 素の `<input type="range">` による代替は設けない
- **数式や計算過程の表示は `readonly: true` のバインディングで行う。** キャンバスの中に数式を描かない（→「数式はキャンバスに描かない」）
- パネルは **canvas の外（下）**。狭い画面でオーバーレイすると図が隠れ、`touch-action: none` の領域と操作が混ざる
- テーマ変数（`--tp-*`）は `ThreeDemoCanvas` で設定済み。デモ側で上書きしない

## アニメーション

**自動アニメーションは作らない。操作したときだけ動くようにする。** `_shared` の描画ループも、操作・リサイズがあったときだけフレームを積む設計になっている。

## 品質チェック

- **`npm run check` はユーザー側で実行する。作業中に勝手に実行しない**（`svg-diagram-component` と同じ）
- ユーザーがエラーや警告を報告したら、その内容に従って修正する
- **デモの目視確認はユーザーが行う。** ブラウザを立ち上げて確認しようとしない

## 完了報告

デモ 1 本の実装が終わるたびに、次を報告する。

- 挿入した記事と位置（どの節の直後か）。**`:::Todo` を置き換えた場合はその旨**（何行目のブロックを消したか）
- 作成したファイル
- 記事に載せたコード（元になった `scene.ts` の関数名と、外した部分）。**色彩記事ではこの項目を落とし、かわりに色データの出典と色を歪めない設定を書く**（→「完了報告の差分」）
- `visual: true` を付与したかどうか
- **書いた `:::Action` の文面**（そのまま引用する。著者が直す前提の下書きとして扱う）。記事側には `{fixme}` を付けてあることと、**直したら `{fixme}` を外す**ことを添える
- **このデモで何を操作でき、何が読み取れるか**（`:::Action` に書ききれなかったものを含む。著者が本文へ言及を書き足すときの材料になる）
- 軸・グリッドを使った場合は、採用した色・スケール
- `node_modules` に `tweakpane` が無い環境（クローン直後・worktree など）では `npm install` が必要である旨
- **静的な図で進めると合意した `:::Todo` があれば、その本文と `/svg-diagram-component <図の名前>` の呼び出し**（ブロックは残したままにする。→「パターンA-1」）

複数案・複数の `:::Todo` がある場合は、ここで次に進んでよいかを確認する。
