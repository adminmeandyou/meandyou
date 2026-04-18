'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import './landing.css'
import { faqItems as faqFallback } from './landing/data'
import type { SiteConfigPublic, LandingContentMap } from './landing/types'

import NavBar from './landing/NavBar'
import HeroSection from './landing/HeroSection'
import IdentSection from './landing/IdentSection'
import PilaresSection from './landing/PilaresSection'
import VerificacaoSection from './landing/VerificacaoSection'
import ModosSection from './landing/ModosSection'
import FiltrosSection from './landing/FiltrosSection'
import IntencoesSection from './landing/IntencoesSection'
import SegurancaSection from './landing/SegurancaSection'
import GamificacaoSection from './landing/GamificacaoSection'
import EncontroSection from './landing/EncontroSection'
import PerfilSection from './landing/PerfilSection'
import BackstageSection from './landing/BackstageSection'
import AmigosSection from './landing/AmigosSection'
import LupasSection from './landing/LupasSection'
import ModoInvisivelSection from './landing/ModoInvisivelSection'
import EmblemasSection from './landing/EmblemasSection'
import RecompensasSection from './landing/RecompensasSection'
import PlanosSection from './landing/PlanosSection'
import ProvaSocialSection from './landing/ProvaSocialSection'
import CtaFinalSection from './landing/CtaFinalSection'
import EarlyAdopterSection from './landing/EarlyAdopterSection'
import InstallSection from './landing/InstallSection'
import QuemSomosSection from './landing/QuemSomosSection'
import FaqSection from './landing/FaqSection'
import SegurancaDicasSection from './landing/SegurancaDicasSection'
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

  const [notifList, setNotifList] = useState<Array<{id: number, text: string, exiting: boolean}>>([])
  const notifIdRef = useRef(0)

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
    const viaCoordenadas = (lat: number, lon: number) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`, {
        headers: { 'User-Agent': 'MeAndYou/1.0 (meandyou.com.br)' }
      })
        .then(r => r.json())
        .then(d => {
          const cidade = d.address?.city || d.address?.town || d.address?.village || d.address?.municipality
          if (cidade) setUserCity(cidade)
        })
        .catch(() => {})
    }
    const viaIP = () => {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => { if (d.city) setUserCity(d.city) })
        .catch(() => {})
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => viaCoordenadas(pos.coords.latitude, pos.coords.longitude),
        () => viaIP(),
        { timeout: 5000 }
      )
    } else {
      viaIP()
    }
  }, [])

  useEffect(() => {
    if (checking) return

    const nm = ['Ana','Carlos','Juliana','Marcos','Beatriz','Rafael','Leticia','Diego','Priscila','Bruno','Fernanda','Gustavo','Isabela','Thiago','Camila','Leonardo','Vanessa','Eduardo','Patricia','Rodrigo','Mariana','Felipe','Natalia','Vinicius','Larissa','Amanda','Ricardo','Bianca','Fabricio','Simone','Caio','Rebeca','Henrique','Luciana','Andre','Sabrina','Alex','Carolina','Marcelo','Giovana','Renata','Daniel','Pedro','Tatiana','Luiz','Monica','Gabriel','Aline','Sergio','Claudia','Paulo','Silvia','Eliane','Tiago','Bruna','Joao','Adriana','Flavia','Matheus']
    const ct = userCity
      ? [userCity,'São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Fortaleza','Recife','Manaus','Goiânia','Campinas','Florianópolis','Belém','São Luís','Maceió','Natal','Teresina','Campo Grande','João Pessoa','Aracaju','Porto Velho','Macapá','Boa Vista','Palmas','Vitória','Macaé','Ribeirão Preto','Uberlândia','Contagem']
      : ['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Fortaleza','Recife','Manaus','Goiânia','Campinas','Florianópolis','Belém','São Luís','Maceió','Natal','Teresina','Campo Grande','João Pessoa','Aracaju','Porto Velho','Macapá','Boa Vista','Palmas','Vitória','Macaé','Ribeirão Preto','Uberlândia','Contagem','Feira de Santana']
    const filtros = ['que não queira ter filhos','que tenha pets','que seja evangélico(a)','que seja espiritualista','que seja vegano(a)','que seja vegetariano(a)','que não fume','que não beba','que faça academia','que goste de viajar','que seja introvertido(a)','que seja extrovertido(a)','que goste de leitura','que seja gamer','que goste de anime','que goste de sertanejo','que goste de funk','que goste de rock','que goste de MPB','que tenha cabelo crespo','que tenha olhos verdes','que seja loiro(a)','que goste de churrasco','que goste de trilha e natureza','que seja ateu(a)','que seja agnóstico(a)','que seja católico(a)','que curta K-pop','que seja divorciado(a)','que tenha tatuagem','que use óculos','que goste de dança','que goste de fotografia','que goste de séries','que goste de meditação','que seja empreendedor(a)','que trabalhe remoto','que tenha barba','que seja bissexual','que curta pagode','que seja solteiro(a) sem filhos','que goste de teatro','que pratique yoga','que goste de jazz','que goste de filmes']
    const premios = ['3 SuperCurtidas','1 Boost','5 Lupas','2 Desfazer Curtidas','3 tickets de roleta','1 dia de Modo Invisível','5 SuperCurtidas','10 Lupas']

    const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
    const idade = () => Math.floor(Math.random() * 37) + 18

    const gens = [
      () => `${rnd(nm)}, ${idade()} · acabou de se cadastrar em ${rnd(ct)}`,
      () => `${rnd(nm)}, ${idade()} · verificou identidade agora`,
      () => `${rnd(nm)} de ${rnd(ct)} · assinou o Plus`,
      () => `${rnd(nm)} de ${rnd(ct)} · assinou o Camarote Black`,
      () => `${rnd(nm)} de ${rnd(ct)} · assinou o Essencial`,
      () => `${rnd(nm)}, ${idade()} · fez upgrade para Plus`,
      () => `${rnd(nm)}, ${idade()} · fez upgrade para Black`,
      () => `${rnd(nm)} de ${rnd(ct)} · deu match agora`,
      () => `${rnd(nm)}, ${idade()} · enviou uma SuperCurtida`,
      () => `${rnd(nm)}, ${idade()} · ganhou ${rnd(premios)} na roleta`,
      () => `${rnd(nm)} de ${rnd(ct)} · ganhou ${rnd(premios)} na roleta`,
      () => `${rnd(nm)}, ${idade()} · atingiu streak de 7 dias`,
      () => `${rnd(nm)}, ${idade()} · atingiu streak de 14 dias`,
      () => `${rnd(nm)}, ${idade()} · atingiu streak de 30 dias`,
      () => `${rnd(nm)} de ${rnd(ct)} · configurou ${Math.floor(Math.random()*30)+20} filtros`,
      () => `${rnd(nm)}, ${idade()} · curtiu ${Math.floor(Math.random()*8)+3} perfis hoje`,
      () => `${rnd(nm)} de ${rnd(ct)} · está procurando alguém ${rnd(filtros)}`,
      () => `${rnd(nm)}, ${idade()} · está procurando alguém ${rnd(filtros)}`,
      () => `${rnd(nm)} de ${rnd(ct)} · perdeu um match hoje`,
      () => `${rnd(nm)}, ${idade()} · encontrou uma conexão em ${rnd(ct)}`,
      () => `Novo perfil em ${rnd(ct)} · ${rnd(nm)}, ${idade()} verificado`,
      () => `${rnd(nm)} de ${rnd(ct)} · usou uma Lupa no Destaque`,
      () => `${rnd(nm)}, ${idade()} · resgatou prêmio do calendário`,
    ]

    let timer: ReturnType<typeof setTimeout>
    const addNotif = () => {
      const text = rnd(gens)()
      const id = ++notifIdRef.current
      setNotifList(prev => [...prev.slice(-2), { id, text, exiting: false }])
      setTimeout(() => setNotifList(prev => prev.map(x => x.id === id ? { ...x, exiting: true } : x)), 4200)
      setTimeout(() => setNotifList(prev => prev.filter(x => x.id !== id)), 4800)
      timer = setTimeout(addNotif, 4000 + Math.random() * 4000)
    }

    timer = setTimeout(addNotif, 1500 + Math.random() * 2000)
    return () => clearTimeout(timer)
  }, [checking, userCity]) // eslint-disable-line

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
        <IdentSection />
        <PilaresSection />
        <VerificacaoSection />
        <ModosSection />
        <FiltrosSection />
        <IntencoesSection />
        <SegurancaSection />
        <GamificacaoSection />
        <EncontroSection />
        <PerfilSection />
        <BackstageSection />
        <AmigosSection />
        <LupasSection />
        <ModoInvisivelSection />
        <EmblemasSection />
        <RecompensasSection />
        <PlanosSection config={config} />
        <ProvaSocialSection />
        <CtaFinalSection />
        <EarlyAdopterSection />
        <InstallSection />
        <QuemSomosSection />
        <FaqSection items={faqItems} />
        <SegurancaDicasSection />
        <FooterSection />

        <div className="lp-notif-wrap-v2">
          {notifList.map(n => (
            <div key={n.id} className={`lp-notif-v2 ${n.exiting ? 'lp-notif-v2--out' : ''}`}>
              <span className="lp-notif-dot-v2" />
              {n.text}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
