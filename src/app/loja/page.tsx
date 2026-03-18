'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import {
  Star, Zap, ArrowLeft, CheckCircle, Loader2, ShoppingBag,
  Search, RotateCcw, Coins, Plus, Ghost, Eye, Gift, BadgeCheck,
  TrendingUp, X, Package, ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

// ─── Pacotes de fichas (compra via Cakto) ─────────────────────────────────
// ATENÇÃO: substitua as URLs pelos links reais da Cakto após criar os produtos
const FICHAS_PACKAGES = [
  { label: '500 fichas',    price: 'R$ 7,97',   url: 'https://pay.cakto.com.br/fichas_500',   highlight: false },
  { label: '1.500 fichas',  price: 'R$ 19,97',  url: 'https://pay.cakto.com.br/fichas_1500',  highlight: true  },
  { label: '4.000 fichas',  price: 'R$ 44,97',  url: 'https://pay.cakto.com.br/fichas_4000',  highlight: false },
  { label: '10.000 fichas', price: 'R$ 99,97',  url: 'https://pay.cakto.com.br/fichas_10000', highlight: false },
]

// Preço fixo — igual para todos os planos
function applyDiscount(base: number, _plan: string | null): number {
  return base
}

// ─── Itens compraveis com fichas ──────────────────────────────────────────
type ItemKey =
  | 'superlike_1' | 'superlike_5'
  | 'boost_1' | 'boost_5'
  | 'lupa_1' | 'lupa_5'
  | 'rewind_1' | 'rewind_5'
  | 'ghost_7d' | 'ghost_35d'
  | 'reveals_24h' | 'xp_bonus_3d' | 'verified_plus' | 'caixa_surpresa'

interface StoreItem {
  key: ItemKey
  label: string
  description: string
  icon: React.ReactNode
  baseFichas: number   // preco base (Essencial)
  accentColor: string
  accentBg: string
  accentBorder: string
  balanceKey?: string
  new?: boolean
}

const STORE_ITEMS: StoreItem[] = [
  {
    key: 'superlike_1', label: '1 SuperLike', description: 'Se destaque para quem você mais quer',
    icon: <Star size={20} strokeWidth={1.5} />, baseFichas: 50,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    balanceKey: 'superlikes',
  },
  {
    key: 'superlike_5', label: '5 SuperLikes', description: 'Pacote econômico',
    icon: <Star size={20} strokeWidth={1.5} />, baseFichas: 200,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    balanceKey: 'superlikes',
  },
  {
    key: 'boost_1', label: '1 Boost', description: '30 min em destaque na sua região',
    icon: <Zap size={20} strokeWidth={1.5} />, baseFichas: 60,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    balanceKey: 'boosts',
  },
  {
    key: 'boost_5', label: '5 Boosts', description: 'Estoque para o mês — 250 fichas',
    icon: <Zap size={20} strokeWidth={1.5} />, baseFichas: 250,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    balanceKey: 'boosts',
  },
  {
    key: 'lupa_1', label: '1 Lupa', description: 'Revele perfis borrados na aba Destaque',
    icon: <Search size={20} strokeWidth={1.5} />, baseFichas: 70,
    accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.10)', accentBorder: 'rgba(59,130,246,0.25)',
    balanceKey: 'lupas',
  },
  {
    key: 'lupa_5', label: '5 Lupas', description: 'Pacote com desconto — 290 fichas',
    icon: <Search size={20} strokeWidth={1.5} />, baseFichas: 290,
    accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.10)', accentBorder: 'rgba(59,130,246,0.25)',
    balanceKey: 'lupas',
  },
  {
    key: 'rewind_1', label: '1 Desfazer', description: 'Volte atrás em perfis que passou',
    icon: <RotateCcw size={20} strokeWidth={1.5} />, baseFichas: 50,
    accentColor: '#a855f7', accentBg: 'rgba(168,85,247,0.10)', accentBorder: 'rgba(168,85,247,0.25)',
    balanceKey: 'rewinds',
  },
  {
    key: 'rewind_5', label: '5 Desfazer', description: 'Pacote com desconto — 200 fichas',
    icon: <RotateCcw size={20} strokeWidth={1.5} />, baseFichas: 200,
    accentColor: '#a855f7', accentBg: 'rgba(168,85,247,0.10)', accentBorder: 'rgba(168,85,247,0.25)',
    balanceKey: 'rewinds',
  },
  {
    key: 'ghost_7d', label: 'Fantasma 7 dias', description: 'Fique invisível nas buscas por 7 dias',
    icon: <Ghost size={20} strokeWidth={1.5} />, baseFichas: 90,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  {
    key: 'ghost_35d', label: 'Fantasma 35 dias', description: 'Invisibilidade por mais de um mês',
    icon: <Ghost size={20} strokeWidth={1.5} />, baseFichas: 350,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  // Novos itens exclusivos de fichas
  {
    key: 'reveals_24h', label: 'Ver quem curtiu (24h)', description: 'Veja todos os seus admiradores por 24 horas',
    icon: <Eye size={20} strokeWidth={1.5} />, baseFichas: 200,
    accentColor: '#ec4899', accentBg: 'rgba(236,72,153,0.10)', accentBorder: 'rgba(236,72,153,0.25)',
    new: true,
  },
  {
    key: 'xp_bonus_3d', label: 'Bônus de XP (3 dias)', description: 'Ganhe o dobro de XP no streak por 3 dias',
    icon: <TrendingUp size={20} strokeWidth={1.5} />, baseFichas: 150,
    accentColor: '#10b981', accentBg: 'rgba(16,185,129,0.10)', accentBorder: 'rgba(16,185,129,0.25)',
    new: true,
  },
  {
    key: 'verified_plus', label: 'Selo Verificado Plus', description: 'Exibe um selo especial no seu perfil',
    icon: <BadgeCheck size={20} strokeWidth={1.5} />, baseFichas: 500,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    new: true,
  },
  {
    key: 'caixa_surpresa', label: 'Caixa Surpresa', description: 'Prêmio aleatório — pode ser raro!',
    icon: <Gift size={20} strokeWidth={1.5} />, baseFichas: 100,
    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.10)', accentBorder: 'rgba(139,92,246,0.25)',
    new: true,
  },
]

// ─── Componente Sheet de confirmacao ─────────────────────────────────────

function PurchaseSheet({
  item,
  price,
  fichas,
  plan,
  onConfirm,
  onClose,
  loading,
}: {
  item: StoreItem
  price: number
  fichas: number
  plan: string | null
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  const discount = 0
  const canAfford = fichas >= price

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', inset: '0 0 0 0', zIndex: 50,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'all',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          padding: '20px 20px 40px',
          animation: 'slideUp 0.25s ease-out',
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

          {/* Header do item */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.accentColor, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>{item.description}</p>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>

          {/* Custo com desconto */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, backgroundColor: canAfford ? 'rgba(245,158,11,0.08)' : 'rgba(225,29,72,0.08)', border: `1px solid ${canAfford ? 'rgba(245,158,11,0.25)' : 'rgba(225,29,72,0.25)'}`, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Custo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Coins size={15} color="#F59E0B" strokeWidth={1.5} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{price} fichas</span>
            </div>
          </div>


          {/* Saldo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Seu saldo atual</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Coins size={13} color={canAfford ? '#F59E0B' : '#f87171'} strokeWidth={1.5} />
              <span style={{ fontSize: 14, fontWeight: 600, color: canAfford ? '#F59E0B' : '#f87171' }}>{fichas} fichas</span>
            </div>
          </div>

          {canAfford ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', backgroundColor: loading ? 'rgba(225,29,72,0.40)' : '#E11D48', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}
            >
              {loading ? <Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Coins size={18} strokeWidth={1.5} />}
              {loading ? 'Processando...' : `Confirmar — ${price} fichas`}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#f87171', margin: 0 }}>
                Fichas insuficientes — precisa de mais {price - fichas} fichas
              </p>
              <button
                onClick={onClose}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
              >
                Comprar fichas acima
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────

export default function LojaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [fichas, setFichas]               = useState(0)
  const [superlikes, setSuperlikes]       = useState(0)
  const [boosts, setBoosts]               = useState(0)
  const [lupas, setLupas]                 = useState(0)
  const [rewinds, setRewinds]             = useState(0)
  const [boostActiveUntil, setBoostActiveUntil] = useState<string | null>(null)
  const [ghostModeUntil, setGhostModeUntil]     = useState<string | null>(null)
  const [loading, setLoading]             = useState(true)
  const [activating, setActivating]       = useState(false)
  const [openItem, setOpenItem]           = useState<StoreItem | null>(null)
  const [purchasing, setPurchasing]       = useState(false)
  const [lojaTab, setLojaTab]             = useState<'recargas' | 'compras'>('recargas')

  const plan = limits.plan
  const getPrice = (item: StoreItem) => applyDiscount(item.baseFichas, plan)

  useEffect(() => {
    if (!user) return
    loadBalance()
  }, [user])

  async function loadBalance() {
    const [{ data: fc }, { data: sl }, { data: bo }, { data: lp }, { data: rw }, { data: gh }] =
      await Promise.all([
        supabase.from('user_fichas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_superlikes').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user!.id).single(),
        supabase.from('user_lupas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_rewinds').select('amount').eq('user_id', user!.id).single(),
        supabase.from('profiles').select('ghost_mode_until').eq('id', user!.id).single(),
      ])

    setFichas(fc?.amount ?? 0)
    setSuperlikes(sl?.amount ?? 0)
    setBoosts(bo?.amount ?? 0)
    setBoostActiveUntil(bo?.active_until ?? null)
    setLupas(lp?.amount ?? 0)
    setRewinds(rw?.amount ?? 0)
    setGhostModeUntil(gh?.ghost_mode_until ?? null)
    setLoading(false)
  }

  async function handleActivateBoost() {
    haptics.medium()
    setActivating(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/boosts/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
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
    }
    setActivating(false)
  }

  async function handlePurchase(item: StoreItem) {
    if (purchasing) return
    setPurchasing(true)
    haptics.medium()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/loja/gastar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ item_key: item.key, plan }),
      })
      const data = await res.json()
      if (data.success) {
        haptics.success()
        setFichas(f => f - getPrice(item))
        toast.success(`${item.label} adicionado ao seu saldo!`)
        if (data.surpresa) {
          toast.info(`Caixa Surpresa: você ganhou ${data.surpresa.reward_amount}x ${data.surpresa.reward_type}!`)
        }
        setOpenItem(null)
        await loadBalance()
      } else if (res.status === 402) {
        haptics.error()
        toast.error('Fichas insuficientes. Compre um pacote acima.')
      } else {
        haptics.error()
        toast.error('Erro ao processar compra. Tente novamente.')
      }
    } catch {
      haptics.error()
      toast.error('Erro de conexão. Tente novamente.')
    }
    setPurchasing(false)
  }

  const boostIsActive = boostActiveUntil && new Date(boostActiveUntil) > new Date()
  const ghostIsActive = ghostModeUntil && new Date(ghostModeUntil) > new Date()
  const ghostDaysLeft = ghostIsActive
    ? Math.ceil((new Date(ghostModeUntil!).getTime() - Date.now()) / 86400000)
    : 0

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
        {/* Saldo de fichas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Coins size={13} color="#F59E0B" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>{loading ? '…' : fichas}</span>
          <span style={{ fontSize: '11px', color: 'rgba(245,158,11,0.6)' }}>fichas</span>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Saldo resumido */}
        {!loading && (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Seu saldo</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <BalanceItem icon={<Coins size={16} strokeWidth={1.5} color="#F59E0B" />} label="Fichas" value={fichas} />
              <BalanceItem icon={<Star size={16} strokeWidth={1.5} color="#F59E0B" />} label="SuperLikes" value={superlikes} />
              <BalanceItem icon={<Zap size={16} strokeWidth={1.5} color="var(--accent)" />} label="Boosts" value={boosts} active={!!boostIsActive} />
              <BalanceItem icon={<Search size={16} strokeWidth={1.5} color="#3b82f6" />} label="Lupas" value={lupas} />
              <BalanceItem icon={<RotateCcw size={16} strokeWidth={1.5} color="#a855f7" />} label="Rewinds" value={rewinds} />
              <BalanceItem icon={<Ghost size={16} strokeWidth={1.5} color="#6b7280" />} label="Fantasma" value={ghostDaysLeft} suffix="d" active={!!ghostIsActive} />
            </div>
          </div>
        )}

        {/* Boost ativo ou botao de ativar */}
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

        {/* ─── Tabs Recargas / Compras ────────────────────────────────── */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
          {(['recargas', 'compras'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setLojaTab(tab)}
              style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
                transition: 'all 0.2s',
                backgroundColor: lojaTab === tab ? 'var(--accent)' : 'transparent',
                color: lojaTab === tab ? '#fff' : 'var(--muted)',
              }}
            >
              {tab === 'recargas' ? 'Recargar fichas' : 'Gastar fichas'}
            </button>
          ))}
        </div>

        {/* ─── Pacotes de fichas ─────────────────────────────────────── */}
        {lojaTab === 'recargas' && <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Coins size={15} strokeWidth={1.5} color="#F59E0B" />
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Comprar fichas</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FICHAS_PACKAGES.map((pkg) => (
              <a
                key={pkg.label}
                href={pkg.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: 14,
                  border: pkg.highlight ? '1px solid rgba(245,158,11,0.40)' : '1px solid var(--border)',
                  backgroundColor: pkg.highlight ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)',
                  textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {pkg.highlight && (
                  <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 100, padding: '2px 10px', whiteSpace: 'nowrap' }}>
                    Mais popular
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Coins size={14} color="#F59E0B" strokeWidth={1.5} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{pkg.label}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: pkg.highlight ? '#F59E0B' : 'var(--muted)' }}>{pkg.price}</span>
              </a>
            ))}
          </div>
        </div>}

        {/* ─── Itens (pago com fichas) ──────────────────────────────── */}
        {lojaTab === 'compras' && <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Package size={15} strokeWidth={1.5} color="var(--muted)" />
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Gastar fichas</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STORE_ITEMS.map((item) => (
              <div
                key={item.key}
                onClick={() => { haptics.tap(); setOpenItem(item) }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.15s' }}
              >
                {/* Icone */}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.accentColor }}>
                  {item.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{item.label}</p>
                    {item.new && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 100, padding: '1px 6px' }}>NOVO</span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                </div>

                {/* Preco em fichas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Coins size={13} color="#F59E0B" strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: fichas >= getPrice(item) ? '#F59E0B' : 'rgba(248,249,250,0.35)' }}>{getPrice(item)}</span>
                  <ChevronRight size={14} strokeWidth={1.5} color="rgba(248,249,250,0.25)" />
                </div>
              </div>
            ))}
          </div>
        </div>}

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.20)', paddingBottom: '8px' }}>
          {lojaTab === 'recargas' ? 'Fichas adquiridas via Cakto. Pagamento unico, sem reembolso.' : 'Itens debitados do saldo de fichas da conta.'}
        </p>
      </div>

      {/* Sheet de confirmacao de compra */}
      {openItem && (
        <PurchaseSheet
          item={openItem}
          price={getPrice(openItem)}
          fichas={fichas}
          plan={plan}
          onConfirm={() => handlePurchase(openItem)}
          onClose={() => setOpenItem(null)}
          loading={purchasing}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
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
