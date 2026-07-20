// TTF の name テーブルを正規のファミリー名に書き換える。
//
// Fontsource の可変フォント由来の静的インスタンスは、ファミリー名に既定インスタンス名（例: "Thin"）が
// 混入していることがあり（"SUSE Mono Thin ExtraBold" など）、resvg/fontdb で font-family="SUSE Mono" が
// マッチせず別フォントにフォールバックしてしまう。そこで name テーブルだけを差し替えて
// ファミリー名を "SUSE Mono" 等に正規化する。ウェイト（OS/2 usWeightClass）は変更しないので、
// font-family＋font-weight のマッチが正しく効くようになる。
//
// 他テーブルはバイト単位でそのまま残し、name テーブルをファイル末尾に追記して
// テーブルディレクトリの該当エントリ（offset/length/checksum）だけ更新する。
// checksum 系は ttf-parser（resvg が利用）が検証しないため 0 にしておく。

const enc = { WIN: 3, WIN_UCS2: 1, WIN_EN: 0x0409, MAC: 1, MAC_ROMAN: 0, MAC_EN: 0 }

/** UTF-16BE バッファ */
const utf16be = (str) => Buffer.from(str, "utf16le").swap16()

/**
 * @param {Buffer} ttf 元の TTF
 * @param {string} family 正規化後のファミリー名（例: "SUSE Mono"）
 * @returns {Buffer} name テーブルを差し替えた TTF
 */
export const renameFontFamily = (ttf, family) => {
  const numTables = ttf.readUInt16BE(4)
  const dir = []
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16
    dir.push({
      tag: ttf.toString("ascii", o, o + 4),
      offset: ttf.readUInt32BE(o + 8),
      length: ttf.readUInt32BE(o + 12),
      dirOffset: o
    })
  }
  const nameEntry = dir.find((d) => d.tag === "name")
  if (!nameEntry) throw new Error("name テーブルが見つかりません")

  const ps = family.replace(/\s+/g, "")
  // (nameID, 文字列) — 主要な名前を Windows / Mac 両プラットフォームで書き込む
  const entries = [
    [1, family], // Font Family
    [2, "Regular"], // Font Subfamily（ウェイトは OS/2 が持つのでここは Regular 固定）
    [3, `${family} Regular`], // Unique ID
    [4, family], // Full name
    [6, `${ps}-Regular`], // PostScript name
    [16, family], // Typographic Family
    [17, "Regular"] // Typographic Subfamily
  ]

  /** @type {{plat:number,enc:number,lang:number,id:number,buf:Buffer}[]} */
  const records = []
  for (const [id, str] of entries) {
    records.push({ plat: enc.WIN, enc: enc.WIN_UCS2, lang: enc.WIN_EN, id, buf: utf16be(str) })
    records.push({ plat: enc.MAC, enc: enc.MAC_ROMAN, lang: enc.MAC_EN, id, buf: Buffer.from(str, "latin1") })
  }
  records.sort((a, b) => a.plat - b.plat || a.enc - b.enc || a.lang - b.lang || a.id - b.id)

  const count = records.length
  const storage = Buffer.concat(records.map((r) => r.buf))
  const recs = Buffer.alloc(count * 12)
  let strPos = 0
  records.forEach((r, i) => {
    const o = i * 12
    recs.writeUInt16BE(r.plat, o)
    recs.writeUInt16BE(r.enc, o + 2)
    recs.writeUInt16BE(r.lang, o + 4)
    recs.writeUInt16BE(r.id, o + 6)
    recs.writeUInt16BE(r.buf.length, o + 8)
    recs.writeUInt16BE(strPos, o + 10)
    strPos += r.buf.length
  })
  const header = Buffer.alloc(6)
  header.writeUInt16BE(0, 0) // format 0
  header.writeUInt16BE(count, 2)
  header.writeUInt16BE(6 + count * 12, 4) // stringOffset
  const newName = Buffer.concat([header, recs, storage])
  const nameLen = newName.length

  // 末尾に 4 バイト境界で追記
  const align = (n) => (n % 4 === 0 ? n : n + (4 - (n % 4)))
  const newOffset = align(ttf.length)
  const out = Buffer.concat([ttf, Buffer.alloc(newOffset - ttf.length), newName, Buffer.alloc(align(nameLen) - nameLen)])

  // ディレクトリの name エントリを更新（checksum は 0）
  out.writeUInt32BE(0, nameEntry.dirOffset + 4)
  out.writeUInt32BE(newOffset, nameEntry.dirOffset + 8)
  out.writeUInt32BE(nameLen, nameEntry.dirOffset + 12)

  // head.checkSumAdjustment を 0 に（再計算しないため）
  const head = dir.find((d) => d.tag === "head")
  if (head) out.writeUInt32BE(0, head.offset + 8)

  return out
}
