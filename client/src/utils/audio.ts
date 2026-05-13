// System AI voice playback
// Plays pre-rendered MP3s from /audio/ when announcements fire
// Falls back to Web Speech API for custom announcements

const ANNOUNCEMENT_AUDIO: Record<string, string> = {
  // Fixed announcement buttons (Group A)
  'floor_start':      '/audio/system_floor_start.mp3',
  'death':            '/audio/system_death.mp3',
  'achievement':      '/audio/system_achievement.mp3',
  'sponsor_bid':      '/audio/system_sponsor_bid.mp3',
  'floor_collapse':   '/audio/system_floor_collapse.mp3',
  'safe_room':        '/audio/system_safe_room.mp3',

  // Floor intros (Group B)
  'floor1_intro':     '/audio/system_floor1_intro.mp3',
  'floor2_intro':     '/audio/system_floor2_intro.mp3',
  'floor3_intro':     '/audio/system_floor3_intro.mp3',

  // Loot reveals (Group C)
  'loot_bronze':      '/audio/system_loot_bronze.mp3',
  'loot_silver':      '/audio/system_loot_silver.mp3',
  'loot_gold':        '/audio/system_loot_gold.mp3',
  'loot_platinum':    '/audio/system_loot_platinum.mp3',
  'loot_legendary':   '/audio/system_loot_legendary.mp3',
  'loot_celestial':   '/audio/system_loot_celestial.mp3',

  // Dramatic moments (Group D)
  'first_blood':      '/audio/system_first_blood.mp3',
  'low_hp':           '/audio/system_low_hp.mp3',
  'class_unlock':     '/audio/system_class_unlock.mp3',
  'skill_levelup':    '/audio/system_skill_levelup.mp3',
  'session_end':      '/audio/system_session_end.mp3',
}

let currentAudio: HTMLAudioElement | null = null

// Play a named System line (uses pre-rendered MP3 if available)
export function playSystemAudio(key: string): void {
  const src = ANNOUNCEMENT_AUDIO[key]
  if (!src) return

  // Check if the file actually exists (graceful skip if not yet recorded)
  const audio = new Audio(src)
  audio.volume = 0.85

  // Stop anything currently playing
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = audio
  audio.play().catch(() => {
    // File not found or autoplay blocked — silently skip
    console.debug(`[HUD Audio] ${key}: not found or blocked`)
  })
}

// Web Speech API fallback — for custom GM announcements
export function speakCustomText(text: string): void {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85
  utterance.pitch = 0.9

  // Try to find a British voice
  const voices = window.speechSynthesis.getVoices()
  const british = voices.find(v => v.lang === 'en-GB') ||
                  voices.find(v => v.lang.startsWith('en')) ||
                  null
  if (british) utterance.voice = british

  window.speechSynthesis.speak(utterance)
}

// Master speak function — routes to MP3 or Web Speech
export function systemSpeak(keyOrText: string, isCustom = false): void {
  if (isCustom) {
    speakCustomText(keyOrText)
    return
  }
  // Check if it's a known key
  if (ANNOUNCEMENT_AUDIO[keyOrText]) {
    playSystemAudio(keyOrText)
  } else {
    // Unknown key — treat as raw text for Web Speech
    speakCustomText(keyOrText)
  }
}
