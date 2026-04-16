'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { findMulti } from './helpers'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'
import { GrupoMulti } from './GrupoMulti'

export function ObjetivosSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapObj: Record<string, string> = {
    obj_serious: 'Relacionamento sério', obj_casual: 'Relacionamento casual', obj_friendship: 'Amizade',
    obj_events: 'Companhia para eventos', obj_conjugal: 'Relação conjugal', obj_open: 'Aberto(a) a experiências',
    obj_sugar_baby: 'Sugar Baby', obj_sugar_daddy: 'Sugar Daddy / Mommy', obj_undefined: 'Ainda estou definindo',
  }
  const mapDiscreto: Record<string, string> = {
    disc_throuple: 'Trisal', disc_swing: 'Swing / aberto', disc_polyamory: 'Poliamor', disc_bdsm: 'BDSM / fetiches',
  }

  const RESTRITOS = ['Sugar Baby', 'Sugar Daddy / Mommy', 'BDSM / fetiches']

  const [objetivos, setObjetivos] = useState<string[]>(() => findMulti(filtersData, mapObj))
  const [discreto, setDiscreto] = useState<string[]>(() => findMulti(filtersData, mapDiscreto))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [modalRestrito, setModalRestrito] = useState<string | null>(null)
  const [tooltipAberto, setTooltipAberto] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (RESTRITOS.includes(val) && !arr.includes(val)) {
      setModalRestrito(val)
      return
    }
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    if (objetivos.length === 0) { setErro('Selecione pelo menos um objetivo.'); return }
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapObj).forEach(([k, v]) => { u[k] = objetivos.includes(v) })
    Object.entries(mapDiscreto).forEach(([k, v]) => { u[k] = discreto.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] objetivos', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoMulti titulo="O que busco" opcoes={Object.values(mapObj)} valores={objetivos} onToggle={v => tog(objetivos, setObjetivos, v)} />
        <GrupoMulti titulo="Interesses discretos" opcoes={Object.values(mapDiscreto)} valores={discreto} onToggle={v => tog(discreto, setDiscreto, v)} />
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}

      {/* Modal de acesso restrito (sugar / fetiche) */}
      {modalRestrito && (
        <div
          onClick={() => setModalRestrito(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#0F1117', borderRadius: '20px 20px 16px 16px', padding: '24px 20px', width: '100%', maxWidth: '430px', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '12px', textAlign: 'center', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Acesso especial</p>
            <h3 style={{ color: '#F8F9FA', fontSize: '18px', fontFamily: 'var(--font-fraunces)', marginBottom: '8px', textAlign: 'center' }}>{modalRestrito}</h3>
            <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', textAlign: 'center' }}>
              Esta categoria requer verificação adicional por segurança. Você pode fazer upgrade de plano ou solicitar acesso via suporte.
            </p>
            <button
              onClick={() => window.location.href = '/planos'}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: '#E11D48', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '10px', fontFamily: 'var(--font-jakarta)' }}
            >
              Fazer upgrade de plano
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <a
                href="/suporte"
                style={{ color: 'rgba(248,249,250,0.45)', fontSize: '13px', textDecoration: 'underline', textDecorationColor: 'rgba(248,249,250,0.20)' }}
              >
                Solicitar acesso via suporte
              </a>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => setTooltipAberto(p => !p)}
                  style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(248,249,250,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >?</button>
                {tooltipAberto && (
                  <div style={{ position: 'absolute', bottom: '26px', right: 0, width: '220px', backgroundColor: '#1a1d28', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: 'rgba(248,249,250,0.65)', lineHeight: 1.6, zIndex: 10 }}>
                    O acesso via suporte permite usar esta categoria sem upgrade de plano. Envie uma solicitação e nossa equipe avaliará em até 48h.
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setModalRestrito(null)}
              style={{ width: '100%', padding: '11px', marginTop: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: 'rgba(248,249,250,0.40)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
