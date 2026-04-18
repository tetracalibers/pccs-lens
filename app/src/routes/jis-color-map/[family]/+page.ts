import { error } from "@sveltejs/kit"
import { isColorFamily } from "$lib/data/jis-colors"

export const ssr = false

export function load({ params }: { params: { family: string } }) {
  if (!isColorFamily(params.family)) {
    error(404, `色み "${params.family}" は存在しません`)
  }
  return { family: params.family }
}
