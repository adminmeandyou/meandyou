'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { findSingle, findMulti } from './helpers'
import { BotaoSalvar } from './BotaoSalvar'
import { BloqueioAviso } from './BloqueioAviso'
import { GrupoOpcoes } from './GrupoOpcoes'
import { GrupoMulti } from './GrupoMulti'

export function ValoresSection({ userId, filtersData, bloqueado, onSaved }: {
  userId: string; filtersData: any; bloqueado: boolean; onSaved: () => void
}) {
  const mapReligiao: Record<string, string> = {
    rel_evangelical: 'Evangélico(a)', rel_catholic: 'Católico(a)', rel_spiritist: 'Espírita',
    rel_umbanda: 'Umbandista', rel_candomble: 'Candomblé', rel_buddhist: 'Budista',
    rel_jewish: 'Judaico(a)', rel_islamic: 'Islâmico(a)', rel_hindu: 'Hindu',
    rel_agnostic: 'Agnóstico(a)', rel_atheist: 'Ateu / Ateia', rel_spiritual: 'Espiritualizado(a) sem religião',
  }
  const mapFilhos: Record<string, string> = {
    kids_has: 'Tenho filhos', kids_no: 'Não tenho filhos', kids_wants: 'Quero ter filhos',
    kids_no_want: 'Não quero ter filhos', kids_adoption: 'Aberto(a) à adoção', kids_undecided: 'Ainda não decidi',
  }
  const mapPets: Record<string, string> = {
    pet_dog: 'Tenho cachorro', pet_cat: 'Tenho gato', pet_other: 'Outros pets',
    pet_loves: 'Adoro animais', pet_none: 'Sem pets', pet_allergy: 'Alergia a animais', pet_dislikes: 'Não gosto de animais',
  }
  const mapEscolaridade: Record<string, string> = {
    edu_elementary: 'Ensino fundamental', edu_highschool: 'Ensino médio',
    edu_college_incomplete: 'Superior incompleto', edu_college_complete: 'Superior completo',
    edu_postgrad: 'Pós-graduado(a)', edu_masters: 'Mestrado', edu_phd: 'Doutorado', edu_student: 'Estudante',
  }
  const mapTrabalho: Record<string, string> = {
    work_clt: 'CLT', work_entrepreneur: 'Empreendedor(a)', work_freelancer: 'Freelancer',
    work_liberal: 'Profissional liberal', work_civil_servant: 'Servidor público',
    work_autonomous: 'Autônomo(a)', work_remote: 'Remoto', work_unemployed: 'Desempregado(a)',
  }
  const mapIdiomas: Record<string, string> = {
    lang_portuguese: 'Somente português', lang_english: 'Inglês', lang_spanish: 'Espanhol',
    lang_french: 'Francês', lang_german: 'Alemão', lang_japanese: 'Japonês/Mandarim',
    lang_bilingual: 'Bilíngue', lang_trilingual: 'Trilíngue ou mais',
  }

  const [religiao, setReligiao] = useState(() => findSingle(filtersData, mapReligiao))
  const [filhos, setFilhos] = useState<string[]>(() => findMulti(filtersData, mapFilhos))
  const [pets, setPets] = useState<string[]>(() => findMulti(filtersData, mapPets))
  const [escolaridade, setEscolaridade] = useState(() => findSingle(filtersData, mapEscolaridade))
  const [trabalho, setTrabalho] = useState(() => findSingle(filtersData, mapTrabalho))
  const [idiomas, setIdiomas] = useState<string[]>(() => findMulti(filtersData, mapIdiomas))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function tog(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function salvar() {
    setSalvando(true); setErro(''); setSucesso(false)
    const u: Record<string, any> = {}
    Object.entries(mapReligiao).forEach(([k, v]) => { u[k] = religiao === v })
    Object.entries(mapFilhos).forEach(([k, v]) => { u[k] = filhos.includes(v) })
    Object.entries(mapPets).forEach(([k, v]) => { u[k] = pets.includes(v) })
    Object.entries(mapEscolaridade).forEach(([k, v]) => { u[k] = escolaridade === v })
    Object.entries(mapTrabalho).forEach(([k, v]) => { u[k] = trabalho === v })
    Object.entries(mapIdiomas).forEach(([k, v]) => { u[k] = idiomas.includes(v) })
    try {
      await supabase.from('filters').upsert({ user_id: userId, ...u })
      await supabase.from('profiles').update({ profile_edited_at: new Date().toISOString() }).eq('id', userId)
      onSaved()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) { console.error('[editar-perfil] valores', err); setErro('Erro ao salvar.') }
    setSalvando(false)
  }

  const disabled = bloqueado

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bloqueado && <BloqueioAviso dias={7} />}
      <div style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <GrupoOpcoes titulo="Religião / espiritualidade" opcoes={Object.values(mapReligiao)} valor={religiao} onChange={setReligiao} />
        <GrupoMulti titulo="Filhos" opcoes={Object.values(mapFilhos)} valores={filhos} onToggle={v => tog(filhos, setFilhos, v)} />
        <GrupoMulti titulo="Pets" opcoes={Object.values(mapPets)} valores={pets} onToggle={v => tog(pets, setPets, v)} />
        <GrupoOpcoes titulo="Escolaridade" opcoes={Object.values(mapEscolaridade)} valor={escolaridade} onChange={setEscolaridade} />
        <GrupoOpcoes titulo="Trabalho" opcoes={Object.values(mapTrabalho)} valor={trabalho} onChange={setTrabalho} />
        <GrupoMulti titulo="Idiomas" opcoes={Object.values(mapIdiomas)} valores={idiomas} onToggle={v => tog(idiomas, setIdiomas, v)} />
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
