import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const portraitRouter = new Hono()

const COMFYUI_URL = process.env.COMFYUI_URL ?? 'http://192.168.0.52:8000'

// Save generated portraits directly inside the client public crawlers folder
const PORTRAITS_DIR = path.resolve(__dirname, '../../../client/public/images/crawlers')

portraitRouter.post('/generate', async (c) => {
  try {
    const { 
      prompt, 
      checkpoint = 'illustriousXL_v01.safetensors', 
      filename,
      width = 768,
      height = 1344
    } = await c.req.json()

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    // Standardize filename
    const safeFilename = filename 
      ? filename.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : `portrait_${Date.now()}`

    // Construct positive prompt combining style + character details
    const positivePrompt = `character portrait in "Gravity Falls meets Adventure Time" art style, cel-shaded digital illustration with bold clean ink outlines, soft gradient shading for depth, warm/cool lighting contrast, atmospheric dungeon-tinted background with subtle texture, portrait orientation (9:16). Character: ${prompt}. Bold cartoon outlines, cel-shaded with gradient depth, NOT flat vector sticker style.`

    const negativePrompt = `photorealistic, photorealistic 3D render, photography, real life, blurry, low quality, bad hands, deformed anatomy, cropped head, floating limbs`

    // Determine steps, CFG, and sampler based on checkpoint
    const isLightning = checkpoint.toLowerCase().includes('lightning')
    const steps = isLightning ? 8 : 25
    const cfg = isLightning ? 2.0 : 7.0
    const sampler_name = isLightning ? 'dpmpp_sde' : 'euler'
    const scheduler = isLightning ? 'normal' : 'normal'

    // Standard 7-node SDXL Image Generation Workflow JSON
    const workflow = {
      "1": {
        "inputs": {
          "ckpt_name": checkpoint
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": positivePrompt,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": negativePrompt,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "width": width,
          "height": height,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "5": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000000),
          "steps": steps,
          "cfg": cfg,
          "sampler_name": sampler_name,
          "scheduler": scheduler,
          "denoise": 1.0,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
      },
      "6": {
        "inputs": {
          "samples": ["5", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "7": {
        "inputs": {
          "filename_prefix": `dnd_hud_portrait_${safeFilename}`,
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    }

    console.log(`[HUD Portrait] Prompting ComfyUI at ${COMFYUI_URL} using ${checkpoint}...`)

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

    // Send prompt to ComfyUI
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
    console.log(`[HUD Portrait] ComfyUI queued successfully. Prompt ID: ${prompt_id}`)

    // Poll execution history
    let completed = false
    let outputFilename = ''
    
    // Poll up to 120 times (2 minutes max timeout for larger image gen)
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const historyResp = await fetch(`${targetUrl}/history/${prompt_id}`, {
        headers: defaultHeaders
      })
      if (!historyResp.ok) continue
      
      const history = await historyResp.json() as any
      if (history[prompt_id]) {
        const outputs = history[prompt_id].outputs
        const imageOutputs = outputs["7"]?.images
        if (imageOutputs && imageOutputs.length > 0) {
          outputFilename = imageOutputs[0].filename
          completed = true
          break
        }
      }
    }

    if (!completed || !outputFilename) {
      throw new Error('ComfyUI generation timed out or failed to produce portrait')
    }

    console.log(`[HUD Portrait] ComfyUI generated output file: ${outputFilename}`)

    // Download the generated image file from ComfyUI
    const fileUrl = `${targetUrl}/view?filename=${encodeURIComponent(outputFilename)}&type=output`
    const fileResp = await fetch(fileUrl, {
      headers: defaultHeaders
    })
    if (!fileResp.ok) {
      throw new Error("Failed to download portrait from ComfyUI: " + fileResp.statusText)
    }

    const buffer = Buffer.from(await fileResp.arrayBuffer())
    
    // Save as .png inside client public crawlers folder
    const finalFilename = `${safeFilename}.png`
    const finalPath = path.join(PORTRAITS_DIR, finalFilename)
    
    await fs.mkdir(PORTRAITS_DIR, { recursive: true })
    await fs.writeFile(finalPath, buffer)

    console.log(`[HUD Portrait] Portrait saved locally to: ${finalPath}`)

    return c.json({
      success: true,
      filename: finalFilename,
      url: `/images/crawlers/${finalFilename}`
    })

  } catch (error: any) {
    console.error('[HUD Portrait] Generation failed:', error)
    return c.json({ error: error.message || 'Failed to generate character portrait' }, 500)
  }
})
