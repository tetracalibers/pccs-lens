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
  <p class="page-title">目次デザイン案</p>

  <!-- A: 縦ライン + インデント -->
  <section class="pattern">
    <p class="pattern-label">A — 縦ライン + インデント</p>
    <nav class="toc-a">
      <ol>
        <li class="h2"><a href="#">PCCSとは？</a></li>
        <li class="h3"><a href="#">色相について</a></li>
        <li class="h4"><a href="#">色相環の読み方</a></li>
        <li class="h4"><a href="#">色相番号の意味</a></li>
        <li class="h3"><a href="#">トーンについて</a></li>
        <li class="h4"><a href="#">トーンの種類</a></li>
        <li class="h2"><a href="#">色の分類とトーンの位置関係</a></li>
        <li class="h3"><a href="#">純色・明清色・暗清色</a></li>
        <li class="h4"><a href="#">純色（vトーン）</a></li>
        <li class="h4"><a href="#">明清色と暗清色</a></li>
        <li class="h3"><a href="#">中間色と無彩色</a></li>
      </ol>
    </nav>
    <p class="pattern-note">
      左端の縦ラインに対してインデントで階層を表現。h2は太字、h3/h4はフェードで深度を示す
    </p>
  </section>

  <!-- B: ドット階層 -->
  <section class="pattern">
    <p class="pattern-label">B — ドット階層</p>
    <nav class="toc-b">
      <ul>
        <li class="h2"><a href="#">PCCSとは？</a></li>
        <li class="h3"><a href="#">色相について</a></li>
        <li class="h4"><a href="#">色相環の読み方</a></li>
        <li class="h4"><a href="#">色相番号の意味</a></li>
        <li class="h3"><a href="#">トーンについて</a></li>
        <li class="h4"><a href="#">トーンの種類</a></li>
        <li class="h2"><a href="#">色の分類とトーンの位置関係</a></li>
        <li class="h3"><a href="#">純色・明清色・暗清色</a></li>
        <li class="h4"><a href="#">純色（vトーン）</a></li>
        <li class="h4"><a href="#">明清色と暗清色</a></li>
        <li class="h3"><a href="#">中間色と無彩色</a></li>
      </ul>
    </nav>
    <p class="pattern-note">
      レベルごとにサイズの異なる丸ドットをマーカーに使用。ドットの色と大きさで階層を直感的に表す
    </p>
  </section>

  <!-- C: 番号アウトライン -->
  <section class="pattern">
    <p class="pattern-label">C — 番号アウトライン</p>
    <nav class="toc-c">
      <ol>
        <li class="h2">
          <span class="num">1</span>
          <a href="#">PCCSとは？</a>
        </li>
        <li class="h3">
          <span class="num">1.1</span>
          <a href="#">色相について</a>
        </li>
        <li class="h4">
          <span class="num">1.1.1</span>
          <a href="#">色相環の読み方</a>
        </li>
        <li class="h4">
          <span class="num">1.1.2</span>
          <a href="#">色相番号の意味</a>
        </li>
        <li class="h3">
          <span class="num">1.2</span>
          <a href="#">トーンについて</a>
        </li>
        <li class="h4">
          <span class="num">1.2.1</span>
          <a href="#">トーンの種類</a>
        </li>
        <li class="h2">
          <span class="num">2</span>
          <a href="#">色の分類とトーンの位置関係</a>
        </li>
        <li class="h3">
          <span class="num">2.1</span>
          <a href="#">純色・明清色・暗清色</a>
        </li>
        <li class="h4">
          <span class="num">2.1.1</span>
          <a href="#">純色（vトーン）</a>
        </li>
        <li class="h4">
          <span class="num">2.1.2</span>
          <a href="#">明清色と暗清色</a>
        </li>
        <li class="h3">
          <span class="num">2.2</span>
          <a href="#">中間色と無彩色</a>
        </li>
      </ol>
    </nav>
    <p class="pattern-note">
      「1 / 1.1 / 1.1.1」形式の番号でアウトライン構造を明示。テクニカルドキュメント風
    </p>
  </section>

  <!-- D: カラーレベルバッジ -->
  <section class="pattern">
    <p class="pattern-label">D — カラーレベルバッジ</p>
    <nav class="toc-d">
      <ul>
        <li class="h2">
          <span class="badge">H2</span>
          <a href="#">PCCSとは？</a>
        </li>
        <li class="h3">
          <span class="badge">H3</span>
          <a href="#">色相について</a>
        </li>
        <li class="h4">
          <span class="badge">H4</span>
          <a href="#">色相環の読み方</a>
        </li>
        <li class="h4">
          <span class="badge">H4</span>
          <a href="#">色相番号の意味</a>
        </li>
        <li class="h3">
          <span class="badge">H3</span>
          <a href="#">トーンについて</a>
        </li>
        <li class="h4">
          <span class="badge">H4</span>
          <a href="#">トーンの種類</a>
        </li>
        <li class="h2">
          <span class="badge">H2</span>
          <a href="#">色の分類とトーンの位置関係</a>
        </li>
        <li class="h3">
          <span class="badge">H3</span>
          <a href="#">純色・明清色・暗清色</a>
        </li>
        <li class="h4">
          <span class="badge">H4</span>
          <a href="#">純色（vトーン）</a>
        </li>
        <li class="h4">
          <span class="badge">H4</span>
          <a href="#">明清色と暗清色</a>
        </li>
        <li class="h3">
          <span class="badge">H3</span>
          <a href="#">中間色と無彩色</a>
        </li>
      </ul>
    </nav>
    <p class="pattern-note">レベルを色分けしたピルバッジで明示。視認性が高く、階層が一目でわかる</p>
  </section>

  <!-- E: ツリーコネクター -->
  <section class="pattern">
    <p class="pattern-label">E — ツリーコネクター</p>
    <nav class="toc-e">
      <ul>
        <li class="h2"><a href="#">PCCSとは？</a></li>
        <li class="h3"><a href="#">色相について</a></li>
        <li class="h4"><a href="#">色相環の読み方</a></li>
        <li class="h4 last-child"><a href="#">色相番号の意味</a></li>
        <li class="h3 last-child"><a href="#">トーンについて</a></li>
        <li class="h4 last-child"><a href="#">トーンの種類</a></li>
        <li class="h2"><a href="#">色の分類とトーンの位置関係</a></li>
        <li class="h3"><a href="#">純色・明清色・暗清色</a></li>
        <li class="h4"><a href="#">純色（vトーン）</a></li>
        <li class="h4 last-child"><a href="#">明清色と暗清色</a></li>
        <li class="h3 last-child"><a href="#">中間色と無彩色</a></li>
      </ul>
    </nav>
    <p class="pattern-note">
      ファイルツリー風のL字コネクターで親子関係を視覚的に結ぶ。エンジニアに馴染み深いスタイル
    </p>
  </section>

  <!-- F: グラデーション左ボーダー -->
  <section class="pattern">
    <p class="pattern-label">F — グラデーション左ボーダー</p>
    <nav class="toc-f">
      <ul>
        <li class="h2"><a href="#">PCCSとは？</a></li>
        <li class="h3"><a href="#">色相について</a></li>
        <li class="h4"><a href="#">色相環の読み方</a></li>
        <li class="h4"><a href="#">色相番号の意味</a></li>
        <li class="h3"><a href="#">トーンについて</a></li>
        <li class="h4"><a href="#">トーンの種類</a></li>
        <li class="h2"><a href="#">色の分類とトーンの位置関係</a></li>
        <li class="h3"><a href="#">純色・明清色・暗清色</a></li>
        <li class="h4"><a href="#">純色（vトーン）</a></li>
        <li class="h4"><a href="#">明清色と暗清色</a></li>
        <li class="h3"><a href="#">中間色と無彩色</a></li>
      </ul>
    </nav>
    <p class="pattern-note">
      レベルごとに異なるカラーの左ボーダーを使用。h2はラベンダー、h3はシアン、h4はサーモン
    </p>
  </section>

  <!-- G: フラットリスト + 透明度 -->
  <section class="pattern">
    <p class="pattern-label">G — フラットリスト + 透明度</p>
    <nav class="toc-g">
      <ul>
        <li class="h2"><a href="#">PCCSとは？</a></li>
        <li class="h3"><a href="#">色相について</a></li>
        <li class="h4"><a href="#">色相環の読み方</a></li>
        <li class="h4"><a href="#">色相番号の意味</a></li>
        <li class="h3"><a href="#">トーンについて</a></li>
        <li class="h4"><a href="#">トーンの種類</a></li>
        <li class="h2"><a href="#">色の分類とトーンの位置関係</a></li>
        <li class="h3"><a href="#">純色・明清色・暗清色</a></li>
        <li class="h4"><a href="#">純色（vトーン）</a></li>
        <li class="h4"><a href="#">明清色と暗清色</a></li>
        <li class="h3"><a href="#">中間色と無彩色</a></li>
      </ul>
    </nav>
    <p class="pattern-note">
      インデントなしのフラットレイアウト。フォントサイズと透明度の変化だけで深度を表現するミニマル案
    </p>
  </section>

  <!-- H: カード型セクション -->
  <section class="pattern">
    <p class="pattern-label">H — カード型セクション</p>
    <nav class="toc-h">
      <div class="h2-group">
        <a href="#" class="h2-link">PCCSとは？</a>
        <div class="sub">
          <div class="h3-item">
            <a href="#" class="h3-link">色相について</a>
            <span class="h4-cluster">
              <a href="#">色相環の読み方</a>
              <a href="#">色相番号の意味</a>
            </span>
          </div>
          <div class="h3-item">
            <a href="#" class="h3-link">トーンについて</a>
            <span class="h4-cluster">
              <a href="#">トーンの種類</a>
            </span>
          </div>
        </div>
      </div>
      <div class="h2-group">
        <a href="#" class="h2-link">色の分類とトーンの位置関係</a>
        <div class="sub">
          <div class="h3-item">
            <a href="#" class="h3-link">純色・明清色・暗清色</a>
            <span class="h4-cluster">
              <a href="#">純色（vトーン）</a>
              <a href="#">明清色と暗清色</a>
            </span>
          </div>
          <div class="h3-item">
            <a href="#" class="h3-link">中間色と無彩色</a>
          </div>
        </div>
      </div>
    </nav>
    <p class="pattern-note">
      h2単位でカードに分割し、h3・h4をカード内にネスト。セクション間の境界が明確なブロック型
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
    margin: 0.8rem 0 0;
    line-height: 1.6;
  }

  main.light .pattern-note {
    color: #8888aa;
  }

  /* ===== 共通リセット ===== */
  nav ol,
  nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  nav a {
    text-decoration: none;
    transition: opacity 0.15s;
  }

  nav a:hover {
    opacity: 0.7;
  }

  /* =====================
     A: 縦ライン + インデント
  ===================== */
  .toc-a {
    border-left: 2px solid rgba(196, 181, 253, 0.3);
    padding-left: 0;
  }

  main.light .toc-a {
    border-left-color: rgba(109, 40, 217, 0.2);
  }

  .toc-a li {
    padding: 0.28rem 0 0.28rem 1.1rem;
  }

  .toc-a li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-a li.h3 {
    padding-left: 1.9rem;
  }

  .toc-a li.h3 a {
    font-size: 0.88rem;
    font-weight: 500;
    color: #9898c8;
  }

  .toc-a li.h4 {
    padding-left: 2.8rem;
  }

  .toc-a li.h4 a {
    font-size: 0.82rem;
    font-weight: 400;
    color: #6868a0;
  }

  main.light .toc-a li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-a li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-a li.h4 a {
    color: #8888aa;
  }

  /* =====================
     B: ドット階層
  ===================== */
  .toc-b li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.28rem 0;
  }

  .toc-b li::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    border-radius: 50%;
  }

  .toc-b li.h2 {
    padding-left: 0;
  }

  .toc-b li.h2::before {
    width: 9px;
    height: 9px;
    background: #c4b5fd;
  }

  .toc-b li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-b li.h3 {
    padding-left: 1.5rem;
  }

  .toc-b li.h3::before {
    width: 6px;
    height: 6px;
    background: #67e8f9;
  }

  .toc-b li.h3 a {
    font-size: 0.88rem;
    font-weight: 500;
    color: #9898c8;
  }

  .toc-b li.h4 {
    padding-left: 3rem;
  }

  .toc-b li.h4::before {
    width: 4px;
    height: 4px;
    background: rgba(196, 181, 253, 0.4);
    border: 1px solid rgba(196, 181, 253, 0.5);
  }

  .toc-b li.h4 a {
    font-size: 0.82rem;
    color: #6868a0;
  }

  main.light .toc-b li.h2::before {
    background: #7c3aed;
  }

  main.light .toc-b li.h3::before {
    background: #0891b2;
  }

  main.light .toc-b li.h4::before {
    background: rgba(109, 40, 217, 0.3);
    border-color: rgba(109, 40, 217, 0.4);
  }

  main.light .toc-b li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-b li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-b li.h4 a {
    color: #8888aa;
  }

  /* =====================
     C: 番号アウトライン
  ===================== */
  .toc-c li {
    display: flex;
    align-items: baseline;
    gap: 0.7rem;
    padding: 0.3rem 0;
  }

  .toc-c .num {
    flex-shrink: 0;
    font-size: 0.72rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    min-width: 3rem;
    text-align: right;
  }

  .toc-c li.h2 .num {
    color: #c4b5fd;
  }

  .toc-c li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-c li.h3 .num {
    color: #9090c0;
  }

  .toc-c li.h3 a {
    font-size: 0.88rem;
    color: #9898c8;
  }

  .toc-c li.h4 .num {
    color: #5858a0;
    font-size: 0.68rem;
  }

  .toc-c li.h4 a {
    font-size: 0.82rem;
    color: #6868a0;
  }

  main.light .toc-c li.h2 .num {
    color: #7c3aed;
  }

  main.light .toc-c li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-c li.h3 .num {
    color: #6060a0;
  }

  main.light .toc-c li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-c li.h4 .num {
    color: #9999bb;
  }

  main.light .toc-c li.h4 a {
    color: #8888aa;
  }

  /* =====================
     D: カラーレベルバッジ
  ===================== */
  .toc-d li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0;
  }

  .toc-d li.h3 {
    padding-left: 1.4rem;
  }

  .toc-d li.h4 {
    padding-left: 2.8rem;
  }

  .toc-d .badge {
    flex-shrink: 0;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    border-radius: 3px;
    padding: 0.15em 0.45em;
  }

  .toc-d li.h2 .badge {
    background: rgba(196, 181, 253, 0.2);
    color: #c4b5fd;
    border: 1px solid rgba(196, 181, 253, 0.3);
  }

  .toc-d li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-d li.h3 .badge {
    background: rgba(103, 232, 249, 0.15);
    color: #67e8f9;
    border: 1px solid rgba(103, 232, 249, 0.25);
  }

  .toc-d li.h3 a {
    font-size: 0.88rem;
    color: #9898c8;
  }

  .toc-d li.h4 .badge {
    background: rgba(253, 164, 175, 0.12);
    color: #fda4af;
    border: 1px solid rgba(253, 164, 175, 0.2);
  }

  .toc-d li.h4 a {
    font-size: 0.82rem;
    color: #6868a0;
  }

  main.light .toc-d li.h2 .badge {
    background: rgba(109, 40, 217, 0.1);
    color: #6d28d9;
    border-color: rgba(109, 40, 217, 0.2);
  }

  main.light .toc-d li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-d li.h3 .badge {
    background: rgba(8, 145, 178, 0.1);
    color: #0891b2;
    border-color: rgba(8, 145, 178, 0.2);
  }

  main.light .toc-d li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-d li.h4 .badge {
    background: rgba(244, 63, 94, 0.08);
    color: #e11d48;
    border-color: rgba(244, 63, 94, 0.15);
  }

  main.light .toc-d li.h4 a {
    color: #8888aa;
  }

  /* =====================
     E: ツリーコネクター
  ===================== */
  .toc-e ul {
    padding-left: 0;
  }

  .toc-e li {
    position: relative;
    padding: 0.28rem 0;
  }

  .toc-e li.h2 {
    padding-left: 0;
  }

  .toc-e li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-e li.h3 {
    padding-left: 1.5rem;
  }

  .toc-e li.h3::before {
    content: "";
    position: absolute;
    left: 0.3rem;
    top: 0;
    bottom: -0.28rem;
    width: 1px;
    background: rgba(196, 181, 253, 0.25);
  }

  .toc-e li.h3.last-child::before {
    bottom: 50%;
  }

  .toc-e li.h3::after {
    content: "";
    position: absolute;
    left: 0.3rem;
    top: 50%;
    width: 0.7rem;
    height: 1px;
    background: rgba(196, 181, 253, 0.25);
  }

  .toc-e li.h3 a {
    font-size: 0.88rem;
    color: #9898c8;
  }

  .toc-e li.h4 {
    padding-left: 3.1rem;
  }

  .toc-e li.h4::before {
    content: "";
    position: absolute;
    left: 1.8rem;
    top: 0;
    bottom: -0.28rem;
    width: 1px;
    background: rgba(103, 232, 249, 0.2);
  }

  .toc-e li.h4.last-child::before {
    bottom: 50%;
  }

  .toc-e li.h4::after {
    content: "";
    position: absolute;
    left: 1.8rem;
    top: 50%;
    width: 0.7rem;
    height: 1px;
    background: rgba(103, 232, 249, 0.2);
  }

  .toc-e li.h4 a {
    font-size: 0.82rem;
    color: #6868a0;
  }

  main.light .toc-e li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-e li.h3::before,
  main.light .toc-e li.h3::after {
    background: rgba(109, 40, 217, 0.2);
  }

  main.light .toc-e li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-e li.h4::before,
  main.light .toc-e li.h4::after {
    background: rgba(8, 145, 178, 0.2);
  }

  main.light .toc-e li.h4 a {
    color: #8888aa;
  }

  /* =====================
     F: グラデーション左ボーダー
  ===================== */
  .toc-f li {
    padding: 0.28rem 0 0.28rem 0.85rem;
    border-left: 2px solid transparent;
  }

  .toc-f li.h2 {
    border-left-color: #c4b5fd;
    margin-bottom: 0.1rem;
  }

  .toc-f li.h2 a {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e0e0f8;
  }

  .toc-f li.h3 {
    border-left-color: #67e8f9;
    padding-left: 2rem;
  }

  .toc-f li.h3 a {
    font-size: 0.88rem;
    color: #9898c8;
  }

  .toc-f li.h4 {
    border-left-color: rgba(253, 164, 175, 0.6);
    padding-left: 3.15rem;
  }

  .toc-f li.h4 a {
    font-size: 0.82rem;
    color: #6868a0;
  }

  main.light .toc-f li.h2 {
    border-left-color: #7c3aed;
  }

  main.light .toc-f li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-f li.h3 {
    border-left-color: #0891b2;
  }

  main.light .toc-f li.h3 a {
    color: #4a4a7a;
  }

  main.light .toc-f li.h4 {
    border-left-color: rgba(244, 63, 94, 0.4);
  }

  main.light .toc-f li.h4 a {
    color: #8888aa;
  }

  /* =====================
     G: フラットリスト + 透明度
  ===================== */
  .toc-g li {
    padding: 0.22rem 0;
  }

  .toc-g li.h2 {
    margin-top: 0.5rem;
  }

  .toc-g li.h2:first-child {
    margin-top: 0;
  }

  .toc-g li.h2 a {
    font-size: 1rem;
    font-weight: 700;
    color: #e0e0f8;
    letter-spacing: -0.01em;
  }

  .toc-g li.h3 a {
    font-size: 0.88rem;
    font-weight: 400;
    color: rgba(224, 224, 248, 0.55);
  }

  .toc-g li.h4 a {
    font-size: 0.8rem;
    font-weight: 400;
    color: rgba(224, 224, 248, 0.3);
  }

  main.light .toc-g li.h2 a {
    color: #1a1a2e;
  }

  main.light .toc-g li.h3 a {
    color: rgba(26, 26, 46, 0.5);
  }

  main.light .toc-g li.h4 a {
    color: rgba(26, 26, 46, 0.3);
  }

  /* =====================
     H: カード型セクション
  ===================== */
  .toc-h {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .toc-h .h2-group {
    border: 1px solid rgba(196, 181, 253, 0.15);
    border-radius: 6px;
    overflow: hidden;
  }

  .toc-h .h2-link {
    display: block;
    padding: 0.65rem 1rem;
    font-size: 0.92rem;
    font-weight: 700;
    color: #e0e0f8;
    background: rgba(196, 181, 253, 0.07);
    border-bottom: 1px solid rgba(196, 181, 253, 0.1);
    text-decoration: none;
    transition:
      background 0.15s,
      opacity 0.15s;
  }

  .toc-h .h2-link:hover {
    background: rgba(196, 181, 253, 0.12);
    opacity: 1;
  }

  .toc-h .sub {
    padding: 0.4rem 0;
  }

  .toc-h .h3-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.35rem 1rem 0.35rem 1.4rem;
    transition: background 0.15s;
  }

  .toc-h .h3-item:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .toc-h .h3-link {
    font-size: 0.86rem;
    font-weight: 500;
    color: #9898c8;
    text-decoration: none;
  }

  .toc-h .h4-cluster {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.8rem;
    padding-left: 0.8rem;
    margin-top: 0.1rem;
  }

  .toc-h .h4-cluster a {
    font-size: 0.76rem;
    color: #5858a0;
    text-decoration: none;
    transition: color 0.15s;
  }

  .toc-h .h4-cluster a:hover {
    color: #9090c0;
    opacity: 1;
  }

  main.light .toc-h .h2-group {
    border-color: rgba(109, 40, 217, 0.15);
  }

  main.light .toc-h .h2-link {
    color: #1a1a2e;
    background: rgba(109, 40, 217, 0.05);
    border-bottom-color: rgba(109, 40, 217, 0.1);
  }

  main.light .toc-h .h2-link:hover {
    background: rgba(109, 40, 217, 0.08);
  }

  main.light .toc-h .h3-item:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  main.light .toc-h .h3-link {
    color: #4a4a7a;
  }

  main.light .toc-h .h4-cluster a {
    color: #9999bb;
  }

  main.light .toc-h .h4-cluster a:hover {
    color: #6666aa;
  }
</style>
