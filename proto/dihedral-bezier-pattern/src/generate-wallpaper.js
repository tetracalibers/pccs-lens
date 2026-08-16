#!/usr/bin/env node
/**
 * 壁紙群版：17 の壁紙群それぞれの対称性をもつ模様を SVG として一括生成し、
 * 群どうしを見比べられるようにする。
 *
 *   node src/generate-wallpaper.js [--group=p4m,p6m] [--repeat=5] [--guide]
 *                                  [--size=480] [--seed=12345] [--count=1]
 *                                  [--color-count=4,5] [--colors=#fff,#000]
 */

import { run } from './cli-wallpaper.js'
import { buildMotif } from './motif-wallpaper.js'

run({
  patternName: 'wallpaper',
  scriptName: 'generate-wallpaper.js',
  title: '壁紙群パターン（17 群）',
  buildMotif,
})
