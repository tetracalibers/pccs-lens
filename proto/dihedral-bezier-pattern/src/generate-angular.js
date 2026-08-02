#!/usr/bin/env node
/**
 * 直線版：二面体群 D_n の対称性をもつ角ばったパターンを SVG として一括生成する。
 *
 *   node src/generate-angular.js [--n=8] [--size=480] [--seed=12345]
 *                                [--count=1] [--shape=polygon|circle] [--colors=#fff,#000]
 */

import { run } from './cli.js'
import { buildMotif } from './motif-angular.js'

run({
  patternName: 'angular',
  scriptName: 'generate-angular.js',
  title: '二面体群ベジェパターン（直線版）',
  buildMotif,
})
