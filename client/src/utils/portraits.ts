// Crawler portrait mapping — update filename when a new version is generated
const PORTRAIT_MAP: Record<string, string> = {
  doris: '/images/crawlers/hud_doris_v6_00001_.png',
  flex:  '/images/crawlers/hud_flex_v7_00001_.png',
  quill: '/images/crawlers/hud_quill_v6_00001_.png',
  miles: '/images/crawlers/hud_miles_v6_00001_.png',
}

export function getCrawlerPortrait(crawlerName: string): string | null {
  const key = crawlerName.toLowerCase().trim()
  return PORTRAIT_MAP[key] ?? null
}
