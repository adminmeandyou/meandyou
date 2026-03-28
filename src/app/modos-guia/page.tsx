'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Compass, SlidersHorizontal, Star, Users, ArrowRight, ChevronLeft } from 'lucide-react'
import { Suspense } from 'react'

const MODOS = [
  {
    icon: <Compass size={32} strokeWidth={1.5} color="#E11D48" />,
    label: 'Descobrir',
    desc: 'Veja perfis perto de você e curta ou passe. Se os dois se curtirem, vira um match.',
    cor: '#E11D48',
    bg: 'linear-gradient(135deg, rgba(225,29,72,0.12) 0%, rgba(225,29,72,0.04) 100%)',
    border: 'rgba(225,29,72,0.25)',
  },
  {
    icon: <SlidersHorizontal size={32} strokeWidth={1.5} color="#60a5fa" />,
    label: 'Busca Avançada',
    desc: 'Filtre por idade, distância e gênero. Navegue por uma grade de perfis no seu ritmo.',
    cor: '#60a5fa',
    bg: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(96,165,250,0.04) 100%)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    icon: <Star size={32} strokeWidth={1.5} color="#F59E0B" />,
    label: 'Match do Dia',
    desc: 'Todo dia o app seleciona 5 perfis com alta compatibilidade com você. Qualidade acima de quantidade.',
    cor: '#F59E0B',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    icon: <Users size={32} strokeWidth={1.5} color="#2ec4a0" />,
    label: 'Salas',
    desc: 'Entre em grupos de bate-papo temáticos e converse com várias pessoas ao mesmo tempo. Disponível no Plus e Black.',
    cor: '#2ec4a0',
    bg: 'linear-gradient(135deg, rgba(46,196,160,0.12) 0%, rgba(46,196,160,0.04) 100%)',
    border: 'rgba(46,196,160,0.25)',
    badge: 'Plus+',
  },
]

function ModosGuiaContent() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next')

  function handleContinuar() {
    if (next) {
      window.location.href = next
    } else {
      router.back()
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '430px',
      margin: '0 auto',
      padding: '0 0 32px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px', gap: '8px' }}>
        {!next && (
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(248,249,250,0.5)', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces, serif)', fontSize: '22px', color: '#F8F9FA', margin: 0, lineHeight: 1.2 }}>
            Os Modos do <span style={{ color: '#E11D48' }}>MeAndYou</span>
          </h1>
          <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '13px', margin: '4px 0 0', fontFamily: 'var(--font-jakarta, sans-serif)' }}>
            Cada modo tem uma forma diferente de conectar pessoas
          </p>
        </div>
      </div>

      {/* Cards dos modos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 20px 0' }}>
        {MODOS.map((modo) => (
          <div
            key={modo.label}
            style={{
              background: modo.bg,
              border: `1px solid ${modo.border}`,
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${modo.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {modo.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 700, fontSize: '15px', color: '#F8F9FA' }}>
                  {modo.label}
                </span>
                {modo.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#F59E0B',
                    backgroundColor: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '100px',
                    padding: '2px 8px',
                    fontFamily: 'var(--font-jakarta, sans-serif)',
                  }}>
                    {modo.badge}
                  </span>
                )}
              </div>
              <p style={{
                color: 'rgba(248,249,250,0.60)',
                fontSize: '13px',
                lineHeight: '1.5',
                margin: 0,
                fontFamily: 'var(--font-jakarta, sans-serif)',
              }}>
                {modo.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Botao CTA */}
      <div style={{ padding: '24px 20px 0' }}>
        <button
          onClick={handleContinuar}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '100px',
            padding: '15px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-jakarta, sans-serif)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {next ? 'Configurar meu perfil' : 'Entendi'}
          {next && <ArrowRight size={18} strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}

export default function ModosGuiaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', backgroundColor: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.12)', borderTop: '2px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ModosGuiaContent />
    </Suspense>
  )
}
