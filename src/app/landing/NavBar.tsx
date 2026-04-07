'use client'

interface NavBarProps {
  navVisible: boolean
  menuAberto: boolean
  setMenuAberto: (v: boolean) => void
}

export default function NavBar({ navVisible, menuAberto, setMenuAberto }: NavBarProps) {
  return (
    <>
      <nav className="lp-nav" style={{ transform: navVisible ? 'translateX(-50%)' : 'translateX(-50%) translateY(-120%)', opacity: navVisible ? 1 : 0 }}>
        <a href="/" className="lp-logo">MeAnd<span>You</span></a>
        <ul className="lp-nav-links">
          <li><a href="#verificacao">Verificação</a></li>
          <li><a href="#filtros">Filtros</a></li>
          <li><a href="#precos">Planos</a></li>
          <li><a href="#seguranca">Segurança</a></li>
          <li><a href="/cadastro" className="lp-nav-cta">Começar agora</a></li>
        </ul>
        <button
          className={`lp-hamburger${menuAberto ? ' open' : ''}`}
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`lp-mobile-menu${menuAberto ? ' open' : ''}`}>
        <div className="lp-mobile-overlay" onClick={() => setMenuAberto(false)} />
        <div className="lp-mobile-drawer">
          <a href="#verificacao" onClick={() => setMenuAberto(false)}>Verificação</a>
          <a href="#filtros" onClick={() => setMenuAberto(false)}>Filtros</a>
          <a href="#precos" onClick={() => setMenuAberto(false)}>Planos</a>
          <a href="#seguranca" onClick={() => setMenuAberto(false)}>Segurança</a>
          <a href="/planos" className="lp-nav-cta" onClick={() => setMenuAberto(false)}>Começar agora</a>
        </div>
      </div>
    </>
  )
}
