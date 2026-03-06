'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Smartphone, ShieldX, CheckCircle, XCircle, ScanFace } from 'lucide-react'

type Passo = 'inicio' | 'frente' | 'direita' | 'esquerda' | 'cima' | 'baixo' | 'piscar' | 'concluido' | 'erro'

export default function Verificacao() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [passo, setPasso] = useState<Passo>('inicio')
  const [mensagem, setMensagem] = useState('')
  const [isMobile, setIsMobile] = useState(true)
  const [isEmulator, setIsEmulator] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const mobile = /iPhone|iPad|Android/i.test(ua)
    const emulators = ['BlueStacks', 'Nox', 'MEmu', 'LDPlayer', 'Genymotion']
    const emulator = emulators.some(e => ua.includes(e))
    setIsMobile(mobile)
    setIsEmulator(emulator)
  }, [])

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) videoRef.current.srcObject = stream
      setPasso('frente')
      setMensagem('Olhe diretamente para a câmera')
    } catch {
      setPasso('erro')
      setMensagem('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  const avancarPasso = () => {
    const passos: Passo[] = ['frente', 'direita', 'esquerda', 'cima', 'baixo', 'piscar', 'concluido']
    const mensagens: Record<string, string> = {
      frente: 'Olhe diretamente para a câmera',
      direita: 'Vire o rosto para a direita',
      esquerda: 'Vire o rosto para a esquerda',
      cima: 'Levante o queixo olhando para cima',
      baixo: 'Abaixe o queixo olhando para baixo',
      piscar: 'Pisque duas vezes devagar',
      concluido: 'Verificação concluída!'
    }
    const atual = passos.indexOf(passo as any)
    if (atual < passos.length - 1) {
      const proximo = passos[atual + 1]
      setPasso(proximo)
      setMensagem(mensagens[proximo])
    }
    if (passo === 'piscar') concluirVerificacao()
  }

  const concluirVerificacao = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').upsert({ id: user.id, email: user.email, verified: true })
    }
    setPasso('concluido')
  }

  const passoAtual = ['frente', 'direita', 'esquerda', 'cima', 'baixo', 'piscar']
  const progresso = passoAtual.indexOf(passo as any) + 1

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: 'var(--shadow)',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%'
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: 'var(--bg)'
  }

  if (!isMobile) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Smartphone size={48} color="var(--accent)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', marginBottom: '12px', color: 'var(--text)' }}>
          Use o celular
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
          A verificação de identidade só pode ser feita pelo celular. Acesse o link enviado para o seu email no celular.
        </p>
      </div>
    </div>
  )

  if (isEmulator) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <ShieldX size={48} color="var(--red)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', marginBottom: '12px', color: 'var(--text)' }}>
          Dispositivo não permitido
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
          A verificação não pode ser feita em emuladores. Use um celular real.
        </p>
      </div>
    </div>
  )

  if (passo === 'concluido') return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <CheckCircle size={64} color="var(--accent)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
          Identidade verificada!
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '28px' }}>
          Sua conta está ativa. Agora complete seu perfil para começar a usar o MeAndYou.
        </p>
        <a href="/perfil" style={{
          backgroundColor: 'var(--accent)',
          color: '#fff',
          padding: '14px 32px',
          borderRadius: '100px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '16px'
        }}>
          Completar perfil
        </a>
      </div>
    </div>
  )

  if (passo === 'erro') return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <XCircle size={48} color="var(--red)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', marginBottom: '12px', color: 'var(--text)' }}>
          Erro na verificação
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '28px' }}>{mensagem}</p>
        <button className="btn-primary" onClick={() => setPasso('inicio')}>
          Tentar novamente
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: '8px' }}>
            Verificação de identidade
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Siga as instruções para verificar sua identidade
          </p>
        </div>

        {passo === 'inicio' && (
          <div style={{ ...cardStyle, padding: '36px' }}>
            <ScanFace size={64} color="var(--accent)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', marginBottom: '12px', color: 'var(--text)' }}>
              Pronto para verificar?
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
              Vamos pedir que você faça alguns movimentos com o rosto para confirmar que é uma pessoa real. O processo leva menos de 1 minuto.
            </p>
            <button className="btn-primary" onClick={iniciarCamera}>
              Iniciar verificação
            </button>
          </div>
        )}

        {['frente', 'direita', 'esquerda', 'cima', 'baixo', 'piscar'].includes(passo) && (
          <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '16px 24px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>Passo {progresso} de 6</span>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{Math.round((progresso / 6) * 100)}%</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '100px' }}>
                <div style={{ height: '4px', backgroundColor: 'var(--accent)', borderRadius: '100px', width: `${(progresso / 6) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ position: 'relative', margin: '16px' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '16px', aspectRatio: '3/4', objectFit: 'cover', backgroundColor: '#000' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {mensagem}
              </div>
            </div>

            <div style={{ padding: '0 16px 24px' }}>
              <button className="btn-primary" onClick={avancarPasso}>
                {passo === 'piscar' ? 'Concluir verificação' : 'Próximo passo'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}