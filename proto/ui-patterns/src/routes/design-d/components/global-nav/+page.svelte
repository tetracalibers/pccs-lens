<script lang="ts">
  import { resolve } from "$app/paths"
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  const tools = [{ label: "カラー分析" }, { label: "パレット生成" }, { label: "配色チェッカー" }]
  const contents = [
    {
      category: "基礎知識",
      color: "#4d96ff",
      items: [{ label: "PCCSとは" }, { label: "色相環" }, { label: "トーン体系" }]
    },
    {
      category: "配色技法",
      color: "#c77dff",
      items: [{ label: "補色配色" }, { label: "類似色配色" }, { label: "アクセント配色" }]
    },
    {
      category: "応用",
      color: "#6bcb77",
      items: [{ label: "自然界の色" }, { label: "デザインの配色" }]
    }
  ]

  // Wide用: カテゴリ開閉
  let openA = $state<string | null>(null)
  let openC = $state(false)
  let openE = $state<string | null>(null)
  let openF = $state<string | null>(null)
  let openH = $state<string | null>(null)

  // Narrow A: アコーディオン
  let mobileOpenA = $state(false)

  // Narrow B: カテゴリ選択ステップ
  let mobileBCat = $state<string | null>(null)

  // Narrow C: セクションタブ
  let mobileCTab = $state<"tools" | "contents">("tools")
  let mobileCOpen = $state(false)

  // Narrow D: カテゴリグリッド→リンク
  let mobileDCat = $state<string | null>(null)

  // Narrow E: セグメントコントロール
  let mobileESeg = $state<"tools" | string>("tools")

  // Narrow F: 常時展開ミニグリッド（トグル不要）

  // Narrow G: スペクトルセクション選択
  let mobileGSec = $state<"tools" | string | null>(null)

  // Narrow H: ドロワー風折りたたみ
  let mobileHOpen = $state(false)

  $effect(() => {
    document.body.style.background = theme.isLight ? "#ffffff" : "#0c0c14"
    document.body.style.color = theme.isLight ? "#1a1a1a" : "#d8d8e8"
    return () => {
      document.body.style.background = ""
      document.body.style.color = ""
    }
  })
</script>

<svelte:head>
  <title>グローバルナビゲーション - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <header class="page-header">
    <p class="eyebrow">Design D / Components</p>
    <h1>グローバルナビゲーション</h1>
    <p class="subtitle">
      ヘッダーに組み込むナビゲーション案。「ツール群」と「コンテンツ群（カテゴリ階層あり）」をグルーピング・階層化して表示する。
    </p>
  </header>

  <!-- ===== 案A: ホバードロップダウン型 ===== -->
  <section class="pattern">
    <p class="pattern-label">A — ホバードロップダウン型</p>
    <p class="pattern-desc">
      ツール・コンテンツをトップレベルに並べ、コンテンツカテゴリはクリックでドロップダウンを展開。Narrow:
      アコーディオン（「ツールとコンテンツを探す」）。
    </p>

    <div class="demo-row">
      <!-- Wide -->
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-a" class:light={theme.isLight}>
          <div class="a-group">
            <span class="a-group-label">ツール</span>
            {#each tools as tool (tool.label)}
              <a href="#" class="a-link">{tool.label}</a>
            {/each}
          </div>
          <div class="a-sep"></div>
          <div class="a-group">
            <span class="a-group-label">コンテンツ</span>
            {#each contents as cat (cat.category)}
              <div class="a-dropdown-wrap">
                <button
                  class="a-dropdown-btn"
                  onclick={() => (openA = openA === cat.category ? null : cat.category)}
                  aria-expanded={openA === cat.category}
                >
                  {cat.category}
                  <span class="chevron" class:open={openA === cat.category}>▾</span>
                </button>
                {#if openA === cat.category}
                  <div class="a-dropdown">
                    {#each cat.items as item (item.label)}
                      <a href="#" class="a-drop-item">{item.label}</a>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </nav>
      </div>

      <!-- Narrow A: アコーディオン折りたたみ -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — アコーディオン</p>
        <nav class="nav-a-narrow" class:light={theme.isLight}>
          <button
            class="a-n-toggle"
            onclick={() => (mobileOpenA = !mobileOpenA)}
            aria-expanded={mobileOpenA}
          >
            <span>ツールとコンテンツを探す</span>
            <span class="chevron" class:open={mobileOpenA}>▾</span>
          </button>
          {#if mobileOpenA}
            <div class="a-n-panel">
              <p class="a-n-sec">ツール</p>
              {#each tools as tool (tool.label)}
                <a href="#" class="a-n-link">{tool.label}</a>
              {/each}
              {#each contents as cat (cat.category)}
                <details class="a-n-details">
                  <summary class="a-n-cat" style="--cc:{cat.color}">{cat.category}</summary>
                  <div class="a-n-sub">
                    {#each cat.items as item (item.label)}
                      <a href="#" class="a-n-item" style="--cc:{cat.color}">{item.label}</a>
                    {/each}
                  </div>
                </details>
              {/each}
            </div>
          {/if}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案B: カラーバッジ型 ===== -->
  <section class="pattern">
    <p class="pattern-label">B — カラーバッジ型</p>
    <p class="pattern-desc">
      カテゴリをカラーバッジで色分けし、リンクをピル形状で並べる。Narrow:
      カテゴリバッジをタップして対応リンクを切り替える2ステップ選択。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-b" class:light={theme.isLight}>
          <div class="b-section">
            <span class="b-badge" style="--bc:#ff6b6b">ツール</span>
            {#each tools as tool (tool.label)}
              <a href="#" class="b-pill" style="--bc:#ff6b6b">{tool.label}</a>
            {/each}
          </div>
          <div class="b-divider"></div>
          {#each contents as cat (cat.category)}
            <div class="b-section">
              <span class="b-badge" style="--bc:{cat.color}">{cat.category}</span>
              {#each cat.items as item (item.label)}
                <a href="#" class="b-pill" style="--bc:{cat.color}">{item.label}</a>
              {/each}
            </div>
          {/each}
        </nav>
      </div>

      <!-- Narrow B: カテゴリバッジ選択→リンク切り替え -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — バッジ選択ステップ</p>
        <nav class="nav-b-narrow" class:light={theme.isLight}>
          <p class="b-n-hint">カテゴリを選ぶ</p>
          <div class="b-n-cats">
            <button
              class="b-n-badge-btn"
              style="--bc:#ff6b6b"
              class:active={mobileBCat === "tools"}
              onclick={() => (mobileBCat = mobileBCat === "tools" ? null : "tools")}
            >
              ツール
            </button>
            {#each contents as cat (cat.category)}
              <button
                class="b-n-badge-btn"
                style="--bc:{cat.color}"
                class:active={mobileBCat === cat.category}
                onclick={() => (mobileBCat = mobileBCat === cat.category ? null : cat.category)}
              >
                {cat.category}
              </button>
            {/each}
          </div>
          {#if mobileBCat === "tools"}
            <div class="b-n-links">
              {#each tools as tool (tool.label)}
                <a href="#" class="b-pill b-n-pill" style="--bc:#ff6b6b">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#each contents as cat (cat.category)}
            {#if mobileBCat === cat.category}
              <div class="b-n-links">
                {#each cat.items as item (item.label)}
                  <a href="#" class="b-pill b-n-pill" style="--bc:{cat.color}">{item.label}</a>
                {/each}
              </div>
            {/if}
          {/each}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案C: メガメニュー型 ===== -->
  <section class="pattern">
    <p class="pattern-label">C — メガメニュー型</p>
    <p class="pattern-desc">
      「コンテンツ」ボタンでカテゴリ横並びのパネルを展開。Narrow:
      「ツール」「コンテンツ」の切り替えタブを常時表示し、タップで対応リンクを表示。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-c" class:light={theme.isLight}>
          <div class="c-bar">
            <div class="c-tools">
              {#each tools as tool (tool.label)}
                <a href="#" class="c-tool-link">{tool.label}</a>
              {/each}
            </div>
            <div class="c-sep"></div>
            <button class="c-content-btn" onclick={() => (openC = !openC)} aria-expanded={openC}>
              コンテンツ
              <span class="chevron" class:open={openC}>▾</span>
            </button>
          </div>
          {#if openC}
            <div class="c-mega">
              {#each contents as cat (cat.category)}
                <div class="c-col">
                  <p class="c-col-head" style="color:{cat.color}">{cat.category}</p>
                  {#each cat.items as item (item.label)}
                    <a href="#" class="c-col-link">{item.label}</a>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </nav>
      </div>

      <!-- Narrow C: 切り替えタブ常時表示 -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — セクションタブ</p>
        <nav class="nav-c-narrow" class:light={theme.isLight}>
          <div class="c-n-tabs">
            <button
              class="c-n-tab"
              class:active={mobileCTab === "tools"}
              onclick={() => {
                mobileCTab = "tools"
                mobileCOpen = true
              }}
            >
              ツール
            </button>
            <button
              class="c-n-tab"
              class:active={mobileCTab === "contents"}
              onclick={() => {
                mobileCTab = "contents"
                mobileCOpen = true
              }}
            >
              コンテンツ
            </button>
            {#if mobileCOpen}
              <button class="c-n-close" onclick={() => (mobileCOpen = false)} aria-label="閉じる">
                ✕
              </button>
            {/if}
          </div>
          {#if mobileCOpen && mobileCTab === "tools"}
            <div class="c-n-panel">
              {#each tools as tool (tool.label)}
                <a href="#" class="c-n-link">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#if mobileCOpen && mobileCTab === "contents"}
            <div class="c-n-panel c-n-grid">
              {#each contents as cat (cat.category)}
                <div class="c-n-col">
                  <p class="c-col-head" style="color:{cat.color}">{cat.category}</p>
                  {#each cat.items as item (item.label)}
                    <a href="#" class="c-n-item">{item.label}</a>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案D: 蛍光グロー型 ===== -->
  <section class="pattern">
    <p class="pattern-label">D — 蛍光グロー型</p>
    <p class="pattern-desc">
      カテゴリをネオン色で区別し、ホバーで発光エフェクト。Narrow:
      カテゴリをグリッドボタンで選択し、対応リンクをその下に展開。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-d" class:light={theme.isLight}>
          <div class="d-group">
            <span class="d-label" style="--gc:#ff6b6b">ツール</span>
            {#each tools as tool (tool.label)}
              <a href="#" class="d-link" style="--gc:#ff6b6b">{tool.label}</a>
            {/each}
          </div>
          {#each contents as cat (cat.category)}
            <div class="d-group">
              <span class="d-label" style="--gc:{cat.color}">{cat.category}</span>
              {#each cat.items as item (item.label)}
                <a href="#" class="d-link" style="--gc:{cat.color}">{item.label}</a>
              {/each}
            </div>
          {/each}
        </nav>
      </div>

      <!-- Narrow D: カテゴリグリッド→リンク展開 -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — カテゴリ選択グリッド</p>
        <nav class="nav-d-narrow" class:light={theme.isLight}>
          <div class="d-n-grid">
            <button
              class="d-n-cat-btn"
              style="--gc:#ff6b6b"
              class:active={mobileDCat === "tools"}
              onclick={() => (mobileDCat = mobileDCat === "tools" ? null : "tools")}
            >
              <span class="d-n-glow" style="background:#ff6b6b"></span>
              ツール
            </button>
            {#each contents as cat (cat.category)}
              <button
                class="d-n-cat-btn"
                style="--gc:{cat.color}"
                class:active={mobileDCat === cat.category}
                onclick={() => (mobileDCat = mobileDCat === cat.category ? null : cat.category)}
              >
                <span class="d-n-glow" style="background:{cat.color}"></span>
                {cat.category}
              </button>
            {/each}
          </div>
          {#if mobileDCat === "tools"}
            <div class="d-n-links">
              {#each tools as tool (tool.label)}
                <a href="#" class="d-link d-n-link" style="--gc:#ff6b6b">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#each contents as cat (cat.category)}
            {#if mobileDCat === cat.category}
              <div class="d-n-links">
                {#each cat.items as item (item.label)}
                  <a href="#" class="d-link d-n-link" style="--gc:{cat.color}">{item.label}</a>
                {/each}
              </div>
            {/if}
          {/each}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案E: 縦仕切り + カラーアクセント型 ===== -->
  <section class="pattern">
    <p class="pattern-label">E — 縦仕切り + カラーアクセント型</p>
    <p class="pattern-desc">
      縦線でグループを仕切り、カテゴリ名にカラーバーを添える。Narrow:
      「ツール」「コンテンツ」のセグメントコントロール常時表示、選択で対応リンクを切り替え。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-e" class:light={theme.isLight}>
          <div class="e-block">
            <span class="e-group-name">ツール</span>
            <div class="e-links">
              {#each tools as tool (tool.label)}
                <a href="#" class="e-link" style="--ec:#ff6b6b">{tool.label}</a>
              {/each}
            </div>
          </div>
          <div class="e-vline"></div>
          <div class="e-block">
            <span class="e-group-name">コンテンツ</span>
            <div class="e-links">
              {#each contents as cat (cat.category)}
                <div class="e-cat-wrap">
                  <button
                    class="e-cat-btn"
                    onclick={() => (openE = openE === cat.category ? null : cat.category)}
                    aria-expanded={openE === cat.category}
                  >
                    <span class="e-cat-bar" style="background:{cat.color}"></span>
                    {cat.category}
                    <span class="chevron" class:open={openE === cat.category}>▾</span>
                  </button>
                  {#if openE === cat.category}
                    <div class="e-cat-items">
                      {#each cat.items as item (item.label)}
                        <a href="#" class="e-cat-item" style="--ec:{cat.color}">{item.label}</a>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </nav>
      </div>

      <!-- Narrow E: セグメントコントロール -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — セグメントコントロール</p>
        <nav class="nav-e-narrow" class:light={theme.isLight}>
          <div class="e-n-seg">
            <button
              class="e-n-seg-btn"
              class:active={mobileESeg === "tools"}
              onclick={() => (mobileESeg = "tools")}
            >
              ツール
            </button>
            {#each contents as cat (cat.category)}
              <button
                class="e-n-seg-btn"
                style="--sc:{cat.color}"
                class:active={mobileESeg === cat.category}
                onclick={() => (mobileESeg = cat.category)}
              >
                {cat.category}
              </button>
            {/each}
          </div>
          {#if mobileESeg === "tools"}
            <div class="e-n-panel">
              {#each tools as tool (tool.label)}
                <a href="#" class="e-link e-n-link" style="--ec:#ff6b6b">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#each contents as cat (cat.category)}
            {#if mobileESeg === cat.category}
              <div class="e-n-panel">
                {#each cat.items as item (item.label)}
                  <a href="#" class="e-cat-item e-n-item" style="--ec:{cat.color}">{item.label}</a>
                {/each}
              </div>
            {/if}
          {/each}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案F: グラデーションタブ型 ===== -->
  <section class="pattern">
    <p class="pattern-label">F — グラデーションタブ型</p>
    <p class="pattern-desc">
      ツール・コンテンツをタブで切り替え、選択タブはグラデーション下線で強調。Narrow:
      トグルなし常時展開のミニカードグリッド。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-f" class:light={theme.isLight}>
          <div class="f-tabs">
            <button
              class="f-tab"
              class:active={openF === "tools"}
              onclick={() => (openF = openF === "tools" ? null : "tools")}
            >
              ツール
            </button>
            <button
              class="f-tab"
              class:active={openF === "contents"}
              onclick={() => (openF = openF === "contents" ? null : "contents")}
            >
              コンテンツ
            </button>
          </div>
          {#if openF === "tools"}
            <div class="f-panel">
              {#each tools as tool (tool.label)}
                <a href="#" class="f-tool-link">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#if openF === "contents"}
            <div class="f-panel f-content-panel">
              {#each contents as cat (cat.category)}
                <div class="f-cat">
                  <p class="f-cat-name" style="--fc:{cat.color}">{cat.category}</p>
                  {#each cat.items as item (item.label)}
                    <a href="#" class="f-item" style="--fc:{cat.color}">{item.label}</a>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </nav>
      </div>

      <!-- Narrow F: トグルなし・常時展開ミニカードグリッド -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — 常時展開カードグリッド</p>
        <nav class="nav-f-narrow" class:light={theme.isLight}>
          <a
            href="#"
            class="f-n-card"
            style="--fc:#ff6b6b; --fg:linear-gradient(135deg,#ff6b6b,#ffd93d)"
          >
            <span class="f-n-card-bar"></span>
            <span class="f-n-card-label">カラー分析</span>
          </a>
          <a
            href="#"
            class="f-n-card"
            style="--fc:#ff6b6b; --fg:linear-gradient(135deg,#ffd93d,#ff6b6b)"
          >
            <span class="f-n-card-bar"></span>
            <span class="f-n-card-label">パレット生成</span>
          </a>
          <a
            href="#"
            class="f-n-card"
            style="--fc:#ff6b6b; --fg:linear-gradient(135deg,#ff9f43,#ff6b6b)"
          >
            <span class="f-n-card-bar"></span>
            <span class="f-n-card-label">配色チェッカー</span>
          </a>
          {#each contents as cat (cat.category)}
            {#each cat.items as item (item.label)}
              <a
                href="#"
                class="f-n-card"
                style="--fc:{cat.color}; --fg:linear-gradient(135deg,{cat.color},{cat.color}88)"
              >
                <span class="f-n-card-bar"></span>
                <span class="f-n-card-label">{item.label}</span>
                <span class="f-n-card-cat" style="color:{cat.color}">{cat.category}</span>
              </a>
            {/each}
          {/each}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案G: スペクトル帯型 ===== -->
  <section class="pattern">
    <p class="pattern-label">G — スペクトル帯型</p>
    <p class="pattern-desc">
      虹色スペクトルバー＋カテゴリ別カラーのリンク。Narrow:
      スペクトルバーをカテゴリ別ゾーンに分割し、タップで対応リンクをその下に表示。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-g" class:light={theme.isLight}>
          <div class="g-spectrum-bar" aria-hidden="true"></div>
          <div class="g-content">
            <div class="g-group">
              {#each tools as tool (tool.label)}
                <a href="#" class="g-link" style="--gc:#ff9f43">{tool.label}</a>
              {/each}
            </div>
            <div class="g-divider"></div>
            {#each contents as cat (cat.category)}
              <div class="g-group">
                <span class="g-cat" style="--gc:{cat.color}">{cat.category}</span>
                {#each cat.items as item (item.label)}
                  <a href="#" class="g-link" style="--gc:{cat.color}">{item.label}</a>
                {/each}
              </div>
            {/each}
          </div>
        </nav>
      </div>

      <!-- Narrow G: スペクトルゾーンナビ -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — スペクトルゾーン選択</p>
        <nav class="nav-g-narrow" class:light={theme.isLight}>
          <div class="g-n-zones" role="group" aria-label="カテゴリを選ぶ">
            <button
              class="g-n-zone"
              style="background:linear-gradient(135deg,#ff6b6b,#ff9f43)"
              class:active={mobileGSec === "tools"}
              onclick={() => (mobileGSec = mobileGSec === "tools" ? null : "tools")}
            >
              ツール
            </button>
            {#each contents as cat (cat.category)}
              <button
                class="g-n-zone"
                style="background:{cat.color}"
                class:active={mobileGSec === cat.category}
                onclick={() => (mobileGSec = mobileGSec === cat.category ? null : cat.category)}
              >
                {cat.category}
              </button>
            {/each}
          </div>
          {#if mobileGSec === "tools"}
            <div class="g-n-links">
              {#each tools as tool (tool.label)}
                <a href="#" class="g-link g-n-link" style="--gc:#ff9f43">{tool.label}</a>
              {/each}
            </div>
          {/if}
          {#each contents as cat (cat.category)}
            {#if mobileGSec === cat.category}
              <div class="g-n-links">
                {#each cat.items as item (item.label)}
                  <a href="#" class="g-link g-n-link" style="--gc:{cat.color}">{item.label}</a>
                {/each}
              </div>
            {/if}
          {/each}
        </nav>
      </div>
    </div>
  </section>

  <!-- ===== 案H: ドット + テキスト階層型 ===== -->
  <section class="pattern">
    <p class="pattern-label">H — ドット + テキスト階層型</p>
    <p class="pattern-desc">
      カラードットでカテゴリを示しドロップダウンを展開。Narrow:
      「全ページを開く」でドロワー風の縦ツリーリストをアニメーション展開。
    </p>

    <div class="demo-row">
      <div class="demo-frame demo-wide">
        <p class="demo-label">Wide</p>
        <nav class="nav-h" class:light={theme.isLight}>
          <div class="h-section">
            <div class="h-section-label">
              <span class="h-dot" style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"></span>
              <span>ツール</span>
            </div>
            <div class="h-links">
              {#each tools as tool (tool.label)}
                <a href="#" class="h-link" style="--hc:#ff6b6b">{tool.label}</a>
              {/each}
            </div>
          </div>
          <div class="h-sep"></div>
          <div class="h-section">
            <div class="h-section-label">
              <span
                class="h-dot"
                style="background:linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)"
              ></span>
              <span>コンテンツ</span>
            </div>
            <div class="h-links">
              {#each contents as cat (cat.category)}
                <div class="h-cat-wrap">
                  <button
                    class="h-cat-btn"
                    onclick={() => (openH = openH === cat.category ? null : cat.category)}
                    aria-expanded={openH === cat.category}
                  >
                    <span class="h-cat-dot" style="background:{cat.color}"></span>
                    {cat.category}
                    <span class="chevron" class:open={openH === cat.category}>▾</span>
                  </button>
                  {#if openH === cat.category}
                    <div class="h-cat-popup">
                      {#each cat.items as item (item.label)}
                        <a href="#" class="h-popup-link" style="--hc:{cat.color}">{item.label}</a>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </nav>
      </div>

      <!-- Narrow H: ドロワー風ツリーリスト -->
      <div class="demo-frame demo-narrow">
        <p class="demo-label">Narrow — ドロワー風ツリー</p>
        <nav class="nav-h-narrow" class:light={theme.isLight}>
          <button
            class="h-n-toggle"
            onclick={() => (mobileHOpen = !mobileHOpen)}
            aria-expanded={mobileHOpen}
          >
            <span class="h-n-toggle-dots" aria-hidden="true">
              {#each ["#ff6b6b", "#4d96ff", "#c77dff", "#6bcb77"] as c (c)}
                <span style="background:{c}; box-shadow:0 0 5px {c}55"></span>
              {/each}
            </span>
            全ページを開く
            <span class="chevron" class:open={mobileHOpen}>▾</span>
          </button>
          {#if mobileHOpen}
            <div class="h-n-drawer">
              <p class="h-n-tree-sec">
                <span
                  class="h-dot"
                  style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"
                ></span>
                ツール
              </p>
              {#each tools as tool (tool.label)}
                <a href="#" class="h-n-tree-link" style="--hc:#ff6b6b">
                  <span class="h-n-tree-dot" style="background:#ff6b6b"></span>
                  {tool.label}
                </a>
              {/each}
              <p class="h-n-tree-sec">
                <span
                  class="h-dot"
                  style="background:linear-gradient(135deg,#4d96ff,#c77dff)"
                ></span>
                コンテンツ
              </p>
              {#each contents as cat (cat.category)}
                <p class="h-n-tree-cat" style="--hc:{cat.color}">
                  <span class="h-cat-dot" style="background:{cat.color}"></span>
                  {cat.category}
                </p>
                {#each cat.items as item (item.label)}
                  <a href="#" class="h-n-tree-item" style="--hc:{cat.color}">
                    <span class="h-n-tree-line" style="border-color:{cat.color}44"></span>
                    {item.label}
                  </a>
                {/each}
              {/each}
            </div>
          {/if}
        </nav>
      </div>
    </div>
  </section>

  <footer class="page-footer">
    <a href={resolve("/design-d/components")} class="back-link">← コンポーネント一覧に戻る</a>
  </footer>
</main>

<style>
  /* ============================
   * ページ共通
   * ============================ */
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
    background: #0c0c14;
    color: #f0f0f0;
    min-height: 100vh;
    transition:
      background 0.4s,
      color 0.4s;
  }
  main.light {
    background: #ffffff;
    color: #1a1a1a;
  }

  .page-header {
    margin-bottom: 3rem;
  }

  .eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #555;
    margin: 0 0 0.5rem;
    transition: color 0.4s;
  }
  .light .eyebrow {
    color: #999;
  }

  h1 {
    font-size: 2rem;
    font-weight: 900;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.88rem;
    color: #666;
    margin: 0;
    transition: color 0.4s;
  }
  .light .subtitle {
    color: #888;
  }

  .pattern {
    margin-bottom: 4rem;
    padding-bottom: 3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: border-color 0.4s;
  }
  .light .pattern {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .pattern-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #888;
    margin: 0 0 0.4rem;
  }

  .pattern-desc {
    font-size: 0.85rem;
    color: #666;
    margin: 0 0 1.5rem;
  }
  .light .pattern-desc {
    color: #888;
  }

  .demo-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .demo-frame {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 1rem;
    transition:
      background 0.4s,
      border-color 0.4s;
  }
  .light .demo-frame {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .demo-wide {
    flex: 1;
    min-width: 300px;
  }
  .demo-narrow {
    width: 210px;
    flex-shrink: 0;
  }

  .demo-label {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #555;
    margin: 0 0 0.75rem;
  }
  .light .demo-label {
    color: #aaa;
  }

  /* 共通ユーティリティ */
  .chevron {
    display: inline-block;
    transition: transform 0.2s;
    font-size: 0.8em;
  }
  .chevron.open {
    transform: rotate(180deg);
  }

  /* ============================
   * 案A Wide
   * ============================ */
  .nav-a {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
  }

  .a-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .a-group-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    transition: color 0.4s;
  }
  .light .a-group-label {
    color: #aaa;
  }

  .a-link {
    color: #bbb;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .a-link {
    color: #555;
  }
  .light .a-link:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .a-sep {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.12);
    align-self: center;
    flex-shrink: 0;
  }
  .light .a-sep {
    background: rgba(0, 0, 0, 0.12);
  }

  .a-dropdown-wrap {
    position: relative;
  }

  .a-dropdown-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    font-size: 0.82rem;
    padding: 4px 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-dropdown-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .a-dropdown-btn {
    color: #555;
  }
  .light .a-dropdown-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .a-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px;
    min-width: 120px;
    z-index: 10;
  }
  .light .a-dropdown {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .a-drop-item {
    display: block;
    padding: 5px 10px;
    color: #bbb;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-drop-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .a-drop-item {
    color: #555;
  }
  .light .a-drop-item:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  /* 案A Narrow: アコーディオン */
  .nav-a-narrow {
    font-size: 0.82rem;
  }

  .a-n-toggle {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 6px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-n-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .light .a-n-toggle {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
    color: #444;
  }
  .light .a-n-toggle:hover {
    background: rgba(0, 0, 0, 0.07);
    color: #111;
  }

  .a-n-panel {
    margin-top: 6px;
    background: #14142a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 8px;
  }
  .light .a-n-panel {
    background: #f8f8f8;
    border-color: rgba(0, 0, 0, 0.08);
  }

  .a-n-sec {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    margin: 6px 0 4px;
    padding-left: 4px;
  }
  .light .a-n-sec {
    color: #aaa;
  }

  .a-n-link {
    display: block;
    padding: 5px 8px;
    color: #bbb;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-n-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .a-n-link {
    color: #555;
  }
  .light .a-n-link:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  .a-n-details summary {
    list-style: none;
  }

  .a-n-cat {
    cursor: pointer;
    padding: 5px 8px;
    color: #bbb;
    font-size: 0.8rem;
    border-radius: 4px;
    border-left: 3px solid var(--cc);
    margin: 3px 0;
    display: block;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .a-n-cat:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }
  .light .a-n-cat {
    color: #555;
  }
  .light .a-n-cat:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }

  .a-n-sub {
    padding: 2px 0 4px 14px;
  }

  .a-n-item {
    display: block;
    padding: 4px 6px;
    color: #999;
    text-decoration: none;
    font-size: 0.78rem;
    border-radius: 4px;
    transition:
      color 0.15s,
      background 0.15s;
  }
  .a-n-item:hover {
    color: var(--cc);
    background: color-mix(in srgb, var(--cc) 8%, transparent);
  }
  .light .a-n-item {
    color: #888;
  }

  /* ============================
   * 案B Wide
   * ============================ */
  .nav-b {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
  }

  .b-section {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .b-badge {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #fff;
    background: var(--bc);
    padding: 2px 8px;
    border-radius: 20px;
  }

  .b-pill {
    font-size: 0.78rem;
    color: var(--bc);
    text-decoration: none;
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--bc) 30%, transparent);
    background: color-mix(in srgb, var(--bc) 8%, transparent);
    transition:
      background 0.15s,
      border-color 0.15s,
      transform 0.15s;
    display: inline-block;
  }
  .b-pill:hover {
    background: color-mix(in srgb, var(--bc) 20%, transparent);
    border-color: color-mix(in srgb, var(--bc) 60%, transparent);
    transform: translateY(-1px);
  }
  .light .b-pill {
    background: color-mix(in srgb, var(--bc) 10%, transparent);
    border-color: color-mix(in srgb, var(--bc) 40%, transparent);
  }

  .b-divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
  .light .b-divider {
    background: rgba(0, 0, 0, 0.1);
  }

  /* 案B Narrow: バッジ選択→リンク切り替え */
  .nav-b-narrow {
    font-size: 0.82rem;
  }

  .b-n-hint {
    font-size: 0.65rem;
    color: #555;
    margin: 0 0 6px;
    letter-spacing: 0.05em;
  }
  .light .b-n-hint {
    color: #aaa;
  }

  .b-n-cats {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 8px;
  }

  .b-n-badge-btn {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--bc);
    background: color-mix(in srgb, var(--bc) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--bc) 35%, transparent);
    padding: 4px 10px;
    border-radius: 20px;
    cursor: pointer;
    transition:
      background 0.15s,
      transform 0.15s,
      box-shadow 0.15s;
  }
  .b-n-badge-btn:hover {
    background: color-mix(in srgb, var(--bc) 22%, transparent);
    transform: translateY(-1px);
  }
  .b-n-badge-btn.active {
    background: var(--bc);
    color: #fff;
    box-shadow: 0 2px 10px color-mix(in srgb, var(--bc) 40%, transparent);
  }

  .b-n-links {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 4px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .light .b-n-links {
    border-top-color: rgba(0, 0, 0, 0.06);
  }

  .b-n-pill {
    font-size: 0.75rem;
  }

  /* ============================
   * 案C Wide
   * ============================ */
  .nav-c {
    font-size: 0.82rem;
  }

  .c-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .c-tools {
    display: flex;
    gap: 0.25rem;
  }

  .c-tool-link {
    color: #bbb;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .c-tool-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .c-tool-link {
    color: #555;
  }
  .light .c-tool-link:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .c-sep {
    width: 1px;
    height: 18px;
    background: rgba(255, 255, 255, 0.12);
  }
  .light .c-sep {
    background: rgba(0, 0, 0, 0.12);
  }

  .c-content-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    font-size: 0.82rem;
    padding: 4px 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .c-content-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .c-content-btn {
    color: #555;
  }
  .light .c-content-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .c-mega {
    margin-top: 8px;
    background: #14142a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    gap: 2rem;
  }
  .light .c-mega {
    background: #f8f8f8;
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .c-col {
    flex: 1;
  }

  .c-col-head {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0 0 0.6rem;
  }

  .c-col-link {
    display: block;
    padding: 4px 0;
    color: #bbb;
    text-decoration: none;
    font-size: 0.82rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition:
      color 0.15s,
      padding-left 0.15s;
  }
  .c-col-link:last-child {
    border-bottom: none;
  }
  .c-col-link:hover {
    color: #fff;
    padding-left: 4px;
  }
  .light .c-col-link {
    color: #555;
    border-bottom-color: rgba(0, 0, 0, 0.06);
  }
  .light .c-col-link:hover {
    color: #111;
  }

  /* 案C Narrow: セクションタブ常時表示 */
  .nav-c-narrow {
    font-size: 0.82rem;
  }

  .c-n-tabs {
    display: flex;
    gap: 3px;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 6px;
  }
  .light .c-n-tabs {
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }

  .c-n-tab {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 4px 4px 0 0;
    position: relative;
    transition: color 0.2s;
  }
  .c-n-tab:hover {
    color: #ccc;
  }
  .c-n-tab.active {
    color: #fff;
  }
  .c-n-tab.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4d96ff, #c77dff);
  }
  .light .c-n-tab {
    color: #aaa;
  }
  .light .c-n-tab:hover {
    color: #444;
  }
  .light .c-n-tab.active {
    color: #111;
  }

  .c-n-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: #555;
    font-size: 0.75rem;
    padding: 4px 6px;
    border-radius: 4px;
    transition: color 0.15s;
  }
  .c-n-close:hover {
    color: #ccc;
  }
  .light .c-n-close {
    color: #bbb;
  }
  .light .c-n-close:hover {
    color: #333;
  }

  .c-n-panel {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .c-n-link {
    display: block;
    padding: 5px 6px;
    color: #bbb;
    text-decoration: none;
    font-size: 0.8rem;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .c-n-link:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
  }
  .light .c-n-link {
    color: #555;
  }
  .light .c-n-link:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  .c-n-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    flex-direction: unset;
  }

  .c-n-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .c-n-item {
    display: block;
    color: #999;
    text-decoration: none;
    font-size: 0.75rem;
    padding: 3px 2px;
    transition: color 0.15s;
  }
  .c-n-item:hover {
    color: #ddd;
  }
  .light .c-n-item {
    color: #888;
  }
  .light .c-n-item:hover {
    color: #222;
  }

  /* ============================
   * 案D Wide
   * ============================ */
  .nav-d {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
  }

  .d-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .d-label {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gc);
    opacity: 0.7;
    text-shadow: 0 0 8px color-mix(in srgb, var(--gc) 50%, transparent);
  }

  .d-link {
    color: #aaa;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid transparent;
    font-size: 0.82rem;
    transition:
      color 0.2s,
      border-color 0.2s,
      text-shadow 0.2s,
      background 0.2s;
  }
  .d-link:hover {
    color: var(--gc);
    border-color: color-mix(in srgb, var(--gc) 30%, transparent);
    text-shadow: 0 0 10px color-mix(in srgb, var(--gc) 60%, transparent);
    background: color-mix(in srgb, var(--gc) 6%, transparent);
  }
  .light .d-link {
    color: #666;
  }
  .light .d-link:hover {
    color: var(--gc);
    background: color-mix(in srgb, var(--gc) 8%, transparent);
    text-shadow: none;
  }

  /* 案D Narrow: カテゴリグリッドボタン→リンク展開 */
  .nav-d-narrow {
    font-size: 0.82rem;
  }

  .d-n-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    margin-bottom: 8px;
  }

  .d-n-cat-btn {
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid color-mix(in srgb, var(--gc) 20%, transparent);
    border-radius: 6px;
    color: var(--gc);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 8px 10px;
    text-align: left;
    transition:
      background 0.15s,
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .d-n-cat-btn:hover {
    background: color-mix(in srgb, var(--gc) 10%, transparent);
    border-color: color-mix(in srgb, var(--gc) 45%, transparent);
  }
  .d-n-cat-btn.active {
    background: color-mix(in srgb, var(--gc) 15%, transparent);
    border-color: var(--gc);
    box-shadow: 0 0 10px color-mix(in srgb, var(--gc) 30%, transparent);
  }
  .light .d-n-cat-btn {
    background: color-mix(in srgb, var(--gc) 6%, transparent);
  }

  .d-n-glow {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    opacity: 0.3;
    filter: blur(8px);
  }

  .d-n-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .light .d-n-links {
    border-top-color: rgba(0, 0, 0, 0.06);
  }

  .d-n-link {
    font-size: 0.78rem;
    padding: 4px 9px;
  }

  /* ============================
   * 案E Wide
   * ============================ */
  .nav-e {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    font-size: 0.82rem;
  }

  .e-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .e-group-name {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    transition: color 0.4s;
  }
  .light .e-group-name {
    color: #aaa;
  }

  .e-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }

  .e-link {
    color: #bbb;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.82rem;
    position: relative;
    transition:
      color 0.2s,
      background 0.2s;
  }
  .e-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 10px;
    right: 10px;
    height: 2px;
    background: var(--ec);
    border-radius: 1px;
    transform: scaleX(0);
    transition: transform 0.2s;
  }
  .e-link:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
  .e-link:hover::after {
    transform: scaleX(1);
  }
  .light .e-link {
    color: #555;
  }
  .light .e-link:hover {
    color: #111;
    background: rgba(0, 0, 0, 0.05);
  }

  .e-vline {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    align-self: stretch;
    flex-shrink: 0;
  }
  .light .e-vline {
    background: rgba(0, 0, 0, 0.1);
  }

  .e-cat-wrap {
    position: relative;
  }

  .e-cat-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    font-size: 0.82rem;
    padding: 4px 10px 4px 12px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition:
      background 0.15s,
      color 0.15s;
    position: relative;
  }
  .e-cat-btn:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
  }
  .light .e-cat-btn {
    color: #555;
  }
  .light .e-cat-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  .e-cat-bar {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 14px;
    border-radius: 2px;
  }

  .e-cat-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    padding: 4px 0 4px 12px;
  }

  .e-cat-item {
    color: #999;
    text-decoration: none;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.78rem;
    border: 1px solid transparent;
    transition:
      color 0.2s,
      border-color 0.2s,
      background 0.2s;
  }
  .e-cat-item:hover {
    color: var(--ec);
    border-color: color-mix(in srgb, var(--ec) 25%, transparent);
    background: color-mix(in srgb, var(--ec) 5%, transparent);
  }
  .light .e-cat-item {
    color: #888;
  }

  /* 案E Narrow: セグメントコントロール */
  .nav-e-narrow {
    font-size: 0.82rem;
  }

  .e-n-seg {
    display: flex;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .light .e-n-seg {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .e-n-seg-btn {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #777;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 5px 6px;
    border-radius: 5px;
    text-align: center;
    white-space: nowrap;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .e-n-seg-btn:hover {
    color: #ccc;
  }
  .e-n-seg-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .light .e-n-seg-btn {
    color: #aaa;
  }
  .light .e-n-seg-btn:hover {
    color: #444;
  }
  .light .e-n-seg-btn.active {
    background: rgba(0, 0, 0, 0.07);
    color: #111;
  }
  /* アクティブ時カテゴリカラー強調 */
  .e-n-seg-btn.active[style] {
    border-bottom: 2px solid var(--sc, #fff);
  }

  .e-n-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .e-n-link {
    font-size: 0.8rem;
    display: block;
  }

  .e-n-item {
    font-size: 0.78rem;
  }

  /* ============================
   * 案F Wide
   * ============================ */
  .nav-f {
    font-size: 0.82rem;
  }

  .f-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .light .f-tabs {
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }

  .f-tab {
    background: none;
    border: none;
    cursor: pointer;
    color: #888;
    font-size: 0.82rem;
    padding: 6px 14px;
    border-radius: 4px 4px 0 0;
    position: relative;
    transition:
      color 0.2s,
      background 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .f-tab:hover {
    color: #ccc;
    background: rgba(255, 255, 255, 0.04);
  }
  .f-tab.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
  .f-tab.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
  }
  .light .f-tab {
    color: #888;
  }
  .light .f-tab:hover {
    color: #444;
    background: rgba(0, 0, 0, 0.04);
  }
  .light .f-tab.active {
    color: #111;
    background: rgba(0, 0, 0, 0.04);
  }

  .f-panel {
    padding: 10px 4px 4px;
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .f-tool-link {
    color: #bbb;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.82rem;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .f-tool-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .light .f-tool-link {
    color: #555;
  }
  .light .f-tool-link:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .f-content-panel {
    gap: 1rem;
  }

  .f-cat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 80px;
  }

  .f-cat-name {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 4px;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--fc);
    color: var(--fc);
  }

  .f-item {
    color: #bbb;
    text-decoration: none;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .f-item:hover {
    background: color-mix(in srgb, var(--fc) 10%, transparent);
    color: var(--fc);
  }
  .light .f-item {
    color: #555;
  }

  /* 案F Narrow: トグルなし・常時展開ミニカードグリッド */
  .nav-f-narrow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .f-n-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 8px 6px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    text-decoration: none;
    overflow: hidden;
    transition:
      border-color 0.15s,
      transform 0.15s,
      background 0.15s;
  }
  .f-n-card:hover {
    border-color: color-mix(in srgb, var(--fc) 40%, transparent);
    background: color-mix(in srgb, var(--fc) 6%, transparent);
    transform: translateY(-1px);
  }
  .light .f-n-card {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(0, 0, 0, 0.07);
  }
  .light .f-n-card:hover {
    border-color: color-mix(in srgb, var(--fc) 50%, transparent);
  }

  .f-n-card-bar {
    height: 2px;
    background: var(--fg);
    border-radius: 1px;
  }

  .f-n-card-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #ccc;
    transition: color 0.15s;
  }
  .f-n-card:hover .f-n-card-label {
    color: var(--fc);
  }
  .light .f-n-card-label {
    color: #333;
  }

  .f-n-card-cat {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ============================
   * 案G Wide
   * ============================ */
  .nav-g {
    font-size: 0.82rem;
  }

  .g-spectrum-bar {
    height: 3px;
    background: linear-gradient(
      90deg,
      #ff6b6b,
      #ff9f43,
      #ffd93d,
      #6bcb77,
      #4d96ff,
      #6741d9,
      #c77dff,
      #ff6b6b
    );
    background-size: 200%;
    animation: spectrum-shift 8s linear infinite;
    border-radius: 2px;
    margin-bottom: 8px;
  }

  @keyframes spectrum-shift {
    0% {
      background-position: 0%;
    }
    100% {
      background-position: 200%;
    }
  }

  .g-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .g-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .g-cat {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gc);
    opacity: 0.8;
  }

  .g-link {
    color: #aaa;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.82rem;
    transition:
      color 0.2s,
      background 0.2s;
  }
  .g-link:hover {
    color: var(--gc);
    background: color-mix(in srgb, var(--gc) 10%, transparent);
  }
  .light .g-link {
    color: #555;
  }
  .light .g-link:hover {
    background: color-mix(in srgb, var(--gc) 8%, transparent);
  }

  .g-divider {
    width: 1px;
    height: 18px;
    background: rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
  .light .g-divider {
    background: rgba(0, 0, 0, 0.1);
  }

  /* 案G Narrow: スペクトルゾーン選択 */
  .nav-g-narrow {
    font-size: 0.82rem;
  }

  .g-n-zones {
    display: flex;
    gap: 3px;
    margin-bottom: 8px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .light .g-n-zones {
    border-color: rgba(0, 0, 0, 0.1);
  }

  .g-n-zone {
    flex: 1;
    border: none;
    cursor: pointer;
    font-size: 0.62rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 2px;
    text-align: center;
    letter-spacing: 0;
    transition:
      filter 0.2s,
      color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.65;
  }
  .g-n-zone:hover {
    opacity: 0.85;
    filter: brightness(1.2);
  }
  .g-n-zone.active {
    opacity: 1;
    filter: brightness(1.3);
    color: #fff;
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: -2px;
  }
  .light .g-n-zone {
    color: rgba(255, 255, 255, 0.9);
  }

  .g-n-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 4px;
  }

  .g-n-link {
    font-size: 0.78rem;
    padding: 4px 9px;
  }

  /* ============================
   * 案H Wide
   * ============================ */
  .nav-h {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    font-size: 0.82rem;
  }

  .h-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .h-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    transition: color 0.4s;
  }
  .light .h-section-label {
    color: #aaa;
  }

  .h-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .h-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }

  .h-link {
    color: #bbb;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.82rem;
    transition:
      background 0.15s,
      color 0.15s,
      box-shadow 0.15s;
  }
  .h-link:hover {
    background: color-mix(in srgb, var(--hc) 10%, transparent);
    color: var(--hc);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--hc) 25%, transparent);
  }
  .light .h-link {
    color: #555;
  }

  .h-sep {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    align-self: stretch;
    flex-shrink: 0;
  }
  .light .h-sep {
    background: rgba(0, 0, 0, 0.1);
  }

  .h-cat-wrap {
    position: relative;
  }

  .h-cat-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    font-size: 0.82rem;
    padding: 4px 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .h-cat-btn:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
  }
  .light .h-cat-btn {
    color: #555;
  }
  .light .h-cat-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  .h-cat-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .h-cat-popup {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    min-width: 130px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .light .h-cat-popup {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .h-popup-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    color: #bbb;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .h-popup-link::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--hc);
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .h-popup-link:hover {
    background: color-mix(in srgb, var(--hc) 8%, transparent);
    color: var(--hc);
  }
  .h-popup-link:hover::before {
    opacity: 1;
  }
  .light .h-popup-link {
    color: #555;
  }

  /* 案H Narrow: ドロワー風ツリーリスト */
  .nav-h-narrow {
    font-size: 0.82rem;
  }

  .h-n-toggle {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #ccc;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: space-between;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .h-n-toggle:hover {
    background: rgba(255, 255, 255, 0.09);
    color: #fff;
  }
  .light .h-n-toggle {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.1);
    color: #444;
  }
  .light .h-n-toggle:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111;
  }

  .h-n-toggle-dots {
    display: flex;
    gap: 3px;
    align-items: center;
  }
  .h-n-toggle-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: block;
    flex-shrink: 0;
  }

  .h-n-drawer {
    margin-top: 6px;
    background: #13132a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 10px 10px 8px;
  }
  .light .h-n-drawer {
    background: #f8f8f8;
    border-color: rgba(0, 0, 0, 0.08);
  }

  .h-n-tree-sec {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    margin: 8px 0 4px;
  }
  .light .h-n-tree-sec {
    color: #aaa;
  }

  .h-n-tree-link {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 6px;
    color: #bbb;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    transition:
      color 0.15s,
      background 0.15s;
  }
  .h-n-tree-link:hover {
    color: var(--hc);
    background: color-mix(in srgb, var(--hc) 8%, transparent);
  }
  .light .h-n-tree-link {
    color: #555;
  }

  .h-n-tree-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .h-n-tree-cat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--hc);
    margin: 8px 0 2px 2px;
    opacity: 0.85;
  }

  .h-n-tree-item {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 4px 6px 4px 18px;
    color: #999;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.78rem;
    position: relative;
    transition:
      color 0.15s,
      background 0.15s;
  }
  .h-n-tree-item:hover {
    color: var(--hc);
    background: color-mix(in srgb, var(--hc) 6%, transparent);
  }
  .light .h-n-tree-item {
    color: #888;
  }

  .h-n-tree-line {
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 0;
    border-left: 1px solid;
  }

  /* ============================
   * フッター
   * ============================ */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    transition: border-color 0.4s;
  }
  .light .page-footer {
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  .back-link {
    font-size: 0.85rem;
    color: #444;
    text-decoration: none;
    transition: color 0.4s;
  }
  .back-link:hover {
    color: #888;
  }
  .light .back-link {
    color: #bbb;
  }
  .light .back-link:hover {
    color: #777;
  }
</style>
