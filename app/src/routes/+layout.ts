export const trailingSlash = "always"

// 全ルートをプリレンダ対象にする（各ルートが自分の index.html を吐く）。
// ssr = false のページは空シェルの index.html を出力し、OGP はビルド後注入で担保する。
export const prerender = true
