'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'desktop' | 'aguardando' | 'iniciando' | 'verificando' | 'sucesso' | 'erro' | 'expirado' | 'usado'

function Verificacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [mensagem, setMensagem] = useState('')
  const [instrucao, setInstrucao] = useState('')
  const [progresso, setProgresso] = useState(0)
  const [emailEnviado, setEmailEnviado] = useState(false)

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    const isEmulator = /bluestacks|nox|memu|ldplayer|gameloop|android.*sdk|sdk.*android/i.test(ua)
    if (isEmulator) return false
    return /android|iphone|ipad|ipod|mobile/i.test(ua)
  }

  useEffect(() => {
    if (!token) {
      verificarSeJaValidado()
      return
    }
    if (!isMobile()) {
      setStatus('desktop')
      return
    }
    validarToken(token)
  }, [token])

  const verificarSeJaValidado = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase.from('users').select('verified, email').eq('id', user.id).single()
    if (data?.verified) {
      router.push('/dashboard')
      return
    }
    setStatus('aguardando')
    await enviarEmailVerificacao(user.id, data?.email || user.email || '')
  }

  const enviarEmailVerificacao = async (userId: string, email: string) => {
    if (emailEnviado) return
    try {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
      const res = await fetch('/api/enviar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, nome: profile?.name || '' }),
      })
      if (res.ok) {
        setEmailEnviado(true)
      } else {
        const erro = await res.json()
        console.error('Erro ao enviar email:', erro)
      }
    } catch (e) {
      console.error('Erro na requisição:', e)
    }
  }

  const validarToken = async (tk: string) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/validar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk }),
      })
      const data = await res.json()
      if (data.error === 'expirado') { setStatus('expirado'); return }
      if (data.error === 'usado') { setStatus('usado'); return }
      if (data.error || !data.userId) { setStatus('erro'); setMensagem('Link inválido ou não encontrado.'); return }

      setStatus('iniciando')
      await iniciarVerificacaoFacial(data.userId, tk)
    } catch {
      setStatus('erro')
      setMensagem('Erro ao validar o link. Tente novamente.')
    }
  }

  const iniciarVerificacaoFacial = async (userId: string, tk: string) => {
    const passos = [
      'Olhe diretamente para a câmera',
      'Vire levemente para a direita',
      'Vire levemente para a esquerda',
      'Levante o queixo',
      'Abaixe o queixo',
      'Pisque duas vezes',
    ]

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      stream.getTracks().forEach(t => t.stop())
    } catch {
      setStatus('erro')
      setMensagem('Permissão de câmera negada. Permita o acesso à câmera e tente novamente.')
      return
    }

    for (let i = 0; i < passos.length; i++) {
      setStatus('verificando')
      setInstrucao(passos[i])
      setProgresso(Math.round(((i + 1) / passos.length) * 100))
      await new Promise(r => setTimeout(r, 1800))
    }

    try {
      const res = await fetch('/api/confirmar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk, userId }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('sucesso')
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        setStatus('erro')
        setMensagem('Erro ao confirmar verificação. Tente novamente.')
      }
    } catch {
      setStatus('erro')
      setMensagem('Erro de conexão. Tente novamente.')
    }
  }

  const reenviarEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmailEnviado(false)
    const { data } = await supabase.from('users').select('email').eq('id', user.id).single()
    await enviarEmailVerificacao(user.id, data?.email || user.email || '')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>

        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: '32px' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>

        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Verificando...</p>
          </div>
        )}

        {status === 'desktop' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.1)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📱</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Use o celular</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>
              A verificação de identidade só pode ser feita pelo celular.<br /><br />
              Abra o email que enviamos e toque no botão <strong style={{ color: 'var(--accent)' }}>Verificar identidade</strong> no seu celular.
            </p>
          </div>
        )}

        {status === 'aguardando' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.1)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Verifique seu email</h2>
            {emailEnviado ? (
              <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                Enviamos um link para o seu email. <strong style={{ color: 'var(--text)' }}>Abra no celular</strong> para concluir a verificação de identidade.<br /><br />
                O link expira em <strong style={{ color: 'var(--accent)' }}>30 minutos</strong>.
              </p>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                Enviando o link de verificação para o seu email...
              </p>
            )}
            <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent-dark)', fontWeight: '600' }}>
                📱 Importante: abra o link no celular
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                A verificação facial só funciona no celular com câmera frontal.
              </p>
            </div>
            {emailEnviado && (
              <button onClick={reenviarEmail} style={{ backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '10px 24px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>
                Reenviar email
              </button>
            )}
          </div>
        )}

        {status === 'iniciando' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.1)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📷</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Preparando câmera</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Permitindo acesso à câmera frontal...</p>
          </div>
        )}

        {status === 'verificando' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.1)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🤳</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>Verificando identidade</h2>
            <div style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)', borderRadius: '16px', padding: '20px', margin: '20px 0' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-dark)' }}>{instrucao}</p>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '100px', marginBottom: '12px' }}>
              <div style={{ height: '8px', backgroundColor: 'var(--accent)', borderRadius: '100px', width: `${progresso}%`, transition: 'width 0.5s' }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{progresso}% concluído</p>
          </div>
        )}

        {status === 'sucesso' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.2)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Identidade verificada!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>
              Seu perfil está completo e verificado. Bem-vindo(a) ao MeAndYou!<br /><br />
              Redirecionando...
            </p>
            <div style={{ width: '48px', height: '48px', border: '4px solid var(--accent)', borderTop: '4px solid transparent', borderRadius: '50%', margin: '24px auto 0', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {status === 'expirado' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏰</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link expirado</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
              Este link de verificação expirou. Faça login para receber um novo link.
            </p>
            <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Fazer login
            </button>
          </div>
        )}

        {status === 'usado' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link já utilizado</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
              Este link já foi usado. Se sua conta ainda não foi verificada, faça login para receber um novo link.
            </p>
            <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Fazer login
            </button>
          </div>
        )}

        {status === 'erro' && (
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Algo deu errado</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>{mensagem}</p>
            <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Voltar ao login
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function VerificacaoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    }>
      <Verificacao />
    </Suspense>
  )
}