<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  // 各案の開閉状態
  let opens = $state([false, false, false, false, false, false, false, false])

  function toggle(i: number) {
    opens[i] = !opens[i]
  }

  $effect(() => {
    document.body.style.background = theme.isLight ? "#ffffff" : "#0c0c14"
    return () => {
      document.body.style.background = ""
    }
  })
</script>

<main class:light={theme.isLight}>
  <p class="page-title">ハンバーガーボタン デザイン案</p>
  <p class="page-desc">クリックで開閉をプレビューできます</p>

  <div class="grid">

    <!-- A: シンプル3本線 -->
    <section class="pattern">
      <p class="pattern-label">A — シンプル3本線</p>
      <div class="preview">
        <button class="btn-a" class:open={opens[0]} onclick={() => toggle(0)} aria-label="メニュー">
          <span class="a-bar"></span>
          <span class="a-bar"></span>
          <span class="a-bar"></span>
        </button>
      </div>
      <p class="pattern-note">中央の線が消え、上下がクロスする古典的アニメーション</p>
    </section>

    <!-- B: レインボーグラデーション線 -->
    <section class="pattern">
      <p class="pattern-label">B — レインボーライン</p>
      <div class="preview">
        <button class="btn-b" class:open={opens[1]} onclick={() => toggle(1)} aria-label="メニュー">
          <span class="b-bar b1"></span>
          <span class="b-bar b2"></span>
          <span class="b-bar b3"></span>
        </button>
      </div>
      <p class="pattern-note">各ラインを虹色グラデーションで塗り、色彩アプリらしさを演出</p>
    </section>

    <!-- C: 色相サークル -->
    <section class="pattern">
      <p class="pattern-label">C — 色相サークル</p>
      <div class="preview">
        <button class="btn-c" class:open={opens[2]} onclick={() => toggle(2)} aria-label="メニュー">
          <svg class="c-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="hue-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff6b6b" />
                <stop offset="20%" stop-color="#ffd93d" />
                <stop offset="40%" stop-color="#6bcb77" />
                <stop offset="60%" stop-color="#4d96ff" />
                <stop offset="80%" stop-color="#c77dff" />
                <stop offset="100%" stop-color="#ff6b6b" />
              </linearGradient>
            </defs>
            <!-- 色相環リング -->
            <circle class="c-ring" cx="18" cy="18" r="15" />
            <!-- ハンバーガー線 3本 -->
            <line class="c-line c-line1" x1="10" y1="13" x2="26" y2="13" />
            <line class="c-line c-line2" x1="10" y1="18" x2="26" y2="18" />
            <line class="c-line c-line3" x1="10" y1="23" x2="26" y2="23" />
            <!-- X線（open時に表示） -->
            <line class="c-xline c-x1" x1="11" y1="11" x2="25" y2="25" />
            <line class="c-xline c-x2" x1="25" y1="11" x2="11" y2="25" />
          </svg>
        </button>
      </div>
      <p class="pattern-note">色相環をリングとして使い、中にハンバーガー線 → X へ変形</p>
    </section>

    <!-- D: ドットグリッド -->
    <section class="pattern">
      <p class="pattern-label">D — ドットグリッド</p>
      <div class="preview">
        <button class="btn-d" class:open={opens[3]} onclick={() => toggle(3)} aria-label="メニュー">
          <svg class="d-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            {#each [9, 18, 27] as cy (cy)}
              {#each [9, 18, 27] as cx (cx)}
                <circle class="d-dot" {cx} {cy} r="2.5" />
              {/each}
            {/each}
          </svg>
        </button>
      </div>
      <p class="pattern-note">3×3ドットグリッド。openで中央列のドットが消えてXを示唆</p>
    </section>

    <!-- E: カラーアクセント線 -->
    <section class="pattern">
      <p class="pattern-label">E — カラーアクセント</p>
      <div class="preview">
        <button class="btn-e" class:open={opens[4]} onclick={() => toggle(4)} aria-label="メニュー">
          <span class="e-bar e-top"></span>
          <span class="e-bar e-mid"></span>
          <span class="e-bar e-bot"></span>
        </button>
      </div>
      <p class="pattern-note">中央線だけ虹色グラデーション。シンプルさの中にカラーポイント</p>
    </section>

    <!-- F: ペイントストローク -->
    <section class="pattern">
      <p class="pattern-label">F — ペイントストローク</p>
      <div class="preview">
        <button class="btn-f" class:open={opens[5]} onclick={() => toggle(5)} aria-label="メニュー">
          <svg class="f-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <!-- 筆っぽい不規則な線 -->
            <path class="f-stroke f-s1" d="M8 12 Q14 10 28 12.5" stroke-width="3" stroke-linecap="round" />
            <path class="f-stroke f-s2" d="M8 18.5 Q18 16.5 28 18.5" stroke-width="3" stroke-linecap="round" />
            <path class="f-stroke f-s3" d="M8 24.5 Q16 26.5 28 24" stroke-width="3" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <p class="pattern-note">絵筆のようなかすれ曲線。アート感のある手書き風ハンバーガー</p>
    </section>

    <!-- G: スペクトラムバー -->
    <section class="pattern">
      <p class="pattern-label">G — スペクトラムバー</p>
      <div class="preview">
        <button class="btn-g" class:open={opens[6]} onclick={() => toggle(6)} aria-label="メニュー">
          <span class="g-bar g1"></span>
          <span class="g-bar g2"></span>
          <span class="g-bar g3"></span>
        </button>
      </div>
      <p class="pattern-note">3本線の長さを変えてスペクトラム風。各線に異なる色相を割り当て</p>
    </section>

    <!-- H: カラードロップ -->
    <section class="pattern">
      <p class="pattern-label">H — カラードロップ</p>
      <div class="preview">
        <button class="btn-h" class:open={opens[7]} onclick={() => toggle(7)} aria-label="メニュー">
          <svg class="h-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <!-- 雫型 × 3 -->
            <path class="h-drop h-d1" d="M10 22 Q10 14 14 10 Q18 6 18 6 Q18 6 22 10 Q26 14 26 22 Q26 28.5 18 28.5 Q10 28.5 10 22Z" />
            <line class="h-line h-l1" x1="18" y1="12" x2="18" y2="24" />
            <line class="h-line h-l2" x1="12" y1="19" x2="24" y2="19" />
          </svg>
        </button>
      </div>
      <p class="pattern-note">絵の具のカラードロップ形状の中に十字。色彩をモチーフにしたオリジナルアイコン</p>
    </section>

  </div>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
    color: #f0f0f0;
    transition: color 0.4s;
  }

  main.light {
    color: #1a1a1a;
  }

  .page-title {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #555;
    margin: 0 0 0.5rem;
  }

  main.light .page-title {
    color: #999;
  }

  .page-desc {
    font-size: 0.82rem;
    color: #555;
    margin: 0 0 2.5rem;
  }

  main.light .page-desc {
    color: #888;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .pattern {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1.5rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: background 0.4s, border-color 0.4s;
  }

  main.light .pattern {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.07);
  }

  .pattern-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #888;
    margin: 0;
    transition: color 0.4s;
  }

  main.light .pattern-label {
    color: #aaa;
  }

  .preview {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 0;
  }

  .pattern-note {
    font-size: 0.78rem;
    color: #555;
    margin: 0;
    line-height: 1.55;
    transition: color 0.4s;
  }

  main.light .pattern-note {
    color: #888;
  }

  /* ===== A: シンプル3本線 ===== */
  .btn-a {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0;
    transition: background 0.2s, border-color 0.2s;
    position: relative;
  }

  main.light .btn-a {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .btn-a:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  main.light .btn-a:hover {
    background: rgba(0, 0, 0, 0.09);
  }

  .a-bar {
    display: block;
    width: 18px;
    height: 2px;
    background: #c0c0d0;
    border-radius: 2px;
    transform-origin: center;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s,
      width 0.3s;
  }

  main.light .a-bar {
    background: #444;
  }

  .btn-a.open .a-bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .btn-a.open .a-bar:nth-child(2) {
    opacity: 0;
    width: 0;
  }

  .btn-a.open .a-bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* ===== B: レインボーライン ===== */
  .btn-b {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0;
    transition: background 0.2s, border-color 0.2s;
  }

  main.light .btn-b {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .b-bar {
    display: block;
    width: 20px;
    height: 2.5px;
    border-radius: 2px;
    transform-origin: center;
    transition:
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s;
  }

  .b1 {
    background: linear-gradient(90deg, #ff6b6b, #ffd93d);
  }

  .b2 {
    background: linear-gradient(90deg, #6bcb77, #4d96ff);
  }

  .b3 {
    background: linear-gradient(90deg, #c77dff, #ff6b6b);
  }

  .btn-b.open .b-bar:nth-child(1) {
    transform: translateY(7.5px) rotate(45deg);
    background: linear-gradient(90deg, #ff6b6b, #c77dff);
  }

  .btn-b.open .b-bar:nth-child(2) {
    opacity: 0;
  }

  .btn-b.open .b-bar:nth-child(3) {
    transform: translateY(-7.5px) rotate(-45deg);
    background: linear-gradient(90deg, #c77dff, #ff6b6b);
  }

  /* ===== C: 色相サークル ===== */
  .btn-c {
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .c-svg {
    width: 40px;
    height: 40px;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-c.open .c-svg {
    transform: rotate(90deg);
  }

  .c-ring {
    stroke: url(#hue-ring);
    stroke-width: 2.5;
    fill: none;
  }

  .c-line {
    stroke: #c0c0d0;
    stroke-width: 2;
    stroke-linecap: round;
    transition: opacity 0.2s, transform 0.35s;
    transform-origin: 18px 18px;
  }

  main.light .c-line {
    stroke: #444;
  }

  .c-xline {
    stroke: #c77dff;
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0;
    transition: opacity 0.25s;
    transform-origin: 18px 18px;
  }

  .btn-c.open .c-line {
    opacity: 0;
  }

  .btn-c.open .c-xline {
    opacity: 1;
  }

  /* SVG defs for hue ring gradient - defined inline */
  .c-svg {
    overflow: visible;
  }

  /* ===== D: ドットグリッド ===== */
  .btn-d {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, border-color 0.2s;
  }

  main.light .btn-d {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .d-svg {
    width: 36px;
    height: 36px;
  }

  .d-dot {
    fill: #888;
    transition: opacity 0.2s, fill 0.3s, transform 0.35s;
    transform-origin: center;
  }

  main.light .d-dot {
    fill: #666;
  }

  /* open: 中央列のドット(cx=18)を非表示、角のドットを色付け */
  .btn-d.open .d-dot:nth-child(2),
  .btn-d.open .d-dot:nth-child(5),
  .btn-d.open .d-dot:nth-child(8) {
    opacity: 0;
    transform: scale(0);
  }

  .btn-d.open .d-dot:nth-child(1) { fill: #ff6b6b; }
  .btn-d.open .d-dot:nth-child(3) { fill: #ffd93d; }
  .btn-d.open .d-dot:nth-child(4) { fill: #6bcb77; }
  .btn-d.open .d-dot:nth-child(6) { fill: #4d96ff; }
  .btn-d.open .d-dot:nth-child(7) { fill: #c77dff; }
  .btn-d.open .d-dot:nth-child(9) { fill: #ff6b6b; }

  /* ===== E: カラーアクセント ===== */
  .btn-e {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    padding: 0 12px;
    transition: background 0.2s;
  }

  main.light .btn-e {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .e-bar {
    display: block;
    height: 2px;
    border-radius: 2px;
    transform-origin: left center;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s,
      width 0.3s;
  }

  .e-top,
  .e-bot {
    width: 18px;
    background: #aaa;
  }

  main.light .e-top,
  main.light .e-bot {
    background: #666;
  }

  .e-mid {
    width: 18px;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
  }

  .btn-e.open .e-top {
    transform: translateY(7px) rotate(45deg);
    background: #aaa;
  }

  main.light .btn-e.open .e-top {
    background: #555;
  }

  .btn-e.open .e-mid {
    opacity: 0;
  }

  .btn-e.open .e-bot {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* ===== F: ペイントストローク ===== */
  .btn-f {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  main.light .btn-f {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .f-svg {
    width: 36px;
    height: 36px;
    transition: transform 0.4s;
  }

  .btn-f.open .f-svg {
    transform: rotate(45deg) scale(0.9);
  }

  .f-stroke {
    fill: none;
    stroke-linecap: round;
    transition: stroke 0.3s, opacity 0.25s, d 0.4s;
  }

  .f-s1 {
    stroke: #ff6b6b;
    opacity: 0.9;
  }

  .f-s2 {
    stroke: #6bcb77;
    opacity: 0.9;
  }

  .f-s3 {
    stroke: #4d96ff;
    opacity: 0.9;
  }

  .btn-f.open .f-s2 {
    opacity: 0;
  }

  /* ===== G: スペクトラムバー ===== */
  .btn-g {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    padding: 0 11px;
    transition: background 0.2s;
  }

  main.light .btn-g {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .g-bar {
    display: block;
    height: 2.5px;
    border-radius: 2px;
    transition:
      width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s;
  }

  .g1 {
    width: 20px;
    background: #ff6b6b;
  }

  .g2 {
    width: 14px;
    background: #6bcb77;
  }

  .g3 {
    width: 17px;
    background: #4d96ff;
  }

  .btn-g.open .g1 {
    width: 20px;
    transform: translateY(7.5px) rotate(45deg);
    transform-origin: center center;
    background: #ff6b6b;
  }

  .btn-g.open .g2 {
    opacity: 0;
    width: 0;
  }

  .btn-g.open .g3 {
    width: 20px;
    transform: translateY(-7.5px) rotate(-45deg);
    transform-origin: center center;
  }

  /* ===== H: カラードロップ ===== */
  .btn-h {
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .h-svg {
    width: 36px;
    height: 36px;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-h.open .h-svg {
    transform: rotate(180deg);
  }

  .h-drop {
    transition: fill 0.4s, opacity 0.3s;
  }

  .h-d1 {
    fill: rgba(199, 125, 255, 0.25);
    stroke: #c77dff;
    stroke-width: 1.5;
  }

  main.light .h-d1 {
    fill: rgba(199, 125, 255, 0.15);
    stroke: #9b4de0;
  }

  .btn-h.open .h-d1 {
    fill: rgba(199, 125, 255, 0.4);
  }

  .h-line {
    stroke: #c77dff;
    stroke-width: 2;
    stroke-linecap: round;
    transition: opacity 0.3s;
  }

  main.light .h-line {
    stroke: #9b4de0;
  }

  .btn-h.open .h-l2 {
    opacity: 0;
  }
</style>
