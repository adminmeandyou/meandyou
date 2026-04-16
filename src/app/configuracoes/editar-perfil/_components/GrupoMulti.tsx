'use client'

import { TagChip } from './TagChip'

export function GrupoMulti({ titulo, opcoes, valores, onToggle }: {
  titulo: string; opcoes: string[]; valores: string[]; onToggle: (v: string) => void
}) {
  return (
    <div>
      <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{titulo}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {opcoes.map(op => <TagChip key={op} label={op} ativo={valores.includes(op)} onClick={() => onToggle(op)} />)}
      </div>
    </div>
  )
}
