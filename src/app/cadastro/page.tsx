'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

function CadastroInner() {
  const searchParams = useSearchParams()
  const refCode      = searchParams.get('ref') ?? ''

  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [telefone, setTelefone]         = useState('')
  const [cpf, setCpf]                   = useState('')
  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [erro, setErro]                 = useState('')
  const [sucesso, setSucesso]           = useState(false)
  const [verSenha, setVerSenha]         = useState(false)
  const [cfToken, setCfToken]           = useState('')
  const turnstileRef                    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return

    // Carrega o script do Turnstile uma vez
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      document.head.appendChild(script)
    }

    // Callback global chamado pelo widget
    ;(window as any).onTurnstileSuccess = (token: string) => setCfToken(token)
    ;(window as any).onTurnstileExpired = () => setCfToken('')
  }, [])

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }

  const formatarCpf = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
  }

  const handleCadastro = async () => {
    setErro('')

    if (!nomeCompleto || !nomeExibicao || !telefone || !cpf || !email || !senha) {
      setErro('Preencha todos os campos')
      return
    }

    if (nomeCompleto.trim().split(' ').length < 2) {
      setErro('Informe seu nome completo (nome e sobrenome)')
      return
    }

    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10) {
      setErro('Telefone inválido')
      return
    }

    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setErro('CPF inválido')
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (TURNSTILE_SITE_KEY && !cfToken) {
      setErro('Complete a verificacao de segurança')
      return
    }

    setLoading(true)

    try {
      // 1. Criar conta
      const res = await fetch('/api/auth/cadastro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        email.trim().toLowerCase(),
          senha,
          nomeCompleto: nomeCompleto.trim(),
          nomeExibicao: nomeExibicao.trim(),
          telefone:     telefoneLimpo,
          cpf:          cpfLimpo,
          refCode,
          cfToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao criar conta')
        return
      }

      // 2. Login automático após cadastro
      const loginRes = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
      })

      if (loginRes.ok) {
        // Hard redirect para garantir que middleware leia os cookies
        window.location.href = '/onboarding'
      } else {
        setSucesso(true)
      }

    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
            Conta criada!
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Bem-vindo(a) ao MeAndYou, <strong style={{ color: 'var(--text)' }}>{nomeExibicao}</strong>!
            <br /><br />Faça login para continuar.
          </p>
          <Link href="/login" style={{ display: 'block', backgroundColor: 'var(--accent)', color: '#fff', padding: '14px 32px', borderRadius: '100px', textDecoration: 'none', fontWeight: '700', fontSize: '15px' }}>
            Fazer login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', marginBottom: '8px', color: 'var(--text)' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Crie sua conta e encontre conexões reais</p>
          {refCode && (
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '100px' }}>
              Voce foi convidado! Ganhe tickets de boas-vindas ao criar sua conta
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Nome completo</label>
              <input type="text" placeholder="Seu nome e sobrenome" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Usado apenas para verificação. Não aparece no perfil.</p>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Nome na plataforma</label>
              <input type="text" placeholder="Como quer ser chamado(a)" value={nomeExibicao} onChange={(e) => setNomeExibicao(e.target.value)} />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Este é o nome que outros usuários vão ver.</p>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>CPF</label>
              <input type="text" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} inputMode="numeric" />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Permite somente 1 conta por pessoa. Não é compartilhado.</p>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Telefone (WhatsApp)</label>
              <input type="tel" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Email</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Minimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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

            {TURNSTILE_SITE_KEY && (
              <div
                ref={turnstileRef}
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
                data-expired-callback="onTurnstileExpired"
                data-theme="dark"
                style={{ display: 'flex', justifyContent: 'center' }}
              />
            )}

            {erro && <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}

            <button className="btn-primary" onClick={handleCadastro} disabled={loading} style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Ja tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Entrar</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function Cadastro() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }} />}>
      <CadastroInner />
    </Suspense>
  )
}
