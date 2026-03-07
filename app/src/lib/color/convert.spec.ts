import { describe, it, expect } from 'vitest';
import { hexToLab } from './convert';

describe('hexToLab', () => {
	it('黒（#000000）はL=0, a≈0, b≈0', () => {
		const lab = hexToLab('#000000');
		expect(lab.L).toBeCloseTo(0, 1);
		expect(lab.a).toBeCloseTo(0, 1);
		expect(lab.b).toBeCloseTo(0, 1);
	});

	it('白（#ffffff）はL≈100, a≈0, b≈0', () => {
		const lab = hexToLab('#ffffff');
		expect(lab.L).toBeCloseTo(100, 1);
		expect(lab.a).toBeCloseTo(0, 1);
		expect(lab.b).toBeCloseTo(0, 1);
	});

	it('純赤（#ff0000）はL≈53.4, a≈80.1, b≈67.2', () => {
		const lab = hexToLab('#ff0000');
		expect(lab.L).toBeCloseTo(53.4, 0);
		expect(lab.a).toBeCloseTo(80.1, 0);
		expect(lab.b).toBeCloseTo(67.2, 0);
	});

	it('大文字小文字を区別しない', () => {
		const lower = hexToLab('#aabbcc');
		const upper = hexToLab('#AABBCC');
		expect(lower.L).toBeCloseTo(upper.L, 5);
		expect(lower.a).toBeCloseTo(upper.a, 5);
		expect(lower.b).toBeCloseTo(upper.b, 5);
	});
});
