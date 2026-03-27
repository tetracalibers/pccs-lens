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
  <p class="page-title">Tips ブロック デザイン案</p>

  <!-- A: 現行案 — 琥珀ネオン枠 + Tips: プレフィックス -->
  <section class="pattern">
    <p class="pattern-label">A — 琥珀ネオン枠（現行案）</p>
    <div class="tips -a">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      琥珀色の薄枠と背景で囲み、
      <code>::before</code>
      で「Tips: 」を前置する。ネオン世界観と調和したシンプルな案
    </p>
  </section>

  <!-- B: 左ボーダーライン -->
  <section class="pattern">
    <p class="pattern-label">B — 左アクセントライン</p>
    <div class="tips -b">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      左に2pxの琥珀グラデーションライン。枠で囲まず、余白と線だけで区切る。テキスト主体のページに溶け込みやすい
    </p>
  </section>

  <!-- C: グラスモーフィズムカード -->
  <section class="pattern">
    <p class="pattern-label">C — グラスモーフィズムカード</p>
    <div class="tips -c">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      backdrop-blurとガラス感のある背景でカード化。ラベルはカード上部に独立した行として表示
    </p>
  </section>

  <!-- D: レインボー上線 -->
  <section class="pattern">
    <p class="pattern-label">D — レインボー上線</p>
    <div class="tips -d">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      上辺にレインボーグラデーションラインを引き、ブランドカラーを添える。背景は極めて薄く、本文に近い軽さを保つ
    </p>
  </section>

  <!-- E: ラベルタグ付きドット枠 -->
  <section class="pattern">
    <p class="pattern-label">E — ラベルタグ付きドット枠</p>
    <div class="tips -e">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      点線の枠に角を重ねるようにラベルタグを配置。コード・端末を想起させるテクノロジー感のある表現
    </p>
  </section>

  <!-- F: チップ型インラインラベル -->
  <section class="pattern">
    <p class="pattern-label">F — チップ型インラインラベル</p>
    <div class="tips -f">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      「Tips」をバッジ風のチップとして文頭に埋め込む。枠線なし、行ベースの読みやすいレイアウト
    </p>
  </section>

  <!-- G: ネオングロー背景 -->
  <section class="pattern">
    <p class="pattern-label">G — ネオングロー背景</p>
    <div class="tips -g">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      内側に青紫のグロー（box-shadow
      inset）を仕込んだ囲み。ネオン感が強く、インタラクティブな要素への誘導に向く
    </p>
  </section>

  <!-- H: 角括弧コーナー装飾 -->
  <section class="pattern">
    <p class="pattern-label">H — 角括弧コーナー装飾</p>
    <div class="tips -h">トーンをクリックしてイメージを確認してみよう</div>
    <p class="pattern-note">
      四隅にL字のコーナーラインを擬似要素で描く。枠線なしで浮遊感を演出し、コードエディタ的な世界観を表現
    </p>
  </section>
</main>

<style>
  main {
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
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

  .pattern-note code {
    font-size: 0.85em;
    color: #6bcb77;
    background: rgba(107, 203, 119, 0.1);
    border: 1px solid rgba(107, 203, 119, 0.2);
    border-radius: 3px;
    padding: 1px 4px;
  }

  main.light .pattern-note code {
    color: #1d7a2a;
    background: rgba(29, 122, 42, 0.08);
    border-color: rgba(29, 122, 42, 0.2);
  }

  /* ===== 共通 Tips テキスト ===== */
  .tips {
    font-size: 0.88rem;
    line-height: 1.7;
    color: #9898b8;
  }

  main.light .tips {
    color: #556070;
  }

  /* =====================
     A: 琥珀ネオン枠（現行案）
     - 枠 + 薄背景 + Tips: プレフィックス
  ===================== */
  .tips.-a {
    padding: 0.6rem 0.85rem;
    border: 1px solid rgba(255, 217, 61, 0.25);
    background: rgba(255, 217, 61, 0.04);
    border-radius: 4px;
    backdrop-filter: blur(4px);
  }

  .tips.-a::before {
    content: "Tips: ";
    color: #ffd93d;
    font-weight: 700;
    opacity: 0.85;
  }

  main.light .tips.-a {
    border-color: rgba(180, 130, 0, 0.3);
    background: rgba(255, 217, 61, 0.06);
    color: #556070;
  }

  main.light .tips.-a::before {
    color: #9a6200;
  }

  /* =====================
     B: 左アクセントライン
     - 左のみボーダー + インデント + ラベル上行
  ===================== */
  .tips.-b {
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(180deg, #ffd93d, #ff6b6b) 1;
    position: relative;
  }

  .tips.-b::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffd93d;
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  main.light .tips.-b {
    color: #556070;
  }

  main.light .tips.-b::before {
    color: #9a6200;
  }

  /* =====================
     C: グラスモーフィズムカード
     - backdrop-blur + ガラス背景 + ラベル行
  ===================== */
  .tips.-c {
    padding: 0.85rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .tips.-c::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffd93d;
    margin-bottom: 0.45rem;
    opacity: 0.7;
  }

  main.light .tips.-c {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: none;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
    color: #556070;
  }

  main.light .tips.-c::before {
    color: #9a6200;
  }

  /* =====================
     D: レインボー上線
     - 上辺にグラデーションボーダー + 薄背景
  ===================== */
  .tips.-d {
    padding: 0.7rem 0.9rem 0.6rem;
    border-top: 2px solid transparent;
    background:
      linear-gradient(#0c0c14, #0c0c14) padding-box,
      linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) border-box;
    border-radius: 0 0 4px 4px;
  }

  .tips.-d::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: linear-gradient(90deg, #ffd93d, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.3rem;
  }

  main.light .tips.-d {
    background:
      linear-gradient(#ffffff, #ffffff) padding-box,
      linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) border-box;
    color: #556070;
  }

  /* =====================
     E: ラベルタグ付きドット枠
     - 点線枠 + 左上にタグ風ラベル
  ===================== */
  .tips.-e {
    padding: 0.9rem 0.9rem 0.65rem;
    border: 1px dashed rgba(255, 217, 61, 0.3);
    border-radius: 4px;
    position: relative;
    margin-top: 0.6rem;
  }

  .tips.-e::before {
    content: "Tips";
    position: absolute;
    top: -0.65rem;
    left: 0.75rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffd93d;
    background: #0c0c14;
    padding: 0 0.4rem;
  }

  main.light .tips.-e {
    border-color: rgba(154, 98, 0, 0.35);
    color: #556070;
  }

  main.light .tips.-e::before {
    color: #9a6200;
    background: #ffffff;
  }

  /* =====================
     F: チップ型インラインラベル
     - Tips バッジを文頭に埋め込み、枠線なし
  ===================== */
  .tips.-f {
    padding: 0.3rem 0;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  .tips.-f::before {
    content: "Tips";
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0c0c14;
    background: #ffd93d;
    border-radius: 3px;
    padding: 2px 6px;
    line-height: 1.4;
    opacity: 0.9;
  }

  main.light .tips.-f {
    color: #556070;
  }

  main.light .tips.-f::before {
    color: #ffffff;
    background: #9a6200;
  }

  /* =====================
     G: ネオングロー背景
     - inset box-shadow でグロー + 薄枠
  ===================== */
  .tips.-g {
    padding: 0.7rem 0.9rem;
    border: 1px solid rgba(199, 125, 255, 0.2);
    border-radius: 6px;
    background: rgba(199, 125, 255, 0.04);
    box-shadow: inset 0 0 20px rgba(199, 125, 255, 0.06);
  }

  .tips.-g::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c77dff;
    margin-bottom: 0.35rem;
    text-shadow: 0 0 8px rgba(199, 125, 255, 0.6);
  }

  main.light .tips.-g {
    border-color: rgba(107, 35, 168, 0.2);
    background: rgba(107, 35, 168, 0.04);
    box-shadow: none;
    color: #556070;
  }

  main.light .tips.-g::before {
    color: #6b23a8;
    text-shadow: none;
  }

  /* =====================
     H: 角括弧コーナー装飾
     - 四隅にL字ライン、枠線なし
  ===================== */
  .tips.-h {
    padding: 0.75rem 0.9rem;
    position: relative;
  }

  .tips.-h::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6bcb77;
    margin-bottom: 0.35rem;
  }

  /* 左上・右上コーナー */
  .tips.-h::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      /* 左上横 */
      linear-gradient(#6bcb77, #6bcb77) top left / 12px 1px no-repeat,
      /* 左上縦 */ linear-gradient(#6bcb77, #6bcb77) top left / 1px 12px no-repeat,
      /* 右上横 */ linear-gradient(#6bcb77, #6bcb77) top right / 12px 1px no-repeat,
      /* 右上縦 */ linear-gradient(#6bcb77, #6bcb77) top right / 1px 12px no-repeat,
      /* 左下横 */ linear-gradient(rgba(107, 203, 119, 0.35), rgba(107, 203, 119, 0.35)) bottom
        left / 12px 1px no-repeat,
      /* 左下縦 */ linear-gradient(rgba(107, 203, 119, 0.35), rgba(107, 203, 119, 0.35)) bottom
        left / 1px 12px no-repeat,
      /* 右下横 */ linear-gradient(rgba(107, 203, 119, 0.35), rgba(107, 203, 119, 0.35)) bottom
        right / 12px 1px no-repeat,
      /* 右下縦 */ linear-gradient(rgba(107, 203, 119, 0.35), rgba(107, 203, 119, 0.35)) bottom
        right / 1px 12px no-repeat;
    opacity: 0.85;
  }

  main.light .tips.-h {
    color: #556070;
  }

  main.light .tips.-h::before {
    color: #2f9e44;
  }

  main.light .tips.-h::after {
    background:
      linear-gradient(#2f9e44, #2f9e44) top left / 12px 1px no-repeat,
      linear-gradient(#2f9e44, #2f9e44) top left / 1px 12px no-repeat,
      linear-gradient(#2f9e44, #2f9e44) top right / 12px 1px no-repeat,
      linear-gradient(#2f9e44, #2f9e44) top right / 1px 12px no-repeat,
      linear-gradient(rgba(47, 158, 68, 0.35), rgba(47, 158, 68, 0.35)) bottom left / 12px 1px
        no-repeat,
      linear-gradient(rgba(47, 158, 68, 0.35), rgba(47, 158, 68, 0.35)) bottom left / 1px 12px
        no-repeat,
      linear-gradient(rgba(47, 158, 68, 0.35), rgba(47, 158, 68, 0.35)) bottom right / 12px 1px
        no-repeat,
      linear-gradient(rgba(47, 158, 68, 0.35), rgba(47, 158, 68, 0.35)) bottom right / 1px 12px
        no-repeat;
  }
</style>
