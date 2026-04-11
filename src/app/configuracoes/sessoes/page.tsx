'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Monitor, Smartphone, X } from 'lucide-react'

interface Sessao {
  id: string
  ip: string | null
  user_agent: string | null
  device_info: string | null
  created_at: string
  last_active_at: string
}

function detectarDispositivo(ua: string | null): { icone: 'mobile' | 'desktop', nome: string } {
  if (!ua) return { icone: 'desktop', nome: 'Dispositivo desconhecido' }
  const uaLower = ua.toLowerCase()
  if (/android|iphone|ipad|mobile/i.test(uaLower)) {
    if (/iphone/i.test(uaLower)) return { icone: 'mobile', nome: 'iPhone' }
    if (/ipad/i.test(uaLower)) return { icone: 'mobile', nome: 'iPad' }
    if (/android/i.test(uaLower)) return { icone: 'mobile', nome: 'Android' }
    return { icone: 'mobile', nome: 'Mobile' }
  }
  if (/windows/i.test(uaLower)) return { icone: 'desktop', nome: 'Windows' }
  if (/mac os/i.test(uaLower)) return { icone: 'desktop', nome: 'Mac' }
  if (/linux/i.test(uaLower)) return { icone: 'desktop', nome: 'Linux' }
  return { icone: 'desktop', nome: 'Computador' }
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SessoesPage() {
  const router = useRouter()
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [encerrando, setEncerrando] = useState<string | null>(null)

  async function carregar() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    try {
      const res = await fetch('/api/auth/sessoes', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      const sessoesApi: Sessao[] = json.sessoes ?? []

      // Se a API não retornou nada, mostra pelo menos a sessão atual
      if (sessoesApi.length === 0) {
        const ua = navigator.userAgent
        const sessaoAtual: Sessao = {
          id: 'current',
          ip: null,
          user_agent: ua,
          device_info: null,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        }
        setSessoes([sessaoAtual])
      } else {
        setSessoes(sessoesApi)
      }
    } catch {
      // Em caso de erro, mostra a sessão atual
      const sessaoAtual: Sessao = {
        id: 'current',
        ip: null,
        user_agent: navigator.userAgent,
        device_info: null,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      }
      setSessoes([sessaoAtual])
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function encerrar(id: string) {
    if (id === 'current') { setSessoes([]); return }
    setEncerrando(id)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/auth/sessoes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    setSessoes(s => s.filter(x => x.id !== id))
    setEncerrando(null)
  }

  async function encerrarTodas() {
    const { data: { session } } = await supabase.auth.getSession()
    const promises = sessoes
      .filter(s => s.id !== 'current')
      .map(s => fetch(`/api/auth/sessoes/${s.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }))
    await Promise.all(promises)
    setSessoes([])
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: 0 }}>Sessões ativas</h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && sessoes.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>
            Nenhuma sessão ativa registrada.
          </div>
        )}

        {!loading && sessoes.length > 0 && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
              Estas são as sessões ativas na sua conta. Encerre sessões desconhecidas imediatamente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {sessoes.map(sessao => {
                const dev = detectarDispositivo(sessao.user_agent)
                return (
                  <div
                    key={sessao.id}
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {dev.icone === 'mobile'
                        ? <Smartphone size={20} color="rgba(255,255,255,0.5)" />
                        : <Monitor size={20} color="rgba(255,255,255,0.5)" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: 0 }}>{dev.nome}</p>
                        {sessao.id === 'current' && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '1px 7px' }}>Este dispositivo</span>
                        )}
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '0 0 2px' }}>
                        IP: {sessao.ip ?? 'desconhecido'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>
                        Último acesso: {formatarData(sessao.last_active_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => encerrar(sessao.id)}
                      disabled={encerrando === sessao.id}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: encerrando === sessao.id ? 0.5 : 1 }}
                    >
                      <X size={16} color="#f87171" />
                    </button>
                  </div>
                )
              })}
            </div>

            {sessoes.length > 1 && (
              <button
                onClick={encerrarTodas}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Encerrar todas as sessões
              </button>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
