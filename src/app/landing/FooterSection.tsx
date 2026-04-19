'use client'

export default function FooterSection() {
  return (
    <>
      {/* CTA Final */}
      <div style={{ padding: '80px 56px', background: 'linear-gradient(180deg, var(--bg-card-grad) 0%, var(--bg) 100%)', borderTop: '1px solid var(--border-premium)', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 className="lp-anim" style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 16 }}>Comece agora.</h2>
          <p className="lp-anim" style={{ fontSize: 16, color: 'rgba(248,249,250,0.55)', marginBottom: 32, lineHeight: 1.7 }}>Entre, defina o que você quer e veja como tudo muda quando você tem controle.</p>
          <a href="/cadastro" className="lp-btn-main lp-anim" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 14 }}>
            Criar conta
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <p className="lp-anim" style={{ fontSize: 12, color: 'rgba(248,249,250,0.30)' }}>Leva menos de 1 minuto para começar</p>
        </div>
      </div>
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
          <a href="/fale-conosco">Fale conosco</a>
          <a href="/suporte">Suporte</a>
        </div>
      </div>
      <div className="lp-footer-bottom">
        <div>
          <p>&copy; {new Date().getFullYear()} MeAndYou · Todos os direitos reservados</p>
          <p style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(248,249,250,0.35)' }}>
            Feito com carinho por brasileiros
          </p>
        </div>
        <div className="lp-footer-btm-links">
          <a href="/privacidade">Privacidade</a>
          <a href="/termos">Termos</a>
        </div>
      </div>
    </footer>
    </>
  )
}
