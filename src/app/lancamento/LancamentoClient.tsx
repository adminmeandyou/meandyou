'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import '../landing.css'
import type { SiteConfigPublic, LandingContentMap } from '../landing/types'

import NavBar from '../landing/NavBar'
import HeroLancamento from './HeroLancamento'
import IdentLancamento from './IdentLancamento'
import PilaresLancamento from './PilaresLancamento'
import ModosLancamento from './ModosLancamento'
import GamificacaoLancamento from './GamificacaoLancamento'
import OfertaLancamento from './OfertaLancamento'
import PlanosLancamento from './PlanosLancamento'
import EarlyLancamento from './EarlyLancamento'
import CtaLancamento from './CtaLancamento'
import QuemSomosLancamento from './QuemSomosLancamento'
import FaqLancamento from './FaqLancamento'

import VerificacaoSection from '../landing/VerificacaoSection'
import FiltrosSection from '../landing/FiltrosSection'
import IntencoesSection from '../landing/IntencoesSection'
import SegurancaSection from '../landing/SegurancaSection'
import EncontroSection from '../landing/EncontroSection'
import PerfilSection from '../landing/PerfilSection'
import BackstageSection from '../landing/BackstageSection'
import InstallSection from '../landing/InstallSection'
import SegurancaDicasSection from '../landing/SegurancaDicasSection'
import FooterSection from '../landing/FooterSection'

type FaqItem = { q: string; a: string }

interface LancamentoClientProps {
  config: SiteConfigPublic
  content: LandingContentMap
}

function animateCounter(el: HTMLElement, target: number) {
  const start = performance.now()
  const duration = 1800
  const suffix = el.dataset.suffix || ''
  const update = (now: number) => {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (p >= 1 ? suffix : '')
    if (p < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

function buildFaqItems(content: LandingContentMap): FaqItem[] | null {
  const faqContent = content['faq']
  if (!faqContent) return null
  const items: FaqItem[] = []
  let i = 1
  while (faqContent[`q_${i}`] && faqContent[`a_${i}`]) {
    items.push({ q: faqContent[`q_${i}`], a: faqContent[`a_${i}`] })
    i++
  }
  return items.length > 0 ? items : null
}

export default function LancamentoClient({ config, content }: LancamentoClientProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const animRef = useRef(false)
  const [navVisible, setNavVisible] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const lastScrollY = useRef(0)


  const [userCity, setUserCity] = useState('')

  const faqItems = buildFaqItems(content)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) { router.push('/modos') } else { setChecking(false) } })
      .catch(() => setChecking(false))
  }, [router])

  useEffect(() => {
    if (checking || animRef.current) return
    animRef.current = true

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).classList.add('lp-visible')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.06, rootMargin: '0px 0px -32px 0px' })

    document.querySelectorAll('.lp-anim').forEach(el => {
      if (prefersReduced) { (el as HTMLElement).classList.add('lp-visible'); return }
      observer.observe(el)
    })

    const howObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.lp-how-step').forEach((s: Element, i: number) => {
            setTimeout(() => s.classList.add('visible'), i * 110)
          })
        }
      })
    }, { threshold: 0.12 })
    const stepsRow = document.querySelector('.lp-steps-row')
    if (stepsRow) howObserver.observe(stepsRow)

    document.querySelectorAll('.lp-ftag').forEach(tag => {
      tag.addEventListener('click', () => {
        if (tag.classList.contains('neu')) { tag.classList.remove('neu'); tag.classList.add('inc') }
        else if (tag.classList.contains('inc')) { tag.classList.remove('inc'); tag.classList.add('exc') }
        else { tag.classList.remove('exc'); tag.classList.add('neu') }
      })
    })

    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.target || '0', 10)
          if (target > 0 && !prefersReduced) animateCounter(el, target)
          else el.textContent = target.toLocaleString('pt-BR') + (el.dataset.suffix || '')
          counterObs.unobserve(el)
        }
      })
    }, { threshold: 0.3 })
    document.querySelectorAll('.lp-counter').forEach(el => counterObs.observe(el))

    return () => { observer.disconnect(); counterObs.disconnect() }
  }, [checking])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY < 60) { setNavVisible(true) }
      else if (currentY < lastScrollY.current) { setNavVisible(true) }
      else { setNavVisible(false) }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Cidade aproximada pelo IP via cabeçalho da Vercel (sem pedir GPS ao visitante e sem ipapi.co)
    fetch('/api/geo')
      .then(r => r.json())
      .then(d => { if (d?.city) setUserCity(d.city) })
      .catch(() => {})
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090E' }}>
        <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: '36px', color: '#f0ece4' }}>
          MeAnd<span style={{ color: '#E11D48' }}>You</span>
        </h1>
      </div>
    )
  }

  return (
    <div className="lp">
      <NavBar navVisible={navVisible} menuAberto={menuAberto} setMenuAberto={setMenuAberto} />

      <HeroLancamento userCity={userCity} config={config} content={content} />

      <IdentLancamento />
      <PilaresLancamento />
      <VerificacaoSection />
      <ModosLancamento />
      <FiltrosSection />
      <IntencoesSection />
      <SegurancaSection />
      <GamificacaoLancamento />
      <EncontroSection />
      <PerfilSection />
      <BackstageSection />

      <OfertaLancamento config={config} content={content} />
      <PlanosLancamento config={config} content={content} />
      <EarlyLancamento />
      <CtaLancamento config={config} content={content} />

      <InstallSection />
      <QuemSomosLancamento />
      <FaqLancamento items={faqItems} />

      <SegurancaDicasSection />
      <FooterSection />
    </div>
  )
}
