<script lang="ts">
	import { resolve } from '$app/paths';

	const pccsHues = [
		'#e03131',
		'#f76707',
		'#f59f00',
		'#74b816',
		'#2f9e44',
		'#0c8599',
		'#1971c2',
		'#3b5bdb',
		'#6741d9',
		'#9c36b5',
		'#c2255c',
		'#e03131'
	];
</script>

<svelte:head>
	<title>PCCS Lens - 案A 王道デザイン</title>
</svelte:head>

<div class="rainbow-bar"></div>

<main>
	<header class="hero">
		<h1>PCCS <span class="accent">Lens</span></h1>
		<p class="tagline">色のことば、もっと深く。</p>
		<p class="subtitle">PCCSのレンズを通して、あなたの色感覚を広げよう</p>
	</header>

	<section class="section learn-section">
		<div class="section-header">
			<span class="section-icon">📖</span>
			<h2 class="section-title">PCCSを知る</h2>
			<p class="section-desc">まずは色彩理論の基礎から</p>
		</div>
		<a href={resolve('/guide')} class="learn-card">
			<div class="learn-card-visual">
				<div class="hue-dots">
					{#each pccsHues as hue (hue)}
						<div class="hue-dot" style="background: {hue}"></div>
					{/each}
				</div>
			</div>
			<div class="learn-card-body">
				<h3>PCCSとは？</h3>
				<p>
					色相・トーン・彩度を体系的に整理した日本独自の色彩システム。PCCSの色相環とトーン図を使って、色をもっと論理的に理解しましょう。
				</p>
				<span class="cta">学習を始める →</span>
			</div>
		</a>
	</section>

	<section class="section tools-section">
		<div class="section-header">
			<span class="section-icon">🔧</span>
			<h2 class="section-title">ツールを使う</h2>
			<p class="section-desc">インタラクティブに色を分析・実験する</p>
		</div>
		<div class="tools-grid">
			<a href={resolve('/approximate')} class="tool-card" style="--accent: #f59f00">
				<div class="tool-icon">🎯</div>
				<h3>色のPCCS近似</h3>
				<p>入力した色に近いPCCS値と慣用色名を調べる</p>
			</a>
			<a href={resolve('/analyze')} class="tool-card" style="--accent: #2f9e44">
				<div class="tool-icon">📊</div>
				<h3>配色の分析</h3>
				<p>配色をPCCSの色相・トーンに基づいて分析する</p>
			</a>
			<a href={resolve('/patterns')} class="tool-card" style="--accent: #1971c2">
				<div class="tool-icon">🎨</div>
				<h3>配色シミュレータ</h3>
				<p>イメージに合う色の組み合わせを実験する</p>
			</a>
		</div>
	</section>

	<footer class="page-footer">
		<a href={resolve('/')} class="back-link">← デザイン一覧に戻る</a>
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
		background: #fafafa;
		color: #1a1a1a;
	}

	.rainbow-bar {
		height: 6px;
		background: linear-gradient(
			90deg,
			#e03131 0%,
			#f76707 14%,
			#f59f00 28%,
			#74b816 42%,
			#2f9e44 50%,
			#0c8599 58%,
			#1971c2 72%,
			#6741d9 86%,
			#c2255c 100%
		);
	}

	main {
		max-width: 760px;
		margin: 0 auto;
		padding: 0 1.25rem 4rem;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 3rem 0 2rem;
	}

	.hero h1 {
		font-size: 2.8rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		margin: 0 0 0.75rem;
		color: #1a1a1a;
	}

	.hero h1 .accent {
		color: #1971c2;
	}

	.tagline {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #1a1a1a;
	}

	.subtitle {
		font-size: 0.95rem;
		color: #666;
		margin: 0;
	}

	/* Section */
	.section {
		margin-bottom: 2.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #eee;
	}

	.section-icon {
		font-size: 1.2rem;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
	}

	.section-desc {
		font-size: 0.85rem;
		color: #888;
		margin: 0 0 0 auto;
	}

	/* Learn card */
	.learn-card {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #fff9e6, #fffbf0);
		border: 1px solid #ffe066;
		border-radius: 12px;
		text-decoration: none;
		color: inherit;
		transition:
			box-shadow 0.2s,
			transform 0.2s;
	}

	.learn-card:hover {
		box-shadow: 0 6px 20px rgba(245, 159, 0, 0.2);
		transform: translateY(-2px);
	}

	.learn-card-visual {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hue-dots {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.hue-dot {
		width: 18px;
		height: 18px;
		border-radius: 50%;
	}

	.learn-card-body h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.learn-card-body p {
		font-size: 0.88rem;
		color: #555;
		margin: 0 0 0.75rem;
		line-height: 1.6;
	}

	.cta {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e67700;
	}

	/* Tools grid */
	.tools-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 580px) {
		.tools-grid {
			grid-template-columns: 1fr;
		}
		.learn-card {
			flex-direction: column;
		}
	}

	.tool-card {
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-top: 3px solid var(--accent);
		border-radius: 0 0 10px 10px;
		text-decoration: none;
		color: inherit;
		transition:
			box-shadow 0.2s,
			transform 0.2s;
	}

	.tool-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.tool-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.tool-card h3 {
		font-size: 0.95rem;
		font-weight: 700;
		margin: 0 0 0.4rem;
	}

	.tool-card p {
		font-size: 0.82rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	/* Footer */
	.page-footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
		text-align: center;
	}

	.back-link {
		font-size: 0.85rem;
		color: #888;
		text-decoration: none;
	}

	.back-link:hover {
		color: #333;
	}
</style>
