'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RecuperarSenha() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro]       = useState('')

  const handleEnviar = async () => {
    setErro('')
    if (!email) {
      setErro('Digite seu email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErro('Email inválido')
      return
    }

    setLoading(true)
    try {
      await fetch('/api/auth/recuperar-senha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      // Sempre mostra sucesso — nunca revela se o email existe (segurança)
      setEnviado(true)
    } catch {
      setEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '38px', marginBottom: '10px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
            </h1>
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: '15px', letterSpacing: '0.01em' }}>Recuperar senha</p>
        </div>

        <div style={{
          background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative' as const,
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.3), transparent)' }} />
          {!enviado ? (
            <>
              <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--accent-dark)', lineHeight: 1.6, margin: 0 }}>
                  Digite o email cadastrado. Enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {erro && (
                  <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>
                )}

                <button
                  className="btn-primary"
                  onClick={handleEnviar}
                  disabled={loading}
                  style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>

                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                  Lembrou a senha?{' '}
                  <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                    Fazer login
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', marginBottom: '12px', color: 'var(--text)' }}>
                Email enviado!
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                Se existe uma conta com o email <strong style={{ color: 'var(--text)' }}>{email}</strong>,
                você receberá um link para redefinir sua senha em instantes.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px' }}>
                Não recebeu? Verifique a pasta de spam. Pode levar até 5 minutos.
              </p>
              <Link href="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                Voltar para o login
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
