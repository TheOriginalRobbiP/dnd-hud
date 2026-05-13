import { useState, useRef, useEffect } from 'react'
import type { WSMessage, Character } from '../../types'
import type { DirectMessage } from '../../hooks/useWebSocket'

interface DMPanelProps {
  // GM mode: can message any character
  mode: 'gm'
  characters: Character[]
  messages: DirectMessage[]
  send: (msg: WSMessage) => void
  onRead: () => void
}

interface PlayerDMPanelProps {
  // Player mode: can only message GM
  mode: 'player'
  myCharId: string
  myName: string
  messages: DirectMessage[]
  send: (msg: WSMessage) => void
  onRead: () => void
}

type Props = DMPanelProps | PlayerDMPanelProps

export function DMPanel(props: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [toCharId, setToCharId] = useState<string>('gm')
  const bottomRef = useRef<HTMLDivElement>(null)
  const unread = props.messages.filter(m => !m.read).length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [props.messages, open])

  const handleOpen = () => {
    setOpen(true)
    props.onRead()
  }

  const sendDM = () => {
    if (!text.trim()) return
    const fromCharId = props.mode === 'gm' ? 'gm' : props.myCharId
    const fromName = props.mode === 'gm' ? 'GM' : (props as PlayerDMPanelProps).myName
    props.send({
      type: 'direct_message',
      toCharId: props.mode === 'gm' ? toCharId : 'gm',
      fromCharId,
      fromName,
      text: text.trim(),
      timestamp: Date.now(),
    })
    // Echo into local messages immediately
    props.messages.push({ fromCharId, fromName, text: text.trim(), timestamp: Date.now(), read: true })
    setText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDM() }
  }

  return (
    <>
      {/* Trigger button */}
      <button onClick={handleOpen}
        className="relative font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
        ✉ MSG
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-hud-accent text-hud-bg font-hud text-xs w-4 h-4 flex items-center justify-center rounded-none">
            {unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 bg-hud-bg/80 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}>
          <div className="bg-hud-panel border border-hud-border w-full max-w-md flex flex-col"
            style={{ maxHeight: '70vh' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-hud-border px-4 py-2">
              <div className="font-hud text-hud-accent tracking-widest text-sm">
                {props.mode === 'gm' ? 'DIRECT MESSAGES' : 'MESSAGE GM'}
              </div>
              <button onClick={() => setOpen(false)}
                className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
            </div>

            {/* GM: recipient selector */}
            {props.mode === 'gm' && (
              <div className="flex gap-1 px-4 py-2 border-b border-hud-border overflow-x-auto">
                <button onClick={() => setToCharId('all')}
                  className={`font-hud text-xs border px-2 py-1 whitespace-nowrap transition-colors ${toCharId === 'all' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
                  ALL
                </button>
                {(props as DMPanelProps).characters.map(c => (
                  <button key={c.id} onClick={() => setToCharId(c.id)}
                    className={`font-hud text-xs border px-2 py-1 whitespace-nowrap transition-colors ${toCharId === c.id ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
                    {c.crawlerName}
                  </button>
                ))}
              </div>
            )}

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
              {props.messages.length === 0 ? (
                <p className="font-hud text-sm text-hud-muted italic text-center mt-4">
                  No messages yet. The channel is open.
                </p>
              ) : (
                props.messages.map((m, i) => {
                  const isMe = props.mode === 'gm'
                    ? m.fromCharId === 'gm'
                    : m.fromCharId === (props as PlayerDMPanelProps).myCharId
                  return (
                    <div key={i} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="font-hud text-xs text-hud-muted">
                        {isMe ? 'YOU' : m.fromName.toUpperCase()} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`border px-3 py-2 max-w-[80%] font-hud text-sm leading-relaxed
                        ${isMe ? 'border-hud-accent text-hud-text' : 'border-hud-border text-hud-muted'}`}>
                        {m.text}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-hud-border p-3 flex gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                rows={2}
                placeholder={props.mode === 'gm' ? `Message ${toCharId === 'all' ? 'all crawlers' : '...'}` : 'Message GM...'}
                className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 resize-none focus:border-hud-accent outline-none"
              />
              <button onClick={sendDM}
                disabled={!text.trim()}
                className="border border-hud-accent text-hud-accent font-hud text-sm px-4 hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed tracking-wider self-end">
                SEND
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
