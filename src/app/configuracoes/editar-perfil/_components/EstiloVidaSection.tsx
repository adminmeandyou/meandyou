'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { findSingle, findMulti } from './helpers'
import { TagChip } from './TagChip'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'
import { GrupoOpcoes } from './GrupoOpcoes'
import { GrupoMulti } from './GrupoMulti'

export function EstiloVidaSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapFumo: Record<string, string> = { smoke_yes: 'Fumo', smoke_occasionally: 'Fumo ocasionalmente', smoke_no: 'Não fumo' }
  const mapBebida: Record<string, string> = { drink_yes: 'Consumo bebida alcoólica', drink_socially: 'Bebo socialmente', drink_no: 'Não consumo bebida alcoólica' }
  const mapRotina: Record<string, string> = {
    routine_gym: 'Academia', routine_sports: 'Esporte regularmente', routine_sedentary: 'Sedentário(a)',
    routine_homebody: 'Caseiro(a)', routine_goes_out: 'Gosto de sair', routine_party: 'Balada',
    routine_night_owl: 'Noturno(a)', routine_morning: 'Matutino(a)', routine_workaholic: 'Workaholic', routine_balanced: 'Vida equilibrada',
  }
  const mapPersonalidade: Record<string, string> = {
    pers_extrovert: 'Extrovertido(a)', pers_introvert: 'Introvertido(a)', pers_ambivert: 'Ambiverte',
    pers_shy: 'Tímido(a)', pers_communicative: 'Comunicativo(a)', pers_antisocial: 'Antissocial',
    pers_reserved: 'Reservado(a)', pers_agitated: 'Agitado(a)', pers_calm: 'Calmo(a)', pers_intense: 'Intenso(a)',
  }
  const mapHobbies: Record<string, string> = {
    hob_gamer: 'Gamer', hob_reader: 'Leitor(a)', hob_movies: 'Filmes', hob_series: 'Séries',
    hob_anime: 'Anime/Mangá', hob_live_music: 'Música ao vivo', hob_photography: 'Fotografia',
    hob_art: 'Arte', hob_dance: 'Dança', hob_travel: 'Viagens', hob_hiking: 'Trilha/Natureza',
    hob_meditation: 'Meditação/Yoga', hob_kpop: 'K-pop', hob_otaku: 'Otaku',
  }
  const mapEsporte: Record<string, string> = {
    sport_football_yes: 'Gosto de futebol', sport_running: 'Corrida', sport_swimming: 'Natação',
    sport_cycling: 'Ciclismo', sport_martial_arts: 'Artes marciais', sport_none: 'Não pratico esportes',
  }
  const mapAlim: Record<string, string> = {
    diet_vegan: 'Vegano(a)', diet_vegetarian: 'Vegetariano(a)', diet_carnivore: 'Carnívoro(a)',
    diet_everything: 'Como de tudo', diet_healthy: 'Alimentação saudável', food_cooks: 'Cozinho bem',
  }
  const mapEstilo: Record<string, string> = {
    style_casual: 'Casual', style_formal: 'Social', style_sporty: 'Esportivo',
    style_alternative: 'Alternativo', style_eclectic: 'Eclético', style_gothic: 'Gótico', style_punk: 'Punk',
  }

  const [fumo, setFumo] = useState(() => findSingle(filtersData, mapFumo))
  const [bebida, setBebida] = useState(() => findSingle(filtersData, mapBebida))
  const [cannabis, setCannabis] = useState(filtersData?.drug_cannabis ?? false)
  const [rotina, setRotina] = useState<string[]>(() => findMulti(filtersData, mapRotina))
  const [personalidade, setPersonalidade] = useState<string[]>(() => findMulti(filtersData, mapPersonalidade))
  const [hobbies, setHobbies] = useState<string[]>(() => findMulti(filtersData, mapHobbies))
  const [esporte, setEsporte] = useState(() => findSingle(filtersData, mapEsporte))
  const [alim, setAlim] = useState<string[]>(() => findMulti(filtersData, mapAlim))
  const [estilo, setEstilo] = useState<string[]>(() => findMulti(filtersData, mapEstilo))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapFumo).forEach(([k, v]) => { u[k] = fumo === v })
    Object.entries(mapBebida).forEach(([k, v]) => { u[k] = bebida === v })
    u.drug_cannabis = cannabis
    u.no_addictions = fumo === 'Não fumo' && bebida === 'Não consumo bebida alcoólica' && !cannabis
    Object.entries(mapRotina).forEach(([k, v]) => { u[k] = rotina.includes(v) })
    Object.entries(mapPersonalidade).forEach(([k, v]) => { u[k] = personalidade.includes(v) })
    Object.entries(mapHobbies).forEach(([k, v]) => { u[k] = hobbies.includes(v) })
    Object.entries(mapEsporte).forEach(([k, v]) => { u[k] = esporte === v })
    Object.entries(mapAlim).forEach(([k, v]) => { u[k] = alim.includes(v) })
    Object.entries(mapEstilo).forEach(([k, v]) => { u[k] = estilo.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] estilo-vida', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Tabaco" opcoes={Object.values(mapFumo)} valor={fumo} onChange={setFumo} />
        <GrupoOpcoes titulo="Bebida alcoólica" opcoes={Object.values(mapBebida)} valor={bebida} onChange={setBebida} />
        <div>
          <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Outras substâncias</p>
          <TagChip label="Cannabis" ativo={cannabis} onClick={() => setCannabis(!cannabis)} />
        </div>
        <GrupoMulti titulo="Rotina" opcoes={Object.values(mapRotina)} valores={rotina} onToggle={v => tog(rotina, setRotina, v)} />
        <GrupoMulti titulo="Personalidade" opcoes={Object.values(mapPersonalidade)} valores={personalidade} onToggle={v => tog(personalidade, setPersonalidade, v)} />
        <GrupoMulti titulo="Hobbies" opcoes={Object.values(mapHobbies)} valores={hobbies} onToggle={v => tog(hobbies, setHobbies, v)} />
        <GrupoOpcoes titulo="Esportes" opcoes={Object.values(mapEsporte)} valor={esporte} onChange={setEsporte} />
        <GrupoMulti titulo="Alimentação" opcoes={Object.values(mapAlim)} valores={alim} onToggle={v => tog(alim, setAlim, v)} />
        <GrupoMulti titulo="Estilo de se vestir" opcoes={Object.values(mapEstilo)} valores={estilo} onToggle={v => tog(estilo, setEstilo, v)} />
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
