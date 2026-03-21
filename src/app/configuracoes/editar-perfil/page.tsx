'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { awardXp } from '@/app/lib/xp'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Camera, X, Lock, ChevronDown, ChevronUp, Check, Clock } from 'lucide-react'

// ─── Helpers de rate limit ────────────────────────────────────────────────────

function horasRestantes(iso: string | null, horas: number): number {
  if (!iso) return 0
  const diff = horas * 3600000 - (Date.now() - new Date(iso).getTime())
  return diff > 0 ? Math.ceil(diff / 3600000) : 0
}

function diasRestantes(iso: string | null, dias: number): number {
  if (!iso) return 0
  const diff = dias * 86400000 - (Date.now() - new Date(iso).getTime())
  return diff > 0 ? Math.ceil(diff / 86400000) : 0
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ProfileData {
  bio: string
  photo_face: string | null
  photo_body: string | null
  photo_side: string | null
  photo_extra1: string | null
  photo_extra2: string | null
  photo_extra3: string | null
  photo_best: string | null
  highlight_tags: string[]
  highlight_tags_edited_at: string | null
  profile_edited_at: string | null
  status_temp: string | null
  status_temp_expires_at: string | null
  profile_question: string | null
  profile_question_answer: string | null
}

// ─── Utils de conversão filters → estado UI ──────────────────────────────────

function findSingle(f: any, map: Record<string, string>): string {
  for (const [key, val] of Object.entries(map)) {
    if (f[key]) return val
  }
  return ''
}

function findMulti(f: any, map: Record<string, string>): string[] {
  return Object.entries(map).filter(([key]) => f[key]).map(([, val]) => val)
}

function getAllTags(f: any): string[] {
  if (!f) return []
  const tags: string[] = []
  const check = (key: string, label: string) => { if (f[key]) tags.push(label) }

  // Aparência
  check('eye_black', 'Olhos pretos'); check('eye_brown', 'Olhos castanhos')
  check('eye_green', 'Olhos verdes'); check('eye_blue', 'Olhos azuis')
  check('eye_honey', 'Olhos mel'); check('eye_gray', 'Olhos acinzentados')
  check('hair_black', 'Cabelo preto'); check('hair_brown', 'Cabelo castanho')
  check('hair_blonde', 'Cabelo loiro'); check('hair_red', 'Cabelo ruivo')
  check('hair_colored', 'Cabelo colorido'); check('hair_curly', 'Cabelo cacheado')
  check('hair_coily', 'Cabelo crespo'); check('hair_bald', 'Careca')
  check('skin_white', 'Pele branca'); check('skin_black', 'Pele negra')
  check('skin_mixed', 'Parda'); check('skin_asian', 'Asiático(a)')
  check('feat_tattoo', 'Tatuagem'); check('feat_piercing', 'Piercing')
  check('feat_beard', 'Barba'); check('feat_glasses', 'Óculos')
  check('feat_freckles', 'Sardas')
  // Estilo de vida
  check('smoke_no', 'Não fuma'); check('smoke_yes', 'Fumante'); check('smoke_occasionally', 'Fuma ocasionalmente')
  check('drink_no', 'Não bebe'); check('drink_socially', 'Bebe socialmente'); check('drink_yes', 'Consome álcool')
  check('drug_cannabis', 'Cannabis')
  check('routine_gym', 'Academia'); check('routine_sports', 'Esportes'); check('routine_homebody', 'Caseiro(a)')
  check('routine_party', 'Balada'); check('routine_night_owl', 'Noturno(a)'); check('routine_morning', 'Matutino(a)')
  check('routine_workaholic', 'Workaholic'); check('routine_balanced', 'Vida equilibrada')
  check('hob_gamer', 'Gamer'); check('hob_reader', 'Leitor(a)'); check('hob_travel', 'Viajante')
  check('hob_movies', 'Cinéfilo(a)'); check('hob_dance', 'Dança'); check('hob_photography', 'Fotografia')
  check('hob_art', 'Arte'); check('hob_live_music', 'Música ao vivo'); check('hob_meditation', 'Meditação/Yoga')
  check('hob_hiking', 'Trilha/Natureza'); check('hob_kpop', 'K-pop'); check('hob_anime', 'Anime/Mangá')
  check('diet_vegan', 'Vegano(a)'); check('diet_vegetarian', 'Vegetariano(a)')
  check('diet_healthy', 'Alimentação saudável'); check('food_cooks', 'Cozinha bem')
  // Personalidade
  check('pers_extrovert', 'Extrovertido(a)'); check('pers_introvert', 'Introvertido(a)')
  check('pers_ambivert', 'Ambiverte'); check('pers_calm', 'Calmo(a)')
  check('pers_intense', 'Intenso(a)'); check('pers_communicative', 'Comunicativo(a)')
  check('pers_shy', 'Tímido(a)')
  check('rel_evangelical', 'Evangélico(a)'); check('rel_catholic', 'Católico(a)')
  check('rel_atheist', 'Ateu/Ateia'); check('rel_spiritist', 'Espírita')
  check('rel_agnostic', 'Agnóstico(a)')
  check('kids_has', 'Tem filhos'); check('kids_no', 'Sem filhos')
  check('kids_wants', 'Quer filhos'); check('kids_no_want', 'Não quer filhos')
  check('pet_dog', 'Tem cachorro'); check('pet_cat', 'Tem gato'); check('pet_loves', 'Ama animais')
  // Objetivos
  check('obj_serious', 'Relacionamento sério'); check('obj_casual', 'Relacionamento casual')
  check('obj_friendship', 'Amizade'); check('obj_open', 'Aberto a experiências')
  check('obj_events', 'Companhia para eventos')

  return tags
}

// ─── Barra de completude ──────────────────────────────────────────────────────

function calcCompletude(profileData: ProfileData | null, filtersData: any): number {
  let pts = 0, total = 0
  const fotoSlots = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
  const fotos = fotoSlots.filter(s => (profileData as any)?.[s]).length
  total += 6; pts += fotos
  total += 1; if (profileData?.bio && profileData.bio.length >= 30) pts += 1
  total += 1; if ((profileData?.highlight_tags?.length ?? 0) > 0) pts += 1
  total += 1; if (filtersData) pts += 1
  return Math.round((pts / total) * 100)
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EditarPerfilPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [filtersData, setFiltersData] = useState<any>(null)
  const [emblemasTitulos, setEmblemasTitulos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [secaoAberta, setSecaoAberta] = useState<string | null>('fotos-bio')
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const [{ data: p, error: pErr }, { data: f }, { data: bData }] = await Promise.all([
        supabase.from('profiles')
          .select('bio, photo_face, photo_body, photo_side, photo_extra1, photo_extra2, photo_extra3, photo_best, highlight_tags, highlight_tags_edited_at, profile_edited_at, status_temp, status_temp_expires_at, profile_question, profile_question_answer, reg_email_verified, reg_facial_verified')
          .eq('id', user.id).single(),
        supabase.from('filters').select('*').eq('user_id', user.id).single(),
        supabase.from('user_badges').select('badges(name)').eq('user_id', user.id),
      ])
      if (pErr) console.error('[editar-perfil] profiles query error:', pErr)
      const profileDefault: ProfileData = {
        bio: '', photo_face: null, photo_body: null, photo_side: null,
        photo_extra1: null, photo_extra2: null, photo_extra3: null,
        photo_best: null, highlight_tags: [], highlight_tags_edited_at: null,
        profile_edited_at: null, status_temp: null, status_temp_expires_at: null,
        profile_question: null, profile_question_answer: null,
      }
      setProfileData(p ? (p as ProfileData) : profileDefault)
      if (p) setNeedsVerification((p as any).reg_email_verified === true && (p as any).reg_facial_verified !== true)
      setFiltersData(f)
      setEmblemasTitulos(((bData ?? []) as any[]).map((ub: any) => ub.badges?.name).filter(Boolean))
      setLoading(false)
    })
  }, [])

  // Disparar XP de perfil completo uma vez quando chegar a 100%
  const [xpCompleteDisparado, setXpCompleteDisparado] = useState(false)
  useEffect(() => {
    if (!userId || loading || xpCompleteDisparado) return
    const completude = calcCompletude(profileData, filtersData)
    if (completude >= 100) {
      awardXp(userId, 'profile_complete')
      setXpCompleteDisparado(true)
    }
  }, [profileData, filtersData, userId, loading])

  function toggle(secao: string) {
    setSecaoAberta(prev => prev === secao ? null : secao)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.08)', borderTop: '2px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const horasTagsBloqueadas = horasRestantes(profileData?.highlight_tags_edited_at ?? null, 6)
  const diasCamposBloqueados = diasRestantes(profileData?.profile_edited_at ?? null, 7)
  const completude = calcCompletude(profileData, filtersData)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#08090E', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, backgroundColor: '#08090E', zIndex: 10 }}>
        <button
          onClick={() => router.push('/configuracoes')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#F8F9FA', fontSize: '20px', margin: 0 }}>Editar perfil</h1>
      </div>

      {/* ── Barra de conclusão ── */}
      <div style={{ margin: '12px 16px', padding: '14px 16px', backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600 }}>Conclusão do perfil</span>
          <span style={{ color: '#E11D48', fontSize: '14px', fontWeight: 700 }}>{completude}%</span>
        </div>
        <div style={{ height: '6px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completude}%`, backgroundColor: '#E11D48', borderRadius: '100px', transition: 'width 0.4s ease' }} />
        </div>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '12px', margin: '8px 0 0' }}>Complete seu perfil para aparecer em mais buscas</p>
      </div>

      <div style={{ padding: '4px 0' }}>

        {/* ── Status de hoje (livre, temporário) ── */}
        <Acordeao
          id="status-hoje"
          titulo="Status de hoje"
          badge="Livre"
          badgeCor="#10b981"
          aberto={secaoAberta === 'status-hoje'}
          onToggle={() => toggle('status-hoje')}
        >
          {userId && (
            <StatusTempSection
              userId={userId}
              statusAtual={profileData?.status_temp ?? null}
              expiresAt={profileData?.status_temp_expires_at ?? null}
              onSaved={(s, e) => setProfileData(prev => prev ? { ...prev, status_temp: s, status_temp_expires_at: e } : prev)}
            />
          )}
        </Acordeao>

        {/* ── Fotos & Bio (livre) ── */}
        <Acordeao
          id="fotos-bio"
          titulo="Fotos e bio"
          badge="Livre"
          badgeCor="#10b981"
          aberto={secaoAberta === 'fotos-bio'}
          onToggle={() => toggle('fotos-bio')}
        >
          {userId && profileData && (
            <FotosBioSection
              userId={userId}
              profileData={profileData}
              onSaved={(updated) => setProfileData(prev => prev ? { ...prev, ...updated } : prev)}
            />
          )}
        </Acordeao>

        {/* ── Tags de destaque (6h) ── */}
        <Acordeao
          id="tags-destaque"
          titulo="Tags de destaque"
          badge={horasTagsBloqueadas > 0 ? `${horasTagsBloqueadas}h` : 'Livre agora'}
          badgeCor={horasTagsBloqueadas > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'tags-destaque'}
          onToggle={() => toggle('tags-destaque')}
        >
          {userId && (
            <TagsDestaqueSection
              userId={userId}
              emblemasTitulos={emblemasTitulos}
              tagsSelecionadas={profileData?.highlight_tags ?? []}
              bloqueadoPor={horasTagsBloqueadas}
              onSaved={(tags) => setProfileData(prev => prev ? { ...prev, highlight_tags: tags, highlight_tags_edited_at: new Date().toISOString() } : prev)}
            />
          )}
        </Acordeao>

        {/* ── Campos 7 dias ── */}
        {diasCamposBloqueados > 0 && (
          <div style={{ margin: '8px 16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} color="#f59e0b" />
            <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>
              As seções abaixo podem ser editadas novamente em <strong>{diasCamposBloqueados} dia{diasCamposBloqueados > 1 ? 's' : ''}</strong>.
            </p>
          </div>
        )}

        <Acordeao
          id="status-civil"
          titulo="Status civil"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : 'Livre agora'}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'status-civil'}
          onToggle={() => toggle('status-civil')}
        >
          {userId && (
            <StatusCivilSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="fisico"
          titulo="Características físicas"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : 'Livre agora'}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'fisico'}
          onToggle={() => toggle('fisico')}
        >
          {userId && (
            <FisicoSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="estilo-vida"
          titulo="Estilo de vida"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : 'Livre agora'}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'estilo-vida'}
          onToggle={() => toggle('estilo-vida')}
        >
          {userId && (
            <EstiloVidaSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="valores"
          titulo="Valores e contexto"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : 'Livre agora'}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'valores'}
          onToggle={() => toggle('valores')}
        >
          {userId && (
            <ValoresSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="objetivos"
          titulo="O que busco"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : 'Livre agora'}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : '#10b981'}
          aberto={secaoAberta === 'objetivos'}
          onToggle={() => toggle('objetivos')}
        >
          {userId && (
            <ObjetivosSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        {/* ── Banner de continuacao para novos usuarios ── */}
        {needsVerification && (
          <div style={{ margin: '8px 0', padding: '16px 20px', borderRadius: '14px', backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>Perfil salvo!</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Proximo passo: verificacao de identidade</p>
            </div>
            <button
              onClick={() => { window.location.href = '/verificacao' }}
              style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '10px', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── Dados bloqueados ── */}
        <Acordeao
          id="dados-documento"
          titulo="Dados do documento"
          badge="Bloqueado"
          badgeCor="rgba(255,255,255,0.30)"
          aberto={secaoAberta === 'dados-documento'}
          onToggle={() => toggle('dados-documento')}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '12px' }}>
              <Lock size={18} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ color: 'rgba(248,249,250,0.60)', fontSize: '14px', margin: '0 0 8px', lineHeight: '1.5' }}>
                  Nome, data de nascimento, gênero, pronomes e orientação sexual foram registrados com base no seu documento de identidade e não podem ser alterados diretamente.
                </p>
                <p style={{ color: 'rgba(248,249,250,0.35)', fontSize: '13px', margin: '0 0 12px', lineHeight: '1.5' }}>
                  Para solicitar uma alteração, abra um chamado no suporte com o motivo e a documentação necessária.
                </p>
                <a
                  href="/suporte"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.25)', color: '#E11D48', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                >
                  Abrir chamado no suporte
                </a>
              </div>
            </div>
          </div>
        </Acordeao>

      </div>
    </div>
  )
}

// ─── Acordeão ────────────────────────────────────────────────────────────────

function Acordeao({ id, titulo, badge, badgeCor, aberto, onToggle, children }: {
  id: string; titulo: string; badge: string; badgeCor: string
  aberto: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: aberto ? 'rgba(255,255,255,0.02)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
      >
        <span style={{ color: '#F8F9FA', fontSize: '15px', fontWeight: 600, flex: 1 }}>{titulo}</span>
        <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: `${badgeCor}18`, color: badgeCor, border: `1px solid ${badgeCor}30` }}>
          {badge}
        </span>
        {aberto ? <ChevronUp size={16} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.35)" />}
      </button>
      {aberto && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>{children}</div>}
    </div>
  )
}

// ─── Seção: Fotos & Bio ───────────────────────────────────────────────────────

const PERGUNTAS_SUGESTOES = [
  'Qual seria seu fim de semana ideal?',
  'O que não pode faltar num primeiro encontro?',
  'Qual música define você agora?',
  'Qual seria a viagem dos sonhos?',
  'O que te faz rir de verdade?',
  'Série ou filme? Qual é a favorita?',
  'O que você faz quando quer relaxar?',
  'Qual superpoder você escolheria?',
  'Café da manhã ou jantar romântico?',
  'Qual é a sua história favorita para contar?',
]

const BIO_SUGESTOES = [
  'Adoro viajar', 'Trabalho com tecnologia', 'Fã de boa música',
  'Gosto de cozinhar', 'Apaixonado(a) por filmes', 'Amo animais',
  'Pratico esportes', 'Leitor(a) compulsivo(a)', 'Amo a natureza',
]

function FotosBioSection({ userId, profileData, onSaved }: {
  userId: string
  profileData: ProfileData
  onSaved: (updated: Partial<ProfileData>) => void
}) {
  const fotoSlots = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
  const fotoNomes = ['Rosto', 'Corpo inteiro', 'Lateral', 'Extra 1', 'Extra 2', 'Extra 3']

  const [fotosUrls, setFotosUrls] = useState<(string | null)[]>(
    fotoSlots.map(slot => (profileData as any)[slot] ?? null)
  )
  const [fotoPrincipal, setFotoPrincipal] = useState(() => {
    const best = profileData.photo_best
    const idx = fotoSlots.findIndex(slot => (profileData as any)[slot] === best)
    return idx >= 0 ? idx : 0
  })
  const [bio, setBio] = useState(profileData.bio ?? '')
  const [pergunta, setPergunta] = useState(profileData.profile_question ?? '')
  const [resposta, setResposta] = useState(profileData.profile_question_answer ?? '')
  const [mostrarListaPerguntas, setMostrarListaPerguntas] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const fotosComUrl = fotosUrls.filter(u => u).length

  async function handleFoto(index: number, file: File) {
    if (file.size > 5 * 1024 * 1024) { setErro('Foto muito grande. Máximo 5MB.'); return }
    setEnviando(index); setErro('')
    const form = new FormData()
    form.append('foto', file)
    form.append('index', String(index))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/moderar-foto', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: form,
      })
      const data = await res.json()
      if (!data.aprovado) { setErro(data.motivo || 'Foto recusada.'); return }
      const novas = [...fotosUrls]; novas[index] = data.url; setFotosUrls(novas)
    } catch { setErro('Falha de conexão. Tente novamente.') }
    finally { setEnviando(null) }
  }

  function removerFoto(index: number) {
    const novas = [...fotosUrls]; novas[index] = null; setFotosUrls(novas)
    if (fotoPrincipal === index) setFotoPrincipal(fotosUrls.findIndex((u, i) => u && i !== index) ?? 0)
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const update: Record<string, string | null> = {}
    fotoSlots.forEach((slot, i) => { update[slot] = fotosUrls[i] ?? null })
    update['photo_best'] = fotosUrls[fotoPrincipal] ?? fotosUrls.find(Boolean) ?? null
    try {
      const perguntaFinal = pergunta.trim() || null
      const respostaFinal = perguntaFinal ? (resposta.trim() || null) : null
      const { error: saveErr } = await supabase.from('profiles').upsert({ id: userId, bio, profile_question: perguntaFinal, profile_question_answer: respostaFinal, ...update })
      if (saveErr) throw saveErr
      onSaved({ bio, profile_question: perguntaFinal, profile_question_answer: respostaFinal, photo_best: update['photo_best'], ...Object.fromEntries(fotoSlots.map((s, i) => [s, fotosUrls[i]])) } as any)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] fotos-bio', err); setErro('Erro ao salvar. Verifique sua conexao e tente novamente.') }
    setSalvando(false)
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* Foto Inteligente — só mostra se houver pelo menos 2 fotos */}
      {fotosComUrl >= 2 && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => {
              const melhores = fotosUrls.map((url, i) => ({ url, i })).filter(x => x.url)
              if (melhores.length > 0 && melhores[0].i !== fotoPrincipal) {
                setFotoPrincipal(melhores[0].i)
              }
            }}
            style={{ backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.20)', color: '#E11D48', borderRadius: '100px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', fontWeight: 500 }}
          >
            ✦ Foto Inteligente — auto-selecionar melhor
          </button>
        </div>
      )}

      {/* Instrucao de fotos */}
      <div style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', borderRadius: '12px' }}>
        <p style={{ color: 'rgba(248,249,250,0.65)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
          <strong style={{ color: '#F8F9FA' }}>Adicione ate 6 fotos.</strong> As 3 primeiras sao sugeridas: rosto, corpo inteiro de frente e corpo inteiro de lado. As demais sao opcionais.
        </p>
      </div>

      {/* Grade de fotos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {fotoSlots.map((_, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', border: fotoPrincipal === i ? '2px solid #E11D48' : '1.5px dashed rgba(255,255,255,0.10)' }}>
            {fotosUrls[i] ? (
              <>
                <Image src={fotosUrls[i]!} alt={fotoNomes[i]} fill sizes="150px" style={{ objectFit: 'cover' }} />
                <button
                  onClick={() => removerFoto(i)}
                  style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={12} color="#fff" />
                </button>
                {fotoPrincipal !== i && (
                  <button
                    onClick={() => setFotoPrincipal(i)}
                    style={{ position: 'absolute', bottom: '6px', left: '6px', padding: '2px 8px', borderRadius: '100px', backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(248,249,250,0.7)', fontSize: '10px', cursor: 'pointer' }}
                  >
                    Principal
                  </button>
                )}
                {fotoPrincipal === i && (
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', padding: '2px 8px', borderRadius: '100px', backgroundColor: '#E11D48', fontSize: '10px', color: '#fff', fontWeight: 700 }}>
                    ★ Principal
                  </div>
                )}
              </>
            ) : (
              <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px' }}>
                {enviando === i ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.12)', borderTop: '2px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <Camera size={20} color="rgba(255,255,255,0.25)" />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{fotoNomes[i]}</span>
                  </>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFoto(i, e.target.files[0])} />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Bio */}
      <label style={{ display: 'block', color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bio</label>
      <textarea
        value={bio}
        onChange={e => setBio(e.target.value)}
        maxLength={300}
        placeholder="Fale um pouco sobre você…"
        style={{ width: '100%', minHeight: '100px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', color: '#F8F9FA', fontSize: '14px', fontFamily: 'var(--font-jakarta)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
      />
      <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', textAlign: 'right', margin: '4px 0 10px' }}>{bio.length}/300</p>

      {/* Pílulas de sugestão */}
      <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '11px', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sugestoes</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {BIO_SUGESTOES.map(sug => (
          <button
            key={sug}
            onClick={() => {
              if (bio.length + (bio.length > 0 ? 2 : 0) + sug.length <= 300) {
                setBio(prev => prev.length > 0 ? `${prev}, ${sug}` : sug)
              }
            }}
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.55)', borderRadius: '100px', fontSize: '12px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Pergunta do perfil */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Pergunta (opcional)</label>
          {pergunta && (
            <button
              onClick={() => { setPergunta(''); setResposta('') }}
              style={{ color: 'rgba(248,249,250,0.30)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontFamily: 'var(--font-jakarta)' }}
            >
              Remover
            </button>
          )}
        </div>
        <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', margin: '0 0 10px' }}>
          Aparece acima da sua bio. Escolha uma sugestão ou escreva a sua.
        </p>

        {/* Lista de sugestoes */}
        <button
          onClick={() => setMostrarListaPerguntas(p => !p)}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.55)', borderRadius: '100px', fontSize: '12px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>{mostrarListaPerguntas ? '▲' : '▼'}</span> Ver sugestões
        </button>

        {mostrarListaPerguntas && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {PERGUNTAS_SUGESTOES.map(q => (
              <button
                key={q}
                onClick={() => { setPergunta(q); setMostrarListaPerguntas(false) }}
                style={{ backgroundColor: pergunta === q ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pergunta === q ? 'rgba(225,29,72,0.30)' : 'rgba(255,255,255,0.07)'}`, color: pergunta === q ? '#E11D48' : 'rgba(248,249,250,0.65)', borderRadius: '10px', fontSize: '13px', padding: '9px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-jakarta)' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Campo de pergunta personalizada */}
        <input
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          maxLength={120}
          placeholder="Ou escreva sua propria pergunta..."
          style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px', color: '#F8F9FA', fontSize: '14px', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }}
        />

        {/* Campo de resposta — so aparece se tiver pergunta */}
        {pergunta.trim() && (
          <>
            <label style={{ display: 'block', color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Sua resposta</label>
            <textarea
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              maxLength={200}
              placeholder="Responda de forma sincera e divertida..."
              style={{ width: '100%', minHeight: '70px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px', color: '#F8F9FA', fontSize: '14px', fontFamily: 'var(--font-jakarta)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
            />
            <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', textAlign: 'right', margin: '4px 0 0' }}>{resposta.length}/200</p>
          </>
        )}
      </div>

      {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}

      <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}

// ─── Seção: Títulos de emblemas ───────────────────────────────────────────────

function TagsDestaqueSection({ userId, emblemasTitulos, tagsSelecionadas, bloqueadoPor, onSaved }: {
  userId: string
  emblemasTitulos: string[]
  tagsSelecionadas: string[]
  bloqueadoPor: number
  onSaved: (tags: string[]) => void
}) {
  const [selecionadas, setSelecionadas] = useState<string[]>(tagsSelecionadas)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function toggle(titulo: string) {
    if (selecionadas.includes(titulo)) {
      setSelecionadas(prev => prev.filter(t => t !== titulo))
    } else if (selecionadas.length < 1) {
      setSelecionadas(prev => [...prev, titulo])
    }
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    try {
      await supabase.from('profiles').update({
        highlight_tags: selecionadas,
        highlight_tags_edited_at: new Date().toISOString(),
      }).eq('id', userId)
      onSaved(selecionadas)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] tags-destaque', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  if (bloqueadoPor > 0) {
    return (
      <div style={{ padding: '16px' }}>
        <BloqueioAviso horas={bloqueadoPor} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: 0.35, pointerEvents: 'none', marginTop: '12px' }}>
          {tagsSelecionadas.map(tag => <TagChip key={tag} label={tag} ativo />)}
        </div>
      </div>
    )
  }

  if (emblemasTitulos.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: '14px', margin: '0 0 6px', fontWeight: 600 }}>Nenhum emblema conquistado ainda</p>
          <p style={{ color: 'rgba(248,249,250,0.35)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Os títulos disponíveis para exibir no seu card vêm dos emblemas que você conquistar. Complete desafios para desbloquear seus primeiros títulos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', margin: '0 0 4px' }}>
        Escolha <strong style={{ color: '#E11D48' }}>1 título</strong> de emblema conquistado para exibir no seu card. Assim como no Valorant, você pode usar o título de um emblema diferente do que exibe.
      </p>
      <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', margin: '0 0 16px' }}>
        {selecionadas.length}/1 selecionado
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {emblemasTitulos.map(titulo => (
          <TagChip
            key={titulo}
            label={titulo}
            ativo={selecionadas.includes(titulo)}
            desabilitado={!selecionadas.includes(titulo) && selecionadas.length >= 1}
            onClick={() => toggle(titulo)}
          />
        ))}
      </div>
      {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
      <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}

// ─── Seção: Status civil ──────────────────────────────────────────────────────

function StatusCivilSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const map: Record<string, string> = {
    civil_single: 'Solteiro(a)', civil_complicated: 'Enrolado(a)', civil_married: 'Casado(a)',
    civil_divorcing: 'Divorciando', civil_divorced: 'Divorciado(a)', civil_widowed: 'Viúvo(a)', civil_open: 'Relacionamento aberto',
  }
  const [valor, setValor] = useState(() => findSingle(filtersData, map))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function salvar() {
    if (!valor) { setErro('Selecione uma opção.'); return }
    setSalvando(true); setErro(''); setSucesso(false)
    const update: Record<string, boolean> = {}
    Object.keys(map).forEach(k => { update[k] = (map[k] === valor) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...update })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] status-civil', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  return (
    <div style={{ padding: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: bloqueado ? '12px' : '0', opacity: bloqueado ? 0.35 : 1, pointerEvents: bloqueado ? 'none' : 'auto' }}>
        {Object.values(map).map(op => (
          <TagChip key={op} label={op} ativo={valor === op} onClick={() => setValor(op)} />
        ))}
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}

// ─── Seção: Físico ────────────────────────────────────────────────────────────

function FisicoSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapOlhos: Record<string, string> = {
    eye_black: 'Olhos pretos', eye_brown: 'Olhos castanhos', eye_green: 'Olhos verdes',
    eye_blue: 'Olhos azuis', eye_honey: 'Olhos mel', eye_gray: 'Olhos acinzentados', eye_heterochromia: 'Heterocromia',
  }
  const mapCabelo: Record<string, string> = {
    hair_black: 'Cabelo preto', hair_brown: 'Cabelo castanho', hair_blonde: 'Cabelo loiro',
    hair_red: 'Cabelo ruivo', hair_colored: 'Cabelo colorido', hair_gray: 'Cabelo grisalho', hair_bald: 'Careca',
  }
  const mapComprimento: Record<string, string> = {
    hair_short: 'Cabelo curto', hair_medium: 'Cabelo médio', hair_long: 'Cabelo longo',
  }
  const mapTipo: Record<string, string> = {
    hair_straight: 'Cabelo liso', hair_wavy: 'Cabelo ondulado', hair_curly: 'Cabelo cacheado', hair_coily: 'Cabelo crespo',
  }
  const mapPele: Record<string, string> = {
    skin_white: 'Branca', skin_mixed: 'Parda', skin_black: 'Negra',
    skin_asian: 'Asiática', skin_indigenous: 'Indígena', skin_mediterranean: 'Mediterrânea',
  }
  const mapCorpo: Record<string, string> = {
    body_underweight: 'Abaixo do peso', body_healthy: 'Peso saudável', body_overweight: 'Acima do peso',
    body_obese_mild: 'Obesidade leve', body_obese_severe: 'Obesidade severa',
  }
  const mapCaract: Record<string, string> = {
    feat_freckles: 'Sardas', feat_tattoo: 'Tatuagem', feat_piercing: 'Piercing',
    feat_scar: 'Cicatriz', feat_glasses: 'Óculos', feat_braces: 'Aparelho dentário', feat_beard: 'Barba',
  }

  const [corOlhos, setCorOlhos] = useState(() => findSingle(filtersData, mapOlhos))
  const [corCabelo, setCorCabelo] = useState(() => findSingle(filtersData, mapCabelo))
  const [comprimento, setComprimento] = useState(() => findSingle(filtersData, mapComprimento))
  const [tipoCabelo, setTipoCabelo] = useState(() => findSingle(filtersData, mapTipo))
  const [corPele, setCorPele] = useState(() => findSingle(filtersData, mapPele))
  const [corporal, setCorporal] = useState(() => findSingle(filtersData, mapCorpo))
  const [caract, setCaract] = useState<string[]>(() => findMulti(filtersData, mapCaract))
  const [altura, setAltura] = useState<string>(filtersData?.height_cm?.toString() ?? '')
  const [peso, setPeso] = useState<string>(filtersData?.weight_kg?.toString() ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function toggleCaract(val: string) {
    setCaract(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapOlhos).forEach(([k, v]) => { u[k] = corOlhos === v })
    Object.entries(mapCabelo).forEach(([k, v]) => { u[k] = corCabelo === v })
    Object.entries(mapComprimento).forEach(([k, v]) => { u[k] = comprimento === v })
    Object.entries(mapTipo).forEach(([k, v]) => { u[k] = tipoCabelo === v })
    Object.entries(mapPele).forEach(([k, v]) => { u[k] = corPele === v })
    Object.entries(mapCorpo).forEach(([k, v]) => { u[k] = corporal === v })
    Object.entries(mapCaract).forEach(([k, v]) => { u[k] = caract.includes(v) })
    if (altura) u.height_cm = parseInt(altura)
    if (peso) u.weight_kg = parseInt(peso)
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] fisico', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Cor dos olhos" opcoes={Object.values(mapOlhos)} valor={corOlhos} onChange={setCorOlhos} />
        <GrupoOpcoes titulo="Cor do cabelo" opcoes={Object.values(mapCabelo)} valor={corCabelo} onChange={setCorCabelo} />
        <GrupoOpcoes titulo="Comprimento do cabelo" opcoes={Object.values(mapComprimento)} valor={comprimento} onChange={setComprimento} />
        <GrupoOpcoes titulo="Tipo do cabelo" opcoes={Object.values(mapTipo)} valor={tipoCabelo} onChange={setTipoCabelo} />
        <GrupoOpcoes titulo="Cor da pele" opcoes={Object.values(mapPele)} valor={corPele} onChange={setCorPele} />
        <GrupoOpcoes titulo="Tipo corporal" opcoes={Object.values(mapCorpo)} valor={corporal} onChange={setCorporal} />
        <div>
          <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Características</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.values(mapCaract).map(op => (
              <TagChip key={op} label={op} ativo={caract.includes(op)} onClick={() => toggleCaract(op)} />
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Altura (cm)</label>
            <input type="number" value={altura} onChange={e => setAltura(e.target.value)} placeholder="ex: 170"
              style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F8F9FA', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Peso (kg)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="ex: 65"
              style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F8F9FA', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}

// ─── Seção: Estilo de vida ────────────────────────────────────────────────────

function EstiloVidaSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapFumo: Record<string, string> = { smoke_yes: 'Fumo', smoke_occasionally: 'Fumo ocasionalmente', smoke_no: 'Não fumo' }
  const mapBebida: Record<string, string> = { drink_yes: 'Consumo bebida alcoólica', drink_socially: 'Bebo socialmente', drink_no: 'Não consumo bebida alcoólica' }
  const mapRotina: Record<string, string> = {
    routine_gym: 'Academia', routine_sports: 'Esporte regularmente', routine_sedentary: 'Sedentário(a)',
    routine_homebody: 'Caseiro(a)', routine_goes_out: 'Gosto de sair', routine_party: 'Balada',
    routine_night_owl: 'Noturno(a)', routine_morning: 'Matutino(a)', routine_workaholic: 'Workaholic', routine_balanced: 'Vida equilibrada',
  }
  const mapPersonalidade: Record<string, string> = {
    pers_extrovert: 'Extrovertido(a)', pers_introvert: 'Introvertido(a)', pers_ambivert: 'Ambiverte',
    pers_shy: 'Tímido(a)', pers_communicative: 'Comunicativo(a)', pers_antisocial: 'Antissocial',
    pers_reserved: 'Reservado(a)', pers_agitated: 'Agitado(a)', pers_calm: 'Calmo(a)', pers_intense: 'Intenso(a)',
  }
  const mapHobbies: Record<string, string> = {
    hob_gamer: 'Gamer', hob_reader: 'Leitor(a)', hob_movies: 'Filmes', hob_series: 'Séries',
    hob_anime: 'Anime/Mangá', hob_live_music: 'Música ao vivo', hob_photography: 'Fotografia',
    hob_art: 'Arte', hob_dance: 'Dança', hob_travel: 'Viagens', hob_hiking: 'Trilha/Natureza',
    hob_meditation: 'Meditação/Yoga', hob_kpop: 'K-pop', hob_otaku: 'Otaku',
  }
  const mapEsporte: Record<string, string> = {
    sport_football_yes: 'Gosto de futebol', sport_running: 'Corrida', sport_swimming: 'Natação',
    sport_cycling: 'Ciclismo', sport_martial_arts: 'Artes marciais', sport_none: 'Não pratico esportes',
  }
  const mapAlim: Record<string, string> = {
    diet_vegan: 'Vegano(a)', diet_vegetarian: 'Vegetariano(a)', diet_carnivore: 'Carnívoro(a)',
    diet_everything: 'Como de tudo', diet_healthy: 'Alimentação saudável', food_cooks: 'Cozinho bem',
  }
  const mapEstilo: Record<string, string> = {
    style_casual: 'Casual', style_formal: 'Social', style_sporty: 'Esportivo',
    style_alternative: 'Alternativo', style_eclectic: 'Eclético', style_gothic: 'Gótico', style_punk: 'Punk',
  }

  const [fumo, setFumo] = useState(() => findSingle(filtersData, mapFumo))
  const [bebida, setBebida] = useState(() => findSingle(filtersData, mapBebida))
  const [cannabis, setCannabis] = useState(filtersData?.drug_cannabis ?? false)
  const [rotina, setRotina] = useState<string[]>(() => findMulti(filtersData, mapRotina))
  const [personalidade, setPersonalidade] = useState<string[]>(() => findMulti(filtersData, mapPersonalidade))
  const [hobbies, setHobbies] = useState<string[]>(() => findMulti(filtersData, mapHobbies))
  const [esporte, setEsporte] = useState(() => findSingle(filtersData, mapEsporte))
  const [alim, setAlim] = useState<string[]>(() => findMulti(filtersData, mapAlim))
  const [estilo, setEstilo] = useState<string[]>(() => findMulti(filtersData, mapEstilo))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapFumo).forEach(([k, v]) => { u[k] = fumo === v })
    Object.entries(mapBebida).forEach(([k, v]) => { u[k] = bebida === v })
    u.drug_cannabis = cannabis
    u.no_addictions = fumo === 'Não fumo' && bebida === 'Não consumo bebida alcoólica' && !cannabis
    Object.entries(mapRotina).forEach(([k, v]) => { u[k] = rotina.includes(v) })
    Object.entries(mapPersonalidade).forEach(([k, v]) => { u[k] = personalidade.includes(v) })
    Object.entries(mapHobbies).forEach(([k, v]) => { u[k] = hobbies.includes(v) })
    Object.entries(mapEsporte).forEach(([k, v]) => { u[k] = esporte === v })
    Object.entries(mapAlim).forEach(([k, v]) => { u[k] = alim.includes(v) })
    Object.entries(mapEstilo).forEach(([k, v]) => { u[k] = estilo.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] estilo-vida', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Tabaco" opcoes={Object.values(mapFumo)} valor={fumo} onChange={setFumo} />
        <GrupoOpcoes titulo="Bebida alcoólica" opcoes={Object.values(mapBebida)} valor={bebida} onChange={setBebida} />
        <div>
          <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Outras substâncias</p>
          <TagChip label="Cannabis" ativo={cannabis} onClick={() => setCannabis(!cannabis)} />
        </div>
        <GrupoMulti titulo="Rotina" opcoes={Object.values(mapRotina)} valores={rotina} onToggle={v => tog(rotina, setRotina, v)} />
        <GrupoMulti titulo="Personalidade" opcoes={Object.values(mapPersonalidade)} valores={personalidade} onToggle={v => tog(personalidade, setPersonalidade, v)} />
        <GrupoMulti titulo="Hobbies" opcoes={Object.values(mapHobbies)} valores={hobbies} onToggle={v => tog(hobbies, setHobbies, v)} />
        <GrupoOpcoes titulo="Esportes" opcoes={Object.values(mapEsporte)} valor={esporte} onChange={setEsporte} />
        <GrupoMulti titulo="Alimentação" opcoes={Object.values(mapAlim)} valores={alim} onToggle={v => tog(alim, setAlim, v)} />
        <GrupoMulti titulo="Estilo de se vestir" opcoes={Object.values(mapEstilo)} valores={estilo} onToggle={v => tog(estilo, setEstilo, v)} />
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}

// ─── Seção: Valores ───────────────────────────────────────────────────────────

function ValoresSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapReligiao: Record<string, string> = {
    rel_evangelical: 'Evangélico(a)', rel_catholic: 'Católico(a)', rel_spiritist: 'Espírita',
    rel_umbanda: 'Umbandista', rel_candomble: 'Candomblé', rel_buddhist: 'Budista',
    rel_jewish: 'Judaico(a)', rel_islamic: 'Islâmico(a)', rel_hindu: 'Hindu',
    rel_agnostic: 'Agnóstico(a)', rel_atheist: 'Ateu / Ateia', rel_spiritual: 'Espiritualizado(a) sem religião',
  }
  const mapFilhos: Record<string, string> = {
    kids_has: 'Tenho filhos', kids_no: 'Não tenho filhos', kids_wants: 'Quero ter filhos',
    kids_no_want: 'Não quero ter filhos', kids_adoption: 'Aberto(a) à adoção', kids_undecided: 'Ainda não decidi',
  }
  const mapPets: Record<string, string> = {
    pet_dog: 'Tenho cachorro', pet_cat: 'Tenho gato', pet_other: 'Outros pets',
    pet_loves: 'Adoro animais', pet_none: 'Sem pets', pet_allergy: 'Alergia a animais', pet_dislikes: 'Não gosto de animais',
  }
  const mapEscolaridade: Record<string, string> = {
    edu_elementary: 'Ensino fundamental', edu_highschool: 'Ensino médio',
    edu_college_incomplete: 'Superior incompleto', edu_college_complete: 'Superior completo',
    edu_postgrad: 'Pós-graduado(a)', edu_masters: 'Mestrado', edu_phd: 'Doutorado', edu_student: 'Estudante',
  }
  const mapTrabalho: Record<string, string> = {
    work_clt: 'CLT', work_entrepreneur: 'Empreendedor(a)', work_freelancer: 'Freelancer',
    work_liberal: 'Profissional liberal', work_civil_servant: 'Servidor público',
    work_autonomous: 'Autônomo(a)', work_remote: 'Remoto', work_unemployed: 'Desempregado(a)',
  }
  const mapIdiomas: Record<string, string> = {
    lang_portuguese: 'Somente português', lang_english: 'Inglês', lang_spanish: 'Espanhol',
    lang_french: 'Francês', lang_german: 'Alemão', lang_japanese: 'Japonês/Mandarim',
    lang_bilingual: 'Bilíngue', lang_trilingual: 'Trilíngue ou mais',
  }

  const [religiao, setReligiao] = useState(() => findSingle(filtersData, mapReligiao))
  const [filhos, setFilhos] = useState<string[]>(() => findMulti(filtersData, mapFilhos))
  const [pets, setPets] = useState<string[]>(() => findMulti(filtersData, mapPets))
  const [escolaridade, setEscolaridade] = useState(() => findSingle(filtersData, mapEscolaridade))
  const [trabalho, setTrabalho] = useState(() => findSingle(filtersData, mapTrabalho))
  const [idiomas, setIdiomas] = useState<string[]>(() => findMulti(filtersData, mapIdiomas))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapReligiao).forEach(([k, v]) => { u[k] = religiao === v })
    Object.entries(mapFilhos).forEach(([k, v]) => { u[k] = filhos.includes(v) })
    Object.entries(mapPets).forEach(([k, v]) => { u[k] = pets.includes(v) })
    Object.entries(mapEscolaridade).forEach(([k, v]) => { u[k] = escolaridade === v })
    Object.entries(mapTrabalho).forEach(([k, v]) => { u[k] = trabalho === v })
    Object.entries(mapIdiomas).forEach(([k, v]) => { u[k] = idiomas.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] valores', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Religião / espiritualidade" opcoes={Object.values(mapReligiao)} valor={religiao} onChange={setReligiao} />
        <GrupoMulti titulo="Filhos" opcoes={Object.values(mapFilhos)} valores={filhos} onToggle={v => tog(filhos, setFilhos, v)} />
        <GrupoMulti titulo="Pets" opcoes={Object.values(mapPets)} valores={pets} onToggle={v => tog(pets, setPets, v)} />
        <GrupoOpcoes titulo="Escolaridade" opcoes={Object.values(mapEscolaridade)} valor={escolaridade} onChange={setEscolaridade} />
        <GrupoOpcoes titulo="Trabalho" opcoes={Object.values(mapTrabalho)} valor={trabalho} onChange={setTrabalho} />
        <GrupoMulti titulo="Idiomas" opcoes={Object.values(mapIdiomas)} valores={idiomas} onToggle={v => tog(idiomas, setIdiomas, v)} />
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}

// ─── Seção: Objetivos ─────────────────────────────────────────────────────────

function ObjetivosSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapObj: Record<string, string> = {
    obj_serious: 'Relacionamento sério', obj_casual: 'Relacionamento casual', obj_friendship: 'Amizade',
    obj_events: 'Companhia para eventos', obj_conjugal: 'Relação conjugal', obj_open: 'Aberto(a) a experiências',
    obj_sugar_baby: 'Sugar Baby', obj_sugar_daddy: 'Sugar Daddy / Mommy', obj_undefined: 'Ainda estou definindo',
  }
  const mapDiscreto: Record<string, string> = {
    disc_throuple: 'Trisal', disc_swing: 'Swing / aberto', disc_polyamory: 'Poliamor', disc_bdsm: 'BDSM / fetiches',
  }

  const RESTRITOS = ['Sugar Baby', 'Sugar Daddy / Mommy', 'BDSM / fetiches']

  const [objetivos, setObjetivos] = useState<string[]>(() => findMulti(filtersData, mapObj))
  const [discreto, setDiscreto] = useState<string[]>(() => findMulti(filtersData, mapDiscreto))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [modalRestrito, setModalRestrito] = useState<string | null>(null)
  const [tooltipAberto, setTooltipAberto] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (RESTRITOS.includes(val) && !arr.includes(val)) {
      setModalRestrito(val)
      return
    }
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    if (objetivos.length === 0) { setErro('Selecione pelo menos um objetivo.'); return }
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapObj).forEach(([k, v]) => { u[k] = objetivos.includes(v) })
    Object.entries(mapDiscreto).forEach(([k, v]) => { u[k] = discreto.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] objetivos', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoMulti titulo="O que busco" opcoes={Object.values(mapObj)} valores={objetivos} onToggle={v => tog(objetivos, setObjetivos, v)} />
        <GrupoMulti titulo="Interesses discretos" opcoes={Object.values(mapDiscreto)} valores={discreto} onToggle={v => tog(discreto, setDiscreto, v)} />
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}

      {/* Modal de acesso restrito (sugar / fetiche) */}
      {modalRestrito && (
        <div
          onClick={() => setModalRestrito(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#0F1117', borderRadius: '20px 20px 16px 16px', padding: '24px 20px', width: '100%', maxWidth: '430px', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '12px', textAlign: 'center', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Acesso especial</p>
            <h3 style={{ color: '#F8F9FA', fontSize: '18px', fontFamily: 'var(--font-fraunces)', marginBottom: '8px', textAlign: 'center' }}>{modalRestrito}</h3>
            <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', textAlign: 'center' }}>
              Esta categoria requer verificação adicional por segurança. Você pode fazer upgrade de plano ou solicitar acesso via suporte.
            </p>
            <button
              onClick={() => window.location.href = '/planos'}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: '#E11D48', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontFamily: 'var(--font-jakarta)' }}
            >
              Fazer upgrade de plano
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <a
                href="/suporte"
                style={{ color: 'rgba(248,249,250,0.45)', fontSize: '13px', textDecoration: 'underline', textDecorationColor: 'rgba(248,249,250,0.20)' }}
              >
                Solicitar acesso via suporte
              </a>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => setTooltipAberto(p => !p)}
                  style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(248,249,250,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >?</button>
                {tooltipAberto && (
                  <div style={{ position: 'absolute', bottom: '26px', right: 0, width: '220px', backgroundColor: '#1a1d28', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: 'rgba(248,249,250,0.65)', lineHeight: 1.6, zIndex: 10 }}>
                    O acesso via suporte permite usar esta categoria sem upgrade de plano. Envie uma solicitação e nossa equipe avaliará em até 48h.
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setModalRestrito(null)}
              style={{ width: '100%', padding: '11px', marginTop: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: 'rgba(248,249,250,0.40)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes reutilizáveis ────────────────────────────────────────────

function GrupoOpcoes({ titulo, opcoes, valor, onChange }: {
  titulo: string; opcoes: string[]; valor: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{titulo}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {opcoes.map(op => <TagChip key={op} label={op} ativo={valor === op} onClick={() => onChange(op)} />)}
      </div>
    </div>
  )
}

function GrupoMulti({ titulo, opcoes, valores, onToggle }: {
  titulo: string; opcoes: string[]; valores: string[]; onToggle: (v: string) => void
}) {
  return (
    <div>
      <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{titulo}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {opcoes.map(op => <TagChip key={op} label={op} ativo={valores.includes(op)} onClick={() => onToggle(op)} />)}
      </div>
    </div>
  )
}

function TagChip({ label, ativo, onClick, desabilitado }: {
  label: string; ativo?: boolean; onClick?: () => void; desabilitado?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      style={{
        padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
        border: `1.5px solid ${ativo ? 'rgba(225,29,72,0.30)' : 'rgba(255,255,255,0.07)'}`,
        backgroundColor: ativo ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.04)',
        color: ativo ? '#E11D48' : desabilitado ? 'rgba(248,249,250,0.20)' : 'rgba(248,249,250,0.55)',
        cursor: desabilitado ? 'not-allowed' : 'pointer',
        opacity: desabilitado ? 0.35 : 1,
        display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
      }}
    >
      {ativo && <Check size={12} />}
      {label}
    </button>
  )
}

function BotaoSalvar({ loading, sucesso, onClick }: { loading: boolean; sucesso: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        marginTop: '8px', width: '100%', padding: '13px', borderRadius: '14px', border: sucesso ? '1px solid rgba(16,185,129,0.30)' : 'none',
        backgroundColor: sucesso ? 'rgba(16,185,129,0.15)' : '#E11D48',
        color: sucesso ? '#10b981' : '#fff', fontWeight: 700, fontSize: '14px',
        fontFamily: 'var(--font-jakarta)', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'all 0.2s',
      }}
    >
      {loading ? (
        <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.25)', borderTop: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : sucesso ? (
        <><Check size={16} /> Salvo!</>
      ) : 'Salvar'}
    </button>
  )
}

function BloqueioAviso({ horas, dias }: { horas?: number; dias?: number }) {
  const msg = horas
    ? `Pode editar novamente em ${horas} hora${horas > 1 ? 's' : ''}.`
    : `Pode editar novamente em ${dias} dia${(dias ?? 0) > 1 ? 's' : ''}.`
  return (
    <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Clock size={14} color="#f59e0b" />
      <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>{msg}</p>
    </div>
  )
}

// ─── Status Temporário ────────────────────────────────────────────────────────

const STATUS_OPCOES = [
  { id: 'filme_serie',    label: 'Querendo assistir um filme/série'    },
  { id: 'sair_comer',     label: 'Querendo sair para comer'            },
  { id: 'sair_beber',     label: 'Querendo sair para beber'            },
  { id: 'sair_conversar', label: 'Querendo sair para conversar'        },
  { id: 'praia',          label: 'Querendo curtir uma praia'           },
  { id: 'viagem',         label: 'Querendo viajar'                     },
  { id: 'video_chat',     label: 'Querendo conversar por vídeo'        },
  { id: 'treino',         label: 'Querendo companhia para treinar'     },
  { id: 'role',           label: 'Procurando rolê'                     },
]

const DURACAO_OPCOES = [
  { horas: 2,  label: '2 horas'  },
  { horas: 4,  label: '4 horas'  },
  { horas: 8,  label: '8 horas'  },
  { horas: 24, label: '24 horas' },
]

function StatusTempSection({
  userId,
  statusAtual,
  expiresAt,
  onSaved,
}: {
  userId: string
  statusAtual: string | null
  expiresAt: string | null
  onSaved: (status: string | null, expiresAt: string | null) => void
}) {
  const statusVivo = statusAtual && expiresAt && new Date(expiresAt) > new Date()
  const [selecionado, setSelecionado] = useState<string | null>(statusVivo ? statusAtual : null)
  const [duracao, setDuracao] = useState(4)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function salvar() {
    setSaving(true)
    const expires = new Date(Date.now() + duracao * 3600000).toISOString()
    const { error } = await supabase
      .from('profiles')
      .update({ status_temp: selecionado, status_temp_expires_at: selecionado ? expires : null })
      .eq('id', userId)

    if (!error) {
      onSaved(selecionado, selecionado ? expires : null)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2000)
    }
    setSaving(false)
  }

  async function remover() {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ status_temp: null, status_temp_expires_at: null })
      .eq('id', userId)
    setSelecionado(null)
    onSaved(null, null)
    setSaving(false)
  }

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
        Mostre o que você está fazendo hoje. Aparece como tag no seu perfil por tempo limitado.
      </p>

      {statusVivo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.20)',
        }}>
          <span style={{ color: '#F43F5E', fontSize: 13, fontWeight: 600 }}>
            Status ativo: {STATUS_OPCOES.find(s => s.id === statusAtual)?.label}
          </span>
          <button
            onClick={remover}
            disabled={saving}
            style={{ background: 'none', border: 'none', color: 'rgba(248,249,250,0.40)', cursor: 'pointer', fontSize: 13 }}
          >
            Remover
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {STATUS_OPCOES.map(opcao => (
          <button
            key={opcao.id}
            onClick={() => setSelecionado(prev => prev === opcao.id ? null : opcao.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 100,
              border: selecionado === opcao.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.10)',
              background: selecionado === opcao.id ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.04)',
              color: selecionado === opcao.id ? '#F43F5E' : 'rgba(248,249,250,0.65)',
              fontSize: 13, fontWeight: selecionado === opcao.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span>{opcao.label}</span>
          </button>
        ))}
      </div>

      {selecionado && (
        <>
          <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: 12, margin: '0 0 8px' }}>Duração</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {DURACAO_OPCOES.map(d => (
              <button
                key={d.horas}
                onClick={() => setDuracao(d.horas)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  border: duracao === d.horas ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  background: duracao === d.horas ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.03)',
                  color: duracao === d.horas ? '#F43F5E' : 'rgba(248,249,250,0.50)',
                  fontSize: 12, fontWeight: duracao === d.horas ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      <BotaoSalvar loading={saving} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}
