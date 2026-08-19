#!/usr/bin/env node
/**
 * 準結晶版：カイト＆ダートタイリング（ペンローズ P2）を「未知の鉱物の標本」として
 * 描く。結晶核を中心に、結晶面・劈開線・頂点ネットワーク・回折像を
 * 重ね、色数 2〜6 で一括生成する。
 *
 *   node src/generate-crystal.js [--repeat=12] [--layers=tile,cleave,network,diffraction]
 *                               [--color-by=orientation] [--cleave=3] [--cleave-opacity=1]
 *                               [--growth=1] [--frames=1]
 *                               [--seeds=1] [--size=480]
 *                               [--seed=12345] [--count=1] [--color-count=4,5]
 *                               [--colors=#fff,#000]
 */

import { run } from './cli-crystal.js'

run()
