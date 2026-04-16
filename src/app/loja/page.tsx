'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, ShoppingBag,
  Search, RotateCcw, Coins, Plus, Ghost, Eye, TrendingUp,
  Star, Zap, Gift, BadgeCheck, Package, ChevronDown, Backpack, Ticket, Video, Crown,
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { useSounds } from '@/hooks/useSounds'
import CheckoutModal from '@/components/CheckoutModal'
import { FICHAS_PACKAGES, STORE_ITEMS, SURPRESA_CONFIG, StoreItem } from './_components/helpers'
import { PurchaseSheet } from './_components/PurchaseSheet'
import { Confetti } from './_components/Confetti'
import { CountdownText } from './_components/CountdownText'
import { BalanceItem } from './_components/BalanceItem'

export default function LojaPage() {
  const { user } = useAuth()
  const { limits } = usePlan()
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()
  const { play } = useSounds()

  const [fichas, setFichas]               = useState(0)
  const [tickets, setTickets]             = useState(0)
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
  const [boxReveal, setBoxReveal] = useState<{ category: 'surpresa' | 'lendaria'; payload: any } | null>(null)
  const [boxPhase, setBoxPhase] = useState<'idle' | 'shake' | 'jump' | 'explode' | 'reveal'>('idle')
  const [fichasModalOpen, setFichasModalOpen] = useState(false)
  const [fichasPackageId, setFichasPackageId] = useState<string>('')

  const plan = limits.plan

  useEffect(() => {
    if (!user) return
    loadBalance()
  }, [user])

  async function loadBalance() {
    const [{ data: fc }, { data: tk }, { data: sl }, { data: bo }, { data: lp }, { data: rw }, { data: gh }] =
      await Promise.all([
        supabase.from('user_fichas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_tickets').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_superlikes').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_boosts').select('amount, active_until').eq('user_id', user!.id).single(),
        supabase.from('user_lupas').select('amount').eq('user_id', user!.id).single(),
        supabase.from('user_rewinds').select('amount').eq('user_id', user!.id).single(),
        supabase.from('profiles').select('ghost_mode_until, curtidas_reveals_until, xp_bonus_until').eq('id', user!.id).single(),
      ])

    setFichas(fc?.amount ?? 0)
    setTickets(tk?.amount ?? 0)
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
      play('success')
      toast.success('Boost ativado! Você está em destaque por 1 hora')
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
        play('coin')
        setFichas(f => f - item.baseFichas * qty)
        if (data.surpresa) {
          setBoxReveal({ category: 'surpresa', payload: data.surpresa })
          setBoxPhase('shake')
          setTimeout(() => setBoxPhase('jump'), 700)
          setTimeout(() => setBoxPhase('explode'), 1200)
          setTimeout(() => setBoxPhase('reveal'), 1700)
        } else if (data.caixa_lendaria) {
          setBoxReveal({ category: 'lendaria', payload: data.caixa_lendaria })
          setBoxPhase('shake')
          setTimeout(() => setBoxPhase('jump'), 700)
          setTimeout(() => setBoxPhase('explode'), 1200)
          setTimeout(() => setBoxPhase('reveal'), 1700)
        } else {
          toast.success(`${item.label} adicionado ao seu saldo!`)
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

  const lendariaConfig = (() => {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    const bonusOpcoes = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]
    const bonus = bonusOpcoes[((day * 13) + (month * 7)) % bonusOpcoes.length]
    const caixas = day % 3 === 0 ? 2 : 1
    const fichas = Math.round(2700 * (1 + bonus / 100) / 100) * 100
    const isPaymentWeek = (day >= 1 && day <= 7) || (day >= 21 && day <= 27)
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

      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
            <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>{loading ? '...' : fichas}</span>
            <span style={{ fontSize: '11px', color: 'rgba(245,158,11,0.6)' }}>fichas</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
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
              <ChevronDown size={16} color="rgba(248,249,250,0.35)" strokeWidth={1.5} style={{ transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', transform: mochilaAberta ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>
          </button>
          {mochilaAberta && !loading && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '12px' }}>
                <BalanceItem icon={<Coins size={16} strokeWidth={1.5} color="#F59E0B" />} label="Fichas" value={fichas} />
                <BalanceItem icon={<Ticket size={16} strokeWidth={1.5} color="#eab308" />} label="Tickets" value={tickets} />
                <BalanceItem icon={<Star size={16} strokeWidth={1.5} color="#F59E0B" />} label="SuperCurtidas" value={superlikes} />
                <BalanceItem icon={<Zap size={16} strokeWidth={1.5} color="var(--accent)" />} label="Boosts" value={boosts} active={!!boostIsActive} countdown={boostIsActive && boostActiveUntil ? boostActiveUntil : undefined} onActivate={handleActivateBoost} activating={activating} />
                <BalanceItem icon={<Search size={16} strokeWidth={1.5} color="#3b82f6" />} label="Lupas" value={lupas} />
                <BalanceItem icon={<RotateCcw size={16} strokeWidth={1.5} color="#a855f7" />} label="Rewinds" value={rewinds} />
                <BalanceItem icon={<Ghost size={16} strokeWidth={1.5} color="#6b7280" />} label="Fantasma" value={ghostDaysLeft} suffix="d" active={!!ghostIsActive} countdown={ghostIsActive && ghostModeUntil ? ghostModeUntil : undefined} />
                <BalanceItem icon={<Eye size={16} strokeWidth={1.5} color="#ec4899" />} label="Ver curtidas" value={revealsIsActive ? 1 : 0} active={!!revealsIsActive} countdown={revealsIsActive && curtidasRevealsUntil ? curtidasRevealsUntil : undefined} />
                <BalanceItem icon={<TrendingUp size={16} strokeWidth={1.5} color="#10b981" />} label="Bônus XP" value={xpBonusIsActive ? 1 : 0} active={!!xpBonusIsActive} countdown={xpBonusIsActive && xpBonusUntil ? xpBonusUntil : undefined} />
              </div>
            </div>
          )}
        </div>

        {lendariaConfig.show && (
          <div>
            <div
              onClick={() => { haptics.success(); setFichasPackageId('pacote_lendario'); setFichasModalOpen(true) }}
              style={{ display: 'block', cursor: 'pointer' }}
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
                      <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, color: '#fff', margin: 0 }}>Pacote lendário</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.20)', border: '1px solid rgba(245,158,11,0.50)', borderRadius: 100, padding: '2px 8px' }}>Promoção exclusiva</span>
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
                    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, color: '#F59E0B', margin: 0, lineHeight: 1 }}>R$ 179,97</p>
                    <p style={{ fontSize: 10, color: 'rgba(248,249,250,0.35)', margin: '2px 0 0' }}>pagamento único</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!mochilaAberta && <>
        <div style={{ display: 'flex', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['compras', 'recargas'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setLojaTab(tab)}
              style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-jakarta)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                background: lojaTab === tab ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)' : 'transparent',
                color: lojaTab === tab ? '#fff' : 'var(--muted)',
              }}
            >
              {tab === 'recargas' ? 'Recarregar fichas' : 'Usar fichas'}
            </button>
          ))}
        </div>

        {lojaTab === 'recargas' && <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Coins size={15} strokeWidth={1.5} color="#F59E0B" />
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Selecione um pacote</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, paddingTop: 16 }}>
            {FICHAS_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage?.label === pkg.label
              return (
                <div key={pkg.label} style={{ position: 'relative', paddingTop: pkg.tag ? 18 : 0 }}>
                  {pkg.tag && (
                    <span style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 100, padding: '2px 10px', whiteSpace: 'nowrap', zIndex: 1 }}>
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
                    cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
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
          <button
            onClick={() => {
              if (!selectedPackage) { toast.info('Selecione um pacote acima.'); return }
              haptics.medium()
              setFichasPackageId(selectedPackage.packageId)
              setFichasModalOpen(true)
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: selectedPackage ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)' : 'rgba(225,29,72,0.25)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: selectedPackage ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: selectedPackage ? '0 8px 24px rgba(225,29,72,0.35)' : 'none',
              fontFamily: 'var(--font-jakarta)',
              opacity: selectedPackage ? 1 : 0.6,
            }}
          >
            <Coins size={18} strokeWidth={1.5} />
            {selectedPackage
              ? `Adquirir ${selectedPackage.label} por ${selectedPackage.price}`
              : 'Selecione um pacote para continuar'}
          </button>
        </div>}

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
              const locked = item.blackOnly && plan !== 'black'
              return (
                <div
                  key={item.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: locked ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--border)', opacity: locked ? 0.75 : 1 }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: item.accentBg, border: `1px solid ${item.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.accentColor }}>
                    {item.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{item.label}</p>
                      {item.new && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 100, padding: '1px 6px' }}>Novo</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Coins size={11} color="#F59E0B" strokeWidth={1.5} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: canAfford ? '#F59E0B' : '#f87171' }}>{total}</span>
                      {qty > 1 && <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.30)' }}>({item.baseFichas} cada)</span>}
                    </div>
                  </div>

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

                  {locked ? (
                    <a href="/planos" style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 11, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-jakarta)', border: '1px solid rgba(245,158,11,0.25)', whiteSpace: 'nowrap' }}>
                      Somente Black
                    </a>
                  ) : (
                    <button
                      onClick={() => { haptics.tap(); setOpenItem(item); setOpenQty(qty) }}
                      style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: 'none', background: canAfford ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)' : 'rgba(255,255,255,0.06)', color: canAfford ? '#fff' : 'rgba(248,249,250,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                    >
                      Comprar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>}

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,249,250,0.20)', paddingBottom: '8px' }}>
          {lojaTab === 'recargas' ? 'Fichas adquiridas via pagamento único, sem reembolso.' : 'Itens debitados do saldo de fichas da conta.'}
        </p>
        </>}

      </div>

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

      {boxPhase !== 'idle' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, overflow: 'hidden' }}>
          {boxPhase === 'reveal' && <Confetti />}

          {boxPhase !== 'reveal' && (
            <div style={{
              width: 130, height: 130, borderRadius: 26, flexShrink: 0,
              backgroundColor: boxReveal?.category === 'lendaria' ? '#c07f00' : '#be123c',
              border: `4px solid ${boxReveal?.category === 'lendaria' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.30)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: boxReveal?.category === 'lendaria'
                ? '0 0 80px rgba(245,158,11,0.75), 0 0 30px rgba(245,158,11,0.45)'
                : '0 0 80px rgba(225,29,72,0.75), 0 0 30px rgba(225,29,72,0.45)',
              animation: boxPhase === 'shake'
                ? 'box-shake 0.5s ease-in-out infinite'
                : boxPhase === 'jump'
                ? 'box-jump 0.45s cubic-bezier(0.34,1.56,0.64,1)'
                : boxPhase === 'explode'
                ? 'box-explode 0.45s ease-out forwards'
                : 'none',
              position: 'relative', zIndex: 2,
            }}>
              <Gift size={64} color="#fff" strokeWidth={1.5} />
            </div>
          )}

          {boxPhase === 'reveal' && boxReveal && (
            <div style={{ textAlign: 'center', animation: 'box-reveal 0.5s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative', zIndex: 3, padding: '0 32px', maxWidth: 360 }}>

              {boxReveal.category === 'surpresa' ? (
                <>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%', margin: '0 auto 18px',
                    backgroundColor: SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.bg ?? 'rgba(225,29,72,0.15)',
                    border: `3px solid ${SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.color ?? 'rgba(225,29,72,0.45)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 40px ${SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.color ?? '#E11D48'}55`,
                  }}>
                    {SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.icon ?? <Gift size={44} color="#fff" strokeWidth={1.5} />}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(248,249,250,0.45)', margin: '0 0 8px' }}>Caixa surpresa</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 34, color: '#fff', margin: '0 0 8px', lineHeight: 1 }}>Você ganhou!</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.color ?? '#E11D48', margin: '0 0 4px' }}>
                    {(boxReveal.payload?.reward_amount ?? 1)}x {SURPRESA_CONFIG[boxReveal.payload?.reward_type]?.label ?? (boxReveal.payload?.reward_type ? boxReveal.payload.reward_type.charAt(0).toUpperCase() + boxReveal.payload.reward_type.slice(1) : 'Prêmio')}
                  </p>
                </>
              ) : (
                <>
                  {boxReveal.payload?.badge_icon ? (
                    <img src={boxReveal.payload.badge_icon} alt="" style={{ width: 90, height: 90, margin: '0 auto 18px', display: 'block', filter: 'drop-shadow(0 0 24px #F59E0B)' }} />
                  ) : (
                    <div style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 18px', backgroundColor: 'rgba(245,158,11,0.15)', border: '3px solid rgba(245,158,11,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(245,158,11,0.45)' }}>
                      <Gift size={44} color="#F59E0B" strokeWidth={1.5} />
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F59E0B', margin: '0 0 8px' }}>Emblema super lendário</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 34, color: '#fff', margin: '0 0 8px', lineHeight: 1 }}>Você ganhou!</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', margin: '0 0 4px' }}>{boxReveal.payload?.badge_name ?? 'Emblema Exclusivo'}</p>
                  {boxReveal.payload?.type === 'badge_pending' && (
                    <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.40)', marginTop: 6 }}>Em breve disponível no seu perfil.</p>
                  )}
                </>
              )}

              <button
                onClick={() => { setBoxPhase('idle'); setBoxReveal(null); loadBalance() }}
                style={{
                  marginTop: 28, border: 'none', borderRadius: 100,
                  padding: '16px 44px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                  backgroundColor: boxReveal.category === 'lendaria' ? '#F59E0B' : '#E11D48',
                  color: boxReveal.category === 'lendaria' ? '#000' : '#fff',
                  boxShadow: boxReveal.category === 'lendaria' ? '0 8px 32px rgba(245,158,11,0.45)' : '0 8px 32px rgba(225,29,72,0.45)',
                }}
              >
                Boa!
              </button>
            </div>
          )}
        </div>
      )}

      {fichasModalOpen && (
        <CheckoutModal
          open={fichasModalOpen}
          onClose={() => setFichasModalOpen(false)}
          type="fichas"
          packageId={fichasPackageId}
          description={`Recarga de Fichas`}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes box-shake {
          0%,100%{transform:rotate(0) scale(1)}
          15%{transform:rotate(-12deg) scale(1.06)}
          30%{transform:rotate(12deg) scale(1.06)}
          45%{transform:rotate(-8deg) scale(1.03)}
          60%{transform:rotate(8deg) scale(1.03)}
          80%{transform:rotate(-4deg) scale(1.01)}
        }
        @keyframes box-jump {
          0%{transform:translateY(0) scale(1)}
          40%{transform:translateY(-55px) scale(1.22)}
          70%{transform:translateY(-30px) scale(1.12)}
          100%{transform:translateY(0) scale(1)}
        }
        @keyframes box-explode {
          0%{transform:scale(1);opacity:1;filter:blur(0)}
          60%{transform:scale(2.5);opacity:0.5;filter:blur(2px)}
          100%{transform:scale(4.5);opacity:0;filter:blur(8px)}
        }
        @keyframes box-reveal {
          0%{opacity:0;transform:scale(0.4) translateY(40px)}
          70%{transform:scale(1.06) translateY(-4px)}
          100%{opacity:1;transform:scale(1) translateY(0)}
        }
      `}</style>
    </div>
  )
}
