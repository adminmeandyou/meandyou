// fix-badge-images.mjs
// 1. Regenera os 13 badges ruins
// 2. Remove fundo e padroniza TODOS os 26 para 256x256 PNG transparente

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import sharp from 'sharp'

const envContent = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k,...v]=l.split('='); return [k.trim(), v.join('=').split('#')[0].trim().replace(/[^\x00-\xFF]/g,'')] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const HF_TOKEN = env.HUGGINGFACE_API_TOKEN
const HF_MODEL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell'
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt/'

// Badges que precisam ser REGERADOS (ruins visualmente)
const TO_REGENERATE = new Set([
  'Identidade Verificada',
  'Perfil Completo',
  'Galeria Rica',
  'Magnetico I',
  'Desejado I',
  // 8 do Pollinations
  'Desejado III',
  'Comunicativo III',
  'Embaixador III',
  'Presenca III',
  'Fiel III',
  'Assinante',
  'Membro Fundador',
  'Elite Black',
])

const RARITY_COLOR = {
  comum:'light gray and white', raro:'emerald green', super_raro:'purple and violet',
  epico:'orange and amber', lendario:'golden yellow', super_lendario:'crimson red',
}

const BADGE_PROMPTS = {
  'Identidade Verificada': { icon:'blue shield with white checkmark and scan lines', rarity:'raro', level:null },
  'Perfil Completo':       { icon:'glowing profile card with star badge and checkmark', rarity:'comum', level:null },
  'Galeria Rica':          { icon:'three overlapping photo frames with sparkle star', rarity:'comum', level:null },
  'Magnetico I':           { icon:'two pixel hearts snapping together with spark', rarity:'comum', level:'I' },
  'Desejado I':            { icon:'single bright heart with four rays of light', rarity:'comum', level:'I' },
  'Desejado III':          { icon:'golden crown made of hearts with gemstones', rarity:'super_raro', level:'III' },
  'Comunicativo III':      { icon:'six speech bubbles arranged like a star', rarity:'super_raro', level:'III' },
  'Embaixador III':        { icon:'pixel character holding a flaming torch flag', rarity:'epico', level:'III' },
  'Presenca III':          { icon:'video camera with golden crown on top', rarity:'epico', level:'III' },
  'Fiel III':              { icon:'infinity symbol made of fire flames', rarity:'epico', level:'III' },
  'Assinante':             { icon:'diamond membership card with glowing star', rarity:'epico', level:null },
  'Membro Fundador':       { icon:'golden key with floating crown above it', rarity:'lendario', level:null },
  'Elite Black':           { icon:'black crown with red glowing gems and dark aura', rarity:'super_lendario', level:null },
}

function buildPrompt(name) {
  const p = BADGE_PROMPTS[name]
  if (!p) return null
  const color = RARITY_COLOR[p.rarity] || 'gray'
  return [
    '[pixel art badge icon]',
    '[game achievement style]',
    '[thick black outline]',
    '[limited color palette 8 colors max]',
    '[clean pixel grid 32x32]',
    '[no blur no anti-aliasing]',
    '[symmetrical composition]',
    `[central icon: ${p.icon}]`,
    `[color theme: ${color}]`,
    p.level ? `[bottom banner with roman numeral ${p.level}]` : '',
    '[solid dark background #0a0a0a]',
    '[high contrast]',
    '[high readability]',
  ].filter(Boolean).join(' ')
}

// ─── Geração de imagem ───────────────────────────────────────────────────────

async function generateWithHF(prompt) {
  const res = await fetch(HF_MODEL, {
    method:'POST',
    headers:{'Authorization':`Bearer ${HF_TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify({inputs:prompt}),
  })
  if (res.status === 503) {
    const e = await res.json().catch(()=>({}))
    const w = Math.ceil(e.estimated_time ?? 20)
    await new Promise(r=>setTimeout(r,(w+3)*1000))
    return null
  }
  if (res.status === 402) return 'FALLBACK'
  if (!res.ok) throw new Error(`HF ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function generateWithPollinations(prompt) {
  const url = `${POLLINATIONS_URL}${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Pollinations ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function generateImage(prompt) {
  for (let i = 1; i <= 3; i++) {
    process.stdout.write(`    [HF] tentativa ${i}/3... `)
    try {
      const result = await generateWithHF(prompt)
      if (result === 'FALLBACK') { console.log('sem crédito, usando Pollinations...'); break }
      if (result === null) { console.log('aguardando...'); continue }
      console.log('ok')
      return result
    } catch(e) { console.log(`erro: ${e.message}`) }
  }
  for (let i = 1; i <= 3; i++) {
    process.stdout.write(`    [Pollinations] tentativa ${i}/3... `)
    try {
      const buf = await generateWithPollinations(prompt)
      console.log('ok')
      return buf
    } catch(e) {
      console.log(`erro, tentando de novo...`)
      await new Promise(r=>setTimeout(r,3000))
    }
  }
  throw new Error('Falhou em todos os provedores')
}

// ─── Remoção de fundo + resize ───────────────────────────────────────────────

async function processImage(inputBuffer) {
  // Converte para RGBA raw
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const pixels = new Uint8Array(data)

  // Amostra cor de fundo nos 4 cantos
  function getPixel(x, y) {
    const i = (y * width + x) * 4
    return { r: pixels[i], g: pixels[i+1], b: pixels[i+2] }
  }

  function colorDist(a, b) {
    return Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2)
  }

  // Usa a cor mais escura dos cantos como referência de fundo
  const corners = [
    getPixel(0,0), getPixel(width-1,0),
    getPixel(0,height-1), getPixel(width-1,height-1),
  ]
  const bg = corners.reduce((a,b) => (a.r+a.g+a.b) < (b.r+b.g+b.b) ? a : b)

  // Flood fill a partir dos 4 cantos para remover fundo
  const TOLERANCE = 55
  const visited = new Uint8Array(width * height)
  const queue = [0, width-1, (height-1)*width, height*width-1]

  while (queue.length > 0) {
    const pos = queue.pop()
    if (pos < 0 || pos >= width * height || visited[pos]) continue
    visited[pos] = 1

    const x = pos % width
    const y = Math.floor(pos / width)
    const px = getPixel(x, y)

    if (colorDist(px, bg) > TOLERANCE) continue

    // Torna transparente
    pixels[pos * 4 + 3] = 0

    if (x > 0)       queue.push(pos - 1)
    if (x < width-1) queue.push(pos + 1)
    if (y > 0)       queue.push(pos - width)
    if (y < height-1) queue.push(pos + width)
  }

  // Reconstrói PNG 256x256 com nearest neighbor (preserva pixel art)
  return sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { kernel: 'nearest', fit: 'fill' })
    .png()
    .toBuffer()
}

// ─── Upload ──────────────────────────────────────────────────────────────────

async function uploadImage(buffer, name) {
  await supabase.storage.createBucket('badge-images', { public: true }).catch(() => {})
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')
  const filename = `badge-${slug}.png`
  const { error } = await supabase.storage.from('badge-images')
    .upload(filename, buffer, { contentType:'image/png', upsert:true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)
  return publicUrl
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('=== Fix Badge Images ===\n')

const { data: badges } = await supabase
  .from('badges')
  .select('id,name,icon_url')
  .not('icon_url', 'is', null)

console.log(`Badges com imagem: ${badges.length}\n`)

let regenerados = 0, processados = 0, erros = 0

for (const badge of badges) {
  const needsRegen = TO_REGENERATE.has(badge.name)
  const action = needsRegen ? 'REGERAR+PROCESSAR' : 'PROCESSAR'
  console.log(`[${action}] ${badge.name}`)

  try {
    let imageBuffer

    if (needsRegen) {
      const prompt = buildPrompt(badge.name)
      if (!prompt) { console.log('  sem prompt definido, pulando\n'); erros++; continue }
      console.log(`  Gerando imagem...`)
      imageBuffer = await generateImage(prompt)
      regenerados++
      await new Promise(r=>setTimeout(r,3000))
    } else {
      // Baixa imagem atual
      const res = await fetch(badge.icon_url)
      if (!res.ok) throw new Error(`Download falhou: ${res.status}`)
      imageBuffer = Buffer.from(await res.arrayBuffer())
    }

    // Remove fundo + resize 256x256
    console.log(`  Processando (remove fundo + 256x256)...`)
    const processed = await processImage(imageBuffer)

    // Re-upload
    const url = await uploadImage(processed, badge.name)
    await supabase.from('badges').update({ icon_url: url }).eq('id', badge.id)
    console.log(`  OK → ${url.split('/').pop()}\n`)
    processados++

  } catch(err) {
    console.error(`  ERRO: ${err.message}\n`)
    erros++
  }
}

console.log(`=== Resultado ===`)
console.log(`Regerados: ${regenerados} | Processados: ${processados} | Erros: ${erros}`)
