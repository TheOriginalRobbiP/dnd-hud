import { tierColour } from '../../utils/colours'
import { useState } from 'react'
import type { LootBox as LootBoxType, WSMessage } from '../../types'

const LOOTBOX_IMAGES: Record<string, string> = {
  bronze:    '/images/lootboxes/lootbox-bronze.png',
  silver:    '/images/lootboxes/lootbox-silver.png',
  gold:      '/images/lootboxes/lootbox-gold.png',
  platinum:  '/images/lootboxes/lootbox-platinum.png',
  legendary: '/images/lootboxes/lootbox-legendary.png',
  celestial: '/images/lootboxes/lootbox-celestial.png',
}

type OpenState = 'idle' | 'opening-1' | 'opening-2' | 'revealed'

interface LootBoxProps {
  lootBox: LootBoxType
  charId: string
  send: (msg: WSMessage) => void
}

export function LootBox({ lootBox, charId, send }: LootBoxProps) {
  const [openState, setOpenState] = useState<OpenState>('idle')
  const colour = tierColour(lootBox.tier)
  const item = lootBox.contents[0]
  const boxImg = LOOTBOX_IMAGES[lootBox.tier] ?? LOOTBOX_IMAGES.bronze

  const handleOpen = () => {
    if (lootBox.state !== 'authorised' || openState !== 'idle') return
    setOpenState('opening-1')
    setTimeout(() => setOpenState('opening-2'), 400)
    setTimeout(() => {
      setOpenState('revealed')
      send({ type: 'loot_opened', lootBoxId: lootBox.id, charId })
    }, 800)
  }

  if (lootBox.state === 'pending') {
    return (
      <div className="border border-hud-border bg-hud-bg p-3">
        <div className="flex items-center gap-3">
          <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain opacity-40 grayscale" />
          <div>
            <div className="font-hud text-sm text-hud-muted tracking-widest">🔒 {lootBox.tier.toUpperCase()} BOX</div>
            <div className="font-hud text-xs text-hud-muted mt-0.5 italic animate-pulse">AWAITING AUTHORISATION</div>
          </div>
        </div>
      </div>
    )
  }

  if (openState === 'revealed' || lootBox.state === 'opened') {
    return (
      <div className="border p-3 transition-opacity duration-300" style={{ borderColor: colour }}>
        <div className="font-hud text-sm tracking-widest mb-2" style={{ color: colour }}>{lootBox.tier.toUpperCase()} BOX — OPENED</div>
        {item && (
          <div className="flex items-start gap-3">
            <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain opacity-50" />
            <div>
              <div className="font-hud text-sm text-hud-text">{item.name}</div>
              <div className="font-hud text-xs text-hud-muted mt-1 italic">{item.description}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (openState === 'opening-1') return (
    <div className="border p-3" style={{ borderColor: colour }}>
      <div className="flex items-center gap-3">
        <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain animate-pulse" />
        <div className="font-hud text-sm tracking-widest animate-pulse" style={{ color: colour }}>OPENING TRANSMISSION...</div>
      </div>
    </div>
  )

  if (openState === 'opening-2') return (
    <div className="border p-3" style={{ borderColor: colour }}>
      <div className="flex items-center gap-3">
        <img src={boxImg} alt={lootBox.tier} className="w-12 h-12 object-contain animate-bounce" />
        <div className="font-hud text-sm tracking-widest animate-pulse" style={{ color: colour }}>DECRYPTING CONTENTS...</div>
      </div>
    </div>
  )

  // authorised — tap to open
  return (
    <button onClick={handleOpen}
      className="border p-3 w-full text-left transition-all duration-300 cursor-pointer hover:scale-[1.02]"
      style={{ borderColor: colour, boxShadow: `0 0 12px ${colour}44` }}>
      <div className="flex items-center gap-3">
        <img src={boxImg} alt={lootBox.tier} className="w-14 h-14 object-contain animate-pulse" />
        <div>
          <div className="font-hud text-sm tracking-widest" style={{ color: colour }}>
            🎁 {lootBox.tier.toUpperCase()} BOX — AUTHORISED
          </div>
          <div className="font-hud text-xs mt-1" style={{ color: colour }}>TAP TO OPEN</div>
        </div>
      </div>
    </button>
  )
}


