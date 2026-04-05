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

// ─── Tokens / URLs dos providers ───────────────────────────────────────────
const HF_TOKEN         = env.HUGGINGFACE_API_TOKEN
const DEEPAI_KEY       = env.DEEPAI_API_KEY
const OPENROUTER_KEY   = env.OPENROUTER_API_KEY

const HF_PIXEL_MODEL = 'https://router.huggingface.co/hf-inference/models/nerijs/pixel-art-xl'

const RARITY_COLOR = {
  comum:'light gray and white', incomum:'blue and cyan', raro:'emerald green',
  super_raro:'purple and violet', epico:'orange and amber',
  lendario:'golden yellow', super_lendario:'crimson red and black',
}

const BADGES = [
  { name:'Bem-vindo',           type:'conexao',   rarity:'comum',          condition_type:'on_join',            condition_value:null,        description:'Criou uma conta no MeAndYou.',                          requirement:'Criar uma conta no app',                               icon:'cheerful pixel character waving hello with welcome sign',  level:null },
  { name:'Perfil Completo',     type:'reputacao', rarity:'comum',          condition_type:'profile_complete',   condition_value:null,        description:'Preencheu foto e bio com pelo menos 30 caracteres.',    requirement:'Adicionar foto e preencher a bio com 30+ caracteres',  icon:'glowing profile card with checkmark and star',             level:null },
  { name:'Galeria Rica',        type:'reputacao', rarity:'comum',          condition_type:'photos_gte',         condition_value:{count:5},   description:'Tem 5 ou mais fotos no perfil.',                        requirement:'Adicionar 5 ou mais fotos ao perfil',                  icon:'three photo frames stacked with sparkle',                  level:null },
  { name:'Relato Corajoso',     type:'reputacao', rarity:'comum',          condition_type:'took_bolo',          condition_value:null,        description:'Reportou ter sido deixado para tras em um encontro.',   requirement:'Registrar um bolo recebido',                           icon:'shield with cracked heart and lightning bolt',             level:null },
  { name:'Magnetico I',         type:'conexao',   rarity:'comum',          condition_type:'matches_gte',        condition_value:{count:1},   description:'Conseguiu o primeiro match no app.',                    requirement:'Conseguir 1 match',                                    icon:'two pixel hearts connecting together with spark',          level:'I'   },
  { name:'Desejado I',          type:'reputacao', rarity:'comum',          condition_type:'likes_received_gte', condition_value:{count:10},  description:'Recebeu as primeiras curtidas de outros usuarios.',     requirement:'Receber 10 curtidas',                                  icon:'single heart with sparkle rays around it',                 level:'I'   },
  { name:'Embaixador I',        type:'indicacao', rarity:'comum',          condition_type:'invited_gte',        condition_value:{count:1},   description:'Indicou o primeiro amigo para o app.',                  requirement:'Indicar 1 amigo',                                      icon:'pixel character holding sealed envelope letter',           level:'I'   },
  { name:'Presenca I',          type:'conexao',   rarity:'comum',          condition_type:'video_calls_gte',    condition_value:{count:1},   description:'Realizou a primeira videochamada no app.',              requirement:'Realizar 1 videochamada',                              icon:'retro pixel video camera with power button',               level:'I'   },
  { name:'Comunicativo I',      type:'conexao',   rarity:'comum',          condition_type:'messages_sent_gte',  condition_value:{count:10},  description:'Enviou as primeiras mensagens no app.',                 requirement:'Enviar 10 mensagens',                                  icon:'speech bubble with three dots inside',                     level:'I'   },
  { name:'Fiel I',              type:'reputacao', rarity:'comum',          condition_type:'streak_gte',         condition_value:{count:3},   description:'Manteve streak de 3 dias seguidos no app.',             requirement:'Manter streak de 3 dias seguidos',                     icon:'small calendar page with tiny flame',                      level:'I'   },
  { name:'Identidade Verificada',type:'reputacao',rarity:'raro',           condition_type:'on_verify',          condition_value:null,        description:'Verificou sua identidade com biometria facial.',        requirement:'Verificar identidade biometrica',                      icon:'shield with checkmark and scan lines',                     level:null  },
  { name:'Magnetico II',        type:'conexao',   rarity:'raro',           condition_type:'matches_gte',        condition_value:{count:10},  description:'Ja fez mais de 10 matches no app.',                     requirement:'Conseguir 10 matches',                                 icon:'two intertwined hearts with glow aura',                    level:'II'  },
  { name:'Desejado II',         type:'reputacao', rarity:'raro',           condition_type:'likes_received_gte', condition_value:{count:50},  description:'Recebeu 50 curtidas de outros usuarios.',               requirement:'Receber 50 curtidas',                                  icon:'multiple hearts surrounding a shining star',               level:'II'  },
  { name:'Embaixador II',       type:'indicacao', rarity:'raro',           condition_type:'invited_gte',        condition_value:{count:5},   description:'Indicou 5 amigos para o app.',                          requirement:'Indicar 5 amigos',                                     icon:'pixel character with megaphone and sound waves',           level:'II'  },
  { name:'Presenca II',         type:'conexao',   rarity:'raro',           condition_type:'video_calls_gte',    condition_value:{count:5},   description:'Realizou 5 videochamadas no app.',                      requirement:'Realizar 5 videochamadas',                             icon:'video camera with shining star above lens',                level:'II'  },
  { name:'Comunicativo II',     type:'conexao',   rarity:'raro',           condition_type:'messages_sent_gte',  condition_value:{count:100}, description:'Enviou mais de 100 mensagens no app.',                  requirement:'Enviar 100 mensagens',                                 icon:'two speech bubbles overlapping with sparkles',             level:'II'  },
  { name:'Fiel II',             type:'reputacao', rarity:'raro',           condition_type:'streak_gte',         condition_value:{count:7},   description:'Manteve streak de 7 dias seguidos.',                    requirement:'Manter streak de 7 dias seguidos',                     icon:'calendar with tall fire flame',                            level:'II'  },
  { name:'Magnetico III',       type:'conexao',   rarity:'super_raro',     condition_type:'matches_gte',        condition_value:{count:50},  description:'Fez 50 matches - verdadeira forca de atracao.',         requirement:'Conseguir 50 matches',                                 icon:'heart magnet attracting many floating hearts',             level:'III' },
  { name:'Desejado III',        type:'reputacao', rarity:'super_raro',     condition_type:'likes_received_gte', condition_value:{count:200}, description:'Recebeu 200 curtidas - um verdadeiro fenomeno.',        requirement:'Receber 200 curtidas',                                 icon:'crown made entirely of hearts with gems',                  level:'III' },
  { name:'Comunicativo III',    type:'conexao',   rarity:'super_raro',     condition_type:'messages_sent_gte',  condition_value:{count:500}, description:'Enviou mais de 500 mensagens no app.',                  requirement:'Enviar 500 mensagens',                                 icon:'many speech bubbles arranged in star formation',           level:'III' },
  { name:'Embaixador III',      type:'indicacao', rarity:'epico',          condition_type:'invited_gte',        condition_value:{count:20},  description:'Indicou 20 amigos - o maior embaixador do app.',        requirement:'Indicar 20 amigos',                                    icon:'pixel character holding burning torch flag',               level:'III' },
  { name:'Presenca III',        type:'conexao',   rarity:'epico',          condition_type:'video_minutes_gte',  condition_value:{count:120}, description:'Acumulou 2 horas em videochamadas no app.',              requirement:'Acumular 120 minutos em videochamadas',                icon:'video camera with golden crown on top',                    level:'III' },
  { name:'Fiel III',            type:'reputacao', rarity:'epico',          condition_type:'streak_longest_gte', condition_value:{count:30},  description:'Alcancou o maior streak de 30 dias.',                   requirement:'Atingir streak maximo de 30 dias',                     icon:'infinity symbol made of fire',                             level:'III' },
  { name:'Assinante',           type:'reputacao', rarity:'epico',          condition_type:'plan_active',        condition_value:null,         description:'Tem plano Plus ou Black ativo no app.',                 requirement:'Ter plano Plus ou Black ativo',                        icon:'diamond membership card with glowing star',                       level:null  },
  { name:'Membro Fundador',     type:'fundador',  rarity:'lendario',       condition_type:'early_adopter',      condition_value:null,         description:'Pioneiro - estava aqui desde o inicio.',                requirement:'Entrar no app durante o periodo de lancamento',        icon:'golden key with crown floating above it',                        level:null, condition_extra:{reference_date:'2026-08-01'} },
  { name:'Elite Black',         type:'reputacao', rarity:'super_lendario', condition_type:'plan_black',         condition_value:null,         description:'Membro com plano Black - o topo do MeAndYou.',          requirement:'Ter plano Black ativo',                                icon:'black crown with red glowing gems and dark aura',                level:null  },
  // Badges únicos automáticos — níveis extras e condições distintas
  { name:'Da Paquera',          type:'reputacao', rarity:'raro',           condition_type:'likes_received_gte', condition_value:{count:100},  description:'Recebeu 100 curtidas de outros usuarios.',              requirement:'Receber 100 curtidas',                                 icon:'heart surrounded by many smaller hearts with glow',              level:null  },
  { name:'Irresistivel',        type:'reputacao', rarity:'lendario',       condition_type:'matches_gte',        condition_value:{count:200},  description:'Fez 200 matches - verdadeiramente irresistivel.',       requirement:'Conseguir 200 matches',                                icon:'magnet made of gold attracting flying hearts',                    level:null  },
  { name:'Popstar',             type:'reputacao', rarity:'lendario',       condition_type:'likes_received_gte', condition_value:{count:500},  description:'Recebeu 500 curtidas - uma lenda do app.',              requirement:'Receber 500 curtidas',                                 icon:'shining star with hearts orbiting around it',                    level:null  },
  { name:'Super Indicador',     type:'indicacao', rarity:'raro',           condition_type:'invited_gte',        condition_value:{count:10},   description:'Indicou 10 amigos para o app.',                         requirement:'Indicar 10 amigos',                                    icon:'pixel character with loudspeaker and crowd behind',              level:null  },
  { name:'Conectado',           type:'conexao',   rarity:'incomum',        condition_type:'video_calls_gte',    condition_value:{count:10},   description:'Realizou 10 videochamadas no app.',                     requirement:'Realizar 10 videochamadas',                            icon:'video camera with wifi signal waves',                            level:null  },
  { name:'Bom de Papo',         type:'conexao',   rarity:'incomum',        condition_type:'messages_total_gte', condition_value:{count:250},  description:'Trocou mais de 250 mensagens no total.',                requirement:'Trocar 250 mensagens (enviadas + recebidas)',           icon:'two speech bubbles linked together with lightning bolt',          level:null  },
  { name:'Dedicado',            type:'reputacao', rarity:'raro',           condition_type:'streak_gte',         condition_value:{count:30},   description:'Manteve streak de 30 dias consecutivos.',               requirement:'Manter streak de 30 dias seguidos',                    icon:'calendar with giant blazing fire column',                        level:null  },
]

// ─── Prompt builders ─────────────────────────────────────────────────────────
// Cada provider tem seu formato ideal de prompt.

// Formato descritivo com colchetes — para HuggingFace e OpenRouter (modelos de linguagem/difusão guiados por texto)
function buildPromptDescriptive(b) {
  const color = RARITY_COLOR[b.rarity] || 'gray'
  return [
    '[pixel art badge icon]',
    '[retro social game style like Habbo Hotel]',
    '[thick black outline on icon]',
    '[limited color palette]',
    '[clean pixel grid, no blur, no anti-aliasing]',
    '[symmetrical composition, centered icon]',
    `[central icon: ${b.icon}]`,
    `[color theme: ${color}]`,
    b.level ? `[bottom banner with roman numeral ${b.level}]` : '',
    '[solid pure white background outside the badge icon]',
    '[high contrast, high readability]',
    '[512x512 pixels]',
  ].filter(Boolean).join(' ')
}

// Formato SD (palavras-chave + negativo) — para AI Horde e Pollinations (Stable Diffusion)
// O separador ### indica o início do prompt negativo no SD
function buildPromptSD(b) {
  const color = RARITY_COLOR[b.rarity] || 'gray'
  const positive = [
    'pixel art badge icon',
    b.icon,
    'habbo hotel style',
    'retro game sprite',
    `${color} color theme`,
    b.level ? `roman numeral ${b.level} banner` : '',
    'single centered icon',
    'black outline',
    'limited color palette',
    '8bit',
    'flat icon',
    'white background',
    'clean',
    'high contrast',
  ].filter(Boolean).join(', ')

  const negative = 'blurry, anime, realistic, 3d, text, watermark, multiple icons, grid, collage, nsfw, ugly, distorted'

  return `${positive} ### ${negative}`
}

// Atalho: retorna o prompt certo para cada provider
function buildPrompt(b, style = 'descriptive') {
  return style === 'sd' ? buildPromptSD(b) : buildPromptDescriptive(b)
}

// ─── Remoção de fundo via flood-fill (corners → alpha) ──────────────────────
async function makePngTransparent(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const px = new Uint8Array(data)
  const idx = (x, y) => (y * width + x) * 4

  // Cor de fundo = pixel do canto superior esquerdo
  const bgR = px[0], bgG = px[1], bgB = px[2]
  const TOLERANCE = 40

  const isBg = (x, y) => {
    const i = idx(x, y)
    return (
      Math.abs(px[i]   - bgR) <= TOLERANCE &&
      Math.abs(px[i+1] - bgG) <= TOLERANCE &&
      Math.abs(px[i+2] - bgB) <= TOLERANCE
    )
  }

  // BFS a partir dos 4 cantos
  const visited = new Uint8Array(width * height)
  const queue = []
  const enqueue = (x, y) => {
    const k = y * width + x
    if (x < 0 || x >= width || y < 0 || y >= height) return
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
    px[idx(x,y)+3] = 0 // transparente
    enqueue(x-1, y); enqueue(x+1, y)
    enqueue(x, y-1); enqueue(x, y+1)
  }

  return sharp(Buffer.from(px), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

// ─── Provider 1: HuggingFace pixel art model ─────────────────────────────────
async function generateWithHFPixel(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(HF_PIXEL_MODEL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    })
    if (res.status === 503) {
      const e = await res.json().catch(() => ({}))
      const wait = Math.ceil(e.estimated_time ?? 20)
      console.log(`    modelo carregando, aguardando ${wait}s...`)
      await new Promise(r => setTimeout(r, (wait + 3) * 1000))
      continue
    }
    if (res.status === 402) throw new Error('créditos HuggingFace esgotados')
    if (!res.ok) throw new Error(`HF Pixel ${res.status}: ${await res.text()}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('HF Pixel Art: max tentativas')
}

// ─── Provider 2: OpenRouter (google/gemini-3.1-flash-image-preview — pago) ───
async function generateWithOpenRouter(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image-preview',
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image'],
      max_tokens: 8192,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
  const json = await res.json()

  // A imagem vem em message.images (campo não-padrão do OpenRouter para Gemini)
  const images = json.choices?.[0]?.message?.images
  if (Array.isArray(images) && images.length > 0) {
    const imgUrl = images[0]?.image_url?.url || images[0]?.url
    if (imgUrl?.startsWith('data:image')) {
      return Buffer.from(imgUrl.split(',')[1], 'base64')
    }
    if (imgUrl) {
      const imgRes = await fetch(imgUrl)
      if (!imgRes.ok) throw new Error(`OpenRouter download ${imgRes.status}`)
      return Buffer.from(await imgRes.arrayBuffer())
    }
  }

  // Fallback: content como data URI
  const content = json.choices?.[0]?.message?.content
  if (typeof content === 'string' && content.startsWith('data:image')) {
    return Buffer.from(content.split(',')[1], 'base64')
  }

  throw new Error('OpenRouter: não foi possível extrair imagem da resposta')
}

// ─── Provider 3: AI Horde (gratuito, Stable Diffusion distribuído) ───────────
const AIHORDE_KEY = env.AIHORDE_API_KEY || '0000000000'

async function generateWithAIHorde(prompt) {
  // Envia o job
  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': AIHORDE_KEY },
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

  // Polling até concluir (máx 3 minutos)
  for (let i = 0; i < 36; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`)
    const check = await checkRes.json()
    if (check.faulted) throw new Error('AI Horde: job com falha')
    if (!check.done) {
      process.stdout.write(`(fila:${check.queue_position ?? '?'} ~${check.wait_time ?? '?'}s) `)
      continue
    }
    // Busca resultado
    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`)
    const data = await statusRes.json()
    const imgData = data.generations?.[0]?.img
    if (!imgData) throw new Error('AI Horde: sem imagem no resultado')
    if (imgData.startsWith('http')) {
      const dl = await fetch(imgData)
      if (!dl.ok) throw new Error(`AI Horde download ${dl.status}`)
      return Buffer.from(await dl.arrayBuffer())
    }
    return Buffer.from(imgData, 'base64')
  }
  throw new Error('AI Horde: timeout (3 minutos)')
}

// ─── Provider 4: Pollinations.ai (gratuito, sem API key) ─────────────────────
async function generateWithPollinations(prompt) {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Date.now()}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(120000) })
    if (res.status === 429) {
      const wait = 15 * attempt
      console.log(`\n    rate limit, aguardando ${wait}s...`)
      await new Promise(r => setTimeout(r, wait * 1000))
      continue
    }
    if (!res.ok) throw new Error(`Pollinations ${res.status}`)
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('image')) throw new Error(`Pollinations retornou ${ct} (não é imagem)`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('Pollinations: max tentativas')
}

// ─── Provider 4: DeepAI (pixel-art-generator) ────────────────────────────────
async function generateWithDeepAI(prompt) {
  const body = new URLSearchParams({ text: prompt })
  const res = await fetch('https://api.deepai.org/api/pixel-art-generator', {
    method: 'POST',
    headers: { 'api-key': DEEPAI_KEY },
    body,
  })
  if (!res.ok) throw new Error(`DeepAI ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (!json.output_url) throw new Error('DeepAI: sem output_url')
  const imgRes = await fetch(json.output_url)
  if (!imgRes.ok) throw new Error(`DeepAI download ${imgRes.status}`)
  return Buffer.from(await imgRes.arrayBuffer())
}

// ─── Orquestrador: tenta providers na ordem ──────────────────────────────────
// Cada provider recebe o prompt no formato ideal para ele:
//   'descriptive' → colchetes, para HuggingFace e OpenRouter
//   'sd'          → palavras-chave + ### negativo, para AI Horde e Pollinations
async function generateImage(badge) {
  const providers = [
    { name: 'HuggingFace Pixel Art', fn: generateWithHFPixel,      enabled: !!HF_TOKEN,       promptStyle: 'descriptive' },
    { name: 'OpenRouter Gemini',      fn: generateWithOpenRouter,   enabled: !!OPENROUTER_KEY, promptStyle: 'descriptive' },
    { name: 'AI Horde',               fn: generateWithAIHorde,      enabled: true,             promptStyle: 'sd'          },
    { name: 'Pollinations.ai',        fn: generateWithPollinations, enabled: true,             promptStyle: 'sd'          },
    { name: 'DeepAI',                 fn: generateWithDeepAI,       enabled: !!DEEPAI_KEY,     promptStyle: 'descriptive' },
  ]

  for (const p of providers) {
    if (!p.enabled) {
      console.log(`  [${p.name}] sem token, pulando`)
      continue
    }
    const prompt = buildPrompt(badge, p.promptStyle)
    process.stdout.write(`  [${p.name}] gerando... `)
    try {
      const raw = await p.fn(prompt)
      const transparent = await makePngTransparent(raw)
      console.log('ok! (fundo removido)')
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
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')
  const filename = `badge-${slug}.png`
  const { error } = await supabase.storage.from('badge-images').upload(filename, buffer, {
    contentType: 'image/png', upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(filename)
  return publicUrl
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('=== Gerador de Emblemas MeAndYou ===')
console.log('Providers ativos:',
  [HF_TOKEN && 'HuggingFace', OPENROUTER_KEY && 'OpenRouter Gemini', 'AI Horde', 'Pollinations.ai', DEEPAI_KEY && 'DeepAI'].filter(Boolean).join(' → ')
)
console.log()

const { data: existing, error: fetchErr } = await supabase.from('badges').select('id,name,rarity,icon_url')
if (fetchErr) { console.error('Erro Supabase:', fetchErr.message); process.exit(1) }
const dbMap = Object.fromEntries((existing ?? []).map(b => [b.name, b]))
console.log(`Badges no banco: ${existing?.length ?? 0}\n`)

let inseridos = 0, gerados = 0, pulados = 0, erros = 0

for (const badge of BADGES) {
  let inDb = dbMap[badge.name]
  if (!inDb) {
    const { data: ins, error: insErr } = await supabase.from('badges').insert({
      id: crypto.randomUUID(), name: badge.name, type: badge.type, description: badge.description,
      icon: '*', icon_url: null, rarity: badge.rarity, requirement_description: badge.requirement,
      condition_type: badge.condition_type, condition_value: badge.condition_value,
      condition_extra: badge.condition_extra ?? {}, user_cohort: 'all', is_active: true, is_published: true,
    }).select('id').single()
    if (insErr) { console.log(`x [INSERT] ${badge.name}: ${insErr.message}`); erros++; continue }
    dbMap[badge.name] = { id: ins.id, name: badge.name, rarity: badge.rarity, icon_url: null }
    inDb = dbMap[badge.name]
    inseridos++
    console.log(`+ [INSERT] ${badge.name} (${badge.rarity})`)
  }

  if (inDb.icon_url) { console.log(`v [SKIP]   ${badge.name}`); pulados++; continue }

  console.log(`\n> [GERAR]  ${badge.name} (${badge.rarity})`)
  try {
    const buf = await generateImage(badge)
    const url = await uploadImage(buf, badge.name)
    await supabase.from('badges').update({ icon_url: url }).eq('id', inDb.id)
    console.log(`  URL: ${url}`)
    gerados++
  } catch (err) {
    console.error(`  ERRO: ${err.message}`)
    erros++
  }
  await new Promise(r => setTimeout(r, 8000))
}

console.log(`\n=== Resultado ===`)
console.log(`Inseridos: ${inseridos} | Gerados: ${gerados} | Pulados: ${pulados} | Erros: ${erros}`)
