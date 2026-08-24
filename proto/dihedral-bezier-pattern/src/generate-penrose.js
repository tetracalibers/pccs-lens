#!/usr/bin/env node
/**
 * 五角形ペンローズタイリング版：正五角形・星・舟・菱形の 4 種で平面を埋める
 * 非周期タイリング（P1）を、色数 2〜6 で一括生成する。
 *
 *   node src/generate-penrose.js [--repeat=8] [--outline] [--size=480]
 *                                [--seed=12345] [--count=1] [--color-count=4,5]
 *                                [--colors=#fff,#000]
 */

import { run } from './cli-penrose.js'

run()
