'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Crown, Share2, X, Check, Users } from 'lucide-react'
import Image from 'next/image'

type Partner = {
  id: string
  name: string
  photo_best: string | null
  plan: string
}

type Couple = {
  id: string
  user1_id: string
  user2_id: string | null
  status: 'pending' | 'active' | 'dissolved'
  invite_token: string
  created_at: string
  activated_at: string | null
  partner: Partner | null
}

export default function CasalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [plan, setPlan] = useState('essencial')
  const [creating, setCreating] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Buscar plano
      const { supabase } = await import('@/app/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setPlan(profile?.plan ?? 'essencial')

      // Buscar casal
      const res = await fetch('/api/casal')
      if (res.ok) {
        const data = await res.json()
        setCouple(data.couple)
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }

  async function criarConvite() {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/casal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar convite'); return }
      setInviteUrl(data.inviteUrl)
      await loadData()
    } catch { setError('Erro de conexão') }
    setCreating(false)
  }

  async function dissolver() {
    if (!couple || dissolving) return
    if (!confirm('Tem certeza? O perfil de casal será desativado para os dois.')) return
    setDissolving(true)
    try {
      const res = await fetch('/api/casal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dissolve', coupleId: couple.id }),
      })
      if (res.ok) {
        setCouple(null)
        setInviteUrl('')
      }
    } catch { /* silencioso */ }
    setDissolving(false)
  }

  async function copiarLink() {
    const url = inviteUrl || (couple?.invite_token ? `https://www.meandyou.com.br/casal/aceitar?token=${couple.invite_token}` : '')
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      if (navigator.share) {
        navigator.share({ title: 'Perfil de casal MeAndYou', url })
      }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(225,29,72,0.3)', borderTop: '3px solid var(--accent)', animation: 'ui-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 24px' }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>Perfil de Casal</h1>
        <Crown size={18} color="#F59E0B" />
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Sem plano Black */}
        {plan !== 'black' && (
          <div style={{ padding: '24px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <Crown size={40} color="#F59E0B" strokeWidth={1} style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, margin: '0 0 8px' }}>Exclusivo Black</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              O perfil de casal é exclusivo para assinantes do plano Black. Faça upgrade para ativar.
            </p>
            <button
              onClick={() => router.push('/planos')}
              style={{ padding: '13px 24px', borderRadius: 12, backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Ver planos
            </button>
          </div>
        )}

        {/* Tem plano Black */}
        {plan === 'black' && (
          <>
            {/* Casal ativo */}
            {couple?.status === 'active' && couple.partner && (
              <div>
                <div style={{ padding: '20px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', width: 100 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--accent)', overflow: 'hidden', backgroundColor: 'var(--bg-card2)', position: 'absolute', left: 0, zIndex: 2 }}>
                        {couple.partner.photo_best ? (
                          <img src={couple.partner.photo_best} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} color="var(--muted)" />
                          </div>
                        )}
                      </div>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #F59E0B', overflow: 'hidden', backgroundColor: 'var(--bg-card2)', position: 'absolute', left: 40, zIndex: 1 }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.1)' }}>
                          <Crown size={24} color="#F59E0B" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, margin: '0 0 4px' }}>
                      Casal ativo com {couple.partner.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#F59E0B', margin: 0 }}>
                      Perfil duplo ativado — aparece no feed como casal
                    </p>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#10b981', margin: '0 0 4px', fontWeight: 600 }}>Beneficios ativos</p>
                  <p style={{ fontSize: 12, color: 'rgba(16,185,129,0.7)', margin: 0, lineHeight: 1.5 }}>
                    Seu parceiro tem 50% de desconto enquanto o casal estiver ativo. O card de casal aparece no feed de busca dos outros usuários.
                  </p>
                </div>

                <button
                  onClick={dissolver}
                  disabled={dissolving}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.07)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                >
                  {dissolving ? 'Desfazendo...' : 'Desfazer perfil de casal'}
                </button>
              </div>
            )}

            {/* Convite pendente */}
            {couple?.status === 'pending' && (
              <div>
                <div style={{ padding: '20px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16, textAlign: 'center' }}>
                  <Heart size={40} color="#F59E0B" strokeWidth={1} style={{ marginBottom: 12 }} />
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, margin: '0 0 8px' }}>Convite enviado</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                    Compartilhe o link abaixo com seu parceiro(a). Assim que ele(a) aceitar, o perfil de casal será ativado.
                  </p>
                  <button
                    onClick={copiarLink}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 12, backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-card2)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, color: copied ? '#10b981' : 'var(--text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                    {copied ? 'Link copiado!' : 'Copiar link de convite'}
                  </button>
                </div>

                <button
                  onClick={dissolver}
                  disabled={dissolving}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent', color: '#f87171', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                >
                  Cancelar convite
                </button>
              </div>
            )}

            {/* Sem casal */}
            {!couple && (
              <div>
                <div style={{ padding: '24px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={32} color="var(--accent)" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, textAlign: 'center', margin: '0 0 10px' }}>Perfil de Casal</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                    Apareça no feed como casal. Seu parceiro(a) recebe 50% de desconto na assinatura enquanto o casal estiver ativo.
                  </p>
                </div>

                {[
                  'Card duplo no feed de outros usuários',
                  '50% de desconto para seu parceiro(a)',
                  'Ver perfis um do outro no mesmo card',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={11} color="#10b981" />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}

                {error && <p style={{ fontSize: 13, color: 'var(--accent)', margin: '12px 0' }}>{error}</p>}

                <button
                  onClick={criarConvite}
                  disabled={creating}
                  style={{ width: '100%', marginTop: 20, padding: '15px', borderRadius: 14, backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'Gerando convite...' : 'Criar perfil de casal'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
