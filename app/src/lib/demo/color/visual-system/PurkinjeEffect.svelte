<script lang="ts">
  import MyImage from "$lib/assets/river_00002.jpg?enhanced"
</script>

<svg style="position:absolute; width:0; height:0; overflow:hidden">
  <filter id="purkinje">
    <!-- 
      feColorMatrix simulates the shift:
      - Reduces Red (Row 1)
      - Boosts Blue/Green (Row 3)
      - Darkens overall image (approx. 0.3)
    -->
    <feColorMatrix
      type="matrix"
      values="
      0.2 0.0 0.0 0 0
      0.0 0.5 0.0 0 0
      0.0 0.3 0.8 0 0
      0   0   0   1 0"
    />
  </filter>
</svg>

<div class="image-set">
  <enhanced:img src={MyImage} alt="" />
  <enhanced:img src={MyImage} alt="" style="filter: url(#purkinje);" />
</div>

<style>
  .image-set {
    display: grid;
  }

  .image-set enhanced\:img {
    max-width: 480px;
  }

  .image-set :global(> *) {
    width: fit-content;
  }

  .image-set :global(> *:last-child) {
    margin-inline-start: auto;
  }
</style>
