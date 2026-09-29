// Documentos e selfie da verificação (LGPD arts. 11, 15 e 16): dado sensível/biométrico,
// guardado só enquanto a verificação não termina. Aprovou → apaga. Pedido abandonado → apaga
// depois de PRAZO_PENDENTE_DIAS. Fica só o resultado (users.verified).
import type { SupabaseClient } from '@supabase/supabase-js'

export const PRAZO_PENDENTE_DIAS = 30

export async function apagarDocumentosVerificacao(supabase: SupabaseClient, userId: string) {
  const { data: arquivos, error: listErr } = await supabase.storage.from('documentos').list(userId)
  if (listErr) throw listErr

  if (arquivos && arquivos.length > 0) {
    const { error: rmErr } = await supabase.storage
      .from('documentos')
      .remove(arquivos.map(a => `${userId}/${a.name}`))
    if (rmErr) throw rmErr
  }

  const { error: updErr } = await supabase
    .from('users')
    .update({ selfie_url: null, documento_url: null, documento_verso_url: null })
    .eq('id', userId)
  if (updErr) throw updErr
}
