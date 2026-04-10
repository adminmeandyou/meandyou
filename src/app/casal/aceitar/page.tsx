'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { Heart, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function CasalAceitarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get('token')
  const token = tokenFromUrl ?? (typeof window !== 'undefined' ? sessionStorage.getItem('casal_invite_token') : null)

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        if (token) sessionStorage.setItem('casal_invite_token', token)
        window.location.href = `/login?redirect=/casal/aceitar`
        return
      }
      setLoading(false)
    })
  }, [token])

  async function handleAccept() {
    if (!token) return
    setAccepting(true)
    setError('')
    try {
      const res = await fetch('/api/casal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', token }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao aceitar convite')
        setAccepting(false)
        return
      }
      sessionStorage.removeItem('casal_invite_token')
      setDone(true)
      setTimeout(() => router.push('/configuracoes/casal'), 2500)
    } catch {
      setError('Erro de conexao. Tente novamente.')
      setAccepting(false)
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-jakarta)' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={40} color="rgba(225,29,72,0.6)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'rgba(248,249,250,0.5)', fontSize: 15, margin: 0 }}>Link invalido ou expirado.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="rgba(248,249,250,0.3)" className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#08090E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'var(--font-jakarta)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: '#F8F9FA' }}>
            Me<span style={{ color: '#E11D48' }}>And</span>You
          </span>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={40} color="#E11D48" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: '#F8F9FA', margin: 0 }}>
              Casal conectado!
            </h2>
            <p style={{ color: 'rgba(248,249,250,0.5)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Voces agora tem um perfil de casal Black.<br />Redirecionando...
            </p>
          </div>
        ) : (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <Heart size={40} color="#E11D48" fill="rgba(225,29,72,0.25)" strokeWidth={1.5} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: '#F8F9FA', margin: '0 0 12px' }}>
              Convite de casal
            </h2>
            <p style={{ color: 'rgba(248,249,250,0.5)', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
              Voce foi convidado(a) para criar um perfil de casal Black no MeAndYou.
              Aceite para conectar seus perfis.
            </p>

            {error && (
              <div style={{
                marginBottom: 20, padding: '10px 16px', borderRadius: 12,
                background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={14} color="#F43F5E" />
                <span style={{ fontSize: 13, color: '#F43F5E' }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: accepting ? 'rgba(225,29,72,0.5)' : '#E11D48',
                border: 'none', color: '#fff',
                fontFamily: 'var(--font-jakarta)', fontSize: 15, fontWeight: 700,
                cursor: accepting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
            >
              {accepting ? <Loader2 size={18} className="animate-spin" /> : <Heart size={16} />}
              {accepting ? 'Aceitando...' : 'Aceitar convite'}
            </button>

            <button
              onClick={() => router.push('/modos')}
              style={{
                marginTop: 14, background: 'none', border: 'none',
                color: 'rgba(248,249,250,0.35)', fontSize: 13,
                cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
              }}
            >
              Recusar e voltar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CasalAceitarPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="rgba(248,249,250,0.3)" className="animate-spin" />
      </div>
    }>
      <CasalAceitarContent />
    </Suspense>
  )
}
