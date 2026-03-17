import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const { id: sessaoId } = await params

    // Garantir que a sessão pertence ao usuário atual
    const { data: sessao } = await supabaseAdmin
      .from('user_sessions')
      .select('id, user_id')
      .eq('id', sessaoId)
      .eq('user_id', user.id)
      .single()

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    await supabaseAdmin
      .from('user_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessaoId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao encerrar sessão:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
