'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { saveUserLocation } from '../lib/location'
import { Heart, Search, Star, Zap, Shield, ChevronRight, Check, MapPin, Bell } from 'lucide-react'

const PASSOS = ['Bem-vindo', 'Como funciona', 'Permissoes', 'Pronto']

export default function OnboardingPage() {
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [concluindo, setConcluindo] = useState(false)
  const [erroConcluir, setErroConcluir] = useState('')

  const [gpsAtivo, setGpsAtivo] = useState(false)
  const [notifAtiva, setNotifAtiva] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, name')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) { window.location.href = '/modos'; return }
      if (profile?.name) setNome(profile.name)
      setCarregando(false)
    }).catch(() => {
      window.location.href = '/login'
    })
  }, [])

  const concluirOnboarding = async () => {
    setConcluindo(true)
    setErroConcluir('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Sessão perdida — redireciona para login
        window.location.href = '/login'
        return
      }
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
      if (error) {
        await supabase.from('profiles').upsert({ id: user.id, onboarding_completed: true })
      }
      // Garante localização salva mesmo se o usuário pulou o passo de GPS
      saveUserLocation(user.id)
      // Mostra o tutorial de modos antes de ir para editar-perfil
      window.location.href = '/modos-guia?next=/configuracoes/editar-perfil'
    } catch {
      setErroConcluir('Erro ao salvar. Tente novamente.')
      setConcluindo(false)
    }
  }

  const pedirGps = async () => {
    if (gpsAtivo) return
    setGpsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await saveUserLocation(user.id)
      setGpsAtivo(true)
    } catch {
      // usuario recusou — fallback por IP já é tentado dentro de saveUserLocation
    } finally {
      setGpsLoading(false)
    }
  }

  const pedirNotificacoes = async () => {
    if (notifAtiva) return
    setNotifLoading(true)
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') setNotifAtiva(true)
      }
    } finally {
      setNotifLoading(false)
    }
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.06)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Barra de progresso */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PASSOS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '100px', backgroundColor: i <= passo ? 'var(--accent)' : 'rgba(255,255,255,0.06)', transition: 'background-color 0.25s cubic-bezier(0.4,0,0.2,1)' }} />
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        {/* ── PASSO 0: Bem-vindo ── */}
        {passo === 0 && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Heart size={36} color="var(--accent)" fill="var(--accent)" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: 'var(--text)', marginBottom: '12px' }}>
              {nome ? `Ola, ${nome.split(' ')[0]}!` : 'Bem-vindo(a)!'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Você acaba de entrar no <strong style={{ color: 'var(--text)' }}>MeAnd<span style={{ color: 'var(--accent)' }}>You</span></strong> — onde conexões reais acontecem. Diferente dos outros apps, aqui a compatibilidade vai muito além de uma foto.
            </p>
            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '700', marginBottom: '12px' }}>O que nos diferencia:</p>
              {[
                'Perfis com mais de 80 atributos reais',
                'Filtros avançados para encontrar sua compatibilidade',
                'Videochamadas integradas — conheça antes de encontrar',
                'Gamificação que torna a busca mais divertida',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 3 ? '10px' : 0 }}>
                  <Check size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PASSO 1: Como funciona ── */}
        {passo === 1 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>Como funciona?</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', marginBottom: '32px' }}>Em 4 passos simples</p>
            {[
              { icon: <Shield size={22} color="var(--accent)" />, titulo: '1. Complete seu perfil', desc: 'Preencha suas informações reais — aparência, personalidade, valores e o que busca. Isso define quem vai aparecer para você.' },
              { icon: <Search size={22} color="var(--accent)" />, titulo: '2. Explore e filtre', desc: 'Use filtros avançados para encontrar pessoas compatíveis na sua região. Curta, passe ou dê um Super Curtida.' },
              { icon: <Heart size={22} color="var(--accent)" />, titulo: '3. É um match!', desc: 'Quando dois se curtem mutuamente, vira match. A partir daí vocês podem conversar.' },
              { icon: <Zap size={22} color="var(--accent)" />, titulo: '4. Videochamada integrada', desc: 'Antes de marcar um encontro, converse por video dentro do app. Seguro e sem precisar trocar contato.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>{item.titulo}</p>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PASSO 2: Permissões (Soft Ask) ── */}
        {passo === 2 && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield size={36} color="var(--accent)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: 'var(--text)', marginBottom: '10px' }}>Uma coisa rápida</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Para funcionar melhor, o MeAndYou precisa de duas permissões. Você pode ativar agora ou depois nas configurações.
            </p>

            {/* GPS Card */}
            <div onClick={!gpsAtivo ? pedirGps : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', background: gpsAtivo ? 'var(--accent-light)' : 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: `1.5px solid ${gpsAtivo ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '20px', marginBottom: '14px', cursor: gpsAtivo ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: gpsAtivo ? 'var(--accent)' : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {gpsLoading ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <MapPin size={22} color={gpsAtivo ? '#fff' : 'var(--muted)'} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>Localização</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
                  {gpsAtivo ? 'Ativada — você vai aparecer na busca da sua região' : 'Para mostrar pessoas perto de você'}
                </p>
              </div>
              {gpsAtivo && <Check size={20} color="var(--accent)" style={{ flexShrink: 0 }} />}
            </div>

            {/* Notificações Card */}
            <div onClick={!notifAtiva ? pedirNotificacoes : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', background: notifAtiva ? 'var(--accent-light)' : 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: `1.5px solid ${notifAtiva ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '20px', marginBottom: '24px', cursor: notifAtiva ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: notifAtiva ? 'var(--accent)' : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {notifLoading ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <Bell size={22} color={notifAtiva ? '#fff' : 'var(--muted)'} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>Notificações</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
                  {notifAtiva ? 'Ativadas — você vai saber quando tiver matches e mensagens' : 'Para saber quando tiver um match ou mensagem nova'}
                </p>
              </div>
              {notifAtiva && <Check size={20} color="var(--accent)" style={{ flexShrink: 0 }} />}
            </div>
          </div>
        )}

        {/* ── PASSO 3: Pronto ── */}
        {passo === 3 && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Star size={36} color="var(--accent)" fill="var(--accent)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: '12px' }}>Tudo pronto!</h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Agora vamos montar o seu perfil. Quanto mais completo, mais chances você tem de aparecer para as pessoas certas.
            </p>

            <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '700', marginBottom: '6px' }}>Dica importante</p>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Você vai cadastrar <strong style={{ color: 'var(--text)' }}>suas próprias características</strong> — não o que procura em outra pessoa. Isso é o que define quem vai aparecer para você.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700', marginBottom: '8px' }}>Vai preencher:</p>
              {['3 fotos (rosto, corpo inteiro e lateral)', 'Aparência e personalidade', 'Valores e estilo de vida', 'O que você busca'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < 3 ? '6px' : 0 }}>
                  <Check size={14} color="var(--accent)" />
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Botão de ação */}
      <div style={{ padding: '16px 24px 44px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {passo < PASSOS.length - 1 ? (
          <button onClick={() => setPasso(passo + 1)}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(225,29,72,0.25)' }}>
            Continuar <ChevronRight size={20} />
          </button>
        ) : (
          <>
            {erroConcluir && (
              <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center', marginBottom: '12px' }}>{erroConcluir}</p>
            )}
            <button
              onClick={concluirOnboarding}
              disabled={concluindo}
              style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: concluindo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(225,29,72,0.25)', opacity: concluindo ? 0.7 : 1 }}>
              {concluindo ? 'Salvando...' : 'Montar meu perfil'} {!concluindo && <ChevronRight size={20} />}
            </button>
          </>
        )}

        {passo === 2 && (
          <button onClick={() => setPasso(passo + 1)}
            style={{ width: '100%', padding: '12px', marginTop: '12px', borderRadius: '100px', border: 'none', backgroundColor: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '14px', cursor: 'pointer' }}>
            Talvez depois
          </button>
        )}

        {passo > 0 && passo !== 2 && (
          <button onClick={() => setPasso(passo - 1)}
            style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '100px', border: 'none', backgroundColor: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '14px', cursor: 'pointer' }}>
            Voltar
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
