'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, X, Star, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react'

const ETAPAS = ['Fotos', 'Básico', 'Aparência', 'Identidade', 'Estilo de vida', 'Valores', 'O que busco']

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    state_code?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    road?: string
    pedestrian?: string
  }
}

const tooltips: Record<string, string> = {
  'Homem': 'Você nasceu com corpo masculino e se identifica como homem.',
  'Mulher': 'Você nasceu com corpo feminino e se identifica como mulher.',
  'Homem trans': 'Você nasceu com corpo feminino mas se identifica e vive como homem.',
  'Mulher trans': 'Você nasceu com corpo masculino mas se identifica e vive como mulher.',
  'Não-binário(a)': 'Você não se identifica nem como homem nem como mulher, ou se identifica como os dois.',
  'Gênero fluido': 'Sua identidade pode variar — às vezes mais masculina, às vezes mais feminina.',
  'Heterossexual': 'Atração afetiva e sexual por pessoas do gênero oposto.',
  'Homossexual': 'Atração afetiva e sexual por pessoas do mesmo gênero.',
  'Bissexual': 'Atração afetiva e sexual por pessoas de dois ou mais gêneros.',
  'Pansexual': 'Atração por pessoas independentemente do gênero.',
  'Assexual': 'Pouca ou nenhuma atração sexual por outras pessoas.',
  'Demissexual': 'Sente atração sexual apenas após criar um vínculo emocional profundo.',
  'Queer': 'Termo amplo para orientações e identidades que fogem do padrão heterossexual e cisgênero.',
  'Poliamor': 'Relacionamentos múltiplos simultâneos com o conhecimento de todos.',
  'BDSM / fetiches': 'Práticas consensuais entre adultos.',
  'Busco trisal': 'Relacionamento amoroso envolvendo três pessoas.',
  'Swing / relacionamento aberto': 'Casais que trocam de parceiros com consentimento mútuo.',
  'Ela/Dela': 'Pronomes femininos.',
  'Ele/Dele': 'Pronomes masculinos.',
  'Elu/Delu': 'Pronomes neutros usados por pessoas não-binárias.',
}

function calcularIMC(peso: string, altura: string): string {
  const p = parseFloat(peso)
  const a = parseFloat(altura) / 100
  if (!p || !a) return ''
  const imc = p / (a * a)
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25) return 'Peso saudável'
  if (imc < 30) return 'Acima do peso'
  if (imc < 35) return 'Obesidade leve'
  return 'Obesidade severa'
}

function corpoPossiveis(peso: string, altura: string): string[] {
  const imc = calcularIMC(peso, altura)
  if (!imc) return ['Abaixo do peso', 'Peso saudável', 'Acima do peso', 'Obesidade leve', 'Obesidade severa']
  const map: Record<string, string[]> = {
    'Abaixo do peso': ['Abaixo do peso', 'Peso saudável'],
    'Peso saudável': ['Peso saudável', 'Abaixo do peso', 'Acima do peso'],
    'Acima do peso': ['Acima do peso', 'Peso saudável', 'Obesidade leve'],
    'Obesidade leve': ['Obesidade leve', 'Acima do peso', 'Obesidade severa'],
    'Obesidade severa': ['Obesidade severa', 'Obesidade leve'],
  }
  return map[imc] || []
}

export default function Perfil() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [tooltip, setTooltip] = useState('')

  // ETAPA 0 - Fotos
  const [fotos, setFotos] = useState<(File | null)[]>(Array(10).fill(null))
  const [fotosUrls, setFotosUrls] = useState<(string | null)[]>(Array(10).fill(null))
  const [previews, setPreviews] = useState<string[]>(Array(10).fill(''))
  const [fotoPrincipal, setFotoPrincipal] = useState(0)
  const [verificandoFoto, setVerificandoFoto] = useState<number | null>(null)

  // ETAPA 1 - Básico
  const [nome, setNome] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [bairro, setBairro] = useState('')
  const [rua, setRua] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [bio, setBio] = useState('')
  const [cep, setCep] = useState('')
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [buscaRua, setBuscaRua] = useState('')
  const [estadoBusca, setEstadoBusca] = useState('')
  const [sugestoesRua, setSugestoesRua] = useState<NominatimResult[]>([])
  const [buscandoRua, setBuscandoRua] = useState(false)

  // ETAPA 2 - Aparência
  const [corOlhos, setCorOlhos] = useState('')
  const [corCabelo, setCorCabelo] = useState('')
  const [comprimentoCabelo, setComprimentoCabelo] = useState('')
  const [tipoCabelo, setTipoCabelo] = useState('')
  const [corPele, setCorPele] = useState('')
  const [altura, setAltura] = useState('')
  const [peso, setPeso] = useState('')
  const [corporal, setCorporal] = useState('')
  const [caracteristicas, setCaracteristicas] = useState<string[]>([])
  const [pcd, setPcd] = useState('')
  const [deficiencias, setDeficiencias] = useState<string[]>([])

  // ETAPA 3 - Identidade
  const [genero, setGenero] = useState('')
  const [pronomes, setPronomes] = useState('')
  const [orientacao, setOrientacao] = useState('')
  const [statusCivil, setStatusCivil] = useState('')

  // ETAPA 4 - Estilo de vida
  const [fumo, setFumo]       = useState('')
  const [bebida, setBebida]   = useState('')
  const [cannabis, setCannabis] = useState(false)
  const [rotina, setRotina] = useState<string[]>([])
  const [personalidade, setPersonalidade] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])
  const [esportes, setEsportes] = useState('')
  const [alimentacao, setAlimentacao] = useState<string[]>([])
  const [estiloVestir, setEstiloVestir] = useState<string[]>([])
  const [musica, setMusica] = useState<string[]>([])
  const [instrumento, setInstrumento] = useState<string[]>([])

  // ETAPA 5 - Valores
  const [religiao, setReligiao] = useState('')
  const [filhos, setFilhos] = useState<string[]>([])
  const [pets, setPets] = useState<string[]>([])
  const [escolaridade, setEscolaridade] = useState('')
  const [trabalho, setTrabalho] = useState('')
  const [idiomas, setIdiomas] = useState<string[]>([])
  const [nacionalidade, setNacionalidade] = useState('')

  // ETAPA 6 - Objetivos
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [discreto, setDiscreto] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
  }, [])

  const buscarCep = async (value: string) => {
    const limpo = value.replace(/\D/g, '')
    setCep(limpo)
    if (limpo.length !== 8) { if (limpo.length > 0 && limpo.length < 8) setCepStatus('idle'); return }
    setCepStatus('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const data = await res.json()
      if (data.erro) { setCepStatus('error'); setCidade(''); setEstado(''); setBairro(''); setRua(''); return }
      setCidade(data.localidade || '')
      setEstado(data.uf || '')
      setBairro(data.bairro || '')
      setRua(data.logradouro || '')
      setCepStatus('ok')
      const q = encodeURIComponent(`${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`)
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'Accept-Language': 'pt-BR' } })
      const geoData = await geo.json()
      if (geoData[0]) { setLat(parseFloat(geoData[0].lat)); setLng(parseFloat(geoData[0].lon)) }
    } catch { setCepStatus('error') }
  }

  const buscarPorRua = async (ruaNome: string, uf: string) => {
    if (!ruaNome || ruaNome.length < 4 || !uf) return
    setBuscandoRua(true)
    try {
      const q = encodeURIComponent(`${ruaNome}, ${uf}, Brasil`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&countrycodes=br`, { headers: { 'Accept-Language': 'pt-BR' } })
      const data = await res.json()
      setSugestoesRua(data)
    } catch {}
    setBuscandoRua(false)
  }

  const selecionarSugestao = (item: NominatimResult) => {
    const addr = item.address
    setCidade(addr.city || addr.town || addr.village || addr.municipality || '')
    setEstado(addr.state_code || addr.state || '')
    setBairro(addr.suburb || addr.neighbourhood || addr.quarter || '')
    setRua(addr.road || addr.pedestrian || '')
    setLat(parseFloat(item.lat))
    setLng(parseFloat(item.lon))
    setSugestoesRua([])
    setBuscaRua(item.display_name.split(',')[0])
    setCepStatus('ok')
  }

  const toggleTag = (lista: string[], setLista: (v: string[]) => void, valor: string) => {
    setLista(lista.includes(valor) ? lista.filter(i => i !== valor) : [...lista, valor])
  }

  const handleFoto = async (index: number, file: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErro('Foto muito grande. Máximo 5MB.'); return }
    const duplicada = fotos.some((f, i) => f && i !== index && f.name === file.name && f.size === file.size)
    if (duplicada) { setErro('Esta foto já foi adicionada.'); return }

    const previewLocal = URL.createObjectURL(file)
    const novosPreviewsTemp = [...previews]; novosPreviewsTemp[index] = previewLocal; setPreviews(novosPreviewsTemp)
    setVerificandoFoto(index)
    setErro('')

    try {
      const formData = new FormData()
      formData.append('foto', file)
      formData.append('index', String(index))
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/moderar-foto', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: formData,
      })
      const data = await res.json()

      if (!data.aprovado) {
        const novosPreviewsRej = [...previews]; novosPreviewsRej[index] = ''; setPreviews(novosPreviewsRej)
        setErro(data.motivo || 'Foto recusada. Use fotos com roupas.')
        setVerificandoFoto(null)
        return
      }

      // Salva o File (para detecção de duplicatas) e a URL retornada pelo servidor
      const novasFotos = [...fotos]; novasFotos[index] = file; setFotos(novasFotos)
      const novasUrls = [...fotosUrls]; novasUrls[index] = data.url; setFotosUrls(novasUrls)
      const novosPreviews = [...previews]; novosPreviews[index] = data.url; setPreviews(novosPreviews)
      setErro('')
    } catch {
      // Falha de rede — limpa a foto, não salva sem moderação/upload server-side
      const novosPreviewsErr = [...previews]; novosPreviewsErr[index] = ''; setPreviews(novosPreviewsErr)
      setErro('Falha de conexão ao verificar a foto. Tente novamente.')
    }
    setVerificandoFoto(null)
  }

  const removerFoto = (index: number) => {
    const novasFotos = [...fotos]; novasFotos[index] = null; setFotos(novasFotos)
    const novasUrls = [...fotosUrls]; novasUrls[index] = null; setFotosUrls(novasUrls)
    const novosPreiews = [...previews]; novosPreiews[index] = ''; setPreviews(novosPreiews)
    if (fotoPrincipal === index) setFotoPrincipal(0)
  }

  const validarEtapa = (): string => {
    if (etapa === 0) {
      const obrigatorias = fotosUrls.slice(0, 5).filter(u => u !== null)
      if (obrigatorias.length < 5) return 'Envie todas as 5 fotos obrigatórias para continuar.'
    }
    if (etapa === 1) {
      if (!nome) return 'Informe seu nome.'
      if (!nascimento) return 'Informe sua data de nascimento.'
      if (nascimento) {
        const hoje = new Date()
        const nasc = new Date(nascimento)
        const idade = hoje.getFullYear() - nasc.getFullYear() - (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
        if (idade < 18) return 'Acesso proibido. O MeAndYou é destinado exclusivamente a maiores de 18 anos.'
        if (idade > 100) return 'Data de nascimento inválida.'
      }
      if (!bio) return 'Escreva algo sobre você na bio.'
      if (bio.length < 30) return `A bio precisa ter pelo menos 30 caracteres. Você escreveu ${bio.length}.`
      if (!cidade) return 'Informe sua cidade. Use o CEP ou busque pelo nome da rua.'
      if (!estado) return 'Estado não identificado.'
      if (!rua) return 'Informe sua rua para ativar o filtro por distância.'
    }
    if (etapa === 2) {
      if (!corOlhos) return 'Selecione a cor dos seus olhos.'
      if (!corCabelo) return 'Selecione a cor do seu cabelo.'
      if (corCabelo !== 'Não possuo cabelo (careca)' && !comprimentoCabelo) return 'Selecione o comprimento do seu cabelo.'
      if (!corPele) return 'Selecione sua cor de pele / etnia.'
      if (!altura) return 'Informe sua altura.'
      if (parseInt(altura) < 100) return 'Altura mínima: 100 cm.'
      if (parseInt(altura) > 250) return 'Altura máxima: 250 cm.'
      if (!peso) return 'Informe seu peso.'
      if (parseInt(peso) < 30) return 'Peso mínimo: 30 kg.'
      if (parseInt(peso) > 300) return 'Peso máximo: 300 kg.'
      if (!corporal) return 'Selecione seu tipo corporal.'
      if (!pcd) return 'Informe se você é PCD ou não.'
    }
    if (etapa === 3) {
      if (!genero) return 'Selecione seu gênero.'
      if (!pronomes) return 'Selecione seus pronomes.'
      if (!orientacao) return 'Selecione sua orientação sexual.'
      if (!statusCivil) return 'Selecione seu status civil.'
    }
    if (etapa === 4) {
      if (!fumo) return 'Informe seus hábitos com tabaco.'
      if (!bebida) return 'Informe seus hábitos com bebida alcoólica.'
      if (rotina.length === 0) return 'Selecione pelo menos 1 opção de rotina.'
      if (personalidade.length === 0) return 'Selecione pelo menos 1 traço de personalidade.'
      if (hobbies.length === 0) return 'Selecione pelo menos 1 hobbie.'
      if (!esportes) return 'Informe sua relação com esportes.'
      if (alimentacao.length === 0) return 'Selecione pelo menos 1 opção de alimentação.'
      if (estiloVestir.length === 0) return 'Selecione pelo menos 1 estilo de se vestir.'
      if (musica.length === 0) return 'Selecione pelo menos 1 gosto musical.'
    }
    if (etapa === 5) {
      if (!religiao) return 'Informe sua religião ou espiritualidade.'
      if (filhos.length === 0) return 'Informe sua situação com filhos.'
      if (pets.length === 0) return 'Informe sua relação com animais.'
      if (!escolaridade) return 'Informe seu nível de escolaridade.'
      if (!trabalho) return 'Informe sua situação profissional.'
      if (idiomas.length === 0) return 'Informe os idiomas que você fala.'
      if (!nacionalidade) return 'Informe sua nacionalidade.'
    }
    if (etapa === 6) {
      if (objetivos.length === 0) return 'Selecione pelo menos 1 objetivo na plataforma.'
    }
    return ''
  }

  const salvarEtapa = async () => {
    const erroValidacao = validarEtapa()
    if (erroValidacao) { setErro(erroValidacao); return }
    setSalvando(true); setErro('')
    if (!userId) { setSalvando(false); return }

    try {
      if (etapa === 0) {
        // URLs já foram geradas server-side em /api/moderar-foto
        const fotoSlots = ['photo_face', 'photo_body', 'photo_side', 'photo_back', 'photo_extra1', 'photo_extra2', 'photo_extra3', 'photo_extra4', 'photo_extra5']
        const update: Record<string, string | null> = {}
        fotoSlots.forEach((slot, i) => { update[slot] = fotosUrls[i] ?? null })
        // photo_best é determinado pelo fotoPrincipal, não por um slot fixo
        update['photo_best'] = fotosUrls[fotoPrincipal] ?? fotosUrls[0] ?? null
        await supabase.from('profiles').upsert({ id: userId, ...update })
      }

      if (etapa === 1) {
        await supabase.from('profiles').upsert({
          id: userId, name: nome, birthdate: nascimento, bio,
          cep, rua, bairro, city: cidade, state: estado, lat, lng,
        })
      }

      if (etapa === 2) {
        const c = (v: string) => caracteristicas.includes(v)
        const d = (v: string) => deficiencias.includes(v)
        await supabase.from('filters').upsert({
          user_id: userId,
          eye_black: corOlhos === 'Olhos pretos',
          eye_brown: corOlhos === 'Olhos castanhos',
          eye_green: corOlhos === 'Olhos verdes',
          eye_blue: corOlhos === 'Olhos azuis',
          eye_honey: corOlhos === 'Olhos mel',
          eye_gray: corOlhos === 'Olhos acinzentados',
          eye_heterochromia: corOlhos === 'Heterocromia',
          hair_black: corCabelo === 'Cabelo preto',
          hair_brown: corCabelo === 'Cabelo castanho',
          hair_blonde: corCabelo === 'Cabelo loiro',
          hair_red: corCabelo === 'Cabelo ruivo',
          hair_colored: corCabelo === 'Cabelo colorido',
          hair_gray: corCabelo === 'Cabelo grisalho',
          hair_bald: corCabelo === 'Não possuo cabelo (careca)',
          hair_short: comprimentoCabelo === 'Cabelo curto',
          hair_medium: comprimentoCabelo === 'Cabelo médio',
          hair_long: comprimentoCabelo === 'Cabelo longo',
          hair_straight: tipoCabelo === 'Cabelo liso',
          hair_wavy: tipoCabelo === 'Cabelo ondulado',
          hair_curly: tipoCabelo === 'Cabelo cacheado',
          hair_coily: tipoCabelo === 'Cabelo crespo',
          skin_white: corPele === 'Branca',
          skin_mixed: corPele === 'Parda',
          skin_black: corPele === 'Negra',
          skin_asian: corPele === 'Asiática',
          skin_indigenous: corPele === 'Indígena',
          skin_latin: corPele === 'Latina',
          skin_mediterranean: corPele === 'Mediterrânea',
          skin_vitiligo: corPele === 'Possuo vitiligo',
          height_cm: parseInt(altura),
          weight_kg: parseInt(peso),
          body_underweight: corporal === 'Abaixo do peso',
          body_healthy: corporal === 'Peso saudável',
          body_overweight: corporal === 'Acima do peso',
          body_obese_mild: corporal === 'Obesidade leve',
          body_obese_severe: corporal === 'Obesidade severa',
          feat_freckles: c('Possuo sardas'),
          feat_tattoo: c('Possuo tatuagem'),
          feat_piercing: c('Possuo piercing'),
          feat_scar: c('Possuo cicatriz'),
          feat_glasses: c('Uso óculos'),
          feat_braces: c('Uso aparelho dentário'),
          feat_beard: c('Possuo barba'),
          is_pcd: pcd === 'Sim, sou PCD',
          pcd_visual: d('Deficiência visual'),
          pcd_hearing: d('Deficiência auditiva'),
          pcd_motor: d('Deficiência motora'),
          pcd_intellectual: d('Deficiência intelectual'),
          pcd_autism: d('Autismo (TEA)'),
          pcd_adhd: d('TDAH'),
          pcd_wheelchair: d('Sou cadeirante'),
          pcd_dwarfism: d('Nanismo'),
          pcd_other: d('Outra'),
        })
      }

      if (etapa === 3) {
        await supabase.from('profiles').upsert({ id: userId, gender: genero, pronouns: pronomes })
        await supabase.from('filters').upsert({
          user_id: userId,
          gender_cis_man: genero === 'Homem',
          gender_cis_woman: genero === 'Mulher',
          gender_trans_man: genero === 'Homem trans',
          gender_trans_woman: genero === 'Mulher trans',
          gender_nonbinary: genero === 'Não-binário(a)',
          gender_fluid: genero === 'Gênero fluido',
          pronoun_she: pronomes === 'Ela/Dela',
          pronoun_he: pronomes === 'Ele/Dele',
          pronoun_they: pronomes === 'Elu/Delu',
          sex_hetero: orientacao === 'Heterossexual',
          sex_homo: orientacao === 'Homossexual',
          sex_bi: orientacao === 'Bissexual',
          sex_pan: orientacao === 'Pansexual',
          sex_asex: orientacao === 'Assexual',
          sex_demi: orientacao === 'Demissexual',
          sex_queer: orientacao === 'Queer',
          civil_single: statusCivil === 'Solteiro(a)',
          civil_complicated: statusCivil === 'Enrolado(a)',
          civil_married: statusCivil === 'Casado(a)',
          civil_divorcing: statusCivil === 'Divorciando',
          civil_divorced: statusCivil === 'Divorciado(a)',
          civil_widowed: statusCivil === 'Viúvo(a)',
          civil_open: statusCivil === 'Relacionamento aberto',
        })
      }

      if (etapa === 4) {
        const r = (v: string) => rotina.includes(v)
        const p = (v: string) => personalidade.includes(v)
        const h = (v: string) => hobbies.includes(v)
        const a = (v: string) => alimentacao.includes(v)
        const e = (v: string) => estiloVestir.includes(v)
        const m = (v: string) => musica.includes(v)
        const inst = (v: string) => instrumento.includes(v)
        await supabase.from('filters').upsert({
          user_id: userId,
          smoke_yes: fumo === 'Fumo',
          smoke_occasionally: fumo === 'Fumo ocasionalmente',
          smoke_no: fumo === 'Não fumo',
          drink_yes: bebida === 'Consumo bebida alcoólica',
          drink_socially: bebida === 'Bebo socialmente',
          drink_no: bebida === 'Não consumo bebida alcoólica',
          drug_cannabis: cannabis,
          no_addictions: fumo === 'Não fumo' && bebida === 'Não consumo bebida alcoólica' && !cannabis,
          routine_gym: r('Pratico academia'),
          routine_sports: r('Pratico esporte regularmente'),
          routine_sedentary: r('Sou sedentário(a)'),
          routine_homebody: r('Sou caseiro(a)'),
          routine_goes_out: r('Gosto de sair'),
          routine_party: r('Gosto de balada'),
          routine_night_owl: r('Sou noturno(a)'),
          routine_morning: r('Sou matutino(a)'),
          routine_workaholic: r('Sou workaholic'),
          routine_balanced: r('Tenho vida equilibrada'),
          pers_extrovert: p('Sou extrovertido(a)'),
          pers_introvert: p('Sou introvertido(a)'),
          pers_ambivert: p('Sou ambiverte'),
          pers_shy: p('Sou tímido(a)'),
          pers_communicative: p('Sou comunicativo(a)'),
          pers_antisocial: p('Sou antissocial'),
          pers_reserved: p('Sou reservado(a)'),
          pers_agitated: p('Sou agitado(a)'),
          pers_calm: p('Sou calmo(a)'),
          pers_intense: p('Sou intenso(a)'),
          hob_gamer: h('Sou gamer'),
          hob_reader: h('Adoro ler'),
          hob_movies: h('Viciado(a) em filmes'),
          hob_series: h('Viciado(a) em séries'),
          hob_anime: h('Curto anime / mangá'),
          hob_live_music: h('Curto música ao vivo'),
          hob_photography: h('Faço fotografia'),
          hob_art: h('Arte e desenho'),
          hob_dance: h('Danço'),
          hob_theater: h('Faço teatro'),
          hob_meditation: h('Meditação / Yoga'),
          hob_travel: h('Adoro viajar'),
          hob_hiking: h('Curto trilha e natureza'),
          hob_otaku: h('Sou otaku'),
          hob_kpop: h('Curto k-pop'),
          hob_emo_punk: h('Sou emo / punk'),
          hob_egirl: h('Sou e-girl / e-boy'),
          sport_football_yes: esportes === 'Gosto de futebol',
          sport_football_no: esportes === 'Não gosto de futebol',
          sport_running: esportes === 'Pratico corrida',
          sport_swimming: esportes === 'Pratico natação',
          sport_cycling: esportes === 'Ando de bicicleta',
          sport_martial_arts: esportes === 'Pratico artes marciais',
          sport_bbq: esportes === 'Gosto de churrasco',
          sport_none: esportes === 'Não pratico esportes',
          diet_vegan: a('Sou vegano(a)'),
          diet_vegetarian: a('Sou vegetariano(a)'),
          diet_carnivore: a('Sou carnívoro(a)'),
          diet_everything: a('Como de tudo'),
          diet_healthy: a('Prefiro alimentação saudável'),
          food_cooks: a('Cozinho bem'),
          food_no_cook: a('Não cozinho'),
          food_japanese: a('Curto comida japonesa'),
          food_fastfood: a('Curto fast food'),
          food_lactose_intolerant: a('Tenho intolerância à lactose'),
          food_gluten_intolerant: a('Tenho intolerância ao glúten'),
          style_formal: e('Social'),
          style_casual: e('Casual'),
          style_sporty: e('Esportivo'),
          style_alternative: e('Alternativo'),
          style_eclectic: e('Eclético'),
          style_gothic: e('Gótico'),
          style_punk: e('Punk'),
          style_egirl: e('E-girl / E-boy'),
          style_kpop: e('K-pop'),
          music_funk: m('Funk'),
          music_sertanejo: m('Sertanejo'),
          music_pagode: m('Pagode'),
          music_rock: m('Rock'),
          music_metal: m('Metal'),
          music_pop: m('Pop'),
          music_electronic: m('Eletrônica'),
          music_hiphop: m('Hip-hop / Rap'),
          music_mpb: m('MPB / Bossa Nova'),
          music_gospel: m('Gospel'),
          music_kpop: m('K-pop'),
          music_classical: m('Clássica'),
          music_eclectic: m('Eclético — curto de tudo'),
          music_none: m('Não gosto de música'),
          plays_guitar: inst('Toco guitarra / violão'),
          plays_piano: inst('Toco piano / teclado'),
          plays_drums: inst('Toco bateria'),
          plays_bass: inst('Toco baixo'),
          plays_other: inst('Toco outro instrumento'),
          sings: inst('Canto / sou cantor(a)'),
          no_instrument: inst('Não toco instrumento'),
        })
      }

      if (etapa === 5) {
        const f = (v: string) => filhos.includes(v)
        const pt = (v: string) => pets.includes(v)
        const id = (v: string) => idiomas.includes(v)
        await supabase.from('filters').upsert({
          user_id: userId,
          rel_evangelical: religiao === 'Evangélico(a)',
          rel_catholic: religiao === 'Católico(a)',
          rel_spiritist: religiao === 'Espírita',
          rel_umbanda: religiao === 'Umbandista',
          rel_candomble: religiao === 'Candomblé',
          rel_buddhist: religiao === 'Budista',
          rel_jewish: religiao === 'Judaico(a)',
          rel_islamic: religiao === 'Islâmico(a)',
          rel_hindu: religiao === 'Hindu',
          rel_agnostic: religiao === 'Agnóstico(a)',
          rel_atheist: religiao === 'Ateu / Ateia',
          rel_spiritual: religiao === 'Espiritualizado(a) sem religião',
          kids_has: f('Tenho filhos'),
          kids_no: f('Não tenho filhos'),
          kids_wants: f('Quero ter filhos'),
          kids_no_want: f('Não quero ter filhos'),
          kids_adoption: f('Aberto(a) à adoção'),
          kids_undecided: f('Ainda não decidi'),
          pet_dog: pt('Tenho cachorro'),
          pet_cat: pt('Tenho gato'),
          pet_other: pt('Tenho outros pets'),
          pet_loves: pt('Adoro animais'),
          pet_none: pt('Não tenho pets'),
          pet_allergy: pt('Tenho alergia a animais'),
          pet_dislikes: pt('Não gosto de animais'),
          edu_elementary: escolaridade === 'Ensino fundamental',
          edu_highschool: escolaridade === 'Ensino médio completo',
          edu_college_incomplete: escolaridade === 'Ensino superior incompleto',
          edu_college_complete: escolaridade === 'Ensino superior completo',
          edu_postgrad: escolaridade === 'Pós-graduado(a)',
          edu_masters: escolaridade === 'Mestrado',
          edu_phd: escolaridade === 'Doutorado',
          edu_civil_servant: escolaridade === 'Concursado(a)',
          edu_student: escolaridade === 'Sou estudante',
          work_clt: trabalho === 'CLT',
          work_entrepreneur: trabalho === 'Empreendedor(a)',
          work_freelancer: trabalho === 'Freelancer',
          work_liberal: trabalho === 'Profissional liberal',
          work_civil_servant: trabalho === 'Servidor(a) público(a)',
          work_autonomous: trabalho === 'Autônomo(a)',
          work_remote: trabalho === 'Trabalho remoto',
          work_unemployed: trabalho === 'Estou desempregado(a)',
          nat_brazilian: nacionalidade === 'Brasileiro(a)',
          nat_northeastern: nacionalidade === 'Nordestino(a)',
          nat_gaucho: nacionalidade === 'Gaúcho(a)',
          nat_paulistano: nacionalidade === 'Paulistano(a)',
          nat_carioca: nacionalidade === 'Carioca',
          nat_mineiro: nacionalidade === 'Mineiro(a)',
          nat_foreigner: nacionalidade === 'Estrangeiro(a)',
          nat_latin: nacionalidade === 'Latino(a)',
          nat_european: nacionalidade === 'Europeu(a)',
          nat_asian: nacionalidade === 'Asiático(a)',
          lang_portuguese: id('Falo somente português'),
          lang_english: id('Falo inglês'),
          lang_spanish: id('Falo espanhol'),
          lang_french: id('Falo francês'),
          lang_italian: id('Falo italiano'),
          lang_german: id('Falo alemão'),
          lang_japanese: id('Falo japonês / mandarim'),
          lang_bilingual: id('Sou bilíngue'),
          lang_trilingual: id('Sou trilíngue ou mais'),
        })
      }

      if (etapa === 6) {
        const o = (v: string) => objetivos.includes(v)
        const dc = (v: string) => discreto.includes(v)
        await supabase.from('filters').upsert({
          user_id: userId,
          obj_serious: o('Relacionamento sério'),
          obj_casual: o('Relacionamento casual'),
          obj_friendship: o('Amizade'),
          obj_events: o('Companhia para eventos'),
          obj_conjugal: o('Relação conjugal'),
          obj_open: o('Aberto(a) a experiências'),
          obj_sugar_baby: o('Sugar Baby'),
          obj_sugar_daddy: o('Sugar Daddy / Mommy'),
          obj_undefined: o('Ainda estou definindo'),
          disc_throuple: dc('Busco trisal'),
          disc_swing: dc('Swing / relacionamento aberto'),
          disc_polyamory: dc('Poliamor'),
          disc_bdsm: dc('BDSM / fetiches'),
        })

        // ✅ CORREÇÃO: calcular profile_completeness e atualizar RPC
        await supabase.rpc('update_profile_score', { p_user_id: userId })

        setSalvando(false)
        // ✅ CORREÇÃO: redireciona para /busca — middleware cuida de redirecionar
        // para /verificacao se ainda não verificado
        router.push('/busca')
        return
      }

      setEtapa(etapa + 1)
    } catch (err) { console.error('[salvarEtapa] etapa', etapa, err); setErro('Erro ao salvar. Tente novamente.') }
    setSalvando(false)
  }

  const Tooltip = ({ label }: { label: string }) => {
    const texto = tooltips[label]
    if (!texto) return null
    return (
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px', cursor: 'pointer' }}
        onMouseEnter={() => setTooltip(label)} onMouseLeave={() => setTooltip('')} onClick={() => setTooltip(tooltip === label ? '' : label)}>
        <HelpCircle size={13} color="var(--muted)" />
        {tooltip === label && (
          <span style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--text)', color: '#fff', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: '1.4', width: '200px', zIndex: 100, whiteSpace: 'normal' }}>
            {texto}
          </span>
        )}
      </span>
    )
  }

  const Tag = ({ label, ativo, onClick }: { label: string, ativo: boolean, onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
      border: `1.5px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
      backgroundColor: ativo ? 'var(--accent-light)' : 'var(--white)',
      color: ativo ? 'var(--accent-dark)' : 'var(--muted)',
      cursor: 'pointer', transition: 'all 0.15s',
      display: 'inline-flex', alignItems: 'center', gap: '4px'
    }}>
      {label}<Tooltip label={label} />
    </button>
  )

  const TagUnica = ({ label, valor, current, onChange }: { label: string, valor: string, current: string, onChange: (v: string) => void }) => (
    <button onClick={() => onChange(current === valor ? '' : valor)} style={{
      padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
      border: `1.5px solid ${current === valor ? 'var(--accent)' : 'var(--border)'}`,
      backgroundColor: current === valor ? 'var(--accent-light)' : 'var(--white)',
      color: current === valor ? 'var(--accent-dark)' : 'var(--muted)',
      cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '4px'
    }}>
      {label}<Tooltip label={label} />
    </button>
  )

  const Secao = ({ titulo, obrigatorio, children }: { titulo: string, obrigatorio?: boolean, children: React.ReactNode }) => (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {titulo} {obrigatorio && <span style={{ color: 'var(--accent)' }}>*</span>}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>
    </div>
  )

  const Select = ({ label, value, onChange, options, obrigatorio }: { label: string, value: string, onChange: (v: string) => void, options: string[], obrigatorio?: boolean }) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label} {obrigatorio && <span style={{ color: 'var(--accent)' }}>*</span>}
      </p>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '12px 16px', color: value ? 'var(--text)' : 'var(--muted)',
        fontFamily: 'var(--font-jakarta)', fontSize: '15px', width: '100%', outline: 'none'
      }}>
        <option value="">Selecione</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px',
    padding: '12px 16px', color: 'var(--text)', fontFamily: 'var(--font-jakarta)',
    fontSize: '15px', width: '100%', outline: 'none', boxSizing: 'border-box'
  }

  const Progresso = () => (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{ETAPAS[etapa]}</span>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{etapa + 1} de {ETAPAS.length}</span>
      </div>
      <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '100px' }}>
        <div style={{ height: '4px', backgroundColor: 'var(--accent)', borderRadius: '100px', width: `${((etapa + 1) / ETAPAS.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  )

  const fotoLabels = ['Foto do rosto', 'Corpo inteiro de frente', 'Foto lateral', 'Foto de costas', 'Sua melhor foto']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '32px 20px 120px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: '4px' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Complete seu perfil para começar</p>
        </div>

        <Progresso />

        {/* ===== ETAPA 0 — FOTOS ===== */}
        {etapa === 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>Suas fotos</h2>
            <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid rgba(46,196,160,0.3)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent-dark)', fontWeight: '600', marginBottom: '8px' }}>As 5 primeiras fotos são obrigatórias:</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
                1. Foto do rosto claramente visível<br />
                2. Corpo inteiro de frente<br />
                3. Foto lateral<br />
                4. Foto de costas<br />
                5. Sua melhor foto (ficará em destaque)<br /><br />
                As demais 5 são livres. Toque na ⭐ para definir a foto principal.
              </p>
            </div>
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#856404', fontWeight: '600' }}>⚠️ Não são permitidas fotos sem roupa ou semirroupa.</p>
            </div>
            {verificandoFoto !== null && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae0fd', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>🔍 Verificando foto {verificandoFoto + 1}... aguarde</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {Array(10).fill(null).map((_, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', border: `2px dashed ${previews[i] ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: previews[i] ? 'transparent' : 'var(--white)', cursor: 'pointer' }}>
                  {previews[i] ? (
                    <>
                      <img src={previews[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: verificandoFoto === i ? 0.5 : 1 }} />
                      {verificandoFoto === i && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ fontSize: '20px' }}>🔍</span>
                        </div>
                      )}
                      {verificandoFoto !== i && (
                        <>
                          <button onClick={() => removerFoto(i)} style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} color="#fff" />
                          </button>
                          <button onClick={() => setFotoPrincipal(i)} style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: fotoPrincipal === i ? 'var(--accent)' : 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Star size={12} color="#fff" />
                          </button>
                          {fotoPrincipal === i && <div style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: 'var(--accent)', borderRadius: '100px', padding: '2px 8px', fontSize: '9px', fontWeight: '700', color: '#fff' }}>Principal</div>}
                        </>
                      )}
                    </>
                  ) : (
                    <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: verificandoFoto !== null ? 'not-allowed' : 'pointer', gap: '4px', padding: '8px' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={verificandoFoto !== null} onChange={e => handleFoto(i, e.target.files?.[0] || null)} />
                      <Camera size={20} color="var(--muted)" />
                      <span style={{ fontSize: '9px', color: i < 5 ? 'var(--accent)' : 'var(--muted)', fontWeight: '700', textAlign: 'center', lineHeight: '1.3' }}>
                        {i < 5 ? fotoLabels[i] : 'Foto livre'}
                      </span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ETAPA 1 — BÁSICO ===== */}
        {etapa === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px' }}>Informações básicas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nome *</p>
                <input type="text" placeholder="Como você quer ser chamado(a)" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Data de nascimento *</p>
                <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  style={inputStyle} />
                {nascimento && (() => {
                  const hoje = new Date()
                  const nasc = new Date(nascimento)
                  const idade = hoje.getFullYear() - nasc.getFullYear() - (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
                  if (idade < 18) return (
                    <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffb3b3', borderRadius: '10px', padding: '10px 14px', marginTop: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#cc0000', fontWeight: '700' }}>🚫 Acesso proibido</p>
                      <p style={{ fontSize: '12px', color: '#cc0000', marginTop: '2px' }}>O MeAndYou é destinado exclusivamente a maiores de 18 anos.</p>
                    </div>
                  )
                  return <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px', fontWeight: '600' }}>✅ {idade} anos — acesso permitido</p>
                })()}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>CEP *</p>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Digite seu CEP (ex: 01310-100)"
                    value={cep.replace(/(\d{5})(\d{1,3})/, '$1-$2')}
                    onChange={e => buscarCep(e.target.value)} maxLength={9}
                    style={{ ...inputStyle, paddingRight: '44px' }} />
                  {cepStatus === 'loading' && <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>⏳</span>}
                  {cepStatus === 'ok' && <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>✅</span>}
                  {cepStatus === 'error' && <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>❌</span>}
                </div>
                {cepStatus === 'error' && <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>CEP não encontrado. Tente buscar pelo nome da rua abaixo.</p>}
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Não sabe o CEP? Busque pela rua</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>Digite o nome da rua e selecione o estado</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" placeholder="Nome da rua, avenida..." value={buscaRua}
                    onChange={e => { setBuscaRua(e.target.value); if (e.target.value.length >= 4) buscarPorRua(e.target.value, estadoBusca) }}
                    style={inputStyle} />
                  <select value={estadoBusca} onChange={e => { setEstadoBusca(e.target.value); if (buscaRua.length >= 4) buscarPorRua(buscaRua, e.target.value) }} style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 10px', color: 'var(--text)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', width: '72px', outline: 'none' }}>
                    <option value="">UF</option>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf}>{uf}</option>)}
                  </select>
                </div>
                {buscandoRua && <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Buscando...</p>}
                {sugestoesRua.length > 0 && (
                  <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                    {sugestoesRua.map((item, i) => (
                      <button key={i} onClick={() => selecionarSugestao(item)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: i < sugestoesRua.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {cepStatus === 'ok' && (
                <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid rgba(46,196,160,0.3)', borderRadius: '16px', padding: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-dark)', marginBottom: '12px' }}>✅ Endereço confirmado</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>CIDADE</p><p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{cidade || '—'}</p></div>
                    <div><p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>ESTADO</p><p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{estado || '—'}</p></div>
                    <div><p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>BAIRRO</p><p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{bairro || '—'}</p></div>
                    <div><p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>RUA</p><p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{rua || '—'}</p></div>
                  </div>
                  {lat && lng && <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px' }}>📍 Filtro por distância ativado</p>}
                </div>
              )}

              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Conte sobre você *</p>
                <textarea placeholder="Fale sobre você, sua personalidade, o que curte... (mínimo 30 caracteres)" value={bio} onChange={e => setBio(e.target.value)} maxLength={300}
                  style={{ ...inputStyle, resize: 'none', minHeight: '100px', border: `1px solid ${bio.length >= 30 ? 'var(--accent)' : bio.length > 0 ? '#ffb347' : 'var(--border)'}` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: bio.length >= 30 ? 'var(--accent)' : bio.length > 0 ? '#e67e00' : 'var(--muted)', fontWeight: bio.length > 0 ? '600' : '400' }}>
                    {bio.length < 30 ? `Faltam ${30 - bio.length} caracteres` : '✅ Bio completa'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{bio.length}/300</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ETAPA 2 — APARÊNCIA ===== */}
        {etapa === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px' }}>Sua aparência</h2>
            <Select label="Cor dos olhos" obrigatorio value={corOlhos} onChange={setCorOlhos} options={['Olhos pretos','Olhos castanhos','Olhos verdes','Olhos azuis','Olhos mel','Olhos acinzentados','Heterocromia']} />
            <Select label="Cor do cabelo" obrigatorio value={corCabelo} onChange={v => { setCorCabelo(v); if (v === 'Não possuo cabelo (careca)') { setComprimentoCabelo(''); setTipoCabelo('') } }} options={['Cabelo preto','Cabelo castanho','Cabelo loiro','Cabelo ruivo','Cabelo colorido','Cabelo grisalho','Não possuo cabelo (careca)']} />
            {corCabelo !== 'Não possuo cabelo (careca)' && corCabelo !== '' && (
              <>
                <Select label="Comprimento do cabelo" obrigatorio value={comprimentoCabelo} onChange={setComprimentoCabelo} options={['Cabelo curto','Cabelo médio','Cabelo longo']} />
                <Select label="Tipo do cabelo" value={tipoCabelo} onChange={setTipoCabelo} options={['Cabelo liso','Cabelo cacheado','Cabelo crespo','Cabelo ondulado']} />
              </>
            )}
            <Select label="Cor de pele / etnia" obrigatorio value={corPele} onChange={setCorPele} options={['Branca','Parda','Negra','Asiática','Indígena','Latina','Mediterrânea','Possuo vitiligo']} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Altura (cm) *</p>
                <input type="number" placeholder="Ex: 165" value={altura} onChange={e => setAltura(e.target.value)} min={100} max={250} style={inputStyle} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Peso (kg) *</p>
                <input type="number" placeholder="Ex: 60" value={peso} onChange={e => setPeso(e.target.value)} min={30} max={300} style={inputStyle} />
              </div>
            </div>

            {altura && peso && parseInt(altura) >= 100 && parseInt(peso) >= 30 && (
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => { const imc = calcularIMC(peso, altura); if (imc) setCorporal(imc) }}
                  style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1.5px dashed var(--accent)', backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)', fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  🧮 Calcular IMC e sugerir tipo corporal
                </button>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo corporal *</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Abaixo do peso', 'Peso saudável', 'Acima do peso', 'Obesidade leve', 'Obesidade severa'].map(op => {
                  const possiveis = corpoPossiveis(peso, altura)
                  const bloqueado = possiveis.length > 0 && !possiveis.includes(op)
                  return (
                    <button key={op} onClick={() => { if (!bloqueado) setCorporal(corporal === op ? '' : op) }} disabled={bloqueado}
                      style={{ padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: `1.5px solid ${bloqueado ? '#e5e7eb' : corporal === op ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: bloqueado ? '#f3f4f6' : corporal === op ? 'var(--accent-light)' : 'var(--white)', color: bloqueado ? '#9ca3af' : corporal === op ? 'var(--accent-dark)' : 'var(--muted)', cursor: bloqueado ? 'not-allowed' : 'pointer' }}>
                      {op}
                    </button>
                  )
                })}
              </div>
            </div>

            <Secao titulo="Características que possuo">
              {['Possuo sardas','Possuo tatuagem','Possuo piercing','Possuo cicatriz','Uso óculos','Uso aparelho dentário','Possuo barba'].map(tag => (
                <Tag key={tag} label={tag} ativo={caracteristicas.includes(tag)} onClick={() => toggleTag(caracteristicas, setCaracteristicas, tag)} />
              ))}
            </Secao>

            <Secao titulo="Sou Pessoa com Deficiência (PCD)?" obrigatorio>
              {['Sim, sou PCD', 'Não sou PCD'].map(op => <TagUnica key={op} label={op} valor={op} current={pcd} onChange={setPcd} />)}
            </Secao>

            {pcd === 'Sim, sou PCD' && (
              <Secao titulo="Qual deficiência?">
                {['Deficiência visual','Deficiência auditiva','Deficiência motora','Deficiência intelectual','Autismo (TEA)','TDAH','Sou cadeirante','Nanismo','Outra'].map(tag => (
                  <Tag key={tag} label={tag} ativo={deficiencias.includes(tag)} onClick={() => toggleTag(deficiencias, setDeficiencias, tag)} />
                ))}
              </Secao>
            )}
          </div>
        )}

        {/* ===== ETAPA 3 — IDENTIDADE ===== */}
        {etapa === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px' }}>Identidade</h2>
            <Secao titulo="Gênero" obrigatorio>
              {['Homem', 'Mulher', 'Homem trans', 'Mulher trans', 'Não-binário(a)', 'Gênero fluido'].map(label => (
                <button key={label} onClick={() => setGenero(genero === label ? '' : label)} style={{ padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: `1.5px solid ${genero === label ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: genero === label ? 'var(--accent-light)' : 'var(--white)', color: genero === label ? 'var(--accent-dark)' : 'var(--muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {label}<Tooltip label={label} />
                </button>
              ))}
            </Secao>
            <Secao titulo="Pronomes" obrigatorio>
              {['Ela/Dela','Ele/Dele','Elu/Delu'].map(op => <TagUnica key={op} label={op} valor={op} current={pronomes} onChange={setPronomes} />)}
            </Secao>
            <Secao titulo="Orientação sexual" obrigatorio>
              {['Heterossexual','Homossexual','Bissexual','Pansexual','Assexual','Demissexual','Queer'].map(op => (
                <button key={op} onClick={() => setOrientacao(orientacao === op ? '' : op)} style={{ padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: `1.5px solid ${orientacao === op ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: orientacao === op ? 'var(--accent-light)' : 'var(--white)', color: orientacao === op ? 'var(--accent-dark)' : 'var(--muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {op}<Tooltip label={op} />
                </button>
              ))}
            </Secao>
            <Secao titulo="Status civil" obrigatorio>
              {['Solteiro(a)','Enrolado(a)','Casado(a)','Divorciando','Divorciado(a)','Viúvo(a)','Relacionamento aberto'].map(op => <TagUnica key={op} label={op} valor={op} current={statusCivil} onChange={setStatusCivil} />)}
            </Secao>
          </div>
        )}

        {/* ===== ETAPA 4 — ESTILO DE VIDA ===== */}
        {etapa === 4 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px' }}>Estilo de vida</h2>
            <Secao titulo="Tabaco" obrigatorio>
              {['Fumo','Fumo ocasionalmente','Não fumo'].map(op => <TagUnica key={op} label={op} valor={op} current={fumo} onChange={setFumo} />)}
            </Secao>
            <Secao titulo="Bebida alcoólica" obrigatorio>
              {['Consumo bebida alcoólica','Bebo socialmente','Não consumo bebida alcoólica'].map(op => <TagUnica key={op} label={op} valor={op} current={bebida} onChange={setBebida} />)}
            </Secao>
            <Secao titulo="Outras substâncias">
              <Tag label="Consumo cannabis" ativo={cannabis} onClick={() => setCannabis(!cannabis)} />
            </Secao>
            <Secao titulo="Rotina e estilo de vida" obrigatorio>
              {['Pratico academia','Pratico esporte regularmente','Sou sedentário(a)','Sou caseiro(a)','Gosto de sair','Gosto de balada','Sou noturno(a)','Sou matutino(a)','Sou workaholic','Tenho vida equilibrada'].map(tag => <Tag key={tag} label={tag} ativo={rotina.includes(tag)} onClick={() => toggleTag(rotina, setRotina, tag)} />)}
            </Secao>
            <Secao titulo="Personalidade" obrigatorio>
              {['Sou extrovertido(a)','Sou introvertido(a)','Sou ambiverte','Sou tímido(a)','Sou comunicativo(a)','Sou antissocial','Sou reservado(a)','Sou agitado(a)','Sou calmo(a)','Sou intenso(a)'].map(tag => <Tag key={tag} label={tag} ativo={personalidade.includes(tag)} onClick={() => toggleTag(personalidade, setPersonalidade, tag)} />)}
            </Secao>
            <Secao titulo="Hobbies e interesses" obrigatorio>
              {['Sou gamer','Adoro ler','Viciado(a) em filmes','Viciado(a) em séries','Curto anime / mangá','Curto música ao vivo','Faço fotografia','Arte e desenho','Danço','Faço teatro','Meditação / Yoga','Adoro viajar','Curto trilha e natureza','Sou otaku','Curto k-pop','Sou emo / punk','Sou e-girl / e-boy'].map(tag => <Tag key={tag} label={tag} ativo={hobbies.includes(tag)} onClick={() => toggleTag(hobbies, setHobbies, tag)} />)}
            </Secao>
            <Secao titulo="Esportes" obrigatorio>
              {['Gosto de futebol','Não gosto de futebol','Pratico corrida','Pratico natação','Ando de bicicleta','Pratico artes marciais','Gosto de churrasco','Não pratico esportes'].map(op => <TagUnica key={op} label={op} valor={op} current={esportes} onChange={setEsportes} />)}
            </Secao>
            <Secao titulo="Alimentação" obrigatorio>
              {['Sou vegano(a)','Sou vegetariano(a)','Sou carnívoro(a)','Como de tudo','Prefiro alimentação saudável','Cozinho bem','Não cozinho','Curto comida japonesa','Curto fast food','Tenho intolerância à lactose','Tenho intolerância ao glúten'].map(tag => <Tag key={tag} label={tag} ativo={alimentacao.includes(tag)} onClick={() => toggleTag(alimentacao, setAlimentacao, tag)} />)}
            </Secao>
            <Secao titulo="Estilo de se vestir" obrigatorio>
              {['Social','Casual','Esportivo','Alternativo','Eclético','Gótico','Punk','E-girl / E-boy','K-pop'].map(tag => <Tag key={tag} label={tag} ativo={estiloVestir.includes(tag)} onClick={() => toggleTag(estiloVestir, setEstiloVestir, tag)} />)}
            </Secao>
            <Secao titulo="Gosto musical" obrigatorio>
              {['Funk','Sertanejo','Pagode','Rock','Metal','Pop','Eletrônica','Hip-hop / Rap','MPB / Bossa Nova','Gospel','K-pop','Clássica','Eclético — curto de tudo','Não gosto de música'].map(tag => <Tag key={tag} label={tag} ativo={musica.includes(tag)} onClick={() => toggleTag(musica, setMusica, tag)} />)}
            </Secao>
            <Secao titulo="Toco instrumento ou canto?">
              {['Toco guitarra / violão','Toco piano / teclado','Toco bateria','Toco baixo','Toco outro instrumento','Canto / sou cantor(a)','Não toco instrumento'].map(tag => <Tag key={tag} label={tag} ativo={instrumento.includes(tag)} onClick={() => toggleTag(instrumento, setInstrumento, tag)} />)}
            </Secao>
          </div>
        )}

        {/* ===== ETAPA 5 — VALORES ===== */}
        {etapa === 5 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px' }}>Valores e vida</h2>
            <Select label="Religião / espiritualidade" obrigatorio value={religiao} onChange={setReligiao} options={['Evangélico(a)','Católico(a)','Espírita','Umbandista','Candomblé','Budista','Judaico(a)','Islâmico(a)','Hindu','Agnóstico(a)','Ateu / Ateia','Espiritualizado(a) sem religião']} />
            <Secao titulo="Filhos e família" obrigatorio>
              {['Tenho filhos','Não tenho filhos','Quero ter filhos','Não quero ter filhos','Aberto(a) à adoção','Ainda não decidi'].map(tag => <Tag key={tag} label={tag} ativo={filhos.includes(tag)} onClick={() => toggleTag(filhos, setFilhos, tag)} />)}
            </Secao>
            <Secao titulo="Animais de estimação" obrigatorio>
              {['Tenho cachorro','Tenho gato','Tenho outros pets','Adoro animais','Não tenho pets','Tenho alergia a animais','Não gosto de animais'].map(tag => <Tag key={tag} label={tag} ativo={pets.includes(tag)} onClick={() => toggleTag(pets, setPets, tag)} />)}
            </Secao>
            <Select label="Escolaridade" obrigatorio value={escolaridade} onChange={setEscolaridade} options={['Ensino fundamental','Ensino médio completo','Ensino superior incompleto','Ensino superior completo','Pós-graduado(a)','Mestrado','Doutorado','Concursado(a)','Sou estudante']} />
            <Select label="Situação profissional" obrigatorio value={trabalho} onChange={setTrabalho} options={['CLT','Empreendedor(a)','Freelancer','Profissional liberal','Servidor(a) público(a)','Autônomo(a)','Trabalho remoto','Estou desempregado(a)']} />
            <Select label="Nacionalidade" obrigatorio value={nacionalidade} onChange={setNacionalidade} options={['Brasileiro(a)','Nordestino(a)','Gaúcho(a)','Paulistano(a)','Carioca','Mineiro(a)','Estrangeiro(a)','Latino(a)','Europeu(a)','Asiático(a)']} />
            <Secao titulo="Idiomas que falo" obrigatorio>
              {['Falo somente português','Falo inglês','Falo espanhol','Falo francês','Falo italiano','Falo alemão','Falo japonês / mandarim','Sou bilíngue','Sou trilíngue ou mais'].map(tag => <Tag key={tag} label={tag} ativo={idiomas.includes(tag)} onClick={() => toggleTag(idiomas, setIdiomas, tag)} />)}
            </Secao>
          </div>
        )}

        {/* ===== ETAPA 6 — OBJETIVOS ===== */}
        {etapa === 6 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>O que busco?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Seja honesto(a). Isso ajuda a encontrar pessoas realmente compatíveis.</p>
            <Secao titulo="Busco na plataforma" obrigatorio>
              {['Relacionamento sério','Relacionamento casual','Amizade','Companhia para eventos','Relação conjugal','Aberto(a) a experiências','Sugar Baby','Sugar Daddy / Mommy','Ainda estou definindo'].map(tag => <Tag key={tag} label={tag} ativo={objetivos.includes(tag)} onClick={() => toggleTag(objetivos, setObjetivos, tag)} />)}
            </Secao>
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', border: '1px solid #c9a84c', borderRadius: '20px', padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #c9a84c, #f5d485, #c9a84c)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#f5d485', fontFamily: 'var(--font-fraunces)' }}>Camarote</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#c9a84c', border: '1px solid #c9a84c', borderRadius: '100px', padding: '2px 8px', letterSpacing: '1px' }}>BLACK</span>
              </div>
              <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px', lineHeight: '1.6' }}>
                Estas preferências são visíveis <strong style={{ color: '#f5d485' }}>apenas para outros assinantes Camarote</strong> que também as selecionaram.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Busco trisal','Swing / relacionamento aberto','Poliamor','BDSM / fetiches'].map(tag => (
                  <button key={tag} onClick={() => toggleTag(discreto, setDiscreto, tag)} style={{ padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: `1.5px solid ${discreto.includes(tag) ? '#f5d485' : 'rgba(201,168,76,0.4)'}`, backgroundColor: discreto.includes(tag) ? 'rgba(245,212,133,0.15)' : 'rgba(255,255,255,0.05)', color: discreto.includes(tag) ? '#f5d485' : '#888', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ERRO */}
        {erro && (
          <div style={{ backgroundColor: '#fff0f0', border: '1px solid var(--red)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ color: 'var(--red)', fontSize: '14px', fontWeight: '600' }}>{erro}</p>
          </div>
        )}

        {/* BOTÕES */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {etapa > 0 && (
            <button onClick={() => { setEtapa(etapa - 1); setErro('') }} style={{ flex: 1, padding: '14px', borderRadius: '100px', border: '2px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ChevronLeft size={18} /> Voltar
            </button>
          )}
          <button onClick={salvarEtapa} disabled={salvando || verificandoFoto !== null} style={{ flex: 2, padding: '14px', borderRadius: '100px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (salvando || verificandoFoto !== null) ? 0.6 : 1, boxShadow: '0 8px 24px rgba(46,196,160,0.3)' }}>
            {salvando ? 'Salvando...' : verificandoFoto !== null ? 'Verificando foto...' : etapa === 6 ? 'Concluir perfil' : 'Continuar'} {!salvando && verificandoFoto === null && <ChevronRight size={18} />}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
          <a href="/deletar-conta" style={{ color: 'rgba(248,249,250,0.25)', textDecoration: 'none' }}>
            Deletar minha conta
          </a>
        </p>

      </div>
    </div>
  )
}
