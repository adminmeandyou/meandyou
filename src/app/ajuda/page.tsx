'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react'

type FAQ = { pergunta: string; resposta: string; categoria: string }

const FAQS: FAQ[] = [
  // Conta
  {
    categoria: 'Conta',
    pergunta: 'Como faço para verificar minha identidade?',
    resposta: 'Após o cadastro, acesse a tela de verificação e siga o processo de liveness detection com sua câmera. Após enviar, nossa equipe aprova em até 24h. A verificação é obrigatória para usar o app.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Posso ter mais de uma conta?',
    resposta: 'Não. Cada CPF só pode estar vinculado a uma conta. Contas duplicadas são removidas automaticamente.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como altero minha senha?',
    resposta: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um email com o link para redefinir. O link expira em 30 minutos.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como excluo minha conta?',
    resposta: 'Acesse Configurações → Excluir conta. Você precisará confirmar sua senha. Todos os seus dados serão removidos permanentemente em conformidade com a LGPD. Esta ação não pode ser desfeita.',
  },
  // Planos
  {
    categoria: 'Planos',
    pergunta: 'Qual a diferença entre os planos?',
    resposta: 'Essencial: 5 curtidas/dia, 1 ticket de roleta. Plus: 30 curtidas/dia, ver quem curtiu, área de destaques, 2 tickets/dia. Black: curtidas ilimitadas, Backstage exclusivo, 10 SuperCurtidas/dia, suporte prioritário 24h, 3 tickets/dia.',
  },
  {
    categoria: 'Planos',
    pergunta: 'Como cancelo minha assinatura?',
    resposta: 'O cancelamento é feito diretamente pela plataforma Cakto (processadora de pagamentos). Acesse o email de confirmação da assinatura e clique em "Gerenciar assinatura". Após o cancelamento, o plano fica ativo até o fim do período pago.',
  },
  {
    categoria: 'Planos',
    pergunta: 'Posso pedir reembolso?',
    resposta: 'Assinaturas não são reembolsáveis após ativação. Compras avulsas (SuperLikes, Boosts etc.) também não têm reembolso. Em caso de cobrança indevida, entre em contato pelo suporte.',
  },
  // Funcionalidades
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que é o Boost?',
    resposta: 'O Boost coloca seu perfil em destaque por 30 minutos na busca da sua região, aumentando sua visibilidade. Plano Black pode ter até 2 Boosts ativos ao mesmo tempo.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que é a Lupa?',
    resposta: 'A Lupa revela um perfil borrado na área de Destaques, permitindo ver quem é a pessoa antes de curtir. Você ganha lupas pelo calendário de streak, roleta ou comprando na loja.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona o streak?',
    resposta: 'Entre no app todo dia para manter sua sequência. A cada dia você ganha um prêmio do calendário mensal. Se ficar mais de 7 dias sem entrar, o streak reseta para zero.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona a roleta?',
    resposta: 'Use tickets para girar a roleta e ganhar prêmios (SuperLikes, Boosts, Lupas e mais). Você ganha tickets todo dia só por entrar no app, pelo calendário de streak e ao indicar amigos.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que é o Backstage?',
    resposta: 'Área exclusiva para assinantes Black. Nela você vê perfis de usuários Essencial e Plus que fizeram um pedido de conexão especial. Ao pagar R$ 15, você acessa o chat com essa pessoa por 30 dias.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona a videochamada?',
    resposta: 'Disponível para matches confirmados. Plano Essencial: 60min/dia. Plus: 300min/dia. Black: 600min/dia. Os minutos são descontados automaticamente ao encerrar a chamada.',
  },
  // Segurança
  {
    categoria: 'Segurança',
    pergunta: 'Como denuncio um usuário?',
    resposta: 'Acesse o perfil da pessoa, role até o final e toque em "Denunciar". Nossa equipe analisa todas as denúncias e pode banir o usuário permanentemente.',
  },
  {
    categoria: 'Segurança',
    pergunta: 'Como bloqueio alguém?',
    resposta: 'No perfil da pessoa ou na conversa, toque no menu (⋮) e selecione "Bloquear". O usuário não será notificado e não poderá mais ver seu perfil ou enviar mensagens.',
  },
  {
    categoria: 'Segurança',
    pergunta: 'Meus dados são seguros?',
    resposta: 'Sim. Usamos verificação biométrica para garantir que cada conta pertence a uma pessoa real. Seus dados são armazenados com segurança e nunca vendidos a terceiros. Para mais informações, consulte nossa Política de Privacidade.',
  },
]

const CATEGORIAS = ['Todas', ...Array.from(new Set(FAQS.map((f) => f.categoria)))]

export default function AjudaPage() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas')
  const [aberta, setAberta] = useState<number | null>(null)

  const filtradas = FAQS.filter((f) => {
    const matchCategoria = categoriaAtiva === 'Todas' || f.categoria === categoriaAtiva
    const matchBusca = busca.trim() === '' || f.pergunta.toLowerCase().includes(busca.toLowerCase()) || f.resposta.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  })

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Central de Ajuda</h1>
          <p className="text-white/30 text-xs">Perguntas frequentes</p>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-4">

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar dúvida…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#b8f542]/40"
          />
        </div>

        {/* Filtro categorias */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition shrink-0 ${
                categoriaAtiva === cat
                  ? 'bg-[#b8f542]/20 border-[#b8f542]/40 text-[#b8f542] font-semibold'
                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista FAQ */}
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-white/20">
            <HelpCircle size={32} />
            <p className="text-sm text-center">Nenhuma dúvida encontrada.<br />Tente outros termos ou fale com o suporte.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map((faq, i) => {
              const index = FAQS.indexOf(faq)
              const isOpen = aberta === index
              return (
                <div key={index} className="rounded-2xl border border-white/8 overflow-hidden">
                  <button
                    onClick={() => setAberta(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-white/3 transition"
                  >
                    <span className={`text-sm font-semibold pr-4 ${isOpen ? 'text-white' : 'text-white/70'}`}>
                      {faq.pergunta}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-[#b8f542] shrink-0" />
                      : <ChevronDown size={16} className="text-white/20 shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA suporte */}
        <div className="rounded-2xl p-4 bg-white/3 border border-white/8 flex items-center gap-3">
          <MessageCircle size={20} className="text-white/30 shrink-0" />
          <div className="flex-1">
            <p className="text-white/60 text-sm">Não encontrou o que precisava?</p>
          </div>
          <a
            href="/suporte"
            className="px-3 py-2 rounded-xl bg-[#b8f542]/10 border border-[#b8f542]/30 text-[#b8f542] text-xs font-bold hover:bg-[#b8f542]/20 transition whitespace-nowrap"
          >
            Falar com suporte
          </a>
        </div>

      </div>
    </div>
  )
}
