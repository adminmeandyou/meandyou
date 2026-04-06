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

const RARITY_COLOR = {
  comum:'#9CA3AF gray on #08090E black background',
  incomum:'#22C55E green on #08090E black background',
  raro:'#22C55E emerald green on #08090E black background',
  super_raro:'#A855F7 purple and #7C3AED violet on #08090E black background',
  epico:'#F97316 orange and #F59E0B amber on #08090E black background',
  lendario:'#F59E0B gold and #D97706 dark gold on #08090E black background',
  super_lendario:'#E11D48 rose red and #F43F5E on #08090E black background',
}

// Mapa de ícone por nome do badge — descreve o objeto visual central
const ICON_MAP = {
  // Matches
  'Atraente':        'glowing magnet attracting small hearts',
  'Bunitin':         'cute smiling face with sparkle eyes and heart cheeks',
  'Te Quiero':       'two hearts intertwined with a spark between them',
  'Muito Quente':    'heart on fire with rising flames',
  'Me Liga?':        'retro phone handset with heart on screen',
  'Irresistível':    'golden crown sitting on a glowing heart',
  // Mensagens
  'Desenrola':       'speech bubble with waving hand inside',
  'Sem Vergonha':    'bold speech bubble with exclamation mark',
  'Papo Solto':      'multiple speech bubbles flowing freely',
  'Matraca':         'exploding speech bubbles with sound waves',
  'Dominante':       'throne made of speech bubbles with crown',
  'Hipnotiza':       'spiral hypnosis eye with speech bubbles orbiting',
  // Likes Recebidos
  'Desejável':       'single heart with sparkle rays around it',
  'Me Nota':         'eye with heart shaped pupil glowing',
  'Tentação':        'red apple with heart bite mark',
  'Diferente':       'diamond shaped heart shining with unique glow',
  'Destaque':        'spotlight beam shining on a heart',
  'Inigualável':     'golden heart with crown and laurel wreath',
  // Vídeo
  'Cara a Cara':     'video camera lens with smiling face reflection',
  'Aparece':         'camera lens with eye looking through it',
  'Olho no Olho':    'two eyes connected by a glowing beam',
  'Ao Vivo':         'red live broadcast dot with camera icon',
  'Presente':        'gift box opening with camera and sparkles',
  'Reality Star':    'golden star with camera and bright spotlight',
  // Streak
  'Pontual':         'clock with green checkmark',
  'Constante':       'calendar page with small steady flame',
  'Não Falha':       'shield with fire emblem inside',
  'Da Casa':         'cozy house with heart chimney smoke',
  'Forever':         'infinity symbol made of golden fire',
  'Patrimônio':      'golden trophy with eternal flame on top',
  // Indicações
  'Boca a Boca':     'two pixel faces whispering to each other',
  'Cupido':          'bow and arrow with heart tipped arrow',
  'Famoso':          'megaphone with crowd of tiny people',
  'Influência':      'person silhouette on stage with spotlight',
  'Celebridade':     'hollywood star on walk of fame',
  'Lenda Urbana':    'mysterious glowing figure with question marks',
  // Likes Enviados
  'De Olho':         'magnifying glass with heart inside',
  'Coração Acelerado':'beating heart with speed motion lines',
  'Sem Freio':       'racing heart with broken brake pedal',
  'Na Pista':        'disco ball with hearts on dance floor',
  'Aventura ON':     'compass with heart as needle pointing forward',
  'Uma Máquina':     'robot with heart engine and gears',
  // Salas
  'Visita':          'open door with welcome mat and light',
  'Turista':         'suitcase with room key tags',
  'Hóspede':         'golden hotel key with star keychain',
  'Vibe Boa':        'party room with music notes and confetti',
  'Onipresente':     'multiple doors in circle with figure in center',
  'Ímã Social':      'magnet attracting group of tiny people',
  // Super Lendários — Caixa Super Lendária (raridade)
  'Classe S':        '#E11D48 rose red S letter inside a dark #08090E hexagonal badge with #E11D48 laurel wreath',
  'Lenda Viva':      '#E11D48 rose red ancient scroll with #F43F5E glow and #E11D48 sparks on #08090E black background',
  'Glitch':          '#E11D48 rose red broken screen with #F43F5E glitch artifacts and static on #08090E black',
  'Nível 999':       '#E11D48 glowing 999 counter on #08090E dark arcade screen with #F43F5E lightning',
  // Super Lendários — Caixa Super Lendária (riqueza/poder)
  'Magnata':         '#E11D48 rose red briefcase overflowing with #F43F5E coins and #E11D48 gems on #08090E black velvet',
  'Royalty':         '#E11D48 rose red crown with #be123c ruby jewels on a #E11D48 cushion #08090E black background',
  'Majestade':       '#E11D48 rose red throne with #F43F5E velvet and #E11D48 glowing scepter on #08090E black',
  'Nobreza':         '#E11D48 rose red coat of arms shield with #be123c lions and #F43F5E fleur de lis on #08090E black',
  'Imperium':        '#E11D48 rose red eagle with spread wings on a #be123c roman shield on #08090E black',
  'Dinastia':        '#E11D48 rose red family crest with #F43F5E chain links and #E11D48 flame torch on #08090E black',
}

// ─── Prompt builder (SD style para AI Horde / Pollinations) ──────────────────
function buildPrompt(name, rarity) {
  const color = RARITY_COLOR[rarity] || 'gray'
  const icon = ICON_MAP[name] || 'abstract badge icon'
  const positive = [
    'pixel art badge icon',
    icon,
    'habbo hotel style',
    'retro game sprite',
    `${color} color theme`,
    'single centered icon',
    'black outline',
    'limited color palette',
    '8bit',
    'flat icon',
    'white background',
    'clean',
    'high contrast',
  ].join(', ')
  const negative = 'blurry, anime, realistic, 3d, text, watermark, multiple icons, grid, collage, nsfw, ugly, distorted'
  return `${positive} ### ${negative}`
}

// ─── Remoção de fundo via flood-fill ─────────────────────────────────────────
async function makePngTransparent(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const px = new Uint8Array(data)
  const idx = (x, y) => (y * width + x) * 4
  const bgR = px[0], bgG = px[1], bgB = px[2]
  const TOLERANCE = 40
  const isBg = (x, y) => {
    const i = idx(x, y)
    return Math.abs(px[i]-bgR) <= TOLERANCE && Math.abs(px[i+1]-bgG) <= TOLERANCE && Math.abs(px[i+2]-bgB) <= TOLERANCE
  }
  const visited = new Uint8Array(width * height)
  const queue = []
  const enqueue = (x, y) => {
    const k = y * width + x
    if (x < 0 || x >= width || y < 0 || y >= height || visited[k]) return
    visited[k] = 1
    queue.push(x, y)
  }
  enqueue(0, 0); enqueue(width-1, 0); enqueue(0, height-1); enqueue(width-1, height-1)
  let qi = 0
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++]
    if (!isBg(x, y)) continue
    px[idx(x,y)+3] = 0
    enqueue(x-1, y); enqueue(x+1, y); enqueue(x, y-1); enqueue(x, y+1)
  }
  return sharp(Buffer.from(px), { raw: { width, height, channels: 4 } }).png().toBuffer()
}

// ─── AI Horde (gratuito, com fila) ───────────────────────────────────────────
async function generateWithAIHorde(prompt) {
  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': '0000000000' },
    body: JSON.stringify({
      prompt,
      params: { width: 512, height: 512, steps: 20, cfg_scale: 7, sampler_name: 'k_euler', n: 1 },
      models: ['AIO Pixel Art'],
      r2: true,
    }),
  })
  if (!submitRes.ok) throw new Error(`AI Horde submit ${submitRes.status}: ${await submitRes.text()}`)
  const { id } = await submitRes.json()
  if (!id) throw new Error('AI Horde: sem job id')

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`)
    const check = await checkRes.json()
    if (check.faulted) throw new Error('AI Horde: job com falha')
    if (!check.done) {
      process.stdout.write(`\r    fila:${check.queue_position ?? '?'} ~${check.wait_time ?? '?'}s `)
      continue
    }
    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`)
    const data = await statusRes.json()
    const imgData = data.generations?.[0]?.img
    if (!imgData) throw new Error('AI Horde: sem imagem')
    if (imgData.startsWith('http')) {
      const dl = await fetch(imgData)
      if (!dl.ok) throw new Error(`AI Horde download ${dl.status}`)
      return Buffer.from(await dl.arrayBuffer())
    }
    return Buffer.from(imgData, 'base64')
  }
  throw new Error('AI Horde: timeout (5 minutos)')
}

// ─── Pollinations (fallback gratuito) ────────────────────────────────────────
async function generateWithPollinations(prompt) {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Date.now()}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(120000) })
    if (res.status === 429) {
      console.log(`\n    rate limit, aguardando ${15*attempt}s...`)
      await new Promise(r => setTimeout(r, 15000 * attempt))
      continue
    }
    if (!res.ok) throw new Error(`Pollinations ${res.status}`)
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('image')) throw new Error(`Pollinations retornou ${ct}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('Pollinations: max tentativas')
}

// ─── Orquestrador ────────────────────────────────────────────────────────────
async function generateImage(name, rarity) {
  const prompt = buildPrompt(name, rarity)
  const providers = [
    { name: 'AI Horde', fn: generateWithAIHorde },
    { name: 'Pollinations', fn: generateWithPollinations },
  ]
  for (const p of providers) {
    process.stdout.write(`  [${p.name}] gerando... `)
    try {
      const raw = await p.fn(prompt)
      const transparent = await makePngTransparent(raw)
      console.log('ok!')
      return transparent
    } catch (e) {
      console.log(`falhou: ${e.message}`)
    }
  }
  throw new Error('Todos os providers falharam')
}

// ─── Upload para Supabase Storage ────────────────────────────────────────────
async function uploadImage(buffer, name) {
  await supabase.storage.createBucket('badge-images', { public: true }).catch(() => {})
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'')
  const filename = `badge-${slug}.png`
  const { error } = await supabase.storage.from('badge-images').upload(filename, buffer, {
    contentType: 'image/png', upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)
  return publicUrl
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('=== Gerador de Emblemas MeAndYou ===')
console.log('Providers: AI Horde (gratuito) → Pollinations (fallback)\n')

const { data: badges, error: fetchErr } = await supabase
  .from('badges')
  .select('id,name,rarity,icon_url')
  .eq('is_active', true)
  .is('icon_url', null)
  .order('created_at')

if (fetchErr) { console.error('Erro Supabase:', fetchErr.message); process.exit(1) }

console.log(`Badges sem imagem: ${badges.length}\n`)
if (badges.length === 0) { console.log('Nada a fazer!'); process.exit(0) }

let gerados = 0, erros = 0

for (const badge of badges) {
  console.log(`\n> [${gerados+erros+1}/${badges.length}] ${badge.name} (${badge.rarity})`)
  try {
    const buf = await generateImage(badge.name, badge.rarity)
    const url = await uploadImage(buf, badge.name)
    await supabase.from('badges').update({ icon_url: url }).eq('id', badge.id)
    console.log(`  URL: ${url}`)
    gerados++
  } catch (err) {
    console.error(`  ERRO: ${err.message}`)
    erros++
  }
  await new Promise(r => setTimeout(r, 3000))
}

console.log(`\n=== Resultado ===`)
console.log(`Gerados: ${gerados} | Erros: ${erros}`)
