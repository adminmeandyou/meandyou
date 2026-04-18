'use client'

import { useState, useEffect } from 'react'
import { formatBRL, pick, type SiteConfigPublic, type LandingContentMap } from '../landing/types'

const LAUNCH_END_FALLBACK = new Date('2026-05-15T00:00:00')
const VAGAS_BASE = 847
const VAGAS_TOTAL = 1000

function pad(n: number) { return String(n).padStart(2, '0') }

interface CtaProps {
  config: SiteConfigPublic
  content: LandingContentMap
}

export default function CtaLancamento({ config, content }: CtaProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [vagas, setVagas] = useState(VAGAS_BASE)
  const [viewers, setViewers] = useState(0)

  const launchEnd = config.lancamento_fim
    ? new Date(config.lancamento_fim)
    : LAUNCH_END_FALLBACK

  const preco = formatBRL(config.preco_essencial)

  const titulo = pick(content, 'cta', 'titulo', 'Seus 2 meses\ncomeçam agora.')
  const subtitulo = pick(
    content,
    'cta',
    'subtitulo',
    'Entre, explore tudo, e veja o que muda quando as conexões são intencionais. Seu emblema de Fundador já está esperando por você.',
  )
  const ctaTexto = pick(content, 'cta', 'botao', 'Começar meu período grátis')
  const microcopy = pick(
    content,
    'cta',
    'microcopy',
    `Plano Essencial · 2 meses grátis · Depois R$${preco}/mês · Cancele quando quiser`,
  )
  const microBonus = pick(
    content,
    'cta',
    'micro_bonus',
    '+ Emblema de Fundador Lendário, grátis, vitalício',
  )

  useEffect(() => {
    setViewers(Math.floor(Math.random() * 18) + 7)

    const update = () => {
      const diff = launchEnd.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [launchEnd])

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.60) setVagas(v => Math.min(v + 1, VAGAS_TOTAL - 10))
      setViewers(v => {
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(5, Math.min(35, v + delta))
      })
    }, 9000)
    return () => clearInterval(id)
  }, [])

  const vagasRestantes = VAGAS_TOTAL - vagas
  const tituloLinhas = titulo.split('\n')

  return (
    <section className="lp-cta-final">
      <div className="lp-cta-final-inner">

        <div className="lp-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 100,
          background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
          marginBottom: 20,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.06em' }}>LANÇAMENTO · SÓ {vagasRestantes} VAGAS RESTANTES</span>
        </div>

        <h2 className="lp-cta-final-title lp-anim">
          {tituloLinhas.map((linha, i) => (
            <span key={i}>{linha}{i < tituloLinhas.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="lp-cta-final-sub lp-anim">{subtitulo}</p>

        {timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds > 0 && (
          <div className="lp-anim" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { val: timeLeft.days, label: 'dias' },
              { val: timeLeft.hours, label: 'horas' },
              { val: timeLeft.minutes, label: 'min' },
              { val: timeLeft.seconds, label: 'seg' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 60, padding: '12px 16px',
                  background: 'rgba(19,22,31,0.90)',
                  border: '1px solid rgba(225,29,72,0.25)',
                  borderRadius: 12,
                }}>
                  <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 28, fontWeight: 700, lineHeight: 1, color: '#E11D48', letterSpacing: '-1px' }}>{pad(val)}</span>
                  <span style={{ fontSize: 10, color: 'rgba(248,249,250,0.40)', letterSpacing: '0.06em', marginTop: 4 }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="lp-anim" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 24,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.50)' }}>
            <strong style={{ color: 'var(--text)' }}>{viewers} pessoas</strong> estão garantindo acesso agora
          </span>
        </div>

        <a href="/cadastro" className="lp-cta-final-btn lp-anim">{ctaTexto}</a>

        <p className="lp-cta-final-micro lp-anim">{microcopy}</p>
        <p className="lp-cta-final-micro lp-anim" style={{ marginTop: 6, color: 'rgba(245,158,11,0.55)', fontSize: 13 }}>
          {microBonus}
        </p>

        <div className="lp-anim" style={{ maxWidth: 360, margin: '24px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.40)' }}>{vagas.toLocaleString('pt-BR')} vagas preenchidas</span>
            <span style={{ fontSize: 11, color: '#E11D48', fontWeight: 700 }}>{VAGAS_TOTAL - vagas} restantes</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              width: `${Math.round((vagas / VAGAS_TOTAL) * 100)}%`,
              background: 'linear-gradient(90deg, #E11D48, #F43F5E)',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

      </div>
    </section>
  )
}
