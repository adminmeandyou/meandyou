'use client'

/**
 * OnlineIndicator — exibe status de atividade do usuário.
 *
 * Regras:
 *  - Se show_last_active = false, não exibe nada
 *  - < 5min → ponto verde + "Online agora"
 *  - hoje → ponto âmbar + "Ativo hoje"
 *  - ontem → sem ponto + "Ativo ontem"
 *  - esta semana → sem ponto + "Ativo esta semana"
 *  - > 7 dias → nada exibido
 *
 * Modo dot: apenas o ponto (para sobrepor em avatares)
 * Modo text: texto + ponto inline (para cards e cabeçalhos de chat)
 */

interface OnlineIndicatorProps {
  lastActiveAt: string | null | undefined
  showLastActive?: boolean   // profiles.show_last_active
  mode?: 'dot' | 'text'     // dot = só bolinha, text = texto completo
  size?: number              // tamanho do dot em px (padrão 10)
}

type Status = 'recent' | 'today' | 'yesterday' | 'week' | 'hidden'

function getStatus(lastActiveAt: string | null | undefined): Status {
  if (!lastActiveAt) return 'hidden'
  const diff = Date.now() - new Date(lastActiveAt).getTime()
  const minutes = diff / 60_000
  if (minutes < 5) return 'recent'
  const hours = diff / 3_600_000
  if (hours < 24) return 'today'
  if (hours < 48) return 'yesterday'
  if (hours < 168) return 'week'
  return 'hidden'
}

const STATUS_COLOR: Record<Exclude<Status, 'hidden'>, string> = {
  recent:    '#22c55e',  // verde
  today:     '#f59e0b',  // âmbar
  yesterday: 'transparent',
  week:      'transparent',
}

const STATUS_LABEL: Record<Exclude<Status, 'hidden'>, string> = {
  recent:    'Online agora',
  today:     'Ativo hoje',
  yesterday: 'Ativo ontem',
  week:      'Ativo esta semana',
}

export function OnlineIndicator({
  lastActiveAt,
  showLastActive = true,
  mode = 'dot',
  size = 10,
}: OnlineIndicatorProps) {
  if (!showLastActive) return null

  const status = getStatus(lastActiveAt)
  if (status === 'hidden') return null

  const color = STATUS_COLOR[status]
  const label = STATUS_LABEL[status]
  const hasDot = color !== 'transparent'

  if (mode === 'dot') {
    if (!hasDot) return null
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid var(--bg)',
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: color === '#22c55e' ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
        }}
      />
    )
  }

  // mode === 'text'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        color: 'var(--muted)',
        fontFamily: 'var(--font-jakarta)',
      }}
    >
      {hasDot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
            boxShadow: color === '#22c55e' ? '0 0 5px rgba(34,197,94,0.5)' : 'none',
          }}
        />
      )}
      {label}
    </span>
  )
}
