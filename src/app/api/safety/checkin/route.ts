import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marca check-in de um registro de segurança
// Body: { recordId: string }
export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { recordId } = body

  if (!recordId) {
    return NextResponse.json({ error: 'recordId obrigatório' }, { status: 400 })
  }

  const { error } = await supabase
    .from('safety_records')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', recordId)
    .eq('user_id', user.id) // garante que só o dono pode marcar

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
