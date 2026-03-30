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
      label: "A — パステルソリッド",
      note:
        "パステルカラーの塗り背景に濃いテキスト。グレードごとに異なるパステルトーンを割り当て、ポップで明るい印象を与える。「入門」は暖色のコーラルで際立たせる"
    },
    {
      id: "b",
      label: "B — ビビッドアウトライン",
      note:
        "彩度の高い輪郭線と薄い背景色の組み合わせ。「入門」は太い枠線＋アイコン付きで存在感を強調。他グレードは細い枠線でおとなしく並ぶ"
    },
    {
      id: "c",
      label: "C — キャンディピル",
      note:
        "pill形状にパステルの塗り背景を組み合わせたキャンディ風スタイル。「入門」はグラデーション＋白文字で他グレードと質感を変えて際立たせる"
    },
    {
      id: "d",
      label: "D — ドットアクセント",
      note:
        "カラードットを先頭に置いたミニマルなラベル。「入門」はドットのサイズを大きくしてリング付きのパルスアニメーションを加え、視線を引き込む"
    },
    {
      id: "e",
      label: "E — グラデーションバッジ",
      note:
        "2色グラデーションの背景バッジ。他グレードはパステル同士の淡い組み合わせにする一方、「入門」はウォームサンセット（珊瑚→橙）で温かみを強調する"
    },
    {
      id: "f",
      label: "F — ネオングロー",
      note:
        "テキストと枠にグロー効果を乗せたダーク映えスタイル。「入門」はピンクの強い発光＋CSSアニメーションで点滅する光輪を加え、唯一の動的な表現にする"
    },
    {
      id: "g",
      label: "G — アンダーライン装飾",
      note:
        "カラーのボトムボーダーのみのシンプルなラベル。「入門」はレインボーグラデーションの下線と太字で差別化。他グレードは単色の細い下線で統一する"
    },
    {
      id: "h",
      label: "H — ブラケットスタイル",
      note:
        "コード・技術文書を想起させる括弧スタイル。「入門」は全角の日本語括弧【】と暖色で視覚的に浮かせる。他グレードは半角の [ ] でモノスペース的に統一する"
    }
  ]
</script>

<svelte:head>
  <title>タグ - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">タグ デザイン案</p>

  {#each patterns as p (p.id)}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>
      <div class="tag-row">
        <span class="tag -{p.id}" data-grade="intro">入門</span>
        <span class="tag -{p.id}" data-grade="3">3級</span>
        <span class="tag -{p.id}" data-grade="2">2級</span>
        <span class="tag -{p.id}" data-grade="1">1級</span>
        <span class="tag -{p.id}" data-grade="uc">UC級</span>
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

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
  }

  /* ==============================================
     A: パステルソリッド
     グレードごとに異なるパステル背景 + 濃いテキスト
     入門: コーラル + ✦アイコン + 少し大きく
  ============================================== */
  .tag.-a {
    padding: 3px 8px;
    border-radius: 4px;
    color: #1a1a2e;
  }

  .tag.-a[data-grade="intro"] {
    background: #ff7675;
    color: #ffffff;
    font-size: 0.82rem;
    padding: 4px 10px;
  }

  .tag.-a[data-grade="intro"]::before {
    content: "✦";
    margin-right: 4px;
    font-size: 0.65em;
    opacity: 0.85;
  }

  .tag.-a[data-grade="3"] {
    background: #c4b5fd;
  }

  .tag.-a[data-grade="2"] {
    background: #6ee7b7;
  }

  .tag.-a[data-grade="1"] {
    background: #fde68a;
  }

  .tag.-a[data-grade="uc"] {
    background: #93c5fd;
  }

  /* ==============================================
     B: ビビッドアウトライン
     彩度の高い枠線 + 薄い背景
     入門: 2px枠 + ★アイコン + 大きめ
  ============================================== */
  .tag.-b {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid;
  }

  .tag.-b[data-grade="intro"] {
    border: 2px solid #f43f5e;
    color: light-dark(#be123c, #f43f5e);
    background: light-dark(rgba(244, 63, 94, 0.07), rgba(244, 63, 94, 0.1));
    font-size: 0.82rem;
    padding: 4px 10px;
    font-weight: 700;
  }

  .tag.-b[data-grade="intro"]::before {
    content: "★";
    margin-right: 4px;
    font-size: 0.7em;
  }

  .tag.-b[data-grade="3"] {
    border-color: light-dark(#7c3aed, #a78bfa);
    color: light-dark(#7c3aed, #a78bfa);
    background: light-dark(rgba(124, 58, 237, 0.06), rgba(167, 139, 250, 0.09));
  }

  .tag.-b[data-grade="2"] {
    border-color: light-dark(#0d9488, #2dd4bf);
    color: light-dark(#0d9488, #2dd4bf);
    background: light-dark(rgba(13, 148, 136, 0.06), rgba(45, 212, 191, 0.09));
  }

  .tag.-b[data-grade="1"] {
    border-color: light-dark(#ea580c, #fb923c);
    color: light-dark(#ea580c, #fb923c);
    background: light-dark(rgba(234, 88, 12, 0.06), rgba(251, 146, 60, 0.09));
  }

  .tag.-b[data-grade="uc"] {
    border-color: light-dark(#0284c7, #38bdf8);
    color: light-dark(#0284c7, #38bdf8);
    background: light-dark(rgba(2, 132, 199, 0.06), rgba(56, 189, 248, 0.09));
  }

  /* ==============================================
     C: キャンディピル
     pill形状のパステル塗り + 濃いテキスト
     入門: グラデーション + 白テキスト + 大きく
  ============================================== */
  .tag.-c {
    padding: 3px 10px;
    border-radius: 999px;
    color: #1a1a2e;
  }

  .tag.-c[data-grade="intro"] {
    background: linear-gradient(90deg, #ff758c, #ff9a6c);
    color: #ffffff;
    font-size: 0.82rem;
    padding: 5px 13px;
    font-weight: 700;
  }

  .tag.-c[data-grade="3"] {
    background: #ddd6fe;
  }

  .tag.-c[data-grade="2"] {
    background: #bfdbfe;
  }

  .tag.-c[data-grade="1"] {
    background: #fef08a;
  }

  .tag.-c[data-grade="uc"] {
    background: #d1fae5;
  }

  /* ==============================================
     D: ドットアクセント
     先頭に色ドット + ニュートラルテキスト
     入門: 大きいドット + パルスアニメーション + 色テキスト
  ============================================== */
  @keyframes dot-pulse {
    0%,
    100% {
      box-shadow:
        0 0 0 0 rgba(244, 63, 94, 0.5),
        0 0 0 0 rgba(244, 63, 94, 0.25);
    }

    50% {
      box-shadow:
        0 0 0 4px rgba(244, 63, 94, 0.15),
        0 0 0 8px rgba(244, 63, 94, 0);
    }
  }

  .tag.-d {
    gap: 5px;
    color: light-dark(#3a3a5a, #9898b8);
  }

  .tag.-d::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tag.-d[data-grade="intro"] {
    color: light-dark(#be123c, #fb7185);
    font-weight: 700;
    gap: 7px;
  }

  .tag.-d[data-grade="intro"]::before {
    width: 8px;
    height: 8px;
    background: light-dark(#f43f5e, #fb7185);
    animation: dot-pulse 2s ease-in-out infinite;
  }

  .tag.-d[data-grade="3"]::before {
    background: light-dark(#7c3aed, #a78bfa);
  }

  .tag.-d[data-grade="2"]::before {
    background: light-dark(#0d9488, #5eead4);
  }

  .tag.-d[data-grade="1"]::before {
    background: light-dark(#d97706, #fcd34d);
  }

  .tag.-d[data-grade="uc"]::before {
    background: light-dark(#0284c7, #7dd3fc);
  }

  /* ==============================================
     E: グラデーションバッジ
     他グレードはパステル2色グラデ + 濃いテキスト
     入門: ウォームサンセット + 白テキスト + 大きく
  ============================================== */
  .tag.-e {
    padding: 3px 8px;
    border-radius: 4px;
  }

  .tag.-e[data-grade="intro"] {
    background: linear-gradient(120deg, #f43f5e, #fb923c);
    color: #ffffff;
    font-size: 0.82rem;
    padding: 4px 10px;
    font-weight: 700;
  }

  .tag.-e[data-grade="3"] {
    background: linear-gradient(120deg, #c4b5fd, #93c5fd);
    color: #2e1065;
  }

  .tag.-e[data-grade="2"] {
    background: linear-gradient(120deg, #86efac, #6ee7b7);
    color: #052e16;
  }

  .tag.-e[data-grade="1"] {
    background: linear-gradient(120deg, #fde68a, #fca5a5);
    color: #431407;
  }

  .tag.-e[data-grade="uc"] {
    background: linear-gradient(120deg, #a5f3fc, #bfdbfe);
    color: #0c1a3a;
  }

  /* ==============================================
     F: ネオングロー
     発光テキスト + 薄枠
     入門: ピンク強発光 + パルスアニメーション
  ============================================== */
  @keyframes glow-pulse {
    0%,
    100% {
      box-shadow: 0 0 6px rgba(244, 63, 94, 0.4);
      border-color: rgba(244, 63, 94, 0.3);
    }

    50% {
      box-shadow:
        0 0 12px rgba(244, 63, 94, 0.7),
        0 0 24px rgba(244, 63, 94, 0.25);
      border-color: rgba(244, 63, 94, 0.6);
    }
  }

  .tag.-f {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid;
  }

  .tag.-f[data-grade="intro"] {
    color: light-dark(#be123c, #fb7185);
    background: light-dark(rgba(244, 63, 94, 0.07), rgba(244, 63, 94, 0.1));
    border-color: rgba(244, 63, 94, 0.3);
    font-weight: 700;
    font-size: 0.82rem;
    padding: 4px 10px;
    animation: glow-pulse 2.5s ease-in-out infinite;
    text-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
  }

  main.light .tag.-f[data-grade="intro"] {
    text-shadow: 0 0 6px rgba(244, 63, 94, 0.3);
  }

  .tag.-f[data-grade="3"] {
    color: light-dark(#7c3aed, #a78bfa);
    background: light-dark(rgba(124, 58, 237, 0.06), rgba(167, 139, 250, 0.09));
    border-color: light-dark(rgba(124, 58, 237, 0.25), rgba(167, 139, 250, 0.28));
    text-shadow: 0 0 8px light-dark(rgba(124, 58, 237, 0.2), rgba(167, 139, 250, 0.5));
  }

  .tag.-f[data-grade="2"] {
    color: light-dark(#0d9488, #2dd4bf);
    background: light-dark(rgba(13, 148, 136, 0.06), rgba(45, 212, 191, 0.09));
    border-color: light-dark(rgba(13, 148, 136, 0.25), rgba(45, 212, 191, 0.28));
    text-shadow: 0 0 8px light-dark(rgba(13, 148, 136, 0.2), rgba(45, 212, 191, 0.5));
  }

  .tag.-f[data-grade="1"] {
    color: light-dark(#b45309, #fcd34d);
    background: light-dark(rgba(180, 83, 9, 0.06), rgba(252, 211, 77, 0.09));
    border-color: light-dark(rgba(180, 83, 9, 0.25), rgba(252, 211, 77, 0.28));
    text-shadow: 0 0 8px light-dark(rgba(180, 83, 9, 0.2), rgba(252, 211, 77, 0.5));
  }

  .tag.-f[data-grade="uc"] {
    color: light-dark(#0284c7, #7dd3fc);
    background: light-dark(rgba(2, 132, 199, 0.06), rgba(125, 211, 252, 0.09));
    border-color: light-dark(rgba(2, 132, 199, 0.25), rgba(125, 211, 252, 0.28));
    text-shadow: 0 0 8px light-dark(rgba(2, 132, 199, 0.2), rgba(125, 211, 252, 0.5));
  }

  main.light .tag.-f[data-grade="3"],
  main.light .tag.-f[data-grade="2"],
  main.light .tag.-f[data-grade="1"],
  main.light .tag.-f[data-grade="uc"] {
    text-shadow: none;
  }

  /* ==============================================
     G: アンダーライン装飾
     ボトムボーダーのみ
     入門: レインボーグラデーション下線 + 太字 + 大きく
  ============================================== */
  .tag.-g {
    padding: 2px 2px 3px;
    font-weight: 600;
  }

  .tag.-g[data-grade="intro"] {
    color: light-dark(#9f1239, #fb7185);
    font-weight: 700;
    font-size: 0.82rem;
    padding-bottom: 4px;
    background:
      linear-gradient(90deg, #f43f5e, #fb923c, #fcd34d) no-repeat bottom / 100% 2.5px;
  }

  .tag.-g[data-grade="3"] {
    color: light-dark(#7c3aed, #a78bfa);
    border-bottom: 1.5px solid light-dark(#a78bfa, #a78bfa);
  }

  .tag.-g[data-grade="2"] {
    color: light-dark(#0d9488, #2dd4bf);
    border-bottom: 1.5px solid light-dark(#0d9488, #2dd4bf);
  }

  .tag.-g[data-grade="1"] {
    color: light-dark(#b45309, #fcd34d);
    border-bottom: 1.5px solid light-dark(#b45309, #fcd34d);
  }

  .tag.-g[data-grade="uc"] {
    color: light-dark(#0284c7, #7dd3fc);
    border-bottom: 1.5px solid light-dark(#0284c7, #7dd3fc);
  }

  /* ==============================================
     H: ブラケットスタイル
     入門: 全角【】括弧 + 暖色 + 大きく
     他: 半角 [ ] モノスペース
  ============================================== */
  .tag.-h {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.72rem;
    letter-spacing: 0;
  }

  .tag.-h[data-grade="intro"] {
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: light-dark(#c2410c, #fb923c);
    letter-spacing: 0.03em;
  }

  .tag.-h[data-grade="intro"]::before {
    content: "【";
    color: light-dark(rgba(194, 65, 12, 0.55), rgba(251, 146, 60, 0.5));
    margin-right: 0;
  }

  .tag.-h[data-grade="intro"]::after {
    content: "】";
    color: light-dark(rgba(194, 65, 12, 0.55), rgba(251, 146, 60, 0.5));
    margin-left: 0;
  }

  .tag.-h[data-grade="3"] {
    color: light-dark(#7c3aed, #a78bfa);
  }

  .tag.-h[data-grade="3"]::before {
    content: "[";
    color: light-dark(rgba(124, 58, 237, 0.4), rgba(167, 139, 250, 0.4));
    margin-right: 1px;
  }

  .tag.-h[data-grade="3"]::after {
    content: "]";
    color: light-dark(rgba(124, 58, 237, 0.4), rgba(167, 139, 250, 0.4));
    margin-left: 1px;
  }

  .tag.-h[data-grade="2"] {
    color: light-dark(#0d9488, #2dd4bf);
  }

  .tag.-h[data-grade="2"]::before {
    content: "[";
    color: light-dark(rgba(13, 148, 136, 0.4), rgba(45, 212, 191, 0.4));
    margin-right: 1px;
  }

  .tag.-h[data-grade="2"]::after {
    content: "]";
    color: light-dark(rgba(13, 148, 136, 0.4), rgba(45, 212, 191, 0.4));
    margin-left: 1px;
  }

  .tag.-h[data-grade="1"] {
    color: light-dark(#b45309, #fcd34d);
  }

  .tag.-h[data-grade="1"]::before {
    content: "[";
    color: light-dark(rgba(180, 83, 9, 0.4), rgba(252, 211, 77, 0.4));
    margin-right: 1px;
  }

  .tag.-h[data-grade="1"]::after {
    content: "]";
    color: light-dark(rgba(180, 83, 9, 0.4), rgba(252, 211, 77, 0.4));
    margin-left: 1px;
  }

  .tag.-h[data-grade="uc"] {
    color: light-dark(#0284c7, #7dd3fc);
  }

  .tag.-h[data-grade="uc"]::before {
    content: "[";
    color: light-dark(rgba(2, 132, 199, 0.4), rgba(125, 211, 252, 0.4));
    margin-right: 1px;
  }

  .tag.-h[data-grade="uc"]::after {
    content: "]";
    color: light-dark(rgba(2, 132, 199, 0.4), rgba(125, 211, 252, 0.4));
    margin-left: 1px;
  }
</style>
