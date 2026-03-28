'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Trash2, AlertTriangle, Eye, EyeOff, Loader2,
  ShieldAlert, Pause, MessageCircle, CheckCircle,
} from 'lucide-react'

type Step = 'aviso' | 'pausar' | 'motivo' | 'confirmar'

const MOTIVOS = [
  'Encontrei alguem',
  'Poucas curtidas ou matches',
  'App muito caro',
  'Problemas tecnicos',
  'Privacidade',
  'Outro motivo',
]

export default function DeletarContaPage() {
  const router = useRouter()
  const [step, setStep]           = useState<Step>('aviso')
  const [senha, setSenha]         = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [motivo, setMotivo]       = useState('')
  const [pausando, setPausando]   = useState(false)

  const steps: Step[] = ['aviso', 'pausar', 'motivo', 'confirmar']

  function handleBack() {
    if (step === 'pausar') setStep('aviso')
    else if (step === 'motivo') setStep('pausar')
    else if (step === 'confirmar') setStep('motivo')
    else router.back()
  }

  async function handlePausar() {
    setPausando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      try {
        await supabase.from('profiles').update({ incognito_until: until }).eq('id', user.id)
      } catch { /* segue de qualquer forma */ }
    }
    setPausando(false)
    router.replace('/perfil?paused=1')
  }

  async function handleDelete() {
    if (!senha.trim()) { setError('Digite sua senha para confirmar.'); return }
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha,
    })
    if (loginErr) {
      setError('Senha incorreta. Tente novamente.')
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/auth/deletar-conta', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ motivo }),
    })

    setLoading(false)

    if (res.ok) {
      document.cookie = 'sb-access-token=; Max-Age=0; path=/'
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
      window.location.href = '/'
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Erro ao excluir conta. Tente novamente ou contate o suporte.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={handleBack}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '19px', margin: 0 }}>
            Excluir conta
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', margin: '1px 0 0' }}>
            Ação permanente e irreversível
          </p>
        </div>
        {/* Indicador de etapa */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {steps.map((s) => (
            <div
              key={s}
              style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: s === step ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 16px 0' }}>

        {/* ── ETAPA 1: Aviso ── */}
        {step === 'aviso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={36} color="#f87171" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '24px', margin: '0 0 8px' }}>
                  Tem certeza?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Ao excluir sua conta, todos os seus dados serão removidos permanentemente, incluindo matches, conversas e fotos.
                </p>
              </div>
            </div>

            <div style={{
              borderRadius: '16px', padding: '16px',
              backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.20)',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <p style={{ color: '#f87171', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.4px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={12} /> O que sera excluido permanentemente
              </p>
              {[
                'Perfil e fotos',
                'Todos os matches e conversas',
                'Histórico de curtidas',
                'Saldo de SuperLikes, Boosts, Lupas e tickets',
                'Assinatura ativa (sem reembolso)',
                'Indicações e bônus pendentes',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px' }}>{item}</span>
                </div>
              ))}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: '12px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
              Em conformidade com a LGPD, todos os seus dados pessoais serão removidos de nossos servidores após a exclusão.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setStep('pausar')}
                style={{
                  width: '100%', padding: '15px 16px', borderRadius: '14px',
                  backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                  color: '#f87171', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Continuar com a exclusão
              </button>
              <button
                onClick={() => router.back()}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.50)', fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Cancelar - manter minha conta
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 2: Pausar ── */}
        {step === 'pausar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '8px', textAlign: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Pause size={36} color="#60a5fa" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '24px', margin: '0 0 8px' }}>
                  Antes de ir...
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Você pode pausar sua conta por 30 dias. Seu perfil fica oculto e ninguém te vê - mas seus dados continuam salvos quando voltar.
                </p>
              </div>
            </div>

            <div style={{
              borderRadius: '16px', padding: '16px',
              backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <p style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.4px', margin: '0 0 2px' }}>
                Se você pausar, mantém:
              </p>
              {[
                'Seus matches e conversas intactos',
                'Saldo de SuperLikes, Lupas e Tickets',
                'Seu perfil e todas as fotos',
                'Histórico de indicações e bônus',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: 'rgba(59,130,246,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: '13px' }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handlePausar}
                disabled={pausando}
                style={{
                  width: '100%', padding: '15px 16px', borderRadius: '14px',
                  backgroundColor: '#2563eb', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '14px', cursor: pausando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: pausando ? 0.6 : 1, fontFamily: 'var(--font-jakarta)',
                }}
              >
                {pausando ? <Loader2 size={16} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Pause size={16} color="#fff" />}
                {pausando ? 'Pausando...' : 'Pausar minha conta por 30 dias'}
              </button>
              <button
                onClick={() => setStep('motivo')}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.20)',
                  color: 'rgba(248,113,113,0.70)', fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Não, quero excluir mesmo assim
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 3: Motivo ── */}
        {step === 'motivo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '8px', textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={28} color="rgba(255,255,255,0.40)" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '20px', margin: '0 0 6px' }}>
                  Por que voce esta saindo?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '13px', margin: 0 }}>
                  Seu feedback nos ajuda a melhorar.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMotivo(motivo === m ? '' : m)}
                  style={{
                    padding: '10px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
                    border: `1.5px solid ${motivo === m ? 'var(--accent)' : 'rgba(255,255,255,0.10)'}`,
                    backgroundColor: motivo === m ? 'rgba(225,29,72,0.12)' : 'transparent',
                    color: motivo === m ? '#F43F5E' : 'rgba(255,255,255,0.40)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('confirmar')}
              style={{
                width: '100%', padding: '15px 16px', borderRadius: '14px',
                backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                color: '#f87171', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                fontFamily: 'var(--font-jakarta)',
              }}
            >
              {motivo ? 'Continuar' : 'Pular e continuar'}
            </button>
          </div>
        )}

        {/* ── ETAPA 4: Confirmar senha ── */}
        {step === 'confirmar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '8px', textAlign: 'center' }}>
              <AlertTriangle size={32} color="#f87171" />
              <h2 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '20px', margin: 0 }}>
                Confirme sua senha
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Digite sua senha para confirmar a exclusao definitiva da conta.
              </p>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: '8px' }}>
                Sua senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                  placeholder="Digite sua senha"
                  autoFocus
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                    color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-jakarta)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setShowSenha(!showSenha)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.30)',
                  }}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px',
                borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)',
              }}>
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0 }} />
                <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleDelete}
                disabled={loading || !senha.trim()}
                style={{
                  width: '100%', padding: '15px 16px', borderRadius: '14px',
                  backgroundColor: loading || !senha.trim() ? 'rgba(239,68,68,0.40)' : '#dc2626',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px',
                  cursor: loading || !senha.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                {loading
                  ? <><Loader2 size={16} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} /> Excluindo...</>
                  : <><Trash2 size={16} color="#fff" /> Excluir minha conta definitivamente</>
                }
              </button>
              <button
                onClick={() => { setStep('aviso'); setSenha(''); setError(null) }}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.50)', fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.20); }
        input:focus { border-color: rgba(225,29,72,0.40) !important; }
        button:hover { opacity: 0.88; }
      `}</style>
    </div>
  )
}
