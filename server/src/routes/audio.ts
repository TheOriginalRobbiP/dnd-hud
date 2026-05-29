import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const audioRouter = new Hono()

// Default ComfyUI URL on local LAN
const COMFYUI_URL = process.env.COMFYUI_URL ?? 'http://192.168.0.52:8000'

// Target folder for player soundboard audio files
const AUDIO_DIR = path.resolve(__dirname, '../../../client/public/audio')

audioRouter.post('/generate', async (c) => {
  try {
    const { text, speaker = 'bm_daniel', filename } = await c.req.json()

    if (!text) {
      return c.json({ error: 'Text is required' }, 400)
    }

    // Standardize filename
    const safeFilename = filename 
      ? filename.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : `announcement_${Date.now()}`

    // Parse basic auth from COMFYUI_URL if present
    const defaultHeaders: Record<string, string> = {}
    let targetUrl = COMFYUI_URL
    try {
      const parsedUrl = new URL(COMFYUI_URL)
      if (parsedUrl.username && parsedUrl.password) {
        const credentials = Buffer.from(`${parsedUrl.username}:${parsedUrl.password}`).toString('base64')
        defaultHeaders['Authorization'] = `Basic ${credentials}`
        parsedUrl.username = ''
        parsedUrl.password = ''
        targetUrl = parsedUrl.toString().replace(/\/$/, '')
      }
    } catch (e) {
      // Fallback
    }

    // 1. Build the ComfyUI API Prompt payload
    // Using SaveAudioMP3 (standard in ComfyUI-KokoroTTS for high quality mp3 compression)
    const workflow = {
      "1": {
        "inputs": {
          "text": text,
          "speaker": speaker
        },
        "class_type": "Kokoro TextToSpeech"
      },
      "2": {
        "inputs": {
          "filename_prefix": `dnd_hud_${safeFilename}`,
          "audio": ["1", 0],
          "quality": "V0"
        },
        "class_type": "SaveAudioMP3"
      }
    }

    console.log(`[HUD Audio] Prompting ComfyUI at ${targetUrl} for "${text.substring(0, 30)}..."`)

    // 2. Queue the prompt in ComfyUI
    const response = await fetch(`${targetUrl}/prompt`, {
      method: 'POST',
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ComfyUI prompt request failed (${response.status}): ${errorText}`)
    }

    const { prompt_id } = await response.json() as { prompt_id: string }
    console.log(`[HUD Audio] ComfyUI queued successfully. Prompt ID: ${prompt_id}`)

    // 3. Poll ComfyUI /history/<prompt_id> until execution is complete
    let completed = false
    let outputFilename = ''
    
    // Poll up to 60 times (60 seconds max timeout)
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const historyResp = await fetch(`${targetUrl}/history/${prompt_id}`, {
        headers: defaultHeaders
      })
      if (!historyResp.ok) continue
      
      const history = await historyResp.json() as any
      if (history[prompt_id]) {
        const outputs = history[prompt_id].outputs
        const audioOutputs = outputs["2"]?.audio
        if (audioOutputs && audioOutputs.length > 0) {
          outputFilename = audioOutputs[0].filename
          completed = true
          break
        }
      }
    }

    if (!completed || !outputFilename) {
      throw new Error('ComfyUI generation timed out or failed to produce output')
    }

    console.log(`[HUD Audio] ComfyUI generated output file: ${outputFilename}`)

    // 4. Download the generated audio file from ComfyUI
    const fileUrl = `${targetUrl}/view?filename=${encodeURIComponent(outputFilename)}&type=output`
    const fileResp = await fetch(fileUrl, {
      headers: defaultHeaders
    })
    if (!fileResp.ok) {
      throw new Error(`Failed to download audio from ComfyUI: ${fileResp.statusText}`)
    }

    const buffer = Buffer.from(await fileResp.arrayBuffer())
    
    // Save as .mp3 inside public/audio/
    const finalFilename = `${safeFilename}.mp3`
    const finalPath = path.join(AUDIO_DIR, finalFilename)
    
    await fs.mkdir(AUDIO_DIR, { recursive: true })
    await fs.writeFile(finalPath, buffer)

    console.log(`[HUD Audio] Audio saved locally to: ${finalPath}`)

    return c.json({
      success: true,
      filename: finalFilename,
      url: `/audio/${finalFilename}`
    })
  } catch (error: any) {
    console.error('[HUD Audio] Generation failed:', error)
    return c.json({ error: error.message || 'Failed to generate audio' }, 500)
  }
})
