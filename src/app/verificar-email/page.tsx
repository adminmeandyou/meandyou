'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

function VerificarEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'sucesso' | 'erro' | 'jaVerificado'>('loading')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('erro')
      setMensagem('Link inválido. Nenhum token encontrado.')
      return
    }

    fetch('/api/auth/verificar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setStatus(data.jaVerificado ? 'jaVerificado' : 'sucesso')

          // Redirecionar apos 2s — se logado vai direto para /verificacao, senao para /login
          setTimeout(async () => {
            const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
            if (user) {
              window.location.href = '/verificacao'
            } else {
              router.replace('/login')
            }
          }, 2000)
        } else {
          setStatus('erro')
          setMensagem(data.error || 'Link inválido ou expirado.')
        }
      })
      .catch(() => {
        setStatus('erro')
        setMensagem('Erro de conexão. Tente novamente.')
      })
  }, [token])

  const bg = 'var(--bg)'
  const card = 'var(--bg-card)'

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <Loader size={40} color="var(--accent)" strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 600, margin: 0 }}>Verificando seu email...</p>
          </>
        )}

        {(status === 'sucesso' || status === 'jaVerificado') && (
          <>
            <CheckCircle size={48} color="var(--green)" strokeWidth={1.5} />
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-fraunces)' }}>
                {status === 'jaVerificado' ? 'Email já verificado' : 'Email verificado!'}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                Redirecionando para o app...
              </p>
            </div>
          </>
        )}

        {status === 'erro' && (
          <>
            <XCircle size={48} color="var(--accent)" strokeWidth={1.5} />
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-fraunces)' }}>
                Link inválido
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 20px' }}>
                {mensagem}
              </p>
              <a
                href="/login"
                style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
              >
                Ir para o login
              </a>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <VerificarEmailInner />
    </Suspense>
  )
}
