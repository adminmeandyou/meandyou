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
      setErro('Digite seu e-mail')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErro('E-mail inválido')
      return
    }

    setLoading(true)
    try {
      await fetch('/api/auth/recuperar-senha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      // Sempre mostra sucesso — nunca revela se o e-mail existe (segurança)
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
      backgroundColor: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', marginBottom: '8px', color: 'var(--text)' }}>
              MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
            </h1>
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Recuperar senha</p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow)',
        }}>
          {!enviado ? (
            <>
              <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--accent-dark)', lineHeight: 1.6, margin: 0 }}>
                  Digite o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                    E-mail
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
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', marginBottom: '12px', color: 'var(--text)' }}>
                E-mail enviado!
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                Se existe uma conta com o e-mail <strong style={{ color: 'var(--text)' }}>{email}</strong>,
                você receberá um link para redefinir sua senha em instantes.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px' }}>
                Não recebeu? Verifique a pasta de spam ou aguarde alguns minutos.
              </p>
              <Link href="/login" style={{ display: 'block', padding: '14px', borderRadius: '100px', backgroundColor: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '15px', textAlign: 'center' }}>
                Voltar ao login
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
