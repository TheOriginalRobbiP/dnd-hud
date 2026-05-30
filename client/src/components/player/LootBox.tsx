import { tierColour } from '../../utils/colours'
import { useState } from 'react'
import type { LootBox as LootBoxType, WSMessage, FloorState } from '../../types'

const LOOTBOX_IMAGES: Record<string, string> = {
  bronze:    '/images/lootboxes/lootbox-bronze.png',
  silver:    '/images/lootboxes/lootbox-silver.png',
  gold:      '/images/lootboxes/lootbox-gold.png',
  platinum:  '/images/lootboxes/lootbox-platinum.png',
  legendary: '/images/lootboxes/lootbox-legendary.png',
  celestial: '/images/lootboxes/lootbox-celestial.png',
}

const SPECIALTY_LABELS: Record<string, string> = {
  adventurer:    'ADVENTURER',
  assassin:      'ASSASSIN',
  lucky_bitch:   'LUCKY BITCH',
  asshole:       'ASSHOLE',
  goblin:        'GOBLIN DEMO',
  looter:        'LOOTER',
  lucky_bastard: 'LUCKY BASTARD',
  mechanic:      'MECHANIC',
  pet:           'PET CARE',
  quest:         'QUEST REWARD',
  savage:        'SAVAGE PVP',
  survivor:      'SURVIVOR'
}

const SPECIALTY_COLOURS: Record<string, string> = {
  adventurer:    '', // falls back to standard tier colour
  assassin:      '#ef4444',
  lucky_bitch:   '#f472b6',
  asshole:       '#b45309',
  goblin:        '#10b981',
  looter:        '#3b82f6',
  lucky_bastard: '#f59e0b',
  mechanic:      '#71717a',
  pet:           '#ea580c',
  quest:         '#8b5cf6',
  savage:        '#991b1b',
  survivor:      '#06b6d4'
}

const AI_COMMENTARIES: Record<string, string> = {
  adventurer:    "Congratulations, crawler! Here is your standard-issue cardboard box of disappointing, low-grade survival trash. Enjoy.",
  assassin:      "Ah, a finessed murderer in the making! Enjoy your tools of silent execution. Don't worry, the blood washes out... mostly.",
  lucky_bitch:   "Relying on game glitches and begging the AI because you can't survive on skill? Here is your little bitch box, you little bitch.",
  asshole:       "Wow, look in the mirror. You sleep soundly after making those terrible life choices? Here is the absolute garbage you deserve.",
  goblin:        "Goblins and fireworks! Keep blowing things up and throwing funpowder, and I'll keep feeding your unhinged pyromania.",
  looter:        "Ooh, a kleptomaniac shopping spree! Your materialistic greed has been noticed. Take more stuff, grab everything!",
  lucky_bastard: "Luck is a real force, crawler. You pulled off the impossible through pure dumb chance. Here are some gambling chips. Try not to choke.",
  mechanic:      "Apocalypse won't stop you from tuning your ride! Take these parts and build a murder-machine to pimp your crawler experience.",
  pet:           "Oh, you brought a poor defenseless creature into this slaughterhouse? How sweet. And how utterly irresponsible. Feed it.",
  quest:         "You completed a basic chore for us. Exciting. Take your gold star and go back to being entertainment.",
  savage:        "Going full murder-hobo on your fellow humans? Brilliant! Here is some savage crawler-slaying gear. Slay away!",
  survivor:      "Barely made it out of that fight with your internal organs intact? How dramatic! Take this band-aid and get back in there."
}

type OpenState = 'idle' | 'opening-1' | 'opening-2' | 'revealed'

interface LootBoxProps {
  lootBox: LootBoxType
  charId: string
  send: (msg: WSMessage) => void
  floorState?: FloorState
  onLogAction?: (text: string, type: 'roll' | 'item' | 'equip' | 'status' | 'system') => void
}

export function LootBox({ lootBox, charId, send, floorState, onLogAction }: LootBoxProps) {
  const [openState, setOpenState] = useState<OpenState>('idle')
  const colour = tierColour(lootBox.tier)
  
  // Retrieve boxType safely from LootBox or first item metadata backup
  const boxType = lootBox.boxType || (lootBox.contents[0] as any)?.boxType || 'adventurer'
  const specialtyColour = SPECIALTY_COLOURS[boxType] || colour
  const specialtyLabel = SPECIALTY_LABELS[boxType] || 'ADVENTURER'
  const aiCommentary = AI_COMMENTARIES[boxType] || AI_COMMENTARIES.adventurer

  const boxImg = LOOTBOX_IMAGES[lootBox.tier] ?? LOOTBOX_IMAGES.bronze

  const currentTags = floorState?.currentRoomData?.tags || ''
  const isSafeRoom = Array.isArray(currentTags)
    ? currentTags.map(t => String(t).toLowerCase()).some(t => t.includes('safe'))
    : typeof currentTags === 'string'
    ? currentTags.toLowerCase().includes('safe')
    : false

  const hasActiveMobs = (floorState?.activeMobs || []).length > 0
  const isSecureArea = isSafeRoom && !hasActiveMobs

  const handleOpen = () => {
    if (lootBox.state !== 'authorised' || openState !== 'idle') return

    if (!isSecureArea) {
      send({ type: 'play_sound', soundId: 'error' })
      if (hasActiveMobs) {
        onLogAction?.("⚠️ [SYSTEM WARNING] ACTIVE HOSTILES DETECTED. Unboxing is strictly prohibited during active combat.", "system")
      } else {
        onLogAction?.("⚠️ [SYSTEM REQUISITE ERROR] All award boxes may only be unboxed inside secure Safe Rooms.", "system")
      }
      return
    }

    setOpenState('opening-1')
    
    // Satisfying mechanical opening click was turned off per user request
    /*
    try {
      const audio = new Audio('/audio/loot_box.mp3')
      audio.volume = 0.6
      audio.play().catch(() => {})
    } catch {
      // Autoplay or audio initialization blocked
    }
    */

    setTimeout(() => setOpenState('opening-2'), 400)
    setTimeout(() => {
      setOpenState('revealed')
      // Voice announcements turned off per user request
      // send({ type: 'play_sound', soundId: 'loot_legendary' })
    }, 800)
  }

  const handleClaim = () => {
    send({ type: 'loot_opened', lootBoxId: lootBox.id, charId })
  }

  if (lootBox.state === 'pending') {
    return (
      <div className="border border-hud-border bg-hud-bg p-3">
        <div className="flex items-center gap-3">
          <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain opacity-40 grayscale" />
          <div>
            <div className="font-hud text-sm text-hud-muted tracking-widest uppercase">🔒 {lootBox.tier} {specialtyLabel} BOX</div>
            <div className="font-hud text-xs text-hud-muted mt-0.5 italic animate-pulse uppercase">AWAITING AUTHORISATION</div>
          </div>
        </div>
      </div>
    )
  }

  if (openState === 'revealed' || lootBox.state === 'opened') {
    return (
      <div className="border p-4 transition-all duration-500 bg-[#121214]/60 flex flex-col gap-3 rounded-[2px]" style={{ borderColor: specialtyColour, boxShadow: `0 0 15px ${specialtyColour}22` }}>
        <div className="flex justify-between items-center border-b border-hud-border/30 pb-2">
          <div className="font-hud text-xs tracking-widest font-bold uppercase" style={{ color: specialtyColour }}>
            🎁 {lootBox.tier} {specialtyLabel} BOX — UNBOXED
          </div>
          <span className="font-mono-dcc text-[9px] text-hud-muted">DECRYPTED ✓</span>
        </div>
        
        {lootBox.contents && lootBox.contents.length > 0 && (
          <div className="flex flex-col gap-3">
            {lootBox.contents.map((item, idx) => (
              <div key={item.id || idx} className="flex items-start gap-4 border-b border-hud-border/10 pb-2.5 last:border-0 last:pb-0">
                <img src={boxImg} alt={lootBox.tier} className="w-10 h-10 object-contain opacity-45 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-hud text-sm font-semibold text-hud-text uppercase tracking-wider">{item.name}</div>
                  <div className="font-hud text-[11px] text-hud-muted mt-0.5 leading-relaxed">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SYSTEM AI CHAT COMMENTARY */}
        <div className="border-t border-hud-border/30 pt-2.5 mt-1 flex flex-col gap-1.5 bg-black/35 p-3 border border-hud-border/20 rounded-[2px]">
          <div className="flex items-center gap-2">
            <span className="text-hud-accent font-bold text-[10px] tracking-widest uppercase animate-pulse">⚡ SYSTEM AI DETECTED:</span>
          </div>
          <p className="font-serif-dcc text-xs italic text-hud-muted leading-relaxed pl-1.5">
            "{aiCommentary}"
          </p>
        </div>

        {/* CLAIM REWARDS BUTTON (Only shown during active local unboxing!) */}
        {lootBox.state !== 'opened' && (
          <button
            onClick={handleClaim}
            className="w-full font-hud text-[10px] text-hud-bg font-extrabold py-2.5 mt-1 rounded uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg"
            style={{ backgroundColor: specialtyColour, border: `1px solid ${specialtyColour}` }}
          >
            ⚡ CLAIM REWARDS (ADD TO BACKPACK)
          </button>
        )}
      </div>
    )
  }

  if (openState === 'opening-1') return (
    <div className="border p-3 bg-black/40" style={{ borderColor: specialtyColour }}>
      <div className="flex items-center gap-3">
        <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain animate-pulse" />
        <div className="font-hud text-sm tracking-widest animate-pulse uppercase" style={{ color: specialtyColour }}>OPENING TRANSMISSION...</div>
      </div>
    </div>
  )

  if (openState === 'opening-2') return (
    <div className="border p-3 bg-black/45" style={{ borderColor: specialtyColour }}>
      <div className="flex items-center gap-3">
        <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain animate-bounce" />
        <div className="font-hud text-sm tracking-widest animate-pulse uppercase" style={{ color: specialtyColour }}>DECRYPTING CONTENTS...</div>
      </div>
    </div>
  )

  // authorised — tap to open
  if (!isSecureArea) {
    const errorMsg = hasActiveMobs ? 'COMBAT ACTIVE' : 'SAFE ZONE REQUIRED'
    return (
      <button onClick={handleOpen}
        className="border border-red-900 bg-red-950/5 p-3 w-full text-left transition-all duration-300 cursor-pointer hover:border-red-500 hover:scale-[1.01]"
        style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.15)' }}>
        <div className="flex items-center gap-3">
          <img src={boxImg} alt={lootBox.tier} className="w-14 h-14 object-contain grayscale opacity-60 animate-pulse" />
          <div>
            <div className="font-hud text-sm tracking-widest text-red-500 font-bold uppercase">
              ⚠️ {lootBox.tier.toUpperCase()} {specialtyLabel} BOX — SECURED
            </div>
            <div className="font-hud text-[10px] text-hud-muted mt-1 leading-tight uppercase font-semibold">
              {errorMsg}
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button onClick={handleOpen}
      className="border p-3 w-full text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-[#161619]/40 rounded-[2px]"
      style={{ borderColor: specialtyColour, boxShadow: `0 0 14px ${specialtyColour}33` }}>
      <div className="flex items-center gap-4">
        <img src={boxImg} alt={lootBox.tier} className="w-14 h-14 object-contain animate-pulse" />
        <div>
          <div className="font-hud text-sm tracking-widest font-bold uppercase" style={{ color: specialtyColour }}>
            🎁 {lootBox.tier} {specialtyLabel} BOX — AUTHORISED
          </div>
          <div className="font-hud text-[10px] mt-1 tracking-widest uppercase font-semibold text-hud-muted animate-pulse">TAP TO DECRYPT BOX</div>
        </div>
      </div>
    </button>
  )
}


