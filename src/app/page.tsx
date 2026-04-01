'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

/* ── Inline SVG Icons (extraídos do page.tsx v2) ─────────────────────────── */
const IcCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 16 4 11"/></svg>
)
const IcX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IcShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
const IcArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)
const IcZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
)
const IcEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IcLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)
const IcFilter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
)
const IcUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
const IcMedal = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
)
const IcMicOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
)
const IcPhoneOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 18.25 8.76 17.59 8.1 16.9m-5.07-5A19.79 19.79 0 0 1 0 3.18A2 2 0 0 1 2 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.18 8.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
)
const IcCameraSwitch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1l2-2h6l2 2h1a2 2 0 0 1 2 2v1.5"/><circle cx="9" cy="13" r="3"/><path d="M20.5 14.5v-3l3 3-3 3v-3z"/><path d="M20.5 14.5H17a2 2 0 0 0-2 2v1"/></svg>
)

/* ── Counter (extraído do page.tsx v2) ────────────────────────────────────── */
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

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 0' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', fontWeight: 600, fontSize: '15px', color: '#F8F9FA',
          fontFamily: "var(--font-jakarta), sans-serif", textAlign: 'left', padding: 0,
        }}
      >
        {pergunta}
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: aberto ? '#E11D48' : 'rgba(225,29,72,0.12)',
          border: '1px solid rgba(225,29,72,0.3)',
          color: aberto ? '#fff' : '#E11D48',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0, fontWeight: 700,
          transform: aberto ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.3s, background 0.2s, color 0.2s',
        }}>+</span>
      </button>
      {aberto && (
        <p style={{
          fontSize: '14px', color: 'rgba(248,249,250,0.55)',
          lineHeight: 1.75, marginTop: '14px', paddingRight: '44px',
        }}>{resposta}</p>
      )}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const animRef = useRef(false)
  const [navVisible, setNavVisible] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const lastScrollY = useRef(0)

  // Card deck
  const [currentCard, setCurrentCard] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const swipeLock = useRef(false)

  // PWA Install
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installDone, setInstallDone] = useState(false)
  const [selectedOS, setSelectedOS] = useState<'android' | 'ios'>('android')

  // Modos
  const [modoAtivo, setModoAtivo] = useState(0)

  // Filtros demo (Etapa 5)
  const [filtroSimAtivos, setFiltroSimAtivos] = useState<number[]>([0, 2])
  const [filtroSlider, setFiltroSlider] = useState(34)

  // Camarote (extraído do page.tsx v2)
  const [camaroteRevealed, setCamaroteRevealed] = useState(false)

  // Notifications
  const [notifList, setNotifList] = useState<Array<{id: number, text: string, exiting: boolean}>>([])
  const notifIdRef = useRef(0)

  // Location
  const [userCity, setUserCity] = useState('')

  // Formulário de contato
  const [contatoNome, setContatoNome] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoAssunto, setContatoAssunto] = useState('')
  const [contatoMensagem, setContatoMensagem] = useState('')
  const [contatoEnviando, setContatoEnviando] = useState(false)
  const [contatoEnviado, setContatoEnviado] = useState(false)
  const [contatoErro, setContatoErro] = useState('')

  async function handleContatoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setContatoErro('')
    if (!contatoNome.trim() || !contatoEmail.trim() || !contatoAssunto || !contatoMensagem.trim()) {
      setContatoErro('Preencha todos os campos.')
      return
    }
    setContatoEnviando(true)
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: contatoNome,
          email: contatoEmail,
          assunto: contatoAssunto,
          mensagem: contatoMensagem,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setContatoErro(json.error ?? 'Erro ao enviar.'); return }
      setContatoEnviado(true)
      setContatoNome(''); setContatoEmail(''); setContatoAssunto(''); setContatoMensagem('')
    } catch {
      setContatoErro('Erro ao enviar. Tente novamente.')
    } finally {
      setContatoEnviando(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) { router.push('/dashboard') } else { setChecking(false) } })
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
          e.target.querySelectorAll('.lp-how-step').forEach((s: any, i: number) => {
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

    // Counter observer (para seção STATS do page.tsx v2)
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

  // PWA install prompt (Android/Chrome)
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallDone(true)
    setInstallPrompt(null)
  }

  // IP geolocation para notificações personalizadas (fallback: cidade aleatória se API falhar ou atingir limite)
  useEffect(() => {
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife', 'Manaus', 'Goiânia', 'Campinas', 'Florianópolis']
    const cidadeAleatoria = cidades[Math.floor(Math.random() * cidades.length)]
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { setUserCity(d.city || cidadeAleatoria) })
      .catch(() => { setUserCity(cidadeAleatoria) })
  }, [])

  // Notificações animadas — geração dinâmica e totalmente aleatória
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

  // Simulação automática de filtros (Etapa 5)
  useEffect(() => {
    if (checking) return
    const totalTags = 10
    let tagIdx = 0
    const tagTimer = setInterval(() => {
      const i = tagIdx % totalTags
      setFiltroSimAtivos(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
      tagIdx++
    }, 1100)
    let sliderDir = 1
    const sliderTimer = setInterval(() => {
      setFiltroSlider(v => {
        const next = v + sliderDir * 2
        if (next >= 46) { sliderDir = -1; return 44 }
        if (next <= 20) { sliderDir = 1; return 22 }
        return next
      })
    }, 120)
    return () => { clearInterval(tagTimer); clearInterval(sliderTimer) }
  }, [checking])

  const handleSwipe = (dir: 'left' | 'right' | 'up') => {
    if (swipeLock.current) return
    swipeLock.current = true
    setSwipeDir(dir)
    setTimeout(() => {
      setCurrentCard(c => (c + 1) % swipeCards.length)
      setSwipeDir(null)
      swipeLock.current = false
    }, 420)
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

  const swipeCards = [
    {
      name: 'Julia, 26', photo: '/julia.jpg',
      tags: ['Gamer', 'Vegana', 'SP'],
      bio: 'Gamer nas horas vagas, vegana há 3 anos. Procuro conexão genuína, alguém pra conversar de verdade antes de qualquer encontro.',
      placeholder: 'linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%)',
    },
    {
      name: 'Roberto, 55', photo: '/Roberto.jpg',
      tags: ['Eletricista', 'RJ', 'Fuma'],
      bio: 'Eletricista de mão cheia, churrasco todo fim de semana e uma cerveja gelada. Direto ao ponto e sem enrolação — vida é curta demais.',
      placeholder: 'linear-gradient(160deg,#0a1020 0%,#1a2a4a 50%,#0d1830 100%)',
    },
    {
      name: 'Ana Paula, 38', photo: '/ana-paula.jpg',
      tags: ['Mãe', 'Pet', 'Secretária'],
      bio: 'Mãe de 2, tutora de um golden louco e secretária. Procuro um companheiro pra dividir a rotina e os momentos bons da vida.',
      placeholder: 'linear-gradient(160deg,#120a1a 0%,#2d1545 50%,#1a0e30 100%)',
    },
  ]


  const faqItems = [
    { q: 'Por que não existe um plano gratuito?', a: 'Porque o gratuito atrai quem não sabe o que quer. Aplicativos abertos viram bagunça: perfis falsos, pessoas inativas e perda de tempo. Cobrar um valor acessível (a partir de R$10) cria um filtro imediato. Quem investe para estar aqui, por menor que seja o valor, tem outro nível de intenção. Você percebe a diferença de nível já na primeira mensagem.' },
    { q: 'O que exatamente é a área Backstage do Camarote Black?', a: 'É o seu espaço privado para desejos específicos. Uma área com filtros exclusivos que não existem nos planos comuns: Sugar, BDSM, Swing, fetiches e poliamor. A regra de ouro aqui é a discrição: você só vê e é visto por quem marcou as exatas mesmas intenções. Zero exposição desnecessária, zero julgamento e 100% de alinhamento direto ao ponto.' },
    { q: 'Como funcionam os filtros de "incluir" e "excluir"?', a: 'É o sistema mais rápido e cirúrgico do Brasil, feito direto na tela principal. Clicou na tag, ficou verde: você quer ver aquele perfil. Clicou de novo, ficou vermelho: perfil bloqueado da sua frente. Clicou a terceira vez: volta ao neutro. Você molda a sua busca em segundos, sem precisar preencher formulários chatos.' },
    { q: 'O que acontece com a foto do meu documento depois da verificação?', a: 'Ela é descartada imediatamente. Nós não armazenamos fotos de RG, CNH ou rosto de ninguém. Nossa tecnologia apenas valida a autenticidade na hora e guarda um código criptografado atrelado ao seu CPF. Sua privacidade é absoluta e seus dados originais nunca ficam soltos no nosso sistema.' },
    { q: 'Posso cancelar a assinatura quando eu quiser?', a: 'Com dois cliques, direto no aplicativo. Sem burocracia, sem precisar mandar e-mail ou falar com atendente. Você cancela na hora e continua usando normalmente até o final do período que já pagou. Zero fidelidade, zero multa, zero dor de cabeça.' },
    { q: 'O aplicativo funciona para todas as orientações e gêneros?', a: 'Completamente. Nosso sistema de filtros foi desenhado para abraçar todas as orientações sexuais, identidades de gênero e formatos de relacionamento. É você quem dita quem entra e quem sai da sua tela. O espaço é livre e se adapta perfeitamente ao que você procura.' },
    { q: 'Como vocês garantem que os perfis são 100% reais?', a: 'Nossa barreira de entrada é implacável contra fakes e perfis falsos. Exigimos selfie ao vivo com sequência de movimentos, leitura de documento físico e validação de CPF na criação da conta. E o mais importante: se alguém quebra as regras e é banido, o bloqueio é feito direto no CPF. Não adianta criar outro e-mail, a pessoa simplesmente não volta.' },
    { q: 'Como funciona a segurança e moderação do app?', a: 'Nossa equipe trabalha 24 horas por dia. Viu um comportamento fora do padrão? É só clicar nos três pontos do perfil e em "Denunciar". Além disso, fomos além: para situações de risco em encontros presenciais, o app possui um Botão de Emergência oculto que aciona o 190 imediatamente, garantindo a sua integridade física.' },
  ]

  const filterCats = [
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, title: 'Cor dos olhos', desc: 'Todas as variações existentes, incluindo casos raros.', tags: ['Olhos pretos', 'Olhos castanhos', 'Olhos verdes', 'Olhos azuis', 'Olhos mel', 'Olhos acinzentados', 'Heterocromia'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>, title: 'Cor do cabelo', desc: 'Cor natural ou tingida dos cabelos.', tags: ['Cabelo preto', 'Cabelo castanho', 'Cabelo loiro', 'Cabelo ruivo', 'Cabelo colorido', 'Cabelo grisalho', 'Não possuo cabelo (careca)'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>, title: 'Tipo e comprimento do cabelo', desc: 'Textura e tamanho dos fios.', tags: ['Cabelo curto', 'Cabelo médio', 'Cabelo longo', 'Cabelo liso', 'Cabelo ondulado', 'Cabelo cacheado', 'Cabelo crespo'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'Cor de pele e etnia', desc: 'Inclusão total. Todas as tonalidades e origens étnicas.', tags: ['Branca', 'Parda', 'Negra', 'Asiática', 'Indígena', 'Latina', 'Mediterrânea', 'Possuo vitiligo'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title: 'Tipo corporal', desc: 'Biotipo com base em peso e altura.', tags: ['Abaixo do peso', 'Peso saudável', 'Acima do peso', 'Obesidade leve', 'Obesidade severa'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, title: 'Características físicas', desc: 'Detalhes que fazem diferença na atração.', tags: ['Possuo sardas', 'Possuo tatuagem', 'Possuo piercing', 'Possuo cicatriz', 'Uso óculos', 'Uso aparelho dentário', 'Possuo barba'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="4" r="2"/><path d="m10 22-1-6-3-2"/><path d="m14 22 1-6 3-2"/><path d="M8 10h8"/></svg>, title: 'Pessoa com deficiência (PCD)', desc: 'Inclusão total. Selecione para encontrar ou ser encontrado.', tags: ['Deficiência visual', 'Deficiência auditiva', 'Deficiência motora', 'Deficiência intelectual', 'Autismo (TEA)', 'TDAH', 'Sou cadeirante', 'Nanismo', 'Outra'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, title: 'Orientação sexual', desc: 'Todo mundo tem seu espaço aqui, sem julgamento.', tags: ['Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual', 'Assexual', 'Demissexual', 'Queer'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h4m-4 4h6m-6 4h2"/><circle cx="17" cy="10" r="2"/></svg>, title: 'Identidade de gênero', desc: 'Como a pessoa se identifica e como prefere ser chamada.', tags: ['Homem', 'Mulher', 'Homem trans', 'Mulher trans', 'Não-binário(a)', 'Gênero fluido'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, title: 'Status civil', desc: 'Situação atual no campo amoroso.', tags: ['Solteiro(a)', 'Enrolado(a)', 'Casado(a)', 'Divorciando', 'Divorciado(a)', 'Viúvo(a)', 'Relacionamento aberto'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, title: 'Religião e espiritualidade', desc: 'Fé e espiritualidade como parte da compatibilidade.', tags: ['Evangélico(a)', 'Católico(a)', 'Espírita', 'Umbandista', 'Candomblé', 'Budista', 'Judaico(a)', 'Islâmico(a)', 'Hindu', 'Agnóstico(a)', 'Ateu / Ateia', 'Espiritualizado(a) sem religião'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4.93" y1="9.93" x2="19.07" y2="14.07"/></svg>, title: 'Vícios e substâncias', desc: 'Hábitos que impactam diretamente a convivência.', tags: ['Fumo', 'Fumo ocasionalmente', 'Não fumo', 'Consumo bebida alcoólica', 'Bebo socialmente', 'Não consumo bebida alcoólica', 'Consumo cannabis', 'Não possuo vícios'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'Estilo de vida e rotina', desc: 'Como a pessoa organiza o dia a dia e o tempo livre.', tags: ['Pratico academia', 'Pratico esporte regularmente', 'Sou sedentário(a)', 'Sou caseiro(a)', 'Gosto de sair', 'Gosto de balada', 'Sou noturno(a)', 'Sou matutino(a)', 'Sou workaholic', 'Tenho vida equilibrada'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, title: 'Personalidade', desc: 'Introvertido(a), extrovertido(a) e tudo entre os dois extremos.', tags: ['Sou extrovertido(a)', 'Sou introvertido(a)', 'Sou ambiverte', 'Sou tímido(a)', 'Sou comunicativo(a)', 'Sou antissocial', 'Sou reservado(a)', 'Sou agitado(a)', 'Sou calmo(a)', 'Sou intenso(a)'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>, title: 'Hobbies e entretenimento', desc: 'O que a pessoa faz no tempo livre.', tags: ['Sou gamer', 'Adoro ler', 'Viciado(a) em filmes', 'Viciado(a) em séries', 'Curto anime / mangá', 'Curto música ao vivo', 'Faço fotografia', 'Arte e desenho', 'Danço', 'Faço teatro', 'Meditação / Yoga', 'Adoro viajar', 'Curto trilha e natureza'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>, title: 'Alimentação', desc: 'Compatibilidade alimentar importa mais do que parece.', tags: ['Sou vegano(a)', 'Sou vegetariano(a)', 'Sou carnívoro(a)', 'Como de tudo', 'Prefiro alimentação saudável', 'Cozinho bem', 'Não cozinho', 'Curto comida japonesa', 'Curto fast food'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>, title: 'Estilo de se vestir', desc: 'A forma de se vestir diz muito sobre quem a pessoa é.', tags: ['Social', 'Casual', 'Esportivo', 'Alternativo', 'Eclético', 'Gótico', 'Punk', 'E-girl / E-boy', 'K-pop'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, title: 'Gosto musical', desc: 'Afinidade musical no dia a dia.', tags: ['Funk', 'Sertanejo', 'Pagode', 'Rock', 'Metal', 'Pop', 'Eletrônica', 'Hip-hop / Rap', 'MPB / Bossa Nova', 'Gospel', 'K-pop', 'Clássica', 'Eclético, curto de tudo'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>, title: 'Filhos e família', desc: 'Um dos pontos mais decisivos em qualquer relacionamento sério.', tags: ['Tenho filhos', 'Não tenho filhos', 'Quero ter filhos', 'Não quero ter filhos', 'Aberto(a) à adoção', 'Ainda não decidi'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 21.23s-3-2.5-3-5"/></svg>, title: 'Animais de estimação', desc: 'Pet lover ou prefere não ter bicho em casa.', tags: ['Tenho cachorro', 'Tenho gato', 'Tenho outros pets', 'Adoro animais', 'Não tenho pets', 'Tenho alergia a animais', 'Não gosto de animais'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>, title: 'Escolaridade', desc: 'Nível de estudo e formação acadêmica.', tags: ['Ensino fundamental', 'Ensino médio completo', 'Ensino superior incompleto', 'Ensino superior completo', 'Pós-graduado(a)', 'Mestrado', 'Doutorado'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, title: 'Situação profissional', desc: 'Carreira, autonomia financeira e estilo de trabalho.', tags: ['CLT', 'Empreendedor(a)', 'Freelancer', 'Profissional liberal', 'Servidor(a) público(a)', 'Autônomo(a)', 'Trabalho remoto', 'Estou desempregado(a)'] },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, title: 'O que busca na plataforma', desc: 'Seja claro sobre suas intenções. Isso evita perda de tempo dos dois lados.', tags: ['Relacionamento sério', 'Relacionamento casual', 'Amizade', 'Companhia para eventos', 'Relação conjugal', 'Aberto(a) a experiências', 'Sugar Baby', 'Sugar Daddy / Mommy', 'Ainda estou definindo'], tip: 'Perfis de categorias sensíveis ficam visíveis apenas para quem também selecionou a mesma intenção.' },
    { icon: <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'Perfil discreto (exclusivo Black)', desc: 'Visível apenas para outros membros que também marcaram a mesma categoria.', tags: ['Busco trisal', 'Swing / relacionamento aberto', 'Poliamor', 'BDSM / fetiches'], tip: 'Estas opções ficam ocultas para quem não marcou a mesma categoria. Disponível apenas no plano Black.' },
  ]

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
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style>{`
        :root {
          --bg: #08090E;
          --bg-card: #0F1117;
          --bg-card2: #13161F;
          --accent: #E11D48;
          --accent-soft: rgba(225,29,72,0.10);
          --accent-border: rgba(225,29,72,0.25);
          --gold: #F59E0B;
          --gold-soft: rgba(245,158,11,0.10);
          --gold-border: rgba(245,158,11,0.25);
          --text: #F8F9FA;
          --text-muted: rgba(248,249,250,0.50);
          --text-dim: rgba(248,249,250,0.30);
          --border: rgba(255,255,255,0.07);
          --border-soft: rgba(255,255,255,0.04);
          --red: #F43F5E;
          --shadow-accent: 0 20px 60px rgba(225,29,72,0.18);
          --shadow-card: 0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25);
          --bg-card-grad: linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%);
          --border-premium: rgba(255,255,255,0.06);
          --transition-smooth: all 0.25s cubic-bezier(0.4,0,0.2,1);
          --accent-grad: linear-gradient(135deg, #E11D48 0%, #be123c 100%);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

        .lp { background: var(--bg); color: var(--text); font-family: var(--font-jakarta), sans-serif; font-size: 16px; line-height: 1.6; overflow-x: hidden; }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 16px; left: 50%;
          z-index: 200; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 28px; width: calc(100% - 48px); max-width: 1140px;
          background: rgba(8,9,14,0.85); backdrop-filter: blur(20px);
          border: 1px solid var(--border-premium); border-radius: 16px;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s;
        }
        .lp-logo { font-family: var(--font-fraunces), serif; font-weight: 700; font-size: 22px; color: var(--text); letter-spacing: -0.5px; text-decoration: none; }
        .lp-logo span { color: var(--accent); }
        .lp-nav-links { display: flex; gap: 4px; list-style: none; }
        .lp-nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
        .lp-nav-links a:hover { color: var(--text); background: var(--border-soft); }
        .lp-nav-cta { background: var(--accent-grad) !important; color: #fff !important; padding: 10px 22px !important; border-radius: 10px !important; font-weight: 600 !important; box-shadow: 0 4px 16px rgba(225,29,72,.20) !important; }
        .lp-nav-cta:hover { background: linear-gradient(135deg, #be123c 0%, #9f1239 100%) !important; }

        /* ── SCROLL REVEAL SYSTEM ── */
        @keyframes lpFadeUp   { from { opacity:0; transform:translateY(52px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes lpFadeLeft { from { opacity:0; transform:translateX(-52px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lpFadeRight{ from { opacity:0; transform:translateX(52px); }  to { opacity:1; transform:translateX(0); } }
        @keyframes lpScaleIn  { from { opacity:0; transform:scale(0.84) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes lpBlurUp   { from { opacity:0; filter:blur(18px); transform:translateY(28px); } to { opacity:1; filter:blur(0); transform:translateY(0); } }
        @keyframes lpFlipUp   { from { opacity:0; transform:perspective(700px) rotateX(18deg) translateY(32px); } to { opacity:1; transform:perspective(700px) rotateX(0deg) translateY(0); } }

        .lp-anim { opacity: 0; }
        .lp-anim.lp-visible { animation: lpFadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both; }

        /* Section-specific animation types */
        .lp-problem-header.lp-anim.lp-visible   { animation: lpFadeLeft 0.75s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-about-logo.lp-anim.lp-visible        { animation: lpFadeLeft 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-about-text.lp-anim.lp-visible        { animation: lpFadeRight 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-about-intro-left.lp-anim.lp-visible  { animation: lpFadeLeft 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-about-intro-right.lp-anim.lp-visible { animation: lpFadeRight 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-install-left.lp-anim.lp-visible      { animation: lpFadeLeft 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-install-right.lp-anim.lp-visible     { animation: lpFadeRight 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-card.lp-anim.lp-visible              { animation: lpScaleIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-filter-cat.lp-anim.lp-visible        { animation: lpBlurUp 0.75s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-testi-card.lp-anim.lp-visible        { animation: lpFlipUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-about-pillar.lp-anim.lp-visible      { animation: lpScaleIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-diff-card:nth-child(1).lp-anim.lp-visible { animation: lpFadeLeft 0.75s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-diff-card:nth-child(3).lp-anim.lp-visible { animation: lpFadeRight 0.75s cubic-bezier(0.16,1,0.3,1) both; }

        /* Stagger delays */
        .lp-anim.lp-visible:nth-child(2) { animation-delay: 80ms; }
        .lp-anim.lp-visible:nth-child(3) { animation-delay: 160ms; }
        .lp-anim.lp-visible:nth-child(4) { animation-delay: 240ms; }
        .lp-card.lp-anim.lp-visible:nth-child(2) { animation-delay: 120ms; }
        .lp-card.lp-anim.lp-visible:nth-child(3) { animation-delay: 240ms; }
        .lp-gamif-card.lp-anim.lp-visible:nth-child(2) { animation-delay: 100ms; }
        .lp-gamif-card.lp-anim.lp-visible:nth-child(3) { animation-delay: 200ms; }
        .lp-diff-card.lp-anim.lp-visible:nth-child(2) { animation-delay: 120ms; }
        .lp-diff-card.lp-anim.lp-visible:nth-child(3) { animation-delay: 240ms; }
        .lp-testi-card.lp-anim.lp-visible:nth-child(2) { animation-delay: 130ms; }
        .lp-testi-card.lp-anim.lp-visible:nth-child(3) { animation-delay: 260ms; }
        .lp-verify-step.lp-anim.lp-visible:nth-child(2) { animation-delay: 80ms; }
        .lp-verify-step.lp-anim.lp-visible:nth-child(3) { animation-delay: 160ms; }
        .lp-verify-step.lp-anim.lp-visible:nth-child(4) { animation-delay: 240ms; }
        .lp-verify-step.lp-anim.lp-visible:nth-child(5) { animation-delay: 320ms; }
        .lp-verify-step.lp-anim.lp-visible:nth-child(6) { animation-delay: 400ms; }
        .lp-about-pillar.lp-anim.lp-visible:nth-child(2) { animation-delay: 120ms; }
        .lp-about-pillar.lp-anim.lp-visible:nth-child(3) { animation-delay: 240ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(2) { animation-delay: 60ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(3) { animation-delay: 120ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(4) { animation-delay: 180ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(5) { animation-delay: 240ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(6) { animation-delay: 300ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(7) { animation-delay: 360ms; }
        .lp-safety-item.lp-anim.lp-visible:nth-child(8) { animation-delay: 420ms; }

        /* ── HERO ── */
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .lp-hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; padding: 140px 56px 100px; max-width: 1200px; margin: 0 auto; }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: #F43F5E; padding: 7px 18px; border-radius: 100px;
          font-size: 13px; font-weight: 600; margin-bottom: 28px;
          animation: lp-fadeUp .5s ease both;
        }
        .lp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: lp-pulse 2s ease-in-out infinite; }
        .lp-hero h1 { font-family: var(--font-fraunces), serif; font-size: clamp(44px, 5vw, 74px); font-weight: 700; line-height: 1.06; letter-spacing: -2px; margin-bottom: 24px; animation: lp-fadeUp .5s .1s ease both; }
        .lp-hero h1 em { font-style: italic; color: var(--accent); }
        .lp-hero-sub { font-size: 17px; font-weight: 400; color: rgba(248,249,250,0.72); max-width: 460px; margin-bottom: 40px; line-height: 1.75; animation: lp-fadeUp .5s .2s ease both; }
        .lp-hero-sub strong { color: var(--text); font-weight: 600; }
        .lp-actions { display: flex; gap: 12px; flex-wrap: wrap; animation: lp-fadeUp .5s .3s ease both; }
        .lp-btn-main {
          background: var(--accent-grad); color: #fff; padding: 15px 34px; border-radius: 12px;
          font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex;
          align-items: center; gap: 10px; box-shadow: 0 4px 16px rgba(225,29,72,.25), 0 12px 40px rgba(225,29,72,.20);
          transition: var(--transition-smooth); cursor: pointer;
        }
        .lp-btn-main:hover { background: linear-gradient(135deg, #be123c 0%, #9f1239 100%); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(225,29,72,.45), 0 0 32px rgba(225,29,72,.20); }
        .lp-btn-main:active { transform: scale(0.97); box-shadow: 0 4px 16px rgba(225,29,72,.25); }
        .lp-hero-complement { font-size: 15px; color: rgba(248,249,250,0.50); margin-top: -20px; margin-bottom: 36px; line-height: 1.7; animation: lp-fadeUp .5s .25s ease both; }
        .lp-hero-microcopy { font-size: 12px; color: rgba(248,249,250,0.35); margin-top: 12px; letter-spacing: 0.2px; animation: lp-fadeUp .5s .38s ease both; }
        .lp-hero-social-proof { display: flex; align-items: center; gap: 10px; margin-top: 20px; font-size: 13px; color: rgba(248,249,250,0.60); animation: lp-fadeUp .5s .45s ease both; }
        .lp-hero-social-proof-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.60); flex-shrink: 0; animation: lp-pulse 2s ease-in-out infinite; }
        .lp-hero-proof-number { color: #10b981; font-weight: 700; font-size: 14px; }
        .lp-btn-outline {
          background: transparent; color: var(--text); padding: 15px 30px; border-radius: 12px;
          font-weight: 600; font-size: 15px; text-decoration: none; border: 1px solid var(--border-premium);
          display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s, background 0.2s; cursor: pointer;
        }
        .lp-btn-outline:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
        .lp-stats { display: flex; gap: 32px; margin-top: 48px; animation: lp-fadeUp .5s .4s ease both; }
        .lp-stat-val { font-family: var(--font-fraunces), serif; font-size: 28px; font-weight: 700; line-height: 1; color: var(--text); }
        .lp-stat-label { font-size: 12px; color: var(--text-dim); margin-top: 4px; }
        .lp-stat-div { width: 1px; background: var(--border-premium); }

        /* Phone mockup */
        .lp-hero-right { position: relative; height: 660px; display: flex; align-items: center; justify-content: center; }
        .lp-phone {
          width: 265px; height: 560px; background: var(--bg-card-grad);
          border-radius: 38px; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(225,29,72,0.08);
          overflow: hidden; animation: card-enter 0.38s cubic-bezier(.34,1.4,.64,1) both;
        }
        .lp-phone-header { background: var(--bg); padding: 36px 20px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid var(--border-premium); }
        .lp-phone-logo { display: flex; align-items: center; justify-content: center; }
        .lp-phone-card { margin: 10px; background: var(--bg-card2); border-radius: 18px; overflow: hidden; border: 1px solid var(--border-premium); }
        .lp-phone-img { height: 210px; background: linear-gradient(160deg, #1a0a14 0%, #3d1530 50%, #2a0e24 100%); display: flex; align-items: center; justify-content: center; font-size: 64px; position: relative; overflow: hidden; }
        .lp-phone-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
        .lp-phone-bio { font-size: 10.5px; color: var(--text-muted); line-height: 1.55; padding: 0 14px 10px; }
        .lp-v-badge { position: absolute; top: 10px; right: 10px; background: var(--accent); color: #fff; border-radius: 100px; padding: 4px 10px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .lp-phone-info { padding: 12px 14px 10px; }
        .lp-phone-name { font-family: var(--font-fraunces), serif; font-size: 17px; font-weight: 700; color: var(--text); }
        .lp-phone-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
        .lp-phone-tag { background: rgba(16,185,129,0.12); color: #10b981; border-radius: 100px; padding: 3px 9px; font-size: 10px; font-weight: 600; }
        .lp-phone-actions { display: flex; justify-content: center; gap: 14px; padding: 10px 16px 14px; }
        .lp-ph-btn { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: transform 0.15s; }
        .lp-ph-btn:hover { transform: scale(1.1); }
        .lp-ph-btn.no { background: rgba(244,63,94,0.12); color: #F43F5E; border: 1px solid rgba(244,63,94,0.25); }
        .lp-ph-btn.super { background: rgba(245,158,11,0.12); color: var(--gold); border: 1px solid rgba(245,158,11,0.25); }
        .lp-ph-btn.yes { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
        .lp-fc {
          position: absolute; background: rgba(15,17,23,0.75);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 100px;
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
          white-space: nowrap; color: var(--text); z-index: 10;
        }
        .lp-fc1 { top: 48px; left: -10px; }
        .lp-fc2 { top: 270px; right: -20px; }
        .lp-fc3 { bottom: 90px; left: 0px; }
        .lp-fc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; margin-right: 4px; }

        /* ── Sections ── */
        .lp-section-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .lp-section-title { font-family: var(--font-fraunces), serif; font-size: clamp(30px, 4vw, 52px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }

        /* ── COMPARATIVO ── */
        .lp-problem { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); border-bottom: 1px solid var(--border-premium); }
        .lp-problem-inner { max-width: 1000px; margin: 0 auto; }
        .lp-problem-header { text-align: center; margin-bottom: 56px; }
        .lp-problem h2 { font-family: var(--font-fraunces), serif; font-size: clamp(28px, 4vw, 48px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 14px; }
        .lp-problem h2 em { color: var(--accent); font-style: italic; }
        .lp-cmp-header { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; margin-bottom: 4px; }
        .lp-cmp-col-label { text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 14px 20px; border-radius: 12px 12px 0 0; }
        .lp-cmp-col-label.them { color: var(--text-dim); background: rgba(255,255,255,0.03); }
        .lp-cmp-col-label.us { color: #10b981; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.20); border-bottom: none; }
        .lp-cmp-col-label.feature { color: transparent; }
        .lp-cmp-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; border-bottom: 1px solid var(--border-soft); }
        .lp-cmp-row:last-child { border-bottom: none; }
        .lp-cmp-feature { padding: 16px 20px; font-size: 13px; font-weight: 500; color: var(--text); display: flex; align-items: center; }
        .lp-cmp-cell { padding: 16px 20px; font-size: 13px; display: flex; align-items: center; gap: 10px; }
        .lp-cmp-cell.them { color: var(--text-muted); background: rgba(255,255,255,0.015); }
        .lp-cmp-cell.us { color: rgba(248,249,250,0.92); background: rgba(16,185,129,0.05); border-left: 1px solid rgba(16,185,129,0.15); border-right: 1px solid rgba(16,185,129,0.15); }
        .lp-cmp-row:last-child .lp-cmp-cell.us { border-bottom: 1px solid rgba(16,185,129,0.15); border-radius: 0 0 12px 12px; }
        .lp-cmp-x { width: 18px; height: 18px; border-radius: 50%; background: rgba(244,63,94,0.12); color: #F43F5E; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-cmp-check { width: 18px; height: 18px; border-radius: 50%; background: rgba(16,185,129,0.15); color: #10b981; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        @media (max-width: 700px) {
          .lp-cmp-header, .lp-cmp-row { grid-template-columns: 1fr 1fr; }
          .lp-cmp-feature { display: none; }
        }

        /* ── VERIFICATION ── */
        .lp-verification { padding: 100px 56px; background: var(--bg); }
        .lp-verification-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-verify-steps { display: flex; flex-direction: column; gap: 14px; }
        .lp-verify-step { display: flex; align-items: flex-start; gap: 18px; background: rgba(15,17,23,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 22px 24px; transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s; }
        .lp-verify-step:hover { border-color: var(--accent-border); box-shadow: 0 8px 32px rgba(225,29,72,0.10); transform: translateX(4px); }
        .lp-vstep-num { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--font-fraunces), serif; font-size: 17px; font-weight: 700; flex-shrink: 0; }
        .lp-verify-step h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
        .lp-verify-step p { font-size: 13px; font-weight: 400; color: rgba(248,249,250,0.68); line-height: 1.6; margin: 0; }

        /* ── FILTERS ── */
        .lp-filters-section { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-filters-inner { max-width: 1200px; margin: 0 auto; }
        .lp-filter-note { display: inline-flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); background: var(--bg); border: 1px solid var(--border-premium); border-radius: 12px; padding: 12px 22px; }
        .lp-filter-categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .lp-filter-cat { background: var(--bg); border: 1px solid var(--border-premium); border-radius: 20px; padding: 26px; box-shadow: var(--shadow-card); transition: var(--transition-smooth); position: relative; overflow: hidden; }
        .lp-filter-cat::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent); transform: scaleX(0); transition: transform 0.3s; transform-origin: left; }
        .lp-filter-cat:hover { border-color: var(--accent-border); transform: translateY(-3px); box-shadow: 0 8px 32px rgba(225,29,72,0.08); }
        .lp-filter-cat:hover::after { transform: scaleX(1); }
        .lp-cat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .lp-cat-emoji { font-size: 22px; }
        .lp-filter-cat h3 { font-family: var(--font-fraunces), serif; font-size: 17px; font-weight: 700; color: var(--text); }
        .lp-filter-cat > p { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.55; }
        .lp-tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-ftag { border-radius: 100px; padding: 4px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: var(--transition-smooth); border: 1px solid transparent; user-select: none; }
        .lp-ftag.inc { background: rgba(46,196,160,0.12); color: #2ec4a0; border-color: rgba(46,196,160,0.30); }
        .lp-ftag.exc { background: rgba(244,63,94,0.08); color: #F43F5E; border-color: rgba(244,63,94,0.25); }
        .lp-ftag.neu { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: var(--border-premium); }
        .lp-ftag:hover { transform: scale(1.05); }
        .lp-filter-tip { font-size: 11px; color: var(--text-dim); margin-top: 12px; font-style: italic; }

        /* ── INTENTIONS ── */
        .lp-intentions { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-intentions-inner { max-width: 1100px; margin: 0 auto; }
        .lp-intentions-header { text-align: center; margin-bottom: 56px; }
        .lp-intentions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 14px; }
        .lp-intent-card { border: 1px solid var(--border-premium); border-radius: 20px; padding: 28px 18px; text-align: center; background: var(--bg-card-grad); box-shadow: var(--shadow-card); transition: all 0.25s cubic-bezier(.34,1.56,.64,1); cursor: default; }
        .lp-intent-card:hover { border-color: var(--accent-border); background: rgba(225,29,72,0.06); transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(225,29,72,0.12); }
        .lp-intent-icon { width: 46px; height: 46px; margin: 0 auto 14px; color: var(--accent); transition: transform 0.3s; }
        .lp-intent-card:hover .lp-intent-icon { transform: scale(1.15) rotate(-5deg); }
        .lp-intent-card h3 { font-family: var(--font-fraunces), serif; font-size: 15px; font-weight: 700; margin-bottom: 5px; color: var(--text); }
        .lp-intent-card p { font-size: 11px; font-weight: 400; color: rgba(248,249,250,0.65); line-height: 1.55; }

        /* ── HOW IT WORKS ── */
        .lp-how { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-how-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-steps-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; margin-top: 60px; position: relative; }
        .lp-steps-row::before { content: ''; position: absolute; top: 34px; left: 12%; right: 12%; height: 1px; background: linear-gradient(90deg, var(--accent), rgba(225,29,72,0.2)); }
        .lp-how-step { position: relative; z-index: 1; opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; text-align: center; }
        .lp-how-step.visible { opacity: 1; transform: translateY(0); }
        .lp-how-step:nth-child(1) { transition-delay: 0s; } .lp-how-step:nth-child(2) { transition-delay: .15s; } .lp-how-step:nth-child(3) { transition-delay: .3s; } .lp-how-step:nth-child(4) { transition-delay: .45s; }
        .lp-step-icon { width: 68px; height: 68px; border-radius: 50%; background: var(--bg); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; box-shadow: 0 4px 20px rgba(225,29,72,0.12); transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s; }
        .lp-how-step:hover .lp-step-icon { transform: translateY(-6px) scale(1.08); box-shadow: 0 14px 32px rgba(225,29,72,0.25); }
        .lp-step-icon svg { width: 26px; height: 26px; color: var(--accent); }
        .lp-how-step h3 { font-family: var(--font-fraunces), serif; font-size: 17px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
        .lp-how-step p { font-size: 13px; font-weight: 400; color: rgba(248,249,250,0.65); line-height: 1.6; }

        /* ── PRICING ── */
        .lp-pricing { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-pricing-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .lp-card { background: rgba(15,17,23,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 36px 28px; text-align: left; position: relative; transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s; }
        .lp-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
        .lp-card.mid { border-color: var(--accent-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(225,29,72,0.06)); }
        .lp-card.vip { border-color: var(--gold-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(245,158,11,0.06)); }
        .lp-feat-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700; padding: 5px 18px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
        .lp-feat-badge.rose { background: var(--accent-grad); color: #fff; }
        .lp-feat-badge.gold { background: var(--gold); color: #fff; }
        .lp-plan-name { font-family: var(--font-fraunces), serif; font-size: 26px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
        .lp-plan-area { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 16px; }
        .lp-plan-price { font-family: var(--font-fraunces), serif; font-size: 52px; font-weight: 700; letter-spacing: -2px; line-height: 1; margin-bottom: 2px; color: var(--text); }
        .lp-plan-price sup { font-size: 20px; vertical-align: top; margin-top: 10px; display: inline-block; }
        .lp-plan-period { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
        .lp-plan-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6; padding-bottom: 20px; border-bottom: 1px solid var(--border-premium); }
        .lp-feats { list-style: none; margin-bottom: 28px; padding: 0; }
        .lp-feats li { font-size: 13px; color: var(--text-muted); padding: 7px 0; border-bottom: 1px solid var(--border-soft); display: flex; align-items: flex-start; gap: 8px; }
        .lp-feats li:last-child { border-bottom: none; }
        .lp-feats li::before { content: ''; display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: rgba(225,29,72,0.12); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23E11D48' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; flex-shrink: 0; margin-top: 1px; }
        .lp-feats li.off { opacity: .4; }
        .lp-feats li.off::before { background-color: rgba(255,255,255,0.06); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3' stroke-linecap='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E"); }
        .lp-feats li.gold-check::before { background-color: rgba(245,158,11,0.12); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); }
        .lp-btn-price { display: block; text-align: center; padding: 13px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; transition: opacity 0.2s, transform 0.15s; cursor: pointer; }
        .lp-btn-price:hover { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn-outline-p { border: 1px solid var(--border-premium); color: var(--text); }
        .lp-btn-outline-p:hover { border-color: rgba(255,255,255,0.2); }
        .lp-btn-rose { background: var(--accent-grad); color: #fff; box-shadow: 0 4px 16px rgba(225,29,72,.20); }
        .lp-btn-gold { background: var(--gold); color: #fff; }

        /* ── DIFERENCIAIS ── */
        .lp-diff { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-diff-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 60px; }
        .lp-diff-card {
          background: var(--bg-card-grad); border: 1px solid var(--border-premium); border-radius: 28px; box-shadow: var(--shadow-card);
          padding: 44px 32px; text-align: left; position: relative; overflow: hidden;
          transition: border-color 0.35s, transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s;
        }
        .lp-diff-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--accent), rgba(129,140,248,0.8));
          transform: scaleX(0); transition: transform 0.4s ease; transform-origin: left;
        }
        .lp-diff-card:hover { border-color: var(--accent-border); transform: translateY(-8px); box-shadow: 0 24px 60px rgba(225,29,72,0.1); }
        .lp-diff-card:hover::before { transform: scaleX(1); }
        .lp-diff-num { font-family: var(--font-fraunces), serif; font-size: 64px; font-weight: 700; color: rgba(225,29,72,0.08); line-height: 1; margin-bottom: 16px; }
        .lp-diff-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--accent-soft); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: var(--accent); }
        .lp-diff-card h3 { font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 700; margin-bottom: 12px; color: var(--text); }
        .lp-diff-card p { font-size: 14px; font-weight: 400; color: rgba(248,249,250,0.68); line-height: 1.75; margin: 0; }
        .lp-diff-tag { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; background: var(--accent-soft); border: 1px solid var(--accent-border); color: #F43F5E; padding: 5px 14px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

        /* ── FOOTER CONTACT ── */
        .lp-footer-contact { max-width: 1100px; margin: 0 auto; padding: 40px 56px; border-top: 1px solid var(--border-premium); }
        .lp-footer-contact h4 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(248,249,250,0.5); margin-bottom: 20px; }
        .lp-contact-form { display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 12px; align-items: end; }
        .lp-contact-form select, .lp-contact-form input, .lp-contact-form textarea {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border-premium); border-radius: 10px;
          color: var(--text); font-family: var(--font-jakarta), sans-serif; font-size: 13px; padding: 10px 14px;
          outline: none; transition: border-color 0.2s;
          appearance: none; -webkit-appearance: none;
        }
        .lp-contact-form select:focus, .lp-contact-form input:focus, .lp-contact-form textarea:focus { border-color: rgba(225,29,72,0.4); }
        .lp-contact-form textarea { resize: none; height: 42px; }
        .lp-contact-form option { background: #13161F; }
        .lp-contact-btn { background: var(--accent-grad); color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: var(--transition-smooth); font-family: var(--font-jakarta), sans-serif; box-shadow: 0 4px 16px rgba(225,29,72,.20); }
        .lp-contact-btn:hover { background: #be123c; }
        @media (max-width: 960px) { .lp-contact-form { grid-template-columns: 1fr 1fr; } .lp-diff-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .lp-contact-form { grid-template-columns: 1fr; } .lp-footer-contact { padding: 32px 24px; } }

        /* ── GAMIFICATION ── */
        .lp-gamif { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-gamif-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-gamif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .lp-gamif-card { background: var(--bg); border: 1px solid var(--border-premium); border-radius: 24px; padding: 36px 28px; text-align: left; box-shadow: var(--shadow-card); transition: var(--transition-smooth); }
        .lp-gamif-card:hover { border-color: var(--accent-border); transform: translateY(-4px); }
        .lp-gamif-icon { width: 52px; height: 52px; border-radius: 14px; background: var(--accent-soft); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: var(--accent); }
        .lp-gamif-card h3 { font-family: var(--font-fraunces), serif; font-size: 20px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .lp-gamif-card p { font-size: 14px; font-weight: 400; color: rgba(248,249,250,0.68); line-height: 1.7; margin: 0; }

        /* ── INSTALL PWA ── */
        .lp-install { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-install-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-install-left h2 { font-family: var(--font-fraunces), serif; font-size: clamp(30px, 4vw, 52px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
        .lp-install-left h2 em { color: var(--accent); font-style: italic; }
        .lp-install-left p { font-size: 16px; color: var(--text-muted); line-height: 1.75; margin-bottom: 32px; max-width: 440px; }
        .lp-install-os-tabs { display: flex; gap: 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-premium); margin-bottom: 16px; max-width: 360px; }
        .lp-os-tab { flex: 1; padding: 11px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text-muted); font-family: var(--font-jakarta), sans-serif; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.2s, color 0.2s; }
        .lp-os-tab:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .lp-os-tab.active { background: var(--accent-grad); color: #fff; }
        .lp-install-actions { display: flex; flex-direction: column; gap: 12px; max-width: 360px; }
        .lp-install-btn { display: flex; align-items: center; gap: 12px; padding: 15px 24px; border-radius: 14px; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: transform 0.15s, box-shadow 0.2s, background 0.2s; font-family: var(--font-jakarta), sans-serif; width: 100%; }
        .lp-install-btn:hover { transform: translateY(-2px); }
        .lp-install-btn.android { background: var(--accent-grad); color: #fff; box-shadow: 0 4px 16px rgba(225,29,72,.25), 0 12px 40px rgba(225,29,72,.20); }
        .lp-install-btn.android:hover { background: #be123c; box-shadow: 0 12px 40px rgba(225,29,72,.45); }
        .lp-install-btn.ios { background: rgba(255,255,255,0.06); color: var(--text); border: 1px solid var(--border-premium); cursor: default; }
        .lp-install-btn-icon { width: 22px; height: 22px; flex-shrink: 0; }
        .lp-install-btn-text { display: flex; flex-direction: column; text-align: left; }
        .lp-install-btn-text small { font-size: 11px; font-weight: 400; opacity: 0.7; margin-bottom: 1px; }
        .lp-install-done { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #4ade80; font-weight: 600; padding: 15px 0; }
        .lp-install-right { display: flex; flex-direction: column; gap: 16px; }
        .lp-install-step { display: flex; align-items: flex-start; gap: 16px; background: var(--bg); border: 1px solid var(--border-premium); border-radius: 16px; padding: 20px 22px; }
        .lp-install-step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-fraunces), serif; font-size: 15px; font-weight: 700; flex-shrink: 0; }
        .lp-install-step-num.android { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
        .lp-install-step-num.ios { background: rgba(255,255,255,0.06); color: rgba(248,249,250,0.6); border: 1px solid var(--border-premium); }
        .lp-install-step h4 { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
        .lp-install-step p { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0; }
        .lp-install-os-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin: 8px 0 4px; }
        @media (max-width: 960px) { .lp-install-inner { grid-template-columns: 1fr; gap: 48px; } .lp-install { padding: 72px 24px; } .lp-install-actions { max-width: 100%; } .lp-install-os-tabs { max-width: 100%; } }

        /* ── TESTIMONIALS ── */
        .lp-testi { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-testi-inner { max-width: 1100px; margin: 0 auto; }
        .lp-testi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; }
        .lp-testi-card { background: rgba(15,17,23,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 30px; transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s; }
        .lp-testi-card:hover { border-color: rgba(225,29,72,0.25); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(225,29,72,0.08); }
        .lp-testi-stars { color: var(--gold); font-size: 13px; margin-bottom: 14px; letter-spacing: 2px; }
        .lp-testi-text { font-size: 14px; font-weight: 400; color: rgba(248,249,250,0.78); line-height: 1.75; margin-bottom: 20px; font-style: italic; }
        .lp-testi-author { display: flex; align-items: center; gap: 12px; }
        .lp-testi-av { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-testi-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
        .lp-testi-role { font-size: 11px; color: var(--text-dim); }

        /* ── FAQ ── */
        /* ── QUEM SOMOS ── */
        .lp-about { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-about-inner { max-width: 1060px; margin: 0 auto; }
        .lp-about-intro { display: grid; grid-template-columns: 1fr 1.25fr; gap: 80px; align-items: start; margin-bottom: 64px; }
        .lp-about-intro-left h2 { font-family: var(--font-fraunces), serif; font-size: clamp(30px, 3.6vw, 52px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.08; margin-bottom: 0; }
        .lp-about-intro-left h2 em { font-style: italic; color: var(--accent); }
        .lp-about-intro-right > p { font-size: 16px; font-weight: 400; color: rgba(248,249,250,0.68); line-height: 1.85; margin-bottom: 18px; }
        .lp-about-intro-right > p:last-child { margin-bottom: 0; }
        .lp-about-intro-right > p.lp-about-highlight { font-size: 18px; font-weight: 600; color: rgba(248,249,250,0.90); font-style: italic; border-left: 3px solid var(--accent); padding-left: 16px; margin: 24px 0; }
        .lp-about-pillars { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-bottom: 40px; }
        .lp-about-pillar { background: var(--bg-card-grad); border: 1px solid var(--border-premium); border-radius: 20px; padding: 28px 24px; box-shadow: var(--shadow-card); }
        .lp-about-pillar-label { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .lp-about-pillar h4 { font-family: var(--font-fraunces), serif; font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.3; }
        .lp-about-pillar p { font-size: 13.5px; font-weight: 400; color: rgba(248,249,250,0.60); line-height: 1.72; margin: 0; }
        .lp-about-brand { display: flex; gap: 0; align-items: stretch; background: var(--bg-card-grad); border: 1px solid var(--border-premium); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-card); }
        .lp-about-brand-logo { display: flex; align-items: center; justify-content: center; padding: 32px 40px; border-right: 1px solid var(--border-premium); flex-shrink: 0; }
        .lp-about-brand-logo img { width: 130px; height: auto; }
        .lp-about-brand-cards { display: flex; flex: 1; }
        .lp-about-brand-card { flex: 1; padding: 28px 28px; border-right: 1px solid var(--border-premium); }
        .lp-about-brand-card:last-child { border-right: none; }
        .lp-about-brand-card .label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
        .lp-about-brand-card .val { font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .lp-about-brand-card .note { font-size: 12.5px; color: rgba(248,249,250,0.52); font-weight: 400; line-height: 1.6; }
        @media (max-width: 900px) {
          .lp-about-intro { grid-template-columns: 1fr; gap: 36px; }
          .lp-about-pillars { grid-template-columns: 1fr; }
          .lp-about-brand { flex-direction: column; }
          .lp-about-brand-logo { border-right: none; border-bottom: 1px solid var(--border-premium); }
          .lp-about-brand-cards { flex-direction: column; }
          .lp-about-brand-card { border-right: none; border-bottom: 1px solid var(--border-premium); }
          .lp-about-brand-card:last-child { border-bottom: none; }
          .lp-about { padding: 72px 24px; }
        }

        .lp-faq { padding: 100px 56px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-faq-inner { max-width: 760px; margin: 0 auto; text-align: center; }
        .lp-faq-list { margin-top: 56px; text-align: left; }

        /* ── SAFETY ── */
        .lp-safety { padding: 90px 56px; background: var(--bg); border-top: 1px solid var(--border-premium); }
        .lp-safety-inner { max-width: 1100px; margin: 0 auto; }
        .lp-safety h2 { font-family: var(--font-fraunces), serif; font-size: clamp(24px, 3vw, 40px); font-weight: 700; letter-spacing: -1px; margin-bottom: 40px; color: var(--text); }
        .lp-safety h2 em { color: var(--accent); font-style: italic; }
        .lp-safety-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .lp-safety-item { display: flex; align-items: flex-start; gap: 14px; background: var(--bg-card-grad); border: 1px solid var(--border-premium); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-card); transition: var(--transition-smooth); }
        .lp-safety-item:hover { border-color: var(--accent-border); }
        .lp-safety-icon { width: 20px; height: 20px; flex-shrink: 0; color: var(--accent); margin-top: 2px; }
        .lp-safety-item strong { color: var(--text); display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600; }
        .lp-safety-item p { font-size: 12px; color: var(--text-muted); line-height: 1.55; margin: 0; }

        /* ── CTA ── */
        .lp-cta { padding: 110px 56px; background: var(--bg); text-align: center; position: relative; overflow: hidden; }
        .lp-cta::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 30%, rgba(225,29,72,0.10) 0%, transparent 60%); }
        .lp-cta h2 { font-family: var(--font-fraunces), serif; font-size: clamp(36px, 5vw, 66px); font-weight: 700; letter-spacing: -2px; color: var(--text); margin-bottom: 18px; line-height: 1.08; position: relative; }
        .lp-cta p { color: var(--text-muted); font-size: 17px; margin-bottom: 44px; position: relative; }
        .lp-btn-cta-white { background: #f0ece4; color: #08090E; padding: 17px 46px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: transform 0.15s, box-shadow 0.2s; cursor: pointer; position: relative; }
        .lp-btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .lp-cta-note { color: rgba(255,255,255,.45); font-size: 13px; margin-top: 20px; position: relative; }

        /* ── FOOTER ── */
        .lp-footer { background: #020306; color: var(--text-dim); border-top: 1px solid var(--border-premium); }
        .lp-footer-top { max-width: 1100px; margin: 0 auto; padding: 60px 56px 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .lp-footer-logo { font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 12px; display: block; text-decoration: none; }
        .lp-footer-logo span { color: var(--accent); }
        .lp-footer-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(248,249,250,0.5); margin-bottom: 16px; }
        .lp-footer-col a { display: block; font-size: 13px; color: var(--text-dim); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .lp-footer-col a:hover { color: rgba(248,249,250,0.7); }
        .lp-footer-bottom { border-top: 1px solid var(--border-premium); padding: 24px 56px; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .lp-footer-bottom p { font-size: 12px; }
        .lp-footer-btm-links { display: flex; gap: 20px; }
        .lp-footer-btm-links a { font-size: 12px; color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
        .lp-footer-btm-links a:hover { color: rgba(248,249,250,0.6); }

        /* ── RESPONSIVE ── */
        /* ── BG FADE ── */
        .lp-bg-fade { position: relative; }
        .lp-bg-fade::before, .lp-bg-fade::after {
          content: ''; position: absolute; left: 0; right: 0; height: 180px; z-index: 2; pointer-events: none;
        }
        .lp-bg-fade::before { top: 0; background: linear-gradient(to bottom, #08090E 0%, transparent 100%); }
        .lp-bg-fade::after { bottom: 0; background: linear-gradient(to top, #08090E 0%, transparent 100%); }
        .lp-bg-fade > * { position: relative; z-index: 3; }

        /* ── NOTIFICATIONS ── */
        @keyframes lp-notif-in { from { opacity:0; transform:translateY(10px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes lp-notif-out { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-10px) scale(0.95); } }
        .lp-notif-area { position:absolute; bottom:0; left:50%; transform:translateX(-50%); z-index:20; display:flex; flex-direction:column; align-items:center; gap:8px; pointer-events:none; }
        .lp-notif-item { background:rgba(8,9,14,0.90); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.13); border-radius:100px; padding:8px 16px; font-size:12px; font-weight:600; color:var(--text); white-space:nowrap; display:flex; align-items:center; gap:6px; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
        .lp-notif-enter { animation: lp-notif-in 0.4s ease forwards; }
        .lp-notif-exit { animation: lp-notif-out 0.4s ease forwards; }

        /* ── CARD DECK ── */
        @keyframes swipe-left-anim { from { transform:translateX(0) rotate(0deg); opacity:1; } to { transform:translateX(-160%) rotate(-28deg); opacity:0; } }
        @keyframes swipe-right-anim { from { transform:translateX(0) rotate(0deg); opacity:1; } to { transform:translateX(160%) rotate(28deg); opacity:0; } }
        @keyframes swipe-up-anim { from { transform:translateY(0) scale(1); opacity:1; } to { transform:translateY(-140%) scale(0.85); opacity:0; } }
        @keyframes card-enter { from { opacity:0; transform:scale(0.90) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes match-glow { 0%{box-shadow:0 0 0 0 rgba(46,196,160,0.6)} 50%{box-shadow:0 0 0 20px rgba(46,196,160,0)} 100%{box-shadow:0 0 0 0 rgba(46,196,160,0)} }
        @keyframes nope-glow { 0%{box-shadow:0 0 0 0 rgba(244,63,94,0.6)} 50%{box-shadow:0 0 0 20px rgba(244,63,94,0)} 100%{box-shadow:0 0 0 0 rgba(244,63,94,0)} }
        .card-swipe-left { animation: swipe-left-anim 0.42s cubic-bezier(0.55,0,1,0.45) forwards; }
        .card-swipe-right { animation: swipe-right-anim 0.42s cubic-bezier(0.55,0,1,0.45) forwards; pointer-events:none; }
        .card-swipe-up { animation: swipe-up-anim 0.42s cubic-bezier(0.55,0,1,0.45) forwards; }
        .card-entering { animation: card-enter 0.38s cubic-bezier(.34,1.4,.64,1) forwards; }
        .lp-swipe-label { position:absolute; top:20px; border-radius:8px; padding:6px 16px; font-size:14px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; border:2px solid; opacity:0; pointer-events:none; z-index:10; transition:opacity 0.15s; }
        .lp-swipe-label.nope { left:16px; color:#F43F5E; border-color:#F43F5E; transform:rotate(-15deg); }
        .lp-swipe-label.like { right:16px; color:#4ade80; border-color:#4ade80; transform:rotate(15deg); }
        .lp-swipe-label.super { top:auto; bottom:80px; left:50%; transform:translateX(-50%); color:#F59E0B; border-color:#F59E0B; }
        .card-swipe-left .lp-swipe-label.nope, .card-swipe-right .lp-swipe-label.like, .card-swipe-up .lp-swipe-label.super { opacity:1; }
        .lp-deck-wrap { position:relative; width:340px; height:580px; display:flex; align-items:center; justify-content:center; }
        .lp-deck-side { position:absolute; width:220px; height:460px; border-radius:30px; overflow:hidden; filter:blur(5px); opacity:0.30; border:1px solid rgba(255,255,255,0.05); background:var(--bg-card); top:50%; transform:translateY(-50%); transition:opacity 0.3s; }
        .lp-deck-left { left:0; }
        .lp-deck-right { right:0; }
        .lp-deck-side-img { width:100%; height:100%; object-fit:cover; object-position:top; }
        .lp-ph-btn { width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; transition:transform 0.15s, box-shadow 0.2s; }
        .lp-ph-btn:hover { transform:scale(1.12); }
        .lp-ph-btn:active { transform:scale(0.95); }
        .lp-ph-btn.no:active { animation:nope-glow 0.5s ease; }
        .lp-ph-btn.yes:active { animation:match-glow 0.5s ease; }

        /* ── CTA melhorado ── */
        .lp-cta-title em { color:var(--accent); font-style:italic; }
        @keyframes cta-title-glow { 0%,100%{text-shadow:0 0 30px rgba(225,29,72,0.2)} 50%{text-shadow:0 0 60px rgba(225,29,72,0.45)} }
        .lp-cta-title { animation:cta-title-glow 4s ease-in-out infinite; }
        @keyframes cta-fade-up { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .lp-cta-sub { animation: cta-fade-up 0.8s 0.3s ease both; }
        .lp-cta-sub strong { color:var(--text); font-weight:700; }
        .lp-cta-sub em { color:var(--accent); font-style:italic; font-weight:600; }

        /* ── HAMBÚRGUER ── */
        .lp-hamburger { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 40px; height: 40px; background: none; border: none; cursor: pointer; padding: 4px; }
        .lp-hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; transition: transform 0.3s, opacity 0.3s; }
        .lp-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .lp-hamburger.open span:nth-child(2) { opacity: 0; }
        .lp-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── DRAWER MOBILE ── */
        .lp-mobile-menu { display: none; position: fixed; inset: 0; z-index: 199; }
        .lp-mobile-menu.open { display: block; }
        .lp-mobile-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
        .lp-mobile-drawer { position: absolute; top: 0; right: 0; width: 280px; height: 100%; background: #0F1117; border-left: 1px solid rgba(255,255,255,0.07); padding: 80px 28px 40px; display: flex; flex-direction: column; gap: 8px; }
        .lp-mobile-drawer a { color: rgba(248,249,250,0.7); text-decoration: none; font-size: 18px; font-weight: 500; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: block; transition: color 0.2s; }
        .lp-mobile-drawer a:hover { color: #F8F9FA; }
        .lp-mobile-drawer .lp-nav-cta { background: var(--accent-grad) !important; color: #fff !important; border-radius: 12px !important; padding: 14px 20px !important; border-bottom: none !important; text-align: center; margin-top: 12px; font-weight: 600 !important; box-shadow: 0 4px 16px rgba(225,29,72,.20) !important; }

        @media (max-width: 960px) {
          .lp-nav { width: calc(100% - 32px); top: 12px; padding: 12px 20px; }
          .lp-nav-links { display: none; }
          .lp-hamburger { display: flex; }
          .lp-hero { grid-template-columns: 1fr; padding: 110px 24px 60px; }
          .lp-hero-right { display: flex; justify-content: center; margin-top: 40px; }
          .lp-deck-wrap { width: 300px; height: 520px; }
          .lp-deck-side { width: 180px; height: 400px; }
          .lp-notif-area { left: 50%; transform: translateX(-50%); bottom: 0; }
          .lp-notif-item { font-size: 11px; padding: 7px 12px; }
          .lp-problem-inner, .lp-verification-inner { grid-template-columns: 1fr; gap: 40px; }
          .lp-steps-row { grid-template-columns: repeat(2, 1fr); }
          .lp-steps-row::before { display: none; }
          .lp-cards { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
          .lp-safety-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-gamif-grid { grid-template-columns: 1fr; }
          .lp-footer-top { grid-template-columns: 1fr 1fr; padding: 48px 24px; gap: 32px; }
          .lp-footer-bottom { padding: 20px 24px; flex-direction: column; text-align: center; }
          .lp-filter-categories { grid-template-columns: 1fr 1fr; }
          .lp-problem, .lp-verification, .lp-filters-section, .lp-intentions,
          .lp-how, .lp-pricing, .lp-gamif, .lp-faq, .lp-safety, .lp-cta, .lp-testi { padding: 72px 24px; }
        }
        @media (max-width: 600px) {
          .lp-hero { padding: 100px 20px 48px; }
          .lp-hero h1 { font-size: 40px; }
          .lp-actions { flex-direction: column; }
          .lp-btn-main, .lp-btn-outline { width: 100%; justify-content: center; }
          .lp-steps-row { grid-template-columns: 1fr; }
          .lp-safety-grid { grid-template-columns: 1fr; }
          .lp-cards { grid-template-columns: 1fr; max-width: 100%; }
          .lp-footer-top { grid-template-columns: 1fr; }
          .lp-filter-categories { grid-template-columns: 1fr; }
          .lp-intentions-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-gamif-grid { grid-template-columns: 1fr; }
        }

        /* ── CSS das seções extraídas do page.tsx v2 ─────────────────────── */

        /* Stats Bar */
        .lp-stats-bar{padding:48px 24px;border-top:1px solid rgba(255,255,255,0.07);border-bottom:1px solid rgba(255,255,255,0.07)}
        .lp-stats-inner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center}
        .lp-stat-num{font-family:var(--font-fraunces),serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:var(--text);letter-spacing:-1px;line-height:1}
        .lp-stat-label-v2{font-size:13px;color:var(--text-muted);margin-top:6px}
        @media(max-width:900px){.lp-stats-inner{grid-template-columns:repeat(2,1fr)}}

        /* 4 Pilares */
        .lp-pilares-section{padding:100px 56px;background:var(--bg-card-grad);border-top:1px solid var(--border-premium);border-bottom:1px solid var(--border-premium)}
        .lp-pilares-inner{max-width:1140px;margin:0 auto}
        .lp-pilares-header{text-align:center;margin-bottom:64px}
        .lp-pilares-header h2{font-family:var(--font-fraunces),serif;font-size:clamp(30px,4vw,52px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px}
        .lp-pilares-header p{font-size:17px;color:rgba(248,249,250,0.60);line-height:1.7;max-width:480px;margin:0 auto}
        .lp-pilares-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
        .lp-pilar-card{background:var(--bg-card);border:1px solid var(--border-premium);border-radius:20px;padding:32px 26px;cursor:default;transition:transform 0.28s cubic-bezier(0.4,0,0.2,1),box-shadow 0.28s cubic-bezier(0.4,0,0.2,1),border-color 0.28s cubic-bezier(0.4,0,0.2,1)}
        .lp-pilar-card:hover{transform:translateY(-6px);box-shadow:0 24px 56px rgba(0,0,0,0.45),0 0 0 1px rgba(225,29,72,0.18);border-color:var(--accent-border)}
        .lp-pilar-card:hover .lp-pilar-title{color:var(--accent)}
        .lp-pilar-num{font-family:var(--font-fraunces),serif;font-size:13px;font-weight:700;color:rgba(225,29,72,0.40);letter-spacing:1px;margin-bottom:20px}
        .lp-pilar-title{font-family:var(--font-fraunces),serif;font-size:19px;font-weight:700;color:var(--text);margin-bottom:12px;line-height:1.25;transition:color 0.28s cubic-bezier(0.4,0,0.2,1)}
        .lp-pilar-text{font-size:14px;color:rgba(248,249,250,0.55);line-height:1.7;margin:0}
        @media(max-width:1024px){.lp-pilares-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.lp-pilares-grid{grid-template-columns:1fr}.lp-pilares-section{padding:72px 24px}}

        /* Por que não gratuito (Pillars) */
        .lp-section-v2{padding:100px 24px;position:relative}
        .lp-section-v2--dark{background:rgba(15,17,23,0.6)}
        .lp-section-inner-v2{max-width:1100px;margin:0 auto}
        .lp-section-label-v2{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:16px}
        .lp-section-title-v2{font-family:var(--font-fraunces),serif;font-size:clamp(28px,4vw,48px);font-weight:700;letter-spacing:-1.5px;line-height:1.15;margin-bottom:16px;color:var(--text)}
        .lp-section-sub-v2{font-size:clamp(15px,1.8vw,18px);color:var(--text-muted);max-width:560px;line-height:1.7;margin-bottom:56px}
        .lp-pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .lp-pillar{background:var(--bg-card);border:1px solid var(--border-premium);border-radius:20px;padding:32px 28px;transition:border-color 0.3s,transform 0.3s}
        .lp-pillar:hover{border-color:var(--accent-border);transform:translateY(-4px)}
        .lp-pillar-title{font-weight:700;font-size:18px;margin-bottom:10px;color:var(--text)}
        .lp-pillar-text{font-size:15px;color:var(--text-muted);line-height:1.65}
        @media(max-width:900px){.lp-pillars{grid-template-columns:1fr}.lp-section-v2{padding:72px 24px}}

        /* Identificação */
        .lp-ident-section{padding:100px 56px;background:var(--bg);border-top:1px solid var(--border-premium)}
        .lp-ident-inner{max-width:720px;margin:0 auto;text-align:center}
        .lp-ident-title{font-family:var(--font-fraunces),serif;font-size:clamp(30px,4vw,52px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin-bottom:48px;color:var(--text)}
        .lp-ident-bullets{display:flex;flex-direction:column;gap:0;margin-bottom:48px;text-align:left}
        .lp-ident-bullet{display:flex;align-items:center;gap:18px;padding:20px 24px;border-left:3px solid transparent;border-radius:0 12px 12px 0;cursor:default;transition:border-color 0.25s cubic-bezier(0.4,0,0.2,1),background 0.25s cubic-bezier(0.4,0,0.2,1)}
        .lp-ident-bullet:hover{border-left-color:var(--accent);background:rgba(225,29,72,0.05)}
        .lp-ident-bullet-text{font-size:clamp(16px,2vw,19px);color:rgba(248,249,250,0.65);line-height:1.5;font-weight:400;transition:color 0.25s}
        .lp-ident-bullet:hover .lp-ident-bullet-text{color:var(--text)}
        .lp-ident-bullet-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;opacity:0;transition:opacity 0.25s}
        .lp-ident-bullet:hover .lp-ident-bullet-dot{opacity:1}
        .lp-ident-closing{font-size:clamp(18px,2.2vw,22px);color:var(--text);font-weight:600;line-height:1.6;font-family:var(--font-fraunces),serif}
        .lp-ident-closing em{color:var(--accent);font-style:italic}
        @media(max-width:768px){.lp-ident-section{padding:72px 24px}}

        /* 4 Modos */
        .lp-modos-section{padding:100px 56px;background:var(--bg);border-top:1px solid var(--border-premium)}
        .lp-modos-inner{max-width:1140px;margin:0 auto}
        .lp-modos-header{text-align:center;margin-bottom:16px}
        .lp-modos-header h2{font-family:var(--font-fraunces),serif;font-size:clamp(30px,4vw,52px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px}
        .lp-modos-header p{font-size:17px;color:rgba(248,249,250,0.60);line-height:1.7;max-width:520px;margin:0 auto}
        .lp-modos-desc{text-align:center;font-size:14px;color:rgba(248,249,250,0.38);line-height:1.7;max-width:480px;margin:10px auto 56px}
        .lp-modos-layout{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
        .lp-modos-tabs{display:flex;flex-direction:column;gap:8px}
        .lp-modo-tab{display:flex;align-items:flex-start;gap:16px;padding:20px 22px;border:1px solid transparent;border-radius:16px;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);background:transparent}
        .lp-modo-tab:hover{background:rgba(225,29,72,0.04);border-color:var(--border-premium)}
        .lp-modo-tab.active{background:var(--bg-card);border-color:var(--accent-border);box-shadow:0 8px 32px rgba(0,0,0,0.3)}
        .lp-modo-tab-num{font-family:var(--font-fraunces),serif;font-size:12px;font-weight:700;color:rgba(225,29,72,0.35);flex-shrink:0;padding-top:3px;min-width:24px}
        .lp-modo-tab.active .lp-modo-tab-num{color:var(--accent)}
        .lp-modo-tab-title{font-family:var(--font-fraunces),serif;font-size:17px;font-weight:700;color:rgba(248,249,250,0.45);margin-bottom:4px;transition:color 0.25s}
        .lp-modo-tab.active .lp-modo-tab-title{color:var(--text)}
        .lp-modo-tab-text{font-size:13px;color:rgba(248,249,250,0.35);line-height:1.6;display:none}
        .lp-modo-tab.active .lp-modo-tab-text{display:block;color:rgba(248,249,250,0.55)}
        .lp-modos-preview{background:var(--bg-card);border:1px solid var(--border-premium);border-radius:24px;padding:40px 32px;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
        .lp-modos-preview-icon{width:56px;height:56px;border-radius:16px;background:var(--accent-soft);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;color:var(--accent);margin-bottom:8px}
        .lp-modos-preview-title{font-family:var(--font-fraunces),serif;font-size:22px;font-weight:700;color:var(--text);text-align:center}
        .lp-modos-preview-sub{font-size:14px;color:rgba(248,249,250,0.50);text-align:center;line-height:1.7;max-width:280px}
        @media(max-width:900px){.lp-modos-layout{grid-template-columns:1fr}.lp-modos-preview{display:none}}
        @media(max-width:600px){.lp-modos-section{padding:72px 24px}}

        /* Filtros v2 (Etapa 5) */
        .lp-filtros-v2{padding:100px 56px;background:var(--bg-card);border-top:1px solid var(--border-premium)}
        .lp-filtros-v2-inner{max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
        .lp-filtros-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(32px,4vw,54px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin:12px 0 24px}
        .lp-filtros-v2-text{font-size:17px;color:rgba(248,249,250,0.60);line-height:1.75;margin-bottom:16px}
        .lp-filtros-v2-compl{font-size:16px;color:rgba(248,249,250,0.45);line-height:1.7;margin-bottom:20px}
        .lp-filtros-v2-micro{display:inline-block;font-size:13px;font-weight:600;color:#2ec4a0;letter-spacing:0.5px;padding:6px 14px;border-radius:100px;background:rgba(46,196,160,0.10);border:1px solid rgba(46,196,160,0.25)}
        .lp-filtros-demo{background:var(--bg);border:1px solid var(--border-premium);border-radius:24px;padding:28px;box-shadow:var(--shadow-card)}
        .lp-filtros-demo-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .lp-filtros-demo-header span{font-size:13px;font-weight:600;color:rgba(248,249,250,0.50);text-transform:uppercase;letter-spacing:0.8px}
        .lp-filtros-count{background:rgba(46,196,160,0.15);border:1px solid rgba(46,196,160,0.30);color:#2ec4a0;font-size:12px;font-weight:700;padding:3px 10px;border-radius:100px}
        .lp-filtros-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
        .lp-filtro-tag{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:100px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);background:var(--bg-card);border:1px solid var(--border);color:rgba(248,249,250,0.55)}
        .lp-filtro-tag.ativo{background:rgba(46,196,160,0.12);border-color:rgba(46,196,160,0.40);color:#2ec4a0;box-shadow:0 0 0 3px rgba(46,196,160,0.08)}
        .lp-filtros-slider-wrap{border-top:1px solid var(--border-soft);padding-top:20px}
        .lp-filtros-slider-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .lp-filtros-slider-label span:first-child{font-size:13px;color:rgba(248,249,250,0.50);font-weight:500}
        .lp-filtros-slider-val{font-size:13px;font-weight:700;color:#2ec4a0}
        .lp-filtros-slider-track{height:4px;background:rgba(255,255,255,0.08);border-radius:100px;overflow:hidden;position:relative}
        .lp-filtros-slider-fill{height:100%;background:linear-gradient(90deg,rgba(46,196,160,0.5),#2ec4a0);border-radius:100px;transition:width 0.15s linear;position:relative}
        .lp-filtros-slider-fill::after{content:'';position:absolute;right:-1px;top:50%;transform:translateY(-50%);width:12px;height:12px;border-radius:50%;background:#2ec4a0;box-shadow:0 0 8px rgba(46,196,160,0.60);margin-right:-5px}
        @media(max-width:900px){.lp-filtros-v2-inner{grid-template-columns:1fr;gap:48px}}
        @media(max-width:600px){.lp-filtros-v2{padding:72px 24px}}

        /* Intencoes v2 (Etapa 6) */
        .lp-intencoes-v2{padding:100px 56px;background:var(--bg);border-top:1px solid var(--border-premium)}
        .lp-intencoes-v2-inner{max-width:1140px;margin:0 auto}
        .lp-intencoes-v2-header{text-align:center;margin-bottom:56px}
        .lp-intencoes-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(32px,4vw,54px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin:12px 0 20px}
        .lp-intencoes-v2-text{font-size:17px;color:rgba(248,249,250,0.55);line-height:1.75;max-width:540px;margin:0 auto 14px}
        .lp-intencoes-v2-compl{font-size:15px;color:rgba(248,249,250,0.35);font-style:italic}
        .lp-intencoes-grid-v2{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .lp-intencao-card-v2{background:var(--bg-card);border:1px solid var(--border-premium);border-radius:20px;padding:28px 24px;display:flex;flex-direction:column;gap:14px;transition:var(--transition-smooth);cursor:default}
        .lp-intencao-card-v2:hover{border-color:var(--accent-border);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.35)}
        .lp-intencao-icon-v2{width:44px;height:44px;border-radius:12px;background:var(--accent-soft);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0}
        .lp-intencao-title-v2{font-family:var(--font-fraunces),serif;font-size:17px;font-weight:700;color:var(--text)}
        .lp-intencao-desc-v2{font-size:13px;color:rgba(248,249,250,0.45);line-height:1.65}
        .lp-intencao-label{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);color:rgba(225,29,72,0.85);letter-spacing:0.4px;margin-top:4px;align-self:flex-start}
        @media(max-width:900px){.lp-intencoes-grid-v2{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.lp-intencoes-v2{padding:72px 24px}.lp-intencoes-grid-v2{grid-template-columns:1fr}}

        /* Seguranca v2 (Etapa 7) */
        .lp-seg-v2{padding:100px 56px;background:var(--bg-card);border-top:1px solid var(--border-premium)}
        .lp-seg-v2-inner{max-width:1140px;margin:0 auto}
        .lp-seg-v2-header{text-align:center;margin-bottom:64px}
        .lp-seg-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(32px,4vw,54px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin:12px 0 0}
        .lp-seg-phases{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:48px}
        .lp-seg-phase{background:var(--bg);border:1px solid var(--border-premium);border-radius:20px;padding:32px 28px;display:flex;flex-direction:column;gap:20px;transition:var(--transition-smooth)}
        .lp-seg-phase:hover{border-color:rgba(46,196,160,0.30);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.35)}
        .lp-seg-phase-head{display:flex;align-items:center;gap:12px}
        .lp-seg-phase-num{font-family:var(--font-fraunces),serif;font-size:13px;font-weight:700;color:rgba(248,249,250,0.25);letter-spacing:1px;text-transform:uppercase}
        .lp-seg-phase-badge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:0.5px}
        .lp-seg-phase-badge.verde{background:rgba(46,196,160,0.12);border:1px solid rgba(46,196,160,0.30);color:#2ec4a0}
        .lp-seg-phase-badge.alerta{background:rgba(225,29,72,0.10);border:1px solid rgba(225,29,72,0.25);color:var(--accent)}
        .lp-seg-phase-title{font-family:var(--font-fraunces),serif;font-size:20px;font-weight:700;color:var(--text);line-height:1.2}
        .lp-seg-phase-text{font-size:14px;color:rgba(248,249,250,0.50);line-height:1.7}
        .lp-seg-features{display:flex;flex-direction:column;gap:9px;margin-top:4px}
        .lp-seg-feat{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(248,249,250,0.60)}
        .lp-seg-feat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .lp-seg-feat-dot.verde{background:#2ec4a0;box-shadow:0 0 6px rgba(46,196,160,0.50)}
        .lp-seg-feat-dot.alerta{background:var(--accent);box-shadow:0 0 6px rgba(225,29,72,0.45)}
        .lp-seg-closing{text-align:center;padding:28px;background:var(--bg);border:1px solid var(--border-premium);border-radius:16px}
        .lp-seg-closing-text{font-family:var(--font-fraunces),serif;font-size:clamp(18px,2.5vw,26px);font-weight:700;color:var(--text)}
        .lp-seg-closing-text em{color:#2ec4a0;font-style:italic}
        @media(max-width:900px){.lp-seg-phases{grid-template-columns:1fr}}
        @media(max-width:600px){.lp-seg-v2{padding:72px 24px}}

        /* Gamificacao v2 (Etapa 8) */
        @keyframes lpSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes lpGlow{0%,100%{box-shadow:0 0 8px rgba(225,29,72,0.30)}50%{box-shadow:0 0 22px rgba(225,29,72,0.70),0 0 40px rgba(225,29,72,0.20)}}
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes lpPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.75;transform:scale(0.96)}}
        .lp-gamif-v2{padding:100px 56px;background:var(--bg);border-top:1px solid var(--border-premium)}
        .lp-gamif-v2-inner{max-width:1140px;margin:0 auto}
        .lp-gamif-v2-header{text-align:center;margin-bottom:64px}
        .lp-gamif-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(32px,4vw,54px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin:12px 0 16px}
        .lp-gamif-v2-sub{font-size:17px;color:rgba(248,249,250,0.55);line-height:1.7;max-width:480px;margin:0 auto 12px}
        .lp-gamif-v2-text{font-size:15px;color:rgba(248,249,250,0.35);line-height:1.7;max-width:520px;margin:0 auto}
        .lp-gamif-v2-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
        .lp-gamif-v2-card{background:var(--bg-card);border:1px solid var(--border-premium);border-radius:20px;padding:32px;display:flex;gap:20px;align-items:flex-start;transition:var(--transition-smooth)}
        .lp-gamif-v2-card:hover{border-color:var(--accent-border);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.35)}
        .lp-gamif-v2-icon{width:52px;height:52px;border-radius:14px;background:var(--accent-soft);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0}
        .lp-gamif-v2-icon.spin svg{animation:lpSpin 4s linear infinite}
        .lp-gamif-v2-icon.glow{animation:lpGlow 2.4s ease-in-out infinite}
        .lp-gamif-v2-icon.float svg{animation:lpFloat 2.8s ease-in-out infinite}
        .lp-gamif-v2-icon.pulse svg{animation:lpPulse 2s ease-in-out infinite}
        .lp-gamif-v2-card-title{font-family:var(--font-fraunces),serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px}
        .lp-gamif-v2-card-text{font-size:13px;color:rgba(248,249,250,0.45);line-height:1.7}
        .lp-gamif-v2-card-tag{display:inline-block;margin-top:12px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);color:rgba(225,29,72,0.80);letter-spacing:0.4px}
        @media(max-width:768px){.lp-gamif-v2-grid{grid-template-columns:1fr}}
        @media(max-width:600px){.lp-gamif-v2{padding:72px 24px}}

        /* Encontro v2 (Etapa 9) */
        .lp-enc-v2{padding:96px 24px;background:#08090E}
        .lp-enc-v2-inner{max-width:640px;margin:0 auto}
        .lp-enc-v2-header{text-align:center;margin-bottom:64px}
        .lp-enc-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(2rem,5vw,2.875rem);font-weight:700;color:var(--text);line-height:1.15;margin:12px 0 20px}
        .lp-enc-v2-text{font-size:1.0625rem;color:var(--muted);max-width:480px;margin:0 auto 12px;line-height:1.7}
        .lp-enc-v2-comp{font-size:0.9375rem;color:rgba(248,249,250,0.32);font-style:italic}
        .lp-enc-v2-steps{display:flex;flex-direction:column}
        .lp-enc-v2-step{display:flex;gap:20px;align-items:flex-start}
        .lp-enc-v2-step-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:40px}
        .lp-enc-v2-step-dot{width:40px;height:40px;border-radius:50%;background:rgba(15,20,45,0.80);border:1.5px solid rgba(59,130,246,0.22);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:rgba(147,197,253,0.65);letter-spacing:0.5px;flex-shrink:0}
        .lp-enc-v2-step-line{width:1.5px;flex:1;min-height:36px;background:linear-gradient(180deg,rgba(59,130,246,0.18) 0%,rgba(59,130,246,0.04) 100%);margin:4px 0}
        .lp-enc-v2-step-body{padding-bottom:36px;flex:1}
        .lp-enc-v2-step:last-child .lp-enc-v2-step-body{padding-bottom:0}
        .lp-enc-v2-step-title{font-family:var(--font-fraunces),serif;font-size:1.125rem;font-weight:700;color:var(--text);margin-bottom:8px;margin-top:8px}
        .lp-enc-v2-step-text{font-size:0.9rem;color:var(--muted);line-height:1.65;margin:0}
        @media(max-width:600px){.lp-enc-v2{padding:72px 24px}}

        /* Perfil v2 (Etapa 10) */
        .lp-perf-v2{padding:96px 24px;background:#0a0c14}
        .lp-perf-v2-inner{max-width:560px;margin:0 auto;text-align:center}
        .lp-perf-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(2rem,5vw,2.875rem);font-weight:700;color:var(--text);line-height:1.15;margin:12px 0 20px}
        .lp-perf-v2-text{font-size:1.0625rem;color:var(--muted);line-height:1.7;margin-bottom:48px}
        .lp-perf-v2-demo{display:flex;flex-direction:column;align-items:center;gap:28px}
        .lp-perf-v2-toggle{position:relative;display:inline-flex;align-items:center;background:rgba(19,22,31,0.95);border:1px solid rgba(255,255,255,0.07);border-radius:100px;padding:4px}
        .lp-perf-v2-pill{position:absolute;top:4px;height:calc(100% - 8px);width:calc(50% - 4px);background:var(--accent);border-radius:100px;animation:lpPerfPill 5s ease-in-out infinite}
        .lp-perf-v2-opt{position:relative;z-index:1;padding:10px 28px;font-size:14px;font-weight:600;border-radius:100px;min-width:110px}
        .lp-perf-v2-opt--a{animation:lpPerfOptA 5s ease-in-out infinite}
        .lp-perf-v2-opt--b{animation:lpPerfOptB 5s ease-in-out infinite}
        @keyframes lpPerfPill{0%,40%{left:4px}50%,90%{left:calc(50%)}100%{left:4px}}
        @keyframes lpPerfOptA{0%,40%{color:#fff}50%,90%{color:rgba(248,249,250,0.45)}100%{color:#fff}}
        @keyframes lpPerfOptB{0%,40%{color:rgba(248,249,250,0.45)}50%,90%{color:#fff}100%{color:rgba(248,249,250,0.45)}}
        .lp-perf-v2-card-wrap{position:relative;width:280px;height:80px}
        .lp-perf-v2-card{position:absolute;inset:0;display:flex;align-items:center;gap:16px;background:rgba(19,22,31,0.95);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px}
        .lp-perf-v2-card--a{animation:lpPerfCardA 5s ease-in-out infinite}
        .lp-perf-v2-card--b{animation:lpPerfCardB 5s ease-in-out infinite}
        @keyframes lpPerfCardA{0%,40%{opacity:1;transform:scale(1)}50%,90%{opacity:0;transform:scale(0.96)}100%{opacity:1;transform:scale(1)}}
        @keyframes lpPerfCardB{0%,40%{opacity:0;transform:scale(0.96)}50%,90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.96)}}
        .lp-perf-v2-avatar{width:44px;height:44px;border-radius:50%;flex-shrink:0}
        .lp-perf-v2-avatars{display:flex;flex-shrink:0}
        .lp-perf-v2-avatar--2{margin-left:-12px;border:2px solid rgba(10,12,20,0.95)}
        .lp-perf-v2-card-name{font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px}
        .lp-perf-v2-card-sub{font-size:12px;color:var(--muted)}
        @media(max-width:600px){.lp-perf-v2{padding:72px 24px}}

        /* Backstage v2 (Etapa 11) */
        .lp-back-v2{padding:96px 24px;background:linear-gradient(180deg,#060609 0%,#0a0508 100%);position:relative;overflow:hidden}
        .lp-back-v2::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 40%,rgba(120,0,20,0.12) 0%,transparent 70%);pointer-events:none}
        .lp-back-v2-inner{max-width:680px;margin:0 auto;position:relative;z-index:1}
        .lp-back-v2-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:rgba(180,0,30,0.85);display:block;margin-bottom:16px}
        .lp-back-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(2.25rem,5vw,3.25rem);font-weight:700;color:var(--text);line-height:1.1;margin-bottom:24px}
        .lp-back-v2-text{font-size:1.125rem;color:rgba(248,249,250,0.55);line-height:1.75;max-width:520px;margin-bottom:16px}
        .lp-back-v2-comp{font-size:1rem;color:rgba(180,0,30,0.75);font-weight:600}
        .lp-back-v2-badge{display:inline-flex;align-items:center;gap:8px;margin-top:40px;padding:10px 20px;border-radius:100px;background:rgba(120,0,20,0.15);border:1px solid rgba(180,0,30,0.22);font-size:13px;color:rgba(248,249,250,0.50)}
        .lp-back-v2-badge-dot{width:8px;height:8px;border-radius:50%;background:rgba(180,0,30,0.70);animation:lpBackPulse 2.4s ease-in-out infinite}
        @keyframes lpBackPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.50;transform:scale(0.80)}}
        @media(max-width:600px){.lp-back-v2{padding:72px 24px}}

        /* Planos v2 (Etapa 12) */
        .lp-plans-v2{padding:96px 24px;background:#08090E}
        .lp-plans-v2-inner{max-width:860px;margin:0 auto}
        .lp-plans-v2-header{text-align:center;margin-bottom:56px}
        .lp-plans-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(2rem,5vw,2.875rem);font-weight:700;color:var(--text);line-height:1.15;margin:12px 0 16px}
        .lp-plans-v2-sub{font-size:1.0625rem;color:var(--muted);line-height:1.7}
        .lp-plans-v2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
        .lp-plans-v2-card{border-radius:20px;padding:28px 24px;border:1px solid rgba(255,255,255,0.07);background:rgba(19,22,31,0.95);position:relative;transition:transform 0.25s,box-shadow 0.25s}
        .lp-plans-v2-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.35)}
        .lp-plans-v2-card--featured{border-color:rgba(225,29,72,0.35);background:linear-gradient(180deg,rgba(30,8,14,0.98) 0%,rgba(19,22,31,0.98) 100%);box-shadow:0 0 0 1px rgba(225,29,72,0.20),0 12px 40px rgba(225,29,72,0.12)}
        .lp-plans-v2-card--black{border-color:rgba(245,158,11,0.22);background:linear-gradient(180deg,rgba(20,15,5,0.98) 0%,rgba(19,22,31,0.98) 100%)}
        .lp-plans-v2-badge{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:4px 12px;border-radius:100px;margin-bottom:16px}
        .lp-plans-v2-badge--featured{background:rgba(225,29,72,0.15);color:var(--accent);border:1px solid rgba(225,29,72,0.25)}
        .lp-plans-v2-badge--black{background:rgba(245,158,11,0.12);color:#F59E0B;border:1px solid rgba(245,158,11,0.22)}
        .lp-plans-v2-badge--free{background:rgba(255,255,255,0.06);color:rgba(248,249,250,0.45);border:1px solid rgba(255,255,255,0.08)}
        .lp-plans-v2-name{font-family:var(--font-fraunces),serif;font-size:1.375rem;font-weight:700;color:var(--text);margin-bottom:6px}
        .lp-plans-v2-desc{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:20px;min-height:40px}
        .lp-plans-v2-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .lp-plans-v2-feats li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:rgba(248,249,250,0.65)}
        .lp-plans-v2-feats li span{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
        .lp-plans-v2-feats li span.ok{background:rgba(16,185,129,0.15);color:#10b981}
        .lp-plans-v2-feats li span.acc{background:rgba(225,29,72,0.12);color:var(--accent)}
        .lp-plans-v2-cta{display:block;width:100%;padding:12px;border-radius:12px;font-size:14px;font-weight:700;text-align:center;cursor:default}
        .lp-plans-v2-cta--free{background:rgba(255,255,255,0.06);color:rgba(248,249,250,0.65);border:1px solid rgba(255,255,255,0.08)}
        .lp-plans-v2-cta--featured{background:linear-gradient(135deg,#E11D48,#be123c);color:#fff;border:none}
        .lp-plans-v2-cta--black{background:linear-gradient(135deg,#d4880a,#b8700a);color:#fff;border:none}
        .lp-plans-v2-highlight{text-align:center;margin-top:16px;font-size:12px;color:rgba(225,29,72,0.65);font-weight:500}
        .lp-plans-v2-micro{text-align:center;margin-top:28px;font-size:13px;color:rgba(248,249,250,0.28)}
        @media(max-width:768px){.lp-plans-v2-grid{grid-template-columns:1fr;max-width:360px;margin:0 auto}}
        @media(max-width:600px){.lp-plans-v2{padding:72px 24px}}

        /* Prova Social v2 (Etapa 13) */
        .lp-social-v2{padding:96px 24px;background:linear-gradient(180deg,#08090E 0%,#0a0b11 100%)}
        .lp-social-v2-inner{max-width:560px;margin:0 auto}
        .lp-social-v2-header{text-align:center;margin-bottom:48px}
        .lp-social-v2-title{font-family:var(--font-fraunces),serif;font-size:clamp(1.875rem,5vw,2.75rem);font-weight:700;color:var(--text);line-height:1.15;margin:12px 0}
        .lp-social-v2-msgs{display:flex;flex-direction:column;gap:10px}
        .lp-social-v2-msg{display:flex;gap:12px;align-items:flex-end;animation:lpSocialIn 0.5s ease both}
        .lp-social-v2-msg--right{flex-direction:row-reverse}
        @keyframes lpSocialIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .lp-social-v2-avatar{width:32px;height:32px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#1a0a14,#3d1530)}
        .lp-social-v2-avatar--b{background:linear-gradient(135deg,#0a1020,#1a2a4a)}
        .lp-social-v2-avatar--c{background:linear-gradient(135deg,#0a1a10,#1a3a20)}
        .lp-social-v2-bubble{max-width:75%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.6;color:var(--text)}
        .lp-social-v2-bubble--left{background:rgba(19,22,31,0.95);border:1px solid rgba(255,255,255,0.07);border-bottom-left-radius:4px}
        .lp-social-v2-bubble--right{background:rgba(225,29,72,0.15);border:1px solid rgba(225,29,72,0.18);border-bottom-right-radius:4px}
        .lp-social-v2-meta{font-size:11px;color:rgba(248,249,250,0.28);margin-top:4px;text-align:right}
        .lp-social-v2-meta--left{text-align:left}
        @media(max-width:600px){.lp-social-v2{padding:72px 24px}}

        /* Features */
        .lp-features-grid{display:flex;flex-direction:column;gap:80px}
        .lp-feature{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
        .lp-feature--rev{direction:rtl}
        .lp-feature--rev>*{direction:ltr}
        .lp-feature-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:12px;display:block}
        .lp-feature-title{font-family:var(--font-fraunces),serif;font-size:clamp(22px,3vw,32px);font-weight:700;letter-spacing:-0.8px;line-height:1.2;margin-bottom:16px;color:var(--text)}
        .lp-feature-text{font-size:15px;color:var(--text-muted);line-height:1.75;margin-bottom:20px}
        .lp-feature-list{list-style:none;display:flex;flex-direction:column;gap:8px}
        .lp-feature-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--text-muted)}
        .lp-feature-list li svg{color:var(--accent);flex-shrink:0;margin-top:2px}
        .lp-feature-visual{background:linear-gradient(135deg,var(--bg-card2,#13161F),var(--bg-card));border:1px solid var(--border-premium);border-radius:24px;min-height:300px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
        .lp-feature-visual::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(225,29,72,0.06),transparent 70%)}
        .lp-fv-inner{position:relative;z-index:1;padding:32px;width:100%;text-align:center}
        @media(max-width:900px){.lp-feature{grid-template-columns:1fr;gap:32px}.lp-feature--rev{direction:ltr}}

        /* Phone Mockup v2 */
        .lp-phone-v2{width:200px;height:360px;background:var(--bg-card);border:2px solid rgba(255,255,255,0.10);border-radius:38px;margin:0 auto;position:relative;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.1)}
        .lp-phone-v2::before{content:'';position:absolute;top:12px;left:50%;transform:translateX(-50%);width:60px;height:6px;background:rgba(255,255,255,0.12);border-radius:3px}
        .lp-phone-screen-v2{position:absolute;inset:20px 8px 8px;border-radius:28px;background:var(--bg);overflow:hidden}
        .lp-phone-card-v2{position:absolute;inset:0;background:linear-gradient(180deg,#1a0a14 0%,#3d1530 60%,#1a0a14 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:16px}
        .lp-phone-name-v2{font-family:var(--font-fraunces),serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:4px}
        .lp-phone-tags-v2{display:flex;gap:4px;flex-wrap:wrap}
        .lp-phone-tag-v2{background:rgba(225,29,72,0.25);border:1px solid rgba(225,29,72,0.4);color:#fff;font-size:9px;padding:2px 6px;border-radius:100px;font-weight:500}
        .lp-phone-scanline-v2{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(225,29,72,0.6),transparent);animation:scan 2s linear infinite}
        .lp-phone-verified-v2{position:absolute;top:12px;right:12px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px}
        @keyframes scan{0%{top:8%}100%{top:92%}}
        @keyframes float-y{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}

        /* Camarote */
        .lp-camarote-wrap{background:linear-gradient(135deg,rgba(245,158,11,0.04) 0%,rgba(8,9,14,0) 50%),var(--bg-card);border:1px solid rgba(245,158,11,0.20);border-radius:24px;padding:56px 48px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .lp-camarote-title-v2{font-family:var(--font-fraunces),serif;font-size:clamp(26px,3.5vw,40px);font-weight:700;letter-spacing:-1px;line-height:1.2;margin-bottom:16px}
        .lp-camarote-title-v2 span{color:var(--gold)}
        .lp-camarote-text-v2{font-size:15px;color:var(--text-muted);line-height:1.75;margin-bottom:24px}
        .lp-camarote-tags-v2{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px}
        .lp-camarote-tag-v2{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.20);color:var(--gold);font-size:12px;font-weight:600;padding:5px 12px;border-radius:100px}
        .lp-btn-gold-v2{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#F59E0B,#d97706);color:#0a0a0a;border:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit;transition:transform 0.2s,box-shadow 0.2s;text-decoration:none}
        .lp-btn-gold-v2:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(245,158,11,0.35)}
        .lp-camarote-visual-v2{display:flex;flex-direction:column;gap:14px}
        .lp-camarote-card-v2{background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02));border:1px solid rgba(245,158,11,0.20);border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:14px}
        .lp-camarote-card-icon-v2{width:36px;height:36px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.20);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0}
        .lp-camarote-card-text-v2{font-size:14px;color:rgba(248,249,250,0.70);line-height:1.5}
        .lp-camarote-card-text-v2 strong{display:block;color:var(--text);font-weight:600;margin-bottom:2px}
        @keyframes camarote-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-camarote-reveal{animation:camarote-in 0.5s cubic-bezier(0.4,0,0.2,1) both}
        @media(max-width:900px){.lp-camarote-wrap{grid-template-columns:1fr;padding:36px 28px}}

        /* Early Adopter */
        .lp-early-wrap{background:linear-gradient(135deg,rgba(245,158,11,0.07),rgba(8,9,14,0)),var(--bg-card);border:1px solid rgba(245,158,11,0.20);border-radius:24px;padding:64px 48px;text-align:center;position:relative;overflow:hidden}
        .lp-early-wrap::before{content:'';position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent 70%);pointer-events:none}
        .lp-early-badge-v2{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border:2px solid rgba(245,158,11,0.20);display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:36px;position:relative;z-index:1;animation:float-y 4s ease-in-out infinite}
        .lp-early-title-v2{font-family:var(--font-fraunces),serif;font-size:clamp(26px,4vw,44px);font-weight:700;letter-spacing:-1px;line-height:1.2;margin-bottom:16px;position:relative;z-index:1}
        .lp-early-title-v2 span{color:var(--gold)}
        .lp-early-text-v2{font-size:clamp(15px,1.8vw,17px);color:var(--text-muted);line-height:1.75;max-width:560px;margin:0 auto 32px;position:relative;z-index:1}

        /* Notificações v2 */
        .lp-notif-wrap-v2{position:fixed;bottom:28px;right:24px;z-index:999;display:flex;flex-direction:column;gap:10px;max-width:300px;pointer-events:none}
        .lp-notif-v2{background:rgba(19,22,31,0.96);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:11px 14px;font-size:12.5px;color:var(--text);line-height:1.4;animation:notif-in 0.4s cubic-bezier(0.4,0,0.2,1) both;box-shadow:0 8px 24px rgba(0,0,0,0.4);display:flex;align-items:center;gap:8px}
        .lp-notif-v2--out{animation:notif-out 0.4s cubic-bezier(0.4,0,0.2,1) forwards}
        .lp-notif-dot-v2{width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0;box-shadow:0 0 6px rgba(225,29,72,0.6)}
        @keyframes notif-in{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
        @keyframes notif-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(110%)}}
      `}</style>

      <div className="lp">

        {/* ── Navbar ── */}
        <nav className="lp-nav" style={{ transform: navVisible ? 'translateX(-50%)' : 'translateX(-50%) translateY(-120%)', opacity: navVisible ? 1 : 0 }}>
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul className="lp-nav-links">
            <li><a href="#verificacao">Verificação</a></li>
            <li><a href="#filtros">Filtros</a></li>
            <li><a href="#precos">Planos</a></li>
            <li><a href="#seguranca">Segurança</a></li>
            <li><a href="/planos" className="lp-nav-cta">Começar agora</a></li>
          </ul>
          <button
            className={`lp-hamburger${menuAberto ? ' open' : ''}`}
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* ── Menu Mobile ── */}
        <div className={`lp-mobile-menu${menuAberto ? ' open' : ''}`}>
          <div className="lp-mobile-overlay" onClick={() => setMenuAberto(false)} />
          <div className="lp-mobile-drawer">
            <a href="#verificacao" onClick={() => setMenuAberto(false)}>Verificação</a>
            <a href="#filtros" onClick={() => setMenuAberto(false)}>Filtros</a>
            <a href="#precos" onClick={() => setMenuAberto(false)}>Planos</a>
            <a href="#seguranca" onClick={() => setMenuAberto(false)}>Segurança</a>
            <a href="/planos" className="lp-nav-cta" onClick={() => setMenuAberto(false)}>Começar agora</a>
          </div>
        </div>

        {/* ── Hero ── */}
        <section className="lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.55), rgba(8,9,14,0.80)), url('/backgrounds/hero.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="lp-hero">
            <div>
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                Relacionamentos com intenção real
              </div>
              <h1>Você decide quem entra<br /><em>no seu mundo.</em></h1>
              <p className="lp-hero-sub">
                Relacionamentos, encontros, salas, videochamada e filtros avançados.<br />
                Tudo no seu controle, do primeiro contato ao encontro.
              </p>
              <p className="lp-hero-complement">
                Sem se adaptar. Sem perder tempo. Sem precisar fingir.
              </p>
              <div className="lp-actions">
                <a href="/cadastro" className="lp-btn-main">
                  Entrar agora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              </div>
              <p className="lp-hero-microcopy">Leva menos de 1 minuto para começar</p>
              <div className="lp-hero-social-proof">
                <span className="lp-hero-social-proof-dot" />
                <span><strong className="lp-hero-proof-number">+1.000</strong> pessoas já estão usando na sua região</span>
              </div>
            </div>

            <div className="lp-hero-right">
              <div className="lp-deck-wrap">

                {/* Card borrado da esquerda */}
                {(() => {
                  const prev = swipeCards[(currentCard + swipeCards.length - 1) % swipeCards.length]
                  return (
                    <div className="lp-deck-side lp-deck-left">
                      <div style={{ width:'100%', height:'100%', background: prev.placeholder }}>
                        <img src={prev.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                      </div>
                    </div>
                  )
                })()}

                {/* Phone principal */}
                <div
                  key={currentCard}
                  className={`lp-phone${swipeDir === 'left' ? ' card-swipe-left' : swipeDir === 'right' ? ' card-swipe-right' : swipeDir === 'up' ? ' card-swipe-up' : ''}`}
                  style={{ position:'relative', zIndex:2 }}>
                  <span className="lp-swipe-label nope">PASSAR</span>
                  <span className="lp-swipe-label like">CURTIR</span>
                  <span className="lp-swipe-label super">SUPER</span>
                  <div className="lp-phone-header">
                    <div className="lp-phone-logo">
                      <img src="/logo.png" alt="MeAndYou" style={{ height: '28px', maxWidth: '140px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize:'10px', opacity:0.6, marginTop:'3px', color: 'var(--muted)' }}>Conexões reais</div>
                  </div>
                  <div className="lp-phone-card">
                    <div className="lp-phone-img" style={{ background: swipeCards[currentCard].placeholder }}>
                      <img src={swipeCards[currentCard].photo} alt={swipeCards[currentCard].name}
                        style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div className="lp-v-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Verificado
                      </div>
                    </div>
                    <div className="lp-phone-info">
                      <div className="lp-phone-name">{swipeCards[currentCard].name}</div>
                      <div className="lp-phone-tags">
                        {swipeCards[currentCard].tags.map((t,i) => <span key={i} className="lp-phone-tag">{t}</span>)}
                      </div>
                    </div>
                    <p className="lp-phone-bio">{swipeCards[currentCard].bio}</p>
                  </div>
                  <div className="lp-phone-actions">
                    <button className="lp-ph-btn no" onClick={() => handleSwipe('left')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <button className="lp-ph-btn super" onClick={() => handleSwipe('up')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </button>
                    <button className="lp-ph-btn yes" onClick={() => handleSwipe('right')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </div>
                </div>

                {/* Card borrado da direita */}
                {(() => {
                  const next = swipeCards[(currentCard + 1) % swipeCards.length]
                  return (
                    <div className="lp-deck-side lp-deck-right">
                      <div style={{ width:'100%', height:'100%', background: next.placeholder }}>
                        <img src={next.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Notificações animadas — abaixo do celular */}
              <div className="lp-notif-area">
                {notifList.map(n => (
                  <div key={n.id} className={`lp-notif-item ${n.exiting ? 'lp-notif-exit' : 'lp-notif-enter'}`}>
                    <span className="lp-fc-dot" />{n.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── IDENTIFICAÇÃO ── */}
        <section className="lp-ident-section">
          <div className="lp-ident-inner">
            <h2 className="lp-ident-title lp-anim">Em algum momento, você já sentiu isso.</h2>
            <div className="lp-ident-bullets">
              {[
                'Ter que se adaptar só para conseguir atenção',
                'Conversar sem saber o que a outra pessoa realmente quer',
                'Investir tempo e energia em algo que não vai para frente',
                'Sentir que está sempre no lugar errado',
              ].map((texto, i) => (
                <div key={i} className="lp-ident-bullet lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
                  <span className="lp-ident-bullet-dot" />
                  <span className="lp-ident-bullet-text">{texto}</span>
                </div>
              ))}
            </div>
            <p className="lp-ident-closing lp-anim">
              O problema nunca foi você.<br /><em>Era o ambiente.</em>
            </p>
          </div>
        </section>

        {/* ── 4 PILARES ── */}
        <section className="lp-pilares-section">
          <div className="lp-pilares-inner">
            <div className="lp-pilares-header lp-anim">
              <h2>Aqui tudo funciona diferente.</h2>
              <p>Você não entra para tentar. Você entra para escolher.</p>
            </div>
            <div className="lp-pilares-grid">
              {[
                {
                  num: '01',
                  titulo: 'Você controla tudo',
                  texto: 'Você decide quem aparece, quem fica e quem sai. Nada acontece por acaso.',
                },
                {
                  num: '02',
                  titulo: 'Do seu jeito',
                  texto: 'Nem todo mundo quer se conectar da mesma forma. Aqui você escolhe como.',
                },
                {
                  num: '03',
                  titulo: 'Antes, durante e depois',
                  texto: 'Você tem controle antes de conversar, durante a interação e até depois de um encontro.',
                },
                {
                  num: '04',
                  titulo: 'Seu tempo vale algo',
                  texto: 'Seu uso se transforma em benefícios, vantagens e destaque dentro do app.',
                },
              ].map((card, i) => (
                <div key={i} className="lp-pilar-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="lp-pilar-num">{card.num}</div>
                  <h3 className="lp-pilar-title">{card.titulo}</h3>
                  <p className="lp-pilar-text">{card.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Verificação ── */}
        <section className="lp-verification" id="verificacao">
          <div className="lp-verification-inner">
            <div>
              <p className="lp-section-label">Verificação rigorosa</p>
              <h2 className="lp-section-title">Só entra<br />quem é <span style={{ color: 'var(--accent)' }}>real.</span></h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '14px', lineHeight: 1.7 }}>
                Desenvolvemos o processo de verificação mais rigoroso do mercado.
              </p>
            </div>
            <div className="lp-verify-steps">
              {[
                { n: '1', t: 'Selfie ao vivo', d: 'Sequência de movimentos detectada em tempo real. Impossível usar foto ou vídeo.' },
                { n: '2', t: 'Documento de identidade', d: 'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.' },
                { n: '3', t: 'Validação de CPF', d: 'Checagem automática. Apenas 1 conta por CPF, sem duplicatas.' },
                { n: '4', t: 'Monitoramento contínuo', d: 'Algoritmo anti-fraude ativo. Denúncias respondidas em até 24h.' },
              ].map(item => (
                <div key={item.n} className="lp-verify-step lp-anim">
                  <div className="lp-vstep-num">{item.n}</div>
                  <div><h4>{item.t}</h4><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Filtros ── */}
        <section id="filtros" className="lp-filters-section">
          <div className="lp-filters-inner">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p className="lp-section-label">Filtros</p>
              <h2 className="lp-section-title">Você decide exatamente quem quer,<br />e quem <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>não</em> quer.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.7 }}>
                Mais de 100 filtros. Clique uma vez para <strong style={{ color: '#2ec4a0' }}>incluir</strong>, clique de novo para <strong style={{ color: 'var(--red)' }}>excluir</strong>.
              </p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="lp-filter-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)', flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                Clique nas tags abaixo para alternar entre incluir e excluir.
              </div>
            </div>
            <div className="lp-filter-categories">
              {filterCats.map((cat, i) => (
                <div key={i} className="lp-filter-cat lp-anim">
                  <div className="lp-cat-header">
                    {cat.icon}
                    <h3>{cat.title}</h3>
                  </div>
                  <p>{cat.desc}</p>
                  <div className="lp-tag-cloud">
                    {cat.tags.map((tag, j) => (
                      <span key={j} className="lp-ftag inc">{tag}</span>
                    ))}
                  </div>
                  {cat.tip && <p className="lp-filter-tip">{cat.tip}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Intenções ── */}
        <section className="lp-intentions">
          <div className="lp-intentions-inner">
            <div className="lp-intentions-header">
              <p className="lp-section-label">Intenções</p>
              <h2 className="lp-section-title">Todo mundo sabe o que quer.<br />Agora você também <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>filtra</em> isso.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '14px auto 0', lineHeight: 1.7 }}>
                Chega de descobrir depois de semanas que vocês querem coisas completamente diferentes.
              </p>
            </div>
            <div className="lp-intentions-grid">
              {[
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, t: 'Relacionamento sério', d: 'Busca comprometimento e futuro juntos' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" /></svg>, t: 'Encontros casuais', d: 'Sem compromisso, com respeito e clareza' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, t: 'Amizade', d: 'Expandir o círculo social de verdade' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>, t: 'Companhia para evento', d: 'Casamento, festa, jantar social' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, t: 'Sugar', d: 'Relacionamentos com benefícios mútuos' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, t: 'Romance', d: 'Conexão emocional profunda e gradual' },
              ].map((item, i) => (
                <div key={i} className="lp-intent-card lp-anim">
                  {item.icon}
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Como funciona ── */}
        <section className="lp-how" id="como-funciona">
          <div className="lp-how-inner">
            <p className="lp-section-label">Como funciona</p>
            <h2 className="lp-section-title">Em <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>minutos</em> você já tem matches reais.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Simples e direto, com a segurança que outros apps nunca tiveram.
            </p>
            <div className="lp-steps-row">
              {[
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, t: 'Escolha seu plano', d: 'A partir de R$10/mês. Sem conta gratuita. Isso afasta golpistas.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, t: 'Verifique sua identidade', d: 'Selfie ao vivo + documento. Menos de 3 minutos pelo celular.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/></svg>, t: 'Configure seus filtros', d: 'Inclua e exclua como quiser. 100+ opções para ser preciso.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, t: 'Dê match e conecte', d: 'Só pessoas reais, com intenções compatíveis com as suas.' },
              ].map((step, i) => (
                <div key={i} className="lp-how-step">
                  <div className="lp-step-icon">{step.svg}</div>
                  <h3>{step.t}</h3>
                  <p>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4 MODOS ── */}
        <section className="lp-modos-section">
          <div className="lp-modos-inner">
            <div className="lp-modos-header lp-anim">
              <h2>Nem todo momento pede a mesma forma de conexão.</h2>
              <p>Aqui você muda a forma de se conectar conforme o momento.</p>
            </div>
            <p className="lp-modos-desc lp-anim">
              Explorar rápido, buscar com precisão, entrar em salas ou receber sugestões. Tudo dentro do mesmo ambiente.
            </p>
            <div className="lp-modos-layout">
              <div className="lp-modos-tabs">
                {[
                  { num: '01', icon: <IcZap />, title: 'Descobrir', text: 'Explore perfis com swipe. Curta, passe ou envie uma SuperCurtida. O modo mais rápido, com perfis verificados.' },
                  { num: '02', icon: <IcFilter />, title: 'Busca Avançada', text: 'Mais de 100 filtros: corpo, estilo, personalidade, hábitos e intenções. Inclua quem quer ver, exclua quem não combina.' },
                  { num: '03', icon: <IcStar />, title: 'Match do Dia', text: 'Todo dia, uma curadoria personalizada baseada no seu perfil, seus filtros e seu comportamento dentro do app.' },
                  { num: '04', icon: <IcUsers />, title: 'Salas', text: 'Entre em salas temáticas por interesse ou humor e descubra quem está no mesmo astral que você neste momento.' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`lp-modo-tab${modoAtivo === i ? ' active' : ''}`}
                    onMouseEnter={() => setModoAtivo(i)}
                    onClick={() => setModoAtivo(i)}
                  >
                    <span className="lp-modo-tab-num">{m.num}</span>
                    <div>
                      <div className="lp-modo-tab-title">{m.title}</div>
                      <div className="lp-modo-tab-text">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lp-modos-preview lp-anim">
                <div className="lp-modos-preview-icon">
                  {[<IcZap />, <IcFilter />, <IcStar />, <IcUsers />][modoAtivo]}
                </div>
                <div className="lp-modos-preview-title">
                  {['Descobrir', 'Busca Avançada', 'Match do Dia', 'Salas'][modoAtivo]}
                </div>
                <div className="lp-modos-preview-sub">
                  {[
                    'Explore perfis com swipe. O modo mais rápido com perfis verificados.',
                    'Mais de 100 filtros para encontrar exatamente quem faz sentido.',
                    'Uma curadoria personalizada todo dia, só para você.',
                    'Salas temáticas para quem está no mesmo astral agora.',
                  ][modoAtivo]}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTROS (Etapa 5) ── */}
        {(() => {
          const filtroTags = ['Nao fuma', 'Tem pets', 'Pratica esporte', 'Bebe socialmente', 'Quer relacionamento', 'Viaja com frequencia', 'Sem filhos', 'Vegetariano(a)', 'Trabalha remoto', 'Gosta de trilha']
          return (
            <section className="lp-filtros-v2">
              <div className="lp-filtros-v2-inner">
                <div className="lp-filtros-v2-left lp-anim">
                  <p className="lp-section-label">Filtros</p>
                  <h2 className="lp-filtros-v2-title">Se nao combina,<br />nem aparece.</h2>
                  <p className="lp-filtros-v2-text">
                    Voce define exatamente o que faz sentido para voce.<br />
                    O resto simplesmente nao entra no seu radar.
                  </p>
                  <p className="lp-filtros-v2-compl">Menos ruido. Mais conexao real.</p>
                  <span className="lp-filtros-v2-micro">Voce define. O app obedece.</span>
                </div>
                <div className="lp-filtros-v2-right lp-anim" style={{ transitionDelay: '0.1s' }}>
                  <div className="lp-filtros-demo">
                    <div className="lp-filtros-demo-header">
                      <span>Filtros ativos</span>
                      <span className="lp-filtros-count">{filtroSimAtivos.length}</span>
                    </div>
                    <div className="lp-filtros-tags">
                      {filtroTags.map((tag, i) => (
                        <span
                          key={i}
                          className={`lp-filtro-tag${filtroSimAtivos.includes(i) ? ' ativo' : ''}`}
                          onClick={() => setFiltroSimAtivos(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                        >
                          {filtroSimAtivos.includes(i) && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="lp-filtros-slider-wrap">
                      <div className="lp-filtros-slider-label">
                        <span>Idade</span>
                        <span className="lp-filtros-slider-val">20 a {filtroSlider} anos</span>
                      </div>
                      <div className="lp-filtros-slider-track">
                        <div
                          className="lp-filtros-slider-fill"
                          style={{ width: `${((filtroSlider - 18) / (60 - 18)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* ── INTENCOES (Etapa 6) ── */}
        <section className="lp-intencoes-v2">
          <div className="lp-intencoes-v2-inner">
            <div className="lp-intencoes-v2-header lp-anim">
              <p className="lp-section-label">Intencoes</p>
              <h2 className="lp-intencoes-v2-title">Sem duvida.<br />Sem joguinho.</h2>
              <p className="lp-intencoes-v2-text">
                Cada pessoa ja entra com clareza do que quer.<br />
                Voce nao precisa adivinhar nem perder tempo tentando entender.
              </p>
              <p className="lp-intencoes-v2-compl">Ou faz sentido, ou nao aparece.</p>
            </div>
            <div className="lp-intencoes-grid-v2">
              {[
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
                  titulo: 'Relacionamento serio',
                  desc: 'Busca comprometimento e construir algo de verdade com alguem.',
                  label: 'Mais comum no Plus',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
                  titulo: 'Encontros casuais',
                  desc: 'Sem compromisso, com respeito e clareza desde o primeiro contato.',
                  label: 'Disponivel no Essencial',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                  titulo: 'Amizade',
                  desc: 'Expandir o circulo social com pessoas reais e verificadas.',
                  label: 'Disponivel no Essencial',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
                  titulo: 'Companhia para evento',
                  desc: 'Casamento, jantar, festa ou qualquer compromisso social.',
                  label: 'Disponivel no Plus',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                  titulo: 'Romance',
                  desc: 'Conexao emocional profunda, construida com cuidado e intencao.',
                  label: 'Disponivel no Plus',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                  titulo: 'Sugar',
                  desc: 'Relacoes com beneficios mutuos definidos desde o inicio, sem surpresas.',
                  label: 'Exclusivo Black',
                },
              ].map((item, i) => (
                <div key={i} className="lp-intencao-card-v2 lp-anim" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="lp-intencao-icon-v2">{item.icon}</div>
                  <div>
                    <div className="lp-intencao-title-v2">{item.titulo}</div>
                    <p className="lp-intencao-desc-v2">{item.desc}</p>
                    <span className="lp-intencao-label">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEGURANCA (Etapa 7) ── */}
        <section className="lp-seg-v2">
          <div className="lp-seg-v2-inner">
            <div className="lp-seg-v2-header lp-anim">
              <p className="lp-section-label">Seguranca</p>
              <h2 className="lp-seg-v2-title">Voce nunca entra<br />no escuro.</h2>
            </div>
            <div className="lp-seg-phases">
              {[
                {
                  num: '01',
                  badge: 'Antes',
                  badgeType: 'verde',
                  titulo: 'Voce ve antes de decidir.',
                  texto: 'Voce pode ver, entender e sentir seguranca antes de qualquer decisao.',
                  feats: [
                    { cor: 'verde', txt: 'Perfis verificados com documento e selfie ao vivo' },
                    { cor: 'verde', txt: 'Intencoes declaradas visiveis desde o primeiro contato' },
                    { cor: 'verde', txt: 'Historico de atividade e nivel de confianca do perfil' },
                  ],
                },
                {
                  num: '02',
                  badge: 'Durante',
                  badgeType: 'verde',
                  titulo: 'Voce mantem o controle.',
                  texto: 'Voce mantem controle total da interacao enquanto ela acontece.',
                  feats: [
                    { cor: 'verde', txt: 'Bloqueio e denuncia em um toque, sem confirmacoes desnecessarias' },
                    { cor: 'verde', txt: 'Modo invisivel — sai do radar sem precisar explicar nada' },
                    { cor: 'alerta', txt: 'Alerta automatico para comportamentos suspeitos na conversa' },
                  ],
                },
                {
                  num: '03',
                  badge: 'Depois',
                  badgeType: 'verde',
                  titulo: 'Voce continua protegido.',
                  texto: 'Voce continua protegido mesmo fora da conversa, mesmo apos um encontro.',
                  feats: [
                    { cor: 'verde', txt: 'Registro privado de encontro guardado so para voce' },
                    { cor: 'verde', txt: 'Check-in automatico pos-encontro — o app pergunta se voce esta bem' },
                    { cor: 'alerta', txt: 'Botao de emergencia — 190 em um toque, a qualquer momento' },
                  ],
                },
              ].map((fase, i) => (
                <div key={i} className="lp-seg-phase lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="lp-seg-phase-head">
                    <span className="lp-seg-phase-num">{fase.num}</span>
                    <span className={`lp-seg-phase-badge ${fase.badgeType}`}>{fase.badge}</span>
                  </div>
                  <div>
                    <div className="lp-seg-phase-title">{fase.titulo}</div>
                    <p className="lp-seg-phase-text">{fase.texto}</p>
                  </div>
                  <div className="lp-seg-features">
                    {fase.feats.map((f, j) => (
                      <div key={j} className="lp-seg-feat">
                        <span className={`lp-seg-feat-dot ${f.cor}`} />
                        {f.txt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="lp-seg-closing lp-anim">
              <p className="lp-seg-closing-text">Voce decide <em>ate onde vai.</em></p>
            </div>
          </div>
        </section>

        {/* ── GAMIFICACAO (Etapa 8) ── */}
        <section className="lp-gamif-v2">
          <div className="lp-gamif-v2-inner">
            <div className="lp-gamif-v2-header lp-anim">
              <p className="lp-section-label">Muito mais do que curtidas</p>
              <h2 className="lp-gamif-v2-title">Seu tempo aqui<br />vale algo.</h2>
              <p className="lp-gamif-v2-sub">Enquanto voce usa, voce evolui dentro do app.</p>
              <p className="lp-gamif-v2-text">A cada acesso, interacao ou conexao, voce acumula beneficios, desbloqueia recursos e ganha destaque.</p>
            </div>
            <div className="lp-gamif-v2-grid">
              {[
                {
                  anim: 'spin',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
                  titulo: 'Roleta diaria',
                  texto: 'Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e ate 1 dia de plano superior. Cada plano da mais tickets por dia.',
                  tag: 'Todo dia',
                },
                {
                  anim: 'float',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
                  titulo: 'Streak de acesso',
                  texto: 'Entre todos os dias e desbloqueie recompensas crescentes no calendario mensal. Sequencia de 30 dias tem premios raros.',
                  tag: 'Acesso diario',
                },
                {
                  anim: 'pulse',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                  titulo: 'Indique e ganhe',
                  texto: 'Cada amigo que entrar pelo seu link te rende 1 SuperCurtida. Indicou 3? Ganhe 1 Boost. Quem entrou ganha 3 tickets de boas-vindas.',
                  tag: 'Por indicacao',
                },
                {
                  anim: 'glow',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                  titulo: 'Emblemas colecionaveis',
                  texto: 'Conquistas que aparecem no seu perfil. Raridades Comum, Incomum, Raro e Lendario. Quanto mais voce usa e interage, mais emblemas raros voce desbloqueia.',
                  tag: 'Aparecem no perfil',
                },
              ].map((item, i) => (
                <div key={i} className="lp-gamif-v2-card lp-anim" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`lp-gamif-v2-icon ${item.anim}`}>{item.icon}</div>
                  <div>
                    <div className="lp-gamif-v2-card-title">{item.titulo}</div>
                    <p className="lp-gamif-v2-card-text">{item.texto}</p>
                    <span className="lp-gamif-v2-card-tag">{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ENCONTRO (Etapa 9) ── */}
        <section className="lp-enc-v2">
          <div className="lp-enc-v2-inner">
            <div className="lp-enc-v2-header lp-anim">
              <p className="lp-section-label">Do match ao encontro</p>
              <h2 className="lp-enc-v2-title">Quando fizer sentido,<br />você avança.</h2>
              <p className="lp-enc-v2-text">Do primeiro contato ao encontro, tudo acontece dentro de um ambiente controlado.</p>
              <p className="lp-enc-v2-comp">Sem exposição desnecessária. Sem pressão.</p>
            </div>
            <div className="lp-enc-v2-steps">
              {[
                { num: '01', titulo: 'Match', texto: 'Vocês dois querem conversar. O app confirma antes de abrir o canal.' },
                { num: '02', titulo: 'Conversa', texto: 'O contato começa no app, no seu ritmo, sem pressão para avançar.' },
                { num: '03', titulo: 'Videochamada', texto: 'Quando sentir que faz sentido, você vê quem é a pessoa. Ainda dentro do app.' },
                { num: '04', titulo: 'Encontro', texto: 'Só quando você quiser. Com registro privado, check-in automático e botão de emergência.' },
              ].map((step, i, arr) => (
                <div key={i} className="lp-enc-v2-step lp-anim" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="lp-enc-v2-step-left">
                    <div className="lp-enc-v2-step-dot">{step.num}</div>
                    {i < arr.length - 1 && <div className="lp-enc-v2-step-line" />}
                  </div>
                  <div className="lp-enc-v2-step-body">
                    <div className="lp-enc-v2-step-title">{step.titulo}</div>
                    <p className="lp-enc-v2-step-text">{step.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PERFIL (Etapa 10) ── */}
        <section className="lp-perf-v2">
          <div className="lp-perf-v2-inner">
            <div className="lp-perf-v2-header lp-anim">
              <p className="lp-section-label">Perfil</p>
              <h2 className="lp-perf-v2-title">Você entra do jeito<br />que faz sentido para você.</h2>
              <p className="lp-perf-v2-text">Individual ou casal. Você define sua forma de se apresentar e se conectar.</p>
            </div>
            <div className="lp-perf-v2-demo lp-anim">
              <div className="lp-perf-v2-toggle">
                <div className="lp-perf-v2-pill" />
                <span className="lp-perf-v2-opt lp-perf-v2-opt--a">Individual</span>
                <span className="lp-perf-v2-opt lp-perf-v2-opt--b">Casal</span>
              </div>
              <div className="lp-perf-v2-card-wrap">
                <div className="lp-perf-v2-card lp-perf-v2-card--a">
                  <div className="lp-perf-v2-avatar" style={{ background: 'linear-gradient(135deg,#1a0a14,#3d1530)' }} />
                  <div>
                    <div className="lp-perf-v2-card-name">Sofia, 27</div>
                    <div className="lp-perf-v2-card-sub">São Paulo · Escritora</div>
                  </div>
                </div>
                <div className="lp-perf-v2-card lp-perf-v2-card--b">
                  <div className="lp-perf-v2-avatars">
                    <div className="lp-perf-v2-avatar" style={{ background: 'linear-gradient(135deg,#0a1020,#1a2a4a)' }} />
                    <div className="lp-perf-v2-avatar lp-perf-v2-avatar--2" style={{ background: 'linear-gradient(135deg,#1a0a14,#3d1530)' }} />
                  </div>
                  <div>
                    <div className="lp-perf-v2-card-name">Ana e Pedro</div>
                    <div className="lp-perf-v2-card-sub">Rio de Janeiro · Casal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BACKSTAGE (Etapa 11) ── */}
        <section className="lp-back-v2">
          <div className="lp-back-v2-inner">
            <div className="lp-anim">
              <span className="lp-back-v2-label">Backstage</span>
              <h2 className="lp-back-v2-title">Nem tudo é<br />para todo mundo.</h2>
              <p className="lp-back-v2-text">Existe um espaço reservado para quem busca experiências mais específicas, com mais liberdade e menos limitações.</p>
              <p className="lp-back-v2-comp">Aqui, você escolhe até o nível da experiência.</p>
              <div className="lp-back-v2-badge lp-anim">
                <span className="lp-back-v2-badge-dot" />
                Exclusivo para plano Black
              </div>
            </div>
          </div>
        </section>

        {/* ── PLANOS (Etapa 12) ── */}
        <section className="lp-plans-v2">
          <div className="lp-plans-v2-inner">
            <div className="lp-plans-v2-header lp-anim">
              <p className="lp-section-label">Planos</p>
              <h2 className="lp-plans-v2-title">Escolha o nível de controle<br />que você quer ter.</h2>
              <p className="lp-plans-v2-sub">Cada plano libera uma forma diferente de viver o app.</p>
            </div>
            <div className="lp-plans-v2-grid">
              {[
                {
                  badge: 'Essencial', badgeCls: 'free', ctaCls: 'free',
                  nome: 'Grátis', desc: 'Para explorar e sentir como funciona.',
                  feats: [
                    { ok: true, txt: '10 curtidas por dia' },
                    { ok: true, txt: 'Acesso ao Descobrir' },
                    { ok: true, txt: 'Videochamada nativa' },
                    { ok: false, txt: 'Filtros avançados' },
                    { ok: false, txt: 'Ver quem curtiu você' },
                  ],
                },
                {
                  badge: 'Mais escolhido', badgeCls: 'featured', ctaCls: 'featured', featured: true,
                  nome: 'Plus', desc: 'Para quem quer controle total da experiência.',
                  feats: [
                    { ok: true, txt: 'Curtidas ilimitadas' },
                    { ok: true, txt: 'Filtros avançados completos' },
                    { ok: true, txt: 'Ver quem curtiu você' },
                    { ok: true, txt: 'Roleta diária e SuperCurtidas' },
                    { ok: true, txt: 'Modo invisível' },
                  ],
                },
                {
                  badge: 'Black', badgeCls: 'black', ctaCls: 'black',
                  nome: 'Black', desc: 'Para quem quer o máximo — sem restrições.',
                  feats: [
                    { ok: true, txt: 'Tudo do Plus' },
                    { ok: true, txt: 'Acesso ao Backstage' },
                    { ok: true, txt: 'Destaque no topo do feed' },
                    { ok: true, txt: 'Lupa e Rewind ilimitados' },
                    { ok: true, txt: 'Boosts mensais inclusos' },
                  ],
                },
              ].map((plan, i) => (
                <div key={i} className={`lp-plans-v2-card lp-anim${plan.featured ? ' lp-plans-v2-card--featured' : plan.badgeCls === 'black' ? ' lp-plans-v2-card--black' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
                  <span className={`lp-plans-v2-badge lp-plans-v2-badge--${plan.badgeCls}`}>{plan.badge}</span>
                  <div className="lp-plans-v2-name">{plan.nome}</div>
                  <p className="lp-plans-v2-desc">{plan.desc}</p>
                  <ul className="lp-plans-v2-feats">
                    {plan.feats.map((f, j) => (
                      <li key={j}>
                        <span className={f.ok ? (plan.featured ? 'acc' : 'ok') : ''} style={!f.ok ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(248,249,250,0.18)' } : {}}>
                          {f.ok ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )}
                        </span>
                        {f.txt}
                      </li>
                    ))}
                  </ul>
                  <div className={`lp-plans-v2-cta lp-plans-v2-cta--${plan.ctaCls}`}>
                    {plan.badgeCls === 'free' ? 'Começar grátis' : 'Assinar agora'}
                  </div>
                </div>
              ))}
            </div>
            <p className="lp-plans-v2-highlight lp-anim">Mais usado por quem quer ter controle total da experiência</p>
            <p className="lp-plans-v2-micro lp-anim">Você pode cancelar a qualquer momento</p>
          </div>
        </section>

        {/* ── PROVA SOCIAL (Etapa 13) ── */}
        <section className="lp-social-v2">
          <div className="lp-social-v2-inner">
            <div className="lp-social-v2-header lp-anim">
              <p className="lp-section-label">O que as pessoas dizem</p>
              <h2 className="lp-social-v2-title">Quem entrou,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>não quer sair.</em></h2>
            </div>
            <div className="lp-social-v2-msgs">
              {[
                { right: false, avatarCls: '', name: 'Mariana, 28', txt: 'Finalmente um app em que eu não preciso ficar adivinhando o que a pessoa quer. Todo mundo já entra sabendo.', delay: 0 },
                { right: true, avatarCls: 'b', name: 'Rafael, 31', txt: 'Os filtros são o que fazem a diferença. Zero perda de tempo com perfis que não fazem sentido.', delay: 150 },
                { right: false, avatarCls: 'c', name: 'Camila, 26', txt: 'A videochamada antes de encontrar alguém foi um divisor de águas pra mim. Cheguei no café sem nenhuma surpresa.', delay: 300 },
                { right: true, avatarCls: '', name: 'Thiago, 33', txt: 'Matching por intenção real muda tudo. Sem joguinho, sem ambiguidade. Direto ao ponto.', delay: 450 },
                { right: false, avatarCls: 'b', name: 'Ana, 29', txt: 'Nunca me senti tão no controle de quem entra na minha vida. Recomendo para todo mundo.', delay: 600 },
              ].map((m, i) => (
                <div key={i} className={`lp-social-v2-msg${m.right ? ' lp-social-v2-msg--right' : ''} lp-anim`} style={{ animationDelay: `${m.delay}ms` }}>
                  <div className={`lp-social-v2-avatar lp-social-v2-avatar--${m.avatarCls || 'a'}`} style={m.avatarCls === '' ? { background: 'linear-gradient(135deg,#1a0a14,#3d1530)' } : {}} />
                  <div>
                    <div className={`lp-social-v2-bubble lp-social-v2-bubble--${m.right ? 'right' : 'left'}`}>{m.txt}</div>
                    <div className={`lp-social-v2-meta${m.right ? '' : ' lp-social-v2-meta--left'}`}>{m.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="lp-section-v2 lp-section-v2--dark" id="features">
          <div className="lp-section-inner-v2">
            <div className="lp-anim" style={{ textAlign: 'center', marginBottom: 72 }}>
              <span className="lp-section-label-v2">Recursos</span>
              <h2 className="lp-section-title-v2">Tudo que faltava no seu app de relacionamentos.</h2>
            </div>
            <div className="lp-features-grid">

              {/* Feature 3 — Segurança de encontro */}
              <div className="lp-feature">
                <div className="lp-anim">
                  <span className="lp-feature-label">Segurança de encontro</span>
                  <h3 className="lp-feature-title">Do match ao encontro, você está protegido</h3>
                  <p className="lp-feature-text">Registre seu encontro com local, data e hora — guardado só para você. O app faz um check-in automático depois. E se precisar, um botão de emergência liga direto para a polícia em um toque.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Registro privado de encontro</li>
                    <li><IcCheck size={15} />Check-in automático pós-encontro</li>
                    <li><IcCheck size={15} />Botão de emergência — 190 em 1 toque</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim" style={{ transitionDelay: '0.1s' }}>
                  <div className="lp-fv-inner">
                    {[
                      { label: 'Local registrado', value: 'Botafogo, Rio de Janeiro' },
                      { label: 'Data e hora', value: 'Hoje, 20h00' },
                      { label: 'Status', value: 'Check-in pendente' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'rgba(19,22,31,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', marginBottom: 10, textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'rgba(248,249,250,0.28)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 4 — Videochamada */}
              <div className="lp-feature lp-feature--rev">
                <div className="lp-anim">
                  <span className="lp-feature-label">Videochamada nativa</span>
                  <h3 className="lp-feature-title">Veja quem é a pessoa antes do encontro</h3>
                  <p className="lp-feature-text">Inicie uma chamada de vídeo em tempo real direto na conversa, sem sair do app, sem trocar número. Chegue ao encontro sem nenhuma surpresa.</p>
                  <ul className="lp-feature-list">
                    <li><IcCheck size={15} />Chamada de vídeo HD em tempo real</li>
                    <li><IcCheck size={15} />Sem trocar número ou baixar outro app</li>
                    <li><IcCheck size={15} />Disponível em todos os planos</li>
                  </ul>
                </div>
                <div className="lp-feature-visual lp-anim" style={{ transitionDelay: '0.1s' }}>
                  <div className="lp-fv-inner">
                    <div style={{ width: 220, height: 160, borderRadius: 16, background: 'linear-gradient(135deg,#0a1020,#1a2a4a)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E11D48', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcPhoneOff /></div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcMicOff /></div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcCameraSwitch /></div>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Videochamada em andamento</div>
                    </div>
                    <div style={{ width: 80, height: 60, borderRadius: 10, background: 'linear-gradient(135deg,#1a0a14,#3d1530)', border: '1px solid rgba(255,255,255,0.08)', margin: '0 auto', position: 'relative', right: -60, bottom: 12 }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Diferenciais ── */}
        <section className="lp-diff">
          <div className="lp-diff-inner">
            <p className="lp-section-label">Diferenciais</p>
            <h2 className="lp-section-title">Tudo que outros apps<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>nunca</em> tiveram.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Três recursos que mudam completamente a forma de se conectar.
            </p>
            <div className="lp-diff-grid">
              <div className="lp-diff-card lp-anim">
                <div className="lp-diff-num">01</div>
                <div className="lp-diff-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2.5"/><circle cx="15" cy="12" r="2.5"/><circle cx="9" cy="18" r="2.5"/></svg>
                </div>
                <h3>Filtros com mais de 100 opções</h3>
                <p>Cor dos olhos, tipo de corpo, personalidade, estilo de vida, intenções, religião, fetiches. Inclua o que quer ver. Exclua o que não combina. Você define exatamente quem aparece pra você, e quem não aparece.</p>
                <span className="lp-diff-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  100+ filtros disponíveis
                </span>
              </div>

              <div className="lp-diff-card lp-anim">
                <div className="lp-diff-num">02</div>
                <div className="lp-diff-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3>Backstage: o lugar onde você pode ser você</h3>
                <p>Área exclusiva para o plano Black. Filtros e perfis que não aparecem em nenhum outro lugar: Sugar, BDSM, Swing, fetiches, poliamor. Só quem assinalou a mesma intenção pode ver. Sem exposição, sem julgamento.</p>
                <span className="lp-diff-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Exclusivo Camarote Black
                </span>
              </div>

              <div className="lp-diff-card lp-anim">
                <div className="lp-diff-num">03</div>
                <div className="lp-diff-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                </div>
                <h3>Videochamada direto pelo chat</h3>
                <p>Sem sair do app. Sem trocar número. Você inicia uma chamada de vídeo em tempo real direto na conversa. Veja quem é a pessoa de verdade antes de qualquer encontro. Chegue ao café sem surpresa nenhuma.</p>
                <span className="lp-diff-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Tempo real · Sem apps externos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CAMAROTE ── */}
        <section className="lp-section-v2" id="camarote">
          <div className="lp-section-inner-v2">
            <div className="lp-camarote-wrap lp-anim">
              <div>
                <span className="lp-section-label-v2">Exclusivo Black</span>
                <h2 className="lp-camarote-title-v2">Alguns desejos merecem um <span>espaço próprio.</span></h2>
                {!camaroteRevealed ? (
                  <>
                    <p className="lp-camarote-text-v2">Um ambiente separado do app principal. Discreto, sem julgamentos, com filtros que você não encontra em nenhum outro lugar. Para entrar, você precisa sinalizar suas intenções — e apenas quem compartilha das mesmas pode te ver.</p>
                    <button className="lp-btn-gold-v2" onClick={() => setCamaroteRevealed(true)} style={{ marginTop: 8 }}>
                      <IcLock /> Ver o que tem dentro
                    </button>
                  </>
                ) : (
                  <div className="lp-camarote-reveal">
                    <p className="lp-camarote-text-v2">Um ambiente discreto, sem julgamentos, com perfis curados e filtros que você não encontra em nenhum outro app brasileiro. Só quem sinalizou as mesmas intenções pode te ver. Nenhuma exposição desnecessaria.</p>
                    <div className="lp-camarote-tags-v2">
                      {['Sugar', 'Fetiche', 'Swing', 'Poliamor', 'BDSM'].map(t => <span key={t} className="lp-camarote-tag-v2">{t}</span>)}
                    </div>
                    <a href="/planos" className="lp-btn-gold-v2">Acessar o Camarote <IcArrow /></a>
                  </div>
                )}
              </div>
              <div className="lp-camarote-visual-v2">
                {camaroteRevealed ? (
                  [
                    { icon: <IcLock />, title: 'Acesso privado', text: 'So quem sinalizou as mesmas intencoes pode ver seu perfil no Camarote.' },
                    { icon: <IcEye />, title: 'Zero exposicao', text: 'Seu perfil no Camarote e separado do perfil principal. Voce controla tudo.' },
                    { icon: <IcShield />, title: 'Comunidade curada', text: 'Perfis verificados, filtros exclusivos e uma comunidade que compartilha interesses.' },
                  ].map((c, i) => (
                    <div key={i} className="lp-camarote-card-v2 lp-camarote-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="lp-camarote-card-icon-v2">{c.icon}</div>
                      <div className="lp-camarote-card-text-v2"><strong>{c.title}</strong>{c.text}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '40px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                      <IcLock />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 200 }}>Conteudo restrito. Clique para revelar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Planos ── */}
        <section className="lp-pricing" id="precos">
          <div className="lp-pricing-inner">
            <p className="lp-section-label">Planos</p>
            <h2 className="lp-section-title">Sem conta gratuita.<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Mais seriedade.</em></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Um ambiente controlado para pessoas que sabem o que buscam.
            </p>
            <div className="lp-cards">
              <div className="lp-card lp-anim">
                <p className="lp-plan-name">Essencial</p>
                <p className="lp-plan-area">Pista</p>
                <div className="lp-plan-price"><sup>R$</sup>10</div>
                <p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">O ponto de entrada. Para quem quer explorar a plataforma com pessoas verificadas e já ter acesso aos filtros essenciais.</p>
                <ul className="lp-feats">
                  <li>Verificação de identidade</li>
                  <li>30 curtidas por dia</li>
                  <li>1 filtro ativo por vez</li>
                  <li>Ver matches recebidos</li>
                  <li className="off">Filtros acumulados</li>
                  <li className="off">Filtro de exclusão</li>
                  <li className="off">Ver quem curtiu você</li>
                  <li className="off">Desfazer curtida</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-outline-p">Assinar Essencial</a>
              </div>

              <div className="lp-card mid lp-anim">
                <span className="lp-feat-badge rose">Mais popular</span>
                <p className="lp-plan-name">Plus</p>
                <p className="lp-plan-area">Área VIP</p>
                <div className="lp-plan-price"><sup>R$</sup>39</div>
                <p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">A experiência completa de filtragem. Para quem está realmente em busca de uma conexão e quer usar todos os recursos da plataforma.</p>
                <ul className="lp-feats">
                  <li>Verificação de identidade</li>
                  <li>100 curtidas por dia</li>
                  <li>Todos os filtros acumulados</li>
                  <li>Filtro de exclusão</li>
                  <li>Ver quem curtiu você</li>
                  <li>Desfazer curtida (1/dia)</li>
                  <li>Boost semanal de perfil</li>
                  <li>1 Lupa/dia no Destaque</li>
                  <li>2 tickets de roleta/dia</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-rose">Assinar Plus</a>
              </div>

              <div className="lp-card vip lp-anim">
                <span className="lp-feat-badge gold">Camarote</span>
                <p className="lp-plan-name">Black</p>
                <p className="lp-plan-area">Backstage</p>
                <div className="lp-plan-price"><sup>R$</sup>100</div>
                <p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">Você acessa todos os perfis, tem área exclusiva Backstage com filtros de nicho (Sugar, BDSM, Swing, Fetiche) e visibilidade máxima.</p>
                <ul className="lp-feats">
                  <li className="gold-check">Tudo do Plus</li>
                  <li className="gold-check">Curtidas ilimitadas</li>
                  <li className="gold-check">10 SuperCurtidas/dia</li>
                  <li className="gold-check">Área exclusiva Backstage</li>
                  <li className="gold-check">Filtros de nicho (Sugar, Fetiche…)</li>
                  <li className="gold-check">2 Lupas/dia no Destaque</li>
                  <li className="gold-check">3 tickets de roleta/dia</li>
                  <li className="gold-check">Destaque máximo no algoritmo</li>
                  <li className="gold-check">Suporte prioritário 24h</li>
                  <li className="gold-check">Chat exclusivo do Backstage (tema preto e dourado)</li>
                  <li className="gold-check">Seja resgatado: outros assinantes pagam para te alcançar</li>
                  <li className="gold-check" style={{ color: 'rgba(245,158,11,0.7)', fontStyle: 'italic' }}>Mais recursos exclusivos revelados ao entrar...</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-gold">Assinar Camarote Black</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── EARLY ADOPTER ── */}
        <section className="lp-section-v2 lp-section-v2--dark">
          <div className="lp-section-inner-v2">
            <div className="lp-early-wrap lp-anim">
              <div className="lp-early-badge-v2" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcMedal size={36} /></div>
              <h2 className="lp-early-title-v2">Você está chegando no<br /><span>momento certo.</span></h2>
              <p className="lp-early-text-v2">O MeAndYou acabou de chegar. Todo usuário que entrar agora durante o lançamento recebe um <strong style={{ color: 'var(--gold)' }}>Emblema de Fundador exclusivo e vitalício</strong>. Ele nunca mais será concedido. Você carrega no perfil para sempre como prova de que esteve aqui desde o começo.</p>
              <a href="/planos" className="lp-btn-gold-v2" style={{ marginTop: 8 }}>
                Quero meu emblema de fundador <IcArrow />
              </a>
            </div>
          </div>
        </section>

        {/* ── Gamificação ── */}
        <section className="lp-gamif lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.75), rgba(8,9,14,0.88)), url('/backgrounds/MUITO%20MAIS%20DO%20QUE%20CURTIDAS.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="lp-gamif-inner">
            <p className="lp-section-label">Muito mais do que curtidas</p>
            <h2 className="lp-section-title"><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Recompensas</em> por<br />estar aqui</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
              Todo dia tem prêmio. Quanto mais você usa, mais você ganha.
            </p>
            <div className="lp-gamif-grid">
              {[
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
                  t: 'Roleta diária',
                  d: 'Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e até 1 dia de plano superior. Cada plano dá mais tickets por dia.',
                },
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
                  t: 'Streak de acesso',
                  d: 'Entre todos os dias e desbloqueie recompensas crescentes no calendário mensal. Sequência de 30 dias = prêmios raros.',
                },
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                  t: 'Indique e ganhe',
                  d: 'Cada amigo que entrar pelo seu link te rende 1 SuperCurtida. Indicou 3? Ganhe 1 Boost. Quem entrou ganha 3 tickets de boas-vindas.',
                },
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                  t: 'Emblemas Colecionáveis',
                  d: 'Conquistas que aparecem no seu perfil. Raridades Comum, Incomum, Raro e Lendário. Quanto mais você usa e interage, mais emblemas raros você desbloqueia.',
                },
              ].map((item, i) => (
                <div key={i} className="lp-gamif-card lp-anim">
                  <div className="lp-gamif-icon">{item.icon}</div>
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Salas Temáticas ── */}
        <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, #0d0f16 0%, #08090E 100%)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <p className="lp-section-label">Em breve</p>
            <h2 className="lp-section-title" style={{ marginBottom: '16px' }}>
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Salas Temáticas</em>
            </h2>
            <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.75, fontFamily: 'var(--font-jakarta)' }}>
              Uma nova forma de se conectar. Entre em uma sala por interesse ou clima e descubra quem mais está no mesmo astral que você neste momento.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Bares e baladas', 'Games', 'Viagens', 'Música ao vivo', 'Relacionamento sério', 'Apenas diversão', 'K-pop', 'Fitness', 'LGBTQIA+'].map((sala, i) => (
                <span key={i} style={{
                  padding: '8px 18px', borderRadius: '100px',
                  background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)',
                  color: 'rgba(248,249,250,0.65)', fontSize: '13px', fontFamily: 'var(--font-jakarta)',
                }}>
                  {sala}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Depoimentos ── */}
        <section className="lp-testi lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.72), rgba(8,9,14,0.88)), url('/backgrounds/depoimentos.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="lp-testi-inner">
            <p className="lp-section-label">Depoimentos</p>
            <h2 className="lp-section-title">Chega de encontros frustrantes.<br />Veja quem já está <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>vivendo</em> o mundo real.</h2>
            <div className="lp-testi-grid">
              {[
                { name: 'Camila S.', role: 'Belo Horizonte · 27 anos · Plano Plus', text: 'Passei muito tempo em apps conversando com pessoas que estavam em momentos diferentes do meu. Aqui eu fui direto ao ponto: ativei os filtros e deixei claro que procuro algo sério. O app cortou o ruído e me conectou só com quem estava na mesma página. Encontrei uma pessoa incrível, sem perder o meu tempo nem o tempo de ninguém.' },
                { name: 'Lucas M.', role: 'Rio de Janeiro · 34 anos · Camarote Black', text: 'A pior parte de conhecer gente nova é quando um quer uma coisa e o outro quer outra. No Backstage, eu joguei limpo sobre o que eu curto e deixei claro que meu foco agora é apenas diversão casual. Deu match com uma mulher que queria exatamente a mesma coisa para aquela noite. Fomos direto ao assunto, com muita química e zero cobrança.' },
                { name: 'Thiago R.', role: 'Curitiba · 36 anos · Camarote Black', text: 'Eu valorizo muito o meu tempo e gosto de proporcionar experiências exclusivas. O Camarote Black é perfeito porque atrai pessoas que buscam esse mesmo nível. A verificação rigorosa por documento e selfie garante que os perfis são reais. Você conversa com a tranquilidade de que a pessoa existe de verdade e que os interesses estão 100% alinhados desde o primeiro oi.' },
                { name: 'Fernanda O.', role: 'São Paulo · 29 anos · Plano Plus', text: 'Eu queria sair e me divertir, mas dava uma preguiça enorme de chegar no bar e descobrir na hora que a química não rolava. A videochamada aqui mudou o jogo. Bati 40 minutos de papo, vi que a energia batia pela tela mesmo, e fomos pro encontro presencial já com aquele clima bom. Corta toda a tensão de conhecer alguém novo.' },
              ].map((t, i) => (
                <div key={i} className="lp-testi-card lp-anim">
                  <div className="lp-testi-stars">★★★★★</div>
                  <p className="lp-testi-text">"{t.text}"</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div>
                      <p className="lp-testi-name">{t.name}</p>
                      <p className="lp-testi-role">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Instalar PWA ── */}
        <section className="lp-install">
          <div className="lp-install-inner">
            <div className="lp-install-left lp-anim">
              <p className="lp-section-label">App</p>
              <h2><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Baixe Agora.</em><br />Direto no seu celular.</h2>
              <p>Ícone na tela inicial, notificações em tempo real. Sem precisar de loja de apps, sem burocracia de download.</p>

              {/* Tabs Android / iPhone */}
              <div className="lp-install-os-tabs">
                <button
                  className={`lp-os-tab${selectedOS === 'android' ? ' active' : ''}`}
                  onClick={() => setSelectedOS('android')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.6 10.5l2.184-3.78a.75.75 0 0 0-1.3-.75L13.3 9.75H10.7L9.516 5.97a.75.75 0 0 0-1.3.75L10.4 10.5l-2.923 4.841A.75.75 0 1 0 8.777 16L12 10.933 15.223 16a.75.75 0 1 0 1.3-.659zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                  Android
                </button>
                <button
                  className={`lp-os-tab${selectedOS === 'ios' ? ' active' : ''}`}
                  onClick={() => setSelectedOS('ios')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  iPhone
                </button>
              </div>

              <div className="lp-install-actions">
                {installDone ? (
                  <div className="lp-install-done">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    App instalado com sucesso!
                  </div>
                ) : selectedOS === 'android' ? (
                  <button onClick={handleInstall} className="lp-install-btn android" style={{ opacity: installPrompt ? 1 : 0.55, cursor: installPrompt ? 'pointer' : 'default' }}>
                    <svg className="lp-install-btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.6 10.5l2.184-3.78a.75.75 0 0 0-1.3-.75L13.3 9.75H10.7L9.516 5.97a.75.75 0 0 0-1.3.75L10.4 10.5l-2.923 4.841A.75.75 0 1 0 8.777 16L12 10.933 15.223 16a.75.75 0 1 0 1.3-.659zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                    <span className="lp-install-btn-text">
                      <small>{installPrompt ? 'Toque para instalar' : 'Abra no Chrome para instalar'}</small>
                      Instalar no Android
                    </span>
                  </button>
                ) : (
                  <div className="lp-install-btn ios">
                    <svg className="lp-install-btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <span className="lp-install-btn-text">
                      <small>Siga os passos ao lado →</small>
                      Instalar no iPhone
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lp-install-right lp-anim">
              {selectedOS === 'android' ? (
                <>
                  <p className="lp-install-os-label">Android · Chrome</p>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">1</div>
                    <div>
                      <h4>Abra no Chrome</h4>
                      <p>Acesse meandyou.com.br pelo navegador Chrome no seu Android.</p>
                    </div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">2</div>
                    <div>
                      <h4>Toque nos 3 pontos ⋮</h4>
                      <p>No canto superior direito do Chrome, abra o menu de opções.</p>
                    </div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">3</div>
                    <div>
                      <h4>Adicionar à tela inicial</h4>
                      <p>Selecione a opção e confirme. O ícone aparece na sua tela.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="lp-install-os-label">iPhone · Safari</p>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">1</div>
                    <div>
                      <h4>Abra no Safari</h4>
                      <p>No iPhone, use o Safari — é o único navegador que permite instalar apps pela web.</p>
                    </div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">2</div>
                    <div>
                      <h4>Toque em Compartilhar</h4>
                      <p>Ícone de seta para cima na barra inferior do Safari.</p>
                    </div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">3</div>
                    <div>
                      <h4>Adicionar à Tela de Início</h4>
                      <p>Role o menu para baixo, toque na opção e confirme. O ícone aparece na tela.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Quem somos ── */}
        <section className="lp-about">
          <div className="lp-about-inner">
            <div className="lp-about-intro">
              <div className="lp-about-intro-left lp-anim">
                <p className="lp-section-label">Quem somos</p>
                <h2>
                  <span style={{
                    display: 'block',
                    fontSize: '0.52em',
                    fontWeight: 400,
                    color: 'rgba(248,249,250,0.42)',
                    fontStyle: 'italic',
                    letterSpacing: '0',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                    borderLeft: '2px solid var(--accent-border)',
                    paddingLeft: '14px',
                  }}>
                    O mercado parou no tempo.
                  </span>
                  <em>Nós adiantamos<br />o relógio.</em>
                </h2>
              </div>
              <div className="lp-about-intro-right lp-anim">
                <p>Olhe para os aplicativos que você usa hoje. Eles são obsoletos na segurança, ultrapassados nas funções e desenhados para prender você na tela. O mercado transformou a busca por alguém em um videogame sem graça: as pessoas dão like, like, like, dão match, e a conversa simplesmente nunca acontece. Virou vício em validação, não em conexão.</p>
                <p className="lp-about-highlight">O MeAndYou nasceu para quebrar esse ciclo.</p>
                <p>Nosso foco é a modernidade e a precisão absoluta. Acreditamos que conexões reais nascem de estilos de vida alinhados, e não de acasos. Se você não suporta quem fuma, você tem o direito de limpar essas pessoas da sua tela com um clique. Se você fuma e quer alguém que acompanhe seu ritmo sem encher o seu saco, você vai encontrar exatamente essa pessoa aqui.</p>
                <p>Sem máscaras. Sem precisar fingir ou se adaptar para caber na expectativa do outro. Quanto mais filtros você usa, menos julgamento você sofre, e mais rápido o encontro real acontece.</p>
              </div>
            </div>
            <div className="lp-about-pillars">
              <div className="lp-about-pillar lp-anim">
                <div className="lp-about-pillar-label">Ecossistema</div>
                <h4>O mais inclusivo do Brasil — e talvez do mundo.</h4>
                <p>Não importa sua raça, identidade de gênero, religião, se você é PCD, assexual ou qual é a sua orientação. Com mais de 100 filtros, você molda o app em volta de você. Nós nos recusamos a criar "só mais um app". Construímos a primeira plataforma com arquitetura de inclusão total.</p>
              </div>
              <div className="lp-about-pillar lp-anim">
                <div className="lp-about-pillar-label">Muito mais por trás</div>
                <h4>Há camadas que você só descobre entrando.</h4>
                <p>Repensamos a experiência de uso. Entrar no app deixou de ser um hábito chato e virou algo recompensador. Para quem busca algo além do convencional: espaços blindados e totalmente discretos onde fetiches, desejos específicos e acordos vivem longe de olhares curiosos.</p>
              </div>
              <div className="lp-about-pillar lp-anim">
                <div className="lp-about-pillar-label">Nossa marca</div>
                <h4>Simplicidade no acesso, elegância na conexão.</h4>
                <p>MeAndYou: pensado para ser simples, direto e rápido de digitar no navegador — o caminho mais curto para o seu próximo encontro. Me&amp;You: no logotipo, o &amp; representa o elo perfeito. É a tecnologia unindo, de forma segura e sem julgamentos, o "Eu" e o "Você".</p>
              </div>
            </div>
            <div className="lp-about-brand lp-anim">
              <div className="lp-about-brand-logo">
                <img src="/logo.png" alt="MeAndYou" />
              </div>
              <div className="lp-about-brand-cards">
                <div className="lp-about-brand-card">
                  <div className="label">Nome no app</div>
                  <div className="val">MeAndYou</div>
                  <div className="note">meandyou.com.br · nome técnico e de domínio · simples de digitar e lembrar</div>
                </div>
                <div className="lp-about-brand-card">
                  <div className="label">Identidade visual</div>
                  <div className="val">Me&amp;You</div>
                  <div className="note">logotipo oficial · o &amp; é intencional — representa o elo entre duas pessoas, não é um erro de grafia</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-faq">
          <div className="lp-faq-inner">
            <p className="lp-section-label">FAQ</p>
            <h2 className="lp-section-title">Dúvidas Frequentes</h2>
            <div className="lp-faq-list">
              {faqItems.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
            </div>
          </div>
        </section>

        {/* ── Segurança ── */}
        <section className="lp-safety" id="seguranca">
          <div className="lp-safety-inner">
            <p className="lp-section-label" style={{ color: 'var(--accent)' }}>Segurança</p>
            <h2>Dicas para se <em>proteger</em> em encontros.</h2>
            <div className="lp-safety-grid">
              {[
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, t: 'Marque em local público', d: 'Primeiro encontro sempre em café, restaurante ou shopping. Nunca na casa de ninguém.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, t: 'Avise alguém de confiança', d: 'Conte para um amigo ou familiar onde vai, com quem e a que horas.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, t: 'Mantenha o celular carregado', d: 'Vá com bateria cheia e tenha um plano caso precise sair rapidamente.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, t: 'Nunca transfira dinheiro', d: 'Se alguém pedir PIX, cartão ou qualquer valor antes do encontro: denuncie imediatamente.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, t: 'Não compartilhe dados pessoais', d: 'Endereço, local de trabalho e dados bancários nunca antes de estabelecer confiança.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, t: 'Denúncia com 1 toque', d: 'Qualquer perfil pode ser denunciado diretamente pelo app. Moderação em até 24h.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>, t: 'Banimento permanente por CPF', d: 'Quem é banido não volta. Bloqueio vinculado ao CPF, não ao email.' },
                { icon: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, t: 'Em caso de perigo', d: 'Use o botão de emergência no app ou ligue imediatamente para o 190.' },
              ].map((item, i) => (
                <div key={i} className="lp-safety-item lp-anim">
                  {item.icon}
                  <div><strong>{item.t}</strong><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="lp-cta lp-bg-fade" style={{ backgroundImage: "linear-gradient(rgba(8,9,14,0.60), rgba(8,9,14,0.82)), url('/backgrounds/diferenciais.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <h2 className="lp-cta-title">
            Sua pessoa real<br />está <em style={{ fontStyle:'italic', color:'var(--accent)' }}>esperando.</em>
          </h2>
          <p className="lp-cta-sub" style={{ color:'rgba(248,249,250,0.88)', fontSize:'17px', marginBottom:'44px', position:'relative' }}>
            <strong>Verificação real.</strong> <strong>Filtros completos.</strong> Conexões de <em>verdade.</em>
          </p>
          <a href="/planos" className="lp-btn-cta-white" style={{ position:'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            Escolher meu plano
          </a>
          <p className="lp-cta-note">Cancele quando quiser · Sem fidelidade</p>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <a href="/" className="lp-footer-logo">MeAnd<span>You</span></a>
              <p style={{ fontSize: '13px', lineHeight: 1.75, maxWidth: '260px' }}>
                O app de relacionamentos com verificação real de identidade e os filtros mais completos do Brasil.
              </p>
            </div>
            <div className="lp-footer-col">
              <h4>Produto</h4>
              <a href="#verificacao">Verificação</a>
              <a href="#filtros">Filtros</a>
              <a href="#precos">Planos e preços</a>
              <a href="#seguranca">Segurança</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <a href="/termos">Termos de uso</a>
              <a href="/privacidade">Política de privacidade</a>
            </div>
            <div className="lp-footer-col">
              <h4>Conta</h4>
              <a href="/planos">Criar conta</a>
              <a href="/login">Entrar</a>
              <a href="/fale-conosco">Fale Conosco</a>
              <a href="/suporte">Suporte</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div>
              <p>© {new Date().getFullYear()} MeAndYou · Todos os direitos reservados</p>
              <p style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(248,249,250,0.35)' }}>
                Feito com carinho por brasileiros 🇧🇷
              </p>
            </div>
            <div className="lp-footer-btm-links">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </div>
          </div>
        </footer>

        {/* ── NOTIFICAÇÕES ── */}
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
