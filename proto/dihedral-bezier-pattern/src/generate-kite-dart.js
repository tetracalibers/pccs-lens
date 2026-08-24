#!/usr/bin/env node
/**
 * カイト＆ダートタイリング版：凧形（カイト）と矢じり形（ダート）の 2 種で
 * 平面を埋める非周期タイリング（ペンローズ P2）を、色数 2〜6 で一括生成する。
 *
 *   node src/generate-kite-dart.js [--repeat=8] [--outline] [--size=480]
 *                                  [--seed=12345] [--count=1] [--color-count=4,5]
 *                                  [--colors=#fff,#000]
 */

import { run } from './cli-kite-dart.js'

run()
