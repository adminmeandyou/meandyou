'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react'

export default function AguardandoEmailPage() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [reenviando, setReenviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }

      setUserId(user.id)
      setEmail(user.email ?? '')

      // Verificar se email já foi confirmado (usuário pode ter voltado)
      const { data: userRow } = await supabase
        .from('users')
        .select('email_verified')
        .eq('id', user.id)
        .single()

      if (userRow?.email_verified) {
        setVerificado(true)
        setTimeout(() => { window.location.href = '/verificacao' }, 1500)
        return
      }

      setCarregando(false)
    })
  }, [])

  const reenviarEmail = async () => {
    setErro('')
    setMensagem('')
    setReenviando(true)

    try {
      const res = await fetch('/api/auth/reenviar-verificacao-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao reenviar.')
      } else {
        setMensagem('E-mail reenviado! Verifique sua caixa de entrada (ou a pasta de spam).')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setReenviando(false)
    }
  }

  const sair = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const verificarAgora = async () => {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: userRow } = await supabase
      .from('users')
      .select('email_verified')
      .eq('id', user.id)
      .single()

    if (userRow?.email_verified) {
      setVerificado(true)
      setTimeout(() => { window.location.href = '/verificacao' }, 1500)
    } else {
      setCarregando(false)
      setErro('E-mail ainda não confirmado. Clique no link que enviamos.')
    }
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (verificado) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <CheckCircle size={48} color="var(--green)" strokeWidth={1.5} />
        <p style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600 }}>E-mail confirmado!</p>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Redirecionando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>

        {/* Icone */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={32} color="var(--accent)" strokeWidth={1.5} />
        </div>

        {/* Titulo */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-fraunces)' }}>
            Verifique seu email
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
            Enviamos um link de verificação para
          </p>
          <p style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, margin: '4px 0 0' }}>
            {email}
          </p>
        </div>

        {/* Card de instrucoes */}
        <div style={{ width: '100%', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Abra o email que enviamos',
            'Clique em "Verificar email"',
            'Volte aqui e clique em "Já verifiquei"',
          ].map((passo, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>
              </div>
              <span style={{ color: 'var(--text)', fontSize: '14px' }}>{passo}</span>
            </div>
          ))}
        </div>

        {/* Feedback */}
        {mensagem && (
          <div style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(46,196,160,0.10)', border: '1px solid rgba(46,196,160,0.25)', color: 'var(--green)', fontSize: '14px', textAlign: 'center' }}>
            {mensagem}
          </div>
        )}
        {erro && (
          <div style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.25)', color: 'var(--accent)', fontSize: '14px', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        {/* Botao principal */}
        <button
          onClick={verificarAgora}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          Já verifiquei meu email
        </button>

        {/* Reenviar */}
        <button
          onClick={reenviarEmail}
          disabled={reenviando}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: '14px', cursor: reenviando ? 'default' : 'pointer', opacity: reenviando ? 0.6 : 1 }}
        >
          <RefreshCw size={15} strokeWidth={1.5} style={{ animation: reenviando ? 'spin 1s linear infinite' : 'none' }} />
          {reenviando ? 'Reenviando...' : 'Reenviar email'}
        </button>

        {/* Sair */}
        <button
          onClick={sair}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: 'var(--muted-2)', fontSize: '13px', cursor: 'pointer' }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          Entrar com outra conta
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
