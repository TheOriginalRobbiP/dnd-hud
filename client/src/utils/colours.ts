// Tier colour utilities — reads from CSS custom properties
// Single source of truth: index.css :root

export type LootBoxTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary' | 'celestial'
export type EffortType = 'basic' | 'weapon' | 'magic' | 'ultimate'

export function tierColour(tier: string): string {
  return `var(--tier-${tier})`
}

export function effortColour(effort: string): string {
  return `var(--effort-${effort})`
}

export const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold',
  platinum: 'Platinum', legendary: 'Legendary', celestial: 'Celestial',
}

export const EFFORT_LABELS: Record<string, string> = {
  basic: 'Basic', weapon: 'Weapon', magic: 'Magic', ultimate: 'Ultimate',
}
