const isCF = import.meta.env.CF_PAGES === "true"

export const isProduction = import.meta.env.NODE_ENV === "production" && !isCF
