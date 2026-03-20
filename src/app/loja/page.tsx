'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import {
  Star, Zap, ArrowLeft, CheckCircle, Loader2, ShoppingBag,
  Search, RotateCcw, Coins, Plus, Ghost, Eye, Gift, BadgeCheck,
  TrendingUp, X, Package, ChevronRight, ChevronDown, Backpack,
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

// ─── Itens premium (compra direta via Cakto, sem fichas) ──────────────────
const PACOTE_LENDARIO_URL  = 'https://pay.cakto.com.br/pacote_lendario'  // R$ 179,97

// ─── Pacotes de fichas (compra via Cakto) ─────────────────────────────────
// ATENÇÃO: substitua as URLs pelos links reais da Cakto após criar os produtos
const FICHAS_PACKAGES = [
  { label: '50 fichas',   price: 'R$ 5,97',  url: 'https://pay.cakto.com.br/fichas_50',   highlight: false, tag: null },
  { label: '150 fichas',  price: 'R$ 14,97', url: 'https://pay.cakto.com.br/fichas_150',  highlight: true,  tag: 'Mais popular' },
  { label: '400 fichas',  price: 'R$ 34,97', url: 'https://pay.cakto.com.br/fichas_400',  highlight: false, tag: null },
  { label: '900 fichas',  price: 'R$ 59,97', url: 'https://pay.cakto.com.br/fichas_900',  highlight: false, tag: 'Melhor valor' },
]

// Preço fixo — igual para todos os planos
function applyDiscount(base: number, _plan: string | null): number {
  return base
}

// ─── Itens compraveis com fichas ──────────────────────────────────────────
type ItemKey =
  | 'superlike' | 'boost' | 'lupa' | 'rewind'
  | 'ghost_7d' | 'ghost_35d'
  | 'reveals_5' | 'xp_bonus_3d' | 'verified_plus' | 'caixa_surpresa' | 'caixa_lendaria'

interface StoreItem {
  key: ItemKey
  label: string
  description: string
  unit: string           // ex: "SuperLike", "Boost", "perfis revelados"
  icon: React.ReactNode
  baseFichas: number     // preco por unidade
  accentColor: string
  accentBg: string
  accentBorder: string
  balanceKey?: string
  maxQty: number         // maximo selecionavel
  new?: boolean
}

const STORE_ITEMS: StoreItem[] = [
  {
    key: 'superlike', label: 'SuperLike', description: 'Se destaque para quem você mais quer',
    unit: 'SuperLike',
    icon: <Star size={20} strokeWidth={1.5} />, baseFichas: 30, maxQty: 10,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    balanceKey: 'superlikes',
  },
  {
    key: 'boost', label: 'Boost', description: '30 min em destaque na sua região',
    unit: 'Boost',
    icon: <Zap size={20} strokeWidth={1.5} />, baseFichas: 40, maxQty: 5,
    accentColor: '#E11D48', accentBg: 'rgba(225,29,72,0.10)', accentBorder: 'rgba(225,29,72,0.25)',
    balanceKey: 'boosts',
  },
  {
    key: 'lupa', label: 'Lupa', description: 'Revele perfis borrados na aba Destaque',
    unit: 'Lupa',
    icon: <Search size={20} strokeWidth={1.5} />, baseFichas: 25, maxQty: 10,
    accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.10)', accentBorder: 'rgba(59,130,246,0.25)',
    balanceKey: 'lupas',
  },
  {
    key: 'rewind', label: 'Desfazer', description: 'Volte atrás em perfis que passou',
    unit: 'Desfazer',
    icon: <RotateCcw size={20} strokeWidth={1.5} />, baseFichas: 20, maxQty: 10,
    accentColor: '#a855f7', accentBg: 'rgba(168,85,247,0.10)', accentBorder: 'rgba(168,85,247,0.25)',
    balanceKey: 'rewinds',
  },
  {
    key: 'ghost_7d', label: 'Fantasma 7 dias', description: 'Fique invisível nas buscas por 7 dias',
    unit: 'ativação',
    icon: <Ghost size={20} strokeWidth={1.5} />, baseFichas: 60, maxQty: 1,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  {
    key: 'ghost_35d', label: 'Fantasma 35 dias', description: 'Invisibilidade por mais de um mês',
    unit: 'ativação',
    icon: <Ghost size={20} strokeWidth={1.5} />, baseFichas: 220, maxQty: 1,
    accentColor: '#6b7280', accentBg: 'rgba(107,114,128,0.10)', accentBorder: 'rgba(107,114,128,0.25)',
    balanceKey: 'ghost',
  },
  {
    key: 'reveals_5', label: 'Ver quem curtiu', description: 'Revela 5 perfis da fila de admiradores',
    unit: 'revelação (5 perfis)',
    icon: <Eye size={20} strokeWidth={1.5} />, baseFichas: 50, maxQty: 5,
    accentColor: '#ec4899', accentBg: 'rgba(236,72,153,0.10)', accentBorder: 'rgba(236,72,153,0.25)',
    new: true,
  },
  {
    key: 'xp_bonus_3d', label: 'Bônus de XP (3 dias)', description: 'Ganhe o dobro de XP no streak por 3 dias',
    unit: 'ativação',
    icon: <TrendingUp size={20} strokeWidth={1.5} />, baseFichas: 50, maxQty: 1,
    accentColor: '#10b981', accentBg: 'rgba(16,185,129,0.10)', accentBorder: 'rgba(16,185,129,0.25)',
    new: true,
  },
  {
    key: 'verified_plus', label: 'Selo Verificado Plus', description: 'Selo especial no perfil por 30 dias',
    unit: 'ativação',
    icon: <BadgeCheck size={20} strokeWidth={1.5} />, baseFichas: 200, maxQty: 1,
    accentColor: '#F59E0B', accentBg: 'rgba(245,158,11,0.10)', accentBorder: 'rgba(245,158,11,0.25)',
    new: true,
  },
  {
    key: 'caixa_surpresa', label: 'Caixa Surpresa', description: 'Premio aleatorio — pode ser raro!',
    unit: 'caixa',
    icon: <Gift size={20} strokeWidth={1.5} />, baseFichas: 35, maxQty: 5,
    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.10)', accentBorder: 'rgba(139,92,246,0.25)',
    new: true,
  },
  {
    key: 'caixa_lendaria', label: 'Caixa Super Lendária', description: 'Recompensas exclusivas e raras — itens que nao existem em outro lugar',
    unit: 'caixa',
    icon: <Gift size={20} strokeWidth={1.5} />, baseFichas: 2250, maxQty: 1,
    accentColor: '#F59E0B', accentBg: 'rgba(139,92,246,0.15)', accentBorder: 'rgba(245,158,11,0.50)',
    new: true,
  },
]

// ─── Componente Sheet de confirmacao ─────────────────────────────────────

function PurchaseSheet({
  item,
  qty,
  fichas,
  onConfirm,
  onClose,
  loading,
}: {
  item: StoreItem
  qty: number
  fichas: number
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  const total = item.baseFichas * qty
  const canAfford = fichas >= total
  const qtyLabel = qty > 1 ? `${qty}x ${item.unit}` : `1 ${item.unit}`

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: '0 0 0 0', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'all', backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--border)', padding: '20px 20px 40px', animation: 'slideUp 0.25s ease-out' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

          {/* Header */}
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

          {/* Resumo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, backgroundColor: canAfford ? 'rgba(245,158,11,0.08)' : 'rgba(225,29,72,0.08)', border: `1px solid ${canAfford ? 'rgba(245,158,11,0.25)' : 'rgba(225,29,72,0.25)'}`, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Comprando</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '2px 0 0' }}>{qtyLabel}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 2 }}>
                <Coins size={15} color="#F59E0B" strokeWidth={1.5} />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{total}</span>
                <span style={{ fontSize: 12, color: 'rgba(245,158,11,0.6)' }}>fichas</span>
              </div>
              {qty > 1 && <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.30)' }}>{item.baseFichas} cada</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Seu saldo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Coins size={13} color={canAfford ? '#F59E0B' : '#f87171'} strokeWidth={1.5} />
              <span style={{ fontSize: 14, fontWeight: 600, color: canAfford ? '#F59E0B' : '#f87171' }}>{fichas} fichas</span>
            </div>
          </div>

          {canAfford ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', backgroundColor: loading ? 'rgba(225,29,72,0.40)' : '#E11D48', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Coins size={18} strokeWidth={1.5} />}
              {loading ? 'Processando...' : `Confirmar — ${total} fichas`}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#f87171', margin: 0 }}>
                Fichas insuficientes — faltam {total - fichas} fichas
              </p>
              <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
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
  const [boostActiveUntil, setBoostActiveUntil]       = useState<string | null>(null)
  const [ghostModeUntil, setGhostModeUntil]           = useState<string | null>(null)
  const [curtidasRevealsUntil, setCurtidasRevealsUntil] = useState<string | null>(null)
  const [xpBonusUntil, setXpBonusUntil]               = useState<string | null>(null)
  const [loading, setLoading]             = useState(true)
  const [activating, setActivating]       = useState(false)
  const [openItem, setOpenItem]           = useState<StoreItem | null>(null)
  const [purchasing, setPurchasing]       = useState(false)
  const [lojaTab, setLojaTab]             = useState<'recargas' | 'compras'>('compras')
  const [selectedPackage, setSelectedPackage] = useState<typeof FICHAS_PACKAGES[0] | null>(null)
  const [mochilaAberta, setMochilaAberta] = useState(false)
  const [qtys, setQtys] = useState<Record<string, number>>(
    () => Object.fromEntries(STORE_ITEMS.map(i => [i.key, 1]))
  )
  const [openQty, setOpenQty] = useState(1)
  const [lendariaResult, setLendariaResult] = useState<{ type: string; amount: number } | null>(null)
  const [lendariaPhase, setLendariaPhase] = useState<'idle' | 'shake' | 'jump' | 'explode' | 'reveal'>('idle')

  const plan = limits.plan

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
        supabase.from('profiles').select('ghost_mode_until, curtidas_reveals_until, xp_bonus_until').eq('id', user!.id).single(),
      ])

    setFichas(fc?.amount ?? 0)
    setSuperlikes(sl?.amount ?? 0)
    setBoosts(bo?.amount ?? 0)
    setBoostActiveUntil(bo?.active_until ?? null)
    setLupas(lp?.amount ?? 0)
    setRewinds(rw?.amount ?? 0)
    setGhostModeUntil(gh?.ghost_mode_until ?? null)
    setCurtidasRevealsUntil(gh?.curtidas_reveals_until ?? null)
    setXpBonusUntil(gh?.xp_bonus_until ?? null)
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

  async function handlePurchase(item: StoreItem, qty: number = 1) {
    if (purchasing) return
    setPurchasing(true)
    haptics.medium()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/loja/gastar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ item_key: item.key, plan, qty }),
      })
      const data = await res.json()
      if (data.success) {
        haptics.success()
        setFichas(f => f - item.baseFichas * qty)
        toast.success(`${item.label} adicionado ao seu saldo!`)
        if (data.surpresa) {
          toast.info(`Caixa Surpresa: você ganhou ${data.surpresa.reward_amount}x ${data.surpresa.reward_type}!`)
        }
        if (data.caixa_lendaria) {
          setLendariaResult(data.caixa_lendaria)
          setLendariaPhase('shake')
          setTimeout(() => setLendariaPhase('jump'), 700)
          setTimeout(() => setLendariaPhase('explode'), 1200)
          setTimeout(() => setLendariaPhase('reveal'), 1700)
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

  const boostIsActive   = boostActiveUntil && new Date(boostActiveUntil) > new Date()
  const ghostIsActive   = ghostModeUntil && new Date(ghostModeUntil) > new Date()
  const revealsIsActive = curtidasRevealsUntil && new Date(curtidasRevealsUntil) > new Date()
  const xpBonusIsActive = xpBonusUntil && new Date(xpBonusUntil) > new Date()
  const ghostDaysLeft = ghostIsActive
    ? Math.ceil((new Date(ghostModeUntil!).getTime() - Date.now()) / 86400000)
    : 0

  // Config diaria do Pacote Lendario — varia bonus (20-70%) e caixas (1-2) por dia
  const lendariaConfig = (() => {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    const bonusOpcoes = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]
    const bonus = bonusOpcoes[((day * 13) + (month * 7)) % bonusOpcoes.length]
    const caixas = day % 3 === 0 ? 2 : 1
    const fichas = Math.round(2700 * (1 + bonus / 100) / 100) * 100
    // Semanas de pagamento: dias 1-7 e 21-27 do mes
    const isPaymentWeek = (day >= 1 && day <= 7) || (day >= 21 && day <= 27)
    // Fora da semana: slot de 6h por dia baseado no dia/mes
    const slotStart = ((day * 13) + (month * 7)) % 18
    const currentHour = now.getHours()
    const isInSlot = currentHour >= slotStart && currentHour < slotStart + 6
    const show = isPaymentWeek || isInSlot
    let expiresAt: Date | null = null
    if (!isPaymentWeek && isInSlot) {
      expiresAt = new Date(now)
      expiresAt.setHours(slotStart + 6, 0, 0, 0)
    }
    return { bonus, caixas, fichas, show, expiresAt }
  })()

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
        {/* Botão recarregar + Saldo de fichas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => { setLojaTab('recargas'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Recarregar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Coins size={13} color="#F59E0B" strokeWidth={1.5} />
            <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>{loading ? '…' : fichas}</span>
            <span style={{ fontSize: '11px', color: 'rgba(245,158,11,0.6)' }}>fichas</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Mochila colapsavel */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setMochilaAberta(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Backpack size={16} color="#F59E0B" strokeWidth={1.5} />
            </div>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Minha mochila</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!mochilaAberta && !loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Coins size={13} color="#F59E0B" strokeWidth={1.5} />
                  <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>{fichas} fichas</span>
                </div>
              )}
              <ChevronDown size={16} color="rgba(248,249,250,0.35)" strokeWidth={1.5} style={{ transition: 'transform 0.2s', transform: mochilaAberta ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>
          </button>
          {mochilaAberta && !loading && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '12px' }}>
                <BalanceItem icon={<Coins size={16} strokeWidth={1.5} color="#F59E0B" />} label="Fichas" value={fichas} />
                <BalanceItem icon={<Star size={16} strokeWidth={1.5} color="#F59E0B" />} label="SuperLikes" value={superlikes} />
                <BalanceItem icon={<Zap size={16} strokeWidth={1.5} color="var(--accent)" />} label="Boosts" value={boosts} active={!!boostIsActive} countdown={boostIsActive && boostActiveUntil ? boostActiveUntil : undefined} />
                <BalanceItem icon={<Search size={16} strokeWidth={1.5} color="#3b82f6" />} label="Lupas" value={lupas} />
                <BalanceItem icon={<RotateCcw size={16} strokeWidth={1.5} color="#a855f7" />} label="Rewinds" value={rewinds} />
                <BalanceItem icon={<Ghost size={16} strokeWidth={1.5} color="#6b7280" />} label="Fantasma" value={ghostDaysLeft} suffix="d" active={!!ghostIsActive} countdown={ghostIsActive && ghostModeUntil ? ghostModeUntil : undefined} />
                <BalanceItem icon={<Eye size={16} strokeWidth={1.5} color="#ec4899" />} label="Ver curtidas" value={revealsIsActive ? 1 : 0} active={!!revealsIsActive} countdown={revealsIsActive && curtidasRevealsUntil ? curtidasRevealsUntil : undefined} />
                <BalanceItem icon={<TrendingUp size={16} strokeWidth={1.5} color="#10b981" />} label="Bonus XP" value={xpBonusIsActive ? 1 : 0} active={!!xpBonusIsActive} countdown={xpBonusIsActive && xpBonusUntil ? xpBonusUntil : undefined} />
              </div>
            </div>
          )}
        </div>

        {/* Boost: removido da loja — aparece no dashboard */}

        {/* ─── Pacote Lendário (aparece em periodos estratégicos) ───── */}
        {lendariaConfig.show && (
          <div>
            <a
              href={PACOTE_LENDARIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptics.success()}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div style={{
                borderRadius: 18, padding: '18px 20px',
                background: 'linear-gradient(135deg, #1a1000 0%, #2a1a00 50%, #1a1000 100%)',
                border: '1px solid rgba(245,158,11,0.45)',
                boxShadow: '0 0 24px rgba(245,158,11,0.10)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: 10, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #F59E0B, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
                    <Coins size={24} strokeWidth={1.5} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, color: '#fff', margin: 0 }}>Pacote Lendário</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.20)', border: '1px solid rgba(245,158,11,0.50)', borderRadius: 100, padding: '2px 8px' }}>PROMOÇÃO EXCLUSIVA</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Coins size={12} color="#F59E0B" strokeWidth={1.5} />
                        <span style={{ fontSize: 13, color: '#F8F9FA', fontWeight: 600 }}>{lendariaConfig.fichas.toLocaleString('pt-BR')} fichas</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '1px 6px' }}>+{lendariaConfig.bonus}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Gift size={12} color="#F59E0B" strokeWidth={1.5} />
                        <span style={{ fontSize: 13, color: '#F8F9FA', fontWeight: 600 }}>{lendariaConfig.caixas === 2 ? '2 Caixas Super Lendárias' : '1 Caixa Super Lendária'}</span>
                        <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.35)' }}>grátis</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {lendariaConfig.expiresAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#F59E0B' }}>Expira em</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', fontFamily: 'monospace' }}>
                        <CountdownText until={lendariaConfig.expiresAt.toISOString()} />
                      </span>
                    </div>
                  ) : <div />}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#F59E0B', margin: 0, lineHeight: 1 }}>R$ 174,62</p>
                    <p style={{ fontSize: 10, color: 'rgba(248,249,250,0.35)', margin: '2px 0 0' }}>pagamento único</p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* ─── Tabs e conteúdo (ocultos quando mochila está aberta) ─── */}
        {!mochilaAberta && <>
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
              {tab === 'recargas' ? 'Recarregar fichas' : 'Usar fichas'}
            </button>
          ))}
        </div>

        {/* ─── Pacotes de fichas ─────────────────────────────────────── */}
        {lojaTab === 'recargas' && <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Coins size={15} strokeWidth={1.5} color="#F59E0B" />
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Selecione um pacote</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, paddingTop: 4 }}>
            {FICHAS_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage?.label === pkg.label
              return (
                <div key={pkg.label} style={{ position: 'relative', paddingTop: pkg.tag ? 14 : 0 }}>
                  {pkg.tag && (
                    <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 100, padding: '2px 10px', whiteSpace: 'nowrap', zIndex: 1 }}>
                      {pkg.tag}
                    </span>
                  )}
                <div
                  onClick={() => { haptics.tap(); setSelectedPackage(isSelected ? null : pkg) }}
                  style={{
                    display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: 14,
                    border: isSelected
                      ? '1.5px solid rgba(245,158,11,0.80)'
                      : pkg.tag
                        ? '1px solid rgba(245,158,11,0.30)'
                        : '1px solid var(--border)',
                    backgroundColor: isSelected
                      ? 'rgba(245,158,11,0.14)'
                      : 'var(--bg-card)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 0 3px rgba(245,158,11,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Coins size={14} color="#F59E0B" strokeWidth={1.5} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{pkg.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: isSelected ? '#F59E0B' : 'var(--muted)' }}>{pkg.price}</span>
                    {isSelected && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={12} color="#000" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )
            })}
          </div>
          {/* Botao de adquirir fichas */}
          <a
            href={selectedPackage?.url ?? '#'}
            target={selectedPackage ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!selectedPackage) { e.preventDefault(); toast.info('Selecione um pacote acima.'); return }
              haptics.medium()
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              backgroundColor: selectedPackage ? '#E11D48' : 'rgba(225,29,72,0.25)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: selectedPackage ? 'pointer' : 'not-allowed',
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: selectedPackage ? '0 8px 24px rgba(225,29,72,0.35)' : 'none',
              fontFamily: 'var(--font-jakarta)',
              opacity: selectedPackage ? 1 : 0.6,
            }}
          >
            <Coins size={18} strokeWidth={1.5} />
            {selectedPackage
              ? `Adquirir ${selectedPackage.label} por ${selectedPackage.price}`
              : 'Selecione um pacote para continuar'}
          </a>
        </div>}

        {/* ─── Itens (pago com fichas) ──────────────────────────────── */}
        {lojaTab === 'compras' && <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Package size={15} strokeWidth={1.5} color="var(--muted)" />
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Usar fichas</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STORE_ITEMS.map((item) => {
              const qty = qtys[item.key] ?? 1
              const total = item.baseFichas * qty
              const canAfford = fichas >= total
              return (
                <div
                  key={item.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {/* Icone */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.accentColor }}>
                    {item.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{item.label}</p>
                      {item.new && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 100, padding: '1px 6px' }}>NOVO</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Coins size={11} color="#F59E0B" strokeWidth={1.5} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: canAfford ? '#F59E0B' : '#f87171' }}>{total}</span>
                      {qty > 1 && <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.30)' }}>({item.baseFichas} cada)</span>}
                    </div>
                  </div>

                  {/* Seletor +/- */}
                  {item.maxQty > 1 && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 0, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setQtys(q => ({ ...q, [item.key]: Math.max(1, (q[item.key] ?? 1) - 1) }))}
                        style={{ width: 30, height: 30, border: 'none', background: 'none', color: qty <= 1 ? 'rgba(248,249,250,0.20)' : 'var(--text)', fontSize: 16, cursor: qty <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 18, textAlign: 'center' }}>{qty}</span>
                      <button
                        onClick={() => setQtys(q => ({ ...q, [item.key]: Math.min(item.maxQty, (q[item.key] ?? 1) + 1) }))}
                        style={{ width: 30, height: 30, border: 'none', background: 'none', color: qty >= item.maxQty ? 'rgba(248,249,250,0.20)' : 'var(--text)', fontSize: 16, cursor: qty >= item.maxQty ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    </div>
                  )}

                  {/* Botao comprar */}
                  <button
                    onClick={() => { haptics.tap(); setOpenItem(item); setOpenQty(qty) }}
                    style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: 'none', backgroundColor: canAfford ? '#E11D48' : 'rgba(255,255,255,0.06)', color: canAfford ? '#fff' : 'rgba(248,249,250,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                  >
                    Comprar
                  </button>
                </div>
              )
            })}
          </div>
        </div>}

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.20)', paddingBottom: '8px' }}>
          {lojaTab === 'recargas' ? 'Fichas adquiridas via Cakto. Pagamento unico, sem reembolso.' : 'Itens debitados do saldo de fichas da conta.'}
        </p>
        </>}

      </div>

      {/* Sheet de confirmacao de compra */}
      {openItem && (
        <PurchaseSheet
          item={openItem}
          qty={openQty}
          fichas={fichas}
          onConfirm={() => handlePurchase(openItem, openQty)}
          onClose={() => setOpenItem(null)}
          loading={purchasing}
        />
      )}

      {/* Modal Caixa Super Lendária */}
      {lendariaPhase !== 'idle' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{
            fontSize: 80,
            animation: lendariaPhase === 'shake' ? 'lend-shake 0.6s ease-in-out infinite' :
                       lendariaPhase === 'jump'  ? 'lend-jump 0.4s ease-out' :
                       lendariaPhase === 'explode' ? 'lend-explode 0.4s ease-out forwards' : 'none',
          }}>🎁</div>
          {lendariaPhase === 'reveal' && lendariaResult && (
            <div style={{ textAlign: 'center', animation: 'lend-reveal 0.5s ease-out' }}>
              <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, color: '#F59E0B', marginBottom: 8 }}>Voce ganhou!</p>
              <p style={{ fontSize: 20, color: 'var(--text)', fontWeight: 700 }}>
                {lendariaResult.amount > 1 ? `${lendariaResult.amount}x ` : ''}{lendariaResult.type.replace(/_/g, ' ')}
              </p>
              <button
                onClick={() => { setLendariaPhase('idle'); setLendariaResult(null); loadBalance() }}
                style={{ marginTop: 24, backgroundColor: '#F59E0B', color: '#000', border: 'none', borderRadius: 100, padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Boa!
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes lend-shake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(6deg)} }
        @keyframes lend-jump { 0%{transform:translateY(0) scale(1)} 50%{transform:translateY(-40px) scale(1.2)} 100%{transform:translateY(0) scale(1)} }
        @keyframes lend-explode { 0%{transform:scale(1);opacity:1} 100%{transform:scale(3);opacity:0} }
        @keyframes lend-reveal { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

function CountdownText({ until }: { until: string }) {
  const str = useCountdownStr(until)
  return <>{str}</>
}

function useCountdownStr(until?: string): string {
  const [str, setStr] = useState('')
  useEffect(() => {
    if (!until) return
    const update = () => {
      const diff = new Date(until).getTime() - Date.now()
      if (diff <= 0) { setStr('Expirando'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 24) setStr(`${Math.floor(h / 24)}d ${h % 24}h`)
      else if (h > 0) setStr(`${h}h ${m}m`)
      else setStr(`${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [until])
  return str
}

function BalanceItem({ icon, label, value, active, suffix, countdown }: {
  icon: React.ReactNode
  label: string
  value: number
  active?: boolean
  suffix?: string
  countdown?: string
}) {
  const timeLeft = useCountdownStr(countdown)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', borderRadius: '12px', backgroundColor: active ? 'var(--accent-light)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'var(--accent-border)' : 'rgba(255,255,255,0.05)'}` }}>
      <div style={{ marginBottom: '6px' }}>{icon}</div>
      <p style={{ fontSize: '16px', fontWeight: '800', color: active ? 'var(--accent)' : 'var(--text)', margin: 0, lineHeight: 1 }}>
        {value}{suffix && <span style={{ fontSize: '11px', fontWeight: '400', marginLeft: '1px' }}>{suffix}</span>}
      </p>
      <p style={{ fontSize: '10px', color: 'var(--muted)', margin: 0, marginTop: '3px', textAlign: 'center', lineHeight: 1.2 }}>{label}</p>
      {active && timeLeft && (
        <p style={{ fontSize: '9px', color: active ? 'var(--accent)' : '#6b7280', margin: 0, marginTop: '2px', textAlign: 'center', fontWeight: 600, letterSpacing: '0.02em' }}>{timeLeft}</p>
      )}
    </div>
  )
}
