'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ConfirmarEmailConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verificando' | 'sucesso' | 'erro'>('verificando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('erro')
      setMensagem('Link inválido. Solicite uma nova alteração de email.')
      return
    }

    fetch(`/api/auth/confirmar-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('sucesso')
        } else {
          setStatus('erro')
          setMensagem(data.error ?? 'Erro ao confirmar email.')
        }
      })
      .catch(() => {
        setStatus('erro')
        setMensagem('Erro de conexão. Tente novamente.')
      })
  }, [searchParams])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-jakarta)',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        {status === 'verificando' && (
          <>
            <div style={{
              width: '48px', height: '48px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTop: '3px solid var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 24px',
            }} />
            <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Verificando seu email...</p>
          </>
        )}

        {status === 'sucesso' && (
          <>
            <div style={{
              width: '56px', height: '56px',
              backgroundColor: 'rgba(34,197,94,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}>
              ✅
            </div>
            <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, margin: '0 0 12px', fontFamily: 'var(--font-fraunces)' }}>
              Email confirmado!
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>
              Seu email foi alterado com sucesso. Faça login novamente com o novo email.
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              Ir para o login
            </Link>
          </>
        )}

        {status === 'erro' && (
          <>
            <div style={{
              width: '56px', height: '56px',
              backgroundColor: 'rgba(239,68,68,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}>
              ❌
            </div>
            <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, margin: '0 0 12px', fontFamily: 'var(--font-fraunces)' }}>
              Link inválido
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>
              {mensagem}
            </p>
            <Link
              href="/configuracoes"
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(255,255,255,0.07)',
                color: 'var(--text)',
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Ir para configuracoes
            </Link>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function ConfirmarEmail() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ConfirmarEmailConteudo />
    </Suspense>
  )
}
