'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--lp-border)', padding: '20px 0' }}>
      <button onClick={() => setAberto(!aberto)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontWeight: 700, fontSize: '15px', color: 'var(--lp-text)', fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left', padding: 0 }}>
        {pergunta}
        <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--lp-accent-light)', color: 'var(--lp-accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, fontWeight: 700, transform: aberto ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }}>+</span>
      </button>
      {aberto && <p style={{ fontSize: '14px', color: 'var(--lp-muted)', lineHeight: 1.7, marginTop: '12px' }}>{resposta}</p>}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const animRef = useRef(false)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) { router.push('/dashboard') } else { setChecking(false) } })
      .catch(() => setChecking(false))
  }, [router])

  useEffect(() => {
    if (checking || animRef.current) return
    animRef.current = true

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.08 })

    document.querySelectorAll('.lp-anim').forEach(el => {
      const e = el as HTMLElement
      e.style.opacity = '0'
      e.style.transform = 'translateY(18px)'
      e.style.transition = 'opacity 0.45s ease, transform 0.45s ease'
      observer.observe(e)
    })

    // How-it-works cascade
    const howObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.lp-how-step').forEach((s: any) => s.classList.add('visible'))
        }
      })
    }, { threshold: 0.2 })
    const stepsRow = document.querySelector('.lp-steps-row')
    if (stepsRow) howObserver.observe(stepsRow)

    // Filter tag toggle
    document.querySelectorAll('.lp-ftag').forEach(tag => {
      tag.addEventListener('click', () => {
        if (tag.classList.contains('neu')) { tag.classList.remove('neu'); tag.classList.add('inc') }
        else if (tag.classList.contains('inc')) { tag.classList.remove('inc'); tag.classList.add('exc') }
        else { tag.classList.remove('exc'); tag.classList.add('neu') }
      })
    })

    return () => observer.disconnect()
  }, [checking])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', color: 'var(--text)' }}>MeAnd<span style={{ color: 'var(--accent)' }}>You</span></h1>
      </div>
    )
  }

  const faqItems = [
    { q: 'Por que não tem plano gratuito?', a: 'Cobrar mesmo que R$10 já é uma barreira que afasta a maioria dos golpistas e perfis falsos. Quem está aqui pagou para estar. Isso muda o comportamento das pessoas e melhora a qualidade dos matches para todo mundo.' },
    { q: 'O que é o plano Camarote Black?', a: 'O plano premium com acesso a todos os perfis da plataforma, área exclusiva Backstage, curtidas ilimitadas, 10 SuperCurtidas por dia, 2 Lupas/dia para revelar perfis no Destaque e suporte prioritário 24h.' },
    { q: 'Como funciona o filtro de exclusão?', a: 'Clique uma vez em qualquer tag para marcar como "quero encontrar". Clique de novo para mudar para "não quero ver". Cada filtro vira automaticamente inclusão ou exclusão, sem campos separados.' },
    { q: 'O que acontece com meus documentos após a verificação?', a: 'Seus documentos são usados somente para verificação e descartados em seguida. Guardamos apenas o resultado da verificação e o hash criptografado do CPF. Os documentos originais nunca são armazenados.' },
    { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem fidelidade, sem multa de cancelamento. Você cancela direto pelo app a qualquer momento. O acesso continua até o fim do período já pago.' },
    { q: 'O app é inclusivo para diferentes orientações e identidades?', a: 'Sim. O MeAndYou tem filtros específicos para todos os gêneros e orientações. Todo mundo tem espaço aqui e pode filtrar exatamente o que procura.' },
    { q: 'Como o app combate golpes e estelionato sentimental?', a: 'Verificação de identidade obrigatória com CPF, selfie ao vivo e documento; sistema de denúncia com resposta em até 24h; banimento permanente por CPF para quem tenta fraude.' },
    { q: 'Como denunciar um perfil suspeito?', a: 'Em qualquer perfil, toque no ícone de três pontos e selecione "Denunciar". Nossa equipe analisa em até 24h. Se for urgente ou em caso de ameaça, use o botão de emergência no app para ligar direto para o 190.' },
  ]

  const filterCats = [
    { emoji: '👁️', title: 'Cor dos olhos', desc: 'Todas as variações existentes, incluindo casos raros.', tags: ['Olhos pretos','Olhos castanhos','Olhos verdes','Olhos azuis','Olhos mel','Olhos acinzentados','Heterocromia'] },
    { emoji: '💇‍♀️', title: 'Cor do cabelo', desc: 'Cor natural ou tingida dos cabelos.', tags: ['Cabelo preto','Cabelo castanho','Cabelo loiro','Cabelo ruivo','Cabelo colorido','Cabelo grisalho','Não possuo cabelo (careca)'] },
    { emoji: '〰️', title: 'Tipo e comprimento do cabelo', desc: 'Textura e tamanho dos fios.', tags: ['Cabelo curto','Cabelo médio','Cabelo longo','Cabelo liso','Cabelo ondulado','Cabelo cacheado','Cabelo crespo'] },
    { emoji: '🎨', title: 'Cor de pele e etnia', desc: 'Inclusão total. Todas as tonalidades e origens étnicas.', tags: ['Branca','Parda','Negra','Afrodescendente','Asiática','Indígena','Latina','Mediterrânea','Possuo vitiligo'] },
    { emoji: '📏', title: 'Tipo corporal', desc: 'Biotipo com base em peso e altura.', tags: ['Abaixo do peso','Peso saudável','Acima do peso','Obesidade leve','Obesidade severa'] },
    { emoji: '✨', title: 'Características físicas', desc: 'Detalhes que fazem diferença na atração.', tags: ['Possuo sardas','Possuo tatuagem','Possuo piercing','Possuo cicatriz','Uso óculos','Uso aparelho dentário','Possuo barba'] },
    { emoji: '♿', title: 'Pessoa com deficiência (PCD)', desc: 'Inclusão total. Selecione para encontrar ou ser encontrado.', tags: ['Deficiência visual','Deficiência auditiva','Deficiência motora','Deficiência intelectual','Autismo (TEA)','TDAH','Sou cadeirante','Nanismo','Outra'] },
    { emoji: '🏳️‍🌈', title: 'Orientação sexual', desc: 'Todo mundo tem seu espaço aqui, sem julgamento.', tags: ['Heterossexual','Homossexual','Bissexual','Pansexual','Assexual','Demissexual','Queer'] },
    { svg: true, title: 'Identidade de gênero', desc: 'Como a pessoa se identifica e como prefere ser chamada.', tags: ['Homem','Mulher','Homem trans','Mulher trans','Não-binário(a)','Gênero fluido'] },
    { emoji: '💍', title: 'Status civil', desc: 'Situação atual no campo amoroso.', tags: ['Solteiro(a)','Enrolado(a)','Casado(a)','Divorciando','Divorciado(a)','Viúvo(a)','Relacionamento aberto'] },
    { emoji: '🙏', title: 'Religião e espiritualidade', desc: 'Fé e espiritualidade como parte da compatibilidade.', tags: ['Evangélico(a)','Católico(a)','Espírita','Umbandista','Candomblé','Budista','Judaico(a)','Islâmico(a)','Hindu','Agnóstico(a)','Ateu / Ateia','Espiritualizado(a) sem religião'] },
    { emoji: '🚬', title: 'Vícios e substâncias', desc: 'Hábitos que impactam diretamente a convivência.', tags: ['Fumo','Fumo ocasionalmente','Não fumo','Consumo bebida alcoólica','Bebo socialmente','Não consumo bebida alcoólica','Consumo cannabis','Não possuo vícios'] },
    { emoji: '🏋️‍♀️', title: 'Estilo de vida e rotina', desc: 'Como a pessoa organiza o dia a dia e o tempo livre.', tags: ['Pratico academia','Pratico esporte regularmente','Sou sedentário(a)','Sou caseiro(a)','Gosto de sair','Gosto de balada','Sou noturno(a)','Sou matutino(a)','Sou workaholic','Tenho vida equilibrada'] },
    { emoji: '🧠', title: 'Personalidade', desc: 'Introvertido(a), extrovertido(a) e tudo entre os dois extremos.', tags: ['Sou extrovertido(a)','Sou introvertido(a)','Sou ambiverte','Sou tímido(a)','Sou comunicativo(a)','Sou antissocial','Sou reservado(a)','Sou agitado(a)','Sou calmo(a)','Sou intenso(a)'] },
    { emoji: '🎮', title: 'Hobbies e entretenimento', desc: 'O que a pessoa faz no tempo livre.', tags: ['Sou gamer','Adoro ler','Viciado(a) em filmes','Viciado(a) em séries','Curto anime / mangá','Curto música ao vivo','Faço fotografia','Arte e desenho','Danço','Faço teatro','Meditação / Yoga','Adoro viajar','Curto trilha e natureza','Sou otaku','Curto k-pop','Sou emo / punk','Sou e-girl / e-boy'] },
    { emoji: '🥗', title: 'Alimentação', desc: 'Compatibilidade alimentar importa mais do que parece.', tags: ['Sou vegano(a)','Sou vegetariano(a)','Sou carnívoro(a)','Como de tudo','Prefiro alimentação saudável','Cozinho bem','Não cozinho','Curto comida japonesa','Curto fast food','Tenho intolerância à lactose','Tenho intolerância ao glúten'] },
    { emoji: '👗', title: 'Estilo de se vestir', desc: 'A forma de se vestir diz muito sobre quem a pessoa é.', tags: ['Social','Casual','Esportivo','Alternativo','Eclético','Gótico','Punk','E-girl / E-boy','K-pop'] },
    { emoji: '🎵', title: 'Gosto musical', desc: 'Afinidade musical no dia a dia.', tags: ['Funk','Sertanejo','Pagode','Rock','Metal','Pop','Eletrônica','Hip-hop / Rap','MPB / Bossa Nova','Gospel','K-pop','Clássica','Eclético — curto de tudo','Não gosto de música'] },
    { emoji: '👶', title: 'Filhos e família', desc: 'Um dos pontos mais decisivos em qualquer relacionamento sério.', tags: ['Tenho filhos','Não tenho filhos','Quero ter filhos','Não quero ter filhos','Aberto(a) à adoção','Ainda não decidi'] },
    { emoji: '🐶', title: 'Animais de estimação', desc: 'Pet lover ou prefere não ter bicho em casa.', tags: ['Tenho cachorro','Tenho gato','Tenho outros pets','Adoro animais','Não tenho pets','Tenho alergia a animais','Não gosto de animais'] },
    { emoji: '🎓', title: 'Escolaridade', desc: 'Nível de estudo e formação acadêmica.', tags: ['Ensino fundamental','Ensino médio completo','Ensino superior incompleto','Ensino superior completo','Pós-graduado(a)','Mestrado','Doutorado','Concursado(a)','Sou estudante'] },
    { emoji: '💼', title: 'Situação profissional', desc: 'Carreira, autonomia financeira e estilo de trabalho.', tags: ['CLT','Empreendedor(a)','Freelancer','Profissional liberal','Servidor(a) público(a)','Autônomo(a)','Trabalho remoto','Estou desempregado(a)'] },
    { emoji: '🎯', title: 'O que busca na plataforma', desc: 'Seja claro sobre suas intenções. Isso evita perda de tempo dos dois lados.', tags: ['Relacionamento sério','Relacionamento casual','Amizade','Companhia para eventos','Relação conjugal','Aberto(a) a experiências','Sugar Baby','Sugar Daddy / Mommy','Ainda estou definindo'], tip: 'Perfis de categorias sensíveis ficam visíveis apenas para quem também selecionou a mesma intenção.' },
    { emoji: '🔒', title: 'Perfil discreto (exclusivo Black)', desc: 'Visível apenas para outros membros que também marcaram a mesma categoria.', tags: ['Busco trisal','Swing / relacionamento aberto','Poliamor','BDSM / fetiches'], tip: 'Estas opções ficam ocultas para quem não marcou a mesma categoria. Disponível apenas no plano Black.' },
  ]

  return (
    <>
      <style>{`
        :root {
          --lp-bg: #f8faf9; --lp-white: #ffffff; --lp-accent: #2ec4a0;
          --lp-accent-dark: #1fa082; --lp-accent-light: #e6f7f3;
          --lp-text: #111a17; --lp-muted: #7a9189; --lp-border: #e0ece8;
          --lp-shadow: 0 4px 24px rgba(46,196,160,0.12); --lp-red: #e84545; --lp-gold: #d4a017;
        }
        .lp * { box-sizing: border-box; }
        .lp { background: var(--lp-bg); color: var(--lp-text); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; line-height: 1.6; overflow-x: hidden; }
        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; align-items: center; justify-content: space-between; padding: 18px 56px; background: rgba(248,250,249,0.96); backdrop-filter: blur(16px); border-bottom: 1px solid var(--lp-border); }
        .lp-logo { font-family: 'Fraunces', serif; font-weight: 700; font-size: 24px; color: var(--lp-text); letter-spacing: -0.5px; text-decoration: none; }
        .lp-logo span { color: var(--lp-accent); }
        .lp-nav ul { display: flex; gap: 28px; list-style: none; margin: 0; padding: 0; }
        .lp-nav ul a { color: var(--lp-muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .lp-nav ul a:hover { color: var(--lp-text); }
        .lp-nav-cta { background: var(--lp-accent) !important; color: #fff !important; padding: 10px 22px; border-radius: 100px; font-weight: 600 !important; }
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .lp-hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; padding: 140px 56px 100px; max-width: 1200px; margin: 0 auto; }
        .lp-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--lp-accent-light); border: 1px solid rgba(46,196,160,.3); color: var(--lp-accent-dark); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 28px; animation: lp-fadeUp .5s ease both; }
        .lp-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--lp-accent); }
        .lp-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(42px,5vw,72px); font-weight: 700; line-height: 1.08; letter-spacing: -2px; margin-bottom: 24px; animation: lp-fadeUp .5s .1s ease both; }
        .lp-hero h1 em { font-style: italic; color: var(--lp-accent); }
        .lp-hero-sub { font-size: 18px; color: var(--lp-muted); max-width: 460px; margin-bottom: 40px; line-height: 1.7; animation: lp-fadeUp .5s .2s ease both; }
        .lp-hero-sub strong { color: var(--lp-text); font-weight: 600; }
        .lp-actions { display: flex; gap: 14px; flex-wrap: wrap; animation: lp-fadeUp .5s .3s ease both; }
        .lp-btn-main { background: var(--lp-accent); color: #fff; padding: 16px 36px; border-radius: 100px; font-weight: 700; font-size: 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(46,196,160,.35); transition: background 0.2s, transform 0.15s; }
        .lp-btn-main:hover { background: var(--lp-accent-dark); transform: translateY(-1px); }
        .lp-btn-outline { background: transparent; color: var(--lp-text); padding: 16px 32px; border-radius: 100px; font-weight: 600; font-size: 15px; text-decoration: none; border: 2px solid var(--lp-border); display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s; }
        .lp-btn-outline:hover { border-color: var(--lp-accent); }
        .lp-stats { display: flex; gap: 36px; margin-top: 48px; animation: lp-fadeUp .5s .4s ease both; }
        .lp-stat-val { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 700; line-height: 1; }
        .lp-stat-label { font-size: 12px; color: var(--lp-muted); margin-top: 3px; }
        .lp-stat-div { width: 1px; background: var(--lp-border); }
        .lp-phone { width: 268px; height: 530px; background: var(--lp-white); border-radius: 38px; box-shadow: 0 32px 80px rgba(0,0,0,.12), 0 0 0 1px var(--lp-border); overflow: hidden; animation: lp-float 5s ease-in-out infinite; }
        .lp-phone-header { background: var(--lp-accent); padding: 42px 20px 16px; text-align: center; color: #fff; }
        .lp-phone-logo { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 700; }
        .lp-phone-card { margin: 12px; background: var(--lp-bg); border-radius: 18px; overflow: hidden; }
        .lp-phone-img { height: 196px; background: linear-gradient(135deg,#e8f5f2,#c8ede4,#a8e0d4); display: flex; align-items: center; justify-content: center; font-size: 64px; position: relative; }
        .lp-v-badge { position: absolute; top: 10px; right: 10px; background: var(--lp-accent); color: #fff; border-radius: 100px; padding: 3px 10px; font-size: 10px; font-weight: 700; }
        .lp-phone-info { padding: 10px 14px 12px; }
        .lp-phone-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
        .lp-phone-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px; }
        .lp-phone-tag { background: var(--lp-accent-light); color: var(--lp-accent-dark); border-radius: 100px; padding: 2px 8px; font-size: 10px; font-weight: 600; }
        .lp-phone-actions { display: flex; justify-content: center; gap: 14px; padding: 10px 16px 14px; }
        .lp-ph-btn { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: none; cursor: pointer; }
        .lp-ph-btn.no { background: #fff0f0; color: #e84545; }
        .lp-ph-btn.super { background: #fffbee; color: #d4a017; }
        .lp-ph-btn.yes { background: var(--lp-accent-light); color: var(--lp-accent-dark); }
        .lp-hero-right { position: relative; height: 580px; display: flex; align-items: center; justify-content: center; }
        .lp-fc { position: absolute; background: var(--lp-white); border-radius: 100px; padding: 8px 16px; font-size: 12px; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,.1); border: 1px solid var(--lp-border); white-space: nowrap; color: var(--lp-text); z-index: 10; }
        .lp-fc1 { top: 40px; left: 0; }
        .lp-fc2 { top: 260px; right: -10px; }
        .lp-fc3 { bottom: 60px; left: 10px; }
        .lp-section-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--lp-accent); margin-bottom: 12px; }
        .lp-section-title { font-family: 'Fraunces', serif; font-size: clamp(28px,4vw,50px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
        /* Problem */
        .lp-problem { padding: 100px 56px; background: var(--lp-text); color: #fff; }
        .lp-problem-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-problem h2 { font-family: 'Fraunces', serif; font-size: clamp(28px,4vw,46px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px; }
        .lp-problem h2 em { color: var(--lp-accent); font-style: italic; }
        .lp-prob-list { display: flex; flex-direction: column; gap: 12px; }
        .lp-prob-item { display: flex; align-items: flex-start; gap: 14px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 18px 20px; }
        .lp-prob-num { width: 30px; height: 30px; border-radius: 50%; background: rgba(46,196,160,.15); border: 1px solid rgba(46,196,160,.3); color: var(--lp-accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
        .lp-prob-item h4 { font-size: 14px; font-weight: 700; margin-bottom: 3px; color: #fff; }
        .lp-prob-item p { font-size: 12px; color: rgba(255,255,255,.45); line-height: 1.5; margin: 0; }
        /* Verification */
        .lp-verification { padding: 100px 56px; background: var(--lp-accent-light); }
        .lp-verification-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-verify-steps { display: flex; flex-direction: column; gap: 14px; }
        .lp-verify-step { display: flex; align-items: flex-start; gap: 18px; background: var(--lp-white); border-radius: 18px; padding: 20px 22px; }
        .lp-vstep-num { width: 38px; height: 38px; border-radius: 50%; background: var(--lp-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; flex-shrink: 0; }
        .lp-verify-step h4 { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
        .lp-verify-step p { font-size: 12px; color: var(--lp-muted); line-height: 1.5; margin: 0; }
        /* Filters */
        .lp-filters { padding: 100px 56px; max-width: 1200px; margin: 0 auto; }
        .lp-filter-note { text-align: center; font-size: 14px; color: var(--lp-muted); margin-bottom: 52px; background: var(--lp-white); border: 1px solid var(--lp-border); border-radius: 12px; padding: 14px 24px; display: inline-block; }
        .lp-filter-note strong { color: var(--lp-accent-dark); }
        .lp-filter-note .exc-ex { color: var(--lp-red); font-weight: 600; }
        .lp-filter-categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; }
        .lp-filter-cat { background: var(--lp-white); border: 1px solid var(--lp-border); border-radius: 22px; padding: 26px 26px 28px; transition: all .3s; position: relative; overflow: hidden; }
        .lp-filter-cat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--lp-accent); opacity: 0; transition: opacity .3s; }
        .lp-filter-cat:hover { transform: translateY(-4px); box-shadow: var(--lp-shadow); border-color: rgba(46,196,160,.2); }
        .lp-filter-cat:hover::before { opacity: 1; }
        .lp-cat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .lp-cat-emoji { font-size: 26px; }
        .lp-filter-cat h3 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; }
        .lp-filter-cat > p { font-size: 12px; color: var(--lp-muted); margin-bottom: 14px; line-height: 1.5; }
        .lp-tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-ftag { border-radius: 100px; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; border: 1.5px solid transparent; user-select: none; }
        .lp-ftag.inc { background: var(--lp-accent-light); color: var(--lp-accent-dark); border-color: rgba(46,196,160,.3); }
        .lp-ftag.exc { background: #fff0f0; color: var(--lp-red); border-color: rgba(232,69,69,.25); }
        .lp-ftag.neu { background: #f2f2f2; color: var(--lp-muted); border-color: transparent; }
        .lp-ftag:hover { transform: scale(1.05); }
        .lp-filter-tip { font-size: 11px; color: var(--lp-muted); margin-top: 12px; font-style: italic; }
        /* Intentions */
        .lp-intentions { padding: 100px 56px; background: var(--lp-white); border-top: 1px solid var(--lp-border); }
        .lp-intentions-inner { max-width: 1100px; margin: 0 auto; }
        .lp-intentions-header { text-align: center; margin-bottom: 60px; }
        .lp-intentions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 16px; }
        .lp-intent-card { border: 2px solid var(--lp-border); border-radius: 20px; padding: 28px 16px; text-align: center; transition: all .3s cubic-bezier(.34,1.56,.64,1); }
        .lp-intent-card:hover { border-color: var(--lp-accent); background: var(--lp-accent-light); transform: translateY(-6px) scale(1.03); box-shadow: 0 16px 40px rgba(46,196,160,.18); }
        .lp-intent-icon { width: 48px; height: 48px; margin: 0 auto 14px; color: var(--lp-accent); }
        .lp-intent-card:hover .lp-intent-icon { transform: scale(1.15) rotate(-5deg); }
        .lp-intent-card h3 { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .lp-intent-card p { font-size: 11px; color: var(--lp-muted); line-height: 1.5; }
        /* How */
        .lp-steps-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 28px; margin-top: 60px; position: relative; }
        .lp-steps-row::before { content: ''; position: absolute; top: 35px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg,var(--lp-accent),var(--lp-accent-light)); }
        .lp-how-step { position: relative; z-index: 1; opacity: 0; transform: translateY(24px); transition: opacity .5s ease, transform .5s ease; }
        .lp-how-step.visible { opacity: 1; transform: translateY(0); }
        .lp-how-step:nth-child(1){transition-delay:.0s;} .lp-how-step:nth-child(2){transition-delay:.15s;} .lp-how-step:nth-child(3){transition-delay:.3s;} .lp-how-step:nth-child(4){transition-delay:.45s;}
        .lp-step-icon { width: 70px; height: 70px; border-radius: 50%; background: var(--lp-white); border: 2px solid var(--lp-accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; box-shadow: 0 6px 20px rgba(46,196,160,.15); transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s; }
        .lp-how-step:hover .lp-step-icon { transform: translateY(-6px) scale(1.08); box-shadow: 0 14px 32px rgba(46,196,160,.28); }
        .lp-step-icon svg { width: 28px; height: 28px; color: var(--lp-accent); }
        .lp-how-step h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; margin-bottom: 6px; }
        .lp-how-step p { font-size: 13px; color: var(--lp-muted); line-height: 1.6; margin: 0; }
        /* Pricing */
        .lp-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 60px; }
        .lp-card { background: var(--lp-white); border: 2px solid var(--lp-border); border-radius: 26px; padding: 36px 28px; text-align: left; position: relative; transition: transform 0.2s, box-shadow 0.2s; }
        .lp-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); }
        .lp-card.mid { border-color: var(--lp-accent); background: linear-gradient(160deg,#fff 55%,var(--lp-accent-light)); }
        .lp-card.vip { border-color: var(--lp-gold); background: linear-gradient(160deg,#fff 55%,#fdf8ec); }
        .lp-feat-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700; padding: 4px 18px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
        .lp-feat-badge.green { background: var(--lp-accent); color: #fff; }
        .lp-feat-badge.gold { background: var(--lp-gold); color: #fff; }
        .lp-plan-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; margin-bottom: 4px; }
        .lp-plan-area { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--lp-muted); margin-bottom: 14px; }
        .lp-plan-price { font-family: 'Fraunces', serif; font-size: 50px; font-weight: 700; letter-spacing: -2px; line-height: 1; margin-bottom: 2px; }
        .lp-plan-price sup { font-size: 20px; vertical-align: top; margin-top: 10px; display: inline-block; }
        .lp-plan-period { font-size: 12px; color: var(--lp-muted); margin-bottom: 24px; }
        .lp-plan-desc { font-size: 13px; color: var(--lp-muted); margin-bottom: 20px; line-height: 1.5; padding-bottom: 20px; border-bottom: 1px solid var(--lp-border); }
        .lp-feats { list-style: none; margin-bottom: 24px; padding: 0; }
        .lp-feats li { font-size: 13px; color: var(--lp-muted); padding: 7px 0; border-bottom: 1px solid var(--lp-border); display: flex; align-items: flex-start; gap: 8px; }
        .lp-feats li:last-child { border-bottom: none; }
        .lp-feats li::before { content: '✓'; color: var(--lp-accent); font-weight: 700; flex-shrink: 0; }
        .lp-feats li.off::before { content: '✕'; color: #ccc; }
        .lp-feats li.off { opacity: .5; }
        .lp-feats li.gold-check::before { color: var(--lp-gold); }
        .lp-btn-price { display: block; text-align: center; padding: 13px; border-radius: 100px; font-weight: 700; font-size: 14px; text-decoration: none; transition: opacity 0.2s, transform 0.15s; }
        .lp-btn-price:hover { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn-outline-p { border: 2px solid var(--lp-border); color: var(--lp-text); }
        .lp-btn-green { background: var(--lp-accent); color: #fff; }
        .lp-btn-gold { background: var(--lp-gold); color: #fff; }
        /* Testimonials */
        .lp-testi { padding: 100px 56px; background: var(--lp-text); }
        .lp-testi-inner { max-width: 1100px; margin: 0 auto; }
        .lp-testi-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-top: 60px; }
        .lp-testi-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; padding: 28px; }
        .lp-testi-stars { color: var(--lp-gold); font-size: 14px; margin-bottom: 12px; }
        .lp-testi-text { font-size: 14px; color: rgba(255,255,255,.7); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
        .lp-testi-author { display: flex; align-items: center; gap: 12px; }
        .lp-testi-av { width: 40px; height: 40px; border-radius: 50%; background: var(--lp-accent); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .lp-testi-name { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .lp-testi-role { font-size: 11px; color: rgba(255,255,255,.4); }
        /* FAQ */
        .lp-faq { padding: 100px 56px; background: var(--lp-bg); }
        .lp-faq-inner { max-width: 780px; margin: 0 auto; text-align: center; }
        .lp-faq-list { margin-top: 56px; text-align: left; }
        /* Safety */
        .lp-safety { padding: 80px 56px; background: var(--lp-text); color: #fff; }
        .lp-safety-inner { max-width: 1100px; margin: 0 auto; }
        .lp-safety h2 { font-family: 'Fraunces', serif; font-size: clamp(24px,3vw,38px); font-weight: 700; letter-spacing: -1px; margin-bottom: 36px; }
        .lp-safety h2 em { color: var(--lp-accent); font-style: italic; }
        .lp-safety-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .lp-safety-item { display: flex; align-items: flex-start; gap: 14px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 18px; }
        .lp-safety-icon { width: 20px; height: 20px; flex-shrink: 0; color: var(--lp-accent); margin-top: 2px; }
        .lp-safety-item p { font-size: 13px; color: rgba(255,255,255,.6); line-height: 1.55; margin: 0; }
        .lp-safety-item strong { color: #fff; display: block; margin-bottom: 3px; font-size: 13px; }
        /* CTA */
        .lp-cta { padding: 110px 56px; background: var(--lp-accent); text-align: center; }
        .lp-cta h2 { font-family: 'Fraunces', serif; font-size: clamp(34px,5vw,64px); font-weight: 700; letter-spacing: -2px; color: #fff; margin-bottom: 18px; line-height: 1.1; }
        .lp-cta p { color: rgba(255,255,255,.8); font-size: 17px; margin-bottom: 44px; }
        .lp-btn-cta-white { background: #fff; color: var(--lp-accent-dark); padding: 17px 46px; border-radius: 100px; font-weight: 700; font-size: 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: transform 0.15s; }
        .lp-btn-cta-white:hover { transform: translateY(-2px); }
        .lp-cta-note { color: rgba(255,255,255,.55); font-size: 13px; margin-top: 18px; }
        /* Footer */
        .lp-footer { background: #0c1410; color: rgba(255,255,255,.45); }
        .lp-footer-top { max-width: 1100px; margin: 0 auto; padding: 60px 56px 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .lp-footer-logo { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px; display: block; text-decoration: none; }
        .lp-footer-logo span { color: var(--lp-accent); }
        .lp-footer-col h4 { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.7); margin-bottom: 16px; }
        .lp-footer-col a { display: block; font-size: 13px; color: rgba(255,255,255,.4); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .lp-footer-col a:hover { color: rgba(255,255,255,.8); }
        .lp-footer-bottom { border-top: 1px solid rgba(255,255,255,.07); padding: 24px 56px; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .lp-footer-bottom p { font-size: 12px; margin: 0; }
        .lp-footer-bottom-links { display: flex; gap: 20px; }
        .lp-footer-bottom-links a { font-size: 12px; color: rgba(255,255,255,.3); text-decoration: none; transition: color 0.2s; }
        .lp-footer-bottom-links a:hover { color: rgba(255,255,255,.7); }
        @media (max-width: 960px) {
          .lp-nav { padding: 16px 20px; } .lp-nav ul { display: none; }
          .lp-hero { grid-template-columns: 1fr; padding: 100px 24px 60px; } .lp-hero-right { display: none; }
          .lp-problem-inner, .lp-verification-inner { grid-template-columns: 1fr; gap: 40px; }
          .lp-steps-row { grid-template-columns: repeat(2,1fr); } .lp-steps-row::before { display: none; }
          .lp-cards { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
          .lp-safety-grid { grid-template-columns: repeat(2,1fr); } .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-problem, .lp-verification, .lp-filters, .lp-intentions, .lp-faq, .lp-safety, .lp-cta, .lp-testi { padding: 72px 24px; }
          .lp-footer-top { grid-template-columns: 1fr 1fr; padding: 48px 24px; gap: 32px; }
          .lp-footer-bottom { padding: 20px 24px; flex-direction: column; text-align: center; }
          .lp-filter-categories { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .lp-hero { padding: 90px 20px 48px; } .lp-hero h1 { font-size: 38px; }
          .lp-actions { flex-direction: column; } .lp-btn-main, .lp-btn-outline { width: 100%; justify-content: center; }
          .lp-steps-row { grid-template-columns: 1fr; } .lp-safety-grid { grid-template-columns: 1fr 1fr; }
          .lp-cards { grid-template-columns: 1fr; max-width: 100%; }
          .lp-footer-top { grid-template-columns: 1fr; }
          .lp-filter-categories { grid-template-columns: 1fr; }
          .lp-intentions-grid { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      <div className="lp">

        {/* ── Navbar ── */}
        <nav className="lp-nav">
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul>
            <li><a href="#verificacao">Verificação</a></li>
            <li><a href="#filtros">Filtros</a></li>
            <li><a href="#precos">Planos</a></li>
            <li><a href="#seguranca">Segurança</a></li>
            <li><a href="/cadastro" className="lp-nav-cta">Começar agora</a></li>
          </ul>
        </nav>

        {/* ── Hero ── */}
        <section>
          <div className="lp-hero">
            <div>
              <div className="lp-badge"><span className="lp-badge-dot"></span>Verificação real de identidade · Filtros que importam</div>
              <h1>Encontre alguém <em>de verdade.</em></h1>
              <p className="lp-hero-sub">O app de relacionamentos com <strong>verificação rigorosa</strong> e os filtros mais completos do Brasil.</p>
              <div className="lp-actions">
                <a href="/cadastro" className="lp-btn-main">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Começar agora
                </a>
                <a href="#como-funciona" className="lp-btn-outline">Como funciona →</a>
              </div>
              <div className="lp-stats">
                <div><div className="lp-stat-val">100%</div><div className="lp-stat-label">Perfis verificados</div></div>
                <div className="lp-stat-div"></div>
                <div><div className="lp-stat-val">100+</div><div className="lp-stat-label">Filtros disponíveis</div></div>
                <div className="lp-stat-div"></div>
                <div><div className="lp-stat-val">Anti-golpe</div><div className="lp-stat-label">Sistema ativo 24h</div></div>
              </div>
            </div>
            <div className="lp-hero-right">
              <div className="lp-fc lp-fc1">🖤 Gótica · Verificada</div>
              <div className="lp-fc lp-fc2">🎮 Gamer · São Paulo</div>
              <div className="lp-fc lp-fc3">✝️ Evangélica · MG</div>
              <div className="lp-phone">
                <div className="lp-phone-header">
                  <div className="lp-phone-logo">MeAndYou</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Conexões reais</div>
                </div>
                <div className="lp-phone-card">
                  <div className="lp-phone-img">👩<div className="lp-v-badge">✓ Verificada</div></div>
                  <div className="lp-phone-info">
                    <div className="lp-phone-name">Julia, 26</div>
                    <div className="lp-phone-tags">
                      <span className="lp-phone-tag">🎮 Gamer</span>
                      <span className="lp-phone-tag">🌿 Vegana</span>
                      <span className="lp-phone-tag">SP</span>
                    </div>
                  </div>
                </div>
                <div className="lp-phone-actions">
                  <button className="lp-ph-btn no">✕</button>
                  <button className="lp-ph-btn super">★</button>
                  <button className="lp-ph-btn yes">♥</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── O Problema ── */}
        <section className="lp-problem">
          <div className="lp-problem-inner">
            <div>
              <p className="lp-section-label" style={{ color: 'var(--lp-accent)' }}>O problema</p>
              <h2>Os apps antigos viraram um <em>caos.</em></h2>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '16px', lineHeight: 1.7 }}>Perfis falsos, vendedores de conteúdo e golpistas tomaram conta.</p>
            </div>
            <div className="lp-prob-list">
              {[
                { n: '01', t: 'Perfis falsos e bots', d: 'A maioria dos matches é com conta falsa ou alguém querendo vender conteúdo.' },
                { n: '02', t: 'Ninguém é quem diz ser', d: 'Foto antiga, idade errada, intenções escondidas.' },
                { n: '03', t: 'Filtros que não filtram nada', d: 'Idade e distância não resolvem. O que importa fica invisível.' },
                { n: '04', t: 'Golpes e abordagens indesejadas', d: 'Plataformas sem verificação viram terreno fértil para comportamento abusivo.' },
              ].map((item) => (
                <div key={item.n} className="lp-prob-item lp-anim">
                  <div className="lp-prob-num">{item.n}</div>
                  <div><h4>{item.t}</h4><p>{item.d}</p></div>
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
              <h2 className="lp-section-title">Só entra quem é <span style={{ color: 'var(--lp-accent-dark)' }}>real.</span></h2>
              <p style={{ color: 'var(--lp-muted)', fontSize: '16px', marginTop: '14px' }}>Desenvolvemos o processo de verificação mais rigoroso do mercado.</p>
            </div>
            <div className="lp-verify-steps">
              {[
                { n: '1', t: 'Selfie ao vivo', d: 'Sequência de movimentos detectada em tempo real. Impossível usar foto ou vídeo.' },
                { n: '2', t: 'Documento de identidade', d: 'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.' },
                { n: '3', t: 'Validação de CPF', d: 'Checagem automática. Apenas 1 conta por CPF — sem duplicatas.' },
                { n: '4', t: 'Monitoramento contínuo', d: 'Algoritmo anti-fraude ativo. Denúncias respondidas em até 24h.' },
              ].map((item) => (
                <div key={item.n} className="lp-verify-step lp-anim">
                  <div className="lp-vstep-num">{item.n}</div>
                  <div><h4>{item.t}</h4><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Filtros ── */}
        <section id="filtros" style={{ padding: '100px 56px', background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
          <div className="lp-filters" style={{ padding: 0, maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p className="lp-section-label">Filtros</p>
              <h2 className="lp-section-title">Você decide exatamente quem<br />quer, e quem <em style={{ fontStyle: 'italic', color: 'var(--lp-accent)' }}>não</em> quer.</h2>
              <p style={{ color: 'var(--lp-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 20px' }}>Mais de 100 filtros. Clique uma vez para <strong style={{ color: 'var(--lp-accent-dark)' }}>incluir</strong>, clique de novo para <strong style={{ color: 'var(--lp-red)' }}>excluir</strong>. Combine como quiser.</p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div className="lp-filter-note">
                Cada filtro tem dois modos: <strong>✓ Quero encontrar</strong> &nbsp;|&nbsp; <span className="exc-ex">✕ Não quero ver</span> — Clique para alternar.
              </div>
            </div>
            <div className="lp-filter-categories">
              {filterCats.map((cat, i) => (
                <div key={i} className="lp-filter-cat lp-anim">
                  <div className="lp-cat-header">
                    {cat.svg
                      ? <svg style={{ width: 26, height: 26, flexShrink: 0, color: 'var(--lp-accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h4m-4 4h6m-6 4h2"/><circle cx="17" cy="10" r="2"/></svg>
                      : <span className="lp-cat-emoji">{cat.emoji}</span>
                    }
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
              <h2 className="lp-section-title">Todo mundo sabe o que quer.<br />Agora você também filtra isso.</h2>
              <p style={{ color: 'var(--lp-muted)', fontSize: '16px', maxWidth: '520px', margin: '12px auto 0' }}>Chega de descobrir depois de semanas que vocês querem coisas completamente diferentes.</p>
            </div>
            <div className="lp-intentions-grid">
              {[
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, t: 'Relacionamento sério', d: 'Busca comprometimento e futuro juntos' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>, t: 'Encontros casuais', d: 'Sem compromisso, com respeito e clareza' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, t: 'Amizade', d: 'Expandir o círculo social de verdade' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>, t: 'Companhia para evento', d: 'Casamento, festa, jantar social' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, t: 'Sugar', d: 'Relacionamentos com benefícios mútuos' },
                { icon: <svg className="lp-intent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t: 'Romance', d: 'Conexão emocional profunda e gradual' },
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
        <section style={{ padding: '100px 56px', background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }} id="como-funciona">
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <p className="lp-section-label">Como funciona</p>
            <h2 className="lp-section-title">Em minutos você já tem matches reais.</h2>
            <p style={{ color: 'var(--lp-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>Simples e direto, com a segurança que outros apps nunca tiveram.</p>
            <div className="lp-steps-row">
              {[
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, t: 'Escolha seu plano', d: 'A partir de R$10/mês. Sem conta gratuita — isso afasta golpistas.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, t: 'Verifique sua identidade', d: 'Selfie ao vivo + documento. Menos de 3 minutos pelo celular.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, t: 'Configure seus filtros', d: 'Inclua e exclua como quiser. 100+ opções para ser preciso.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, t: 'Dê match e conecte', d: 'Só pessoas reais, com intenções compatíveis com as suas.' },
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

        {/* ── Planos ── */}
        <section style={{ padding: '100px 56px', background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }} id="precos">
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <p className="lp-section-label">Planos</p>
            <h2 className="lp-section-title">Sem conta gratuita.<br /><em style={{ fontStyle: 'italic', color: 'var(--lp-accent)' }}>Mais seriedade.</em></h2>
            <p style={{ color: 'var(--lp-muted)', fontSize: '16px', maxWidth: '560px', margin: '0 auto' }}>Um ambiente controlado para pessoas que sabem o que buscam. Quem paga veio para se conectar de verdade.</p>
            <div className="lp-cards">
              <div className="lp-card lp-anim">
                <p className="lp-plan-name">Essencial</p>
                <p className="lp-plan-area">Pista</p>
                <div className="lp-plan-price"><sup>R$</sup>10</div>
                <p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">O ponto de entrada. Para quem quer explorar a plataforma com segurança, já saindo na frente dos apps gratuitos cheios de perfis falsos.</p>
                <ul className="lp-feats">
                  <li>Verificação de identidade</li>
                  <li>5 curtidas por dia</li>
                  <li>1 filtro ativo por vez</li>
                  <li>Ver matches recebidos</li>
                  <li className="off">Filtros acumulados</li>
                  <li className="off">Filtro de exclusão</li>
                  <li className="off">Ver quem curtiu você</li>
                  <li className="off">Desfazer curtida</li>
                </ul>
                <a href="/cadastro?plano=essencial" className="lp-btn-price lp-btn-outline-p">Assinar Essencial</a>
              </div>

              <div className="lp-card mid lp-anim">
                <span className="lp-feat-badge green">Mais popular</span>
                <p className="lp-plan-name">Plus</p>
                <p className="lp-plan-area">Área VIP</p>
                <div className="lp-plan-price"><sup>R$</sup>39</div>
                <p className="lp-plan-period">por mês</p>
                <p className="lp-plan-desc">A experiência completa de filtragem. Para quem está realmente em busca de uma conexão e quer usar todos os recursos da plataforma.</p>
                <ul className="lp-feats">
                  <li>Verificação de identidade</li>
                  <li>30 curtidas por dia</li>
                  <li>Todos os filtros acumulados</li>
                  <li>Filtro de exclusão</li>
                  <li>Ver quem curtiu você</li>
                  <li>Desfazer curtida (1/dia)</li>
                  <li>Boost semanal de perfil</li>
                  <li>1 Lupa/dia no Destaque</li>
                  <li>2 tickets de roleta/dia</li>
                </ul>
                <a href="/cadastro?plano=plus" className="lp-btn-price lp-btn-green">Assinar Plus</a>
              </div>

              <div className="lp-card vip lp-anim">
                <span className="lp-feat-badge gold">⭐ Camarote</span>
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
                </ul>
                <a href="/cadastro?plano=black" className="lp-btn-price lp-btn-gold">Assinar Camarote Black</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gamificação ── */}
        <section style={{ padding: '100px 56px', background: 'var(--lp-accent-light)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <p className="lp-section-label">Muito mais do que curtidas</p>
            <h2 className="lp-section-title">Recompensas por estar aqui</h2>
            <p style={{ color: 'var(--lp-muted)', fontSize: '16px', maxWidth: '560px', margin: '0 auto 60px' }}>Todo dia tem prêmio. Quanto mais você usa, mais você ganha.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { emoji: '🎰', t: 'Roleta diária', d: 'Gire todo dia e ganhe SuperCurtidas, Lupas, Boosts e até 1 dia de plano superior. Cada plano dá mais tickets por dia.' },
                { emoji: '🔥', t: 'Streak de acesso', d: 'Entre todos os dias e desbloqueie recompensas crescentes no calendário mensal. Sequência de 30 dias = prêmios raros.' },
                { emoji: '💌', t: 'Indique e ganhe', d: 'Cada amigo que entrar pelo seu link te rende 1 SuperCurtida. Indicou 3? Ganhe 1 Boost. Quem entrou ganha 3 tickets de boas-vindas.' },
              ].map((item, i) => (
                <div key={i} className="lp-anim" style={{ background: 'var(--lp-white)', borderRadius: '24px', padding: '36px 28px', textAlign: 'left', border: '1px solid var(--lp-border)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>{item.emoji}</div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{item.t}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--lp-muted)', lineHeight: 1.7, margin: 0 }}>{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Depoimentos ── */}
        <section className="lp-testi">
          <div className="lp-testi-inner">
            <p className="lp-section-label" style={{ color: 'var(--lp-accent)' }}>Depoimentos</p>
            <h2 className="lp-section-title" style={{ color: '#fff' }}>Conexões que realmente aconteceram.</h2>
            <div className="lp-testi-grid">
              {[
                { av: '👩', name: 'Amanda C.', role: 'São Paulo · 28 anos · Plano Plus', text: 'Finalmente um app onde todo mundo é real. Coloquei filtro de evangélica não fumante e os matches vieram certeiros. Estou namorando há 3 meses.' },
                { av: '👨', name: 'Pedro H.', role: 'Curitiba · 31 anos · Camarote Black', text: 'Filtrei gótica, não fumante e que gosta de trilha. Parecia impossível. Em 3 dias tinha match perfeito. A verificação me deu confiança que nenhum outro app deu.' },
                { av: '🧑', name: 'Rafael M.', role: 'Belo Horizonte · 35 anos · Camarote Black', text: 'Os apps antigos viraram bagunça de golpe. Aqui foi conversa real do início. Assinei o Camarote e o nível das pessoas é completamente diferente.' },
                { av: '👩', name: 'Letícia R.', role: 'Porto Alegre · 26 anos · Plano Plus', text: 'Usei o filtro de exclusão para tirar quem gosta de apostas e quem bebe demais. Parece bobagem mas fez toda a diferença. Encontrei alguém com os mesmos valores.' },
              ].map((t, i) => (
                <div key={i} className="lp-testi-card lp-anim">
                  <div className="lp-testi-stars">★★★★★</div>
                  <p className="lp-testi-text">"{t.text}"</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">{t.av}</div>
                    <div><p className="lp-testi-name">{t.name}</p><p className="lp-testi-role">{t.role}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-faq">
          <div className="lp-faq-inner">
            <p className="lp-section-label">Dúvidas</p>
            <h2 className="lp-section-title">Perguntas frequentes</h2>
            <div className="lp-faq-list">
              {faqItems.map((item, i) => <FaqItem key={i} pergunta={item.q} resposta={item.a} />)}
            </div>
          </div>
        </section>

        {/* ── Segurança ── */}
        <section className="lp-safety" id="seguranca">
          <div className="lp-safety-inner">
            <p className="lp-section-label" style={{ color: 'var(--lp-accent)' }}>Segurança</p>
            <h2>Dicas para se <em>proteger</em> em encontros.</h2>
            <div className="lp-safety-grid">
              {[
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, t: 'Marque em local público', d: 'Primeiro encontro sempre em café, restaurante ou shopping. Nunca na casa de ninguém.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, t: 'Avise alguém de confiança', d: 'Conte para um amigo ou familiar onde vai, com quem e a que horas.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, t: 'Mantenha o celular carregado', d: 'Vá com bateria cheia e tenha um plano caso precise sair rapidamente.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, t: 'Nunca transfira dinheiro', d: 'Se alguém pedir PIX, cartão ou qualquer valor antes do encontro: denuncie imediatamente.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, t: 'Não compartilhe dados pessoais', d: 'Endereço, local de trabalho e dados bancários nunca antes de estabelecer confiança.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t: 'Denúncia com 1 toque', d: 'Qualquer perfil pode ser denunciado diretamente pelo app. Moderação em até 24h.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, t: 'Banimento permanente por CPF', d: 'Quem é banido não volta. Bloqueio vinculado ao CPF, não ao email.' },
                { svg: <svg className="lp-safety-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, t: 'Em caso de perigo', d: 'Use o botão de emergência no app ou ligue imediatamente para o 190.' },
              ].map((item, i) => (
                <div key={i} className="lp-safety-item lp-anim">
                  {item.svg}
                  <div><strong>{item.t}</strong><p>{item.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="lp-cta">
          <h2>Sua pessoa real<br />está esperando.</h2>
          <p>Verificação real. Filtros completos. Conexões de verdade.</p>
          <a href="/cadastro" className="lp-btn-cta-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Escolher meu plano
          </a>
          <p className="lp-cta-note">Cancele quando quiser · Sem fidelidade</p>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <a href="/" className="lp-footer-logo">MeAnd<span>You</span></a>
              <p style={{ fontSize: '13px', lineHeight: 1.7 }}>O app de relacionamentos com verificação real de identidade e os filtros mais completos do Brasil.</p>
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
              <a href="/cadastro">Criar conta</a>
              <a href="/login">Entrar</a>
              <a href="/suporte">Suporte</a>
              <a href="/ajuda">Central de ajuda</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© {new Date().getFullYear()} MeAndYou · Todos os direitos reservados · CNPJ em registro</p>
            <div className="lp-footer-bottom-links">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
