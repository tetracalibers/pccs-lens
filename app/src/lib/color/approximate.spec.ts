import { describe, it, expect } from 'vitest';
import { findClosestPccs } from './approximate';
import type { PCCSColor } from '$lib/data/types';

const sampleColors: PCCSColor[] = [
	{
		notation: 'v2',
		hex: '#EE0026',
		toneSymbol: 'v',
		hueNumber: 2,
		isNeutral: false,
		achromaticBucket: null
	},
	{
		notation: 'v8',
		hex: '#FFD900',
		toneSymbol: 'v',
		hueNumber: 8,
		isNeutral: false,
		achromaticBucket: null
	},
	{
		notation: 'v14',
		hex: '#00873C',
		toneSymbol: 'v',
		hueNumber: 14,
		isNeutral: false,
		achromaticBucket: null
	},
	{
		notation: 'v18',
		hex: '#0068B7',
		toneSymbol: 'v',
		hueNumber: 18,
		isNeutral: false,
		achromaticBucket: null
	},
	{
		notation: 'W',
		hex: '#FFFFFF',
		toneSymbol: null,
		hueNumber: null,
		isNeutral: true,
		achromaticBucket: 'W'
	}
];

describe('findClosestPccs', () => {
	it('純赤に最も近いのはv2', () => {
		const results = findClosestPccs('#FF0000', sampleColors, 3);
		expect(results[0].color.notation).toBe('v2');
	});

	it('topNで件数が制限される', () => {
		const results = findClosestPccs('#FF0000', sampleColors, 3);
		expect(results).toHaveLength(3);
	});

	it('topNが配列長を超える場合はすべて返す', () => {
		const results = findClosestPccs('#FF0000', sampleColors, 10);
		expect(results).toHaveLength(sampleColors.length);
	});

	it('ΔE₀₀昇順で返される', () => {
		const results = findClosestPccs('#FF0000', sampleColors, 5);
		for (let i = 1; i < results.length; i++) {
			expect(results[i].deltaE).toBeGreaterThanOrEqual(results[i - 1].deltaE);
		}
	});

	it('完全一致のΔE₀₀は0', () => {
		const results = findClosestPccs('#EE0026', sampleColors, 1);
		expect(results[0].deltaE).toBeCloseTo(0, 5);
	});
});
