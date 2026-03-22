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

  <!-- A: グラスモーフィズム（現行ベース） -->
  <section class="pattern">
    <p class="pattern-label">A — グラスモーフィズム（現行ベース）</p>
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
      backdrop-blur + 薄白背景 + 細い白枠のグラスモーフィズムカード。現行デザインの基本スタイル。ダークモードのネオン世界観と自然に調和する
    </p>
  </section>

  <!-- B: フルブリード画像（画像下部・全幅） -->
  <section class="pattern">
    <p class="pattern-label">B — フルブリード画像（画像下部・全幅）</p>
    <div class="term-card -b">
      <div class="tc-text">
        <h3>明清色</h3>
        <p>
          純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
        </p>
      </div>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      テキストに上パディング、画像はカード下部にパディングなしで全幅配置。ダイアグラムを大きく見せたいときに有効なマガジンライクなスタイル
    </p>
  </section>

  <!-- C: 横分割（テキスト左・図右） -->
  <section class="pattern">
    <p class="pattern-label">C — 横分割（テキスト左・図右）</p>
    <div class="term-card -c">
      <div class="tc-text">
        <h3>明清色</h3>
        <p>
          純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
        </p>
      </div>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      左カラムにテキスト、右カラムにダイアグラムを並べる2カラムレイアウト。図と説明の対応が視覚的にわかりやすく、縦の高さを抑えられる
    </p>
  </section>

  <!-- D: 画像ファースト（画像上部・全幅） -->
  <section class="pattern">
    <p class="pattern-label">D — 画像ファースト（画像上部・全幅）</p>
    <div class="term-card -d">
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
      <div class="tc-text">
        <h3>明清色</h3>
        <p>
          純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
        </p>
      </div>
    </div>
    <p class="pattern-note">
      ダイアグラムを冒頭に全幅で見せ、続いてタイトル・説明を読ませる「図→言語」の流れ。視覚情報が先に来るため直感的に理解しやすい
    </p>
  </section>

  <!-- E: ミニマル区切り線 -->
  <section class="pattern">
    <p class="pattern-label">E — ミニマル区切り線</p>
    <div class="term-card -e">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を明清色といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="tc-divider" aria-hidden="true"></div>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <p class="pattern-note">
      ボックス・背景なし。グラデーションのセパレーターラインでテキストと図を区切るだけのミニマルスタイル。本文に溶け込み、ページの流れを妨げない
    </p>
  </section>

  <!-- F: ネオングロー枠 -->
  <section class="pattern">
    <p class="pattern-label">F — ネオングロー枠</p>
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
      青紫のネオングローを box-shadow で演出した枠付きカード。ダークモードでの存在感が強く、ページに点在させたときのアクセントとして機能する
    </p>
  </section>

  <!-- G: 見出しストライプ -->
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
      h3 を異なる背景色のヘッダー帯に分離したカード。タイトルの視認性が高く、複数カードをグリッド表示したとき各カードのラベルを素早く走査できる
    </p>
  </section>

  <!-- H: プレミアムシャドウ -->
  <section class="pattern">
    <p class="pattern-label">H — プレミアムシャドウ</p>
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
      多層シャドウと上辺のハイライトラインで奥行きと光沢を演出。カードとしての存在感が強く、コンテンツの重要度を高く見せるプレミアムな仕上がり
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
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
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

  /* ===== 全バリアント共通：img ===== */
  .term-card img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* =====================================================
     A: グラスモーフィズム（現行ベース）
     - backdrop-blur + 薄白背景 + 細い白枠
     - グリッドで縦積み、画像は中央寄せ
     ===================================================== */
  .term-card.-a {
    padding: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(8px);
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

  .term-card.-a .diagram-wrapper img {
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    opacity: 0.85;
  }

  main.light .term-card.-a {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: none;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card.-a h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-a p {
    color: #556070;
  }

  main.light .term-card.-a .diagram-wrapper img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
  }

  /* =====================================================
     B: フルブリード画像（画像下部・全幅）
     - テキストに上パディング、画像はパディングなしで全幅
     - ボーダーあり、角丸あり
     ===================================================== */
  .term-card.-b {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .term-card.-b .tc-text {
    padding: 1rem 1.1rem 0.8rem;
    display: grid;
    gap: 0.5rem;
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

  .term-card.-b .diagram-wrapper {
    margin-top: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  main.light .term-card.-b {
    border-color: rgba(0, 0, 0, 0.1);
    background: #ffffff;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card.-b h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-b p {
    color: #556070;
  }

  main.light .term-card.-b .diagram-wrapper {
    border-top-color: rgba(0, 0, 0, 0.07);
  }

  /* =====================================================
     C: 横分割（テキスト左・図右）
     - flex row: テキスト列 + 画像列
     - 画像列は固定幅、テキスト列はflexで残りを占有
     ===================================================== */
  .term-card.-c {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(8px);
    display: flex;
    gap: 0;
    overflow: hidden;
    align-items: stretch;
  }

  .term-card.-c .tc-text {
    flex: 1 1 0;
    min-width: 0;
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: center;
  }

  .term-card.-c h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
  }

  .term-card.-c p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  .term-card.-c .diagram-wrapper {
    flex: 0 0 45%;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.1);
  }

  .term-card.-c .diagram-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }

  main.light .term-card.-c {
    border-color: rgba(0, 0, 0, 0.1);
    background: #ffffff;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card.-c h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-c p {
    color: #556070;
  }

  main.light .term-card.-c .diagram-wrapper {
    border-left-color: rgba(0, 0, 0, 0.07);
    background: rgba(0, 0, 0, 0.02);
  }

  main.light .term-card.-c .diagram-wrapper img {
    opacity: 1;
  }

  /* =====================================================
     D: 画像ファースト（画像上部・全幅）
     - 画像をカード上部に全幅配置、テキストは下に
     ===================================================== */
  .term-card.-d {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .term-card.-d .diagram-wrapper {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.15);
  }

  .term-card.-d .diagram-wrapper img {
    opacity: 0.85;
  }

  .term-card.-d .tc-text {
    padding: 0.9rem 1.1rem 1rem;
    display: grid;
    gap: 0.45rem;
  }

  .term-card.-d h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
  }

  .term-card.-d p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  main.light .term-card.-d {
    border-color: rgba(0, 0, 0, 0.1);
    background: #ffffff;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card.-d .diagram-wrapper {
    border-bottom-color: rgba(0, 0, 0, 0.07);
    background: rgba(0, 0, 0, 0.02);
  }

  main.light .term-card.-d .diagram-wrapper img {
    opacity: 1;
  }

  main.light .term-card.-d h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-d p {
    color: #556070;
  }

  /* =====================================================
     E: ミニマル区切り線
     - ボックスなし・背景なし
     - グラデーションのセパレーターで図と本文を区切る
     ===================================================== */
  .term-card.-e {
    display: grid;
    gap: 0.65rem;
  }

  .term-card.-e h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #c8c8e0;
  }

  .term-card.-e p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  .term-card.-e .tc-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.12) 20%,
      rgba(255, 255, 255, 0.12) 80%,
      transparent
    );
    margin: 0.2rem 0;
  }

  .term-card.-e .diagram-wrapper img {
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    opacity: 0.85;
  }

  main.light .term-card.-e h3 {
    color: #2d2d3a;
  }

  main.light .term-card.-e p {
    color: #556070;
  }

  main.light .term-card.-e .tc-divider {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 0, 0, 0.1) 20%,
      rgba(0, 0, 0, 0.1) 80%,
      transparent
    );
  }

  main.light .term-card.-e .diagram-wrapper img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
  }

  /* =====================================================
     F: ネオングロー枠
     - 青紫ネオンの box-shadow でカードを浮かび上がらせる
     - 薄いボーダーと組み合わせた半透明背景
     ===================================================== */
  .term-card.-f {
    padding: 1.1rem;
    border: 1px solid rgba(77, 150, 255, 0.2);
    border-radius: 8px;
    background: rgba(77, 150, 255, 0.03);
    box-shadow:
      0 0 0 1px rgba(199, 125, 255, 0.06),
      0 0 20px rgba(77, 150, 255, 0.1),
      0 0 40px rgba(199, 125, 255, 0.06);
    display: grid;
    gap: 0.7rem;
  }

  .term-card.-f h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #c8d8ff;
  }

  .term-card.-f p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8090b8;
  }

  .term-card.-f .diagram-wrapper img {
    border-radius: 4px;
    border: 1px solid rgba(77, 150, 255, 0.15);
    opacity: 0.85;
  }

  main.light .term-card.-f {
    border-color: rgba(29, 113, 194, 0.2);
    background: rgba(77, 150, 255, 0.03);
    box-shadow:
      0 0 0 1px rgba(107, 35, 168, 0.04),
      0 2px 16px rgba(29, 113, 194, 0.1);
  }

  main.light .term-card.-f h3 {
    color: #1a3a6a;
  }

  main.light .term-card.-f p {
    color: #3a5070;
  }

  main.light .term-card.-f .diagram-wrapper img {
    border-color: rgba(29, 113, 194, 0.15);
    opacity: 1;
  }

  /* =====================================================
     G: 見出しストライプ
     - h3 を別背景色のヘッダー帯に分離
     - ヘッダー帯はレインボーグラデーションの薄いアクセント
     ===================================================== */
  .term-card.-g {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .term-card.-g .tc-header {
    padding: 0.65rem 1rem;
    background: linear-gradient(
      90deg,
      rgba(255, 107, 107, 0.08),
      rgba(255, 217, 61, 0.06),
      rgba(107, 203, 119, 0.06),
      rgba(77, 150, 255, 0.08)
    );
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
    padding: 0.85rem 1rem 1rem;
    background: rgba(255, 255, 255, 0.02);
    display: grid;
    gap: 0.65rem;
  }

  .term-card.-g p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  .term-card.-g .diagram-wrapper img {
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    opacity: 0.85;
  }

  main.light .term-card.-g {
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card.-g .tc-header {
    background: linear-gradient(
      90deg,
      rgba(255, 107, 107, 0.06),
      rgba(255, 217, 61, 0.05),
      rgba(107, 203, 119, 0.05),
      rgba(77, 150, 255, 0.06)
    );
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  main.light .term-card.-g h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-g .tc-body {
    background: #ffffff;
  }

  main.light .term-card.-g p {
    color: #556070;
  }

  main.light .term-card.-g .diagram-wrapper img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
  }

  /* =====================================================
     H: プレミアムシャドウ
     - 多層シャドウ + 上辺ハイライトラインで奥行きと光沢を演出
     - やや厚みのある背景色
     ===================================================== */
  .term-card.-h {
    padding: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.06) inset,
      0 4px 12px rgba(0, 0, 0, 0.4),
      0 12px 32px rgba(0, 0, 0, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.5);
    display: grid;
    gap: 0.7rem;
    position: relative;
  }

  .term-card.-h::before {
    content: "";
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    border-radius: 50%;
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
    color: #8888a8;
  }

  .term-card.-h .diagram-wrapper img {
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    opacity: 0.88;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  main.light .term-card.-h {
    border-color: rgba(0, 0, 0, 0.1);
    background: #ffffff;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 12px 32px rgba(0, 0, 0, 0.06),
      0 1px 3px rgba(0, 0, 0, 0.1);
  }

  main.light .term-card.-h::before {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
  }

  main.light .term-card.-h h3 {
    color: #1a1a1a;
  }

  main.light .term-card.-h p {
    color: #556070;
  }

  main.light .term-card.-h .diagram-wrapper img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
</style>
