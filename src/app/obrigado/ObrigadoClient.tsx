'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SiteConfigPublic } from '@/app/landing/types'

const PLAN_NAMES: Record<string, string> = {
  essencial: 'Essencial',
  plus: 'Plus',
  black: 'Black',
}

function ObrigadoContent({ config }: { config: SiteConfigPublic }) {
  const searchParams = useSearchParams()
  const planoParam = (searchParams.get('plano') ?? '').toLowerCase()
  const planoNome = PLAN_NAMES[planoParam] || ''

  const msgByPlan: Record<string, string> = {
    essencial: config.obrigado_msg_essencial,
    plus: config.obrigado_msg_plus,
    black: config.obrigado_msg_black,
  }

  const customMsg = msgByPlan[planoParam]?.trim()
  const mensagem = customMsg && customMsg.length > 0
    ? customMsg
    : config.obrigado_mensagem

  const titulo = config.obrigado_titulo
  const planoLabel = planoNome ? `Bem-vindo ao plano ${planoNome}!` : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%)',
        color: 'var(--text)',
        fontFamily: 'var(--font-jakarta)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Icone de check animado */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34,197,94,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Titulo */}
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            color: 'var(--text)',
            marginBottom: '8px',
          }}
        >
          {titulo}
        </h1>

        {/* Subtitulo opcional (apenas se houver plano) */}
        {planoLabel && (
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.125rem',
              textAlign: 'center',
              color: 'var(--accent)',
              marginBottom: '12px',
              fontStyle: 'italic',
            }}
          >
            {planoLabel}
          </p>
        )}

        {/* Mensagem dinamica (padrao ou por plano) */}
        <p
          style={{
            fontSize: '0.9375rem',
            textAlign: 'center',
            color: 'var(--muted)',
            marginBottom: '28px',
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
          }}
        >
          {mensagem}
        </p>

        {/* Card informativo */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '14px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            O que acontece agora?
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { num: '1', text: 'Acesse sua conta e aproveite os novos recursos' },
              { num: '2', text: 'Seu plano ja esta ativo, sem necessidade de nenhuma acao adicional' },
              { num: '3', text: 'Explore os recursos desbloqueados e descubra novas conexoes' },
            ].map(({ num, text }) => (
              <li key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {num}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5' }}>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Botoes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <Link
            href="/modos"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '0.9375rem',
              padding: '14px',
              borderRadius: '14px',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            Ir para o app
          </Link>
          <Link
            href="/minha-assinatura"
            style={{
              display: 'block',
              textAlign: 'center',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              fontWeight: '500',
              fontSize: '0.9375rem',
              padding: '14px',
              borderRadius: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background-color 0.15s',
            }}
          >
            Ver minha assinatura
          </Link>
        </div>

        {/* Rodape */}
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>
          Duvidas?{' '}
          <Link
            href="/suporte"
            style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            Fale com o suporte
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function ObrigadoClient({ config }: { config: SiteConfigPublic }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--accent)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ObrigadoContent config={config} />
    </Suspense>
  )
}
