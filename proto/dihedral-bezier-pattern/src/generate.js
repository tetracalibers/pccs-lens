#!/usr/bin/env node
/**
 * 曲線版：二面体群 D_n の対称性をもつベジェ曲線パターンを SVG として一括生成する。
 *
 *   node src/generate.js [--n=8] [--size=480] [--seed=12345]
 *                        [--count=1] [--shape=polygon|circle] [--colors=#fff,#000]
 */

import { run } from './cli.js'
import { buildMotif } from './motif.js'

run({
  patternName: 'curved',
  scriptName: 'generate.js',
  title: '二面体群ベジェパターン（曲線版）',
  buildMotif,
})
