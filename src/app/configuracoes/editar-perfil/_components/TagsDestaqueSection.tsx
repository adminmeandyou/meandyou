'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { TagChip } from './TagChip'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'

export function TagsDestaqueSection({ userId, emblemasTitulos, tagsSelecionadas, bloqueadoPor, onSaved }: {
  userId: string
  emblemasTitulos: string[]
  tagsSelecionadas: string[]
  bloqueadoPor: number
  onSaved: (tags: string[]) => void
}) {
  const [selecionadas, setSelecionadas] = useState<string[]>(tagsSelecionadas)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function toggle(titulo: string) {
    if (selecionadas.includes(titulo)) {
      setSelecionadas(prev => prev.filter(t => t !== titulo))
    } else if (selecionadas.length < 1) {
      setSelecionadas(prev => [...prev, titulo])
    }
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    try {
      await supabase.from('profiles').update({
        highlight_tags: selecionadas,
        highlight_tags_edited_at: new Date().toISOString(),
      }).eq('id', userId)
      onSaved(selecionadas)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] tags-destaque', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  if (bloqueadoPor > 0) {
    return (
      <div style={{ padding: '16px' }}>
        <BloqueioAviso horas={bloqueadoPor} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: 0.35, pointerEvents: 'none', marginTop: '12px' }}>
          {tagsSelecionadas.map(tag => <TagChip key={tag} label={tag} ativo />)}
        </div>
      </div>
    )
  }

  if (emblemasTitulos.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: '14px', margin: '0 0 6px', fontWeight: 600 }}>Nenhum emblema conquistado ainda</p>
          <p style={{ color: 'rgba(248,249,250,0.35)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            Os títulos disponíveis para exibir no seu card vêm dos emblemas que você conquistar. Complete desafios para desbloquear seus primeiros títulos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', margin: '0 0 4px' }}>
        Escolha <strong style={{ color: '#E11D48' }}>1 título</strong> de emblema conquistado para exibir no seu card. Você pode usar o título de um emblema diferente do que exibe.
      </p>
      <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', margin: '0 0 16px' }}>
        {selecionadas.length}/1 selecionado
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {emblemasTitulos.map(titulo => (
          <TagChip
            key={titulo}
            label={titulo}
            ativo={selecionadas.includes(titulo)}
            desabilitado={!selecionadas.includes(titulo) && selecionadas.length >= 1}
            onClick={() => toggle(titulo)}
          />
        ))}
      </div>
      {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
      <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}
