<p class="more-to-come">More to Come</p>

<style>
  .more-to-come {
    --_grad-1: #9a9a9a;
    --_grad-2: #b5b5b5;
    --_grad-3: #9c9c9c;

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
    font-family: var(--font-fancy);
    display: inline-block;
    line-height: 1.4;
    margin-block: 0.5rem;
    font-size: 0.85rem;
    grid-column: 1 / -1;
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

  .more-to-come::before,
  .more-to-come::after {
    content: "--";
    display: inline-block;
    width: 1.5rem;
    text-align: center;
    box-sizing: border-box;
  }

  .more-to-come::before {
    padding-inline-end: 1ex;
  }
  .more-to-come::after {
    padding-inline-start: 1ex;
  }
</style>
