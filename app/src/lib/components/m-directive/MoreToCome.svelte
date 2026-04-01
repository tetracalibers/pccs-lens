<p class="more-to-come">more to come</p>

<style>
  .more-to-come {
    --_grad-1: #818cf8;
    --_grad-2: #c592fe;
    --_grad-3: #38bdf8;

    background-image: linear-gradient(
      140deg,
      var(--_grad-1),
      var(--_grad-2),
      var(--_grad-3),
      var(--_grad-1)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    font-family: "Chokokutai", system-ui;
    display: inline-block;
    line-height: 1.4;
    padding-inline-start: 1.5rem;
    margin-block: 0.5rem;
    font-size: 0.85rem;
  }

  :global(.dark) .more-to-come {
    --_grad-dk-1: hsl(from var(--_grad-1) h calc(s * 0.6) calc(l * 0.75));
    --_grad-dk-2: hsl(from var(--_grad-2) h calc(s * 0.6) calc(l * 0.75));
    --_grad-dk-3: hsl(from var(--_grad-3) h calc(s * 0.6) calc(l * 0.75));

    background-image: linear-gradient(
      297deg,
      var(--_grad-dk-1),
      var(--_grad-dk-2),
      var(--_grad-dk-3),
      var(--_grad-dk-1)
    );
  }

  .more-to-come::after {
    content: "...";
  }
</style>
