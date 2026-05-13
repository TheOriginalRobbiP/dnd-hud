import { tierColour } from '../../utils/colours'
import { useState } from 'react'
import type { LootBox as LootBoxType, WSMessage } from '../../types'


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
      <div className="border border-hud-border bg-hud-bg p-3 animate-pulse">
        <div className="font-hud text-sm text-hud-muted tracking-widest">🔒 {lootBox.tier.toUpperCase()} BOX</div>
        <div className="font-hud text-sm text-hud-muted mt-1 italic">INCOMING TRANSMISSION... AWAITING AUTHORISATION</div>
      </div>
    )
  }

  if (openState === 'revealed' || lootBox.state === 'opened') {
    return (
      <div className="border p-3 transition-opacity duration-300" style={{ borderColor: colour }}>
        <div className="font-hud text-sm tracking-widest mb-1" style={{ color: colour }}>{lootBox.tier.toUpperCase()} BOX — OPENED</div>
        {item && <>
          <div className="font-hud text-sm text-hud-text">{item.name}</div>
          <div className="font-hud text-sm text-hud-muted mt-1">{item.description}</div>
        </>}
      </div>
    )
  }

  if (openState === 'opening-1') return (
    <div className="border p-3" style={{ borderColor: colour }}>
      <div className="font-hud text-sm tracking-widest animate-pulse" style={{ color: colour }}>OPENING TRANSMISSION...</div>
    </div>
  )

  if (openState === 'opening-2') return (
    <div className="border p-3" style={{ borderColor: colour }}>
      <div className="font-hud text-sm tracking-widest animate-pulse" style={{ color: colour }}>DECRYPTING CONTENTS...</div>
    </div>
  )

  // authorised — tap to open
  return (
    <button onClick={handleOpen}
      className="border p-3 w-full text-left transition-all duration-300 animate-pulse cursor-pointer"
      style={{ borderColor: colour, boxShadow: `0 0 12px ${colour}44` }}>
      <div className="font-hud text-sm tracking-widest" style={{ color: colour }}>
        🎁 {lootBox.tier.toUpperCase()} BOX — AUTHORISED
      </div>
      <div className="font-hud text-sm mt-1" style={{ color: colour }}>TAP TO OPEN</div>
    </button>
  )
}
