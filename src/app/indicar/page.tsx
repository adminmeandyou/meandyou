'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { Gift, Copy, Check, Users, Share2, ArrowLeft, Ticket, TrendingUp, Zap } from 'lucide-react'

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
    if (!user) { setLoading(false); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, referral_code')
      .eq('id', user.id)
      .single()
    setProfile(prof)

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
      .select(`id, status, created_at, referred:referred_id ( name )`)
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
        text: 'Te convidei para o MeAndYou! Se cadastra pelo meu link e a gente ganha 5 tickets + 1000 XP de bônus:',
        url: getReferralLink(),
      })
    } else {
      copyLink()
    }
  }

  const rewarded = referrals.filter(r => r.status === 'rewarded').length
  const pending  = referrals.filter(r => r.status === 'pending').length
  const bonusBoostUnlocked = rewarded >= 3

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={17} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Indique e ganhe</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Você e seu amigo ganham bônus</p>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px', margin: '0 auto' }}>

        {/* O que voces ganham */}
        <div style={{ borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>O que vocês ganham</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(234,179,8,0.08)', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(234,179,8,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#eab308' }}>
                <Ticket size={22} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#eab308', margin: 0 }}>5 Tickets</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>cada um</p>
            </div>
            <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#10b981' }}>
                <TrendingUp size={22} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', margin: 0 }}>1.000 XP</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>cada um</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.20)', textAlign: 'center', margin: '12px 0 0' }}>
            Liberado quando o amigo fizer a primeira assinatura
          </p>
        </div>

        {/* Bonus ao indicar 3 */}
        <div style={{
          borderRadius: '16px', padding: '16px',
          backgroundColor: bonusBoostUnlocked ? 'var(--accent-light)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${bonusBoostUnlocked ? 'var(--accent-border)' : 'rgba(255,255,255,0.07)'}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{ color: bonusBoostUnlocked ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}>
            <Zap size={22} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: bonusBoostUnlocked ? 'var(--accent)' : 'var(--muted)', margin: 0 }}>
              {bonusBoostUnlocked ? '1 Boost bônus desbloqueado!' : '1 Boost bônus ao indicar 3 amigos'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '3px 0 0' }}>{rewarded}/3 amigos convertidos</p>
          </div>
          {bonusBoostUnlocked && <Check size={16} color="var(--accent)" strokeWidth={2} />}
        </div>

        {/* Seu codigo */}
        <div style={{ borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>Seu codigo de convite</p>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', border: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.15em', fontFamily: 'var(--font-fraunces)', color: 'var(--accent)' }}>
              {profile?.referral_code}
            </span>
            <button
              onClick={copyLink}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: copied ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
            >
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>

          <button
            onClick={shareNative}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-jakarta)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
          >
            <Share2 size={16} strokeWidth={1.5} />
            Compartilhar convite
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ borderRadius: '16px', padding: '18px 16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)', margin: 0, lineHeight: 1 }}>{rewarded}</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0' }}>Convertidas</p>
          </div>
          <div style={{ borderRadius: '16px', padding: '18px 16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', fontWeight: 700, color: 'var(--muted)', margin: 0, lineHeight: 1 }}>{pending}</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0' }}>Aguardando assinar</p>
          </div>
        </div>

        {/* Saldo atual */}
        <div style={{ borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>Seu saldo atual</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{saldo.superlikes}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>SuperLikes</p>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{saldo.boosts}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Boosts</p>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{saldo.rewinds}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Desfazer</p>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', margin: 0 }}>{saldo.tickets}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Tickets</p>
            </div>
          </div>
        </div>

        {/* Lista de indicacoes */}
        {referrals.length > 0 && (
          <div style={{ borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={12} strokeWidth={1.5} />
              Suas indicacoes ({referrals.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {referrals.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < referrals.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>{r.referred?.name ?? 'Usuario'}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px',
                    backgroundColor: r.status === 'rewarded' ? 'var(--accent-light)' : 'rgba(255,255,255,0.05)',
                    color: r.status === 'rewarded' ? 'var(--accent)' : 'var(--muted)',
                    border: `1px solid ${r.status === 'rewarded' ? 'var(--accent-border)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {r.status === 'rewarded' ? 'Recompensado' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
