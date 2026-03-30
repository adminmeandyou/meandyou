'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

/* ── FAQ Component ── */
function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(aberto ? contentRef.current.scrollHeight : 0)
    }
  }, [aberto])

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 0' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', fontWeight: 600, fontSize: '15px', color: '#F8F9FA',
          fontFamily: 'var(--font-jakarta), sans-serif', textAlign: 'left', padding: 0,
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
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: `${height}px`,
          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <p style={{
          fontSize: '14px', color: 'rgba(248,249,250,0.55)',
          lineHeight: 1.75, marginTop: '14px', paddingRight: '44px',
        }}>{resposta}</p>
      </div>
    </div>
  )
}

/* ── Counter Animation ── */
function animateCounter(el: HTMLElement, target: number, duration: number = 1800) {
  const start = performance.now()
  const suffix = el.dataset.suffix || ''
  const update = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (progress >= 1 ? suffix : '')
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const animRef = useRef(false)
  const [navVisible, setNavVisible] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const lastScrollY = useRef(0)

  // PWA Install
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installDone, setInstallDone] = useState(false)
  const [selectedOS, setSelectedOS] = useState<'android' | 'ios'>('android')

  // Notifications
  const [notifList, setNotifList] = useState<Array<{id: number, text: string, exiting: boolean}>>([])
  const notifIdRef = useRef(0)

  // Location
  const [userCity, setUserCity] = useState('')

  // Modal Backstage
  const [backstageModal, setBackstageModal] = useState(false)

  // Formulario de contato
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

  // Auth check
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) { router.push('/dashboard') } else { setChecking(false) } })
      .catch(() => setChecking(false))
  }, [router])

  // Scroll reveal + counters
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

    // Counter observer
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.target || '0', 10)
          if (target > 0) animateCounter(el, target)
          counterObserver.unobserve(el)
        }
      })
    }, { threshold: 0.3 })

    document.querySelectorAll('.lp-counter').forEach(el => {
      if (prefersReduced) {
        const target = (el as HTMLElement).dataset.target || '0'
        const suffix = (el as HTMLElement).dataset.suffix || ''
        ;(el as HTMLElement).textContent = parseInt(target, 10).toLocaleString('pt-BR') + suffix
        return
      }
      counterObserver.observe(el)
    })

    return () => { observer.disconnect(); counterObserver.disconnect() }
  }, [checking])

  // Navbar hide/show on scroll
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

  // PWA install prompt
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

  // IP geolocation
  useEffect(() => {
    const cidades = ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife', 'Manaus', 'Goiania', 'Campinas', 'Florianopolis']
    const cidadeAleatoria = cidades[Math.floor(Math.random() * cidades.length)]
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { setUserCity(d.city || cidadeAleatoria) })
      .catch(() => { setUserCity(cidadeAleatoria) })
  }, [])

  // Animated notifications
  useEffect(() => {
    if (checking) return

    const nm = ['Ana','Carlos','Juliana','Marcos','Beatriz','Rafael','Leticia','Diego','Priscila','Bruno','Fernanda','Gustavo','Isabela','Thiago','Camila','Leonardo','Vanessa','Eduardo','Patricia','Rodrigo','Mariana','Felipe','Natalia','Vinicius','Larissa','Amanda','Ricardo','Bianca','Fabricio','Simone','Caio','Rebeca','Henrique','Luciana','Andre','Sabrina','Alex','Carolina','Marcelo','Giovana','Renata','Daniel','Pedro','Tatiana','Luiz','Monica','Gabriel','Aline','Sergio','Claudia','Paulo','Silvia','Eliane','Tiago','Bruna','Joao','Adriana','Flavia','Matheus']
    const ct = userCity
      ? [userCity,'Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Fortaleza','Recife','Manaus','Goiania','Campinas','Florianopolis','Belem','Sao Luis','Maceio','Natal','Teresina','Campo Grande','Joao Pessoa','Aracaju','Porto Velho','Macapa','Boa Vista','Palmas','Vitoria','Macae','Ribeirao Preto','Uberlandia','Contagem']
      : ['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Fortaleza','Recife','Manaus','Goiania','Campinas','Florianopolis','Belem','Sao Luis','Maceio','Natal','Teresina','Campo Grande','Joao Pessoa','Aracaju','Porto Velho','Macapa','Boa Vista','Palmas','Vitoria','Macae','Ribeirao Preto','Uberlandia','Contagem','Feira de Santana']
    const filtros = ['que nao queira ter filhos','que tenha pets','que seja evangelico(a)','que seja espiritualista','que seja vegano(a)','que seja vegetariano(a)','que nao fume','que nao beba','que faca academia','que goste de viajar','que seja introvertido(a)','que seja extrovertido(a)','que goste de leitura','que seja gamer','que goste de anime','que goste de sertanejo','que goste de funk','que goste de rock','que goste de MPB','que tenha cabelo crespo','que tenha olhos verdes','que seja loiro(a)','que goste de churrasco','que goste de trilha e natureza','que seja ateu(a)','que seja agnostico(a)','que seja catolico(a)','que curta K-pop','que seja divorciado(a)','que tenha tatuagem','que use oculos','que goste de danca','que goste de fotografia','que goste de series','que goste de meditacao','que seja empreendedor(a)','que trabalhe remoto','que tenha barba','que seja bissexual','que curta pagode','que seja solteiro(a) sem filhos','que goste de teatro','que pratique yoga','que goste de jazz','que goste de filmes']
    const premios = ['3 SuperCurtidas','1 Boost','5 Lupas','2 Desfazer Curtidas','3 tickets de roleta','1 dia de Modo Invisivel','5 SuperCurtidas','10 Lupas']

    const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
    const idade = () => Math.floor(Math.random() * 37) + 18

    const gens = [
      () => `${rnd(nm)}, ${idade()} -- acabou de se cadastrar em ${rnd(ct)}`,
      () => `${rnd(nm)}, ${idade()} -- verificou identidade agora`,
      () => `${rnd(nm)} de ${rnd(ct)} -- assinou o Plus`,
      () => `${rnd(nm)} de ${rnd(ct)} -- assinou o Camarote Black`,
      () => `${rnd(nm)} de ${rnd(ct)} -- assinou o Essencial`,
      () => `${rnd(nm)}, ${idade()} -- fez upgrade para Plus`,
      () => `${rnd(nm)}, ${idade()} -- fez upgrade para Black`,
      () => `${rnd(nm)} de ${rnd(ct)} -- deu match agora`,
      () => `${rnd(nm)}, ${idade()} -- enviou uma SuperCurtida`,
      () => `${rnd(nm)}, ${idade()} -- ganhou ${rnd(premios)} na roleta`,
      () => `${rnd(nm)} de ${rnd(ct)} -- ganhou ${rnd(premios)} na roleta`,
      () => `${rnd(nm)}, ${idade()} -- atingiu streak de 7 dias`,
      () => `${rnd(nm)}, ${idade()} -- atingiu streak de 14 dias`,
      () => `${rnd(nm)}, ${idade()} -- atingiu streak de 30 dias`,
      () => `${rnd(nm)} de ${rnd(ct)} -- configurou ${Math.floor(Math.random()*30)+20} filtros`,
      () => `${rnd(nm)}, ${idade()} -- curtiu ${Math.floor(Math.random()*8)+3} perfis hoje`,
      () => `${rnd(nm)} de ${rnd(ct)} -- esta procurando alguem ${rnd(filtros)}`,
      () => `${rnd(nm)}, ${idade()} -- esta procurando alguem ${rnd(filtros)}`,
      () => `${rnd(nm)} de ${rnd(ct)} -- perdeu um match hoje`,
      () => `${rnd(nm)}, ${idade()} -- encontrou uma conexao em ${rnd(ct)}`,
      () => `Novo perfil em ${rnd(ct)} -- ${rnd(nm)}, ${idade()} verificado`,
      () => `${rnd(nm)} de ${rnd(ct)} -- usou uma Lupa no Destaque`,
      () => `${rnd(nm)}, ${idade()} -- resgatou premio do calendario`,
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

  /* ── FAQ Items ── */
  const faqItems = [
    { q: 'Por que não existe um plano gratuito?', a: 'Porque o gratuito atrai quem não sabe o que quer. Aplicativos abertos viram bagunça: perfis falsos, pessoas inativas e perda de tempo. Cobrar um valor acessível (a partir de R$9,97) cria um filtro imediato. Quem investe para estar aqui, por menor que seja o valor, tem outro nível de intenção. Você percebe a diferença já na primeira mensagem.' },
    { q: 'O que é a área Backstage do Camarote Black?', a: 'É o seu espaço privado para desejos específicos. Uma área com filtros exclusivos que não existem nos planos comuns. A regra de ouro é a discrição: você só vê e é visto por quem marcou as exatas mesmas intenções. Zero exposição desnecessária, zero julgamento e 100% de alinhamento direto ao ponto.' },
    { q: 'Como funcionam os filtros de "incluir" e "excluir"?', a: 'É o sistema mais rápido e cirúrgico do Brasil, feito direto na tela principal. Clicou na tag, ficou verde: você quer ver aquele perfil. Clicou de novo, ficou vermelho: perfil bloqueado da sua frente. Clicou a terceira vez: volta ao neutro. Você molda a sua busca em segundos, sem precisar preencher formulários chatos.' },
    { q: 'O que acontece com a foto do meu documento após a verificação?', a: 'Ela é descartada imediatamente. Não armazenamos fotos de RG, CNH ou rosto de ninguém. Nossa tecnologia apenas valida a autenticidade na hora e guarda um código criptografado atrelado ao seu CPF. Sua privacidade é absoluta e seus dados originais nunca ficam expostos no nosso sistema.' },
    { q: 'Posso cancelar a assinatura quando quiser?', a: 'Com dois cliques, direto no aplicativo. Sem burocracia, sem precisar mandar e-mail ou falar com atendente. Você cancela na hora e continua usando normalmente até o final do período já pago. Zero fidelidade, zero multa, zero dor de cabeça.' },
    { q: 'O aplicativo funciona para todas as orientações e gêneros?', a: 'Completamente. Nosso sistema de filtros foi desenhado para abraçar todas as orientações sexuais, identidades de gênero e formatos de relacionamento. É você quem dita quem entra e quem sai da sua tela. O espaço é livre e se adapta perfeitamente ao que você procura.' },
    { q: 'Como vocês garantem que os perfis são 100% reais?', a: 'Nossa barreira de entrada é implacável contra fakes. Exigimos selfie ao vivo com sequência de movimentos, leitura de documento físico e validação de CPF na criação da conta. E o mais importante: se alguém é banido, o bloqueio é feito direto no CPF. Não adianta criar outro e-mail — a pessoa simplesmente não volta.' },
    { q: 'Como funciona a segurança e moderação do app?', a: 'Nossa equipe trabalha 24 horas por dia. Viu um comportamento fora do padrão? É só clicar nos três pontos do perfil e em "Denunciar". Além disso, para situações de risco em encontros presenciais, o app possui um botão de emergência oculto que aciona o 190 imediatamente, garantindo a sua integridade física.' },
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
        description: 'App de relacionamentos brasileiro com verificacao real de identidade e os filtros mais completos do Brasil.',
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

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090E' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '36px', color: '#f0ece4' }}>
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
          --border-premium: rgba(255,255,255,0.06);
          --red: #F43F5E;
          --shadow-accent: 0 20px 60px rgba(225,29,72,0.18);
          --shadow-card: 0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25);
          --bg-card-grad: linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%);
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
          background: rgba(8,9,14,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-premium); border-radius: 16px;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s;
        }
        .lp-logo { font-family: var(--font-fraunces), serif; font-weight: 700; font-size: 22px; color: var(--text); letter-spacing: -0.5px; text-decoration: none; }
        .lp-logo span { color: var(--accent); }
        .lp-nav-links { display: flex; gap: 4px; list-style: none; align-items: center; }
        .lp-nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
        .lp-nav-links a:hover { color: var(--text); background: var(--border-soft); }
        .lp-nav-ghost { background: transparent; color: var(--text-muted); padding: 9px 20px; border-radius: 10px; font-weight: 500; font-size: 14px; text-decoration: none; border: 1px solid var(--border-premium); transition: color 0.2s, border-color 0.2s, background 0.2s; }
        .lp-nav-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
        .lp-nav-cta { background: var(--accent-grad) !important; color: #fff !important; padding: 9px 20px !important; border-radius: 10px !important; font-weight: 600 !important; font-size: 14px !important; text-decoration: none !important; box-shadow: 0 4px 16px rgba(225,29,72,.20) !important; transition: background 0.2s !important; }
        .lp-nav-cta:hover { background: linear-gradient(135deg, #be123c 0%, #9f1239 100%) !important; }

        /* ── SCROLL REVEAL ── */
        @keyframes lpFadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpScaleIn { from { opacity:0; transform:scale(0.88) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes lpFlipUp { from { opacity:0; transform:perspective(700px) rotateX(18deg) translateY(32px); } to { opacity:1; transform:perspective(700px) rotateX(0deg) translateY(0); } }

        .lp-anim { opacity: 0; }
        .lp-anim.lp-visible { animation: lpFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-anim.lp-visible:nth-child(2) { animation-delay: 100ms; }
        .lp-anim.lp-visible:nth-child(3) { animation-delay: 200ms; }
        .lp-anim.lp-visible:nth-child(4) { animation-delay: 300ms; }

        /* ── HERO ── */
        @keyframes lp-fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.1)} 66%{transform:translate(-20px,15px) scale(0.95)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,25px) scale(1.08)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(25px,-30px)} 80%{transform:translate(-15px,20px)} }

        .lp-hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 140px 24px 80px; overflow: hidden; }
        .lp-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(8,9,14,0.55), rgba(8,9,14,0.85)), url('/backgrounds/hero.png'); background-size: cover; background-position: center; z-index: 0; }
        .lp-orb { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 1; }
        .lp-orb-1 { width: 500px; height: 500px; background: rgba(225,29,72,0.12); top: -10%; left: -5%; animation: orbFloat1 18s ease-in-out infinite; }
        .lp-orb-2 { width: 400px; height: 400px; background: rgba(244,63,94,0.08); bottom: 10%; right: -8%; animation: orbFloat2 22s ease-in-out infinite; }
        .lp-orb-3 { width: 350px; height: 350px; background: rgba(159,18,57,0.10); top: 40%; left: 50%; animation: orbFloat3 15s ease-in-out infinite; }
        .lp-hero-content { position: relative; z-index: 2; max-width: 720px; }
        .lp-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--accent-soft); border: 1px solid var(--accent-border); color: #F43F5E; padding: 7px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 28px; animation: lp-fadeUp .5s ease both; }
        .lp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: lp-pulse 2s ease-in-out infinite; }
        .lp-hero h1 { font-family: var(--font-fraunces), serif; font-size: clamp(40px, 6vw, 72px); font-weight: 700; line-height: 1.06; letter-spacing: -2px; margin-bottom: 24px; animation: lp-fadeUp .5s .1s ease both; }
        .lp-hero h1 em { font-style: italic; color: var(--accent); }
        .lp-hero-sub { font-size: 17px; font-weight: 400; color: rgba(248,249,250,0.72); max-width: 520px; margin: 0 auto 40px; line-height: 1.75; animation: lp-fadeUp .5s .2s ease both; }
        .lp-hero-sub strong { color: var(--text); font-weight: 600; }
        .lp-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; animation: lp-fadeUp .5s .3s ease both; }
        .lp-btn-main { background: var(--accent-grad); color: #fff; padding: 15px 34px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 16px rgba(225,29,72,.25), 0 12px 40px rgba(225,29,72,.20); transition: var(--transition-smooth); cursor: pointer; border: none; font-family: var(--font-jakarta), sans-serif; }
        .lp-btn-main:hover { background: #be123c; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(225,29,72,.45); }
        .lp-btn-outline { background: transparent; color: var(--text); padding: 15px 30px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; border: 1px solid var(--border-premium); display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s, background 0.2s; cursor: pointer; font-family: var(--font-jakarta), sans-serif; }
        .lp-btn-outline:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }

        /* Social proof badge */
        .lp-social-badge { display: inline-flex; align-items: center; gap: 10px; margin-top: 36px; animation: lp-fadeUp .5s .45s ease both; font-size: 13px; color: var(--text-muted); }
        .lp-social-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: lp-pulse 2s ease-in-out infinite; }

        /* ── NOTIFICATIONS ── */
        @keyframes lp-notif-in { from { opacity:0; transform:translateY(10px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes lp-notif-out { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-10px) scale(0.95); } }
        .lp-notif-area { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; margin-top: 24px; min-height: 40px; }
        .lp-notif-item { background: rgba(8,9,14,0.90); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.13); border-radius: 100px; padding: 8px 16px; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; display: flex; align-items: center; gap: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .lp-notif-enter { animation: lp-notif-in 0.4s ease forwards; }
        .lp-notif-exit { animation: lp-notif-out 0.4s ease forwards; }
        .lp-fc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }

        /* ── STATS ── */
        .lp-stats-section { padding: 60px 24px; background: linear-gradient(180deg, rgba(13,15,22,1) 0%, var(--bg) 100%); }
        .lp-stats-inner { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; text-align: center; }
        .lp-stat-number { font-family: var(--font-fraunces), serif; font-size: clamp(32px, 4vw, 48px); font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 6px; }
        .lp-stat-desc { font-size: 13px; color: var(--text-muted); }

        /* ── SECTION HELPERS ── */
        .lp-section-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .lp-section-title { font-family: var(--font-fraunces), serif; font-size: clamp(30px, 4vw, 52px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }

        /* ── BG FADE ── */
        .lp-bg-fade { position: relative; }
        .lp-bg-fade::before, .lp-bg-fade::after { content: ''; position: absolute; left: 0; right: 0; height: 180px; z-index: 2; pointer-events: none; }
        .lp-bg-fade::before { top: 0; background: linear-gradient(to bottom, #08090E 0%, transparent 100%); }
        .lp-bg-fade::after { bottom: 0; background: linear-gradient(to top, #08090E 0%, transparent 100%); }
        .lp-bg-fade > * { position: relative; z-index: 3; }

        /* ── WHY PAY ── */
        .lp-why { padding: 80px 24px; background: linear-gradient(180deg, #08090E 0%, #0d0f18 50%, #08090E 100%); }
        .lp-why-inner { max-width: 900px; margin: 0 auto; text-align: center; }
        .lp-why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; text-align: left; }
        .lp-why-card { background: linear-gradient(160deg, rgba(19,22,31,0.98) 0%, rgba(15,17,23,0.98) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px 28px; position: relative; overflow: hidden; transition: border-color 0.3s, transform 0.3s; }
        .lp-why-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent-grad); opacity: 0; transition: opacity 0.3s; border-radius: 20px 20px 0 0; }
        .lp-why-card:hover { border-color: rgba(225,29,72,0.25); transform: translateY(-4px); }
        .lp-why-card:hover::before { opacity: 1; }
        .lp-why-num { font-family: var(--font-fraunces), serif; font-size: 56px; font-weight: 700; line-height: 1; color: var(--accent); opacity: 0.12; margin-bottom: -8px; }
        .lp-why-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .lp-why-desc { font-size: 13px; color: rgba(248,249,250,0.6); line-height: 1.75; margin: 0; }

        /* ── SECURITY PILLARS ── */
        .lp-security { padding: 80px 24px; background: #0a0c13; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lp-security-inner { max-width: 960px; margin: 0 auto; text-align: center; }
        .lp-security-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 48px; }
        .lp-security-card { background: linear-gradient(160deg, rgba(19,22,31,0.98) 0%, rgba(15,17,23,0.98) 100%); border: 1px solid rgba(225,29,72,0.12); border-radius: 18px; padding: 28px 22px; text-align: center; transition: border-color 0.3s, transform 0.3s; }
        .lp-security-card:hover { border-color: rgba(225,29,72,0.3); transform: translateY(-3px); }
        .lp-security-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(225,29,72,0.10); border: 1px solid rgba(225,29,72,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--accent); }
        .lp-security-card h4 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .lp-security-card p { font-size: 12px; color: rgba(248,249,250,0.55); line-height: 1.65; margin: 0; }

        /* ── MODES (4 cards) ── */
        .lp-modes { padding: 100px 24px; position: relative; overflow: hidden; }
        .lp-modes-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(8,9,14,0.78), rgba(8,9,14,0.92)), url('/backgrounds/diferenciais.png'); background-size: cover; background-position: center; z-index: 0; }
        .lp-modes-inner { max-width: 1100px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .lp-modes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 60px; }
        .lp-mode-card {
          background: var(--bg-card-grad); border-radius: 20px; padding: 32px 24px;
          text-align: left; position: relative; overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .lp-mode-card:hover { transform: perspective(800px) rotateX(-3deg) rotateY(3deg) scale(1.02); }
        .lp-mode-num { font-family: var(--font-fraunces), serif; font-size: 48px; font-weight: 700; line-height: 1; margin-bottom: 16px; opacity: 0.15; }
        .lp-mode-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .lp-mode-card h3 { font-family: var(--font-fraunces), serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
        .lp-mode-card p { font-size: 13px; color: rgba(248,249,250,0.65); line-height: 1.65; margin-bottom: 16px; }
        .lp-mode-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; }

        /* Mode card variants — identidade unificada da marca */
        .lp-mode-card { background: linear-gradient(160deg, rgba(19,22,31,0.98) 0%, rgba(15,17,23,0.98) 100%); border: 1px solid rgba(225,29,72,0.18); }
        .lp-mode-card:hover { box-shadow: 0 16px 48px rgba(225,29,72,0.12); border-color: rgba(225,29,72,0.35); }
        .lp-mode-card .lp-mode-icon { background: rgba(225,29,72,0.10); color: var(--accent); border: 1px solid rgba(225,29,72,0.25); }
        .lp-mode-card .lp-mode-tag { background: rgba(225,29,72,0.08); color: #F43F5E; border: 1px solid rgba(225,29,72,0.18); }

        /* ── CAMAROTE BLACK ── */
        .lp-camarote { padding: 100px 24px; position: relative; overflow: hidden; }
        .lp-camarote-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(8,9,14,0.82), rgba(8,9,14,0.92)), url('/backgrounds/MUITO%20MAIS%20DO%20QUE%20CURTIDAS.png'); background-size: cover; background-position: center; z-index: 0; }
        .lp-camarote-inner { max-width: 900px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .lp-gold-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--gold-soft); border: 1px solid var(--gold-border); color: var(--gold); padding: 7px 18px; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
        .lp-camarote h2 { font-family: var(--font-fraunces), serif; font-size: clamp(32px, 4.5vw, 56px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.08; margin-bottom: 16px; }
        .lp-camarote h2 em { color: var(--gold); font-style: italic; }
        .lp-camarote-desc { font-size: 16px; color: rgba(248,249,250,0.65); line-height: 1.75; max-width: 560px; margin: 0 auto 48px; }
        .lp-camarote-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px; }
        .lp-camarote-feat { background: rgba(245,158,11,0.04); border: 1px solid var(--gold-border); border-radius: 16px; padding: 24px 20px; text-align: left; transition: var(--transition-smooth); }
        .lp-camarote-feat:hover { background: rgba(245,158,11,0.08); transform: translateY(-3px); }
        .lp-camarote-feat-icon { color: var(--gold); margin-bottom: 12px; }
        .lp-camarote-feat h4 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .lp-camarote-feat p { font-size: 12px; color: rgba(248,249,250,0.50); line-height: 1.6; margin: 0; }
        .lp-btn-gold { background: var(--gold); color: #fff; padding: 15px 34px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 16px rgba(245,158,11,.25); transition: var(--transition-smooth); cursor: pointer; border: none; font-family: var(--font-jakarta), sans-serif; }
        .lp-btn-gold:hover { background: #d97706; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(245,158,11,.35); }
        .lp-camarote-note { font-size: 12px; color: var(--text-dim); margin-top: 20px; font-style: italic; }

        /* ── GAMIFICATION ── */
        .lp-gamif { padding: 100px 24px; background: var(--bg); position: relative; overflow: hidden; }
        .lp-gamif-orb { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: rgba(225,29,72,0.06); filter: blur(120px); top: -100px; right: -100px; pointer-events: none; }
        .lp-gamif-inner { max-width: 1000px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .lp-gamif-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; text-align: left; }
        .lp-gamif-card { background: var(--bg-card-grad); border: 1px solid rgba(225,29,72,0.15); border-radius: 20px; padding: 32px 28px; box-shadow: var(--shadow-card); transition: var(--transition-smooth); }
        .lp-gamif-card:hover { border-color: rgba(225,29,72,0.35); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(225,29,72,0.10); }
        .lp-gamif-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--accent-soft); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: var(--accent); }
        .lp-gamif-card h3 { font-family: var(--font-fraunces), serif; font-size: 19px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .lp-gamif-card p { font-size: 13px; color: rgba(248,249,250,0.65); line-height: 1.7; margin: 0; }

        /* Roleta spin on hover */
        .lp-roleta-icon { transition: transform 0.3s ease; }
        .lp-gamif-card:hover .lp-roleta-icon { animation: spin360 0.6s ease; }
        @keyframes spin360 { to { transform: rotate(360deg); } }

        /* Streak progress bar */
        .lp-streak-bar { width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); margin-top: 12px; overflow: hidden; }
        .lp-streak-fill { height: 100%; border-radius: 3px; background: var(--accent-grad); width: 0%; animation: streakGrow 2s 0.5s ease forwards; }
        @keyframes streakGrow { to { width: 73%; } }

        /* Mini badges */
        .lp-mini-badges { display: flex; gap: 8px; margin-top: 12px; }
        .lp-mini-badge { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

        /* ── VERIFICATION ── */
        .lp-verify { padding: 80px 24px; background: #0d0f16; }
        .lp-verify-inner { max-width: 900px; margin: 0 auto; text-align: center; }
        .lp-verify-shield { width: 64px; height: 64px; margin: 0 auto 20px; color: var(--accent); }
        .lp-verify-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        .lp-verify-col { text-align: center; }
        .lp-verify-col-icon { width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 50%; background: var(--accent-soft); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .lp-verify-col h4 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .lp-verify-col p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        /* ── TESTIMONIALS ── */
        .lp-testi { padding: 100px 24px; position: relative; overflow: hidden; }
        .lp-testi-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(8,9,14,0.75), rgba(8,9,14,0.90)), url('/backgrounds/depoimentos.png'); background-size: cover; background-position: center; z-index: 0; }
        .lp-testi-inner { max-width: 1100px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .lp-testi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; text-align: left; }
        .lp-testi-card { background: rgba(15,17,23,0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 30px; transition: border-color 0.3s, transform 0.3s; }
        .lp-testi-card:hover { border-color: rgba(225,29,72,0.25); transform: translateY(-4px); }
        .lp-testi-stars { color: var(--gold); font-size: 13px; margin-bottom: 14px; letter-spacing: 2px; }
        .lp-testi-text { font-size: 14px; color: rgba(248,249,250,0.78); line-height: 1.75; margin-bottom: 20px; font-style: italic; }
        .lp-testi-author { display: flex; align-items: center; gap: 12px; }
        .lp-testi-av { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-testi-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
        .lp-testi-role { font-size: 11px; color: var(--text-dim); }

        /* ── PRICING ── */
        .lp-pricing { padding: 100px 24px; background: var(--bg); }
        .lp-pricing-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .lp-card { background: rgba(15,17,23,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 36px 28px; text-align: left; position: relative; transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s; }
        .lp-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
        .lp-card.mid { border-color: var(--accent-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(225,29,72,0.06)); }
        .lp-card.vip { border-color: var(--gold-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(245,158,11,0.06)); position: relative; overflow: hidden; }
        .lp-card.vip::before { content: ''; position: absolute; inset: -1px; border-radius: 24px; padding: 1px; background: linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%); background-size: 200% 100%; animation: shimmerGold 3s linear infinite; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        @keyframes shimmerGold { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .lp-feat-badge { display: block; width: fit-content; margin: 0 auto 20px; font-size: 10px; font-weight: 700; padding: 5px 18px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
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
        .lp-btn-gold-p { background: var(--gold); color: #fff; }

        /* ── INSTALL PWA (compact) ── */
        .lp-install { padding: 60px 24px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-install-inner { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .lp-install-left h3 { font-family: var(--font-fraunces), serif; font-size: clamp(22px, 3vw, 32px); font-weight: 700; margin-bottom: 12px; }
        .lp-install-left h3 em { color: var(--accent); font-style: italic; }
        .lp-install-left > p { font-size: 14px; color: var(--text-muted); line-height: 1.7; margin-bottom: 20px; }
        .lp-install-os-tabs { display: flex; gap: 0; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-premium); margin-bottom: 12px; }
        .lp-os-tab { flex: 1; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text-muted); font-family: var(--font-jakarta), sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s, color 0.2s; }
        .lp-os-tab:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .lp-os-tab.active { background: var(--accent-grad); color: #fff; }
        .lp-install-actions { display: flex; flex-direction: column; gap: 10px; }
        .lp-install-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: transform 0.15s, box-shadow 0.2s; font-family: var(--font-jakarta), sans-serif; width: 100%; }
        .lp-install-btn:hover { transform: translateY(-2px); }
        .lp-install-btn.android { background: var(--accent-grad); color: #fff; box-shadow: 0 4px 16px rgba(225,29,72,.25); }
        .lp-install-btn.ios { background: rgba(255,255,255,0.06); color: var(--text); border: 1px solid var(--border-premium); cursor: default; }
        .lp-install-btn-icon { width: 20px; height: 20px; flex-shrink: 0; }
        .lp-install-btn-text { display: flex; flex-direction: column; text-align: left; }
        .lp-install-btn-text small { font-size: 10px; font-weight: 400; opacity: 0.7; }
        .lp-install-done { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #4ade80; font-weight: 600; }
        .lp-install-right { display: flex; flex-direction: column; gap: 12px; }
        .lp-install-step { display: flex; align-items: flex-start; gap: 12px; background: var(--bg); border: 1px solid var(--border-premium); border-radius: 12px; padding: 16px 18px; }
        .lp-install-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-fraunces), serif; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .lp-install-step-num.android { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
        .lp-install-step-num.ios { background: rgba(255,255,255,0.06); color: rgba(248,249,250,0.6); border: 1px solid var(--border-premium); }
        .lp-install-step h4 { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
        .lp-install-step p { font-size: 11px; color: var(--text-muted); line-height: 1.5; margin: 0; }

        /* ── FAQ ── */
        .lp-faq { padding: 100px 24px; background: var(--bg-card-grad); border-top: 1px solid var(--border-premium); }
        .lp-faq-inner { max-width: 760px; margin: 0 auto; text-align: center; }
        .lp-faq-list { margin-top: 56px; text-align: left; }

        /* ── FOOTER ── */
        .lp-footer { background: #020306; color: var(--text-dim); border-top: 1px solid var(--border-premium); }
        .lp-footer-contact { max-width: 1100px; margin: 0 auto; padding: 40px 56px; border-bottom: 1px solid var(--border-premium); }
        .lp-footer-contact h4 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(248,249,250,0.5); margin-bottom: 20px; }
        .lp-contact-form { display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 12px; align-items: end; }
        .lp-contact-form select, .lp-contact-form input, .lp-contact-form textarea {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border-premium); border-radius: 10px;
          color: var(--text); font-family: var(--font-jakarta), sans-serif; font-size: 13px; padding: 10px 14px;
          outline: none; transition: border-color 0.2s; appearance: none; -webkit-appearance: none;
        }
        .lp-contact-form select:focus, .lp-contact-form input:focus, .lp-contact-form textarea:focus { border-color: rgba(225,29,72,0.4); }
        .lp-contact-form textarea { resize: none; height: 42px; }
        .lp-contact-form option { background: #13161F; }
        .lp-contact-btn { background: var(--accent-grad); color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: var(--transition-smooth); font-family: var(--font-jakarta), sans-serif; box-shadow: 0 4px 16px rgba(225,29,72,.20); }
        .lp-contact-btn:hover { background: #be123c; }
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

        /* ── HAMBURGER ── */
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

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .lp-nav { width: calc(100% - 32px); top: 12px; padding: 12px 20px; }
          .lp-nav-links { display: none; }
          .lp-hamburger { display: flex; }
          .lp-why-grid { grid-template-columns: 1fr; }
          .lp-security-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-modes-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-camarote-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-cards { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
          .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-install-inner { grid-template-columns: 1fr; gap: 32px; }
          .lp-footer-top { grid-template-columns: 1fr 1fr; padding: 48px 24px; gap: 32px; }
          .lp-footer-bottom { padding: 20px 24px; flex-direction: column; text-align: center; }
          .lp-contact-form { grid-template-columns: 1fr 1fr; }
          .lp-footer-contact { padding: 32px 24px; }
        }
        @media (max-width: 600px) {
          .lp-hero h1 { font-size: clamp(32px, 8vw, 44px); }
          .lp-actions { flex-direction: column; }
          .lp-btn-main, .lp-btn-outline { width: 100%; justify-content: center; }
          .lp-stats-inner { grid-template-columns: 1fr; gap: 24px; }
          .lp-why-grid { grid-template-columns: 1fr; }
          .lp-security-grid { grid-template-columns: 1fr; }
          .lp-modes-grid { grid-template-columns: 1fr 1fr; }
          .lp-camarote-grid { grid-template-columns: 1fr; }
          .lp-gamif-grid { grid-template-columns: 1fr; }
          .lp-cards { max-width: 100%; }
          .lp-footer-top { grid-template-columns: 1fr; }
          .lp-contact-form { grid-template-columns: 1fr; }
          .lp-notif-item { font-size: 11px; padding: 7px 12px; }
        }
      `}</style>

      <div className="lp">

        {/* ── Navbar ── */}
        <nav className="lp-nav" style={{ transform: navVisible ? 'translateX(-50%)' : 'translateX(-50%) translateY(-120%)', opacity: navVisible ? 1 : 0 }}>
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul className="lp-nav-links">
            <li><a href="#modos">Modos</a></li>
            <li><a href="#camarote">Camarote</a></li>
            <li><a href="#planos">Planos</a></li>
            <li><a href="/login" className="lp-nav-ghost">Entrar</a></li>
            <li><a href="/cadastro" className="lp-nav-cta">Criar conta</a></li>
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
            <a href="#modos" onClick={() => setMenuAberto(false)}>Modos</a>
            <a href="#camarote" onClick={() => setMenuAberto(false)}>Camarote</a>
            <a href="#planos" onClick={() => setMenuAberto(false)}>Planos</a>
            <a href="/login" onClick={() => setMenuAberto(false)}>Entrar</a>
            <a href="/cadastro" className="lp-nav-cta" onClick={() => setMenuAberto(false)}>Criar conta</a>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-hero">
          <div className="lp-hero-bg" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
          <div className="lp-hero-content">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              Verificação real de identidade
            </div>
            <h1>Conexões que<br /><em>valem a pena.</em></h1>
            <p className="lp-hero-sub">
              O app de relacionamentos com <strong>verificação rigorosa</strong>,
              mais de 100 filtros e um ecossistema completo para quem busca algo de verdade.
            </p>
            <div className="lp-actions">
              <a href="/cadastro" className="lp-btn-main">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                Criar minha conta
              </a>
              <a href="#modos" className="lp-btn-outline">
                Ver como funciona
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
              </a>
            </div>
            <div className="lp-social-badge">
              <span className="lp-social-badge-dot" />
              47 mil membros verificados · ativos agora
            </div>
          </div>

          {/* Notifications */}
          <div className="lp-notif-area">
            {notifList.map(n => (
              <div key={n.id} className={`lp-notif-item ${n.exiting ? 'lp-notif-exit' : 'lp-notif-enter'}`}>
                <span className="lp-fc-dot" />{n.text}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: STATS ANIMADOS
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-stats-section">
          <div className="lp-stats-inner">
            <div className="lp-anim">
              <div className="lp-stat-number lp-counter" data-target="47000" data-suffix="+">0</div>
              <div className="lp-stat-desc">membros verificados</div>
            </div>
            <div className="lp-anim">
              <div className="lp-stat-number lp-counter" data-target="3" data-suffix="/s">0</div>
              <div className="lp-stat-desc">matches por segundo</div>
            </div>
            <div className="lp-anim">
              <div className="lp-stat-number lp-counter" data-target="127" data-suffix="">0</div>
              <div className="lp-stat-desc">cidades ativas</div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2.5: POR QUE PAGAR?
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-why">
          <div className="lp-why-inner">
            <p className="lp-section-label">Por que não é gratuito</p>
            <h2 className="lp-section-title lp-anim">Gratuito atrai <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>quem não sabe</em><br />o que quer.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              A partir de R$9,97 por mês, criamos um filtro natural de intenção. O resultado: outra qualidade de conversa, de perfil, de experiência.
            </p>
            <div className="lp-why-grid">
              <div className="lp-why-card lp-anim">
                <div className="lp-why-num">01</div>
                <div className="lp-why-title">Filtro de intenção real</div>
                <p className="lp-why-desc">Quem paga para estar aqui, por menor que seja o valor, tem outro nível de comprometimento. Você sente isso na primeira mensagem.</p>
              </div>
              <div className="lp-why-card lp-anim">
                <div className="lp-why-num">02</div>
                <div className="lp-why-title">Zero perfis falsos</div>
                <p className="lp-why-desc">A barreira de entrada — verificação de identidade + pagamento — elimina bots, fakes e perfis abandonados de vez.</p>
              </div>
              <div className="lp-why-card lp-anim">
                <div className="lp-why-num">03</div>
                <div className="lp-why-title">Infraestrutura de verdade</div>
                <p className="lp-why-desc">Moderação 24h, IA para fotos, botão de emergência, verificação facial ao vivo. Tudo isso custa, e é isso que garante sua segurança.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: OS 4 MODOS
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-modes" id="modos">
          <div className="lp-modes-bg" />
          <div className="lp-modes-inner">
            <p className="lp-section-label">Quatro formas de conexão</p>
            <h2 className="lp-section-title">Quatro formas de encontrar<br />sua <span style={{ color: 'var(--accent)' }}>conexão.</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Cada modo foi criado para um tipo diferente de busca. Você escolhe como quer explorar.
            </p>
            <div className="lp-modes-grid">
              {/* Descobrir */}
              <div className="lp-mode-card lp-anim">
                <div className="lp-mode-num">01</div>
                <div className="lp-mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                </div>
                <h3>Descobrir</h3>
                <p>Explore perfis com swipe. Curta, passe ou envie uma SuperCurtida. O modo mais rápido, com perfis 100% verificados.</p>
                <span className="lp-mode-tag">Swipe verificado</span>
              </div>

              {/* Busca Avancada */}
              <div className="lp-mode-card lp-anim">
                <div className="lp-mode-num">02</div>
                <div className="lp-mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/></svg>
                </div>
                <h3>Busca Avançada</h3>
                <p>Mais de 100 filtros: corpo, estilo, personalidade, hábitos, orientação, intenções. Inclua e exclua com um toque.</p>
                <span className="lp-mode-tag">100+ filtros</span>
              </div>

              {/* Match do Dia */}
              <div className="lp-mode-card lp-anim">
                <div className="lp-mode-num">03</div>
                <div className="lp-mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h3>Match do Dia</h3>
                <p>Todo dia, uma curadoria personalizada baseada no seu perfil, seus filtros e seu comportamento dentro do app.</p>
                <span className="lp-mode-tag">Curadoria para você</span>
              </div>

              {/* Salas */}
              <div className="lp-mode-card lp-anim">
                <div className="lp-mode-num">04</div>
                <div className="lp-mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3>Salas</h3>
                <p>Entre em salas temáticas por interesse ou humor e descubra quem está no mesmo astral que você neste momento.</p>
                <span className="lp-mode-tag">Plus e Black</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: CAMAROTE BLACK
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-camarote" id="camarote">
          <div className="lp-camarote-bg" />
          <div className="lp-camarote-inner">
            <div className="lp-gold-badge lp-anim">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
              ACESSO EXCLUSIVO
            </div>
            <h2 className="lp-anim">Onde os limites<br />são <em>seus.</em></h2>
            <p className="lp-camarote-desc lp-anim">
              Um espaço blindado para quem quer explorar desejos específicos com total privacidade.
              Sem julgamento, sem exposição. Só quem sinalizou as mesmas intenções pode ver você.
            </p>
            <div className="lp-camarote-grid">
              {[
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, t: 'Área privada exclusiva', d: 'O Backstage é uma área separada, visível apenas para quem sinalizou as mesmas intenções.' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, t: 'Chat privado e discreto', d: 'Conversas no Backstage ficam separadas do restante do app. Nenhuma exposição desnecessária.' },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>, t: 'Filtros de nicho exclusivos', d: 'Categorias e preferências que não existem em nenhum outro plano. Você encontra exatamente quem procura.' },
              ].map((feat, i) => (
                <div key={i} className="lp-camarote-feat lp-anim">
                  <div className="lp-camarote-feat-icon">{feat.icon}</div>
                  <h4>{feat.t}</h4>
                  <p>{feat.d}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <a href="/planos" className="lp-btn-gold lp-anim">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Assinar Camarote Black
              </a>
              <button
                onClick={() => setBackstageModal(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                  gap: '6px', fontSize: '13px', color: 'rgba(245,158,11,0.6)', fontFamily: 'var(--font-jakarta), sans-serif',
                  fontWeight: 500, padding: '4px 8px', borderRadius: '6px', transition: 'color 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = 'rgba(245,158,11,0.9)')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(245,158,11,0.6)')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Explorar o Backstage
              </button>
            </div>
            <p className="lp-camarote-note lp-anim">Visivel apenas para quem sinalizou as mesmas intencoes.</p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5: GAMIFICACAO
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-gamif">
          <div className="lp-gamif-orb" />
          <div className="lp-gamif-inner">
            <p className="lp-section-label">Muito mais do que curtidas</p>
            <h2 className="lp-section-title"><span style={{ color: 'var(--accent)' }}>Recompensas</span> por<br />estar aqui.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
              Todo dia tem prêmio. Quanto mais você usa, mais você ganha.
            </p>
            <div className="lp-gamif-grid">
              {/* Roleta */}
              <div className="lp-gamif-card lp-anim">
                <div className="lp-gamif-icon">
                  <svg className="lp-roleta-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/>
                    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <h3>Roleta Diária</h3>
                <p>Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e fichas para gastar na loja. Cada plano dá mais giros por dia.</p>
              </div>

              {/* Streak */}
              <div className="lp-gamif-card lp-anim">
                <div className="lp-gamif-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <h3>Streak de Acesso</h3>
                <p>Entre todos os dias e desbloqueie recompensas crescentes. Sequência de 30 dias garante prêmios raros.</p>
                <div className="lp-streak-bar"><div className="lp-streak-fill" /></div>
              </div>

              {/* Emblemas */}
              <div className="lp-gamif-card lp-anim">
                <div className="lp-gamif-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="6"/>
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                </div>
                <h3>Emblemas Colecionáveis</h3>
                <p>Conquistas que aparecem no seu perfil. Raridades de Comum a Lendário — quanto mais raro, mais destaque você ganha.</p>
                <div className="lp-mini-badges">
                  <div className="lp-mini-badge" style={{ background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', fontSize: '11px', fontWeight: 700 }}>C</div>
                  <div className="lp-mini-badge" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '11px', fontWeight: 700 }}>I</div>
                  <div className="lp-mini-badge" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', fontSize: '11px', fontWeight: 700 }}>R</div>
                  <div className="lp-mini-badge" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: '11px', fontWeight: 700 }}>L</div>
                </div>
              </div>

              {/* Loja */}
              <div className="lp-gamif-card lp-anim">
                <div className="lp-gamif-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <h3>Loja com Fichas</h3>
                <p>Use fichas para comprar SuperCurtidas, Boosts, Lupas e itens exclusivos. Ganhe fichas na roleta ou comprando pacotes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6: SEGURANÇA
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-security">
          <div className="lp-security-inner">
            <p className="lp-section-label">Segurança</p>
            <h2 className="lp-section-title lp-anim">Só entra quem é <span style={{ color: 'var(--accent)' }}>real.</span></h2>
            <p className="lp-anim" style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              O processo de verificação mais rigoroso do mercado. Nenhum fake passa, nenhuma conta duplicada sobrevive.
            </p>
            <div className="lp-security-grid">
              <div className="lp-security-card lp-anim">
                <div className="lp-security-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="3"/><path d="M12 6h.01"/></svg>
                </div>
                <h4>Documento + selfie ao vivo</h4>
                <p>RG ou CNH com selfie em tempo real. Impossível usar foto ou vídeo gravado.</p>
              </div>
              <div className="lp-security-card lp-anim">
                <div className="lp-security-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6s1-1 4-1 5 2 8 2 4-1 4-1V18s-1 1-4 1-5-2-8-2-4 1-4 1V6z"/><line x1="1" y1="12" x2="23" y2="12"/></svg>
                </div>
                <h4>1 CPF, 1 conta</h4>
                <p>Banimento permanente por CPF. Quem sai pela porta não volta por outra.</p>
              </div>
              <div className="lp-security-card lp-anim">
                <div className="lp-security-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <h4>Botão de emergência</h4>
                <p>Aciona o 190 diretamente pelo app, em encontros presenciais. Pensado especialmente para a segurança feminina.</p>
              </div>
              <div className="lp-security-card lp-anim">
                <div className="lp-security-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h4>Registro de saída</h4>
                <p>Registre o encontro no app. Se não der check-in depois, o app pergunta se está tudo bem.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7: DEPOIMENTOS
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-testi">
          <div className="lp-testi-bg" />
          <div className="lp-testi-inner">
            <p className="lp-section-label">Depoimentos</p>
            <h2 className="lp-section-title">Quem já está aqui<br /><span style={{ color: 'var(--accent)' }}>não volta.</span></h2>
            <div className="lp-testi-grid">
              {[
                { name: 'Camila S.', role: 'Belo Horizonte · 27 anos · Plano Plus', text: 'Passei muito tempo em apps conversando com pessoas em momentos diferentes do meu. Aqui fui direto ao ponto: ativei os filtros e deixei claro que procuro algo sério. O app cortou o ruído e me conectou só com quem estava na mesma página.' },
                { name: 'Lucas M.', role: 'Rio de Janeiro · 34 anos · Camarote Black', text: 'A pior parte de conhecer gente nova é quando um quer uma coisa e o outro quer outra. No Backstage, joguei limpo sobre o que curto. Deu match com uma mulher que queria exatamente a mesma coisa. Fomos direto ao assunto, com muita química e zero cobrança.' },
                { name: 'Thiago R.', role: 'Curitiba · 36 anos · Camarote Black', text: 'Valorizo muito o meu tempo. O Camarote Black é perfeito porque atrai pessoas que buscam o mesmo nível. A verificação rigorosa garante que os perfis são reais — isso faz toda a diferença.' },
                { name: 'Fernanda O.', role: 'São Paulo · 29 anos · Plano Plus', text: 'Queria sair e me divertir, mas dava preguiça chegar no encontro e descobrir que a química não rolava. A videochamada aqui mudou o jogo. Bati 40 minutos de papo, vi que a energia batia pela tela, e fomos pro encontro já com aquele clima bom.' },
              ].map((t, i) => (
                <div key={i} className="lp-testi-card lp-anim">
                  <div className="lp-testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  <p className="lp-testi-text">&quot;{t.text}&quot;</p>
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

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8: PLANOS
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-pricing" id="planos">
          <div className="lp-pricing-inner">
            <p className="lp-section-label">Planos</p>
            <h2 className="lp-section-title">Sem plano gratuito.<br /><span style={{ color: 'var(--accent)' }}>Mais seriedade.</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Quem investe para estar aqui tem outro nível de intenção. Você sente a diferença na primeira mensagem.
            </p>
            <div className="lp-cards">
              <div className="lp-card lp-anim">
                <p className="lp-plan-name">Essencial</p>
                <p className="lp-plan-area">Pista</p>
                <div className="lp-plan-price"><sup>R$</sup>10</div>
                <p className="lp-plan-period">por mes</p>
                <p className="lp-plan-desc">O ponto de entrada. Para quem quer explorar a plataforma com pessoas verificadas.</p>
                <ul className="lp-feats">
                  <li>Verificacao de identidade</li>
                  <li>30 curtidas por dia</li>
                  <li>1 filtro ativo por vez</li>
                  <li>Ver matches recebidos</li>
                  <li className="off">Filtros acumulados</li>
                  <li className="off">Filtro de exclusao</li>
                  <li className="off">Ver quem curtiu voce</li>
                  <li className="off">Desfazer curtida</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-outline-p">Assinar Essencial</a>
              </div>

              <div className="lp-card mid lp-anim">
                <span className="lp-feat-badge rose">Mais popular</span>
                <p className="lp-plan-name" style={{ marginTop: '4px' }}>Plus</p>
                <p className="lp-plan-area">Area VIP</p>
                <div className="lp-plan-price"><sup>R$</sup>39</div>
                <p className="lp-plan-period">por mes</p>
                <p className="lp-plan-desc">A experiencia completa de filtragem. Para quem esta realmente em busca de uma conexao.</p>
                <ul className="lp-feats">
                  <li>Verificacao de identidade</li>
                  <li>100 curtidas por dia</li>
                  <li>Todos os filtros acumulados</li>
                  <li>Filtro de exclusao</li>
                  <li>Ver quem curtiu voce</li>
                  <li>Desfazer curtida (1/dia)</li>
                  <li>Boost semanal de perfil</li>
                  <li>1 Lupa/dia no Destaque</li>
                  <li>2 tickets de roleta/dia</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-rose">Assinar Plus</a>
              </div>

              <div className="lp-card vip lp-anim">
                <span className="lp-feat-badge gold">Camarote</span>
                <p className="lp-plan-name" style={{ marginTop: '4px' }}>Black</p>
                <p className="lp-plan-area">Backstage</p>
                <div className="lp-plan-price"><sup>R$</sup>100</div>
                <p className="lp-plan-period">por mes</p>
                <p className="lp-plan-desc">Acesso total, area exclusiva Backstage e visibilidade maxima.</p>
                <ul className="lp-feats">
                  <li className="gold-check">Tudo do Plus</li>
                  <li className="gold-check">Curtidas ilimitadas</li>
                  <li className="gold-check">10 SuperCurtidas/dia</li>
                  <li className="gold-check">Area exclusiva Backstage</li>
                  <li className="gold-check">Filtros de nicho (Sugar, Fetiche...)</li>
                  <li className="gold-check">2 Lupas/dia no Destaque</li>
                  <li className="gold-check">3 tickets de roleta/dia</li>
                  <li className="gold-check">Destaque maximo no algoritmo</li>
                  <li className="gold-check">Suporte prioritario 24h</li>
                </ul>
                <a href="/planos" className="lp-btn-price lp-btn-gold-p">Assinar Camarote Black</a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9: INSTALAR PWA (compacto)
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-install">
          <div className="lp-install-inner">
            <div className="lp-install-left lp-anim">
              <h3><em>Baixe agora.</em> Direto no celular.</h3>
              <p>Icone na tela inicial, notificacoes em tempo real. Sem loja de apps.</p>

              <div className="lp-install-os-tabs">
                <button className={`lp-os-tab${selectedOS === 'android' ? ' active' : ''}`} onClick={() => setSelectedOS('android')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.6 10.5l2.184-3.78a.75.75 0 0 0-1.3-.75L13.3 9.75H10.7L9.516 5.97a.75.75 0 0 0-1.3.75L10.4 10.5l-2.923 4.841A.75.75 0 1 0 8.777 16L12 10.933 15.223 16a.75.75 0 1 0 1.3-.659zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                  Android
                </button>
                <button className={`lp-os-tab${selectedOS === 'ios' ? ' active' : ''}`} onClick={() => setSelectedOS('ios')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  iPhone
                </button>
              </div>

              <div className="lp-install-actions">
                {installDone ? (
                  <div className="lp-install-done">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
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
                      <small>Siga os passos ao lado</small>
                      Instalar no iPhone
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lp-install-right lp-anim">
              {selectedOS === 'android' ? (
                <>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">1</div>
                    <div><h4>Abra no Chrome</h4><p>Acesse meandyou.com.br pelo Chrome.</p></div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">2</div>
                    <div><h4>Menu de opcoes</h4><p>Toque nos 3 pontos no canto superior direito.</p></div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num android">3</div>
                    <div><h4>Adicionar a tela inicial</h4><p>Confirme e o icone aparece na sua tela.</p></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">1</div>
                    <div><h4>Abra no Safari</h4><p>Use o Safari no iPhone.</p></div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">2</div>
                    <div><h4>Compartilhar</h4><p>Toque na seta para cima na barra inferior.</p></div>
                  </div>
                  <div className="lp-install-step">
                    <div className="lp-install-step-num ios">3</div>
                    <div><h4>Adicionar a Tela de Inicio</h4><p>Role o menu e confirme.</p></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 10: FAQ
        ══════════════════════════════════════════════════════════════ */}
        <section className="lp-faq">
          <div className="lp-faq-inner">
            <p className="lp-section-label">FAQ</p>
            <h2 className="lp-section-title">Duvidas Frequentes</h2>
            <div className="lp-faq-list">
              {faqItems.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 11: FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <footer className="lp-footer">
          {/* Contact form */}
          <div className="lp-footer-contact">
            <h4>Fale conosco</h4>
            {contatoEnviado ? (
              <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: 600 }}>Mensagem enviada com sucesso! Retornaremos em breve.</p>
            ) : (
              <form className="lp-contact-form" onSubmit={handleContatoSubmit}>
                <input type="text" placeholder="Seu nome" value={contatoNome} onChange={e => setContatoNome(e.target.value)} />
                <input type="email" placeholder="Seu e-mail" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} />
                <select value={contatoAssunto} onChange={e => setContatoAssunto(e.target.value)}>
                  <option value="">Assunto</option>
                  <option value="duvida">Duvida</option>
                  <option value="sugestao">Sugestao</option>
                  <option value="problema">Problema tecnico</option>
                  <option value="parceria">Parceria</option>
                  <option value="outro">Outro</option>
                </select>
                <textarea placeholder="Sua mensagem" value={contatoMensagem} onChange={e => setContatoMensagem(e.target.value)} />
                <button type="submit" className="lp-contact-btn" disabled={contatoEnviando}>
                  {contatoEnviando ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            )}
            {contatoErro && <p style={{ color: '#F43F5E', fontSize: '13px', marginTop: '8px' }}>{contatoErro}</p>}
          </div>

          <div className="lp-footer-top">
            <div>
              <a href="/" className="lp-footer-logo">MeAnd<span>You</span></a>
              <p style={{ fontSize: '13px', lineHeight: 1.75, maxWidth: '260px' }}>
                O app de relacionamentos com verificacao real de identidade e os filtros mais completos do Brasil.
              </p>
            </div>
            <div className="lp-footer-col">
              <h4>Produto</h4>
              <a href="#modos">Modos</a>
              <a href="#camarote">Camarote</a>
              <a href="#planos">Planos e precos</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <a href="/termos">Termos de uso</a>
              <a href="/privacidade">Politica de privacidade</a>
            </div>
            <div className="lp-footer-col">
              <h4>Conta</h4>
              <a href="/cadastro">Criar conta</a>
              <a href="/login">Entrar</a>
              <a href="/fale-conosco">Fale Conosco</a>
              <a href="/suporte">Suporte</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div>
              <p>&copy; {new Date().getFullYear()} MeAndYou -- Todos os direitos reservados</p>
            </div>
            <div className="lp-footer-btm-links">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </div>
          </div>
        </footer>

      </div>

      {/* ── Modal Backstage ── */}
      {backstageModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            padding: '24px',
          }}
          onClick={() => setBackstageModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, #0f1117 0%, #13161f 100%)',
              border: '1px solid rgba(245,158,11,0.25)', borderRadius: '24px', padding: '40px 36px',
              maxWidth: '500px', width: '100%', position: 'relative',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setBackstageModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(248,249,250,0.5)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '100px', padding: '6px 16px', marginBottom: '20px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#F59E0B' }}>Backstage Exclusivo</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 700, color: '#F8F9FA', marginBottom: '10px', letterSpacing: '-0.5px' }}>
              O que voce pode explorar no Backstage
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(248,249,250,0.55)', lineHeight: 1.7, marginBottom: '28px' }}>
              Uma area separada, visivel apenas para quem marcou as mesmas intencoes. Sem exposicao, sem julgamento.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
              {[
                { t: 'Swing', d: 'Casais e parceiros alinhados' },
                { t: 'Menage', d: 'Conexoes para tres' },
                { t: 'BDSM', d: 'Praticas com consentimento claro' },
                { t: 'Poliamor', d: 'Nao monogamia com transparencia' },
                { t: 'Fetiches', d: 'Preferencias especificas compartilhadas' },
                { t: 'Identidades livres', d: 'Todas as orientacoes bem-vindas' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8F9FA', marginBottom: '3px' }}>{c.t}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(248,249,250,0.45)', lineHeight: 1.5 }}>{c.d}</div>
                </div>
              ))}
            </div>
            <a
              href="/planos"
              style={{
                display: 'block', textAlign: 'center', background: '#F59E0B', color: '#fff', fontWeight: 700,
                fontSize: '14px', padding: '13px', borderRadius: '12px', textDecoration: 'none',
                fontFamily: 'var(--font-jakarta), sans-serif', boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
              }}
            >
              Acessar o Backstage no Camarote Black
            </a>
          </div>
        </div>
      )}
    </>
  )
}
