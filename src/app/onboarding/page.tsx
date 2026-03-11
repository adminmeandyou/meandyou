'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Heart, Search, Star, Zap, Shield, ChevronRight, Check } from 'lucide-react'

// Onboarding de boas-vindas pós-cadastro, antes de ir para /perfil
// Mostra: boas-vindas → como funciona → planos → ir ao perfil

const PASSOS = ['Bem-vindo', 'Como funciona', 'Planos', 'Pronto']

export default function OnboardingPage() {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      // Verifica se já completou o onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_done, name')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_done) {
        // Já passou pelo onboarding — vai pro perfil direto
        router.push('/perfil')
        return
      }

      if (profile?.name) setNome(profile.name)
      setCarregando(false)
    })
  }, [])

  const concluirOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ onboarding_done: true })
      .eq('id', user.id)

    router.push('/perfil')
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
              {nome ? `Olá, ${nome.split(' ')[0]}! 👋` : 'Bem-vindo(a)! 👋'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Você acaba de entrar no <strong style={{ color: 'var(--text)' }}>MeAndYou</strong> — onde conexões reais acontecem. Diferente dos outros apps, aqui a compatibilidade vai muito além de uma foto.
            </p>
            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid rgba(46,196,160,0.3)', borderRadius: '20px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--accent-dark)', fontWeight: '700', marginBottom: '12px' }}>✨ O que nos diferencia:</p>
              {[
                'Perfis completos com mais de 80 atributos reais',
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
              { icon: <Zap size={22} color="var(--accent)" />, titulo: '4. Videochamada integrada', desc: 'Antes de marcar um encontro, converse por vídeo dentro do app. Seguro e sem precisar trocar contato.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
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

        {/* ── PASSO 2: Planos ── */}
        {passo === 2 && (
          <div style={{ width: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>Planos disponíveis</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', marginBottom: '24px' }}>Comece grátis. Evolua quando quiser.</p>

            {/* Essencial */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Essencial</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)' }}>R$ 9,97</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>/mês</span>
                </div>
              </div>
              {['5 curtidas/dia', '1 SuperCurtida/dia', '1 lupa/dia', 'Chat com matches', 'Roleta diária'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Check size={14} color="var(--accent)" />
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Plus */}
            <div style={{ border: '2px solid var(--accent)', borderRadius: '20px', padding: '20px', marginBottom: '12px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', backgroundColor: 'var(--accent)', borderRadius: '100px', padding: '2px 12px', fontSize: '11px', fontWeight: '700', color: '#fff' }}>MAIS POPULAR</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Plus</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)' }}>R$ 39,97</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>/mês</span>
                </div>
              </div>
              {['30 curtidas/dia', '4 SuperCurtidas/dia', 'Ver quem curtiu você', '1 lupa/dia', 'Destaque no feed'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Check size={14} color="var(--accent)" />
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Black */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', border: '1px solid #c9a84c', borderRadius: '20px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #c9a84c, #f5d485, #c9a84c)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#f5d485', fontFamily: 'var(--font-fraunces)' }}>Black</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#f5d485' }}>R$ 99,97</span>
                  <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>/mês</span>
                </div>
              </div>
              {['Curtidas ilimitadas', '10 SuperCurtidas/dia', '2 lupas/dia', 'Área Backstage', 'Suporte prioritário 24h'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Check size={14} color="#c9a84c" />
                  <span style={{ fontSize: '13px', color: '#aaa' }}>{f}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '16px' }}>
              Você pode assinar a qualquer momento em <strong>Loja → Planos</strong>
            </p>
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

            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: '#856404', fontWeight: '700', marginBottom: '6px' }}>💡 Dica importante</p>
              <p style={{ fontSize: '13px', color: '#856404', lineHeight: '1.6' }}>
                Você vai cadastrar <strong>suas próprias características</strong> — não o que procura em outra pessoa. Isso é o que define quem vai aparecer para você.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid rgba(46,196,160,0.3)', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent-dark)', fontWeight: '700', marginBottom: '8px' }}>📋 Você vai preencher:</p>
              {['7 etapas de perfil (leva ~5 minutos)', 'Suas fotos (5 obrigatórias + 5 livres)', 'Aparência, personalidade e valores', 'O que você busca na plataforma'].map((item, i) => (
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
      <div style={{ padding: '16px 24px 40px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {passo < PASSOS.length - 1 ? (
          <button onClick={() => setPasso(passo + 1)}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(46,196,160,0.3)' }}>
            Continuar <ChevronRight size={20} />
          </button>
        ) : (
          <button onClick={concluirOnboarding}
            style={{ width: '100%', padding: '16px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(46,196,160,0.3)' }}>
            Montar meu perfil <ChevronRight size={20} />
          </button>
        )}

        {passo > 0 && (
          <button onClick={() => setPasso(passo - 1)}
            style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '100px', border: 'none', backgroundColor: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '14px', cursor: 'pointer' }}>
            Voltar
          </button>
        )}
      </div>

    </div>
  )
}
