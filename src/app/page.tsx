'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import './landing.css'
import { IcCheck, IcX, IcShield, IcStar, IcArrow, IcZap, IcEye, IcLock, IcFilter, IcUsers, IcMedal, IcMicOff, IcPhoneOff, IcCameraSwitch } from './landing/icons'


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
  const [filtroSimRejeitados, setFiltroSimRejeitados] = useState<number[]>([])
  const [filtroSlider, setFiltroSlider] = useState(34)
  const [perfMode, setPerfMode] = useState<'ind' | 'cas'>('ind')

  // Camarote (extraído do page.tsx v2)
  const [camaroteRevealed, setCamaroteRevealed] = useState(false)

  // Backstage saiba mais
  const [backstageOpen, setBackstageOpen] = useState(false)

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
    const totalTags = 16
    let tagIdx = 0
    const tagTimer = setInterval(() => {
      const i = tagIdx % totalTags
      setFiltroSimAtivos(prev => {
        if (prev.includes(i)) {
          setFiltroSimRejeitados(r => [...r, i])
          setTimeout(() => setFiltroSimRejeitados(r => r.filter(x => x !== i)), 700)
          return prev.filter(x => x !== i)
        }
        return [...prev, i]
      })
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
              <h1><em style={{color:'var(--accent)',fontStyle:'italic'}}>Você decide</em> quem entra<br /><em>no seu mundo.</em></h1>
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
                <span><strong className="lp-hero-proof-number">+1.000</strong> pessoas já estão usando {userCity ? <>em <strong className="lp-hero-proof-number">{userCity}</strong></> : 'na sua região mesmo'}</span>
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
            <h2 className="lp-ident-title lp-anim">Em algum momento,<br />você já sentiu<br />isso.</h2>
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
              <h2>Aqui tudo funciona <em style={{color:'var(--accent)',fontStyle:'italic'}}>diferente.</em></h2>
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

        {/* ── 4 MODOS ── */}
        <section className="lp-modos-section">
          <div className="lp-modos-inner">
            <div className="lp-modos-header lp-anim">
              <h2>Nem todo momento pede<br />a mesma forma de conexão.</h2>
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
          const filtroTags = ['Tem pets', 'Não fuma', 'Pratica esporte', 'Bebe socialmente', 'Quer relacionamento', 'Viaja com frequência', 'Sem filhos', 'Vegetariana(o)', 'Trabalha remoto', 'Gosta de trilha', 'Gosta de cinema', 'Gosta de comida japonesa', 'Gosta de balada', 'Solteiro(a)', 'Gosta de séries', 'Tem cachorro']
          return (
            <section className="lp-filtros-v2">
              <div className="lp-filtros-v2-inner">
                <div className="lp-filtros-v2-left lp-anim">
                  <p className="lp-section-label">FILTROS</p>
                  <h2 className="lp-filtros-v2-title">Se não combina,<br />nem aparece.</h2>
                  <p className="lp-filtros-v2-text">
                    Você define exatamente o que faz sentido para você.<br />
                    O resto simplesmente não entra no seu radar.
                  </p>
                  <p className="lp-filtros-v2-compl">Menos ruído. Mais conexão real.</p>
                  <span className="lp-filtros-v2-micro">Você define. O app obedece.</span>
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
                          className={`lp-filtro-tag${filtroSimAtivos.includes(i) ? ' ativo' : filtroSimRejeitados.includes(i) ? ' rejeitado' : ''}`}
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
                  iconBg: 'rgba(225,29,72,0.12)', iconBorder: 'rgba(225,29,72,0.28)', iconColor: 'var(--accent)',
                  titulo: 'Relacionamento sério',
                  desc: 'Busca comprometimento e construir algo de verdade com alguém.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
                  iconBg: 'rgba(59,130,246,0.12)', iconBorder: 'rgba(59,130,246,0.28)', iconColor: 'rgb(96,165,250)',
                  titulo: 'Encontros casuais',
                  desc: 'Sem compromisso, com respeito e clareza desde o primeiro contato.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                  iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.28)', iconColor: '#10b981',
                  titulo: 'Amizade',
                  desc: 'Expandir o círculo social com pessoas reais e verificadas.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
                  iconBg: 'rgba(139,92,246,0.12)', iconBorder: 'rgba(139,92,246,0.28)', iconColor: 'rgb(167,139,250)',
                  titulo: 'Companhia para evento',
                  desc: 'Casamento, jantar, festa ou qualquer compromisso social.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                  iconBg: 'rgba(236,72,153,0.12)', iconBorder: 'rgba(236,72,153,0.28)', iconColor: 'rgb(244,114,182)',
                  titulo: 'Romance',
                  desc: 'Conexão emocional profunda, construída com cuidado e intenção.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                  iconBg: 'rgba(245,158,11,0.10)', iconBorder: 'rgba(245,158,11,0.25)', iconColor: '#F59E0B',
                  titulo: 'Sugar',
                  desc: 'Relações com benefícios mútuos definidos desde o início, sem surpresas.',
                },
              ].map((item, i) => (
                <div key={i} className="lp-intencao-card-v2 lp-anim" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="lp-intencao-icon-v2" style={{ background: item.iconBg, border: `1px solid ${item.iconBorder}`, color: item.iconColor }}>{item.icon}</div>
                  <div>
                    <div className="lp-intencao-title-v2">{item.titulo}</div>
                    <p className="lp-intencao-desc-v2">{item.desc}</p>
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
                <div className="lp-perf-v2-pill" style={{ left: perfMode === 'ind' ? 4 : 'calc(50%)' }} />
                <span className="lp-perf-v2-opt lp-perf-v2-opt--a" style={{ color: perfMode === 'ind' ? '#fff' : 'rgba(248,249,250,0.45)' }} onClick={() => setPerfMode('ind')}>Individual</span>
                <span className="lp-perf-v2-opt lp-perf-v2-opt--b" style={{ color: perfMode === 'cas' ? '#fff' : 'rgba(248,249,250,0.45)' }} onClick={() => setPerfMode('cas')}>Casal</span>
              </div>
              <div className="lp-perf-v2-card-wrap">
                <div className="lp-perf-v2-card lp-perf-v2-card--a" style={{ display: perfMode === 'cas' ? 'none' : 'flex' }}>
                  <div className="lp-perf-v2-avatar" style={{ background: 'linear-gradient(135deg,#1a0a14,#3d1530)' }} />
                  <div>
                    <div className="lp-perf-v2-card-name">Sofia, 27</div>
                    <div className="lp-perf-v2-card-sub">São Paulo · Escritora</div>
                  </div>
                </div>
                <div className="lp-perf-v2-card lp-perf-v2-card--b" style={{ display: perfMode === 'ind' ? 'none' : 'flex' }}>
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
              <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:40, flexWrap:'wrap' }}>
                <a href="/planos" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'rgba(120,0,20,0.35)', border:'1px solid rgba(180,0,30,0.35)', color:'rgba(248,249,250,0.85)', fontSize:14, fontWeight:700, textDecoration:'none' }}>
                  Ver o plano Black
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
                <div className="lp-back-v2-badge">
                  <span className="lp-back-v2-badge-dot" />
                  Exclusivo para plano Black
                </div>
              </div>
              <button
                onClick={() => setBackstageOpen(o => !o)}
                style={{ marginTop:24, background:'none', border:'1px solid rgba(180,0,30,0.30)', borderRadius:10, color:'rgba(248,249,250,0.60)', fontSize:13, fontWeight:600, padding:'10px 20px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-jakarta), sans-serif', transition:'color 0.2s, border-color 0.2s' }}
              >
                {backstageOpen ? 'Fechar' : 'Saiba mais sobre o Backstage'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: backstageOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.3s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {backstageOpen && (
                <div style={{ marginTop:16, padding:'20px 24px', borderRadius:14, background:'rgba(120,0,20,0.12)', border:'1px solid rgba(180,0,30,0.20)', maxWidth:520 }}>
                  <p style={{ fontSize:14, color:'rgba(248,249,250,0.65)', lineHeight:1.75, margin:0 }}>
                    O Backstage e a area privada exclusiva do plano Black. Aqui voce encontra perfis com intencoes especificas que nao aparecem em nenhum outro lugar: Sugar, Swing, Fetiches, BDSM e Poliamor. A regra e simples: voce so ve quem marcou as mesmas intencoes. Zero exposicao, zero julgamento.
                  </p>
                </div>
              )}
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
                { right: false, avatarCls: 'a', name: 'Mariana, 34', txt: 'Finalmente um app em que eu não preciso ficar adivinhando o que a pessoa quer. Todo mundo já entra sabendo.', delay: 0 },
                { right: true, avatarCls: 'b', name: 'Rafael, 41', txt: 'Os filtros são o que fazem a diferença. Zero perda de tempo com perfis que não fazem sentido.', delay: 150 },
                { right: false, avatarCls: 'c', name: 'Camila, 29', txt: 'A videochamada antes de encontrar alguém foi um divisor de águas pra mim. Cheguei no café sem nenhuma surpresa.', delay: 300 },
                { right: true, avatarCls: 'd', name: 'Thiago, 43', txt: 'Matching por intenção real muda tudo. Sem joguinho, sem ambiguidade. Direto ao ponto.', delay: 450 },
                { right: false, avatarCls: 'e', name: 'Ana, 37', txt: 'Nunca me senti tão no controle de quem entra na minha vida. Recomendo para todo mundo.', delay: 600 },
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

        {/* ── CTA FINAL (Etapa 14) ── */}
        <section className="lp-cta-final">
          <div className="lp-cta-final-inner">
            <h2 className="lp-cta-final-title lp-anim">Comece agora.</h2>
            <p className="lp-cta-final-sub lp-anim">Entre, defina o que você quer e veja como tudo muda quando você tem controle.</p>
            <a href="/cadastro" className="lp-cta-final-btn lp-anim">Criar conta</a>
            <p className="lp-cta-final-micro lp-anim">Leva menos de 1 minuto para começar</p>
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
