'use client'

const verificacaoSteps = [
  { n: '1', t: 'Selfie ao vivo', d: 'Sequência de movimentos detectada em tempo real. Impossível usar foto ou vídeo.' },
  { n: '2', t: 'Documento de identidade', d: 'RG ou CNH validados. Confirma nome, idade e nacionalidade reais.' },
  { n: '3', t: 'Validação de CPF', d: 'Checagem automática. Apenas 1 conta por CPF, sem duplicatas.' },
  { n: '4', t: 'Monitoramento contínuo', d: 'Algoritmo anti-fraude ativo. Denúncias respondidas em até 24h.' },
]

const segFases = [
  {
    badge: 'Antes', titulo: 'Você vê antes de decidir.',
    feats: [
      'Perfis verificados com documento e selfie ao vivo',
      'Intenções declaradas visíveis desde o primeiro contato',
      'Histórico de atividade e nível de confiança do perfil',
    ],
  },
  {
    badge: 'Durante', titulo: 'Você mantém o controle.',
    feats: [
      'Bloqueio e denúncia em um toque, sem confirmações desnecessárias',
      'Modo invisível: sai do radar sem precisar explicar nada',
      'Alerta automático para comportamentos suspeitos',
    ],
  },
  {
    badge: 'Depois', titulo: 'Você continua protegido.',
    feats: [
      'Registro privado de encontro guardado só para você',
      'Check-in automático pós-encontro: o app pergunta se você está bem',
      'Botão de emergência: 190 em um toque, a qualquer momento',
    ],
  },
]

const dicasPrincipais = [
  { t: 'Marque em local público', d: 'Primeiro encontro sempre em café, restaurante ou shopping.' },
  { t: 'Avise alguém de confiança', d: 'Conte onde vai, com quem e a que horas.' },
  { t: 'Nunca transfira dinheiro', d: 'Se alguém pedir PIX antes do encontro: denuncie imediatamente.' },
  { t: 'Banimento permanente por CPF', d: 'Quem é banido não volta. Bloqueio vinculado ao CPF, não ao email.' },
]

export default function ConfiancaSection() {
  return (
    <section style={{ background: 'var(--bg)', borderTop: '1px solid var(--border-premium)' }} id="verificacao">

      {/* Verificação */}
      <div className="lp-verification" style={{ border: 'none', paddingBottom: 60 }}>
        <div className="lp-verification-inner">
          <div className="lp-anim">
            <p className="lp-section-label">Verificação rigorosa</p>
            <h2 className="lp-section-title">
              Só entra quem é <span style={{ color: 'var(--accent)' }}>real.</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 14, lineHeight: 1.7 }}>
              O processo de verificação mais rigoroso do mercado.
            </p>
          </div>
          <div className="lp-verify-steps">
            {verificacaoSteps.map(item => (
              <div key={item.n} className="lp-verify-step lp-anim">
                <div className="lp-vstep-num">{item.n}</div>
                <div><h4>{item.t}</h4><p>{item.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segurança — 3 fases */}
      <div style={{ padding: '0 56px 80px', borderTop: '1px solid var(--border-soft)' }} id="seguranca">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-anim" style={{ marginBottom: 48, paddingTop: 72 }}>
            <p className="lp-section-label">Segurança</p>
            <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Você nunca entra no escuro.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {segFases.map((fase, i) => (
              <div key={i} className="lp-anim" style={{ animationDelay: `${i * 120}ms`, background: 'var(--bg-card)', border: '1px solid var(--border-premium)', borderRadius: 20, padding: '28px 24px' }}>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10b981', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 12px', borderRadius: 100, marginBottom: 16 }}>{fase.badge}</span>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14, lineHeight: 1.4 }}>{fase.titulo}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fase.feats.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.60)', lineHeight: 1.6 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dicas compactas */}
      <div style={{ padding: '48px 56px 100px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-card-grad)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="lp-section-label" style={{ marginBottom: 24 }}>Dicas para encontros</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {dicasPrincipais.map((d, i) => (
              <div key={i} className="lp-anim" style={{ animationDelay: `${i * 80}ms`, display: 'flex', gap: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{d.t}</div>
                  <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.48)', lineHeight: 1.6, margin: 0 }}>{d.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
