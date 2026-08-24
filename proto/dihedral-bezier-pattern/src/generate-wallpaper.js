#!/usr/bin/env node
/**
 * 壁紙群版：17 の壁紙群それぞれの対称性をもつ、直線的な幾何模様を SVG として一括生成する。
 * 模様そのものを見せるのが目的なので、対称操作の見分けに使う非対称な印は既定では置かず、
 * 群を見比べたいときだけ --mark で足す。
 *
 *   node src/generate-wallpaper.js [--group=p4m,p6m] [--repeat=5] [--guide] [--mark]
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
  // 模様として見せる版なので、文字に読める F 字の印は既定では置かない
  markDefault: false,
})
