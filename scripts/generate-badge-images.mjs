import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k,...v]=l.split('='); return [k.trim(), v.join('=').split('#')[0].trim().replace(/[^\x00-\xFF]/g,'')] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const HF_TOKEN = env.HUGGINGFACE_API_TOKEN
// HuggingFace (principal) — usa créditos mensais gratuitos
const HF_MODEL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell'

const RARITY_COLOR = {
  comum:'light gray and white', raro:'emerald green', super_raro:'purple and violet',
  epico:'orange and amber', lendario:'golden yellow', super_lendario:'crimson red',
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
  { name:'Assinante',           type:'reputacao', rarity:'epico',          condition_type:'plan_active',        condition_value:null,        description:'Tem plano Plus ou Black ativo no app.',                 requirement:'Ter plano Plus ou Black ativo',                        icon:'diamond membership card with glowing star',                level:null  },
  { name:'Membro Fundador',     type:'fundador',  rarity:'lendario',       condition_type:'early_adopter',      condition_value:null,        description:'Pioneiro - estava aqui desde o inicio.',                requirement:'Entrar no app durante o periodo de lancamento',        icon:'golden key with crown floating above it',                  level:null, condition_extra:{reference_date:'2026-08-01'} },
  { name:'Elite Black',         type:'reputacao', rarity:'super_lendario', condition_type:'plan_black',         condition_value:null,        description:'Membro com plano Black - o topo do MeAndYou.',          requirement:'Ter plano Black ativo',                                icon:'black crown with red glowing gems and dark aura',          level:null  },
]

function buildPrompt(b) {
  const color = RARITY_COLOR[b.rarity] || 'gray'
  return [
    '[pixel art badge]','[retro social game style]','[thick black outline]',
    '[limited color palette]','[clean pixel grid]','[no blur]','[no anti-aliasing]',
    '[symmetrical composition]',`[central icon: ${b.icon}]`,`[color theme: ${color}]`,
    b.level ? `[bottom banner with roman numeral ${b.level}]` : '',
    '[transparent background]','[high contrast]','[high readability]',
  ].filter(Boolean).join(' ')
}

async function generateImage(prompt) {
  for (let i = 1; i <= 3; i++) {
    process.stdout.write(`  [HF] Tentativa ${i}/3... `)
    const res = await fetch(HF_MODEL, {
      method:'POST',
      headers:{'Authorization':`Bearer ${HF_TOKEN}`,'Content-Type':'application/json'},
      body:JSON.stringify({inputs:prompt}),
    })
    if (res.status === 503) {
      const e = await res.json().catch(()=>({}))
      const w = Math.ceil(e.estimated_time ?? 20)
      console.log(`modelo carregando, aguardando ${w}s...`)
      await new Promise(r=>setTimeout(r,(w+3)*1000))
      continue
    }
    if (!res.ok) throw new Error(`HF ${res.status}: ${await res.text()}`)
    console.log('ok!')
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('Max tentativas HuggingFace')
}

async function uploadImage(buffer, name) {
  await supabase.storage.createBucket('badge-images',{public:true}).catch(()=>{})
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')
  const filename = `badge-${slug}.png`
  const {error} = await supabase.storage.from('badge-images').upload(filename,buffer,{contentType:'image/png',upsert:true})
  if (error) throw new Error(error.message)
  const {data:{publicUrl}} = supabase.storage.from('badge-images').getPublicUrl(filename)
  return publicUrl
}

console.log('=== Gerador de Emblemas MeAndYou ===\n')
const {data:existing,error:fetchErr} = await supabase.from('badges').select('id,name,rarity,icon_url')
if (fetchErr) { console.error('Erro Supabase:', fetchErr.message); process.exit(1) }
const dbMap = Object.fromEntries((existing??[]).map(b=>[b.name,b]))
console.log(`Badges no banco: ${existing?.length??0}\n`)

let inseridos=0, gerados=0, pulados=0, erros=0

for (const badge of BADGES) {
  let inDb = dbMap[badge.name]
  if (!inDb) {
    const {data:ins,error:insErr} = await supabase.from('badges').insert({
      id: crypto.randomUUID(), name:badge.name, type:badge.type, description:badge.description,
      icon:'*', icon_url:null, rarity:badge.rarity, requirement_description:badge.requirement,
      condition_type:badge.condition_type, condition_value:badge.condition_value,
      condition_extra:badge.condition_extra??{}, user_cohort:'all', is_active:true, is_published:true,
    }).select('id').single()
    if (insErr) { console.log(`x [INSERT] ${badge.name}: ${insErr.message}`); erros++; continue }
    dbMap[badge.name] = {id:ins.id, name:badge.name, rarity:badge.rarity, icon_url:null}
    inDb = dbMap[badge.name]
    inseridos++
    console.log(`+ [INSERT] ${badge.name} (${badge.rarity})`)
  }

  if (inDb.icon_url) { console.log(`v [SKIP]   ${badge.name}`); pulados++; continue }

  console.log(`\n> [GERAR]  ${badge.name} (${badge.rarity})`)
  try {
    const buf = await generateImage(buildPrompt(badge))
    const url = await uploadImage(buf, badge.name)
    await supabase.from('badges').update({icon_url:url}).eq('id',inDb.id)
    console.log(`  URL: ${url}`)
    gerados++
  } catch(err) {
    console.error(`  ERRO: ${err.message}`)
    erros++
  }
  await new Promise(r=>setTimeout(r,4000))
}

console.log(`\n=== Resultado ===`)
console.log(`Inseridos: ${inseridos} | Gerados: ${gerados} | Pulados: ${pulados} | Erros: ${erros}`)
