import type { Character } from '../types'

/**
 * Parses stat modifiers from an item description.
 * Looks for patterns like: +1 STR, -2 INT, +3 DEX (case-insensitive).
 */
export function parseStatModifiers(description: string): Record<string, number> {
  const mods: Record<string, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, CHA: 0 }
  if (!description) return mods
  
  const regex = /([+-]\d+)\s*(?:to\s*)?(str|dex|con|int|cha)\b/gi
  let match
  while ((match = regex.exec(description)) !== null) {
    const val = parseInt(match[1], 10)
    const stat = match[2].toUpperCase()
    if (stat in mods) {
      mods[stat] += val
    }
  }
  return mods
}

/**
 * Returns a new character copy with dynamically adjusted attributes and skills
 * based on their currently equipped gear.
 */
export function getModifiedCharacter(character: Character): Character {
  if (!character) return character

  const modifiedStats = { ...character.stats }
  const modifiedSkills = character.skills.map(s => ({ ...s }))
  const equipment = character.equipment as Record<string, any>

  if (!equipment) return character

  Object.values(equipment).forEach((item: any) => {
    if (!item || !item.description) return

    // 1. Process Stat Modifiers (e.g., +1 STR, -1 INT)
    const statRegex = /([+-]\d+)\s*(?:to\s*)?(str|dex|con|int|cha)\b/gi
    let statMatch
    while ((statMatch = statRegex.exec(item.description)) !== null) {
      const val = parseInt(statMatch[1], 10)
      const stat = statMatch[2].toUpperCase() as keyof typeof modifiedStats
      if (stat in modifiedStats) {
        modifiedStats[stat] = Math.max(1, modifiedStats[stat] + val) // min stat is 1
      }
    }

    // 2. Process Skill Level Modifiers (e.g., +2 to Swordplay, +1 Stealth)
    modifiedSkills.forEach((skill: any) => {
      const escapedSkillName = skill.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const skillRegex = new RegExp(`([+-]\\d+)\\s*(?:to\\s*)?${escapedSkillName}\\b`, 'i')
      const skillMatch = skillRegex.exec(item.description)
      if (skillMatch) {
        const val = parseInt(skillMatch[1], 10)
        skill.level = Math.max(1, skill.level + val) // min skill level is 1
      }
    })

    // 3. Process Item-Granted Skills
    // Handles: "Grants skill: Spell-Casting", "Grants Shield Bash skill", "Grants the Fireball skill"
    const grantRegexes = [
      /grants\s+skill:\s*([a-zA-Z\s\-]+?)(?:\.|$|,)/i,
      /grants\s+the\s+([a-zA-Z\s\-]+?)\s+skill(?:\.|$|,)/i,
      /grants\s+([a-zA-Z\s\-]+?)\s+skill(?:\.|$|,)/i,
    ]

    grantRegexes.forEach(regex => {
      const grantMatch = regex.exec(item.description)
      if (grantMatch) {
        const name = grantMatch[1].trim()
        const alreadyHas = modifiedSkills.some(s => s.name.toLowerCase() === name.toLowerCase())
        if (!alreadyHas && name.length > 2 && name.toLowerCase() !== 'the') {
          const lowerDesc = item.description.toLowerCase()
          const effortType = lowerDesc.includes('ultimate') ? 'ultimate'
            : lowerDesc.includes('magic') || lowerDesc.includes('spell') ? 'magic'
            : lowerDesc.includes('weapon') || lowerDesc.includes('melee') || lowerDesc.includes('sword') ? 'weapon'
            : 'basic'

          modifiedSkills.push({
            id: `granted-${item.id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), // titlecase
            level: 1, // granted skills start at level 1
            description: `Granted by equipped item: ${item.name}`,
            effortType: effortType as any,
            specialisation: '',
            isGranted: true, // flag to highlight on UI
            grantedBy: item.name
          } as any)
        }
      }
    })
  })

  return {
    ...character,
    stats: modifiedStats,
    skills: modifiedSkills
  }
}