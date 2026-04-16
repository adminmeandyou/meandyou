'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { findSingle, findMulti } from './helpers'
import { TagChip } from './TagChip'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'
import { GrupoOpcoes } from './GrupoOpcoes'

export function FisicoSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapOlhos: Record<string, string> = {
    eye_black: 'Olhos pretos', eye_brown: 'Olhos castanhos', eye_green: 'Olhos verdes',
    eye_blue: 'Olhos azuis', eye_honey: 'Olhos mel', eye_gray: 'Olhos acinzentados', eye_heterochromia: 'Heterocromia',
  }
  const mapCabelo: Record<string, string> = {
    hair_black: 'Cabelo preto', hair_brown: 'Cabelo castanho', hair_blonde: 'Cabelo loiro',
    hair_red: 'Cabelo ruivo', hair_colored: 'Cabelo colorido', hair_gray: 'Cabelo grisalho', hair_bald: 'Careca',
  }
  const mapComprimento: Record<string, string> = {
    hair_short: 'Cabelo curto', hair_medium: 'Cabelo médio', hair_long: 'Cabelo longo',
  }
  const mapTipo: Record<string, string> = {
    hair_straight: 'Cabelo liso', hair_wavy: 'Cabelo ondulado', hair_curly: 'Cabelo cacheado', hair_coily: 'Cabelo crespo',
  }
  const mapPele: Record<string, string> = {
    skin_white: 'Branca', skin_mixed: 'Parda', skin_black: 'Negra',
    skin_asian: 'Asiática', skin_indigenous: 'Indígena', skin_mediterranean: 'Mediterrânea',
  }
  const mapCorpo: Record<string, string> = {
    body_underweight: 'Abaixo do peso', body_healthy: 'Peso saudável', body_overweight: 'Acima do peso',
    body_obese_mild: 'Obesidade leve', body_obese_severe: 'Obesidade severa',
  }
  const mapCaract: Record<string, string> = {
    feat_freckles: 'Sardas', feat_tattoo: 'Tatuagem', feat_piercing: 'Piercing',
    feat_scar: 'Cicatriz', feat_glasses: 'Óculos', feat_braces: 'Aparelho dentário', feat_beard: 'Barba',
  }

  const [corOlhos, setCorOlhos] = useState(() => findSingle(filtersData, mapOlhos))
  const [corCabelo, setCorCabelo] = useState(() => findSingle(filtersData, mapCabelo))
  const [comprimento, setComprimento] = useState(() => findSingle(filtersData, mapComprimento))
  const [tipoCabelo, setTipoCabelo] = useState(() => findSingle(filtersData, mapTipo))
  const [corPele, setCorPele] = useState(() => findSingle(filtersData, mapPele))
  const [corporal, setCorporal] = useState(() => findSingle(filtersData, mapCorpo))
  const [caract, setCaract] = useState<string[]>(() => findMulti(filtersData, mapCaract))
  const [altura, setAltura] = useState<string>(filtersData?.height_cm?.toString() ?? '')
  const [peso, setPeso] = useState<string>(filtersData?.weight_kg?.toString() ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function toggleCaract(val: string) {
    setCaract(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapOlhos).forEach(([k, v]) => { u[k] = corOlhos === v })
    Object.entries(mapCabelo).forEach(([k, v]) => { u[k] = corCabelo === v })
    Object.entries(mapComprimento).forEach(([k, v]) => { u[k] = comprimento === v })
    Object.entries(mapTipo).forEach(([k, v]) => { u[k] = tipoCabelo === v })
    Object.entries(mapPele).forEach(([k, v]) => { u[k] = corPele === v })
    Object.entries(mapCorpo).forEach(([k, v]) => { u[k] = corporal === v })
    Object.entries(mapCaract).forEach(([k, v]) => { u[k] = caract.includes(v) })
    if (altura) u.height_cm = parseInt(altura)
    if (peso) u.weight_kg = parseInt(peso)
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] fisico', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Cor dos olhos" opcoes={Object.values(mapOlhos)} valor={corOlhos} onChange={setCorOlhos} />
        <GrupoOpcoes titulo="Cor do cabelo" opcoes={Object.values(mapCabelo)} valor={corCabelo} onChange={setCorCabelo} />
        <GrupoOpcoes titulo="Comprimento do cabelo" opcoes={Object.values(mapComprimento)} valor={comprimento} onChange={setComprimento} />
        <GrupoOpcoes titulo="Tipo do cabelo" opcoes={Object.values(mapTipo)} valor={tipoCabelo} onChange={setTipoCabelo} />
        <GrupoOpcoes titulo="Cor da pele" opcoes={Object.values(mapPele)} valor={corPele} onChange={setCorPele} />
        <GrupoOpcoes titulo="Tipo corporal" opcoes={Object.values(mapCorpo)} valor={corporal} onChange={setCorporal} />
        <div>
          <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Características</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.values(mapCaract).map(op => (
              <TagChip key={op} label={op} ativo={caract.includes(op)} onClick={() => toggleCaract(op)} />
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Altura (cm)</label>
            <input type="number" value={altura} onChange={e => setAltura(e.target.value)} placeholder="Ex: 170"
              style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F8F9FA', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Peso (kg)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 65"
              style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F8F9FA', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>
      </div>
      {!bloqueado && (
        <>
          {erro && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{erro}</p>}
          <BotaoSalvar loading={salvando} sucesso={sucesso} onClick={salvar} />
        </>
      )}
    </div>
  )
}
