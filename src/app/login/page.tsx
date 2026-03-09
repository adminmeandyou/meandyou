'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [verSenha, setVerSenha]   = useState(false)

  const handleLogin = async () => {
    if (!email || !senha) {
      setErro('Preencha todos os campos')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Email ou senha incorretos')
        return
      }

      // Hard redirect garante que o middleware leia os cookies recém-setados
      window.location.href = '/busca'

    } catch {
      setErro('Erro de conexão. Tente novamente.')
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
          <h1 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '36px',
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Entre na sua conta</p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: 'var(--muted)', display: 'flex', alignItems: 'center',
                  }}
                  aria-label={verSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {verSenha ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link href="/recuperar-senha" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                Esqueci minha senha
              </Link>
            </div>

            {erro && (
              <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>
                {erro}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                Criar conta
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  )
}
