'use client'

import { ReactNode } from 'react'
import { SkeletonLoader } from './SkeletonLoader'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  loading?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  loading = false,
}: EmptyStateProps) {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '48px 24px',
        }}
      >
        <SkeletonLoader variant="avatar" width={56} />
        <SkeletonLoader variant="text" width={160} height={18} />
        <SkeletonLoader variant="text" width={220} height={13} />
        <SkeletonLoader variant="rect" width={140} height={40} borderRadius={12} />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'rgba(225,29,72,0.08)',
          border: '1px solid rgba(225,29,72,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'var(--font-jakarta)',
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--muted)',
              fontFamily: 'var(--font-jakarta)',
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-jakarta)',
            border: 'none',
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            opacity: action.disabled ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
