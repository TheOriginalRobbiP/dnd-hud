// Crawler portrait mapping — name-based fallback for pre-gens
// The primary source is now character.portrait from the DB (set during wizard)
const PORTRAIT_MAP: Record<string, string> = {
  doris: '/images/crawlers/doris.png',
  flex:  '/images/crawlers/flex.png',
  quill: '/images/crawlers/quill.png',
  miles: '/images/crawlers/miles.png',
  rex:   '/images/crawlers/rex.png',
  sugar: '/images/crawlers/sugar.png',
  vance: '/images/crawlers/vance.png',
}

/**
 * Resolve a portrait for a character.
 * Priority: explicit DB portrait → name-based pre-gen map → null
 */
export function getCrawlerPortrait(crawlerName: string, dbPortrait?: string | null): string | null {
  if (dbPortrait) return dbPortrait
  const key = crawlerName.toLowerCase().trim()
  return PORTRAIT_MAP[key] ?? null
}
