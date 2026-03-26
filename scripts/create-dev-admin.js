#!/usr/bin/env node
/**
 * Cria o usuário admin dev automaticamente via Supabase Admin API.
 * Executar com: node scripts/create-dev-admin.js
 *
 * Requer Node.js 18+ (fetch nativo).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akignnxgjyryqcgxesqn.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('ERRO: defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.')
  process.exit(1)
}

const DEV_EMAIL    = 'devadmin@meandyou.dev'
const DEV_PASSWORD = 'DevAdmin@MeAndYou2025!'

// UUID criado na primeira execução
const KNOWN_UUID = 'd242ae09-5777-42fd-8b1b-93646f4c605e'

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
}

async function restPost(table, body, prefer = 'resolution=merge-duplicates,return=minimal') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'Prefer': prefer },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${table} falhou (${res.status}): ${text}`)
  }
}

// Tenta inserir com o body completo; se falhar por coluna ou tabela ausente,
// trata o erro de forma resiliente (max 10 tentativas por coluna ausente)
async function restPostSafe(table, body, prefer = 'resolution=merge-duplicates,return=minimal', attempt = 0) {
  try {
    await restPost(table, body, prefer)
  } catch (err) {
    const msg = err.message || ''
    // Coluna ausente — remove e tenta de novo
    const colMatch = msg.match(/Could not find the '([^']+)' column/)
    if (colMatch && attempt < 10) {
      const col = colMatch[1]
      console.log(`   Aviso: coluna '${col}' ausente (migration pendente), ignorando...`)
      const { [col]: _removed, ...rest } = body
      await restPostSafe(table, rest, prefer, attempt + 1)
      return
    }
    // Tabela não existe — apenas avisa e continua
    if (msg.includes('Could not find the table') || msg.includes('404')) {
      console.log(`   Aviso: tabela '${table}' ausente (migration pendente), pulando...`)
      return
    }
    // Conflito (já existe) — ok para upsert
    if (msg.includes('409') || msg.includes('duplicate key')) {
      console.log(`   Registro já existe em '${table}', ok.`)
      return
    }
    throw err
  }
}

async function main() {
  console.log('=== Criando/atualizando usuário admin dev para MeAndYou ===\n')

  // ── 1. Obter UUID (usuário já foi criado, usar o UUID conhecido) ──────────
  let devId = KNOWN_UUID
  console.log(`1. UUID do dev admin: ${devId}`)

  // Verifica se o usuário já existe; se não, cria
  const checkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${devId}`, {
    headers: BASE_HEADERS,
  })
  if (!checkRes.ok) {
    console.log('   Usuário não encontrado, criando...')
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        email_confirm: true,
      }),
    })
    const authData = await authRes.json()
    if (!authData.id) {
      console.error('Erro ao criar usuário Auth:', authData)
      process.exit(1)
    }
    devId = authData.id
    console.log(`   Usuário criado! UUID: ${devId}`)
  } else {
    console.log('   Usuário Auth já existe.')
  }

  // ── 2. Perfil completo ───────────────────────────────────────────────────
  console.log('2. Inserindo perfil...')
  await restPostSafe('profiles', {
    id: devId,
    name: 'Dev Admin',
    bio: 'Usuário de desenvolvimento para testar todas as funcionalidades do app. Não é um perfil real.',
    birthdate: '1993-06-15',
    gender: 'homem',
    pronouns: 'ele/dele',
    city: 'São Paulo',
    state: 'SP',
    role: 'admin',
    verified: true,
    last_seen: new Date().toISOString(),
    photo_best:   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    photo_face:   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    photo_body:   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    photo_extra1: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    photo_extra2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    highlight_tags: ['Tecnologia', 'Games', 'Música', 'Viagem', 'Fotografia'],
    status_temp: 'role',
    blur_photos: false,
    show_last_active: true,
    notifications_email: true,
    profile_question: 'Qual seu maior sonho?',
    profile_question_answer: 'Criar conexões reais entre pessoas.',
  })
  console.log('   Perfil inserido.')

  // ── 3. Filtros de busca ──────────────────────────────────────────────────
  console.log('3. Inserindo filtros de busca...')
  await restPostSafe('filters', {
    user_id: devId,
    gender_preference: ['mulher', 'homem', 'nao_binario'],
    min_age: 18,
    max_age: 55,
    max_distance: 100,
    show_verified_only: false,
  }, 'resolution=ignore-duplicates,return=minimal', 0)
  console.log('   Filtros inseridos.')

  // ── 4. Assinatura Black ──────────────────────────────────────────────────
  console.log('4. Inserindo assinatura Black...')
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 10)
  await restPostSafe('subscriptions', {
    user_id: devId,
    plan: 'black',
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  })
  console.log('   Assinatura Black inserida.')

  // ── 5. Fichas e recursos ─────────────────────────────────────────────────
  console.log('5. Inserindo fichas e recursos...')
  const resources = [
    { table: 'user_fichas',     body: { user_id: devId, amount: 99999 } },
    { table: 'user_superlikes', body: { user_id: devId, amount: 999   } },
    { table: 'user_boosts',     body: { user_id: devId, amount: 99, active_until: null } },
    { table: 'user_lupas',      body: { user_id: devId, amount: 99    } },
    { table: 'user_rewinds',    body: { user_id: devId, amount: 99    } },
  ]
  for (const { table, body } of resources) {
    await restPostSafe(table, body)
    console.log(`   ${table} ok.`)
  }

  // ── Resultado ────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║            USUÁRIO ADMIN DEV CRIADO/ATUALIZADO COM SUCESSO!          ║
╠══════════════════════════════════════════════════════════════════════╣
║  Email:    devadmin@meandyou.dev                                     ║
║  Senha:    DevAdmin@MeAndYou2025!                                    ║
║  UUID:     ${devId}                     ║
║  Plano:    BLACK (10 anos)                                           ║
║  Fichas:   99.999  |  SuperLikes: 999  |  Boosts: 99  |  Lupas: 99  ║
║  Role:     admin                                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  IMPORTANTE: rode as migrations pendentes no Supabase SQL Editor:    ║
║    - migration_blur_photos.sql                                       ║
║    - migration_profile_question.sql                                  ║
║  Depois rode este script novamente para completar o perfil.          ║
╚══════════════════════════════════════════════════════════════════════╝
`)
}

main().catch(err => {
  console.error('\nERRO:', err.message)
  process.exit(1)
})
