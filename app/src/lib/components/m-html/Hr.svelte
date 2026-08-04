<hr class="dot-hr" />

<style>
  .dot-hr {
    /* 一番左（最大）のドットの直径 */
    --dot-size: 8px;
    /* 右へ1つ進むごとに小さくなる量。0 にすると全ドットが同じ大きさ */
    --dot-step: 0.75px;
    /* ドットとドットの間隔（ドットの縁から縁まで） */
    --dot-gap: 14px;

    /* 各ドットの直径 */
    --d1: var(--dot-size);
    --d2: calc(var(--dot-size) - var(--dot-step));
    --d3: calc(var(--dot-size) - var(--dot-step) * 2);
    --d4: calc(var(--dot-size) - var(--dot-step) * 3);
    --d5: calc(var(--dot-size) - var(--dot-step) * 4);
    /* 各ドットの左端の位置。直径が違っても縁と縁の間隔が --dot-gap で揃う */
    --x2: calc(var(--d1) + var(--dot-gap));
    --x3: calc(var(--x2) + var(--d2) + var(--dot-gap));
    --x4: calc(var(--x3) + var(--d3) + var(--dot-gap));
    --x5: calc(var(--x4) + var(--d4) + var(--dot-gap));

    border: 0;
    /* ボックスがドット列にちょうど外接する */
    width: calc(var(--x5) + var(--d5));
    height: var(--dot-size);
    margin-block: 0;
    margin-inline: 0;
    margin-inline-start: 1.5px;
    /* 前後の要素とドットの間隔。隣のマージンは下の :global で打ち消すので、
       この値がそのまま間隔になる */
    padding-block: 2.75rem;
    /* OGP テンプレート（ogimage/template/title-only.svg）のフッタードットと同じ5色。
       サイズが個別なので、ドット1個 = 背景レイヤー1枚として描く。
       ダークモードでは眩しさを抑えるため不透明度 80%（= 末尾の cc）にする */
    background-image:
      radial-gradient(
        closest-side circle,
        light-dark(#ff6b6b, #ff6b6bcc) calc(100% - 0.5px),
        #0000
      ),
      radial-gradient(
        closest-side circle,
        light-dark(#ffd93d, #ffd93dcc) calc(100% - 0.5px),
        #0000
      ),
      radial-gradient(
        closest-side circle,
        light-dark(#6bcb77, #6bcb77cc) calc(100% - 0.5px),
        #0000
      ),
      radial-gradient(
        closest-side circle,
        light-dark(#4d96ff, #4d96ffcc) calc(100% - 0.5px),
        #0000
      ),
      radial-gradient(closest-side circle, light-dark(#c77dff, #c77dffcc) calc(100% - 0.5px), #0000);
    background-size:
      var(--d1) var(--d1),
      var(--d2) var(--d2),
      var(--d3) var(--d3),
      var(--d4) var(--d4),
      var(--d5) var(--d5);
    background-position:
      0 center,
      var(--x2) center,
      var(--x3) center,
      var(--x4) center,
      var(--x5) center;
    background-repeat: no-repeat;
  }

  /* 前後の要素の隣り合うマージンを打ち消し、間隔を padding-block だけで決める。
     隣接要素はこのコンポーネントの外にあるため :global が必要だが、
     セレクタの起点が .dot-hr なので効果は「この hr の隣」だけに限定される。

     クラスを3つ重ねているのは詳細度のため。隣接要素のマージンは各コンポーネントの
     スコープ付きセレクタ（.term-grid → (0,2,0) など）で指定されており、
     素の (0,1,0) では負けてしまう。 */
  :global(.dot-hr.dot-hr.dot-hr + *) {
    margin-block-start: 0;
  }

  :global(:has(+ .dot-hr.dot-hr.dot-hr)) {
    margin-block-end: 0;
  }
</style>
