// src/app/api/geo/route.ts
// Cidade aproximada do visitante a partir do cabeçalho que a Vercel já envia (grátis,
// sem serviço externo e sem pedir permissão de GPS). Usado só para personalizar o texto
// da landing/lançamento. Em ambiente local o cabeçalho não existe e a cidade vem vazia.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const bruto = req.headers.get('x-vercel-ip-city')
  let city: string | null = null
  if (bruto) {
    try { city = decodeURIComponent(bruto) } catch { city = bruto }
  }
  return NextResponse.json({ city }, { headers: { 'Cache-Control': 'private, max-age=3600' } })
}
