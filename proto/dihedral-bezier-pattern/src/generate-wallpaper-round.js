#!/usr/bin/env node
/**
 * 壁紙群・丸み版：丸い図形を組み合わせた模様を 17 の壁紙群それぞれで一括生成し、
 * 群どうしを見比べられるようにする。
 *
 *   node src/generate-wallpaper-round.js [--group=p4m,p6m] [--repeat=5] [--guide]
 *                                        [--size=480] [--seed=12345] [--count=1]
 *                                        [--colors=#fff,#000]
 */

import { run } from './cli-wallpaper.js'
import { buildMotif } from './motif-wallpaper-round.js'

run({
  patternName: 'wallpaper-round',
  scriptName: 'generate-wallpaper-round.js',
  title: '壁紙群パターン・丸み版（17 群）',
  buildMotif,
})
