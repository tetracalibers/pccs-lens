<script lang="ts">
  let { isAnki = false, ontoggle }: { isAnki?: boolean; ontoggle: () => void } = $props()
</script>

<button
  class="toggle"
  class:is-anki={isAnki}
  onclick={ontoggle}
  aria-label={isAnki ? "解説モードに切替" : "暗記モードに切替"}
>
  <span class="label" class:active={isAnki}>暗記</span>
  <span class="track">
    <span class="knob"></span>
  </span>
  <span class="label" class:active={!isAnki}>解説</span>
</button>

<style>
  .toggle {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .label {
    font-size: 0.82rem;
    font-weight: 600;
    color: light-dark(#aaaacc, #4848a0);
    transition: color 0.3s;
  }

  /* デフォルト（解説モード）: 解説ラベルがアクティブ（青緑） */
  .label.active {
    color: light-dark(#0e7490, #22d3ee);
  }

  /* 暗記モード: 暗記ラベルがアクティブ（紫）*/
  .toggle.is-anki .label.active {
    color: light-dark(#7c3aed, #c4b5fd);
  }

  .track {
    display: inline-block;
    position: relative;
    width: 2.8rem;
    height: 1.4rem;
    border-radius: 999px;
    background: light-dark(rgba(14, 116, 144, 0.12), rgba(34, 211, 238, 0.15));
    border: 1px solid light-dark(rgba(14, 116, 144, 0.35), rgba(34, 211, 238, 0.4));
    transition:
      background 0.35s,
      border-color 0.35s;
  }

  .toggle.is-anki .track {
    background: light-dark(rgba(124, 58, 237, 0.12), rgba(196, 181, 253, 0.2));
    border-color: light-dark(rgba(124, 58, 237, 0.35), rgba(196, 181, 253, 0.4));
  }

  .knob {
    position: absolute;
    top: 50%;
    left: 0.2rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    /* デフォルト（解説モード）: 右側に配置、vertically centered */
    transform: translateY(-50%) translateX(1.4rem);
    background: light-dark(#0e7490, #22d3ee);
    transition:
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      background 0.35s,
      box-shadow 0.35s;
  }

  .toggle.is-anki .knob {
    /* 暗記モード: 左側に配置 */
    transform: translateY(-50%) translateX(0);
    background: light-dark(#7c3aed, #c4b5fd);
  }
</style>
