/**
 * Lista de quebra-gelos criativos organizados por categoria.
 * Usada no painel "Quebra-gelo" do chat para puxar assunto.
 */

export const ICEBREAKERS: string[] = [
  // ─── Filmes / Séries ─────────────────────────────────────
  'Qual série você tá assistindo agora? Me dá uma razão pra eu começar hoje.',
  'Filme que você já viu umas 10 vezes e ainda não cansou. Qual é?',
  'Confessa: qual filme clichê você ama sem nenhuma vergonha?',
  'Série que todo mundo ama mas você achou horrível. Pode ser sincero.',
  'Melhor final de série que você já viu? Ou o pior, se preferir reclamar.',

  // ─── Sair / Balada ───────────────────────────────────────
  'Boteco vagabundo ou bar descolado? Qual define seu sábado ideal?',
  'Qual foi a última balada que valeu a pena? Quero saber o lugar.',
  'Sair pra jantar: lugar novo ou aquele fixo que nunca falha?',
  'Rolê improvisado às 22h: topa ou já tá de pijama?',
  'Qual o rolê mais aleatório que você já topou de última hora?',

  // ─── Viagens ─────────────────────────────────────────────
  'Última viagem que você fez. Me conta em 3 highlights.',
  'Destino dos sonhos que você ainda não foi. Por que é esse?',
  'Viagem barata no Brasil ou mochilão fora? Qual seu estilo?',
  'Qual viagem te marcou mais até hoje? Não precisa ser longe.',
  'Se tivesse passagem pra amanhã de graça, pra onde você embarcava?',

  // ─── Comida ──────────────────────────────────────────────
  'Sua comida conforto, aquela de dia ruim. Qual é?',
  'Restaurante que você levaria alguém num primeiro encontro?',
  'Confessa um prato estranho que você ama.',
  'Abacaxi na pizza: sim ou não? Preciso saber antes de continuar.',
  'Qual sobremesa faz você perder a linha?',

  // ─── Música ──────────────────────────────────────────────
  'Última música que ficou grudada na sua cabeça?',
  'Me solta uma música que define seu mood de hoje.',
  'Show que você ainda quer ver antes de morrer?',
  'Playlist pra tomar banho: entrega uma música.',
  'Aquela música guilty pleasure que você canta alto no carro. Qual é?',

  // ─── O que não suporta ───────────────────────────────────
  'Qual mania te tira do sério na hora?',
  'Red flag que pra você é deal breaker instantâneo?',
  'Qual comportamento em público te deixa com vergonha alheia?',
  'Aquela coisa que todo mundo acha normal e você acha absurdo?',
  'Qual hábito em primeiro encontro faz você desistir?',

  // ─── Medos ───────────────────────────────────────────────
  'Qual seu maior medo bobo? Daqueles que você sabe que é irracional.',
  'Filme ou série que te deu medo de verdade? Pode ser da infância.',
  'Coisa que você tem medo de fazer mas queria muito tentar?',
  'Maior medo na vida adulta, na real?',
  'Se te dessem a escolha: cobra, barata ou palhaço?',

  // ─── Sonhos / Metas ──────────────────────────────────────
  'Um sonho meio absurdo que você ainda planeja realizar?',
  'O que você faria profissionalmente se dinheiro não fosse problema?',
  'Onde você quer estar daqui a 5 anos? Sem clichê, sério.',
  'Qual habilidade você quer aprender esse ano?',
  'Projeto pessoal que tá na sua lista há tempos?',

  // ─── Infância ────────────────────────────────────────────
  'Qual desenho marcou sua infância de verdade?',
  'Qual era seu brinquedo favorito? Ainda tem?',
  'Lembrança de infância que te faz sorrir sozinho?',
  'Que profissão você queria ter quando criança?',
  'Comida de infância que você ainda procura hoje?',

  // ─── Relacionamentos / Flerte ────────────────────────────
  'Qual foi o melhor primeiro encontro que você já teve?',
  'Pior date da sua vida: conta aí, prometo não julgar.',
  'O que te conquista instantaneamente em alguém?',
  'Qual é sua linguagem do amor favorita?',
  'Primeiro beijo marcante: conta a história?',

  // ─── Hobbies / Rotina ────────────────────────────────────
  'Como você gasta seu tempo livre quando ninguém tá olhando?',
  'Hobby novo que você começou ou quer começar?',
  'O que você faz pra desestressar no fim do dia?',
  'Você é mais cedo ou noite? Qual seu horário produtivo?',
  'Qual hábito novo você adotou que mudou seu humor?',

  // ─── Aleatório / Divertido ───────────────────────────────
  'Superpoder mais útil: invisibilidade, voar ou ler mentes?',
  'Se virasse bicho, qual seria e por quê?',
  'Ganhou R$10 mil amanhã e tem 1 dia pra torrar. Faz o quê?',
  'Última coisa que te fez rir tipo chorar de rir?',
  'Maior flex seu que pouca gente sabe?',
]

/**
 * Retorna N quebra-gelos aleatórios sem repetição.
 */
export function pickRandomIcebreakers(count: number = 6): string[] {
  const shuffled = [...ICEBREAKERS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
