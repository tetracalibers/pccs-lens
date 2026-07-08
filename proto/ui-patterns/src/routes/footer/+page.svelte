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

  const patterns = [
    {
      id: "a",
      label: "A — ミニマルライン",
      note: "上部のボーダーラインで本文と区切るシンプルな構成。前後リンクはシェブロン付きテキスト、中央は小さく控えめなインデックスリンク。余白と線だけで構成する引き算のデザイン"
    },
    {
      id: "b",
      label: "B — アウトラインボタン",
      note: "前後リンクを角丸の枠線ボタンとして配置。中央はドットで囲んだ一覧リンク。ホバー時にボタンが塗りに変わるインタラクティブな表現。ダークではボタンが薄く光る"
    },
    {
      id: "c",
      label: "C — グラデーションアクセント",
      note: "上部に短いグラデーションバーを引き、前後リンクはテキストのみ。中央のインデックスリンクに虹色グラデーションのアンダーラインを添える。色で視線を誘導する"
    },
    {
      id: "d",
      label: "D — アローシェイプ",
      note: "前後リンクを矢印形の背景シェイプ（clip-path）で表現。進む方向を視覚的に示し、ページナビゲーションの文脈を直感的に伝える。中央は透過の小さなピル"
    },
    {
      id: "e",
      label: "E — ネオングロー",
      note: "ダーク映えする発光エフェクト。前後リンクにカラーのグロー付きボーダーを乗せ、ホバーで光が強まる。中央は淡い発光テキスト。ライトモードでは繊細なカラーに切り替わる"
    },
    {
      id: "f",
      label: "F — フローティングカード",
      note: "3列のカード状エリアにリンクを配置。backdrop-filterでガラス質感を演出。中央カードは小さく、前後カードは幅広でタイトルを表示できる。上下パディングが広めでゆとりある設計"
    },
    {
      id: "g",
      label: "G — タイポグラフィック",
      note: "大きな矢印文字（←→）をアイコンに使ったタイポグラフィ重視のデザイン。前後リンクは2行構成（矢印＋ページタイトル）。中央は小さく控えめ。大きさのコントラストで視線を導く"
    },
    {
      id: "h",
      label: "H — ステッパー風",
      note: "進捗ステッパーのような水平ラインとドットで現在位置を示す。前後リンクはラインの端に配置、中央のドットをクリックで一覧へ。ステップ感のある体験を演出"
    }
  ]
</script>

<svelte:head>
  <title>フッター - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">フッター デザイン案</p>

  {#each patterns as p (p.id)}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>

      <div class="demo -{p.id}">
        <footer class="footer -{p.id}">
          <a href="#" class="nav-link prev -{p.id}">
            <span class="nav-icon -{p.id}" aria-hidden="true"></span>
            <span class="nav-text -{p.id}">
              <span class="nav-sub -{p.id}">前の記事</span>
              <span class="nav-title -{p.id}">色相環と補色関係</span>
            </span>
          </a>

          <a href="#" class="nav-index -{p.id}">
            <span class="index-icon -{p.id}" aria-hidden="true"></span>
            <span class="index-label -{p.id}">一覧</span>
          </a>

          <a href="#" class="nav-link next -{p.id}">
            <span class="nav-text -{p.id}">
              <span class="nav-sub -{p.id}">次の記事</span>
              <span class="nav-title -{p.id}">トーン分類と配色</span>
            </span>
            <span class="nav-icon -{p.id}" aria-hidden="true"></span>
          </a>
        </footer>
      </div>

      <p class="pattern-note">{p.note}</p>
    </section>
  {/each}
</main>

<style>
  main {
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
    color-scheme: dark;
  }

  main.light {
    color-scheme: light;
  }

  .page-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: light-dark(#8888aa, #5050a0);
    margin: 0 0 2.5rem;
  }

  .pattern {
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.05));
  }

  .pattern:last-child {
    border-bottom: none;
  }

  .pattern-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: light-dark(#9999cc, #4848a0);
    margin: 0 0 0.9rem;
    text-transform: uppercase;
  }

  .pattern-note {
    font-size: 0.8rem;
    color: light-dark(#8888aa, #5858a0);
    margin: 0.75rem 0 0;
    line-height: 1.6;
  }

  .demo {
    border-radius: 8px;
    background: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.03));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
    overflow: hidden;
  }

  /* 共通リセット */
  .footer {
    display: flex;
    align-items: center;
  }

  .nav-link,
  .nav-index {
    text-decoration: none;
    color: inherit;
  }

  /* ==============================================
     A: ミニマルライン
     上ボーダー + テキストリンク + シェブロン
  ============================================== */
  .footer.-a {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.08));
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .nav-link.-a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
  }

  .nav-link.-a.next {
    flex-direction: row-reverse;
    text-align: right;
  }

  .nav-icon.-a::before {
    font-size: 1rem;
    color: light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2));
    transition: color 0.2s;
  }

  .nav-link.-a.prev .nav-icon.-a::before {
    content: "‹";
  }

  .nav-link.-a.next .nav-icon.-a::before {
    content: "›";
  }

  .nav-link.-a:hover .nav-icon.-a::before {
    color: light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.5));
  }

  .nav-text.-a {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .nav-sub.-a {
    font-size: 0.68rem;
    color: light-dark(#9090b0, #5858a0);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: color 0.2s;
  }

  .nav-title.-a {
    font-size: 0.85rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c8c8e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s;
  }

  .nav-link.-a:hover .nav-title.-a {
    color: light-dark(#5a5ab0, #e8e8ff);
  }

  .nav-index.-a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    padding: 0 0.75rem;
  }

  .index-icon.-a::before {
    content: "⊞";
    display: block;
    font-size: 0.9rem;
    color: light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2));
    transition: color 0.2s;
  }

  .index-label.-a {
    font-size: 0.65rem;
    color: light-dark(#aaaacc, #3838a0);
    letter-spacing: 0.06em;
    transition: color 0.2s;
  }

  .nav-index.-a:hover .index-icon.-a::before,
  .nav-index.-a:hover .index-label.-a {
    color: light-dark(#6060a0, #8888d0);
  }

  /* ==============================================
     B: アウトラインボタン
     枠線ボタン + ホバーで塗り
  ============================================== */
  .footer.-b {
    padding: 1.5rem;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-link.-b {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.12));
    border-radius: 6px;
    flex: 1;
    min-width: 0;
    transition:
      background 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .nav-link.-b.next {
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .nav-link.-b:hover {
    background: light-dark(rgba(80, 80, 180, 0.06), rgba(120, 100, 220, 0.12));
    border-color: light-dark(rgba(80, 80, 180, 0.25), rgba(140, 120, 240, 0.3));
    box-shadow: 0 2px 8px light-dark(rgba(80, 80, 180, 0.08), rgba(120, 100, 220, 0.15));
  }

  .nav-icon.-b::before {
    font-size: 0.9rem;
    color: light-dark(#7070b0, #6868b8);
    transition: color 0.2s;
    flex-shrink: 0;
  }

  .nav-link.-b.prev .nav-icon.-b::before {
    content: "←";
  }

  .nav-link.-b.next .nav-icon.-b::before {
    content: "→";
  }

  .nav-link.-b:hover .nav-icon.-b::before {
    color: light-dark(#5050a0, #a0a0e8);
  }

  .nav-text.-b {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  .nav-link.-b.next .nav-text.-b {
    text-align: right;
  }

  .nav-sub.-b {
    font-size: 0.65rem;
    color: light-dark(#9090b8, #4848a8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .nav-title.-b {
    font-size: 0.8rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c0c0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-index.-b {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.55rem 0.75rem;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    flex-shrink: 0;
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .nav-index.-b:hover {
    background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
    border-color: light-dark(rgba(0, 0, 0, 0.18), rgba(255, 255, 255, 0.2));
  }

  .index-icon.-b::before {
    content: "≡";
    font-size: 0.85rem;
    color: light-dark(#8080b0, #5858a8);
  }

  .index-label.-b {
    font-size: 0.72rem;
    color: light-dark(#8080b0, #5858a8);
    letter-spacing: 0.04em;
  }

  /* ==============================================
     C: グラデーションアクセント
     上部グラデーションバー + 中央レインボー下線
  ============================================== */
  .demo.-c {
    padding-top: 3px;
    background:
      linear-gradient(90deg, #818cf8, #a78bfa, #67e8f9) top / 100% 3px no-repeat,
      light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.03));
    border-top: none;
  }

  .footer.-c {
    padding: 1.25rem 1.5rem;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .nav-link.-c {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
    transition: opacity 0.2s;
  }

  .nav-link.-c.next {
    text-align: right;
    align-items: flex-end;
  }

  .nav-link.-c:hover {
    opacity: 0.75;
  }

  .nav-icon.-c {
    display: none;
  }

  .nav-sub.-c {
    font-size: 0.65rem;
    color: light-dark(#9090b8, #4848a8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .nav-link.-c.prev .nav-sub.-c::before {
    content: "‹";
    font-size: 1rem;
    color: light-dark(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.25));
  }

  .nav-link.-c.next .nav-sub.-c::after {
    content: "›";
    font-size: 1rem;
    color: light-dark(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.25));
  }

  .nav-title.-c {
    font-size: 0.85rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c0c0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .nav-index.-c {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    padding: 0 0.5rem;
  }

  .index-icon.-c {
    display: none;
  }

  .index-label.-c {
    font-size: 0.75rem;
    font-weight: 600;
    color: light-dark(#6060a8, #7070c0);
    letter-spacing: 0.05em;
    padding-bottom: 2px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #67e8f9) no-repeat bottom / 100% 1.5px;
    transition: opacity 0.2s;
  }

  .nav-index.-c:hover .index-label.-c {
    opacity: 0.7;
  }

  /* ==============================================
     D: アローシェイプ
     clip-pathで矢印形状のリンク
  ============================================== */
  .footer.-d {
    padding: 1.25rem 1.5rem;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-link.-d {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem 0.6rem 1rem;
    background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.04));
    clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 50%, 100% 100%, 12px 100%, 0 50%);
    flex: 1;
    min-width: 0;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .nav-link.-d.prev {
    clip-path: polygon(
      0 0,
      calc(100% - 12px) 0,
      100% 50%,
      calc(100% - 12px) 100%,
      0 100%,
      12px 50%
    );
    padding: 0.6rem 1rem 0.6rem 1.2rem;
  }

  .nav-link.-d.next {
    flex-direction: row-reverse;
    justify-content: flex-end;
    padding: 0.6rem 1.2rem 0.6rem 1rem;
    clip-path: polygon(12px 0, 100% 0, calc(100% - 0px) 50%, 100% 100%, 12px 100%, 0 50%);
  }

  .nav-link.-d:hover {
    background: light-dark(rgba(80, 80, 180, 0.08), rgba(100, 80, 200, 0.15));
  }

  .nav-icon.-d {
    display: none;
  }

  .nav-text.-d {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  .nav-link.-d.next .nav-text.-d {
    text-align: right;
  }

  .nav-sub.-d {
    font-size: 0.65rem;
    color: light-dark(#8888b8, #5050a8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .nav-title.-d {
    font-size: 0.8rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c0c0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-index.-d {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .nav-index.-d:hover {
    background: light-dark(rgba(80, 80, 180, 0.06), rgba(100, 80, 200, 0.12));
    border-color: light-dark(rgba(80, 80, 180, 0.2), rgba(140, 120, 240, 0.25));
  }

  .index-icon.-d::before {
    content: "⊞";
    font-size: 0.8rem;
    color: light-dark(#8080b8, #5858a8);
  }

  .index-label.-d {
    display: none;
  }

  /* ==============================================
     E: ネオングロー
     発光エフェクト + ホバーで強まる
  ============================================== */
  .footer.-e {
    padding: 1.5rem;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid light-dark(rgba(80, 80, 180, 0.12), rgba(120, 100, 220, 0.15));
  }

  .nav-link.-e {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border: 1px solid light-dark(rgba(80, 80, 180, 0.15), rgba(120, 100, 220, 0.2));
    border-radius: 6px;
    flex: 1;
    min-width: 0;
    transition:
      border-color 0.25s,
      box-shadow 0.25s,
      background 0.25s;
  }

  .nav-link.-e.next {
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .nav-link.-e:hover {
    border-color: light-dark(rgba(100, 80, 200, 0.4), rgba(140, 120, 255, 0.45));
    box-shadow: 0 0 12px light-dark(rgba(100, 80, 200, 0.1), rgba(140, 120, 255, 0.2));
    background: light-dark(rgba(80, 80, 180, 0.04), rgba(120, 100, 220, 0.08));
  }

  .nav-icon.-e::before {
    font-size: 0.85rem;
    color: light-dark(#8080b8, #8080c8);
    transition:
      color 0.25s,
      text-shadow 0.25s;
    flex-shrink: 0;
  }

  .nav-link.-e.prev .nav-icon.-e::before {
    content: "←";
  }

  .nav-link.-e.next .nav-icon.-e::before {
    content: "→";
  }

  .nav-link.-e:hover .nav-icon.-e::before {
    color: light-dark(#6060b0, #b8b8ff);
    text-shadow: 0 0 10px light-dark(rgba(100, 80, 200, 0.2), rgba(160, 140, 255, 0.6));
  }

  .nav-text.-e {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  .nav-link.-e.next .nav-text.-e {
    text-align: right;
  }

  .nav-sub.-e {
    font-size: 0.65rem;
    color: light-dark(#8888b8, #4848a8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .nav-title.-e {
    font-size: 0.8rem;
    font-weight: 600;
    color: light-dark(#4040a0, #b0b0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      color 0.25s,
      text-shadow 0.25s;
  }

  .nav-link.-e:hover .nav-title.-e {
    color: light-dark(#5050b8, #d8d8ff);
    text-shadow: 0 0 12px light-dark(rgba(80, 80, 200, 0.15), rgba(180, 160, 255, 0.4));
  }

  .nav-index.-e {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    padding: 0 0.5rem;
    transition: opacity 0.25s;
  }

  .nav-index.-e:hover {
    opacity: 0.75;
  }

  .index-icon.-e::before {
    content: "⊞";
    display: block;
    font-size: 1rem;
    color: light-dark(#7070b0, #6060b8);
    transition: text-shadow 0.25s;
  }

  .nav-index.-e:hover .index-icon.-e::before {
    text-shadow: 0 0 10px light-dark(rgba(100, 80, 200, 0.2), rgba(140, 120, 255, 0.5));
  }

  .index-label.-e {
    font-size: 0.65rem;
    color: light-dark(#9090b8, #4848a8);
    letter-spacing: 0.06em;
  }

  /* ==============================================
     F: フローティングカード
     3列カード + backdrop-filter
  ============================================== */
  .demo.-f {
    padding: 1.25rem;
    background: light-dark(rgba(240, 240, 255, 0.6), rgba(20, 18, 40, 0.6));
  }

  .footer.-f {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0.6rem;
    align-items: stretch;
  }

  .nav-link.-f {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.85rem 1rem;
    background: light-dark(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.04));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    backdrop-filter: blur(8px);
    transition:
      background 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .nav-link.-f.next {
    align-items: flex-end;
    text-align: right;
  }

  .nav-link.-f:hover {
    background: light-dark(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.08));
    border-color: light-dark(rgba(80, 80, 180, 0.15), rgba(140, 120, 240, 0.2));
    box-shadow: 0 4px 16px light-dark(rgba(0, 0, 0, 0.06), rgba(120, 100, 220, 0.12));
  }

  .nav-icon.-f::before {
    font-size: 0.75rem;
    color: light-dark(#9090c0, #5050b0);
  }

  .nav-link.-f.prev .nav-icon.-f::before {
    content: "← 前へ";
  }

  .nav-link.-f.next .nav-icon.-f::before {
    content: "次へ →";
  }

  .nav-text.-f {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .nav-sub.-f {
    display: none;
  }

  .nav-title.-f {
    font-size: 0.82rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c0c0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .nav-index.-f {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.6rem;
    background: light-dark(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.04));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    backdrop-filter: blur(8px);
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .nav-index.-f:hover {
    background: light-dark(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.08));
    border-color: light-dark(rgba(80, 80, 180, 0.15), rgba(140, 120, 240, 0.2));
  }

  .index-icon.-f::before {
    content: "⊞";
    font-size: 0.9rem;
    color: light-dark(#8080b8, #5858b8);
  }

  .index-label.-f {
    font-size: 0.62rem;
    color: light-dark(#9090c0, #4848b0);
    letter-spacing: 0.06em;
  }

  /* ==============================================
     G: タイポグラフィック
     大きな矢印文字 + 2行構成
  ============================================== */
  .footer.-g {
    padding: 1.5rem;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link.-g {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
    transition: opacity 0.2s;
  }

  .nav-link.-g.next {
    flex-direction: row-reverse;
    justify-content: flex-start;
    text-align: right;
  }

  .nav-link.-g:hover {
    opacity: 0.7;
  }

  .nav-icon.-g::before {
    font-size: 2rem;
    font-weight: 200;
    line-height: 1;
    color: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.1));
    transition: color 0.2s;
    flex-shrink: 0;
  }

  .nav-link.-g.prev .nav-icon.-g::before {
    content: "←";
  }

  .nav-link.-g.next .nav-icon.-g::before {
    content: "→";
  }

  .nav-link.-g:hover .nav-icon.-g::before {
    color: light-dark(rgba(80, 80, 180, 0.4), rgba(160, 140, 255, 0.4));
  }

  .nav-text.-g {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .nav-sub.-g {
    font-size: 0.62rem;
    color: light-dark(#9090b8, #4848a8);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .nav-title.-g {
    font-size: 0.88rem;
    font-weight: 700;
    color: light-dark(#2a2a5a, #d0d0f0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-index.-g {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
    padding: 0 0.5rem;
    transition: opacity 0.2s;
  }

  .nav-index.-g:hover {
    opacity: 0.65;
  }

  .index-icon.-g::before {
    content: "⊞";
    display: block;
    font-size: 1.1rem;
    font-weight: 200;
    color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.15));
  }

  .index-label.-g {
    font-size: 0.6rem;
    color: light-dark(#a0a0c0, #3838a0);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ==============================================
     H: ステッパー風
     水平ライン + ドットで現在位置を示す
  ============================================== */
  .footer.-h {
    padding: 0 1.5rem 1.25rem;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
    gap: 0;
  }

  /* ステッパーライン — grid-column で全列スパンさせてアイテムを押し出さない */
  .footer.-h::before {
    content: "";
    grid-column: 1 / -1;
    height: 1px;
    margin-top: 1.5rem;
    background: linear-gradient(
      90deg,
      transparent,
      light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.1)) 15%,
      light-dark(rgba(80, 80, 180, 0.3), rgba(120, 100, 220, 0.35)) 50%,
      light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.1)) 85%,
      transparent
    );
  }

  .nav-link.-h {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
  }

  .nav-link.-h.next {
    align-items: flex-end;
    text-align: right;
  }

  .nav-link.-h::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: light-dark(rgba(80, 80, 180, 0.3), rgba(120, 100, 220, 0.4));
    border: 1.5px solid light-dark(rgba(80, 80, 180, 0.5), rgba(140, 120, 240, 0.5));
    align-self: flex-start;
    transition:
      background 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
    flex-shrink: 0;
  }

  .nav-link.-h.next::before {
    align-self: flex-end;
  }

  .nav-link.-h:hover::before {
    background: light-dark(rgba(80, 80, 180, 0.5), rgba(140, 120, 255, 0.6));
    border-color: light-dark(rgba(80, 80, 180, 0.7), rgba(160, 140, 255, 0.7));
    box-shadow: 0 0 6px light-dark(rgba(80, 80, 180, 0.2), rgba(160, 140, 255, 0.4));
  }

  .nav-icon.-h {
    display: none;
  }

  .nav-text.-h {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .nav-sub.-h {
    font-size: 0.62rem;
    color: light-dark(#9090b8, #4848a8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .nav-title.-h {
    font-size: 0.82rem;
    font-weight: 600;
    color: light-dark(#3a3a6a, #c0c0e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 12em;
    transition: color 0.2s;
  }

  .nav-link.-h:hover .nav-title.-h {
    color: light-dark(#5050a8, #e0e0ff);
  }

  .nav-index.-h {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding-top: 0.5rem;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .nav-index.-h:hover {
    opacity: 0.7;
  }

  /* 中央のドット（現在位置） */
  .index-icon.-h::before {
    content: "";
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: light-dark(#7070b8, #8888c8);
    box-shadow: 0 0 0 3px light-dark(rgba(112, 112, 184, 0.15), rgba(136, 136, 200, 0.15));
    transition:
      background 0.2s,
      box-shadow 0.2s;
  }

  .nav-index.-h:hover .index-icon.-h::before {
    background: light-dark(#5050a8, #aaaaff);
    box-shadow: 0 0 0 4px light-dark(rgba(80, 80, 168, 0.2), rgba(170, 170, 255, 0.2));
  }

  .index-label.-h {
    font-size: 0.62rem;
    color: light-dark(#9090b8, #4848b0);
    letter-spacing: 0.06em;
  }
</style>
