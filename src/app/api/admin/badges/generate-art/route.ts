// POST /api/admin/badges/generate-art
// Gera imagem pixel art com cascata de providers e fundo transparente (PNG)
// Ordem: Stable Diffusion local → HuggingFace Pixel Art → HuggingFace FLUX → Replicate

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SD_API_URL      = process.env.SD_API_URL
const HF_TOKEN        = process.env.HUGGINGFACE_API_TOKEN
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN

const HF_PIXEL_MODEL = 'https://router.huggingface.co/hf-inference/models/nerijs/pixel-art-xl'
const HF_FLUX_MODEL  = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell'
const REPLICATE_MODEL_VERSION =
  process.env.REPLICATE_MODEL_VERSION ||
  'zylim0702/pixel-art-xl-lora:71e55e745b74c1b37d3f00d9e65e63a3b30a4b07a4d3c9b6e3a70e1c9e1d11b'

// ─── Remoção de fundo via flood-fill (corners → alpha) ──────────────────────
// REGRA: o ícone do emblema pode ter qualquer cor, mas o fundo FORA deve ser
// PNG transparente (como SVG). O prompt sempre pede fundo branco sólido para
// que este algoritmo consiga removê-lo com precisão.
async function makePngTransparent(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const px = new Uint8Array(data)
  const idx = (x: number, y: number) => (y * width + x) * 4

  const bgR = px[0], bgG = px[1], bgB = px[2]
  const TOLERANCE = 40

  const isBg = (x: number, y: number) => {
    const i = idx(x, y)
    return (
      Math.abs(px[i]   - bgR) <= TOLERANCE &&
      Math.abs(px[i+1] - bgG) <= TOLERANCE &&
      Math.abs(px[i+2] - bgB) <= TOLERANCE
    )
  }

  const visited = new Uint8Array(width * height)
  const queue: number[] = []
  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const k = y * width + x
    if (visited[k]) return
    visited[k] = 1
    queue.push(x, y)
  }
  enqueue(0, 0); enqueue(width-1, 0)
  enqueue(0, height-1); enqueue(width-1, height-1)

  let qi = 0
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++]
    if (!isBg(x, y)) continue
    px[idx(x,y)+3] = 0
    enqueue(x-1, y); enqueue(x+1, y)
    enqueue(x, y-1); enqueue(x, y+1)
  }

  return sharp(Buffer.from(px), { raw: { width, height, channels: 4 } }).png().toBuffer() as Promise<Buffer>
}

// ─── Provider 1: Stable Diffusion local ──────────────────────────────────────
async function generateWithSD(prompt: string): Promise<Buffer> {
  const res = await fetch(`${SD_API_URL}/sdapi/v1/txt2img`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      negative_prompt: 'blur, gradient, noise, photo, realistic, 3d, anti-aliasing',
      width: 512, height: 512, steps: 20, cfg_scale: 7,
      sampler_name: 'DPM++ 2M Karras',
    }),
  })
  if (!res.ok) throw new Error(`SD ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return Buffer.from(json.images[0], 'base64')
}

// ─── Provider 2: HuggingFace Pixel Art ───────────────────────────────────────
async function generateWithHFPixel(prompt: string): Promise<Buffer> {
  const res = await fetch(HF_PIXEL_MODEL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  })
  if (res.status === 503) {
    const e = await res.json().catch(() => ({})) as { estimated_time?: number }
    const tempo = e.estimated_time ? `~${Math.ceil(e.estimated_time)}s` : 'instantes'
    throw new Error(`modelo carregando, tente em ${tempo}`)
  }
  if (res.status === 402) throw new Error('créditos HuggingFace esgotados')
  if (!res.ok) throw new Error(`HF Pixel ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Provider 3: HuggingFace FLUX ────────────────────────────────────────────
async function generateWithHFFlux(prompt: string): Promise<Buffer> {
  const res = await fetch(HF_FLUX_MODEL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  })
  if (res.status === 503) {
    const e = await res.json().catch(() => ({})) as { estimated_time?: number }
    const tempo = e.estimated_time ? `~${Math.ceil(e.estimated_time)}s` : 'instantes'
    throw new Error(`modelo carregando, tente em ${tempo}`)
  }
  if (res.status === 402) throw new Error('créditos HuggingFace esgotados')
  if (!res.ok) throw new Error(`HF FLUX ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Provider 4: Replicate ───────────────────────────────────────────────────
async function generateWithReplicate(prompt: string): Promise<Buffer> {
  const startRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: { prompt, width: 512, height: 512, num_inference_steps: 20 },
    }),
  })
  if (!startRes.ok) throw new Error(`Replicate ${startRes.status}: ${await startRes.text()}`)
  let prediction = await startRes.json()

  // Polling (max 60s)
  for (let i = 0; i < 20; i++) {
    if (prediction.status === 'succeeded' || prediction.status === 'failed') break
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(prediction.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
    })
    if (!pollRes.ok) throw new Error(`Replicate poll ${pollRes.status}`)
    prediction = await pollRes.json()
  }

  if (prediction.status !== 'succeeded') throw new Error(`Replicate: ${prediction.error || 'timeout'}`)

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  const imgRes = await fetch(outputUrl)
  if (!imgRes.ok) throw new Error(`Replicate download ${imgRes.status}`)
  return Buffer.from(await imgRes.arrayBuffer())
}

// ─── Orquestrador: cascata de providers ──────────────────────────────────────
async function generateImage(prompt: string): Promise<{ buffer: Buffer; provider: string }> {
  const providers = [
    { name: 'SD Local',             fn: generateWithSD,        enabled: !!SD_API_URL      },
    { name: 'HuggingFace Pixel Art',fn: generateWithHFPixel,   enabled: !!HF_TOKEN        },
    { name: 'HuggingFace FLUX',     fn: generateWithHFFlux,    enabled: !!HF_TOKEN        },
    { name: 'Replicate',            fn: generateWithReplicate,  enabled: !!REPLICATE_TOKEN },
  ]

  const errors: string[] = []
  for (const p of providers) {
    if (!p.enabled) continue
    try {
      const raw = await p.fn(prompt)
      const buffer = await makePngTransparent(raw)
      return { buffer, provider: p.name }
    } catch (e) {
      errors.push(`${p.name}: ${(e as Error).message}`)
    }
  }
  throw new Error(`Todos os providers falharam:\n${errors.join('\n')}`)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user: caller } } = await supabase.auth.getUser(token)
    if (!caller) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', caller.id).single()
    const { data: staff } = await supabase.from('staff_members').select('id').eq('user_id', caller.id).single()
    if (profile?.role !== 'admin' && !staff) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { prompt, badgeId } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 })

    if (!SD_API_URL && !HF_TOKEN && !REPLICATE_TOKEN) {
      return NextResponse.json({ error: 'Nenhum provider configurado. Adicione SD_API_URL, HUGGINGFACE_API_TOKEN ou REPLICATE_API_TOKEN.' }, { status: 500 })
    }

    const { buffer, provider } = await generateImage(prompt)

    const filename = `badge-ai-${Date.now()}.png`
    await supabase.storage.createBucket('badge-images', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('badge-images')
      .upload(filename, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)

    if (badgeId) {
      await supabase.from('badges').update({ icon_url: publicUrl }).eq('id', badgeId)
    }

    return NextResponse.json({ url: publicUrl, provider })
  } catch (err) {
    console.error('[badges/generate-art]', err)
    return NextResponse.json({ error: (err as Error).message || 'Erro interno' }, { status: 500 })
  }
}
