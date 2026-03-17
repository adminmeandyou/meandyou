'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Heart, Search, Star, Zap, Shield, ChevronRight, Check, MapPin, Bell } from 'lucide-react'

const PASSOS = ['Bem-vindo', 'Como funciona', 'Permissoes', 'Pronto']

export default function OnboardingPage() {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [gpsAtivo, setGpsAtivo] = useState(false)
  const [notifAtiva, setNotifAtiva] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_done, name')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_done) { router.push('/busca'); return }
      if (profile?.name) setNome(profile.name)
      setCarregando(false)
    })
  }, [])

  const concluirOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id)
    if (error) {
      // fallback: tenta upsert
      await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
    }
    router.push('/configuracoes/editar-perfil')
  }

  const pedirGps = async () => {
    if (gpsAtivo) return
    setGpsLoading(true)
    try {
      await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      setGpsAtivo(true)
    } catch {
      // usuario recusou ou nao disponivel — sem problema
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
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '100px', backgroundColor: i <= passo ? 'var(--accent)' : 'var(--border)', transition: 'background-color 0.3s' }} />
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
              Voce acaba de entrar no <strong style={{ color: 'var(--text)' }}>MeAnd<span style={{ color: 'var(--accent)' }}>You</span></strong> — onde conexoes reais acontecem. Diferente dos outros apps, aqui a compatibilidade vai muito alem de uma foto.
            </p>
            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '700', marginBottom: '12px' }}>O que nos diferencia:</p>
              {[
                'Perfis com mais de 80 atributos reais',
                'Filtros avancados para encontrar sua compatibilidade',
                'Videochamadas integradas — conhca antes de encontrar',
                'Gamificacao que torna a busca mais divertida',
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
              { icon: <Shield size={22} color="var(--accent)" />, titulo: '1. Complete seu perfil', desc: 'Preencha suas informacoes reais — aparencia, personalidade, valores e o que busca. Isso define quem vai aparecer para voce.' },
              { icon: <Search size={22} color="var(--accent)" />, titulo: '2. Explore e filtre', desc: 'Use filtros avancados para encontrar pessoas compativeis na sua regiao. Curta, passe ou de um Super Curtida.' },
              { icon: <Heart size={22} color="var(--accent)" />, titulo: '3. E um match!', desc: 'Quando dois se curtem mutuamente, vira match. A partir dai voces podem conversar.' },
              { icon: <Zap size={22} color="var(--accent)" />, titulo: '4. Videochamada integrada', desc: 'Antes de marcar um encontro, converse por video dentro do app. Seguro e sem precisar trocar contato.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
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
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: 'var(--text)', marginBottom: '10px' }}>Uma coisa rapida</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Para funcionar melhor, o MeAndYou precisa de duas permissoes. Voce pode ativar agora ou depois nas configuracoes.
            </p>

            {/* GPS Card */}
            <div onClick={!gpsAtivo ? pedirGps : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: gpsAtivo ? 'var(--accent-light)' : 'var(--bg-card)', border: `1.5px solid ${gpsAtivo ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '20px', padding: '20px', marginBottom: '14px', cursor: gpsAtivo ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.25s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: gpsAtivo ? 'var(--accent)' : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {gpsLoading ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <MapPin size={22} color={gpsAtivo ? '#fff' : 'var(--muted)'} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>Localização</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
                  {gpsAtivo ? 'Ativada — voce vai aparecer na busca da sua regiao' : 'Para mostrar pessoas perto de voce'}
                </p>
              </div>
              {gpsAtivo && <Check size={20} color="var(--accent)" style={{ flexShrink: 0 }} />}
            </div>

            {/* Notificações Card */}
            <div onClick={!notifAtiva ? pedirNotificacoes : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: notifAtiva ? 'var(--accent-light)' : 'var(--bg-card)', border: `1.5px solid ${notifAtiva ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '20px', padding: '20px', marginBottom: '24px', cursor: notifAtiva ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.25s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: notifAtiva ? 'var(--accent)' : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {notifLoading ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <Bell size={22} color={notifAtiva ? '#fff' : 'var(--muted)'} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>Notificacoes</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
                  {notifAtiva ? 'Ativadas — voce vai saber quando tiver matches e mensagens' : 'Para saber quando tiver um match ou mensagem nova'}
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
              Agora vamos montar o seu perfil. Quanto mais completo, mais chances voce tem de aparecer para as pessoas certas.
            </p>

            <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '700', marginBottom: '6px' }}>Dica importante</p>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Voce vai cadastrar <strong style={{ color: 'var(--text)' }}>suas proprias caracteristicas</strong> — nao o que procura em outra pessoa. Isso e o que define quem vai aparecer para voce.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700', marginBottom: '8px' }}>Vai preencher:</p>
              {['Suas fotos', 'Aparencia e personalidade', 'Valores e estilo de vida', 'O que voce busca'].map((item, i) => (
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
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(225,29,72,0.25)' }}>
            Continuar <ChevronRight size={20} />
          </button>
        ) : (
          <button onClick={concluirOnboarding}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(225,29,72,0.25)' }}>
            Montar meu perfil <ChevronRight size={20} />
          </button>
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
