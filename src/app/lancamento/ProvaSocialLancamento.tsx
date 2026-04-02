'use client'

const Stars = () => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[...Array(5)].map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
)

const depoimentos = [
  {
    avatarBg: 'linear-gradient(135deg,#E11D48,#be123c)',
    inicial: 'M',
    nome: 'Mariana',
    idade: 34,
    cidade: 'São Paulo',
    txt: 'Entrei no lançamento sem expectativa. Já na primeira semana entendi por que é diferente. Nem precisa explicar — você sente quando entra.',
    verificado: true,
    destaque: true,
  },
  {
    avatarBg: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    inicial: 'R',
    nome: 'Rafael',
    idade: 41,
    cidade: 'Curitiba',
    txt: 'Dois meses grátis era só o gancho. Mas os filtros são bons demais. Já assinei antes de terminar o período gratuito.',
    verificado: true,
    destaque: false,
  },
  {
    avatarBg: 'linear-gradient(135deg,#10B981,#059669)',
    inicial: 'C',
    nome: 'Camila',
    idade: 29,
    cidade: 'Rio de Janeiro',
    txt: 'O emblema de Fundador aparece no perfil e as pessoas perguntam. Me sinto parte de algo que está crescendo. Ainda bem que entrei cedo.',
    verificado: true,
    destaque: false,
  },
  {
    avatarBg: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
    inicial: 'T',
    nome: 'Thiago',
    idade: 43,
    cidade: 'Belo Horizonte',
    txt: 'Plataforma paga sem plano grátis é exatamente o filtro que faltava. Todo mundo aqui sabe o que quer.',
    verificado: false,
    destaque: false,
  },
  {
    avatarBg: 'linear-gradient(135deg,#F59E0B,#D97706)',
    inicial: 'A',
    nome: 'Ana',
    idade: 37,
    cidade: 'Florianópolis',
    txt: 'Nunca me senti tão no controle de quem entra na minha vida. E o melhor: entrei de graça, com emblema lendário e tudo.',
    verificado: true,
    destaque: false,
  },
  {
    avatarBg: 'linear-gradient(135deg,#EC4899,#BE185D)',
    inicial: 'J',
    nome: 'Juliana',
    idade: 31,
    cidade: 'Porto Alegre',
    txt: 'Achei que era mais um app. Mas quando vi que a verificação de identidade era de verdade, entendi que o nível das pessoas aqui é diferente.',
    verificado: true,
    destaque: false,
  },
]

export default function ProvaSocialLancamento() {
  return (
    <section className="lp-social-v2">
      <div className="lp-social-v2-inner">
        <div className="lp-social-v2-header lp-anim">
          <p className="lp-section-label">Quem já entrou</p>
          <h2 className="lp-social-v2-title">Quem chegou cedo,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>não quer sair.</em></h2>
        </div>

        {/* Stats row */}
        <div className="lp-anim" style={{
          display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
          marginBottom: 40, paddingBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            { val: '4,9', label: 'estrelas', suffix: '/5' },
            { val: '+1.200', label: 'avaliações', suffix: '' },
            { val: '98%', label: 'recomendam', suffix: '' },
          ].map(({ val, label, suffix }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{val}</span>
                {suffix && <span style={{ fontSize: 14, color: 'rgba(248,249,250,0.40)', fontWeight: 500 }}>{suffix}</span>}
              </div>
              <div style={{ marginTop: 4 }}>
                {label === 'estrelas' ? (
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Stars />
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.45)', fontWeight: 500, letterSpacing: '0.03em' }}>{label}</span>
                )}
              </div>
              {label === 'estrelas' && (
                <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.35)', display: 'block', marginTop: 2 }}>{label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="lp-anim"
              style={{
                background: d.destaque
                  ? 'linear-gradient(135deg, rgba(225,29,72,0.12), rgba(19,22,31,0.95))'
                  : 'rgba(19,22,31,0.95)',
                border: d.destaque
                  ? '1px solid rgba(225,29,72,0.30)'
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                animationDelay: `${i * 80}ms`,
                position: 'relative',
              }}
            >
              {d.destaque && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(225,29,72,0.15)',
                  border: '1px solid rgba(225,29,72,0.35)',
                  borderRadius: 100, padding: '3px 10px',
                  fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                  letterSpacing: '0.05em',
                }}>DESTAQUE</div>
              )}

              <Stars />

              <p style={{
                fontSize: 14, color: 'rgba(248,249,250,0.72)',
                lineHeight: 1.70, margin: 0, fontStyle: 'italic',
              }}>
                &ldquo;{d.txt}&rdquo;
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: d.avatarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {d.inicial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {d.nome}, {d.idade}
                    </span>
                    {d.verificado && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        background: 'rgba(225,29,72,0.10)',
                        border: '1px solid rgba(225,29,72,0.25)',
                        borderRadius: 100, padding: '1px 7px',
                        fontSize: 9, fontWeight: 700, color: 'var(--accent)',
                        letterSpacing: '0.04em',
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Verificado
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.35)' }}>{d.cidade}</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.20)',
                  borderRadius: 100, padding: '3px 8px',
                  flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.04em' }}>FUNDADOR</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
