'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

type FAQ = { pergunta: string; resposta: string; categoria: string }

const FAQS: FAQ[] = [
  // Conta
  {
    categoria: 'Conta',
    pergunta: 'Como faco para verificar minha identidade?',
    resposta: 'Apos o cadastro, acesse a tela de verificacao e siga o processo de liveness detection com sua camera. Apos enviar, nossa equipe aprova em ate 24h. A verificacao e obrigatoria para usar o app.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Posso ter mais de uma conta?',
    resposta: 'Nao. Cada CPF so pode estar vinculado a uma conta. Contas duplicadas sao removidas automaticamente.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como altero minha senha?',
    resposta: 'Na tela de login, clique em "Esqueci minha senha". Voce recebera um email com o link para redefinir. O link expira em 30 minutos.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como excluo minha conta?',
    resposta: 'Acesse Configuracoes > Excluir conta. Voce precisara confirmar sua senha. Todos os seus dados serao removidos permanentemente em conformidade com a LGPD. Esta acao nao pode ser desfeita.',
  },
  // Planos
  {
    categoria: 'Planos',
    pergunta: 'Qual a diferenca entre os planos?',
    resposta: 'Essencial: 5 curtidas/dia, 1 ticket de roleta. Plus: 30 curtidas/dia, ver quem curtiu, area de destaques, 2 tickets/dia. Black: curtidas ilimitadas, Backstage exclusivo, 10 SuperCurtidas/dia, suporte prioritario 24h, 3 tickets/dia.',
  },
  {
    categoria: 'Planos',
    pergunta: 'Como cancelo minha assinatura?',
    resposta: 'O cancelamento e feito diretamente pela plataforma Cakto (processadora de pagamentos). Acesse o email de confirmacao da assinatura e clique em "Gerenciar assinatura". Apos o cancelamento, o plano fica ativo ate o fim do periodo pago.',
  },
  {
    categoria: 'Planos',
    pergunta: 'Posso pedir reembolso?',
    resposta: 'Assinaturas nao sao reembolsaveis apos ativacao. Compras avulsas (fichas, SuperLikes, Boosts etc.) tambem nao tem reembolso. Em caso de cobranca indevida, entre em contato pelo suporte.',
  },
  // Funcionalidades
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que e o Boost?',
    resposta: 'O Boost coloca seu perfil em destaque por 30 minutos na busca da sua regiao, aumentando sua visibilidade. Plano Black pode ter ate 2 Boosts ativos ao mesmo tempo.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que e a Lupa?',
    resposta: 'A Lupa revela um perfil borrado na area de Destaques, permitindo ver quem e a pessoa antes de curtir. Voce ganha lupas pelo calendario de streak, roleta ou comprando na loja.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona o streak?',
    resposta: 'Entre no app todo dia para manter sua sequencia. A cada dia voce ganha um premio do calendario mensal. Se ficar mais de 7 dias sem entrar, o streak reseta para zero.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona a roleta?',
    resposta: 'Use tickets para girar a roleta e ganhar premios (SuperLikes, Boosts, Lupas e mais). Voce ganha tickets todo dia so por entrar no app, pelo calendario de streak e ao indicar amigos.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que e o Backstage?',
    resposta: 'Area exclusiva para assinantes Black. Nela voce ve perfis de usuarios Essencial e Plus que fizeram um pedido de conexao especial. Ao pagar R$ 15, voce acessa o chat com essa pessoa por 30 dias.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'Como funciona a videochamada?',
    resposta: 'Disponivel para matches confirmados. Plano Essencial: 60min/dia. Plus: 300min/dia. Black: 600min/dia. Os minutos sao descontados automaticamente ao encerrar a chamada.',
  },
  {
    categoria: 'Funcionalidades',
    pergunta: 'O que sao fichas?',
    resposta: 'Fichas sao a moeda do MeAndYou. Voce compra pacotes de fichas e usa para adquirir itens na loja, como SuperLikes, Boosts, Lupas e outros recursos especiais.',
  },
  // Seguranca
  {
    categoria: 'Seguranca',
    pergunta: 'Como denuncio um usuario?',
    resposta: 'Acesse o perfil da pessoa, role ate o final e toque em "Denunciar". Nossa equipe analisa todas as denuncias e pode banir o usuario permanentemente.',
  },
  {
    categoria: 'Seguranca',
    pergunta: 'Como bloqueio alguem?',
    resposta: 'No perfil da pessoa ou na conversa, toque no menu e selecione "Bloquear". O usuario nao sera notificado e nao podera mais ver seu perfil ou enviar mensagens.',
  },
  {
    categoria: 'Seguranca',
    pergunta: 'Meus dados sao seguros?',
    resposta: 'Sim. Usamos verificacao biometrica para garantir que cada conta pertence a uma pessoa real. Seus dados sao armazenados com seguranca e nunca vendidos a terceiros. Para mais informacoes, consulte nossa Politica de Privacidade.',
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '96px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>Central de Ajuda</h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>Perguntas frequentes</p>
        </div>
      </header>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Busca */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="rgba(248,249,250,0.25)" strokeWidth={1.5} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar duvida..."
            style={{
              width: '100%', boxSizing: 'border-box',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '14px', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
              color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-jakarta)',
            }}
          />
        </div>

        {/* Filtro categorias */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              style={{
                padding: '6px 14px', borderRadius: '100px', fontSize: '12px', border: '1px solid',
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'var(--font-jakarta)', fontWeight: 600, transition: 'all 0.15s',
                backgroundColor: categoriaAtiva === cat ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.04)',
                borderColor: categoriaAtiva === cat ? 'rgba(225,29,72,0.35)' : 'rgba(255,255,255,0.08)',
                color: categoriaAtiva === cat ? 'var(--accent)' : 'rgba(248,249,250,0.40)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista FAQ */}
        {filtradas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: '12px', color: 'var(--muted)' }}>
            <HelpCircle size={32} strokeWidth={1.5} color="rgba(248,249,250,0.20)" />
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'rgba(248,249,250,0.30)', margin: 0 }}>
              Nenhuma duvida encontrada.<br />Tente outros termos ou fale com o suporte.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtradas.map((faq) => {
              const index = FAQS.indexOf(faq)
              const isOpen = aberta === index
              return (
                <div key={index} style={{ borderRadius: '16px', border: `1px solid ${isOpen ? 'rgba(225,29,72,0.20)' : 'var(--border)'}`, overflow: 'hidden', backgroundColor: isOpen ? 'rgba(225,29,72,0.04)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                  <button
                    onClick={() => setAberta(isOpen ? null : index)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', gap: '12px' }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: isOpen ? 'var(--text)' : 'rgba(248,249,250,0.75)', fontFamily: 'var(--font-jakarta)', flex: 1 }}>
                      {faq.pergunta}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} color="var(--accent)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                      : <ChevronDown size={16} color="rgba(248,249,250,0.25)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    }
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      {faq.resposta}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA suporte */}
        <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageCircle size={18} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, margin: 0 }}>Nao encontrou o que precisava?</p>
            <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '2px 0 0' }}>Nossa equipe responde em ate 24h</p>
          </div>
          <a
            href="/suporte"
            style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta)', flexShrink: 0 }}
          >
            Abrir chamado
          </a>
        </div>

        {/* Links legais */}
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
          <Link href="/termos" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', textDecoration: 'none' }}>
            <FileText size={13} strokeWidth={1.5} /> Termos de uso
          </Link>
          <Link href="/privacidade" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', textDecoration: 'none' }}>
            <Shield size={13} strokeWidth={1.5} /> Privacidade
          </Link>
        </div>

      </div>
    </div>
  )
}
