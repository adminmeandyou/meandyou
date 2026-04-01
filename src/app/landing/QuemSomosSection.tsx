'use client'

export default function QuemSomosSection() {
  return (
    <section className="lp-about">
      <div className="lp-about-inner">
        <div className="lp-about-intro">
          <div className="lp-about-intro-left lp-anim">
            <p className="lp-section-label">Quem somos</p>
            <h2>
              <span style={{
                display: 'block', fontSize: '0.52em', fontWeight: 400,
                color: 'rgba(248,249,250,0.42)', fontStyle: 'italic',
                letterSpacing: '0', lineHeight: 1.5, marginBottom: '14px',
                borderLeft: '2px solid var(--accent-border)', paddingLeft: '14px',
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
            <p>Não importa sua raça, identidade de gênero, religião, se você é PCD, assexual ou qual é a sua orientação. Com mais de 100 filtros, você molda o app em volta de você. Nós nos recusamos a criar &quot;só mais um app&quot;. Construímos a primeira plataforma com arquitetura de inclusão total.</p>
          </div>
          <div className="lp-about-pillar lp-anim">
            <div className="lp-about-pillar-label">Muito mais por trás</div>
            <h4>Há camadas que você só descobre entrando.</h4>
            <p>Repensamos a experiência de uso. Entrar no app deixou de ser um hábito chato e virou algo recompensador. Para quem busca algo além do convencional: espaços blindados e totalmente discretos onde fetiches, desejos específicos e acordos vivem longe de olhares curiosos.</p>
          </div>
          <div className="lp-about-pillar lp-anim">
            <div className="lp-about-pillar-label">Nossa marca</div>
            <h4>Simplicidade no acesso, elegância na conexão.</h4>
            <p>MeAndYou: pensado para ser simples, direto e rápido de digitar no navegador — o caminho mais curto para o seu próximo encontro. Me&amp;You: no logotipo, o &amp; representa o elo perfeito. É a tecnologia unindo, de forma segura e sem julgamentos, o &quot;Eu&quot; e o &quot;Você&quot;.</p>
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
  )
}
