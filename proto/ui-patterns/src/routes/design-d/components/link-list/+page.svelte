<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  const links = [
    { href: "#", title: "色の三属性と表色系", tags: ["入門", "3級"] },
    { href: "#", title: "マンセル表色系", tags: ["3級"] },
    { href: "#", title: "PCCSの色相と色相環", tags: ["3級", "2級"] },
    { href: "#", title: "慣用色名と系統色名", tags: ["入門"] },
    { href: "#", title: "オストワルト表色系", tags: ["2級"] }
  ]

  const tagClass = (tag: string): string => {
    const map: Record<string, string> = {
      入門: "intro",
      "3級": "grade-3",
      "2級": "grade-2",
      "1級": "grade-1",
      UC級: "grade-uc"
    }
    return map[tag] ?? ""
  }
</script>

<main class:light={theme.isLight}>
  <p class="page-title">Link List デザイン案</p>

  <!-- A: 左ティアドロップ -->
  <section class="pattern">
    <p class="pattern-label">A — 左ティアドロップ（border-radius: 50% 50% 50% 0, rotate -45°）</p>
    <ul class="link-list -a">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      各リンクの左側にティアドロップ型のマーカーを配置。border-radius: 50% 50% 50% 0 を -45°
      回転させ、雫が滴り落ちる向きに整える。ホバーで色が変わりスケールが拡大する。
    </p>
  </section>

  <!-- B: オーガニックブロブバレット -->
  <section class="pattern">
    <p class="pattern-label">
      B — オーガニックブロブ（border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%）
    </p>
    <ul class="link-list -b">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      不規則な有機的形状をバレットとして配置。ホバー時に border-radius
      の値が変形し、インクが広がるような動きを見せる。
    </p>
  </section>

  <!-- C: 縦長インクドリップ -->
  <section class="pattern">
    <p class="pattern-label">
      C — 縦長インクドリップ（border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%）
    </p>
    <ul class="link-list -c">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      上部が細く下部が丸い縦長の水滴フォルム。ホバー時に僅かに下方向へ移動し、滴り落ちる動きを表現する。
    </p>
  </section>

  <!-- D: SVGウォータードロップ -->
  <section class="pattern">
    <p class="pattern-label">D — SVGウォータードロップ（インラインSVGパス）</p>
    <ul class="link-list -d">
      {#each links as link}
        <li>
          <a href={link.href}>
            <svg class="ll-drop-svg" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
              <path d="M5,0 C9,4 10,9 5,14 C0,9 1,4 5,0 Z" />
            </svg>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      SVGパスで描いたウォータードロップ型マーカー。ベジェ曲線による正確な雫シルエットをインラインSVGで実現。ホバー時に色とスケールが変化する。
    </p>
  </section>

  <!-- E: ホバー時インクスプラッシュ -->
  <section class="pattern">
    <p class="pattern-label">
      E — ホバー時インクスプラッシュ（border-radius: 70% 30% 60% 40% / 60% 40% 30% 70%）
    </p>
    <ul class="link-list -e">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      通常時はシンプルなテキストのみ。ホバー時に有機的なインクスプラッシュ形状が背後からフェードインし、選択範囲を染めるように広がる。
    </p>
  </section>

  <!-- F: 雫型番号バッジ -->
  <section class="pattern">
    <p class="pattern-label">F — 雫型番号バッジ（border-radius: 50% 50% 50% 0）</p>
    <ul class="link-list -f">
      {#each links as link, i}
        <li>
          <a href={link.href}>
            <span class="ll-num">{i + 1}</span>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      ティアドロップ型のバッジに連番を表示。角ごとに異なる border-radius
      で水滴フォルムを作り、番号付きリストに視覚的なアクセントを加える。
    </p>
  </section>

  <!-- G: インクドリップアンダーライン -->
  <section class="pattern">
    <p class="pattern-label">G — インクドリップアンダーライン（左端雫 ＋ スライドライン）</p>
    <ul class="link-list -g">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      ホバー時に左端の縦長雫シェイプからラインが伸び、テキスト下を流れるようにアンダーラインが展開する。インクが滲んでいく動きを演出。
    </p>
  </section>

  <!-- H: グロー付きウェットドロップ -->
  <section class="pattern">
    <p class="pattern-label">
      H — グロー付きウェットドロップ（border-radius: 50% 50% 50% 50% / 20% 20% 80% 80% ＋
      box-shadow）
    </p>
    <ul class="link-list -h">
      {#each links as link}
        <li>
          <a href={link.href}>
            <span class="ll-title">{link.title}</span>
            <span class="ll-tags">
              {#each link.tags as tag}
                <span class="tag {tagClass(tag)}">{tag}</span>
              {/each}
            </span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="pattern-note">
      縦長の雫型に柔らかいグローを加えた「濡れたインク」の表現。ホバー時にグローが強くなり、雫が浮き上がるような効果を生む。
    </p>
  </section>
</main>

<style>
  /* ===== ページ共通 ===== */
  main {
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
    background: #0c0c14;
    color: #f0f0f0;
    transition:
      background 0.4s,
      color 0.4s;
  }

  main.light {
    background: #ffffff;
    color: #1a1a1a;
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

  /* ===== パターン共通 ===== */
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

  /* ===== タグ共通 ===== */
  .tag {
    display: inline-block;
    font-size: 0.64rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    line-height: 1.5;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .tag.intro {
    background: rgba(255, 185, 60, 0.15);
    color: #ffb440;
  }

  main.light .tag.intro {
    background: rgba(200, 120, 0, 0.08);
    color: #a05800;
  }

  .tag.grade-3 {
    background: rgba(77, 150, 255, 0.12);
    color: #6eb2ff;
  }

  main.light .tag.grade-3 {
    background: rgba(20, 100, 210, 0.08);
    color: #1460cc;
  }

  .tag.grade-2 {
    background: rgba(107, 203, 119, 0.12);
    color: #72d882;
  }

  main.light .tag.grade-2 {
    background: rgba(30, 150, 60, 0.08);
    color: #1a8a30;
  }

  .tag.grade-1 {
    background: rgba(199, 125, 255, 0.12);
    color: #d090ff;
  }

  main.light .tag.grade-1 {
    background: rgba(130, 30, 210, 0.08);
    color: #7a10c0;
  }

  .tag.grade-uc {
    background: rgba(249, 115, 22, 0.12);
    color: #fb923c;
  }

  main.light .tag.grade-uc {
    background: rgba(200, 80, 0, 0.08);
    color: #c05000;
  }

  /* ===== リンクリスト共通ベース ===== */
  .link-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .link-list li a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    padding: 0.5rem 0;
    transition: color 0.2s;
  }

  .ll-title {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.4;
    flex: 1;
    min-width: 0;
  }

  .ll-tags {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    flex-shrink: 0;
  }

  .ll-num {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* =====================================================
     A: 左ティアドロップ
     ===================================================== */
  .link-list.-a li a {
    position: relative;
    padding-left: 1.5rem;
  }

  .link-list.-a li a::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 50%;
    width: 9px;
    height: 9px;
    border-radius: 50% 50% 50% 0;
    transform: translateY(-50%) rotate(-45deg);
    background: #4d96ff;
    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      background 0.2s;
  }

  .link-list.-a li a:hover {
    color: #7dc4ff;
  }

  .link-list.-a li a:hover::before {
    transform: translateY(-50%) rotate(-45deg) scale(1.6);
    background: #38bdf8;
  }

  main.light .link-list.-a li a::before {
    background: #1460cc;
  }

  main.light .link-list.-a li a:hover {
    color: #1460cc;
  }

  main.light .link-list.-a li a:hover::before {
    background: #0284c7;
  }

  /* =====================================================
     B: オーガニックブロブ
     ===================================================== */
  .link-list.-b li a {
    position: relative;
    padding-left: 1.5rem;
  }

  .link-list.-b li a::before {
    content: "";
    position: absolute;
    left: 1px;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: translateY(-50%);
    background: #f97316;
    transition:
      border-radius 0.5s ease,
      transform 0.3s,
      background 0.2s;
  }

  .link-list.-b li a:hover {
    color: #fb923c;
  }

  .link-list.-b li a:hover::before {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: translateY(-50%) scale(1.35);
    background: #ea580c;
  }

  main.light .link-list.-b li a::before {
    background: #ea580c;
  }

  main.light .link-list.-b li a:hover {
    color: #c2410c;
  }

  main.light .link-list.-b li a:hover::before {
    background: #c2410c;
  }

  /* =====================================================
     C: 縦長インクドリップ
     ===================================================== */
  .link-list.-c li a {
    position: relative;
    padding-left: 1.5rem;
  }

  .link-list.-c li a::before {
    content: "";
    position: absolute;
    left: 3px;
    top: 50%;
    width: 6px;
    height: 16px;
    border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;
    transform: translateY(-50%);
    background: #f43f5e;
    transition:
      transform 0.3s ease,
      background 0.2s;
  }

  .link-list.-c li a:hover {
    color: #fb7185;
  }

  .link-list.-c li a:hover::before {
    transform: translateY(-35%);
    background: #e11d48;
  }

  main.light .link-list.-c li a::before {
    background: #e11d48;
  }

  main.light .link-list.-c li a:hover {
    color: #be123c;
  }

  main.light .link-list.-c li a:hover::before {
    background: #be123c;
  }

  /* =====================================================
     D: SVGウォータードロップ
     ===================================================== */
  .link-list.-d li a {
    gap: 0.6rem;
  }

  .ll-drop-svg {
    width: 10px;
    height: 14px;
    fill: #34d399;
    flex-shrink: 0;
    transition:
      fill 0.2s,
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .link-list.-d li a:hover {
    color: #6ee7b7;
  }

  .link-list.-d li a:hover .ll-drop-svg {
    fill: #10b981;
    transform: scale(1.25);
  }

  main.light .ll-drop-svg {
    fill: #059669;
  }

  main.light .link-list.-d li a:hover {
    color: #047857;
  }

  main.light .link-list.-d li a:hover .ll-drop-svg {
    fill: #047857;
  }

  /* =====================================================
     E: ホバー時インクスプラッシュ
     ===================================================== */
  .link-list.-e li a {
    position: relative;
    padding: 0.5rem 0.25rem;
  }

  .link-list.-e li a::before {
    content: "";
    position: absolute;
    left: -8px;
    top: 50%;
    width: calc(100% + 16px);
    height: 150%;
    border-radius: 70% 30% 60% 40% / 60% 40% 30% 70%;
    background: rgba(167, 139, 250, 0.08);
    transform: translateY(-50%) scale(0.82);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 0.3s,
      transform 0.3s;
  }

  .link-list.-e li a:hover {
    color: #c4b5fd;
  }

  .link-list.-e li a:hover::before {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }

  main.light .link-list.-e li a::before {
    background: rgba(124, 58, 237, 0.05);
  }

  main.light .link-list.-e li a:hover {
    color: #7c3aed;
  }

  /* =====================================================
     F: 雫型番号バッジ
     ===================================================== */
  .link-list.-f li a {
    gap: 0.65rem;
  }

  .link-list.-f .ll-num {
    width: 22px;
    height: 26px;
    border-radius: 50% 50% 50% 0;
    background: #7c3aed;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 800;
    line-height: 26px;
    text-align: center;
    flex-shrink: 0;
    transition:
      background 0.2s,
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .link-list.-f li a:hover {
    color: #c4b5fd;
  }

  .link-list.-f li a:hover .ll-num {
    background: #6d28d9;
    transform: scale(1.15);
  }

  main.light .link-list.-f .ll-num {
    background: #4f46e5;
  }

  main.light .link-list.-f li a:hover {
    color: #4f46e5;
  }

  main.light .link-list.-f li a:hover .ll-num {
    background: #4338ca;
  }

  /* =====================================================
     G: インクドリップアンダーライン
     ===================================================== */
  .link-list.-g li a {
    position: relative;
    padding-bottom: 8px;
  }

  /* 左端：縦長雫 */
  .link-list.-g li a::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 6px;
    height: 10px;
    border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;
    background: #22d3ee;
    transform: scaleY(0);
    transform-origin: bottom center;
    transition: transform 0.2s;
  }

  /* 伸びるライン */
  .link-list.-g li a::after {
    content: "";
    position: absolute;
    left: 6px;
    bottom: 4px;
    right: 0;
    height: 2px;
    border-radius: 0 2px 2px 0;
    background: linear-gradient(90deg, #22d3ee, rgba(34, 211, 238, 0.15));
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.3s 0.1s;
  }

  .link-list.-g li a:hover {
    color: #67e8f9;
  }

  .link-list.-g li a:hover::before {
    transform: scaleY(1);
  }

  .link-list.-g li a:hover::after {
    transform: scaleX(1);
  }

  main.light .link-list.-g li a::before {
    background: #0e7490;
  }

  main.light .link-list.-g li a::after {
    background: linear-gradient(90deg, #0e7490, rgba(14, 116, 144, 0.15));
  }

  main.light .link-list.-g li a:hover {
    color: #0e7490;
  }

  /* =====================================================
     H: グロー付きウェットドロップ
     ===================================================== */
  .link-list.-h li a {
    position: relative;
    padding-left: 1.5rem;
  }

  .link-list.-h li a::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 50%;
    width: 8px;
    height: 14px;
    border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;
    transform: translateY(-50%);
    background: #38bdf8;
    box-shadow:
      0 0 6px rgba(56, 189, 248, 0.45),
      0 2px 4px rgba(56, 189, 248, 0.2);
    transition:
      box-shadow 0.3s,
      transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .link-list.-h li a:hover {
    color: #7dd3fc;
  }

  .link-list.-h li a:hover::before {
    box-shadow:
      0 0 16px rgba(56, 189, 248, 0.75),
      0 3px 8px rgba(56, 189, 248, 0.35);
    transform: translateY(-68%);
  }

  main.light .link-list.-h li a::before {
    background: #0284c7;
    box-shadow:
      0 0 6px rgba(2, 132, 199, 0.3),
      0 2px 4px rgba(2, 132, 199, 0.15);
  }

  main.light .link-list.-h li a:hover {
    color: #0284c7;
  }

  main.light .link-list.-h li a:hover::before {
    box-shadow:
      0 0 14px rgba(2, 132, 199, 0.55),
      0 3px 8px rgba(2, 132, 199, 0.25);
  }
</style>
