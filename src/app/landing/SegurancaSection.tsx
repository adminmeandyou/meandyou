'use client'

export default function SegurancaSection() {
  return (
    <section className="lp-seg-v2">
      <div className="lp-seg-v2-inner">
        <div className="lp-seg-v2-header lp-anim">
          <p className="lp-section-label">Seguranca</p>
          <h2 className="lp-seg-v2-title">Voce nunca entra<br />no escuro.</h2>
        </div>
        <div className="lp-seg-phases">
          {[
            {
              num: '01', badge: 'Antes', badgeType: 'verde',
              titulo: 'Voce ve antes de decidir.',
              texto: 'Voce pode ver, entender e sentir seguranca antes de qualquer decisao.',
              feats: [
                { cor: 'verde', txt: 'Perfis verificados com documento e selfie ao vivo' },
                { cor: 'verde', txt: 'Intencoes declaradas visiveis desde o primeiro contato' },
                { cor: 'verde', txt: 'Historico de atividade e nivel de confianca do perfil' },
              ],
            },
            {
              num: '02', badge: 'Durante', badgeType: 'verde',
              titulo: 'Voce mantem o controle.',
              texto: 'Voce mantem controle total da interacao enquanto ela acontece.',
              feats: [
                { cor: 'verde', txt: 'Bloqueio e denuncia em um toque, sem confirmacoes desnecessarias' },
                { cor: 'verde', txt: 'Modo invisivel — sai do radar sem precisar explicar nada' },
                { cor: 'verde', txt: 'Alerta automatico para comportamentos suspeitos na conversa' },
              ],
            },
            {
              num: '03', badge: 'Depois', badgeType: 'verde',
              titulo: 'Voce continua protegido.',
              texto: 'Voce continua protegido mesmo fora da conversa, mesmo apos um encontro.',
              feats: [
                { cor: 'verde', txt: 'Registro privado de encontro guardado so para voce' },
                { cor: 'verde', txt: 'Check-in automatico pos-encontro — o app pergunta se voce esta bem' },
                { cor: 'verde', txt: 'Botao de emergencia — 190 em um toque, a qualquer momento' },
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
  )
}
