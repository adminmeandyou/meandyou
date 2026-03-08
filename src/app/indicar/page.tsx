'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { Gift, Copy, Check, Users, Share2, ArrowLeft, Ticket, Star } from 'lucide-react'

export default function IndicarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [saldo, setSaldo] = useState({ superlikes: 0, boosts: 0, rewinds: 0, tickets: 0 })
  const [referrals, setReferrals] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // referral_code fica em profiles
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, referral_code')
      .eq('id', user.id)
      .single()
    setProfile(prof)

    // Saldos nas tabelas corretas — NUNCA em profiles
    const [{ data: sl }, { data: bo }, { data: rw }, { data: tk }] = await Promise.all([
      supabase.from('user_superlikes').select('amount').eq('user_id', user.id).single(),
      supabase.from('user_boosts').select('amount').eq('user_id', user.id).single(),
      supabase.from('user_rewinds').select('amount').eq('user_id', user.id).single(),
      supabase.from('user_tickets').select('amount').eq('user_id', user.id).single(),
    ])
    setSaldo({
      superlikes: sl?.amount ?? 0,
      boosts: bo?.amount ?? 0,
      rewinds: rw?.amount ?? 0,
      tickets: tk?.amount ?? 0,
    })

    const { data: refs } = await supabase
      .from('referrals')
      .select(`
        id, status, created_at,
        referred:referred_id ( name )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
    setReferrals(refs ?? [])

    setLoading(false)
  }

  function getReferralLink() {
    return `https://www.meandyou.com.br/cadastro?ref=${profile?.referral_code}`
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getReferralLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({
        title: 'MeAndYou',
        text: '💘 Te convidei para o MeAndYou! Se cadastra pelo meu link e a gente ganha tickets de bônus:',
        url: getReferralLink(),
      })
    } else {
      copyLink()
    }
  }

  const rewarded = referrals.filter(r => r.status === 'rewarded').length
  const pending  = referrals.filter(r => r.status === 'pending').length

  // Bônus ao indicar 3 amigos
  const bonusBoostUnlocked = rewarded >= 3

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8f542] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta text-white pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Indique e ganhe</h1>
          <p className="text-white/30 text-xs">Você e seu amigo ganham bônus</p>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-4 max-w-md mx-auto">

        {/* O que vocês ganham — recompensas corretas per skill */}
        <div className="rounded-2xl p-4 bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">O que vocês ganham</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🎟️</div>
              <p className="text-xs text-white/60 font-semibold">3 Tickets</p>
              <p className="text-white/30 text-xs">cada um</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-xs text-white/60 font-semibold">1 SuperLike</p>
              <p className="text-white/30 text-xs">quem indicou</p>
            </div>
          </div>
          <p className="text-xs text-white/20 text-center mt-3">
            Liberado quando o amigo fizer a primeira assinatura
          </p>
        </div>

        {/* Bônus ao indicar 3 */}
        <div className={`rounded-2xl p-4 border flex items-center gap-3 ${bonusBoostUnlocked ? 'bg-[#b8f542]/10 border-[#b8f542]/30' : 'bg-white/3 border-white/8'}`}>
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${bonusBoostUnlocked ? 'text-[#b8f542]' : 'text-white/50'}`}>
              {bonusBoostUnlocked ? '1 Boost bônus desbloqueado!' : '1 Boost bônus ao indicar 3 amigos'}
            </p>
            <p className="text-white/30 text-xs">{rewarded}/3 amigos convertidos</p>
          </div>
          {bonusBoostUnlocked && <Check size={16} className="text-[#b8f542]" />}
        </div>

        {/* Seu código */}
        <div className="rounded-2xl p-4 bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Seu código de convite</p>
          <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
            <span className="text-xl font-bold tracking-widest font-fraunces text-[#b8f542]">
              {profile?.referral_code}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition"
            >
              {copied ? <Check size={14} className="text-[#b8f542]" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>

          {/* Botão de compartilhamento nativo */}
          <button
            onClick={shareNative}
            className="w-full py-3 rounded-xl bg-[#b8f542] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#a8e030] transition"
          >
            <Share2 size={16} />
            Compartilhar convite
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 bg-white/3 border border-white/8 text-center">
            <p className="text-3xl font-bold font-fraunces text-[#b8f542]">{rewarded}</p>
            <p className="text-xs text-white/30 mt-1">Convertidas</p>
          </div>
          <div className="rounded-2xl p-4 bg-white/3 border border-white/8 text-center">
            <p className="text-3xl font-bold font-fraunces text-white/50">{pending}</p>
            <p className="text-xs text-white/30 mt-1">Aguardando assinar</p>
          </div>
        </div>

        {/* Saldo atual — tabelas corretas */}
        <div className="rounded-2xl p-4 bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Seu saldo atual</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xl font-bold">{saldo.superlikes}</p>
              <p className="text-xs text-white/30">SuperLikes</p>
            </div>
            <div>
              <p className="text-xl font-bold">{saldo.boosts}</p>
              <p className="text-xs text-white/30">Boosts</p>
            </div>
            <div>
              <p className="text-xl font-bold">{saldo.rewinds}</p>
              <p className="text-xs text-white/30">Desfazer</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-400">{saldo.tickets}</p>
              <p className="text-xs text-white/30">Tickets</p>
            </div>
          </div>
        </div>

        {/* Lista de indicações */}
        {referrals.length > 0 && (
          <div className="rounded-2xl p-4 bg-white/3 border border-white/8">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users size={12} /> Suas indicações ({referrals.length})
            </p>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white/70">{r.referred?.name ?? 'Usuário'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'rewarded'
                      ? 'bg-[#b8f542]/20 text-[#b8f542]'
                      : 'bg-white/5 text-white/30'
                  }`}>
                    {r.status === 'rewarded' ? '✓ Recompensado' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
