'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Gift, Copy, Check, Users, Share2 } from 'lucide-react'

export default function IndicarPage() {
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, referral_code, super_likes, boosts, rewinds')
      .eq('id', user.id)
      .single()
    setProfile(prof)

    const { data: refs } = await supabase
      .from('referrals')
      .select(`
        id, status, created_at, rewarded_at,
        referred:referred_id ( name )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
    setReferrals(refs || [])

    setLoading(false)
  }

  function getReferralLink() {
    return `${window.location.origin}/cadastro?ref=${profile?.referral_code}`
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getReferralLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: 'MeAndYou',
        text: '💘 Te convidei para o MeAndYou! Cadastra pelo meu link e a gente ganha SuperLikes, Boost e mais:',
        url: getReferralLink(),
      })
    } else {
      copyLink()
    }
  }

  const rewarded = referrals.filter(r => r.status === 'rewarded').length
  const pending = referrals.filter(r => r.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-rose-900/40 to-transparent pt-12 pb-8 px-4 text-center">
        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold font-[Fraunces] mb-1">Indique e ganhe</h1>
        <p className="text-sm text-zinc-400">
          Você e seu amigo ganham SuperLikes, Boost e mais quando ele assinar
        </p>
      </div>

      <div className="px-4 space-y-4 max-w-md mx-auto">

        {/* Recompensas */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">O que vocês ganham</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { emoji: '⚡', label: '3 SuperLikes' },
              { emoji: '🚀', label: '1 Boost' },
              { emoji: '↩️', label: '1 Desfazer' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-800 rounded-xl p-3">
                <div className="text-2xl mb-1">{item.emoji}</div>
                <p className="text-xs text-zinc-300">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 text-center mt-3">
            Recompensa liberada quando o amigo fizer a primeira assinatura
          </p>
        </div>

        {/* Seu código */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Seu código</p>
          <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
            <span className="text-xl font-bold tracking-widest font-[Fraunces] text-rose-400">
              {profile?.referral_code}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
          <button
            onClick={shareLink}
            className="w-full bg-rose-500 hover:bg-rose-600 transition-colors rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar convite
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold font-[Fraunces]">{rewarded}</p>
            <p className="text-xs text-zinc-500 mt-1">Indicações convertidas</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold font-[Fraunces]">{pending}</p>
            <p className="text-xs text-zinc-500 mt-1">Aguardando assinar</p>
          </div>
        </div>

        {/* Saldo atual */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Seu saldo atual</p>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xl font-bold">{profile?.super_likes ?? 0}</p>
              <p className="text-xs text-zinc-500">SuperLikes</p>
            </div>
            <div>
              <p className="text-xl font-bold">{profile?.boosts ?? 0}</p>
              <p className="text-xs text-zinc-500">Boosts</p>
            </div>
            <div>
              <p className="text-xl font-bold">{profile?.rewinds ?? 0}</p>
              <p className="text-xs text-zinc-500">Desfazer</p>
            </div>
          </div>
        </div>

        {/* Lista de indicações */}
        {referrals.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Suas indicações
            </p>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm">{r.referred?.name ?? 'Usuário'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'rewarded'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-700 text-zinc-400'
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