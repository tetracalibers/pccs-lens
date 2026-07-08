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
      label: "A — スラッシュ区切り",
      note: "スラッシュ `/` をセパレーターに使ったミニマルなスタイル。ファイルパスを連想させる清潔感のある表現。現在地はテキストカラーを強調し、リンク項目は控えめなトーンに抑える"
    },
    {
      id: "b",
      label: "B — シェブロン区切り",
      note: "シェブロン `›` で区切る最もオーソドックスなスタイル。現在地にカラーのアンダーラインを引いて「ここにいる」感を強調。リンクはホバーで色が変わる"
    },
    {
      id: "c",
      label: "C — チップバッジ",
      note: "各項目をpill形状のチップで表現。現在地は塗り背景＋白テキスト、リンク項目は透過背景＋枠線で段階的な存在感を出す。視覚的にステップ感が生まれる"
    },
    {
      id: "d",
      label: "D — ドット区切り",
      note: "中黒 `·` でつなぐソフトで読みやすいスタイル。セパレーターを目立たせず、テキスト同士のリズムを重視。現在地のみウェイトを上げて自然な強調を作る"
    },
    {
      id: "e",
      label: "E — アロー形状",
      note: "各項目が矢印の形をした背景シェイプで連なる。パンくずの「階層の流れ」を視覚的に表現し、現在地は最も明るい強調色を持つ。ダークモードでグロー効果を加える"
    },
    {
      id: "f",
      label: "F — ネオングロー",
      note: "リンク項目に微弱な発光を乗せたダーク向けスタイル。ライトモードでは繊細なカラーリンクとして機能し、ダークモードでは各項目がほんのりと光る演出になる"
    },
    {
      id: "g",
      label: "G — アンダーラインリンク",
      note: "カラーのボトムボーダーでリンクを示す書き物的なスタイル。現在地のみ下線を持たずテキストウェイトで表現。ホバー時にボーダーのカラーが変化する"
    },
    {
      id: "h",
      label: "H — コードパス風",
      note: "モノスペースフォント＋コードライクな区切り文字でファイルパスを表現したスタイル。技術ドキュメントや開発ツールに合わせた表現。現在地は背景ハイライト付き"
    }
  ]

  const crumbs = [
    { label: "ホーム", href: "#" },
    { label: "学習コンテンツ", href: "#" },
    { label: "色の基礎", href: "#" },
    { label: "色相とトーン", href: null }
  ]
</script>

<svelte:head>
  <title>パンくずリスト - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">パンくずリスト デザイン案</p>

  {#each patterns as p (p.id)}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>

      <div class="demo -{p.id}">
        <nav class="breadcrumb -{p.id}" aria-label="パンくずリスト">
          {#each crumbs as crumb, i}
            {#if crumb.href}
              <a class="crumb -{p.id}" href={crumb.href}>{crumb.label}</a>
            {:else}
              <span class="crumb -{p.id} current">{crumb.label}</span>
            {/if}
            {#if i < crumbs.length - 1}
              <span class="sep -{p.id}" aria-hidden="true"></span>
            {/if}
          {/each}
        </nav>
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
    padding: 1.25rem 1.5rem;
    border-radius: 8px;
    background: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.03));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
  }

  /* 共通リセット */
  .breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .crumb {
    text-decoration: none;
    white-space: nowrap;
  }

  /* ==============================================
     A: スラッシュ区切り
     シンプルな / セパレーター
     リンク: 控えめカラー、現在地: 強いテキスト
  ============================================== */
  .breadcrumb.-a {
    font-size: 0.85rem;
    gap: 0;
  }

  .crumb.-a {
    color: light-dark(#7070a0, #7070a8);
    transition: color 0.2s;
  }

  .crumb.-a:hover {
    color: light-dark(#3a3a6a, #b0b0d0);
  }

  .crumb.-a.current {
    color: light-dark(#1a1a3a, #e8e8f8);
    font-weight: 600;
    cursor: default;
  }

  .sep.-a::before {
    content: "/";
    color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.15));
    margin: 0 0.5em;
    font-size: 0.9em;
  }

  /* ==============================================
     B: シェブロン区切り
     ›  セパレーター、現在地にカラーアンダーライン
  ============================================== */
  .breadcrumb.-b {
    font-size: 0.85rem;
  }

  .crumb.-b {
    color: light-dark(#6060a0, #8080b8);
    transition: color 0.2s;
  }

  .crumb.-b:hover {
    color: light-dark(#4040a0, #c0c0e8);
  }

  .crumb.-b.current {
    color: light-dark(#3a3aaa, #b8b8f8);
    font-weight: 600;
    cursor: default;
    padding-bottom: 2px;
    background: linear-gradient(90deg, #818cf8, #a78bfa) no-repeat bottom / 100% 1.5px;
  }

  .sep.-b::before {
    content: "›";
    color: light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2));
    margin: 0 0.45em;
    font-size: 1.1em;
    line-height: 1;
  }

  /* ==============================================
     C: チップバッジ
     各項目がpill形状。現在地: 塗り、リンク: 枠のみ
  ============================================== */
  .breadcrumb.-c {
    font-size: 0.8rem;
    gap: 0.35rem;
    align-items: center;
  }

  .crumb.-c {
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.12));
    color: light-dark(#6060a0, #8888c0);
    background: transparent;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  .crumb.-c:hover {
    background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
    border-color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.22));
    color: light-dark(#3a3a8a, #b8b8e8);
  }

  .crumb.-c.current {
    background: light-dark(#5b5baf, #8080d0);
    border-color: transparent;
    color: #ffffff;
    font-weight: 600;
    cursor: default;
  }

  .sep.-c::before {
    content: "›";
    color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.18));
    margin: 0 0.1em;
    font-size: 1em;
  }

  /* ==============================================
     D: ドット区切り
     中黒 · でつなぐソフトなスタイル
  ============================================== */
  .breadcrumb.-d {
    font-size: 0.85rem;
  }

  .crumb.-d {
    color: light-dark(#7070a8, #7878b0);
    transition: color 0.2s;
  }

  .crumb.-d:hover {
    color: light-dark(#3a3a8a, #c0c0e8);
  }

  .crumb.-d.current {
    color: light-dark(#1e1e4a, #e0e0f8);
    font-weight: 700;
    cursor: default;
  }

  .sep.-d::before {
    content: "·";
    color: light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2));
    margin: 0 0.55em;
    font-size: 1.3em;
    line-height: 0.7;
    vertical-align: middle;
  }

  /* ==============================================
     E: アロー形状
     矢印シェイプで連なる流れる表現
     現在地: 強調色, ダーク: グロー
  ============================================== */
  .breadcrumb.-e {
    font-size: 0.8rem;
    gap: 0;
  }

  .crumb.-e {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px 4px 10px;
    position: relative;
    color: light-dark(#6060a0, #8888c0);
    background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.04));
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%);
    margin-right: 2px;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .breadcrumb.-e .crumb.-e:first-child {
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
    padding-left: 12px;
  }

  .crumb.-e:hover {
    background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.09));
    color: light-dark(#3a3a8a, #c8c8f0);
  }

  .crumb.-e.current {
    background: light-dark(#5b5baf, rgba(130, 120, 220, 0.25));
    color: light-dark(#ffffff, #c8c8ff);
    font-weight: 600;
    cursor: default;
    box-shadow: light-dark(none, 0 0 12px rgba(120, 100, 220, 0.3));
  }

  .sep.-e {
    display: none;
  }

  /* ==============================================
     F: ネオングロー
     ダークでリンクが微光する演出
     ライトでは繊細なカラーリンク
  ============================================== */
  .breadcrumb.-f {
    font-size: 0.85rem;
  }

  .crumb.-f {
    color: light-dark(#6868b8, #9090d8);
    transition:
      color 0.2s,
      text-shadow 0.2s;
  }

  main:not(.light) .crumb.-f {
    text-shadow: 0 0 8px rgba(140, 120, 220, 0.4);
  }

  .crumb.-f:hover {
    color: light-dark(#4a4aaa, #d0d0ff);
  }

  main:not(.light) .crumb.-f:hover {
    text-shadow: 0 0 12px rgba(160, 140, 255, 0.7);
  }

  .crumb.-f.current {
    color: light-dark(#2a2a8a, #ffffff);
    font-weight: 700;
    cursor: default;
    text-shadow: none;
  }

  main:not(.light) .crumb.-f.current {
    text-shadow:
      0 0 10px rgba(200, 180, 255, 0.7),
      0 0 20px rgba(160, 120, 255, 0.35);
  }

  .sep.-f::before {
    content: "›";
    color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.15));
    margin: 0 0.45em;
    font-size: 1.1em;
  }

  /* ==============================================
     G: アンダーラインリンク
     書き物的なリンク表現
     現在地: 下線なし、リンク: カラーボーダー
  ============================================== */
  .breadcrumb.-g {
    font-size: 0.85rem;
  }

  .crumb.-g {
    color: light-dark(#5858b0, #8888d8);
    padding-bottom: 1px;
    border-bottom: 1.5px solid light-dark(rgba(88, 88, 176, 0.4), rgba(136, 136, 216, 0.4));
    transition:
      color 0.2s,
      border-color 0.2s;
  }

  .crumb.-g:hover {
    color: light-dark(#3030a0, #c0c0ff);
    border-bottom-color: light-dark(rgba(48, 48, 160, 0.7), rgba(160, 160, 255, 0.7));
  }

  .crumb.-g.current {
    color: light-dark(#1a1a3a, #f0f0ff);
    font-weight: 700;
    border-bottom: none;
    cursor: default;
    padding-bottom: 0;
  }

  .sep.-g::before {
    content: "/";
    color: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.15));
    margin: 0 0.5em;
    font-size: 0.9em;
  }

  /* ==============================================
     H: コードパス風
     モノスペース + ファイルパス表現
     現在地: 背景ハイライト
  ============================================== */
  .breadcrumb.-h {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;
    font-size: 0.8rem;
    letter-spacing: -0.01em;
    background: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.03));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
    border-radius: 6px;
    padding: 5px 10px;
    display: inline-flex;
  }

  .crumb.-h {
    color: light-dark(#6060a0, #8888c0);
    transition: color 0.2s;
  }

  .crumb.-h:hover {
    color: light-dark(#3030a0, #c0c0f8);
  }

  .crumb.-h.current {
    color: light-dark(#2a2a2a, #f0f0ff);
    font-weight: 700;
    background: light-dark(rgba(80, 80, 180, 0.1), rgba(120, 100, 220, 0.2));
    padding: 0 4px;
    border-radius: 3px;
    cursor: default;
  }

  .sep.-h::before {
    content: "/";
    color: light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2));
    margin: 0 0.15em;
  }

  /* デモエリア内のbreadcrumb-hはpaaddingを上書き */
  .demo.-h {
    padding: 1rem 1.5rem;
  }
</style>
