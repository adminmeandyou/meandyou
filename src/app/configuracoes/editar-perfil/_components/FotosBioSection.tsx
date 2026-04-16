'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { ProfileData } from './helpers'
import { BotaoSalvar } from './BotaoSalvar'

export function FotosBioSection({ userId, profileData, onSaved }: {
  userId: string
  profileData: ProfileData
  onSaved: (updated: Partial<ProfileData>) => void
}) {
  const fotoSlots = ['photo_face', 'photo_body', 'photo_side', 'photo_extra1', 'photo_extra2', 'photo_extra3']
  const fotoNomes = ['Rosto', 'Corpo inteiro', 'Lateral', 'Extra 1', 'Extra 2', 'Extra 3']

  const [fotosUrls, setFotosUrls] = useState<(string | null)[]>(
    fotoSlots.map(slot => (profileData as any)[slot] ?? null)
  )
  const [fotoPrincipal, setFotoPrincipal] = useState(() => {
    const best = profileData.photo_best
    const idx = fotoSlots.findIndex(slot => (profileData as any)[slot] === best)
    return idx >= 0 ? idx : 0
  })
  const [bio, setBio] = useState(profileData.bio ?? '')
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const fotosComUrl = fotosUrls.filter(u => u).length

  async function handleFoto(index: number, file: File) {
    if (file.size > 5 * 1024 * 1024) { setErro('Foto muito grande. Máximo 5MB.'); return }
    setEnviando(index); setErro('')
    const form = new FormData()
    form.append('foto', file)
    form.append('index', String(index))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/moderar-foto', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: form,
      })
      const data = await res.json()
      if (!data.aprovado) { setErro(data.motivo || 'Foto recusada.'); return }
      const novas = [...fotosUrls]; novas[index] = data.url; setFotosUrls(novas)
    } catch { setErro('Falha de conexão. Tente novamente.') }
    finally { setEnviando(null) }
  }

  function removerFoto(index: number) {
    const novas = [...fotosUrls]; novas[index] = null; setFotosUrls(novas)
    if (fotoPrincipal === index) {
      const next = fotosUrls.findIndex((u, i) => u && i !== index)
      setFotoPrincipal(next >= 0 ? next : 0)
    }
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const update: Record<string, string | null> = {}
    fotoSlots.forEach((slot, i) => { update[slot] = fotosUrls[i] ?? null })
    update['photo_best'] = fotosUrls[fotoPrincipal] ?? fotosUrls.find(Boolean) ?? null
    try {
      const { error: saveErr } = await supabase.from('profiles').update({ bio, profile_question: null, profile_question_answer: null, ...update }).eq('id', userId)
      if (saveErr) throw saveErr
      onSaved({ bio, profile_question: null, profile_question_answer: null, photo_best: update['photo_best'], ...Object.fromEntries(fotoSlots.map((s, i) => [s, fotosUrls[i]])) } as any)
      if (userId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          fetch('/api/badges/trigger', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId, trigger: ['profile_complete', 'photos_gte'] }),
          }).catch(() => {})
        }
      }
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] fotos-bio', err); setErro('Erro ao salvar. Verifique sua conexão e tente novamente.') }
    setSalvando(false)
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* Foto Inteligente — só mostra se houver pelo menos 2 fotos */}
      {fotosComUrl >= 2 && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => {
              const melhores = fotosUrls.map((url, i) => ({ url, i })).filter(x => x.url)
              if (melhores.length > 0 && melhores[0].i !== fotoPrincipal) {
                setFotoPrincipal(melhores[0].i)
              }
            }}
            style={{ backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.20)', color: '#E11D48', borderRadius: '100px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', fontWeight: 500 }}
          >
            ✦ Foto Inteligente - auto-selecionar melhor
          </button>
        </div>
      )}

      {/* Instrucao de fotos */}
      <div style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', borderRadius: '12px' }}>
        <p style={{ color: 'rgba(248,249,250,0.65)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
          <strong style={{ color: '#F8F9FA' }}>Adicione até 6 fotos.</strong> Escolha as fotos que quiser. Conteúdo explícito não é permitido.
        </p>
      </div>

      {/* Grade de fotos */}
      {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 10px', padding: '8px 12px', backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.20)' }}>{erro}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {fotoSlots.map((_, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', border: fotoPrincipal === i ? '2px solid #E11D48' : '1.5px dashed rgba(255,255,255,0.10)' }}>
            {fotosUrls[i] ? (
              <>
                <Image src={fotosUrls[i]!} alt={fotoNomes[i]} fill sizes="150px" style={{ objectFit: 'cover' }} />
                <button
                  onClick={() => removerFoto(i)}
                  style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={12} color="#fff" />
                </button>
                {fotoPrincipal !== i && (
                  <button
                    onClick={() => setFotoPrincipal(i)}
                    style={{ position: 'absolute', bottom: '6px', left: '6px', padding: '2px 8px', borderRadius: '100px', backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(248,249,250,0.7)', fontSize: '10px', cursor: 'pointer' }}
                  >
                    Principal
                  </button>
                )}
                {fotoPrincipal === i && (
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', padding: '2px 8px', borderRadius: '100px', backgroundColor: '#E11D48', fontSize: '10px', color: '#fff', fontWeight: 700 }}>
                    ★ Principal
                  </div>
                )}
              </>
            ) : (
              <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px' }}>
                {enviando === i ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.12)', borderTop: '2px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <Camera size={20} color="rgba(255,255,255,0.25)" />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{fotoNomes[i]}</span>
                  </>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFoto(i, e.target.files[0])} />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Bio */}
      <label style={{ display: 'block', color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bio</label>
      <textarea
        value={bio}
        onChange={e => setBio(e.target.value)}
        maxLength={300}
        placeholder="Fale um pouco sobre você..."
        style={{ width: '100%', minHeight: '100px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', color: '#F8F9FA', fontSize: '14px', fontFamily: 'var(--font-jakarta)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
      />
      <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', textAlign: 'right', margin: '4px 0 10px' }}>{bio.length}/300</p>

      <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
    </div>
  )
}
