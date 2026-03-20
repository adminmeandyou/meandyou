'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Plus, Search, Edit2, Trash2, Award, Users, CheckCircle, XCircle,
  Zap, Upload, X, ImageIcon, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RARIDADES = ['comum', 'incomum', 'raro', 'lendario']
const RARIDADE_CORES: Record<string, string> = {
  comum: '#9ca3af', incomum: '#34d399', raro: '#60a5fa', lendario: '#f59e0b',
}

const STORE_ITEMS = [
  { value: 'superlike_1',         label: '1x SuperLike' },
  { value: 'superlike_5',         label: '5x SuperLike' },
  { value: 'boost_1',             label: '1x Boost' },
  { value: 'boost_5',             label: '5x Boost' },
  { value: 'lupa_1',              label: '1x Lupa' },
  { value: 'lupa_5',              label: '5x Lupa' },
  { value: 'rewind_1',            label: '1x Desfazer' },
  { value: 'rewind_5',            label: '5x Desfazer' },
  { value: 'ghost_7d',            label: 'Fantasma 7 dias' },
  { value: 'ghost_35d',           label: 'Fantasma 35 dias' },
  { value: 'ver_quem_curtiu',     label: 'Ver quem curtiu (24h)' },
  { value: 'bonus_xp_3d',         label: 'Bônus XP 3 dias' },
  { value: 'selo_verificado_plus',label: 'Selo Verificado Plus' },
  { value: 'caixa_surpresa',      label: 'Caixa Surpresa' },
]

interface ConditionType {
  value: string
  label: string
  group: string
  hasCount: boolean
  countLabel?: string
  hasDate: boolean
  hasItem: boolean
}

const CONDITION_TYPES: ConditionType[] = [
  // Básico
  { value: 'manual',             label: 'Manual (admin concede)',                        group: 'Básico',        hasCount: false, hasDate: false, hasItem: false },
  { value: 'on_join',            label: 'Ao criar conta',                                group: 'Básico',        hasCount: false, hasDate: false, hasItem: false },
  { value: 'on_verify',          label: 'Ao verificar identidade',                       group: 'Básico',        hasCount: false, hasDate: false, hasItem: false },
  { value: 'profile_complete',   label: 'Perfil 100% completo (foto + bio)',             group: 'Básico',        hasCount: false, hasDate: false, hasItem: false },
  { value: 'early_adopter',      label: 'Pioneiro — entrou antes de uma data',           group: 'Básico',        hasCount: false, hasDate: true,  hasItem: false },
  // Curtidas
  { value: 'likes_received_gte', label: 'Recebeu X+ curtidas',                           group: 'Curtidas',      hasCount: true,  countLabel: 'Curtidas recebidas (mínimo)', hasDate: false, hasItem: false },
  { value: 'likes_sent_gte',     label: 'Enviou X+ curtidas',                            group: 'Curtidas',      hasCount: true,  countLabel: 'Curtidas enviadas (mínimo)',  hasDate: false, hasItem: false },
  // Mensagens
  { value: 'messages_sent_gte',     label: 'Enviou X+ mensagens',                        group: 'Mensagens',     hasCount: true,  countLabel: 'Mensagens enviadas (mínimo)',        hasDate: false, hasItem: false },
  { value: 'messages_received_gte', label: 'Recebeu X+ mensagens',                       group: 'Mensagens',     hasCount: true,  countLabel: 'Mensagens recebidas (mínimo)',       hasDate: false, hasItem: false },
  { value: 'messages_total_gte',    label: 'Total de X+ mensagens (enviou + recebeu)',   group: 'Mensagens',     hasCount: true,  countLabel: 'Total de mensagens (mínimo)',        hasDate: false, hasItem: false },
  // Matches
  { value: 'matches_gte',        label: 'Fez X+ matches',                                group: 'Matches',       hasCount: true,  countLabel: 'Matches (mínimo)', hasDate: false, hasItem: false },
  // Indicações
  { value: 'invited_gte',        label: 'Indicou X+ amigos',                             group: 'Indicações',    hasCount: true,  countLabel: 'Amigos indicados (mínimo)', hasDate: false, hasItem: false },
  // Streak
  { value: 'streak_gte',         label: 'Streak atual de X+ dias seguidos',              group: 'Streak',        hasCount: true,  countLabel: 'Dias seguidos (mínimo)', hasDate: false, hasItem: false },
  { value: 'streak_longest_gte', label: 'Maior streak de X+ dias (histórico)',           group: 'Streak',        hasCount: true,  countLabel: 'Maior streak (mínimo)', hasDate: false, hasItem: false },
  // Videochamada
  { value: 'video_calls_gte',    label: 'Realizou X+ videochamadas',                     group: 'Videochamada',  hasCount: true,  countLabel: 'Videochamadas (mínimo)', hasDate: false, hasItem: false },
  { value: 'video_minutes_gte',  label: 'X+ minutos em videochamadas',                   group: 'Videochamada',  hasCount: true,  countLabel: 'Minutos (mínimo)', hasDate: false, hasItem: false },
  // Loja
  { value: 'store_purchase',     label: 'Fez pelo menos 1 compra na loja',               group: 'Loja',          hasCount: false, hasDate: false, hasItem: false },
  { value: 'store_spent_gte',    label: 'Gastou X+ fichas na loja',                      group: 'Loja',          hasCount: true,  countLabel: 'Fichas gastas (mínimo)', hasDate: false, hasItem: false },
  { value: 'store_item',         label: 'Comprou item específico na loja',               group: 'Loja',          hasCount: false, hasDate: false, hasItem: true  },
  // Perfil
  { value: 'photos_gte',         label: 'Tem X+ fotos no perfil',                        group: 'Perfil',        hasCount: true,  countLabel: 'Fotos (mínimo)', hasDate: false, hasItem: false },
  // Plano
  { value: 'plan_active',        label: 'Tem plano Plus ou Black ativo',                 group: 'Plano',         hasCount: false, hasDate: false, hasItem: false },
  { value: 'plan_black',         label: 'Tem plano Black ativo',                         group: 'Plano',         hasCount: false, hasDate: false, hasItem: false },
  // Outros
  { value: 'meetup_scheduled',   label: 'Marcou X+ encontros',                           group: 'Outros',        hasCount: true,  countLabel: 'Encontros (mínimo)', hasDate: false, hasItem: false },
  { value: 'took_bolo',          label: 'Reportou ser deixado para trás (bolo)',         group: 'Outros',        hasCount: false, hasDate: false, hasItem: false },
]

const CONDITION_GROUPS = [...new Set(CONDITION_TYPES.map(c => c.group))]

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  icon_url?: string | null
  rarity: string
  requirement_description: string | null
  condition_type: string
  condition_value: any
  condition_extra: any
  user_cohort: string
  is_active: boolean
  is_published: boolean
  created_at: string
  user_count?: number
}

type BadgeForm = Omit<Badge, 'id' | 'created_at' | 'user_count'>

const EMPTY_FORM: BadgeForm = {
  name: '', description: '', icon: '🏆', icon_url: null, rarity: 'comum',
  requirement_description: '', condition_type: 'manual',
  condition_value: null, condition_extra: {}, user_cohort: 'all',
  is_active: true, is_published: false,
}

const S = {
  card: { backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '16px' } as React.CSSProperties,
  label: { fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '6px', display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  input: { width: '100%', padding: '9px 12px', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
  section: { marginBottom: '18px' } as React.CSSProperties,
  groupLabel: { fontSize: '10px', color: '#444', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '4px 0 2px', pointerEvents: 'none' as const },
}

export default function AdminEmblemas() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroRaridade, setFiltroRaridade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState<'criar' | 'editar' | null>(null)
  const [form, setForm] = useState<BadgeForm>(EMPTY_FORM)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [aplicando, setAplicando] = useState<string | null>(null)
  const [aplicarResultado, setAplicarResultado] = useState<Record<string, number>>({})
  const [confirmarDelete, setConfirmarDelete] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadBadges() }, [])

  async function loadBadges() {
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*')
      .order('created_at', { ascending: true })
    setBadges(data ?? [])
    setLoading(false)
  }

  const filtrados = badges.filter(b => {
    if (busca && !b.name.toLowerCase().includes(busca.toLowerCase())) return false
    if (filtroRaridade && b.rarity !== filtroRaridade) return false
    if (filtroStatus === 'ativo' && !b.is_active) return false
    if (filtroStatus === 'inativo' && b.is_active) return false
    if (filtroStatus === 'publicado' && !b.is_published) return false
    return true
  })

  function getConditionMeta(value: string) {
    return CONDITION_TYPES.find(c => c.value === value)
  }

  function abrirCriar() {
    setForm(EMPTY_FORM)
    setPreviewUrl(null)
    setEditandoId(null)
    setModal('criar')
  }

  function abrirEditar(b: Badge) {
    setForm({
      name: b.name, description: b.description, icon: b.icon, icon_url: b.icon_url ?? null,
      rarity: b.rarity, requirement_description: b.requirement_description ?? '',
      condition_type: b.condition_type, condition_value: b.condition_value,
      condition_extra: b.condition_extra ?? {}, user_cohort: b.user_cohort ?? 'all',
      is_active: b.is_active, is_published: b.is_published,
    })
    setPreviewUrl(b.icon_url ?? null)
    setEditandoId(b.id)
    setModal('editar')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    // Resize client-side to 72x72 using canvas
    const canvas = document.createElement('canvas')
    canvas.width = 72
    canvas.height = 72
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.onload = async () => {
      // Center-crop to square then draw at 72x72
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 72, 72)

      canvas.toBlob(async (blob) => {
        if (!blob) { setUploadingImage(false); return }
        const fd = new FormData()
        fd.append('image', blob, 'badge.jpg')
        const res = await fetch('/api/badges/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) {
          setForm(p => ({ ...p, icon_url: json.url }))
          setPreviewUrl(json.url)
        } else {
          alert('Erro ao fazer upload: ' + (json.error ?? 'desconhecido'))
        }
        setUploadingImage(false)
      }, 'image/jpeg', 0.88)

      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  async function salvar() {
    if (!form.name.trim()) return
    setSalvando(true)

    // Build condition_value from UI state
    const meta = getConditionMeta(form.condition_type)
    const conditionValue = form.condition_value
    const conditionExtra = form.condition_extra ?? {}

    const payload = {
      ...form,
      condition_value: conditionValue,
      condition_extra: conditionExtra,
      icon_url: form.icon_url || null,
    }

    if (modal === 'criar') {
      await supabase.from('badges').insert(payload)
    } else if (editandoId) {
      await supabase.from('badges').update(payload).eq('id', editandoId)
    }

    setSalvando(false)
    setModal(null)
    loadBadges()
  }

  async function deletar(id: string) {
    await supabase.from('user_badges').delete().eq('badge_id', id)
    await supabase.from('badges').delete().eq('id', id)
    setConfirmarDelete(null)
    loadBadges()
  }

  async function togglePublicado(b: Badge) {
    await supabase.from('badges').update({ is_published: !b.is_published }).eq('id', b.id)
    loadBadges()
  }

  async function toggleAtivo(b: Badge) {
    await supabase.from('badges').update({ is_active: !b.is_active }).eq('id', b.id)
    loadBadges()
  }

  async function aplicarAgora(b: Badge) {
    setAplicando(b.id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/badges/auto-award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ badgeId: b.id }),
    })
    const json = await res.json()
    setAplicarResultado(prev => ({ ...prev, [b.id]: json.awarded ?? 0 }))
    setAplicando(null)
    loadBadges()
  }

  const condMeta = getConditionMeta(form.condition_type)

  // Group options for select
  const groupedOptions = CONDITION_GROUPS.map(group => ({
    group,
    options: CONDITION_TYPES.filter(c => c.group === group),
  }))

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: '#fff', margin: '0 0 4px' }}>Emblemas</h1>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>{badges.length} emblemas cadastrados — apenas os existentes no banco são exibidos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadBadges} style={{ padding: '9px 14px', backgroundColor: 'transparent', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button onClick={abrirCriar} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#e11d48', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            <Plus size={16} /> Novo emblema
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={14} color="#555" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..." style={{ ...S.input, paddingLeft: '32px' }} />
        </div>
        <select value={filtroRaridade} onChange={e => setFiltroRaridade(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="">Todas raridades</option>
          {RARIDADES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="publicado">Publicados</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#444' }}>
          <Award size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>Nenhum emblema encontrado. {badges.length === 0 && 'Execute migration_badges_painel.sql para criar os emblemas iniciais.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtrados.map((b) => {
            const globalIdx = badges.findIndex(x => x.id === b.id)
            const condLabel = CONDITION_TYPES.find(c => c.value === b.condition_type)?.label ?? b.condition_type
            const awarded = aplicarResultado[b.id]
            return (
              <div key={b.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Numero sequencial */}
                <span style={{ fontSize: '11px', color: '#333', fontWeight: 700, minWidth: 24, textAlign: 'right' }}>#{globalIdx + 1}</span>

                {/* Icone */}
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2a2a2a' }}>
                  {b.icon_url
                    ? <img src={b.icon_url} alt={b.name} style={{ width: 44, height: 44, objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>{b.icon}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{b.name}</span>
                    <span style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, backgroundColor: RARIDADE_CORES[b.rarity] + '20', color: RARIDADE_CORES[b.rarity] }}>
                      {b.rarity}
                    </span>
                    {b.is_published && <span style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, backgroundColor: '#10b98120', color: '#10b981' }}>publicado</span>}
                    {!b.is_active && <span style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, backgroundColor: '#f8717120', color: '#f87171' }}>inativo</span>}
                    {b.user_cohort && b.user_cohort !== 'all' && (
                      <span style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, backgroundColor: '#7c3aed20', color: '#a78bfa' }}>
                        {b.user_cohort === 'new' ? 'Só novos' : 'Só antigos'}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#555', fontSize: '12px', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#444', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} /> {b.user_count ?? '—'} usuários</span>
                    <span style={{ color: '#333' }}>&#x25B8; {condLabel}</span>
                    {b.condition_value?.count != null && <span style={{ color: '#333' }}>min: {b.condition_value.count}</span>}
                    {b.condition_value?.item && <span style={{ color: '#333' }}>item: {b.condition_value.item}</span>}
                    {awarded != null && <span style={{ color: '#10b981', fontWeight: 700 }}>+{awarded} concedidos agora</span>}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <button onClick={() => aplicarAgora(b)} title="Aplicar agora para todos que atendem a condição"
                    style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: aplicando === b.id ? '#1a1a1a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    {aplicando === b.id
                      ? <div style={{ width: '12px', height: '12px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <Zap size={13} />}
                    {aplicando !== b.id && 'Aplicar'}
                  </button>
                  <button onClick={() => togglePublicado(b)} title={b.is_published ? 'Ocultar dos usuários' : 'Publicar para usuários'}
                    style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {b.is_published ? <XCircle size={14} color="#f87171" /> : <CheckCircle size={14} color="#10b981" />}
                  </button>
                  <button onClick={() => toggleAtivo(b)} title={b.is_active ? 'Desativar' : 'Ativar'}
                    style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 11, color: b.is_active ? '#34d399' : '#f87171' }}>
                    {b.is_active ? '●' : '○'}
                  </button>
                  <button onClick={() => abrirEditar(b)}
                    style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Edit2 size={14} color="#aaa" />
                  </button>
                  <button onClick={() => setConfirmarDelete(b.id)}
                    style={{ padding: '7px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} color="#f87171" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.80)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '18px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: 0 }}>
                {modal === 'criar' ? 'Novo emblema' : 'Editar emblema'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Imagem + emoji */}
            <div style={S.section}>
              <label style={S.label}>Imagem do emblema</label>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
                {/* Preview */}
                <div style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  {previewUrl
                    ? <img src={previewUrl} alt="preview" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32 }}>{form.icon || '🏆'}</span>
                  }
                  {previewUrl && (
                    <button onClick={() => { setPreviewUrl(null); setForm(p => ({ ...p, icon_url: null })) }}
                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#e11d48', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <X size={10} color="#fff" />
                    </button>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                    style={{ width: '100%', padding: '9px 14px', backgroundColor: '#1a1a1a', border: '1px dashed #333', borderRadius: 8, color: uploadingImage ? '#555' : '#aaa', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {uploadingImage
                      ? <><div style={{ width: 14, height: 14, border: '2px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                      : <><Upload size={14} /> Fazer upload (JPG/PNG)</>}
                  </button>
                  <p style={{ fontSize: 11, color: '#444', margin: '5px 0 0' }}>Qualquer tamanho — será cortado e redimensionado para 72x72 px automaticamente</p>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>

                {/* Emoji fallback */}
                <div style={{ width: 60 }}>
                  <label style={{ ...S.label, marginBottom: 4 }}>Emoji</label>
                  <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                    style={{ ...S.input, width: 54, fontSize: 22, textAlign: 'center', padding: '6px' }} maxLength={2} />
                </div>
              </div>
            </div>

            {/* Nome + raridade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, ...S.section }}>
              <div>
                <label style={S.label}>Nome / Título</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pioneiro" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Raridade</label>
                <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))} style={{ ...S.input, width: 120 }}>
                  {RARIDADES.map(r => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div style={S.section}>
              <label style={S.label}>Descrição (interna)</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Usuário que entrou no app durante o lançamento" rows={2}
                style={{ ...S.input, resize: 'vertical' }} />
            </div>

            {/* Requisito público */}
            <div style={S.section}>
              <label style={S.label}>Requisito visível ao usuário</label>
              <input value={form.requirement_description ?? ''} onChange={e => setForm(p => ({ ...p, requirement_description: e.target.value }))}
                placeholder="Ex: Entrar no app durante o período de lançamento" style={S.input} />
            </div>

            {/* Condição */}
            <div style={S.section}>
              <label style={S.label}>Condição de concessão automática</label>
              <select value={form.condition_type}
                onChange={e => setForm(p => ({ ...p, condition_type: e.target.value, condition_value: null, condition_extra: {} }))}
                style={S.input}>
                {groupedOptions.map(({ group, options }) => (
                  <optgroup key={group} label={group}>
                    {options.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Quantidade mínima (se aplicável) */}
            {condMeta?.hasCount && (
              <div style={S.section}>
                <label style={S.label}>{condMeta.countLabel ?? 'Quantidade mínima'}</label>
                <input type="number" min={1}
                  value={form.condition_value?.count ?? ''}
                  onChange={e => setForm(p => ({ ...p, condition_value: { ...p.condition_value, count: parseInt(e.target.value) || 1 } }))}
                  style={{ ...S.input, width: 140 }} />
              </div>
            )}

            {/* Item da loja (se store_item) */}
            {condMeta?.hasItem && (
              <div style={S.section}>
                <label style={S.label}>Item da loja</label>
                <select value={form.condition_value?.item ?? ''}
                  onChange={e => setForm(p => ({ ...p, condition_value: { item: e.target.value } }))}
                  style={S.input}>
                  <option value="">Selecione um item...</option>
                  {STORE_ITEMS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>
            )}

            {/* Data de referência (se early_adopter) */}
            {condMeta?.hasDate && (
              <div style={S.section}>
                <label style={S.label}>Data de referência (pioneiro = entrou ANTES desta data)</label>
                <input type="date"
                  value={form.condition_extra?.reference_date ?? ''}
                  onChange={e => setForm(p => ({ ...p, condition_extra: { ...p.condition_extra, reference_date: e.target.value } }))}
                  style={{ ...S.input, width: 180 }} />
              </div>
            )}

            {/* Coorte de usuários */}
            <div style={S.section}>
              <label style={S.label}>Aplicar para</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'all', label: 'Todos os usuários' },
                  { value: 'new', label: 'Só novos (após uma data)' },
                  { value: 'old', label: 'Só antigos (antes de uma data)' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(p => ({ ...p, user_cohort: opt.value }))}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid ' + (form.user_cohort === opt.value ? '#e11d48' : '#2a2a2a'), backgroundColor: form.user_cohort === opt.value ? 'rgba(225,29,72,0.12)' : 'transparent', color: form.user_cohort === opt.value ? '#e11d48' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: form.user_cohort === opt.value ? 700 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.user_cohort !== 'all' && (
                <div style={{ marginTop: 10 }}>
                  <label style={S.label}>Data de referência do coorte</label>
                  <input type="date"
                    value={form.condition_extra?.reference_date ?? ''}
                    onChange={e => setForm(p => ({ ...p, condition_extra: { ...p.condition_extra, reference_date: e.target.value } }))}
                    style={{ ...S.input, width: 180 }} />
                </div>
              )}
            </div>

            {/* Ativo + Publicado */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#aaa', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                Ativo (pode ser concedido)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#aaa', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                Publicado (visível aos usuários)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #333', backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.name.trim()}
                style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: salvando || !form.name.trim() ? '#333' : '#e11d48', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: salvando || !form.name.trim() ? 'not-allowed' : 'pointer' }}>
                {salvando ? 'Salvando...' : modal === 'criar' ? 'Criar emblema' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar delete */}
      {confirmarDelete && (
        <div onClick={() => setConfirmarDelete(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.80)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ color: '#fff', fontFamily: 'var(--font-fraunces)', marginBottom: 8, fontSize: 18 }}>Excluir emblema?</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>Esta ação remove o emblema de todos os usuários que o possuem e não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => deletar(confirmarDelete)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f87171', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
