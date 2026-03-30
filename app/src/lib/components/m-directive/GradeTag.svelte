<script lang="ts">
  type Grade = "basic" | "3" | "2" | "1" | "uc"

  let { grade }: { grade: Grade } = $props()

  const labels: Record<Grade, string> = {
    basic: "入門",
    "3": "3級",
    "2": "2級",
    "1": "1級",
    uc: "UC級"
  }
</script>

<span class="grade-tag" data-grade={grade}>{labels[grade]}</span>

<style>
  .grade-tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid;
  }

  .grade-tag[data-grade="basic"] {
    border: 2px solid #f43f5e;
    color: light-dark(#be123c, #f43f5e);
    background: light-dark(rgba(244, 63, 94, 0.07), rgba(244, 63, 94, 0.1));
    font-size: 0.82rem;
    padding: 4px 10px;
    font-weight: 700;
  }

  .grade-tag[data-grade="basic"]::before {
    content: "★";
    margin-right: 4px;
    font-size: 0.7em;
  }

  .grade-tag[data-grade="3"] {
    border-color: light-dark(#7c3aed, #a78bfa);
    color: light-dark(#7c3aed, #a78bfa);
    background: light-dark(rgba(124, 58, 237, 0.06), rgba(167, 139, 250, 0.09));
  }

  .grade-tag[data-grade="2"] {
    border-color: light-dark(#0d9488, #2dd4bf);
    color: light-dark(#0d9488, #2dd4bf);
    background: light-dark(rgba(13, 148, 136, 0.06), rgba(45, 212, 191, 0.09));
  }

  .grade-tag[data-grade="1"] {
    border-color: light-dark(#ea580c, #fb923c);
    color: light-dark(#ea580c, #fb923c);
    background: light-dark(rgba(234, 88, 12, 0.06), rgba(251, 146, 60, 0.09));
  }

  .grade-tag[data-grade="uc"] {
    border-color: light-dark(#0284c7, #38bdf8);
    color: light-dark(#0284c7, #38bdf8);
    background: light-dark(rgba(2, 132, 199, 0.06), rgba(56, 189, 248, 0.09));
  }
</style>
