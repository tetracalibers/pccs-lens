<script lang="ts">
	import { resolve } from '$app/paths';

	const swatchColors = [
		'#e03131',
		'#f76707',
		'#f59f00',
		'#94d82d',
		'#0c8599',
		'#1971c2',
		'#6741d9',
		'#c2255c'
	];

	const tools = [
		{
			href: resolve('/approximate'),
			color: '#f59f00',
			colorLight: '#fff3cd',
			border: '#ffe066',
			label: 'PCCS近似',
			title: '色のPCCS近似',
			desc: '入力した色に近いPCCS値と慣用色名を調べる',
			chip: ['#e03131', '#f76707', '#f59f00', '#94d82d', '#1971c2']
		},
		{
			href: resolve('/analyze'),
			color: '#2f9e44',
			colorLight: '#d3f9d8',
			border: '#8ce99a',
			label: '配色分析',
			title: '配色の分析',
			desc: '配色をPCCSの色相・トーンに基づいて分析する',
			chip: ['#e03131', '#1971c2', '#f59f00', '#6741d9']
		},
		{
			href: resolve('/patterns'),
			color: '#1971c2',
			colorLight: '#d0ebff',
			border: '#74c0fc',
			label: 'シミュレータ',
			title: '配色シミュレータ',
			desc: 'イメージに合う色の組み合わせを実験する',
			chip: ['#c2255c', '#6741d9', '#1971c2', '#0c8599', '#2f9e44']
		}
	];
</script>

<svelte:head>
	<title>PCCS Lens - 案C ペイントスウォッチ</title>
</svelte:head>

<div class="page">
	<!-- Decorative swatch fan at top -->
	<div class="swatch-fan" aria-hidden="true">
		{#each swatchColors as color, i (color)}
			<div
				class="fan-chip"
				style="
					background: {color};
					transform: rotate({(i - (swatchColors.length - 1) / 2) * 7}deg);
					z-index: {i};
				"
			></div>
		{/each}
	</div>

	<main>
		<header class="hero">
			<h1>
				<span class="title-pccs">PCCS</span>
				<span class="title-lens">Lens</span>
			</h1>
			<p class="tagline">色を選ぶように、色を学ぶ。</p>
			<p class="subtitle">色のカードをめくるように、PCCSで色のしくみを探ってみよう</p>
		</header>

		<!-- Guide section -->
		<section class="guide-section">
			<div class="section-label">
				<span class="dot dot-warm"></span>
				まなぶ
			</div>
			<a href={resolve('/guide')} class="guide-swatch-card">
				<div class="swatch-left">
					<div class="color-stack">
						{#each swatchColors.slice(0, 5) as color, i (color)}
							<div
								class="stack-chip"
								style="background:{color}; top:{i * 14}px; left:{i * 8}px;"
							></div>
						{/each}
					</div>
				</div>
				<div class="swatch-right">
					<div class="card-tag">ガイド</div>
					<h2>PCCSとは？</h2>
					<p>色相・トーンを軸に色を体系的に整理する日本発の色彩理論。まずはここから始めよう。</p>
					<span class="read-more">読んでみる →</span>
				</div>
			</a>
		</section>

		<!-- Tools section -->
		<section class="tools-section">
			<div class="section-label">
				<span class="dot dot-cool"></span>
				つかう
			</div>
			<div class="tool-swatches">
				{#each tools as tool (tool.title)}
					<a
						href={tool.href}
						class="tool-swatch"
						style="--main:{tool.color}; --light:{tool.colorLight}; --border:{tool.border}"
					>
						<div class="tool-chip-row" aria-hidden="true">
							{#each tool.chip as c (c)}
								<div class="mini-chip" style="background:{c}"></div>
							{/each}
						</div>
						<div class="tool-swatch-body">
							<div
								class="tool-label-tag"
								style="background:{tool.colorLight}; border-color:{tool.border}; color:{tool.color}"
							>
								{tool.label}
							</div>
							<h3>{tool.title}</h3>
							<p>{tool.desc}</p>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<footer class="page-footer">
			<a href={resolve('/')} class="back-link">← デザイン一覧に戻る</a>
		</footer>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
		background: #fdf8f3;
		color: #1a1a1a;
	}

	.page {
		position: relative;
	}

	/* Swatch fan decoration */
	.swatch-fan {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		height: 90px;
		padding-top: 20px;
		position: relative;
		overflow: hidden;
	}

	.fan-chip {
		width: 48px;
		height: 120px;
		border-radius: 6px 6px 4px 4px;
		position: absolute;
		transform-origin: 50% 90%;
		box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.18);
		top: -20px;
	}

	/* Main */
	main {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1.25rem 4rem;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 2rem 0 2.5rem;
	}

	.hero h1 {
		font-size: 3rem;
		font-weight: 900;
		margin: 0 0 0.75rem;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.title-pccs {
		display: block;
		color: #1a1a1a;
	}

	.title-lens {
		display: block;
		background: linear-gradient(135deg, #e03131 0%, #f59f00 30%, #2f9e44 60%, #1971c2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-size: 3.5rem;
	}

	.tagline {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #333;
	}

	.subtitle {
		font-size: 0.88rem;
		color: #888;
		margin: 0;
		line-height: 1.6;
	}

	/* Section label */
	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #888;
		margin-bottom: 0.75rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.dot-warm {
		background: #f59f00;
	}
	.dot-cool {
		background: #1971c2;
	}

	.guide-section {
		margin-bottom: 2rem;
	}

	/* Guide swatch card */
	.guide-swatch-card {
		display: flex;
		background: white;
		border: 1px solid #e8d8c8;
		border-radius: 14px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		box-shadow: 2px 4px 16px rgba(0, 0, 0, 0.07);
		transition:
			box-shadow 0.2s,
			transform 0.2s;
	}

	.guide-swatch-card:hover {
		box-shadow: 4px 8px 28px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px) rotate(-0.3deg);
	}

	.swatch-left {
		width: 120px;
		flex-shrink: 0;
		background: #fdf3e3;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 0;
	}

	.color-stack {
		position: relative;
		width: 60px;
		height: 80px;
	}

	.stack-chip {
		position: absolute;
		width: 40px;
		height: 56px;
		border-radius: 4px 4px 3px 3px;
		box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.swatch-right {
		padding: 1.5rem;
		flex: 1;
	}

	.card-tag {
		display: inline-block;
		background: #fff3cd;
		color: #9a6700;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 20px;
		margin-bottom: 0.5rem;
		letter-spacing: 0.05em;
	}

	.swatch-right h2 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 0.4rem;
	}

	.swatch-right p {
		font-size: 0.85rem;
		color: #666;
		margin: 0 0 0.75rem;
		line-height: 1.6;
	}

	.read-more {
		font-size: 0.85rem;
		font-weight: 700;
		color: #9a6700;
	}

	/* Tools */
	.tools-section {
		margin-bottom: 2rem;
	}

	.tool-swatches {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 580px) {
		.tool-swatches {
			grid-template-columns: 1fr;
		}
		.swatch-left {
			width: 80px;
		}
		.color-stack {
			width: 44px;
			height: 60px;
		}
		.stack-chip {
			width: 30px;
			height: 42px;
		}
	}

	.tool-swatch {
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		box-shadow: 1px 3px 10px rgba(0, 0, 0, 0.06);
		transition:
			box-shadow 0.2s,
			transform 0.2s;
		display: flex;
		flex-direction: column;
	}

	.tool-swatch:hover {
		box-shadow: 3px 6px 20px rgba(0, 0, 0, 0.12);
		transform: translateY(-3px) rotate(0.5deg);
	}

	.tool-chip-row {
		display: flex;
		height: 20px;
	}

	.mini-chip {
		flex: 1;
	}

	.tool-swatch-body {
		padding: 1rem;
	}

	.tool-label-tag {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 20px;
		border: 1px solid;
		margin-bottom: 0.5rem;
		letter-spacing: 0.05em;
	}

	.tool-swatch-body h3 {
		font-size: 0.9rem;
		font-weight: 700;
		margin: 0 0 0.35rem;
	}

	.tool-swatch-body p {
		font-size: 0.78rem;
		color: #777;
		margin: 0;
		line-height: 1.5;
	}

	/* Footer */
	.page-footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e8d8c8;
		text-align: center;
	}

	.back-link {
		font-size: 0.85rem;
		color: #aaa;
		text-decoration: none;
	}

	.back-link:hover {
		color: #555;
	}
</style>
