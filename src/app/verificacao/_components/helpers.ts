import { ArrowLeft, ArrowRight, EyeOff, ScanFace, Smile } from 'lucide-react'
import { createElement } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Status = 'loading' | 'desktop' | 'aguardando' | 'dados' | 'doc_frente' | 'doc_verso' | 'selfie' | 'enviando' | 'sucesso' | 'erro' | 'expirado' | 'usado'
export type ModoCaptura = 'escolha' | 'camera' | 'arquivo'

// ─── Constantes ───────────────────────────────────────────────────────────────

export const PASSOS_LIVENESS = [
  { id: 'esquerda', instrucao: 'Olhe para a esquerda'  },
  { id: 'direita',  instrucao: 'Olhe para a direita'   },
  { id: 'frente',   instrucao: 'Olhe para a câmera'    },
  { id: 'piscar',   instrucao: 'Pisque uma vez'        },
  { id: 'sorriso',  instrucao: 'Sorria!'               },
]

export const LIVENESS_ICON: Record<string, React.ReactNode> = {
  esquerda: createElement(ArrowLeft,  { size: 40, strokeWidth: 1.5 }),
  direita:  createElement(ArrowRight, { size: 40, strokeWidth: 1.5 }),
  frente:   createElement(ScanFace,   { size: 40, strokeWidth: 1.5 }),
  piscar:   createElement(EyeOff,     { size: 40, strokeWidth: 1.5 }),
  sorriso:  createElement(Smile,      { size: 40, strokeWidth: 1.5 }),
}

export const FACE_API_CDNS = [
  {
    script: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js',
    models: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model',
  },
  {
    script: 'https://unpkg.com/@vladmandic/face-api@1.7.12/dist/face-api.js',
    models: 'https://unpkg.com/@vladmandic/face-api@1.7.12/model',
  },
]

// ─── Draft (localStorage) ─────────────────────────────────────────────────────

export const VERIF_DRAFT_KEY = 'meandyou_verif_draft'

export function salvarVerifDraft(dados: Record<string, unknown>) {
  try { localStorage.setItem(VERIF_DRAFT_KEY, JSON.stringify(dados)) } catch {}
}

export function carregarVerifDraft() {
  try { const raw = localStorage.getItem(VERIF_DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

export function limparVerifDraft() {
  try { localStorage.removeItem(VERIF_DRAFT_KEY) } catch {}
}

// ─── Validação e formatação ───────────────────────────────────────────────────

export function validarCPF(cpfRaw: string): boolean {
  const c = cpfRaw.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(c[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(c[10])
}

export function formatarCPF(valor: string) {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
  return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
}

// ─── Funções de geometria facial ──────────────────────────────────────────────

export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

export function calcularEAR(pontos: { x: number; y: number }[]) {
  const A = dist(pontos[1], pontos[5])
  const B = dist(pontos[2], pontos[4])
  const C = dist(pontos[0], pontos[3])
  return (A + B) / (2.0 * C)
}

// ─── Verificação de nitidez ───────────────────────────────────────────────────

export function verificarNitidez(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const { width, height } = canvas
    const sx = Math.floor(width * 0.1), sy = Math.floor(height * 0.1)
    const sw = Math.floor(width * 0.8), sh = Math.floor(height * 0.8)
    const data = ctx.getImageData(sx, sy, sw, sh).data
    let sumSq = 0, count = 0
    for (let i = 0; i < data.length - 4; i += 20) {
      const g1 = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const g2 = data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114
      const diff = g1 - g2
      sumSq += diff * diff
      count++
    }
    return count > 0 ? (sumSq / count) > 40 : true
  } catch {
    return true
  }
}

// ─── Detecção de mobile ───────────────────────────────────────────────────────

export function isMobile() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const isEmulator = /bluestacks|nox|memu|ldplayer|gameloop|android.*sdk|sdk.*android/i.test(ua)
  if (isEmulator) return false
  const uaIsMobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
  if (!uaIsMobile) return false
  const hasTouchApi = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  return hasTouchApi
}
