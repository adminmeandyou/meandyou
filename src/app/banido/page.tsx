'use client'

import { ShieldX } from 'lucide-react'

export default function BanidoPage() {
  return (
    <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center px-6 font-jakarta">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <ShieldX size={28} className="text-red-400" />
        </div>
        <h1 className="font-fraunces text-2xl text-white mb-3">Conta suspensa</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          Sua conta foi suspensa por violar os termos de uso do MeAndYou. Se acredita que isso é um erro, entre em contato com o suporte.
        </p>
        <a
          href="mailto:suporte@meandyou.com.br"
          className="inline-block px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white transition"
        >
          Contatar suporte
        </a>
      </div>
    </div>
  )
}