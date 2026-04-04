<p class="coming-soon">Coming Soon</p>

<style>
  .coming-soon {
    --_grad-1: #9a9a9a;
    --_grad-2: #b5b5b5;
    --_grad-3: #9c9c9c;

    background-image: linear-gradient(
      297deg,
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
    font-size: 1rem;
    display: inline-block;
    line-height: 1.2;
  }

  :global(.dark) .coming-soon {
    --_grad-dk-1: hsl(from var(--_grad-1) h calc(s * 0.6) calc(l * 0.75));
    --_grad-dk-2: hsl(from var(--_grad-2) h calc(s * 0.6) calc(l * 0.75));
    --_grad-dk-3: hsl(from var(--_grad-3) h calc(s * 0.6) calc(l * 0.75));

    background-image: linear-gradient(
      140deg,
      var(--_grad-dk-1),
      var(--_grad-dk-2),
      var(--_grad-dk-3),
      var(--_grad-dk-1)
    );
  }
  .coming-soon::after {
    content: "...";
    display: inline-block;
    padding-inline-start: 0.5ex;
  }
</style>
