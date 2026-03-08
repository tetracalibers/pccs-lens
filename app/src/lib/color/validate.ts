export const isValidHexColor = (v: string | null): v is string => /^#[0-9A-Fa-f]{6}$/.test(v ?? "")
