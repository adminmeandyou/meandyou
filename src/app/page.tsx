'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

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
          fontFamily: "'Inter', sans-serif", textAlign: 'left', padding: 0,
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
          const el = e.target as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.07 })

    document.querySelectorAll('.lp-anim').forEach(el => {
      const e = el as HTMLElement
      if (prefersReduced) { e.style.opacity = '1'; return }
      e.style.opacity = '0'
      e.style.transform = 'translateY(20px)'
      e.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      observer.observe(e)
    })

    const howObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.lp-how-step').forEach((s: any) => s.classList.add('visible'))
        }
      })
    }, { threshold: 0.15 })
    const stepsRow = document.querySelector('.lp-steps-row')
    if (stepsRow) howObserver.observe(stepsRow)

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090E' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: '#F8F9FA' }}>
          MeAnd<span style={{ color: '#E11D48' }}>You</span>
        </h1>
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
    { emoji: '👁️', title: 'Cor dos olhos', desc: 'Todas as variações existentes, incluindo casos raros.', tags: ['Olhos pretos', 'Olhos castanhos', 'Olhos verdes', 'Olhos azuis', 'Olhos mel', 'Olhos acinzentados', 'Heterocromia'] },
    { emoji: '💇', title: 'Cor do cabelo', desc: 'Cor natural ou tingida dos cabelos.', tags: ['Cabelo preto', 'Cabelo castanho', 'Cabelo loiro', 'Cabelo ruivo', 'Cabelo colorido', 'Cabelo grisalho', 'Não possuo cabelo (careca)'] },
    { emoji: '〰️', title: 'Tipo e comprimento do cabelo', desc: 'Textura e tamanho dos fios.', tags: ['Cabelo curto', 'Cabelo médio', 'Cabelo longo', 'Cabelo liso', 'Cabelo ondulado', 'Cabelo cacheado', 'Cabelo crespo'] },
    { emoji: '🎨', title: 'Cor de pele e etnia', desc: 'Inclusão total. Todas as tonalidades e origens étnicas.', tags: ['Branca', 'Parda', 'Negra', 'Asiática', 'Indígena', 'Latina', 'Mediterrânea', 'Possuo vitiligo'] },
    { emoji: '📏', title: 'Tipo corporal', desc: 'Biotipo com base em peso e altura.', tags: ['Abaixo do peso', 'Peso saudável', 'Acima do peso', 'Obesidade leve', 'Obesidade severa'] },
    { emoji: '✨', title: 'Características físicas', desc: 'Detalhes que fazem diferença na atração.', tags: ['Possuo sardas', 'Possuo tatuagem', 'Possuo piercing', 'Possuo cicatriz', 'Uso óculos', 'Uso aparelho dentário', 'Possuo barba'] },
    { emoji: '♿', title: 'Pessoa com deficiência (PCD)', desc: 'Inclusão total. Selecione para encontrar ou ser encontrado.', tags: ['Deficiência visual', 'Deficiência auditiva', 'Deficiência motora', 'Deficiência intelectual', 'Autismo (TEA)', 'TDAH', 'Sou cadeirante', 'Nanismo', 'Outra'] },
    { emoji: '🏳️‍🌈', title: 'Orientação sexual', desc: 'Todo mundo tem seu espaço aqui, sem julgamento.', tags: ['Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual', 'Assexual', 'Demissexual', 'Queer'] },
    { svgId: true, title: 'Identidade de gênero', desc: 'Como a pessoa se identifica e como prefere ser chamada.', tags: ['Homem', 'Mulher', 'Homem trans', 'Mulher trans', 'Não-binário(a)', 'Gênero fluido'] },
    { emoji: '💍', title: 'Status civil', desc: 'Situação atual no campo amoroso.', tags: ['Solteiro(a)', 'Enrolado(a)', 'Casado(a)', 'Divorciando', 'Divorciado(a)', 'Viúvo(a)', 'Relacionamento aberto'] },
    { emoji: '🙏', title: 'Religião e espiritualidade', desc: 'Fé e espiritualidade como parte da compatibilidade.', tags: ['Evangélico(a)', 'Católico(a)', 'Espírita', 'Umbandista', 'Candomblé', 'Budista', 'Judaico(a)', 'Islâmico(a)', 'Hindu', 'Agnóstico(a)', 'Ateu / Ateia', 'Espiritualizado(a) sem religião'] },
    { emoji: '🚬', title: 'Vícios e substâncias', desc: 'Hábitos que impactam diretamente a convivência.', tags: ['Fumo', 'Fumo ocasionalmente', 'Não fumo', 'Consumo bebida alcoólica', 'Bebo socialmente', 'Não consumo bebida alcoólica', 'Consumo cannabis', 'Não possuo vícios'] },
    { emoji: '🏋️', title: 'Estilo de vida e rotina', desc: 'Como a pessoa organiza o dia a dia e o tempo livre.', tags: ['Pratico academia', 'Pratico esporte regularmente', 'Sou sedentário(a)', 'Sou caseiro(a)', 'Gosto de sair', 'Gosto de balada', 'Sou noturno(a)', 'Sou matutino(a)', 'Sou workaholic', 'Tenho vida equilibrada'] },
    { emoji: '🧠', title: 'Personalidade', desc: 'Introvertido(a), extrovertido(a) e tudo entre os dois extremos.', tags: ['Sou extrovertido(a)', 'Sou introvertido(a)', 'Sou ambiverte', 'Sou tímido(a)', 'Sou comunicativo(a)', 'Sou antissocial', 'Sou reservado(a)', 'Sou agitado(a)', 'Sou calmo(a)', 'Sou intenso(a)'] },
    { emoji: '🎮', title: 'Hobbies e entretenimento', desc: 'O que a pessoa faz no tempo livre.', tags: ['Sou gamer', 'Adoro ler', 'Viciado(a) em filmes', 'Viciado(a) em séries', 'Curto anime / mangá', 'Curto música ao vivo', 'Faço fotografia', 'Arte e desenho', 'Danço', 'Faço teatro', 'Meditação / Yoga', 'Adoro viajar', 'Curto trilha e natureza'] },
    { emoji: '🥗', title: 'Alimentação', desc: 'Compatibilidade alimentar importa mais do que parece.', tags: ['Sou vegano(a)', 'Sou vegetariano(a)', 'Sou carnívoro(a)', 'Como de tudo', 'Prefiro alimentação saudável', 'Cozinho bem', 'Não cozinho', 'Curto comida japonesa', 'Curto fast food'] },
    { emoji: '👗', title: 'Estilo de se vestir', desc: 'A forma de se vestir diz muito sobre quem a pessoa é.', tags: ['Social', 'Casual', 'Esportivo', 'Alternativo', 'Eclético', 'Gótico', 'Punk', 'E-girl / E-boy', 'K-pop'] },
    { emoji: '🎵', title: 'Gosto musical', desc: 'Afinidade musical no dia a dia.', tags: ['Funk', 'Sertanejo', 'Pagode', 'Rock', 'Metal', 'Pop', 'Eletrônica', 'Hip-hop / Rap', 'MPB / Bossa Nova', 'Gospel', 'K-pop', 'Clássica', 'Eclético — curto de tudo'] },
    { emoji: '👶', title: 'Filhos e família', desc: 'Um dos pontos mais decisivos em qualquer relacionamento sério.', tags: ['Tenho filhos', 'Não tenho filhos', 'Quero ter filhos', 'Não quero ter filhos', 'Aberto(a) à adoção', 'Ainda não decidi'] },
    { emoji: '🐶', title: 'Animais de estimação', desc: 'Pet lover ou prefere não ter bicho em casa.', tags: ['Tenho cachorro', 'Tenho gato', 'Tenho outros pets', 'Adoro animais', 'Não tenho pets', 'Tenho alergia a animais', 'Não gosto de animais'] },
    { emoji: '🎓', title: 'Escolaridade', desc: 'Nível de estudo e formação acadêmica.', tags: ['Ensino fundamental', 'Ensino médio completo', 'Ensino superior incompleto', 'Ensino superior completo', 'Pós-graduado(a)', 'Mestrado', 'Doutorado'] },
    { emoji: '💼', title: 'Situação profissional', desc: 'Carreira, autonomia financeira e estilo de trabalho.', tags: ['CLT', 'Empreendedor(a)', 'Freelancer', 'Profissional liberal', 'Servidor(a) público(a)', 'Autônomo(a)', 'Trabalho remoto', 'Estou desempregado(a)'] },
    { emoji: '🎯', title: 'O que busca na plataforma', desc: 'Seja claro sobre suas intenções. Isso evita perda de tempo dos dois lados.', tags: ['Relacionamento sério', 'Relacionamento casual', 'Amizade', 'Companhia para eventos', 'Relação conjugal', 'Aberto(a) a experiências', 'Sugar Baby', 'Sugar Daddy / Mommy', 'Ainda estou definindo'], tip: 'Perfis de categorias sensíveis ficam visíveis apenas para quem também selecionou a mesma intenção.' },
    { emoji: '🔒', title: 'Perfil discreto (exclusivo Black)', desc: 'Visível apenas para outros membros que também marcaram a mesma categoria.', tags: ['Busco trisal', 'Swing / relacionamento aberto', 'Poliamor', 'BDSM / fetiches'], tip: 'Estas opções ficam ocultas para quem não marcou a mesma categoria. Disponível apenas no plano Black.' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap');

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
          --shadow-card: 0 8px 32px rgba(0,0,0,0.4);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

        .lp { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; overflow-x: hidden; }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 200; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 28px; width: calc(100% - 48px); max-width: 1140px;
          background: rgba(8,9,14,0.85); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 16px;
        }
        .lp-logo { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 22px; color: var(--text); letter-spacing: -0.5px; text-decoration: none; }
        .lp-logo span { color: var(--accent); }
        .lp-nav-links { display: flex; gap: 4px; list-style: none; }
        .lp-nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
        .lp-nav-links a:hover { color: var(--text); background: var(--border-soft); }
        .lp-nav-cta { background: var(--accent) !important; color: #fff !important; padding: 10px 22px !important; border-radius: 10px !important; font-weight: 600 !important; }
        .lp-nav-cta:hover { background: #be1239 !important; }

        /* ── HERO ── */
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .lp-hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; padding: 140px 56px 100px; max-width: 1200px; margin: 0 auto; }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: #FB7185; padding: 7px 18px; border-radius: 100px;
          font-size: 13px; font-weight: 600; margin-bottom: 28px;
          animation: lp-fadeUp .5s ease both;
        }
        .lp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: lp-pulse 2s ease-in-out infinite; }
        .lp-hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(44px, 5vw, 74px); font-weight: 700; line-height: 1.06; letter-spacing: -2px; margin-bottom: 24px; animation: lp-fadeUp .5s .1s ease both; }
        .lp-hero h1 em { font-style: italic; color: var(--accent); }
        .lp-hero-sub { font-size: 17px; color: var(--text-muted); max-width: 460px; margin-bottom: 40px; line-height: 1.75; animation: lp-fadeUp .5s .2s ease both; }
        .lp-hero-sub strong { color: var(--text); font-weight: 600; }
        .lp-actions { display: flex; gap: 12px; flex-wrap: wrap; animation: lp-fadeUp .5s .3s ease both; }
        .lp-btn-main {
          background: var(--accent); color: #fff; padding: 15px 34px; border-radius: 12px;
          font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex;
          align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(225,29,72,.35);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s; cursor: pointer;
        }
        .lp-btn-main:hover { background: #be1239; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(225,29,72,.45); }
        .lp-btn-outline {
          background: transparent; color: var(--text); padding: 15px 30px; border-radius: 12px;
          font-weight: 600; font-size: 15px; text-decoration: none; border: 1px solid var(--border);
          display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s, background 0.2s; cursor: pointer;
        }
        .lp-btn-outline:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
        .lp-stats { display: flex; gap: 32px; margin-top: 48px; animation: lp-fadeUp .5s .4s ease both; }
        .lp-stat-val { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1; color: var(--text); }
        .lp-stat-label { font-size: 12px; color: var(--text-dim); margin-top: 4px; }
        .lp-stat-div { width: 1px; background: var(--border); }

        /* Phone mockup */
        .lp-hero-right { position: relative; height: 580px; display: flex; align-items: center; justify-content: center; }
        .lp-phone {
          width: 265px; height: 530px; background: var(--bg-card);
          border-radius: 38px; border: 1px solid var(--border);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
          overflow: hidden; animation: lp-float 5s ease-in-out infinite;
        }
        .lp-phone-header { background: var(--accent); padding: 40px 20px 16px; text-align: center; }
        .lp-phone-logo { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; }
        .lp-phone-card { margin: 12px; background: var(--bg-card2); border-radius: 18px; overflow: hidden; border: 1px solid var(--border); }
        .lp-phone-img { height: 196px; background: linear-gradient(135deg, #1a0a14, #2d0f22, #3d1530); display: flex; align-items: center; justify-content: center; font-size: 64px; position: relative; }
        .lp-v-badge { position: absolute; top: 10px; right: 10px; background: var(--accent); color: #fff; border-radius: 100px; padding: 4px 10px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .lp-phone-info { padding: 12px 14px 10px; }
        .lp-phone-name { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text); }
        .lp-phone-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
        .lp-phone-tag { background: var(--accent-soft); color: #FB7185; border-radius: 100px; padding: 3px 9px; font-size: 10px; font-weight: 600; }
        .lp-phone-actions { display: flex; justify-content: center; gap: 14px; padding: 10px 16px 14px; }
        .lp-ph-btn { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: transform 0.15s; }
        .lp-ph-btn:hover { transform: scale(1.1); }
        .lp-ph-btn.no { background: rgba(244,63,94,0.12); color: #F43F5E; border: 1px solid rgba(244,63,94,0.25); }
        .lp-ph-btn.super { background: rgba(245,158,11,0.12); color: var(--gold); border: 1px solid rgba(245,158,11,0.25); }
        .lp-ph-btn.yes { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
        .lp-fc {
          position: absolute; background: var(--bg-card);
          border: 1px solid var(--border); border-radius: 100px;
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          box-shadow: var(--shadow-card); white-space: nowrap; color: var(--text); z-index: 10;
        }
        .lp-fc1 { top: 48px; left: -10px; }
        .lp-fc2 { top: 260px; right: -20px; }
        .lp-fc3 { bottom: 80px; left: 0px; }
        .lp-fc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; margin-right: 4px; }

        /* ── Sections ── */
        .lp-section-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .lp-section-title { font-family: 'Playfair Display', serif; font-size: clamp(30px, 4vw, 52px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }

        /* ── PROBLEM ── */
        .lp-problem { padding: 100px 56px; background: var(--bg-card); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lp-problem-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-problem h2 { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 46px); font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px; }
        .lp-problem h2 em { color: var(--accent); font-style: italic; }
        .lp-prob-list { display: flex; flex-direction: column; gap: 12px; }
        .lp-prob-item { display: flex; align-items: flex-start; gap: 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px 22px; transition: border-color 0.2s, transform 0.2s; cursor: default; }
        .lp-prob-item:hover { border-color: rgba(225,29,72,0.2); transform: translateX(4px); }
        .lp-prob-num { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-soft); border: 1px solid var(--accent-border); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; font-family: 'Playfair Display', serif; }
        .lp-prob-item h4 { font-size: 14px; font-weight: 600; margin-bottom: 3px; color: var(--text); }
        .lp-prob-item p { font-size: 13px; color: var(--text-muted); line-height: 1.55; margin: 0; }

        /* ── VERIFICATION ── */
        .lp-verification { padding: 100px 56px; background: var(--bg); }
        .lp-verification-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-verify-steps { display: flex; flex-direction: column; gap: 14px; }
        .lp-verify-step { display: flex; align-items: flex-start; gap: 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 22px 24px; transition: border-color 0.2s, box-shadow 0.2s; }
        .lp-verify-step:hover { border-color: var(--accent-border); box-shadow: 0 4px 24px rgba(225,29,72,0.08); }
        .lp-vstep-num { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; flex-shrink: 0; }
        .lp-verify-step h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
        .lp-verify-step p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        /* ── FILTERS ── */
        .lp-filters-section { padding: 100px 56px; background: var(--bg-card); border-top: 1px solid var(--border); }
        .lp-filters-inner { max-width: 1200px; margin: 0 auto; }
        .lp-filter-note { display: inline-flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 22px; }
        .lp-filter-categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .lp-filter-cat { background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 26px; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
        .lp-filter-cat::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent); transform: scaleX(0); transition: transform 0.3s; transform-origin: left; }
        .lp-filter-cat:hover { border-color: var(--accent-border); transform: translateY(-3px); box-shadow: 0 8px 32px rgba(225,29,72,0.08); }
        .lp-filter-cat:hover::after { transform: scaleX(1); }
        .lp-cat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .lp-cat-emoji { font-size: 22px; }
        .lp-filter-cat h3 { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text); }
        .lp-filter-cat > p { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.55; }
        .lp-tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-ftag { border-radius: 100px; padding: 4px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; user-select: none; }
        .lp-ftag.inc { background: var(--accent-soft); color: #FB7185; border-color: var(--accent-border); }
        .lp-ftag.exc { background: rgba(244,63,94,0.08); color: #F43F5E; border-color: rgba(244,63,94,0.25); }
        .lp-ftag.neu { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: var(--border); }
        .lp-ftag:hover { transform: scale(1.05); }
        .lp-filter-tip { font-size: 11px; color: var(--text-dim); margin-top: 12px; font-style: italic; }

        /* ── INTENTIONS ── */
        .lp-intentions { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border); }
        .lp-intentions-inner { max-width: 1100px; margin: 0 auto; }
        .lp-intentions-header { text-align: center; margin-bottom: 56px; }
        .lp-intentions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 14px; }
        .lp-intent-card { border: 1px solid var(--border); border-radius: 20px; padding: 28px 18px; text-align: center; background: var(--bg-card); transition: all 0.25s cubic-bezier(.34,1.56,.64,1); cursor: default; }
        .lp-intent-card:hover { border-color: var(--accent-border); background: rgba(225,29,72,0.06); transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(225,29,72,0.12); }
        .lp-intent-icon { width: 46px; height: 46px; margin: 0 auto 14px; color: var(--accent); transition: transform 0.3s; }
        .lp-intent-card:hover .lp-intent-icon { transform: scale(1.15) rotate(-5deg); }
        .lp-intent-card h3 { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; margin-bottom: 5px; color: var(--text); }
        .lp-intent-card p { font-size: 11px; color: var(--text-muted); line-height: 1.55; }

        /* ── HOW IT WORKS ── */
        .lp-how { padding: 100px 56px; background: var(--bg-card); border-top: 1px solid var(--border); }
        .lp-how-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-steps-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; margin-top: 60px; position: relative; }
        .lp-steps-row::before { content: ''; position: absolute; top: 34px; left: 12%; right: 12%; height: 1px; background: linear-gradient(90deg, var(--accent), rgba(225,29,72,0.2)); }
        .lp-how-step { position: relative; z-index: 1; opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; text-align: center; }
        .lp-how-step.visible { opacity: 1; transform: translateY(0); }
        .lp-how-step:nth-child(1) { transition-delay: 0s; } .lp-how-step:nth-child(2) { transition-delay: .15s; } .lp-how-step:nth-child(3) { transition-delay: .3s; } .lp-how-step:nth-child(4) { transition-delay: .45s; }
        .lp-step-icon { width: 68px; height: 68px; border-radius: 50%; background: var(--bg); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; box-shadow: 0 4px 20px rgba(225,29,72,0.12); transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s; }
        .lp-how-step:hover .lp-step-icon { transform: translateY(-6px) scale(1.08); box-shadow: 0 14px 32px rgba(225,29,72,0.25); }
        .lp-step-icon svg { width: 26px; height: 26px; color: var(--accent); }
        .lp-how-step h3 { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; margin-bottom: 6px; color: var(--text); }
        .lp-how-step p { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

        /* ── PRICING ── */
        .lp-pricing { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border); }
        .lp-pricing-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .lp-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; padding: 36px 28px; text-align: left; position: relative; transition: transform 0.2s, box-shadow 0.2s; }
        .lp-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }
        .lp-card.mid { border-color: var(--accent-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(225,29,72,0.06)); }
        .lp-card.vip { border-color: var(--gold-border); background: linear-gradient(160deg, var(--bg-card) 60%, rgba(245,158,11,0.06)); }
        .lp-feat-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700; padding: 5px 18px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
        .lp-feat-badge.rose { background: var(--accent); color: #fff; }
        .lp-feat-badge.gold { background: var(--gold); color: #fff; }
        .lp-plan-name { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
        .lp-plan-area { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 16px; }
        .lp-plan-price { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; letter-spacing: -2px; line-height: 1; margin-bottom: 2px; color: var(--text); }
        .lp-plan-price sup { font-size: 20px; vertical-align: top; margin-top: 10px; display: inline-block; }
        .lp-plan-period { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
        .lp-plan-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .lp-feats { list-style: none; margin-bottom: 28px; padding: 0; }
        .lp-feats li { font-size: 13px; color: var(--text-muted); padding: 7px 0; border-bottom: 1px solid var(--border-soft); display: flex; align-items: flex-start; gap: 8px; }
        .lp-feats li:last-child { border-bottom: none; }
        .lp-feats li::before { content: ''; display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: rgba(225,29,72,0.12); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23E11D48' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; flex-shrink: 0; margin-top: 1px; }
        .lp-feats li.off { opacity: .4; }
        .lp-feats li.off::before { background-color: rgba(255,255,255,0.06); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3' stroke-linecap='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E"); }
        .lp-feats li.gold-check::before { background-color: rgba(245,158,11,0.12); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); }
        .lp-btn-price { display: block; text-align: center; padding: 13px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; transition: opacity 0.2s, transform 0.15s; cursor: pointer; }
        .lp-btn-price:hover { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn-outline-p { border: 1px solid var(--border); color: var(--text); }
        .lp-btn-outline-p:hover { border-color: rgba(255,255,255,0.2); }
        .lp-btn-rose { background: var(--accent); color: #fff; }
        .lp-btn-gold { background: var(--gold); color: #fff; }

        /* ── GAMIFICATION ── */
        .lp-gamif { padding: 100px 56px; background: var(--bg-card); border-top: 1px solid var(--border); }
        .lp-gamif-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .lp-gamif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .lp-gamif-card { background: var(--bg); border: 1px solid var(--border); border-radius: 24px; padding: 36px 28px; text-align: left; transition: border-color 0.2s, transform 0.2s; }
        .lp-gamif-card:hover { border-color: var(--accent-border); transform: translateY(-4px); }
        .lp-gamif-icon { width: 52px; height: 52px; border-radius: 14px; background: var(--accent-soft); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: var(--accent); }
        .lp-gamif-card h3 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .lp-gamif-card p { font-size: 14px; color: var(--text-muted); line-height: 1.7; margin: 0; }

        /* ── TESTIMONIALS ── */
        .lp-testi { padding: 100px 56px; background: var(--bg); border-top: 1px solid var(--border); }
        .lp-testi-inner { max-width: 1100px; margin: 0 auto; }
        .lp-testi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; }
        .lp-testi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 30px; transition: border-color 0.2s; }
        .lp-testi-card:hover { border-color: rgba(255,255,255,0.12); }
        .lp-testi-stars { color: var(--gold); font-size: 13px; margin-bottom: 14px; letter-spacing: 2px; }
        .lp-testi-text { font-size: 14px; color: var(--text-muted); line-height: 1.75; margin-bottom: 20px; font-style: italic; }
        .lp-testi-author { display: flex; align-items: center; gap: 12px; }
        .lp-testi-av { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-testi-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
        .lp-testi-role { font-size: 11px; color: var(--text-dim); }

        /* ── FAQ ── */
        .lp-faq { padding: 100px 56px; background: var(--bg-card); border-top: 1px solid var(--border); }
        .lp-faq-inner { max-width: 760px; margin: 0 auto; text-align: center; }
        .lp-faq-list { margin-top: 56px; text-align: left; }

        /* ── SAFETY ── */
        .lp-safety { padding: 90px 56px; background: var(--bg); border-top: 1px solid var(--border); }
        .lp-safety-inner { max-width: 1100px; margin: 0 auto; }
        .lp-safety h2 { font-family: 'Playfair Display', serif; font-size: clamp(24px, 3vw, 40px); font-weight: 700; letter-spacing: -1px; margin-bottom: 40px; color: var(--text); }
        .lp-safety h2 em { color: var(--accent); font-style: italic; }
        .lp-safety-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .lp-safety-item { display: flex; align-items: flex-start; gap: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: border-color 0.2s; }
        .lp-safety-item:hover { border-color: var(--accent-border); }
        .lp-safety-icon { width: 20px; height: 20px; flex-shrink: 0; color: var(--accent); margin-top: 2px; }
        .lp-safety-item strong { color: var(--text); display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600; }
        .lp-safety-item p { font-size: 12px; color: var(--text-muted); line-height: 1.55; margin: 0; }

        /* ── CTA ── */
        .lp-cta { padding: 110px 56px; background: var(--accent); text-align: center; position: relative; overflow: hidden; }
        .lp-cta::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%); }
        .lp-cta h2 { font-family: 'Playfair Display', serif; font-size: clamp(36px, 5vw, 66px); font-weight: 700; letter-spacing: -2px; color: #fff; margin-bottom: 18px; line-height: 1.08; position: relative; }
        .lp-cta p { color: rgba(255,255,255,.75); font-size: 17px; margin-bottom: 44px; position: relative; }
        .lp-btn-cta-white { background: #fff; color: #be1239; padding: 17px 46px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: transform 0.15s, box-shadow 0.2s; cursor: pointer; position: relative; }
        .lp-btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .lp-cta-note { color: rgba(255,255,255,.45); font-size: 13px; margin-top: 20px; position: relative; }

        /* ── FOOTER ── */
        .lp-footer { background: #020306; color: var(--text-dim); border-top: 1px solid var(--border); }
        .lp-footer-top { max-width: 1100px; margin: 0 auto; padding: 60px 56px 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .lp-footer-logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 12px; display: block; text-decoration: none; }
        .lp-footer-logo span { color: var(--accent); }
        .lp-footer-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(248,249,250,0.5); margin-bottom: 16px; }
        .lp-footer-col a { display: block; font-size: 13px; color: var(--text-dim); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .lp-footer-col a:hover { color: rgba(248,249,250,0.7); }
        .lp-footer-bottom { border-top: 1px solid var(--border); padding: 24px 56px; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .lp-footer-bottom p { font-size: 12px; }
        .lp-footer-btm-links { display: flex; gap: 20px; }
        .lp-footer-btm-links a { font-size: 12px; color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
        .lp-footer-btm-links a:hover { color: rgba(248,249,250,0.6); }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .lp-nav { width: calc(100% - 32px); top: 12px; padding: 12px 20px; }
          .lp-nav-links { display: none; }
          .lp-hero { grid-template-columns: 1fr; padding: 110px 24px 60px; }
          .lp-hero-right { display: none; }
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
      `}</style>

      <div className="lp">

        {/* ── Navbar ── */}
        <nav className="lp-nav">
          <a href="/" className="lp-logo">MeAnd<span>You</span></a>
          <ul className="lp-nav-links">
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
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                Verificação real · Filtros que funcionam
              </div>
              <h1>Encontre alguém<br /><em>de verdade.</em></h1>
              <p className="lp-hero-sub">
                O app de relacionamentos com <strong>verificação rigorosa de identidade</strong> e os filtros mais completos do Brasil.
              </p>
              <div className="lp-actions">
                <a href="/cadastro" className="lp-btn-main">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  Começar agora
                </a>
                <a href="#como-funciona" className="lp-btn-outline">
                  Como funciona
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              </div>
              <div className="lp-stats">
                <div><div className="lp-stat-val">100%</div><div className="lp-stat-label">Perfis verificados</div></div>
                <div className="lp-stat-div" />
                <div><div className="lp-stat-val">100+</div><div className="lp-stat-label">Filtros disponíveis</div></div>
                <div className="lp-stat-div" />
                <div><div className="lp-stat-val">Anti-golpe</div><div className="lp-stat-label">Sistema ativo 24h</div></div>
              </div>
            </div>

            <div className="lp-hero-right">
              <div className="lp-fc lp-fc1"><span className="lp-fc-dot" />Gótica · Verificada</div>
              <div className="lp-fc lp-fc2"><span className="lp-fc-dot" />Gamer · São Paulo</div>
              <div className="lp-fc lp-fc3"><span className="lp-fc-dot" />Evangélica · MG</div>
              <div className="lp-phone">
                <div className="lp-phone-header">
                  <div className="lp-phone-logo">MeAndYou</div>
                  <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '3px', color: '#fff' }}>Conexões reais</div>
                </div>
                <div className="lp-phone-card">
                  <div className="lp-phone-img">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(225,29,72,0.4)" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <div className="lp-v-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      Verificada
                    </div>
                  </div>
                  <div className="lp-phone-info">
                    <div className="lp-phone-name">Julia, 26</div>
                    <div className="lp-phone-tags">
                      <span className="lp-phone-tag">Gamer</span>
                      <span className="lp-phone-tag">Vegana</span>
                      <span className="lp-phone-tag">SP</span>
                    </div>
                  </div>
                </div>
                <div className="lp-phone-actions">
                  <button className="lp-ph-btn no">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                  <button className="lp-ph-btn super">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  </button>
                  <button className="lp-ph-btn yes">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── O Problema ── */}
        <section className="lp-problem">
          <div className="lp-problem-inner">
            <div>
              <p className="lp-section-label">O problema</p>
              <h2>Os apps antigos<br />viraram um <em>caos.</em></h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.75, marginTop: '14px' }}>
                Perfis falsos, vendedores de conteúdo e golpistas tomaram conta.
              </p>
            </div>
            <div className="lp-prob-list">
              {[
                { n: '01', t: 'Perfis falsos e bots', d: 'A maioria dos matches é com conta falsa ou alguém querendo vender conteúdo.' },
                { n: '02', t: 'Ninguém é quem diz ser', d: 'Foto antiga, idade errada, intenções escondidas.' },
                { n: '03', t: 'Filtros que não filtram nada', d: 'Idade e distância não resolvem. O que importa fica invisível.' },
                { n: '04', t: 'Golpes e abordagens indesejadas', d: 'Plataformas sem verificação viram terreno fértil para comportamento abusivo.' },
              ].map(item => (
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
              <h2 className="lp-section-title">Só entra<br />quem é <span style={{ color: 'var(--accent)' }}>real.</span></h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '14px', lineHeight: 1.7 }}>
                Desenvolvemos o processo de verificação mais rigoroso do mercado.
              </p>
            </div>
            <div className="lp-verify-steps">
              {[
                { n: '1', t: 'Selfie ao vivo', d: 'Sequência de movimentos detectada em tempo real. Impossível usar foto ou vídeo.' },
                { n: '2', t: 'Documento de identidade', d: 'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.' },
                { n: '3', t: 'Validação de CPF', d: 'Checagem automática. Apenas 1 conta por CPF — sem duplicatas.' },
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
                Mais de 100 filtros. Clique uma vez para <strong style={{ color: '#FB7185' }}>incluir</strong>, clique de novo para <strong style={{ color: 'var(--red)' }}>excluir</strong>.
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
                    {cat.svgId
                      ? <svg style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h4m-4 4h6m-6 4h2" /><circle cx="17" cy="10" r="2" /></svg>
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
            <h2 className="lp-section-title">Em minutos você já tem matches reais.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Simples e direto, com a segurança que outros apps nunca tiveram.
            </p>
            <div className="lp-steps-row">
              {[
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, t: 'Escolha seu plano', d: 'A partir de R$10/mês. Sem conta gratuita — isso afasta golpistas.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, t: 'Verifique sua identidade', d: 'Selfie ao vivo + documento. Menos de 3 minutos pelo celular.' },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>, t: 'Configure seus filtros', d: 'Inclua e exclua como quiser. 100+ opções para ser preciso.' },
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
                <span className="lp-feat-badge rose">Mais popular</span>
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
                <a href="/cadastro?plano=plus" className="lp-btn-price lp-btn-rose">Assinar Plus</a>
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
                </ul>
                <a href="/cadastro?plano=black" className="lp-btn-price lp-btn-gold">Assinar Camarote Black</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gamificação ── */}
        <section className="lp-gamif">
          <div className="lp-gamif-inner">
            <p className="lp-section-label">Muito mais do que curtidas</p>
            <h2 className="lp-section-title">Recompensas por<br />estar aqui</h2>
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

        {/* ── Depoimentos ── */}
        <section className="lp-testi">
          <div className="lp-testi-inner">
            <p className="lp-section-label">Depoimentos</p>
            <h2 className="lp-section-title">Conexões que realmente aconteceram.</h2>
            <div className="lp-testi-grid">
              {[
                { name: 'Amanda C.', role: 'São Paulo · 28 anos · Plano Plus', text: 'Finalmente um app onde todo mundo é real. Coloquei filtro de evangélica não fumante e os matches vieram certeiros. Estou namorando há 3 meses.' },
                { name: 'Pedro H.', role: 'Curitiba · 31 anos · Camarote Black', text: 'Filtrei gótica, não fumante e que gosta de trilha. Parecia impossível. Em 3 dias tinha match perfeito. A verificação me deu confiança que nenhum outro app deu.' },
                { name: 'Rafael M.', role: 'Belo Horizonte · 35 anos · Camarote Black', text: 'Os apps antigos viraram bagunça de golpe. Aqui foi conversa real do início. Assinei o Camarote e o nível das pessoas é completamente diferente.' },
                { name: 'Letícia R.', role: 'Porto Alegre · 26 anos · Plano Plus', text: 'Usei o filtro de exclusão para tirar quem gosta de apostas e quem bebe demais. Parece bobagem mas fez toda a diferença. Encontrei alguém com os mesmos valores.' },
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
        <section className="lp-cta">
          <h2>Sua pessoa real<br />está esperando.</h2>
          <p>Verificação real. Filtros completos. Conexões de verdade.</p>
          <a href="/cadastro" className="lp-btn-cta-white">
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
              <a href="/cadastro">Criar conta</a>
              <a href="/login">Entrar</a>
              <a href="/suporte">Suporte</a>
              <a href="/ajuda">Central de ajuda</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© {new Date().getFullYear()} MeAndYou · Todos os direitos reservados · CNPJ em registro</p>
            <div className="lp-footer-btm-links">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
