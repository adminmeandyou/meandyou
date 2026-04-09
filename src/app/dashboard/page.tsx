'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { SkeletonLine, SkeletonAvatar, skeletonCss } from '@/components/Skeleton'
import { Settings, User } from 'lucide-react'

const modos = [
  {
    label: 'Descobrir',
    rota: '/busca',
    gradient: 'linear-gradient(160deg, #1a0a14 0%, #3d1530 50%, #2a0e24 100%)',
    emoji: '✦',
  },
  {
    label: 'Busca Avançada',
    rota: '/busca',
    gradient: 'linear-gradient(160deg, #0a1020 0%, #1a2a4a 50%, #0d1830 100%)',
    emoji: '◈',
  },
  {
    label: 'Salas',
    rota: '/salas',
    gradient: 'linear-gradient(160deg, #0a1a0e 0%, #0d2a1a 50%, #081a12 100%)',
    emoji: '◉',
  },
  {
    label: 'Match do Dia',
    rota: '/busca',
    gradient: 'linear-gradient(160deg, #1a0810 0%, #3d1520 50%, #2a0a18 100%)',
    emoji: '♡',
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [avatarInicial, setAvatarInicial] = useState('')

  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Proxy já garante que só chega aqui quem completou onboarding
        // Buscamos apenas o nome para exibir na tela
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()

        setNome(profile?.name ?? '')
        setAvatarInicial((profile?.name ?? user.email ?? 'U')[0].toUpperCase())
        setCarregando(false)
      } catch (err) {
        console.error('[dashboard] Erro ao carregar:', err)
        setCarregando(false)
      }
    }

    verificarEstado()
  }, [])

  const handleLogout = async () => {
    // Faz signOut no Supabase e limpa cookies de sessão
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style>{skeletonCss}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
            <SkeletonAvatar size={40} />
            <SkeletonLine width={80} height={24} />
            <SkeletonAvatar size={40} />
          </div>
          <SkeletonLine width={240} height={40} />
          <SkeletonLine width={200} height={20} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 8 }}>
            {[1,2,3,4].map(i => <SkeletonLine key={i} height={200} radius={8} />)}
          </div>
          <SkeletonLine width="100%" height={80} radius={12} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08090E',
      fontFamily: 'var(--font-jakarta)',
      paddingBottom: 96,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grain overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        opacity: 0.02,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Header fixo */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'rgba(8,9,14,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Avatar do usuário */}
        <button
          onClick={() => router.push('/perfil')}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a0a14 0%, #3d1530 100%)',
            border: '1.5px solid rgba(225,29,72,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(248,249,250,0.7)',
            fontFamily: 'var(--font-fraunces)',
            fontSize: 16, fontWeight: 700,
          }}
        >
          {avatarInicial || <User size={18} strokeWidth={1.5} />}
        </button>

        {/* Logo central */}
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 24,
          fontStyle: 'italic',
          color: '#E11D48',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Me&amp;You
        </h1>

        {/* Botão settings */}
        <button
          onClick={() => router.push('/configuracoes')}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Settings size={18} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
      </header>

      <main style={{ padding: '32px 20px 0', maxWidth: 430, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Label curated + título principal */}
        <div style={{ marginBottom: 28 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(248,249,250,0.40)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 10,
          }}>
            Conexoes Curadas
          </span>
          <h2 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 36,
            fontWeight: 700,
            color: '#F8F9FA',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-0.03em',
          }}>
            Escolha seu<br />
            <span style={{ color: '#E11D48' }}>ritmo</span> hoje.
          </h2>
        </div>

        {/* Grid 2x2 de modos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 14,
        }}>
          {modos.map((modo) => (
            <button
              key={modo.rota + modo.label}
              onClick={() => router.push(modo.rota)}
              style={{
                aspectRatio: '3/4',
                background: modo.gradient,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
              }}
            >
              {/* Vinheta noir de baixo */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                pointerEvents: 'none',
              }} />

              {/* Ícone decorativo no topo */}
              <span style={{
                position: 'absolute',
                top: 14,
                right: 14,
                fontSize: 18,
                color: 'rgba(248,249,250,0.20)',
                pointerEvents: 'none',
              }}>
                {modo.emoji}
              </span>

              {/* Título na base */}
              <div style={{ padding: '0 14px 16px', position: 'relative', zIndex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#F8F9FA',
                  margin: 0,
                  lineHeight: 1.2,
                  textAlign: 'left',
                  letterSpacing: '-0.02em',
                }}>
                  {modo.label}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Card Camarote Black */}
        <button
          onClick={() => router.push('/backstage')}
          style={{
            width: '100%',
            background: 'linear-gradient(160deg, #0a0608 0%, #1a0d14 60%, #0f0a0c 100%)',
            border: '1px solid rgba(245,158,11,0.20)',
            borderRadius: 12,
            padding: 0,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: 120,
            marginBottom: 20,
            transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 0 40px rgba(245,158,11,0.06)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
        >
          {/* Overlay gradiente da esquerda */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Brilho sutil no topo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.30) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            padding: '20px 20px 20px',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              {/* Badge VIP */}
              <span style={{
                display: 'inline-block',
                fontSize: 9,
                fontWeight: 700,
                color: '#F59E0B',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 100,
                padding: '3px 8px',
                marginBottom: 8,
              }}>
                Exclusivo VIP
              </span>

              <p style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 18,
                fontStyle: 'italic',
                fontWeight: 700,
                color: '#F8F9FA',
                margin: '0 0 4px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                Camarote Black
              </p>
              <p style={{
                fontSize: 12,
                color: 'rgba(248,249,250,0.50)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                Conexoes premium e exclusivas
              </p>
            </div>

            {/* Botão gold */}
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)',
              color: '#0a0608',
              fontFamily: 'var(--font-jakarta)',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 16px',
              borderRadius: 100,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(245,158,11,0.30)',
            }}>
              Entrar agora
            </div>
          </div>
        </button>

        {/* Sair */}
        <button onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '100px',
            padding: '12px 32px',
            color: 'rgba(248,249,250,0.30)',
            fontFamily: 'var(--font-jakarta)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}>
          Sair da conta
        </button>
      </main>
    </div>
  )
}
