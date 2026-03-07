import type { PCCSColor, ApproximateResult } from '$lib/data/types';
import { hexToLab } from './convert';
import { deltaE2000 } from './ciede2000';

export function findClosestPccs(
	inputHex: string,
	colors: PCCSColor[],
	topN: number
): ApproximateResult[] {
	const inputLab = hexToLab(inputHex);

	const results: ApproximateResult[] = colors.map((color) => ({
		color,
		deltaE: deltaE2000(inputLab, hexToLab(color.hex))
	}));

	results.sort((a, b) => a.deltaE - b.deltaE);

	return results.slice(0, topN);
}
