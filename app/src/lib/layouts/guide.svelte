<main>
  <slot />
</main>

<style>
  main {
    max-width: 700px;
    margin: 3rem auto;
    padding: 0 1rem;
  }

  main :global(h2) {
    font-size: 1.25rem;
    margin: 2rem 0 1.5rem;
  }

  main :global(h3) {
    font-size: 1rem;
    margin: 1.5rem 0 0.4rem;
  }

  main :global(p) {
    color: var(--color-text, #111);
    margin: 0.5rem 0;
    font-size: 0.85rem;
    line-height: 2;
  }

  main :global(ul) {
    margin: 0.85rem 0;
    font-size: 0.9rem;
    line-height: 2;
  }

  main :global(li) {
    padding: 0;
  }

  main :global(blockquote) {
    margin: 1rem 0;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px dashed lightgray;
    box-sizing: border-box;
    font-size: 0.85rem;
    line-height: 1.7;
  }

  main :global(blockquote p) {
    margin: 0;
  }
</style>
