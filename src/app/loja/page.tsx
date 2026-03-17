'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import {
  Star, Zap, ArrowLeft, CheckCircle, Loader2, ShoppingBag,
  Search, RotateCcw, Ticket, Plus, Ghost, Eye,
} from 'lucide-react'
import { StoreBottomSheet, type StoreItemType } from '@/components/StoreBottomSheet'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

const ITEMS: {
  type: StoreItemType
  label: string
  description: string
  icon: React.ReactNode
  accentColor: string
  accentBg: string
  accentBorder: string
}[] = [
  {
    type: 'superlike',
    label: 'SuperLikes',
    description: 'Se destaque para quem você mais quer',
    icon: <Star size={20} strokeWidth={1.5} />,
    accentColor: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.10)',
    accentBorder: 'rgba(245,158,11,0.25)',
  },
  {
    type: 'boost',
    label: 'Boosts',
    description: '30 min em destaque na sua região',
    icon: <Zap size={20} strokeWidth={1.5} />,
    accentColor: '#E11D48',
    accentBg: 'rgba(225,29,72,0.10)',
    accentBorder: 'rgba(225,29,72,0.25)',
  },
  {
    type: 'lupa',
    label: 'Lupas',
    description: 'Revele perfis borrados na aba Destaque',
    icon: <Search size={20} strokeWidth={1.5} />,
    accentColor: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.25)',
  },
  {
    type: 'rewind',
    label: 'Desfazer Curtida',
    description: 'Volte atrás em perfis que passou',
    icon: <RotateCcw size={20} strokeWidth={1.5} />,
    accentColor: '#a855f7',
    accentBg: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.25)',
  },
  {
    type: 'ghost',
    label: 'Modo Fantasma',
    description: 'Some das buscas por 7 dias',
    icon: <Ghost size={20} strokeWidth={1.5} />,
    accentColor: '#6b7280',
    accentBg: 'rgba(107,114,128,0.10)',
    accentBorder: 'rgba(107,114,128,0.25)',
  },
]

export default function LojaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [superlikes, setSuperlikes]             = useState(0)
  const [boosts, setBoosts]                     = useState(0)
  const [lupas, setLupas]                       = useState(0)
  const [rewinds, setRewinds]                   = useState(0)
  const [tickets, setTickets]                   = useState(0)
  const [boostActiveUntil, setBoostActiveUntil] = useState<string | null>(null)
  const [ghostModeUntil, setGhostModeUntil]     = useState<string | null>(null)
  const [activating, setActivating]             = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [openSheet, setOpenSheet]               = useState<StoreItemType | null>(null)

  useEffect(() => {
    if (!user) return
    loadBalance()
  }, [user])

  async function loadBalance() {
    const [{ data: sl }, { data: bo }, { data: lp }, { data: rw }, { data: tk }, { data: gh }] =
      await Promise.all([
        supabase.from('user_superlikes').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user!.id).single(),
        supabase.from('user_lupas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_rewinds').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
        supabase.from('profiles').select('ghost_mode_until').eq('id', user!.id).single(),
      ])

    setSuperlikes(sl?.amount ?? 0)
    setBoosts(bo?.amount ?? 0)
    setBoostActiveUntil(bo?.active_until ?? null)
    setLupas(lp?.amount ?? 0)
    setRewinds(rw?.amount ?? 0)
    setTickets(tk?.amount ?? 0)
    setGhostModeUntil(gh?.ghost_mode_until ?? null)
    setLoading(false)

    if (bo?.active_until) {
      const expiredAt = new Date(bo.active_until)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      if (expiredAt < new Date() && expiredAt > twoHoursAgo) {
        const notifyKey = `boost_expired_${bo.active_until}`
        if (!sessionStorage.getItem(notifyKey)) {
          sessionStorage.setItem(notifyKey, '1')
          const { data: { session } } = await supabase.auth.getSession()
          fetch('/api/boosts/notify-expired', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
          }).catch(() => {})
        }
      }
    }
  }

  async function handleActivateBoost() {
    haptics.medium()
    setActivating(true)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/boosts/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
    })
    const data = await res.json()

    if (data?.success) {
      haptics.success()
      toast.success('Boost ativado! Perfil em destaque por 30 minutos.')
      setBoostActiveUntil(data.active_until)
      setBoosts((b) => b - 1)
    } else if (data?.reason === 'no_boosts') {
      toast.error('Você não tem Boosts disponíveis.')
    } else if (data?.reason === 'already_active') {
      toast.info('Você já tem um Boost ativo!')
    } else if (data?.reason === 'max_simultaneous') {
      toast.error('Limite de 2 Boosts simultâneos atingido.')
    }
    setActivating(false)
  }

  const boostIsActive = boostActiveUntil && new Date(boostActiveUntil) > new Date()
  const ghostIsActive = ghostModeUntil && new Date(ghostModeUntil) > new Date()
  const ghostDaysLeft = ghostIsActive
    ? Math.ceil((new Date(ghostModeUntil!).getTime() - Date.now()) / 86400000)
    : 0

  const balanceByType: Record<StoreItemType, number> = {
    superlike: superlikes,
    boost: boosts,
    lupa: lupas,
    rewind: rewinds,
    ghost: ghostDaysLeft,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={17} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Loja</h1>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, marginTop: '2px' }}>Itens e recursos extras</p>
          </div>
        </div>
        {/* Saldo de tickets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Ticket size={13} color="#F59E0B" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>{loading ? '…' : tickets}</span>
          <span style={{ fontSize: '11px', color: 'rgba(245,158,11,0.6)' }}>tickets</span>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Saldo resumido */}
        {!loading && (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Seu saldo</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <BalanceItem icon={<Star size={16} strokeWidth={1.5} color="#F59E0B" />} label="SuperLikes" value={superlikes} />
              <BalanceItem icon={<Zap size={16} strokeWidth={1.5} color="var(--accent)" />} label="Boosts" value={boosts} active={!!boostIsActive} />
              <BalanceItem icon={<Search size={16} strokeWidth={1.5} color="#3b82f6" />} label="Lupas" value={lupas} />
              <BalanceItem icon={<RotateCcw size={16} strokeWidth={1.5} color="#a855f7" />} label="Rewinds" value={rewinds} />
              <BalanceItem icon={<Ticket size={16} strokeWidth={1.5} color="#F59E0B" />} label="Tickets" value={tickets} />
              <BalanceItem icon={<Ghost size={16} strokeWidth={1.5} color="#6b7280" />} label="Fantasma" value={ghostDaysLeft} suffix="d" active={!!ghostIsActive} />
            </div>
          </div>
        )}

        {/* Boost ativo ou botão de ativar */}
        {boostIsActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '14px', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
            <CheckCircle size={18} color="var(--accent)" strokeWidth={1.5} />
            <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '600' }}>Boost ativo — perfil em destaque agora!</span>
          </div>
        ) : boosts > 0 && (
          <button
            onClick={handleActivateBoost}
            disabled={activating}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: '14px', fontWeight: '700', cursor: activating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-jakarta)', opacity: activating ? 0.6 : 1, transition: 'opacity 0.2s' }}
          >
            {activating ? <Loader2 size={16} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={16} strokeWidth={1.5} />}
            Ativar Boost agora
          </button>
        )}

        {/* Itens da loja */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Comprar itens</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ITEMS.map((item) => {
              const balance = balanceByType[item.type]
              const suffix = item.type === 'ghost' ? 'd' : undefined
              return (
                <div
                  key={item.type}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {/* Ícone */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.accentColor }}>
                    {item.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', margin: 0, marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(248,249,250,0.35)', margin: 0, marginTop: '3px' }}>
                      Saldo: <span style={{ color: 'rgba(248,249,250,0.7)', fontWeight: '600' }}>{balance}{suffix ?? ''}</span>
                    </p>
                  </div>

                  {/* Botão comprar */}
                  <button
                    onClick={() => { haptics.tap(); setOpenSheet(item.type) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-jakarta)', transition: 'all 0.15s' }}
                  >
                    <Plus size={13} strokeWidth={2} />
                    Comprar
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.20)', paddingBottom: '8px' }}>
          Compras processadas pela Cakto. Pagamento único, sem reembolso.
        </p>
      </div>

      {openSheet && (
        <StoreBottomSheet
          type={openSheet}
          onClose={() => setOpenSheet(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function BalanceItem({ icon, label, value, active, suffix }: {
  icon: React.ReactNode
  label: string
  value: number
  active?: boolean
  suffix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', borderRadius: '12px', backgroundColor: active ? 'var(--accent-light)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'var(--accent-border)' : 'rgba(255,255,255,0.05)'}` }}>
      <div style={{ marginBottom: '6px' }}>{icon}</div>
      <p style={{ fontSize: '16px', fontWeight: '800', color: active ? 'var(--accent)' : 'var(--text)', margin: 0, lineHeight: 1 }}>
        {value}{suffix && <span style={{ fontSize: '11px', fontWeight: '400', marginLeft: '1px' }}>{suffix}</span>}
      </p>
      <p style={{ fontSize: '10px', color: 'var(--muted)', margin: 0, marginTop: '3px', textAlign: 'center', lineHeight: 1.2 }}>{label}</p>
    </div>
  )
}
