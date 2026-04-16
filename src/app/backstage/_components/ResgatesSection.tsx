'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  Crown, X, MapPin, User, ChevronRight, Clock, Star,
  MessageCircle, Loader2,
} from 'lucide-react'
import {
  type AccessRequest, type RescuedRequest,
  CATEGORIAS, G, G_SOFT, G_BORDER, G_BORDER2, BG_CARD,
  isRated, daysLeft, catLabel,
} from './helpers'
import RatingSheet from './RatingSheet'

export default function ResgatesSection() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [rescued, setRescued] = useState<RescuedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFor, setRatingFor] = useState<{ id: string; otherId: string } | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [resgateLoading, setResgateLoading] = useState<string | null>(null)
  const [resgateErro, setResgateErro] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user?.id])

  async function load() {
    setLoading(true)
    try {
      const [{ data: avail }, { data: mine }] = await Promise.all([
        supabase.rpc('get_available_requests', { p_user_id: user!.id }),
        supabase.rpc('get_my_rescued_requests', { p_user_id: user!.id }),
      ])
      setRequests(avail ?? [])
      const myRescued = mine ?? []
      setRescued(myRescued)
      const done = new Set<string>(myRescued.filter((r: RescuedRequest) => isRated(r.id)).map((r: RescuedRequest) => r.id))
      setRatedIds(done)
    } catch {
      setRequests([])
      setRescued([])
    }
    setLoading(false)
  }

  async function handleResgate(req: AccessRequest) {
    if (!user || resgateLoading) return
    setResgateLoading(req.id)
    setResgateErro(null)
    const { data, error } = await supabase.rpc('rescue_access_request', {
      p_rescuer_id: user.id,
      p_request_id: req.id,
    })
    setResgateLoading(null)
    if (error || !data?.ok) {
      const msg = data?.error === 'fichas_insuficientes'
        ? 'Fichas insuficientes. Compre mais na loja.'
        : data?.error === 'pedido_ja_resgatado'
        ? 'Este pedido já foi resgatado por outra pessoa.'
        : 'Erro ao resgatar. Tente novamente.'
      setResgateErro(msg)
      return
    }
    load()
  }

  function handleRated(requestId: string) {
    setRatedIds(prev => new Set([...prev, requestId]))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: G }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px', paddingBottom: 40 }}>

      {/* Header da secao */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Pedidos de acesso
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: G, fontWeight: 600 }}>
            {requests.length} aguardando
          </span>
          <button
            onClick={load}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <ChevronRight size={14} color={G} strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 18, background: BG_CARD, border: `1px solid ${G_BORDER2}`, marginBottom: 24 }}>
          <Crown size={28} color={G_BORDER} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', margin: '0 0 4px', fontWeight: 600 }}>
            Nenhum pedido no momento
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, margin: 0 }}>
            Quando alguem pedir acesso em suas categorias, aparece aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {requests.map(req => (
            <div
              key={req.id}
              style={{ padding: '14px 14px', borderRadius: 16, background: BG_CARD, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={19} color={G} strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-fraunces)' }}>
                    {req.display_name}{req.age ? `, ${req.age}` : ''}
                  </span>
                  {req.tier === 'premium' && (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontWeight: 600 }}>
                      Plus
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {req.city && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={9} strokeWidth={1.5} />
                      {req.city}{req.state ? `, ${req.state}` : ''}
                    </span>
                  )}
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 100, background: G_SOFT, color: G, fontWeight: 600 }}>
                    {catLabel(req.category)}
                  </span>
                </div>
              </div>

              {/* Botao de resgate */}
              <button
                onClick={() => handleResgate(req)}
                disabled={!!resgateLoading}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: resgateLoading === req.id ? 'rgba(245,158,11,0.4)' : `linear-gradient(135deg, #c9a84c, ${G})`,
                  color: '#fff',
                  fontFamily: 'var(--font-jakarta)',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: resgateLoading ? 'default' : 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  minWidth: 72,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                {resgateLoading === req.id
                  ? <Loader2 size={14} style={{ animation: 'ui-spin 1s linear infinite' }} />
                  : <><span>Resgatar</span><span style={{ fontWeight: 500 }}>70 fichas</span></>
                }
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Meus resgates ativos */}
      {rescued.length > 0 && (
        <>
          <div style={{ marginBottom: 14, padding: '0 2px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Meus resgates ativos
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rescued.map(r => (
              <div
                key={r.id}
                style={{ padding: '14px 16px', borderRadius: 16, background: BG_CARD, border: `1px solid ${G_BORDER2}`, display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: G_SOFT, border: `1px solid ${G_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Crown size={16} color={G} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-fraunces)' }}>
                    {r.display_name}{r.age ? `, ${r.age}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>{catLabel(r.category)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} strokeWidth={1.5} />
                      {daysLeft(r.expires_at)} dias restantes
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!ratedIds.has(r.id) && (
                    <button
                      onClick={() => setRatingFor({ id: r.id, otherId: r.requester_id })}
                      title="Avaliar conversa"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${G_BORDER}`, background: G_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Star size={15} color={G} strokeWidth={1.5} />
                    </button>
                  )}
                  <a
                    href={`/backstage/chat/${r.id}`}
                    style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, #c9a84c, ${G})`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <MessageCircle size={16} color="#fff" strokeWidth={2} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Nota explicativa */}
      <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', lineHeight: 1.6, margin: 0 }}>
          Ao resgatar, você usa 70 fichas para iniciar uma conversa por 30 dias. Isso não é garantia de encontro, apenas o início de uma conversa.
        </p>
      </div>

      {/* Erro de resgate */}
      {resgateErro && (
        <div style={{ margin: '12px 0', padding: '12px 14px', borderRadius: 12, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <p style={{ fontSize: 13, color: '#f87171', margin: 0, lineHeight: 1.5 }}>{resgateErro}</p>
          <button onClick={() => setResgateErro(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} color="#f87171" />
          </button>
        </div>
      )}

      {/* Rating sheet */}
      {ratingFor && (
        <RatingSheet
          ratingFor={ratingFor}
          onClose={() => setRatingFor(null)}
          onRated={handleRated}
        />
      )}
    </div>
  )
}
