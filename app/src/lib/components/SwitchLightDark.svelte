<script lang="ts">
  import Icon from "@iconify/svelte"
  import { lightModeState } from "$lib/state/lightMode.svelte"

  $effect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    lightModeState.isLightMode = mq.matches

    const handler = (e: MediaQueryListEvent) => {
      lightModeState.isLightMode = e.matches
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  })

  $effect(() => {
    if (lightModeState.isLightMode) {
      document.body.classList.add("light")
      document.body.classList.remove("dark")
    } else {
      document.body.classList.add("dark")
      document.body.classList.remove("light")
    }
  })

  function toggle() {
    lightModeState.isLightMode = !lightModeState.isLightMode
  }
</script>

<!--
  is-light クラス：ダークモード時に付与（ボタンが「ライトへ切替」を示す状態）
  - ダークモード時：オレンジリング + 太陽アイコン
  - ライトモード時：パープルリング + 月アイコン
-->
<button
  class="switch-btn"
  class:is-light={!lightModeState.isLightMode}
  onclick={toggle}
  aria-label={lightModeState.isLightMode ? "ダークモードに切替" : "ライトモードに切替"}
>
  <span class="ring"></span>
  <span class="icon-wrap">
    {#if lightModeState.isLightMode}
      <Icon icon="solar:moon-stars-broken" width="22" height="22" />
    {:else}
      <Icon icon="solar:sun-2-broken" width="22" height="22" />
    {/if}
  </span>
</button>

<style>
  .switch-btn {
    display: grid;
    place-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .ring {
    grid-area: 1 / 1;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    border: 1.5px solid rgba(196, 181, 253, 0.5);
    box-shadow:
      0 0 12px rgba(196, 181, 253, 0.3),
      inset 0 0 8px rgba(196, 181, 253, 0.1);
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
  }

  .switch-btn.is-light .ring {
    border-color: rgba(245, 158, 11, 0.55);
    box-shadow:
      0 0 14px rgba(245, 158, 11, 0.35),
      inset 0 0 8px rgba(245, 158, 11, 0.12);
  }

  .switch-btn:hover .ring {
    border-color: rgba(196, 181, 253, 0.8);
    box-shadow:
      0 0 20px rgba(196, 181, 253, 0.5),
      inset 0 0 10px rgba(196, 181, 253, 0.15);
  }

  .switch-btn.is-light:hover .ring {
    border-color: rgba(245, 158, 11, 0.9);
    box-shadow:
      0 0 22px rgba(245, 158, 11, 0.5),
      inset 0 0 10px rgba(245, 158, 11, 0.18);
  }

  .icon-wrap {
    display: flex;
    grid-area: 1 / 1;
    color: #c4b5fd;
    transition: color 0.3s;
  }

  .switch-btn.is-light .icon-wrap {
    color: #f59e0b;
  }
</style>
