'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail } from 'lucide-react'

export default function AlterarEmailPage() {
  const router = useRouter()
  const [emailAtual, setEmailAtual] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmailAtual(user.email ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!novoEmail) { setErro('Digite o novo email'); return }
    if (!novoEmail.includes('@')) { setErro('Email inválido'); return }
    if (novoEmail.toLowerCase() === emailAtual.toLowerCase()) {
      setErro('O novo email deve ser diferente do atual')
      return
    }

    setEnviando(true); setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/auth/alterar-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ novo_email: novoEmail }),
    })
    const json = await res.json()
    setEnviando(false)

    if (!res.ok) {
      setErro(json.error ?? 'Erro ao enviar email')
      return
    }

    setSucesso(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: 0 }}>Alterar email</h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px' }}>

        {sucesso ? (
          <div style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 10px' }}>Email de confirmacao enviado</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Enviamos um link de confirmacao para <strong style={{ color: '#fff' }}>{novoEmail}</strong>. Clique no link para confirmar a alteracao. O link expira em 30 minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Email atual
              </label>
              <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
                {emailAtual}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Novo email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={novoEmail}
                  onChange={e => setNovoEmail(e.target.value)}
                  placeholder="novo@email.com"
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {erro && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: enviando ? 0.6 : 1 }}
            >
              {enviando ? 'Enviando...' : 'Enviar link de confirmacao'}
            </button>

            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              Um email de confirmacao sera enviado para o novo endereco. O email atual continuara ativo ate a confirmacao.
            </p>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
