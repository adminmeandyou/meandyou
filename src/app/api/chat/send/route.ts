// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { moderateContent, getModerationMessage, containsSensitiveData } from '@/app/lib/moderation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_CHARS = 500
const RATE_LIMIT = 20          // máximo de mensagens por janela
const RATE_WINDOW_SECS = 60    // janela de 60 segundos

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId, content } = await req.json()

    if (!matchId || !content?.trim()) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const trimmed = content.trim()

    if (trimmed.length > MAX_CHARS) {
      return NextResponse.json({ error: `Máximo de ${MAX_CHARS} caracteres.` }, { status: 400 })
    }

    // 2a. Moderação de conteúdo
    const mod = moderateContent(trimmed)
    if (mod.blocked) {
      if (mod.critical) {
        // Dispara alerta ao suporte em background (não bloqueia o response)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.meandyou.com.br'}/api/salas/alertar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ palavras: mod.matchedWords, contexto: 'dm', userId: user.id }),
        }).catch(() => {})
      }
      return NextResponse.json({ error: getModerationMessage(mod) }, { status: 422 })
    }

    // 2b. Dados pessoais sensíveis (CPF, cartão, telefone)
    if (containsSensitiveData(trimmed)) {
      return NextResponse.json(
        { error: 'Por segurança, não compartilhe dados pessoais como CPF, cartão ou telefone no chat.' },
        { status: 422 }
      )
    }

    // 2. Verificar que o usuário é participante do match
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .or(`user1.eq.${user.id},user2.eq.${user.id}`)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // 3. Rate limit: conta msgs do usuário neste match na janela de tempo
    const since = new Date(Date.now() - RATE_WINDOW_SECS * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_id', user.id)
      .gte('created_at', since)

    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Muitas mensagens em pouco tempo. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // 4. Inserir mensagem
    const { data: message, error: insertErr } = await supabaseAdmin
      .from('messages')
      .insert({ match_id: matchId, sender_id: user.id, content: trimmed, read: false })
      .select()
      .single()

    if (insertErr) {
      console.error('Erro ao inserir mensagem:', insertErr)
      return NextResponse.json({ error: 'Erro ao enviar mensagem.' }, { status: 500 })
    }

    return NextResponse.json({ message })

  } catch (err) {
    console.error('Erro em /api/chat/send:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
