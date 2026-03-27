<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  $effect(() => {
    document.body.style.background = theme.isLight ? "#ffffff" : "#0c0c14"
    document.body.style.color = theme.isLight ? "#1a1a1a" : "#d8d8e8"
    return () => {
      document.body.style.background = ""
      document.body.style.color = ""
    }
  })
</script>

<main class:light={theme.isLight}>
  <p class="page-title">Term Card デザイン案</p>

  <!-- A: フラットソリッドカード -->
  <section class="pattern">
    <p class="pattern-label">A — フラットソリッド（背景色のみ）</p>
    <div class="term-card -a">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      枠線もシャドウも角丸もなし。ページ背景と異なる塗りだけでカードを表現する。フラットデザイン的な潔さで、コンテンツに集中させる
    </p>
  </section>

  <!-- B: 左グラデーションストライプ -->
  <section class="pattern">
    <p class="pattern-label">B — 左グラデーションストライプ</p>
    <div class="term-card -b">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      左端に5pxのレインボーグラデーション帯を引き、背景に微量のウォームティントを添える。枠ではなく「軸」でカードを定義するスタイル
    </p>
  </section>

  <!-- C: クリップパス斜め角 -->
  <section class="pattern">
    <p class="pattern-label">C — クリップパス斜め角</p>
    <div class="term-card -c">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      右下の角を clip-path
      で斜めにカット。非矩形のシルエット自体がカードの境界を明示する。角丸の「柔らかさ」とは逆の、鋭利で構築的な表現
    </p>
  </section>

  <!-- D: 全幅セクションバンド -->
  <section class="pattern">
    <p class="pattern-label">D — 全幅セクションバンド</p>
    <div class="term-card -d">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      ネガティブマージンでコラム幅いっぱいに背景を引き伸ばす。上下に細い罫線を引いて帯の範囲を示す。雑誌の「コラム引用」に近い面的な表現
    </p>
  </section>

  <!-- E: 上下ルールのみ -->
  <section class="pattern">
    <p class="pattern-label">E — 上下ルール（横罫2本）</p>
    <div class="term-card -e">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      背景色なし・側面ボーダーなし。上部に太い罫線、下部に細い罫線を引くだけでコンテンツを囲む。書籍や雑誌の引用ブロックに近いタイポグラフィ的表現
    </p>
  </section>

  <!-- F: 方眼紙背景カード -->
  <section class="pattern">
    <p class="pattern-label">F — 方眼紙背景</p>
    <div class="term-card -f">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      CSS
      グラデーションで方眼紙状のドットグリッドを背景に描画。明示的な枠なしで「特別な領域」を示す。スケッチや設計図を想起させるテクスチャ表現
    </p>
  </section>

  <!-- G: 見出しストライプ（現行維持） -->
  <section class="pattern">
    <p class="pattern-label">G — 見出しストライプ</p>
    <div class="term-card -g">
      <div class="tc-header">
        <h3>明清色</h3>
      </div>
      <div class="tc-body">
        <p>
          純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
        </p>
        <div class="diagram-wrapper">
          <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
        </div>
      </div>
    </div>
    <p class="pattern-note">
      h3
      を異なる背景色のヘッダー帯に分離したカード。タイトルの視認性が高く、複数カードをグリッド表示したとき各カードのラベルを素早く走査できる
    </p>
  </section>

  <!-- H: 二重アウトライン（ダブルフレーム） -->
  <section class="pattern">
    <p class="pattern-label">H — 二重アウトライン（ダブルフレーム）</p>
    <div class="term-card -h">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      border と outline
      を重ねた二重フレーム。角丸なし・シャドウなし。額縁的な構造でコンテンツを格式高く囲む。グリッド表示時に整列の美しさが際立つ
    </p>
  </section>
</main>

<style>
  /* ===== ページ共通 ===== */
  main {
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
    transition:
      background 0.4s,
      color 0.4s;
  }

  .page-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5050a0;
    margin: 0 0 2.5rem;
  }

  main.light .page-title {
    color: #8888aa;
  }

  /* ===== パターン共通ラッパー ===== */
  .pattern {
    margin-bottom: 3.5rem;
    padding-bottom: 3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  main.light .pattern {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .pattern:last-child {
    border-bottom: none;
  }

  .pattern-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #4848a0;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  main.light .pattern-label {
    color: #9999cc;
  }

  .pattern-note {
    font-size: 0.8rem;
    color: #5858a0;
    margin: 0.75rem 0 0;
    line-height: 1.6;
  }

  main.light .pattern-note {
    color: #8888aa;
  }

  /* ===== 全バリアント共通 ===== */
  .term-card {
    max-width: 320px;
  }
  .term-card img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* =====================================================
     A: フラットソリッド
     - 枠線・角丸・シャドウなし
     - ページ背景と異なる塗りだけでカードを表現
     ===================================================== */
  .term-card.-a {
    background: rgba(255, 255, 255, 0.055);
    padding: 1.2rem;
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-a h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
  }

  .term-card.-a p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-a {
    background: rgba(0, 0, 0, 0.04);
  }

  main.light .term-card.-a h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-a p {
    color: #556070;
  }

  /* =====================================================
     B: 左グラデーションストライプ
     - ::before でレインボー帯を描画
     - 枠線・角丸・シャドウなし
     ===================================================== */
  .term-card.-b {
    position: relative;
    padding: 1rem 1.1rem 1rem 1.5rem;
    background: rgba(255, 180, 100, 0.04);
    display: grid;
    gap: 0.65rem;
  }

  .term-card.-b::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 5px;
    background: linear-gradient(180deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
  }

  .term-card.-b h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
  }

  .term-card.-b p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-b {
    background: rgba(200, 120, 0, 0.04);
  }

  main.light .term-card.-b h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-b p {
    color: #556070;
  }

  /* =====================================================
     C: クリップパス斜め角
     - 右下角を clip-path で斜めカット
     - シルエット自体がカードの境界を示す
     ===================================================== */
  .term-card.-c {
    background: rgba(107, 203, 119, 0.08);
    padding: 1.2rem;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%);
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-c h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #b8f0c8;
  }

  .term-card.-c p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #70a880;
  }

  main.light .term-card.-c {
    background: rgba(47, 158, 68, 0.07);
  }

  main.light .term-card.-c h3 {
    color: #1a4a28;
  }

  main.light .term-card.-c p {
    color: #2e6040;
  }

  /* =====================================================
     D: 全幅セクションバンド
     - ネガティブマージンでコラム幅いっぱいに広げる
     - 上下に細い罫線だけで帯の範囲を示す
     ===================================================== */
  .term-card.-d {
    margin-inline: -1rem;
    padding: 1.1rem 1rem;
    background: rgba(77, 150, 255, 0.06);
    border-top: 1px solid rgba(77, 150, 255, 0.2);
    border-bottom: 1px solid rgba(77, 150, 255, 0.1);
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-d h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #c8d8ff;
  }

  .term-card.-d p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #7090b8;
  }

  main.light .term-card.-d {
    background: rgba(29, 113, 194, 0.05);
    border-top-color: rgba(29, 113, 194, 0.2);
    border-bottom-color: rgba(29, 113, 194, 0.1);
  }

  main.light .term-card.-d h3 {
    color: #1a3a6a;
  }

  main.light .term-card.-d p {
    color: #3a5575;
  }

  /* =====================================================
     E: 上下ルールのみ（横罫2本）
     - 背景色なし・側面ボーダーなし
     - 上部に太い罫線、下部に細い罫線
     ===================================================== */
  .term-card.-e {
    padding: 1.1rem 0;
    border-top: 2px solid rgba(255, 255, 255, 0.22);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-e h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e8e8f8;
  }

  .term-card.-e p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-e {
    border-top-color: rgba(0, 0, 0, 0.2);
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  main.light .term-card.-e h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-e p {
    color: #556070;
  }

  /* =====================================================
     F: 方眼紙背景
     - CSS グラデーションでドットグリッドを生成
     - 明示的な枠なし
     ===================================================== */
  .term-card.-f {
    padding: 1.2rem;
    background-color: rgba(255, 255, 255, 0.015);
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 22px 22px;
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-f h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
  }

  .term-card.-f p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-f {
    background-color: rgba(0, 0, 0, 0.01);
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.07) 1px, transparent 1px);
  }

  main.light .term-card.-f h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-f p {
    color: #556070;
  }

  /* =====================================================
     G: 見出しストライプ（現行維持）
     - h3 を別背景色のヘッダー帯に分離
     - 上辺にレインボーグラデーションのアクセント
     ===================================================== */
  .term-card.-g {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .term-card.-g .tc-header {
    padding: 0.65rem 1rem;
    background: linear-gradient(
      90deg,
      rgba(255, 107, 107, 0.16),
      rgba(255, 217, 61, 0.12),
      rgba(107, 203, 119, 0.12),
      rgba(77, 150, 255, 0.16)
    );
    position: relative;
  }

  .term-card.-g .tc-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    opacity: 0.6;
  }

  .term-card.-g h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e8e8f8;
  }

  .term-card.-g .tc-body {
    padding: 0.8rlh 1rlh;

    border-width: 2px;
    border-style: solid;
    border-image: linear-gradient(
        90deg,
        rgba(255, 107, 107, 0.2),
        rgba(255, 217, 61, 0.1),
        rgba(107, 203, 119, 0.1),
        rgba(77, 150, 255, 0.2)
      )
      30;
    border-block-start: 0;

    background-image:
      linear-gradient(rgba(112, 128, 144, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(112, 128, 144, 0.05) 1px, transparent 1px);
    background-size: 0.9rlh 0.9rlh;
    background-clip: padding-box;
    background-position-x: center;
    background-position-y: top;

    display: grid;
    gap: 0.65rem;
  }

  .term-card.-g p {
    font-size: 0.83rem;
    line-height: 1rlh;
    margin: 0;
    color: #8080a0;
  }

  .term-card.-g .diagram-wrapper img {
    border: 1px solid rgba(255, 255, 255, 0.06);
    opacity: 0.85;
  }

  main.light .term-card.-g .tc-header {
    background: linear-gradient(
      90deg,
      rgba(255, 107, 107, 0.06),
      rgba(255, 217, 61, 0.05),
      rgba(107, 203, 119, 0.05),
      rgba(77, 150, 255, 0.06)
    );
  }

  main.light .term-card.-g h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-g .tc-body {
    border-image: linear-gradient(
        90deg,
        rgba(255, 107, 107, 0.1),
        rgba(255, 217, 61, 0.05),
        rgba(107, 203, 119, 0.05),
        rgba(77, 150, 255, 0.1)
      )
      30;
  }

  main.light .term-card.-g p {
    color: #556070;
  }

  main.light .term-card.-g .diagram-wrapper img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
  }

  /* =====================================================
     H: 二重アウトライン（ダブルフレーム）
     - border + outline を重ねた二重フレーム
     - 角丸なし・シャドウなし
     ===================================================== */
  .term-card.-h {
    padding: 1.2rem;
    border: 2px solid;
    border-image: linear-gradient(
        90deg,
        rgba(255, 107, 107, 0.4),
        rgba(255, 217, 61, 0.2),
        rgba(107, 203, 119, 0.2),
        rgba(77, 150, 255, 0.4)
      )
      30;
    outline: 1px solid oklch(27.9% 0.041 260.031); /** slate-800 */
    outline-offset: 5px;
    display: grid;
    gap: 0.9rem;
  }

  .term-card.-h h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #eaeaf8;
  }

  .term-card.-h p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-h {
    border-color: rgba(0, 0, 0, 0.18);
    outline-color: oklch(92.9% 0.013 255.508); /** slate-200 */
  }

  main.light .term-card.-h h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-h p {
    color: #556070;
  }
</style>
