'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { STATUS_OPCOES, DURACAO_OPCOES } from './helpers'
import { BotaoSalvar } from './BotaoSalvar'

export function StatusTempSection({
  userId,
  statusAtual,
  expiresAt,
  onSaved,
}: {
  userId: string
  statusAtual: string | null
  expiresAt: string | null
  onSaved: (status: string | null, expiresAt: string | null) => void
}) {
  const statusVivo = statusAtual && expiresAt && new Date(expiresAt) > new Date()
  const [selecionado, setSelecionado] = useState<string | null>(statusVivo ? statusAtual : null)
  const [duracao, setDuracao] = useState(4)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    setSaving(true); setErro('')
    const expires = new Date(Date.now() + duracao * 3600000).toISOString()
    const { error } = await supabase
      .from('profiles')
      .update({ status_temp: selecionado, status_temp_expires_at: selecionado ? expires : null })
      .eq('id', userId)

    if (!error) {
      onSaved(selecionado, selecionado ? expires : null)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2000)
    } else {
      setErro('Erro ao salvar status. Tente novamente.')
    }
    setSaving(false)
  }

  async function remover() {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ status_temp: null, status_temp_expires_at: null })
      .eq('id', userId)
    setSelecionado(null)
    onSaved(null, null)
    setSaving(false)
  }

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: 'rgba(248,249,250,0.50)', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
        Mostre o que você está fazendo hoje. Aparece como tag no seu perfil por tempo limitado.
      </p>

      {statusVivo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.20)',
        }}>
          <span style={{ color: '#F43F5E', fontSize: 13, fontWeight: 600 }}>
            Status ativo: {STATUS_OPCOES.find(s => s.id === statusAtual)?.label}
          </span>
          <button
            onClick={remover}
            disabled={saving}
            style={{ background: 'none', border: 'none', color: 'rgba(248,249,250,0.40)', cursor: 'pointer', fontSize: 13 }}
          >
            Remover
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {STATUS_OPCOES.map(opcao => (
          <button
            key={opcao.id}
            onClick={() => setSelecionado(prev => prev === opcao.id ? null : opcao.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 100,
              border: selecionado === opcao.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.10)',
              background: selecionado === opcao.id ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.04)',
              color: selecionado === opcao.id ? '#F43F5E' : 'rgba(248,249,250,0.65)',
              fontSize: 13, fontWeight: selecionado === opcao.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <span>{opcao.label}</span>
          </button>
        ))}
      </div>

      {selecionado && (
        <>
          <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: 12, margin: '0 0 8px' }}>Duração</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {DURACAO_OPCOES.map(d => (
              <button
                key={d.horas}
                onClick={() => setDuracao(d.horas)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  border: duracao === d.horas ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  background: duracao === d.horas ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.03)',
                  color: duracao === d.horas ? '#F43F5E' : 'rgba(248,249,250,0.50)',
                  fontSize: 12, fontWeight: duracao === d.horas ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
      <BotaoSalvar loading={saving} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}
