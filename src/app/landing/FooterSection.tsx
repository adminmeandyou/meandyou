'use client'

export default function FooterSection() {
  return (
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
  )
}
