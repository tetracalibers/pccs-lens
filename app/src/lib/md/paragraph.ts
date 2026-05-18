/**
 * 空行区切りで段落に分割し、各段落をソフト改行（単一改行）で行に分割する。
 * remark-breaks 相当の改行扱いをそのまま再現する用途を想定。
 */
export const parseParagraphs = (text: string): string[][] =>
  text
    .trim()
    .split(/\n{2,}/)
    .filter((p) => p.length > 0)
    .map((p) => p.split("\n"))
