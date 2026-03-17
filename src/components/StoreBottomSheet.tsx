'use client'

import { useEffect } from 'react'
import { X, Star, Zap, Search, RotateCcw, Ghost } from 'lucide-react'

export type StoreItemType = 'superlike' | 'boost' | 'lupa' | 'rewind' | 'ghost'

interface Package {
  label: string
  description: string
  price: string
  url: string
  highlight?: boolean
}

const PACKAGES: Record<StoreItemType, { title: string; icon: React.ReactNode; items: Package[] }> = {
  superlike: {
    title: 'SuperLikes',
    icon: <Star size={18} className="text-yellow-400" />,
    items: [
      { label: '1 SuperLike',   description: 'Se destaque para quem você mais quer', price: 'R$ 5',  url: 'https://pay.cakto.com.br/3cg973u' },
      { label: '5 SuperLikes',  description: 'Melhor custo-benefício',               price: 'R$ 10', url: 'https://pay.cakto.com.br/8imgsen', highlight: true },
      { label: '10 SuperLikes', description: 'Para quem quer se destacar muito',     price: 'R$ 15', url: 'https://pay.cakto.com.br/nhx6ei3' },
    ],
  },
  boost: {
    title: 'Boosts',
    icon: <Zap size={18} className="text-white" />,
    items: [
      { label: '1 Boost',   description: '30 min em destaque na sua região', price: 'R$ 6',  url: 'https://pay.cakto.com.br/mdpn9zu' },
      { label: '5 Boosts',  description: 'Melhor custo-benefício',           price: 'R$ 25', url: 'https://pay.cakto.com.br/vyaecjn', highlight: true },
      { label: '10 Boosts', description: 'Estoque completo para o mês',      price: 'R$ 45', url: 'https://pay.cakto.com.br/v2hkztt' },
    ],
  },
  lupa: {
    title: 'Lupas',
    icon: <Search size={18} className="text-blue-400" />,
    items: [
      { label: '1 Lupa',    description: 'Revele um perfil no Destaque', price: 'R$ 7',  url: 'https://pay.cakto.com.br/hnou4rx' },
      { label: '5 Lupas',   description: 'Melhor custo-benefício',       price: 'R$ 17', url: 'https://pay.cakto.com.br/t8mzpty', highlight: true },
      { label: '10 Lupas',  description: 'Para explorar bastante',       price: 'R$ 29', url: 'https://pay.cakto.com.br/skksymv' },
    ],
  },
  rewind: {
    title: 'Desfazer Curtida',
    icon: <RotateCcw size={18} className="text-purple-400" />,
    items: [
      { label: '1 Desfazer',   description: 'Volte atrás em 1 perfil',       price: 'R$ 5',  url: 'https://pay.cakto.com.br/jra25ti' },
      { label: '5 Desfazer',   description: 'Melhor custo-benefício',         price: 'R$ 17', url: 'https://pay.cakto.com.br/tffexvs', highlight: true },
      { label: '10 Desfazer',  description: 'Para quem muda de ideia muito',  price: 'R$ 29', url: 'https://pay.cakto.com.br/7e5fjbx' },
    ],
  },
  ghost: {
    title: 'Modo Fantasma',
    icon: <Ghost size={18} strokeWidth={1.5} style={{ color: '#9ca3af' }} />,
    items: [
      { label: '7 dias',  description: 'Some das buscas temporariamente', price: 'R$ 9',  url: 'https://pay.cakto.com.br/ct79bui' },
      { label: '35 dias', description: 'Melhor custo-benefício',           price: 'R$ 29', url: 'https://pay.cakto.com.br/jesigqc', highlight: true },
      { label: '70 dias', description: 'Invisibilidade por 2+ meses',      price: 'R$ 49', url: 'https://pay.cakto.com.br/8b75h6z' },
    ],
  },
}

interface StoreBottomSheetProps {
  type: StoreItemType
  onClose: () => void
}

export function StoreBottomSheet({ type, onClose }: StoreBottomSheetProps) {
  const section = PACKAGES[type]

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloquear scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-[#13161F] border-t border-white/8 rounded-t-3xl px-5 pt-4 pb-10"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {section.icon}
            <span className="font-fraunces text-xl text-white">{section.title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Pacotes */}
        <div className="space-y-3">
          {section.items.map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition active:scale-[0.98] ${
                item.highlight
                  ? 'bg-[#E11D48]/5 border-[#E11D48]/30'
                  : 'bg-white/3 border-white/8'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  {item.highlight && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#E11D48]/20 text-[#E11D48] font-semibold">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-white/30 text-xs mt-0.5 truncate">{item.description}</p>
              </div>
              <span className={`font-bold text-base shrink-0 ${item.highlight ? 'text-white' : 'text-white'}`}>
                {item.price}
              </span>
            </a>
          ))}
        </div>

        <p className="text-center text-white/20 text-xs mt-5">
          Pagamento via PIX ou cartao · Sem reembolso
        </p>
      </div>
    </>
  )
}
