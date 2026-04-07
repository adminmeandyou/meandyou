'use client'

export default function SegurancaSection() {
  return (
    <section className="lp-seg-v2">
      <div className="lp-seg-v2-inner">
        <div className="lp-seg-v2-header lp-anim">
          <p className="lp-section-label">Segurança</p>
          <h2 className="lp-seg-v2-title">Você nunca entra<br />no escuro.</h2>
        </div>
        <div className="lp-seg-phases">
          {[
            {
              num: '01', badge: 'Antes', badgeType: 'verde',
              titulo: 'Você vê antes de decidir.',
              texto: 'Você pode ver, entender e sentir segurança antes de qualquer decisão.',
              feats: [
                { cor: 'verde', txt: 'Perfis verificados com documento e selfie ao vivo' },
                { cor: 'verde', txt: 'Intenções declaradas visíveis desde o primeiro contato' },
                { cor: 'verde', txt: 'Histórico de atividade e nível de confiança do perfil' },
              ],
            },
            {
              num: '02', badge: 'Durante', badgeType: 'verde',
              titulo: 'Você mantém o controle.',
              texto: 'Você mantém controle total da interação enquanto ela acontece.',
              feats: [
                { cor: 'verde', txt: 'Bloqueio e denúncia em um toque, sem confirmações desnecessárias' },
                { cor: 'verde', txt: 'Modo invisível — sai do radar sem precisar explicar nada' },
                { cor: 'verde', txt: 'Alerta automático para comportamentos suspeitos na conversa' },
              ],
            },
            {
              num: '03', badge: 'Depois', badgeType: 'verde',
              titulo: 'Você continua protegido.',
              texto: 'Você continua protegido mesmo fora da conversa, mesmo após um encontro.',
              feats: [
                { cor: 'verde', txt: 'Registro privado de encontro guardado só para você' },
                { cor: 'verde', txt: 'Check-in automático pós-encontro — o app pergunta se você está bem' },
                { cor: 'verde', txt: 'Botão de emergência — 190 em um toque, a qualquer momento' },
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
          <p className="lp-seg-closing-text">Você decide até onde vai.</p>
        </div>
      </div>
    </section>
  )
}
