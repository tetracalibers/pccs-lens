import chroma from "chroma-js"

export const isValidHexColor = (v: string | null): v is string => v !== null && chroma.valid(v)
