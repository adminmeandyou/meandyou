'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAppHeader } from '@/contexts/AppHeaderContext'
import { Lock, Trophy } from 'lucide-react'

interface Badge {
  id: string
  icon: string
  icon_url?: string | null
  name: string
  description: string
  rarity: 'comum' | 'incomum' | 'raro' | 'lendario'
  condition_type: string
  condition_value: any
}

interface UserBadge {
  badge_id: string
}

const RARITY_CONFIG = {
  comum:    { label: 'Comum',    color: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)' },
  incomum:  { label: 'Incomum',  color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)'  },
  raro:     { label: 'Raro',     color: '#a855f7', bg: 'rgba(168,85,247,0.10)',   border: 'rgba(168,85,247,0.25)'  },
  lendario: { label: 'Lendario', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)'  },
}

const CONDITION_LABELS: Record<string, (val: number) => string> = {
  manual:               () => 'Concedido pela equipe',
  on_verify:            () => 'Verificar identidade biometrica',
  on_join:              () => 'Criar conta no app',
  invited_gte:          (v) => `Convidar ${v} amigo${v > 1 ? 's' : ''}`,
  matches_gte:          (v) => `Conseguir ${v} match${v > 1 ? 'es' : ''}`,
  messages_sent_gte:    (v) => `Enviar ${v} mensagem${v > 1 ? 'ns' : ''}`,
  messages_received_gte:(v) => `Receber ${v} mensagem${v > 1 ? 'ns' : ''}`,
  messages_total_gte:   (v) => `Trocar ${v} mensagem${v > 1 ? 'ns' : ''}`,
  likes_received_gte:   (v) => `Receber ${v} curtida${v > 1 ? 's' : ''}`,
  likes_sent_gte:       (v) => `Enviar ${v} curtida${v > 1 ? 's' : ''}`,
  streak_gte:           (v) => `Streak de ${v} dias seguidos`,
  streak_longest_gte:   (v) => `Maior streak de ${v} dias`,
  video_calls_gte:      (v) => `Realizar ${v} videochamada${v > 1 ? 's' : ''}`,
  video_minutes_gte:    (v) => `${v} minutos em videochamadas`,
  photos_gte:           (v) => `Ter ${v}+ fotos no perfil`,
  plan_active:          () => 'Ter plano Plus ou Black ativo',
  plan_black:           () => 'Ter plano Black ativo',
  store_purchase:       () => 'Fazer pelo menos 1 compra na loja',
  store_spent_gte:      (v) => `Gastar ${v}+ fichas na loja`,
  store_item:           () => 'Comprar item especifico na loja',
  early_adopter:        () => 'Pioneiro — entrou cedo no app',
  profile_complete:     () => 'Completar 100% do perfil',
  took_bolo:            () => 'Relatar um bolo recebido',
}

function getConditionLabel(condition_type: string, condition_value: any): string {
  const val = condition_value?.count ?? 0
  const fn = CONDITION_LABELS[condition_type]
  return fn ? fn(val) : condition_type
}

export default function EmblemasPage() {
  const { user } = useAuth()
  const { setBackHref, setPageTitle } = useAppHeader()

  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadgeIds, setUserBadgeIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedRarity, setSelectedRarity] = useState<string>('todos')
  const [selected, setSelected] = useState<Badge | null>(null)

  useEffect(() => {
    setBackHref('/perfil')
    setPageTitle('Emblemas')
    return () => { setBackHref(null); setPageTitle(null) }
  }, [setBackHref, setPageTitle])

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: badgesData }, { data: userBadgesData }] = await Promise.all([
      supabase.from('badges').select('*').eq('is_active', true).eq('is_published', true).order('rarity'),
      user ? supabase.from('user_badges').select('badge_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ])
    setBadges(badgesData ?? [])
    setUserBadgeIds(new Set((userBadgesData ?? []).map((b: UserBadge) => b.badge_id)))
    setLoading(false)
  }

  const rarities = ['todos', 'comum', 'incomum', 'raro', 'lendario']
  const filtered = selectedRarity === 'todos' ? badges : badges.filter(b => b.rarity === selectedRarity)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header interno (desktop) */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }} className="hidden md:block">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0 }}>Vitrine de Emblemas</h1>
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>Colecione emblemas cumprindo conquistas no app</p>
      </header>

      <div style={{ padding: '20px' }}>

        {/* Intro */}
        <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: 16, padding: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={20} color="#F59E0B" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Colecione todos os emblemas</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
              {loading ? '...' : `${userBadgeIds.size} de ${badges.length} desbloqueados`}
            </p>
          </div>
        </div>

        {/* Filtro de raridade */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4, scrollbarWidth: 'none' }}>
          {rarities.map(r => {
            const cfg = r !== 'todos' ? RARITY_CONFIG[r as keyof typeof RARITY_CONFIG] : null
            const active = selectedRarity === r
            return (
              <button
                key={r}
                onClick={() => setSelectedRarity(r)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 100,
                  border: active ? `1px solid ${cfg?.color ?? 'var(--accent)'}` : '1px solid var(--border)',
                  backgroundColor: active ? (cfg?.bg ?? 'var(--accent-light)') : 'transparent',
                  color: active ? (cfg?.color ?? 'var(--accent)') : 'var(--muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                  textTransform: 'capitalize',
                }}
              >
                {r === 'lendario' ? 'Lendario' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ui-skeleton" style={{ height: 120, borderRadius: 16 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
            <Trophy size={32} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>Nenhum emblema nesta categoria ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filtered.map(badge => {
              const cfg = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.comum
              const unlocked = userBadgeIds.has(badge.id)
              return (
                <div
                  key={badge.id}
                  onClick={() => setSelected(badge)}
                  style={{
                    borderRadius: 16, padding: 16, cursor: 'pointer',
                    border: unlocked ? `1px solid ${cfg.border}` : '1px solid var(--border)',
                    backgroundColor: unlocked ? cfg.bg : 'var(--bg-card)',
                    opacity: unlocked ? 1 : 0.6,
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
                    position: 'relative',
                  }}
                >
                  {!unlocked && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <Lock size={12} color="var(--muted-2)" strokeWidth={1.5} />
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, marginBottom: 8, filter: unlocked ? 'none' : 'grayscale(1)', lineHeight: 1 }}>
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 36 }}>{badge.icon}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: unlocked ? 'var(--text)' : 'var(--muted)', margin: '0 0 4px' }}>
                    {badge.name}
                  </p>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: cfg.color, backgroundColor: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 100, padding: '2px 8px',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430, zIndex: 201,
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '24px 24px 0 0',
            padding: '24px 24px 48px',
            border: '1px solid rgba(255,255,255,0.06)',
            animation: 'ui-slide-up 0.3s ease',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                {selected.icon_url ? (
                  <img src={selected.icon_url} alt={selected.name} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 56, lineHeight: 1 }}>{selected.icon}</span>
                )}
              </div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>{selected.name}</h2>
              {(() => {
                const cfg = RARITY_CONFIG[selected.rarity] ?? RARITY_CONFIG.comum
                return (
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cfg.label}
                  </span>
                )
              })()}
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              {selected.description}
            </p>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={15} color="var(--muted)" strokeWidth={1.5} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: 0 }}>Como ganhar</p>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: '2px 0 0', fontWeight: 500 }}>
                  {getConditionLabel(selected.condition_type, selected.condition_value)}
                </p>
              </div>
            </div>
            {userBadgeIds.has(selected.id) && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#10b981', marginTop: 16 }}>
                Voce ja possui este emblema!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
