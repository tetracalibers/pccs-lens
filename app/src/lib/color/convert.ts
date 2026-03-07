import type { Lab } from '$lib/data/types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace('#', '');
	return {
		r: parseInt(clean.slice(0, 2), 16),
		g: parseInt(clean.slice(2, 4), 16),
		b: parseInt(clean.slice(4, 6), 16)
	};
}

function rgbToLinear(value: number): number {
	const v = value / 255;
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
	// D65 illuminant
	return {
		x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
		y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
		z: r * 0.0193339 + g * 0.119192 + b * 0.9503041
	};
}

function xyzToLab(x: number, y: number, z: number): Lab {
	// D65 reference white
	const xn = 0.95047;
	const yn = 1.0;
	const zn = 1.08883;

	function f(t: number): number {
		return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
	}

	const fx = f(x / xn);
	const fy = f(y / yn);
	const fz = f(z / zn);

	return {
		L: 116 * fy - 16,
		a: 500 * (fx - fy),
		b: 200 * (fy - fz)
	};
}

export function hexToLab(hex: string): Lab {
	const { r, g, b } = hexToRgb(hex);
	const lr = rgbToLinear(r);
	const lg = rgbToLinear(g);
	const lb = rgbToLinear(b);
	const { x, y, z } = linearToXyz(lr, lg, lb);
	return xyzToLab(x, y, z);
}
