'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Eye, EyeOff, Check } from 'lucide-react'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const TOTAL_STEPS = 7

function ProgressBar({ atual, total }: { atual: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '3px', borderRadius: '100px',
          backgroundColor: i < atual ? 'var(--accent)' : 'var(--border)',
          transition: 'background-color 0.3s',
        }} />
      ))}
    </div>
  )
}

function CadastroInner() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)

  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [verSenha, setVerSenha]         = useState(false)
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [cpf, setCpf]                   = useState('')
  const [telefone, setTelefone]         = useState('')
  const [temCodigo, setTemCodigo]       = useState<boolean | null>(null)
  const [refCode, setRefCode]           = useState(searchParams.get('ref') ?? '')

  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const turnstileRef          = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      document.head.appendChild(script)
    }
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

  const avancar = () => {
    setErro('')

    if (step === 0) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErro('Informe um email válido')
        return
      }
    }
    if (step === 1) {
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres')
        return
      }
    }
    if (step === 2) {
      if (nomeCompleto.trim().split(' ').length < 2) {
        setErro('Informe nome e sobrenome')
        return
      }
    }
    if (step === 3) {
      if (nomeExibicao.trim().length < 2) {
        setErro('O nome deve ter pelo menos 2 caracteres')
        return
      }
    }
    if (step === 4) {
      if (cpf.replace(/\D/g, '').length !== 11) {
        setErro('CPF inválido')
        return
      }
    }
    if (step === 5) {
      if (telefone.replace(/\D/g, '').length < 10) {
        setErro('Telefone inválido')
        return
      }
    }

    setStep(s => s + 1)
  }

  const handleCadastro = async () => {
    setErro('')
    if (TURNSTILE_SITE_KEY && !cfToken) {
      setErro('Complete a verificação de segurança')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/cadastro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        email.trim().toLowerCase(),
          senha,
          nomeCompleto: nomeCompleto.trim(),
          nomeExibicao: nomeExibicao.trim(),
          telefone:     telefone.replace(/\D/g, ''),
          cpf:          cpf.replace(/\D/g, ''),
          refCode,
          cfToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar conta'); return }

      const loginRes = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
      })
      if (loginRes.ok) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') step < 6 ? avancar() : handleCadastro()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 18px', fontSize: '18px',
    backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border)',
    borderRadius: '16px', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
  }

  const pergunta = (text: string, sub?: string) => (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: 'var(--text)', marginBottom: sub ? '6px' : 0, lineHeight: 1.25 }}>{text}</h2>
      {sub && <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '6px' }}>{sub}</p>}
    </div>
  )

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{
      padding: '12px 22px', borderRadius: '100px', fontSize: '15px', fontWeight: '600',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      backgroundColor: active ? 'var(--accent-light)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--muted)',
      cursor: 'pointer', transition: 'all 0.2s',
    }}>
      {active && <Check size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />}
      {label}
    </button>
  )

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>Conta criada!</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Bem-vindo(a) ao MeAndYou, <strong style={{ color: 'var(--text)' }}>{nomeExibicao}</strong>!<br /><br />Faça login para continuar.
          </p>
          <Link href="/login" style={{ display: 'block', backgroundColor: 'var(--accent)', color: '#fff', padding: '14px 32px', borderRadius: '100px', textDecoration: 'none', fontWeight: '700', fontSize: '15px' }}>
            Fazer login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          {step > 0 ? (
            <button onClick={() => { setErro(''); setStep(s => s - 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', padding: '8px 0', fontFamily: 'var(--font-jakarta)' }}>
              ← Voltar
            </button>
          ) : (
            <Link href="/" style={{ color: 'var(--muted)', fontSize: '14px', textDecoration: 'none' }}>← Início</Link>
          )}
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text)' }}>
            Me<span style={{ color: 'var(--accent)' }}>And</span>You
          </span>
          <span style={{ fontSize: '13px', color: 'var(--muted-2)', fontFamily: 'var(--font-jakarta)' }}>{step + 1}/{TOTAL_STEPS}</span>
        </div>
        <ProgressBar atual={step} total={TOTAL_STEPS} />
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, padding: '0 24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        {/* Passo 0: Email */}
        {step === 0 && (
          <>
            {pergunta('Qual é o seu email?')}
            <input
              type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle} autoComplete="email"
            />
          </>
        )}

        {/* Passo 1: Senha */}
        {step === 1 && (
          <>
            {pergunta('Crie uma senha', 'Mínimo de 6 caracteres')}
            <div style={{ position: 'relative' }}>
              <input
                type={verSenha ? 'text' : 'password'} placeholder="••••••••" value={senha}
                onChange={e => setSenha(e.target.value)} onKeyDown={handleKeyDown}
                autoFocus style={{ ...inputStyle, paddingRight: '52px' }} autoComplete="new-password"
              />
              <button type="button" onClick={() => setVerSenha(!verSenha)} aria-label={verSenha ? 'Ocultar senha' : 'Ver senha'}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                {verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </>
        )}

        {/* Passo 2: Nome completo */}
        {step === 2 && (
          <>
            {pergunta('Qual é o seu nome completo?', 'Usado apenas para verificação — não aparece no perfil')}
            <input
              type="text" placeholder="Nome e Sobrenome" value={nomeCompleto}
              onChange={e => setNomeCompleto(e.target.value)} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle} autoComplete="name"
            />
          </>
        )}

        {/* Passo 3: Nome de exibição */}
        {step === 3 && (
          <>
            {pergunta('Como quer ser chamado(a)?', 'Este é o nome que outros usuários vão ver')}
            <input
              type="text" placeholder={`Ex: ${nomeCompleto.split(' ')[0] || 'Ana'}`} value={nomeExibicao}
              onChange={e => setNomeExibicao(e.target.value)} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle}
            />
          </>
        )}

        {/* Passo 4: CPF */}
        {step === 4 && (
          <>
            {pergunta('Qual é o seu CPF?', 'Garante 1 conta por pessoa — não é compartilhado')}
            <input
              type="text" placeholder="000.000.000-00" value={cpf}
              onChange={e => setCpf(formatarCpf(e.target.value))} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle} inputMode="numeric"
            />
          </>
        )}

        {/* Passo 5: Telefone */}
        {step === 5 && (
          <>
            {pergunta('Qual é o seu celular?')}
            <input
              type="tel" placeholder="(00) 00000-0000" value={telefone}
              onChange={e => setTelefone(formatarTelefone(e.target.value))} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle}
            />
          </>
        )}

        {/* Passo 6: Código de convite + Turnstile */}
        {step === 6 && (
          <>
            {pergunta('Tem um código de convite?')}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {pill('Tenho um código', temCodigo === true, () => setTemCodigo(true))}
              {pill('Não tenho', temCodigo === false, () => { setTemCodigo(false); setRefCode('') })}
            </div>

            {temCodigo === true && (
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text" placeholder="Ex: ABC123" value={refCode}
                  onChange={e => setRefCode(e.target.value.trim().toUpperCase())}
                  autoFocus style={{ ...inputStyle, textTransform: 'uppercase' }}
                />
                {refCode && (
                  <p style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Voce vai ganhar tickets de boas-vindas!
                  </p>
                )}
              </div>
            )}

            {temCodigo !== null && TURNSTILE_SITE_KEY && (
              <div
                ref={turnstileRef}
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
                data-expired-callback="onTurnstileExpired"
                data-theme="dark"
                style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}
              />
            )}
          </>
        )}

        {erro && <p style={{ color: 'var(--red)', fontSize: '14px', marginTop: '16px' }}>{erro}</p>}
      </div>

      {/* Botão de ação */}
      <div style={{ padding: '20px 24px 44px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {step < 6 ? (
          <button onClick={avancar}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(225,29,72,0.25)' }}>
            Continuar <ChevronRight size={20} />
          </button>
        ) : (
          <button onClick={handleCadastro} disabled={loading || temCodigo === null}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: loading || temCodigo === null ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading || temCodigo === null ? 0.6 : 1, boxShadow: '0 8px 24px rgba(225,29,72,0.25)' }}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        )}

        {step === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', marginTop: '20px' }}>
            Ja tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Entrar</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default function Cadastro() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }} />}>
      <CadastroInner />
    </Suspense>
  )
}
