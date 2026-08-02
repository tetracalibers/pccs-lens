<script lang="ts">
  // ===== SVG dimensions =====
  const SIZE = 320

  // ===== Colors =====
  const COL_BG = "#ffffff"
  const COL_INK = "#000000"

  // ===== Layout constants =====
  const STRIPE_PITCH = 8 // 縞模様1周期（黒+白）の幅
  const STRIPE_BLACK_RATIO = 0.5 // 1周期内に占める黒帯の割合
  const STRIPE_ANGLE_DEG = 45 // 縞の傾き（°）

  // ===== 算出値 =====
  const STRIPE_BLACK_WIDTH = STRIPE_PITCH * STRIPE_BLACK_RATIO
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <!-- 斜めの白黒縞模様（patternTransform で角度を与える） -->
    <pattern
      id="luckiesh-moss-stripes"
      width={STRIPE_PITCH}
      height={STRIPE_PITCH}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate({STRIPE_ANGLE_DEG})"
    >
      <rect x="0" y="0" width={STRIPE_PITCH} height={STRIPE_PITCH} fill={COL_BG} />
      <rect x="0" y="0" width={STRIPE_BLACK_WIDTH} height={STRIPE_PITCH} fill={COL_INK} />
    </pattern>
  </defs>

  <!-- 縞模様を敷き詰めた本体 -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill="url(#luckiesh-moss-stripes)" />
</svg>
