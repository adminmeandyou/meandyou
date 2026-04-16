'use client'

import { TagChip } from './TagChip'

export function GrupoOpcoes({ titulo, opcoes, valor, onChange }: {
  titulo: string; opcoes: string[]; valor: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{titulo}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {opcoes.map(op => <TagChip key={op} label={op} ativo={valor === op} onClick={() => onChange(op)} />)}
      </div>
    </div>
  )
}
