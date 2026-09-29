'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import './landing.css'
import { faqItems as faqFallback } from './landing/data'
import type { SiteConfigPublic, LandingContentMap } from './landing/types'

import NavBar from './landing/NavBar'
import HeroSection from './landing/HeroSection'
import ProblemaSection from './landing/ProblemaSection'
import JornadaSection from './landing/JornadaSection'
import ConfiancaSection from './landing/ConfiancaSection'
import RecursosSection from './landing/RecursosSection'
import PlanosSection from './landing/PlanosSection'
import SocialFaqSection from './landing/SocialFaqSection'
import FooterSection from './landing/FooterSection'

type FaqItem = { q: string; a: string }

interface LandingClientProps {
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

function buildFaqItems(content: LandingContentMap): FaqItem[] {
  const faqContent = content['faq']
  if (!faqContent) return faqFallback
  const items: FaqItem[] = []
  let i = 1
  while (faqContent[`q_${i}`] && faqContent[`a_${i}`]) {
    items.push({ q: faqContent[`q_${i}`], a: faqContent[`a_${i}`] })
    i++
  }
  return items.length > 0 ? items : faqFallback
}

export default function LandingClient({ config, content }: LandingClientProps) {
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.meandyou.com.br/#organization',
        name: 'MeAndYou',
        url: 'https://www.meandyou.com.br',
        logo: 'https://www.meandyou.com.br/logo.png',
        description: 'App de relacionamentos brasileiro com verificação real de identidade e os filtros mais completos do Brasil.',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'adminmeandyou@proton.me',
          contactType: 'customer support',
          availableLanguage: 'Portuguese',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="lp">
        <NavBar navVisible={navVisible} menuAberto={menuAberto} setMenuAberto={setMenuAberto} />
        <HeroSection userCity={userCity} config={config} content={content} />
        <ProblemaSection />
        <JornadaSection />
        <ConfiancaSection />
        <RecursosSection />
        <PlanosSection config={config} />
        <SocialFaqSection items={faqItems} />
        <FooterSection />
      </div>
    </>
  )
}
