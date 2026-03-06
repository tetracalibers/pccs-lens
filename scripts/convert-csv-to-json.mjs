#!/usr/bin/env node
/**
 * CSV → JSON 変換スクリプト
 *
 * data/*.csv を読み込み、app/src/lib/data/*.json を生成する。
 * data/*.csv を更新したときに手動実行する。
 *
 * 実行方法（app/ ディレクトリから）:
 *   npm run convert
 *
 * または（リポジトリルートから）:
 *   node scripts/convert-csv-to-json.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(ROOT, 'data')
const OUT_DIR = resolve(ROOT, 'app', 'src', 'lib', 'data')

// トーン記号（長いものを先に並べて前方一致の誤判定を防ぐ）
const TONE_SYMBOLS = [
  'ltg',
  'dkg',
  'dp',
  'sf',
  'dk',
  'lt',
  'b',
  'd',
  'g',
  'p',
  'v',
  's',
]

/**
 * PCCS表記から無彩色のバケット区分を返す。
 * 閾値は color-analysis-rules.md §4 に準拠。
 * @param {string} notation
 * @returns {'W' | 'ltGy' | 'mGy' | 'dkGy' | 'Bk'}
 */
function getAchromaticBucket(notation) {
  if (notation === 'W') return 'W'
  if (notation === 'Bk') return 'Bk'
  const match = notation.match(/^Gy-(\d+\.?\d*)$/)
  if (!match) throw new Error(`Unknown neutral notation: ${notation}`)
  const value = parseFloat(match[1])
  if (value >= 7.0) return 'ltGy'
  if (value >= 4.0) return 'mGy'
  return 'dkGy'
}

/**
 * PCCS表記をパースしてフィールドを返す。
 * @param {string} notation
 */
function parsePccsNotation(notation) {
  // 無彩色
  if (notation === 'W' || notation === 'Bk' || notation.startsWith('Gy-')) {
    return {
      toneSymbol: null,
      hueNumber: null,
      isNeutral: true,
      achromaticBucket: getAchromaticBucket(notation),
    }
  }

  // 有彩色: [トーン記号][色相番号]
  for (const tone of TONE_SYMBOLS) {
    if (notation.startsWith(tone)) {
      const hueNumber = parseInt(notation.slice(tone.length), 10)
      if (!isNaN(hueNumber) && hueNumber >= 1 && hueNumber <= 24) {
        return {
          toneSymbol: tone,
          hueNumber,
          isNeutral: false,
          achromaticBucket: null,
        }
      }
    }
  }

  throw new Error(`Cannot parse PCCS notation: ${notation}`)
}

/**
 * PCCS色CSVを変換する。
 * フォーマット: [PCCS表記],[HEXコード]
 * @param {string} filename
 */
function convertPccsCsv(filename) {
  const lines = readFileSync(resolve(DATA_DIR, filename), 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return lines.map((line) => {
    const commaIdx = line.indexOf(',')
    const notation = line.slice(0, commaIdx)
    const hex = line.slice(commaIdx + 1)
    return { notation, hex, ...parsePccsNotation(notation) }
  })
}

/**
 * JIS慣用色名CSVを変換する。
 * フォーマット: [慣用色名],[読み],[HEXコード],[出題級]
 * 1行目はヘッダー行としてスキップする。
 */
function convertJisCsv() {
  const lines = readFileSync(resolve(DATA_DIR, 'jis_colors.csv'), 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(1) // ヘッダー行をスキップ

  return lines.map((line) => {
    const parts = line.split(',')
    const name = parts[0]
    const reading = parts[1]
    const hex = parts[2]
    const examLevelStr = parts[3]
    const examLevel = examLevelStr === '3' ? 3 : examLevelStr === '2' ? 2 : null
    return { name, reading, hex, examLevel }
  })
}

/**
 * JSONファイルを書き出す。
 * @param {string} filename
 * @param {unknown[]} data
 */
function writeJson(filename, data) {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(
    resolve(OUT_DIR, filename),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8',
  )
  console.log(`  ${filename} (${data.length} entries)`)
}

console.log('Converting CSV to JSON...')
writeJson('pccs_colors.json', convertPccsCsv('pccs_colors.csv'))
writeJson('pccs_colors_full.json', convertPccsCsv('pccs_colors_full.csv'))
writeJson('jis_colors.json', convertJisCsv())
console.log('Done.')
