'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function NovaSenhaInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/recuperar-senha')
    }
  }, [token])

  const handleRedefinir = async () => {
    setLoading(true)
    setErro('')

    if (!senha || !confirmar) {
      setErro('Preencha todos os campos obrigatórios.')
      setLoading(false)
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas não coincidem')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/nova-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErro(data.error || 'Erro ao redefinir senha')
    } else {
      setSucesso(true)
      setTimeout(() => router.push('/login'), 3000)
    }

    setLoading(false)
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
            Senha redefinida!
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
            Sua senha foi alterada com sucesso. Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '38px', marginBottom: '10px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', letterSpacing: '0.01em' }}>Crie uma nova senha</p>
        </div>
        <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'relative' as const, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.3), transparent)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Nova senha
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Confirmar senha
              </label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            {erro && <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}
            <button
              className="btn-primary"
              onClick={handleRedefinir}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function NovaSenha() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }} />}>
      <NovaSenhaInner />
    </Suspense>
  )
}
