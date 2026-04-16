'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { awardXp } from '@/app/lib/xp'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Lock } from 'lucide-react'
import { ProfileData, horasRestantes, diasRestantes, calcCompletude } from './_components/helpers'
import { Acordeao } from './_components/Acordeao'
import { StatusTempSection } from './_components/StatusTempSection'
import { FotosBioSection } from './_components/FotosBioSection'
import { TagsDestaqueSection } from './_components/TagsDestaqueSection'
import { StatusCivilSection } from './_components/StatusCivilSection'
import { FisicoSection } from './_components/FisicoSection'
import { EstiloVidaSection } from './_components/EstiloVidaSection'
import { ValoresSection } from './_components/ValoresSection'
import { ObjetivosSection } from './_components/ObjetivosSection'

export default function EditarPerfilPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [filtersData, setFiltersData] = useState<any>(null)
  const [emblemasTitulos, setEmblemasTitulos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [secaoAberta, setSecaoAberta] = useState<string | null>('fotos-bio')
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const [{ data: p, error: pErr }, { data: f }, { data: bData }] = await Promise.all([
        supabase.from('profiles')
          .select('bio, photo_face, photo_body, photo_side, photo_extra1, photo_extra2, photo_extra3, photo_best, highlight_tags, highlight_tags_edited_at, profile_edited_at, status_temp, status_temp_expires_at, profile_question, profile_question_answer, reg_email_verified, reg_facial_verified')
          .eq('id', user.id).single(),
        supabase.from('filters').select('*').eq('user_id', user.id).single(),
        supabase.from('user_badges').select('badges(name)').eq('user_id', user.id),
      ])
      if (pErr) console.error('[editar-perfil] profiles query error:', pErr)
      const profileDefault: ProfileData = {
        bio: '', photo_face: null, photo_body: null, photo_side: null,
        photo_extra1: null, photo_extra2: null, photo_extra3: null,
        photo_best: null, highlight_tags: [], highlight_tags_edited_at: null,
        profile_edited_at: null, status_temp: null, status_temp_expires_at: null,
        profile_question: null, profile_question_answer: null,
      }
      setProfileData(p ? (p as ProfileData) : profileDefault)
      if (p) setNeedsVerification((p as any).reg_email_verified === true && (p as any).reg_facial_verified !== true)
      setFiltersData(f)
      setEmblemasTitulos(((bData ?? []) as any[]).map((ub: any) => ub.badges?.name).filter(Boolean))
      setLoading(false)
    })
  }, [])

  // Disparar XP de perfil completo uma vez quando chegar a 100%
  const [xpCompleteDisparado, setXpCompleteDisparado] = useState(false)
  useEffect(() => {
    if (!userId || loading || xpCompleteDisparado) return
    const completude = calcCompletude(profileData, filtersData)
    if (completude >= 100) {
      awardXp(userId, 'profile_complete')
      setXpCompleteDisparado(true)
    }
  }, [profileData, filtersData, userId, loading])

  function toggle(secao: string) {
    setSecaoAberta(prev => prev === secao ? null : secao)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#08090E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.08)', borderTop: '2px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const horasTagsBloqueadas = horasRestantes(profileData?.highlight_tags_edited_at ?? null, 6)
  const diasCamposBloqueados = diasRestantes(profileData?.profile_edited_at ?? null, 7)
  const completude = calcCompletude(profileData, filtersData)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#08090E', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, backgroundColor: '#08090E', zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#F8F9FA', fontSize: '20px', margin: 0 }}>Editar perfil</h1>
      </div>

      {/* Barra de conclusão */}
      <div style={{ margin: '12px 16px', padding: '14px 16px', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600 }}>Conclusão do perfil</span>
          <span style={{ color: '#E11D48', fontSize: '14px', fontWeight: 700 }}>{completude}%</span>
        </div>
        <div style={{ height: '6px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completude}%`, backgroundColor: '#E11D48', borderRadius: '100px', transition: 'width 0.4s ease' }} />
        </div>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '12px', margin: '8px 0 0' }}>Complete seu perfil para aparecer em mais buscas</p>
      </div>

      <div style={{ padding: '4px 0' }}>

        {/* Status de hoje */}
        <Acordeao id="status-hoje" titulo="Status de hoje" aberto={secaoAberta === 'status-hoje'} onToggle={() => toggle('status-hoje')}>
          {userId && (
            <StatusTempSection
              userId={userId}
              statusAtual={profileData?.status_temp ?? null}
              expiresAt={profileData?.status_temp_expires_at ?? null}
              onSaved={(s, e) => setProfileData(prev => prev ? { ...prev, status_temp: s, status_temp_expires_at: e } : prev)}
            />
          )}
        </Acordeao>

        {/* Fotos & Bio */}
        <Acordeao id="fotos-bio" titulo="Fotos e bio" aberto={secaoAberta === 'fotos-bio'} onToggle={() => toggle('fotos-bio')}>
          {userId && profileData && (
            <FotosBioSection
              userId={userId}
              profileData={profileData}
              onSaved={(updated) => setProfileData(prev => prev ? { ...prev, ...updated } : prev)}
            />
          )}
        </Acordeao>

        {/* Tags de destaque */}
        <Acordeao
          id="tags-destaque" titulo="Tags de destaque"
          badge={horasTagsBloqueadas > 0 ? `${horasTagsBloqueadas}h` : undefined}
          badgeCor={horasTagsBloqueadas > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'tags-destaque'} onToggle={() => toggle('tags-destaque')}
        >
          {userId && (
            <TagsDestaqueSection
              userId={userId}
              emblemasTitulos={emblemasTitulos}
              tagsSelecionadas={profileData?.highlight_tags ?? []}
              bloqueadoPor={horasTagsBloqueadas}
              onSaved={(tags) => setProfileData(prev => prev ? { ...prev, highlight_tags: tags, highlight_tags_edited_at: new Date().toISOString() } : prev)}
            />
          )}
        </Acordeao>

        {/* Aviso de campos bloqueados por 7 dias */}
        {diasCamposBloqueados > 0 && (
          <div style={{ margin: '8px 16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} color="#f59e0b" />
            <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>
              As seções abaixo podem ser editadas novamente em <strong>{diasCamposBloqueados} dia{diasCamposBloqueados > 1 ? 's' : ''}</strong>.
            </p>
          </div>
        )}

        <Acordeao
          id="status-civil" titulo="Status civil"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : undefined}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'status-civil'} onToggle={() => toggle('status-civil')}
        >
          {userId && (
            <StatusCivilSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="fisico" titulo="Características físicas"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : undefined}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'fisico'} onToggle={() => toggle('fisico')}
        >
          {userId && (
            <FisicoSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="estilo-vida" titulo="Estilo de vida"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : undefined}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'estilo-vida'} onToggle={() => toggle('estilo-vida')}
        >
          {userId && (
            <EstiloVidaSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="valores" titulo="Valores e contexto"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : undefined}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'valores'} onToggle={() => toggle('valores')}
        >
          {userId && (
            <ValoresSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        <Acordeao
          id="objetivos" titulo="O que busco"
          badge={diasCamposBloqueados > 0 ? `${diasCamposBloqueados}d` : undefined}
          badgeCor={diasCamposBloqueados > 0 ? '#f59e0b' : undefined}
          aberto={secaoAberta === 'objetivos'} onToggle={() => toggle('objetivos')}
        >
          {userId && (
            <ObjetivosSection
              userId={userId}
              filtersData={filtersData ?? {}}
              bloqueado={diasCamposBloqueados > 0}
              onSaved={() => { setProfileData(prev => prev ? { ...prev, profile_edited_at: new Date().toISOString() } : prev); setFiltersData((prev: any) => prev ?? {}) }}
            />
          )}
        </Acordeao>

        {/* Banner de continuação para novos usuários */}
        {needsVerification && (
          <div style={{ margin: '8px 0', padding: '16px 20px', borderRadius: '14px', backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>Perfil salvo!</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Próximo passo: verificação de identidade</p>
            </div>
            <button
              onClick={() => { window.location.href = '/verificacao' }}
              style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Dados bloqueados */}
        <Acordeao
          id="dados-documento" titulo="Dados do documento"
          badge="Bloqueado" badgeCor="rgba(255,255,255,0.30)"
          aberto={secaoAberta === 'dados-documento'} onToggle={() => toggle('dados-documento')}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '12px' }}>
              <Lock size={18} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ color: 'rgba(248,249,250,0.60)', fontSize: '14px', margin: '0 0 8px', lineHeight: '1.5' }}>
                  Nome, data de nascimento, gênero, pronomes e orientação sexual foram registrados com base no seu documento de identidade e não podem ser alterados diretamente.
                </p>
                <p style={{ color: 'rgba(248,249,250,0.35)', fontSize: '13px', margin: '0 0 12px', lineHeight: '1.5' }}>
                  Para solicitar uma alteração, abra um chamado no suporte com o motivo e a documentação necessária.
                </p>
                <a
                  href="/suporte"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.25)', color: '#E11D48', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                >
                  Abrir chamado no suporte
                </a>
              </div>
            </div>
          </div>
        </Acordeao>

      </div>
    </div>
  )
}
