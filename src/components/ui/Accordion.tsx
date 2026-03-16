'use client'

import { ReactNode, useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultOpen?: string[]
  multiple?: boolean
}

function AccordionItemComponent({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: hovered ? 'var(--text)' : 'rgba(248,249,250,0.80)',
          fontFamily: 'var(--font-jakarta)',
          fontSize: 15,
          fontWeight: 500,
          textAlign: 'left',
          transition: 'color 0.15s',
          gap: 12,
        }}
      >
        <span>{item.title}</span>
        <span
          style={{
            flexShrink: 0,
            display: 'flex',
            color: isOpen ? 'var(--accent)' : 'var(--muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s, color 0.15s',
          }}
        >
          <ChevronDown size={18} strokeWidth={1.5} />
        </span>
      </button>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? 600 : 0,
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          ref={contentRef}
          style={{
            paddingBottom: 16,
            color: 'var(--muted)',
            fontFamily: 'var(--font-jakarta)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {item.content}
        </div>
      </div>
    </div>
  )
}

export function Accordion({ items, defaultOpen = [], multiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpen))

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!multiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  )
}
