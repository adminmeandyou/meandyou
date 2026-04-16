'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { findSingle } from './helpers'
import { TagChip } from './TagChip'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'

export function StatusCivilSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const map: Record<string, string> = {
    civil_single: 'Solteiro(a)', civil_complicated: 'Enrolado(a)', civil_married: 'Casado(a)',
    civil_divorcing: 'Divorciando', civil_divorced: 'Divorciado(a)', civil_widowed: 'Viúvo(a)', civil_open: 'Relacionamento aberto',
  }
  const [valor, setValor] = useState(() => findSingle(filtersData, map))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function salvar() {
    if (!valor) { setErro('Selecione uma opção.'); return }
    setSalvando(true); setErro(''); setSucesso(false)
    const update: Record<string, boolean> = {}
    Object.keys(map).forEach(k => { update[k] = (map[k] === valor) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...update })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] status-civil', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  return (
    <div style={{ padding: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: bloqueado ? '12px' : '0', opacity: bloqueado ? 0.35 : 1, pointerEvents: bloqueado ? 'none' : 'auto' }}>
        {Object.values(map).map(op => (
          <TagChip key={op} label={op} ativo={valor === op} onClick={() => setValor(op)} />
        ))}
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}
