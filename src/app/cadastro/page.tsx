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
          background: i < atual
            ? 'linear-gradient(90deg, #E11D48, #F43F5E)'
            : 'rgba(255,255,255,0.06)',
          transition: 'background 0.4s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: i < atual ? '0 0 8px rgba(225,29,72,0.3)' : 'none',
        }} />
      ))}
    </div>
  )
}

const DRAFT_KEY = 'meandyou_cadastro_draft'

function salvarRascunho(dados: Record<string, unknown>) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(dados)) } catch {}
}
function limparRascunho() {
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}
function carregarRascunho() {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

function CadastroInner() {
  const searchParams = useSearchParams()

  // Carrega rascunho salvo (se existir)
  const draft = typeof window !== 'undefined' ? carregarRascunho() : null

  const [step, setStep] = useState<number>(draft?.step ?? 0)

  const [email, setEmail]               = useState<string>(draft?.email ?? '')
  const [senha, setSenha]               = useState('')
  const [verSenha, setVerSenha]         = useState(false)
  const [nomeCompleto, setNomeCompleto] = useState<string>(draft?.nomeCompleto ?? '')
  const [nomeExibicao, setNomeExibicao] = useState<string>(draft?.nomeExibicao ?? '')
  const [cpf, setCpf]                   = useState<string>(draft?.cpf ?? '')
  const [telefone, setTelefone]         = useState<string>(draft?.telefone ?? '')
  const [temCodigo, setTemCodigo]       = useState<boolean | null>(draft?.temCodigo ?? null)
  const [refCode, setRefCode]           = useState<string>(draft?.refCode ?? searchParams.get('ref') ?? '')

  const [loading, setLoading]     = useState(false)
  const [avancando, setAvancando] = useState(false)
  const [erro, setErro]           = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const turnstileRef          = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    ;(window as any).onTurnstileSuccess = (token: string) => setCfToken(token)
    ;(window as any).onTurnstileExpired  = () => setCfToken('')
    ;(window as any).__cfTurnstileReady  = false
    ;(window as any).__cfTurnstileOnLoad = () => { ;(window as any).__cfTurnstileReady = true }

    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id   = 'cf-turnstile-script'
      script.src  = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__cfTurnstileOnLoad'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  // Renderiza Turnstile a partir do step 5 (pré-carrega escondido) — tenta até o script estar pronto
  useEffect(() => {
    if (step < 5 || !TURNSTILE_SITE_KEY) return

    let attempts = 0
    const MAX = 40 // 20 segundos (40 × 500ms)

    function tryRender() {
      const win = window as any
      if (win.turnstile && turnstileRef.current) {
        try { win.turnstile.remove(turnstileRef.current) } catch {}
        setCfToken('')
        win.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setCfToken(token),
          'expired-callback': () => setCfToken(''),
          theme: 'dark',
        })
      } else if (attempts < MAX) {
        attempts++
        setTimeout(tryRender, 500)
      }
    }

    // Pequena espera inicial para o DOM estabilizar
    const timer = setTimeout(tryRender, 100)
    return () => clearTimeout(timer)
  }, [step])

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

  // Salva rascunho sempre que um campo muda (exceto senha e token)
  useEffect(() => {
    if (step === 0 && !email) return // não salva vazio
    salvarRascunho({ step, email, nomeCompleto, nomeExibicao, cpf, telefone, temCodigo, refCode })
  }, [step, email, nomeCompleto, nomeExibicao, cpf, telefone, temCodigo, refCode])

  const avancar = () => {
    if (avancando) return
    setErro('')

    if (step === 0) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErro('Informe um email válido.')
        return
      }
    }
    if (step === 1) {
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres.')
        return
      }
    }
    if (step === 2) {
      if (nomeCompleto.trim().split(' ').length < 2) {
        setErro('Informe nome e sobrenome.')
        return
      }
    }
    if (step === 3) {
      if (nomeExibicao.trim().length < 2) {
        setErro('O nome deve ter pelo menos 2 caracteres.')
        return
      }
    }
    if (step === 4) {
      if (cpf.replace(/\D/g, '').length !== 11) {
        setErro('CPF inválido.')
        return
      }
    }
    if (step === 5) {
      if (telefone.replace(/\D/g, '').length < 10) {
        setErro('Telefone inválido.')
        return
      }
    }

    setAvancando(true)
    setTimeout(() => {
      setAvancando(false)
      setStep(s => s + 1)
    }, 700)
  }

  function resetTurnstile() {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return
    const win = window as any
    if (win.turnstile) {
      try { win.turnstile.remove(turnstileRef.current) } catch {}
      setCfToken('')
      win.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCfToken(token),
        'expired-callback': () => setCfToken(''),
        theme: 'dark',
      })
    }
  }

  const handleCadastro = async () => {
    setErro('')
    if (TURNSTILE_SITE_KEY && !cfToken) {
      setErro('Complete a verificação de segurança.')
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
      if (!res.ok) {
        setErro(data.error || 'Erro ao criar conta.')
        resetTurnstile() // token já foi consumido — gera um novo
        return
      }

      const loginRes = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
      })
      limparRascunho()
      if (loginRes.ok) {
        window.location.href = '/aguardando-email'
      } else {
        setSucesso(true)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      resetTurnstile()
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') step < 6 ? avancar() : handleCadastro()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 18px', fontSize: '18px',
    backgroundColor: 'var(--bg-card2)', border: '1.5px solid rgba(255,255,255,0.07)',
    borderRadius: '16px', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  }

  const pergunta = (text: string, sub?: string) => (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: sub ? '8px' : 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{text}</h2>
      {sub && <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>{sub}</p>}
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)', letterSpacing: '-0.01em' }}>Conta criada!</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Bem-vindo(a) ao MeAndYou, <strong style={{ color: 'var(--text)' }}>{nomeExibicao}</strong>!<br /><br />Faça login para continuar.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
            Fazer login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(225,29,72,0.05) 0%, transparent 60%), var(--bg)' }}>

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
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
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
            {pergunta('Qual é o seu nome completo?', 'Usado apenas para verificação. Não aparece no perfil.')}
            <input
              type="text" placeholder="Nome completo" value={nomeCompleto}
              onChange={e => setNomeCompleto(e.target.value)} onKeyDown={handleKeyDown}
              autoFocus style={inputStyle} autoComplete="name"
            />
          </>
        )}

        {/* Passo 3: Nome de exibição */}
        {step === 3 && (
          <>
            {pergunta('Como quer ser chamado(a)?', 'Este é o nome que outros usuários vão ver.')}
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
            {pergunta('Qual é o seu CPF?', 'Garante 1 conta por pessoa. Não é compartilhado.')}
            <input
              type="text" placeholder="000.000.000-00" value={cpf}
              onChange={e => {
                const formatted = formatarCpf(e.target.value)
                setCpf(formatted)
                if (formatted.replace(/\D/g, '').length === 11) {
                  setErro('')
                  setAvancando(true)
                  setTimeout(() => { setAvancando(false); setStep(s => s + 1) }, 700)
                }
              }}
              onKeyDown={handleKeyDown}
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
              onChange={e => {
                const formatted = formatarTelefone(e.target.value)
                setTelefone(formatted)
                if (formatted.replace(/\D/g, '').length === 11) {
                  setErro('')
                  setAvancando(true)
                  setTimeout(() => { setAvancando(false); setStep(s => s + 1) }, 700)
                }
              }}
              onKeyDown={handleKeyDown}
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
                    <Check size={14} /> Você vai ganhar fichas de boas-vindas!
                  </p>
                )}
              </div>
            )}

          </>
        )}

        {/* Turnstile — sempre no DOM a partir do step 5, visível só no step 6 */}
        {TURNSTILE_SITE_KEY && (
          <div style={{ display: step === 6 ? 'block' : 'none' }}>
            <div
              ref={turnstileRef}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}
            />
            {step === 6 && !cfToken && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={resetTurnstile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)', textDecoration: 'underline', padding: '4px 8px' }}
                >
                  Verificação não carregou? Recarregar
                </button>
              </div>
            )}
          </div>
        )}

        {erro && <p style={{ color: 'var(--red)', fontSize: '14px', marginTop: '16px' }}>{erro}</p>}
      </div>

      {/* Botão de ação */}
      <div style={{ padding: '20px 24px 44px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {step < 6 ? (
          avancando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <button
              onClick={avancar}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              Continuar <ChevronRight size={18} strokeWidth={2} />
            </button>
          )
        ) : (
          <button
            onClick={temCodigo === null ? () => setErro('Escolha uma das opções acima para continuar.') : handleCadastro}
            disabled={loading || (!!TURNSTILE_SITE_KEY && !cfToken && temCodigo !== null)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? 'Criando conta...' : (!!TURNSTILE_SITE_KEY && !cfToken && temCodigo !== null) ? 'Aguardando verificação...' : 'Criar conta'}
          </button>
        )}

        {step === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', marginTop: '20px' }}>
            Já tem conta?{' '}
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
