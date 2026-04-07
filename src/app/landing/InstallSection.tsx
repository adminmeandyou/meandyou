'use client'

import { useState, useEffect } from 'react'

export default function InstallSection() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installDone, setInstallDone] = useState(false)
  const [selectedOS, setSelectedOS] = useState<'android' | 'ios'>('android')

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallDone(true)
    setInstallPrompt(null)
  }

  return (
    <section className="lp-install">
      <div className="lp-install-inner">
        <div className="lp-install-left lp-anim">
          <p className="lp-section-label">App</p>
          <h2>Baixe agora.<br />Direto no seu celular.</h2>
          <p>Ícone na tela inicial, notificações em tempo real. Sem precisar de loja de apps, sem burocracia de download.</p>

          <div className="lp-install-os-tabs">
            <button className={`lp-os-tab${selectedOS === 'android' ? ' active' : ''}`} onClick={() => setSelectedOS('android')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.6 10.5l2.184-3.78a.75.75 0 0 0-1.3-.75L13.3 9.75H10.7L9.516 5.97a.75.75 0 0 0-1.3.75L10.4 10.5l-2.923 4.841A.75.75 0 1 0 8.777 16L12 10.933 15.223 16a.75.75 0 1 0 1.3-.659zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
              Android
            </button>
            <button className={`lp-os-tab${selectedOS === 'ios' ? ' active' : ''}`} onClick={() => setSelectedOS('ios')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              iPhone
            </button>
          </div>

          <div className="lp-install-actions">
            {installDone ? (
              <div className="lp-install-done">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                App instalado com sucesso!
              </div>
            ) : selectedOS === 'android' ? (
              <button onClick={handleInstall} className="lp-install-btn android" style={{ opacity: installPrompt ? 1 : 0.55, cursor: installPrompt ? 'pointer' : 'default' }}>
                <svg className="lp-install-btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.6 10.5l2.184-3.78a.75.75 0 0 0-1.3-.75L13.3 9.75H10.7L9.516 5.97a.75.75 0 0 0-1.3.75L10.4 10.5l-2.923 4.841A.75.75 0 1 0 8.777 16L12 10.933 15.223 16a.75.75 0 1 0 1.3-.659zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
                <span className="lp-install-btn-text">
                  <small>{installPrompt ? 'Toque para instalar' : 'Abra no Chrome para instalar'}</small>
                  Instalar no Android
                </span>
              </button>
            ) : (
              <div className="lp-install-btn ios">
                <svg className="lp-install-btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span className="lp-install-btn-text">
                  <small>Siga os passos ao lado</small>
                  Instalar no iPhone
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lp-install-right lp-anim">
          {selectedOS === 'android' ? (
            <>
              <p className="lp-install-os-label">Android · Chrome</p>
              <div className="lp-install-step">
                <div className="lp-install-step-num android">1</div>
                <div>
                  <h4>Abra no Chrome</h4>
                  <p>Acesse meandyou.com.br pelo navegador Chrome no seu Android.</p>
                </div>
              </div>
              <div className="lp-install-step">
                <div className="lp-install-step-num android">2</div>
                <div>
                  <h4>Toque nos 3 pontos &#x22ee;</h4>
                  <p>No canto superior direito do Chrome, abra o menu de opções.</p>
                </div>
              </div>
              <div className="lp-install-step">
                <div className="lp-install-step-num android">3</div>
                <div>
                  <h4>Adicionar à tela inicial</h4>
                  <p>Selecione a opção e confirme. O ícone aparece na sua tela.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="lp-install-os-label">iPhone · Safari</p>
              <div className="lp-install-step">
                <div className="lp-install-step-num ios">1</div>
                <div>
                  <h4>Abra no Safari</h4>
                  <p>No iPhone, use o Safari — é o único navegador que permite instalar apps pela web.</p>
                </div>
              </div>
              <div className="lp-install-step">
                <div className="lp-install-step-num ios">2</div>
                <div>
                  <h4>Toque em Compartilhar</h4>
                  <p>Ícone de seta para cima na barra inferior do Safari.</p>
                </div>
              </div>
              <div className="lp-install-step">
                <div className="lp-install-step-num ios">3</div>
                <div>
                  <h4>Adicionar à Tela de Início</h4>
                  <p>Role o menu para baixo, toque na opção e confirme. O ícone aparece na tela.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
