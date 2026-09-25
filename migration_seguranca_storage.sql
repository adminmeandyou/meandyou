-- ============================================================================
-- SEGURANÇA S10: storage (testado em produção em 2026-09-25; arquivos de teste apagados)
--   * fotos (bucket PÚBLICO): qualquer usuário subia arquivo na pasta de outro e na raiz
--     → contorna a moderação (Sightengine) e hospeda qualquer coisa em link do MeAndYou
--   * documentos: upload direto na própria pasta, sem passar pela API de verificação
--     → dava pra mandar qualquer imagem como "documento" e ganhar o selo
-- Todos os uploads do app passam pelo servidor (service_role, que ignora RLS):
--   api/moderar-foto, api/upload-verificacao, api/bugs/reportar, api/badges/*
-- Então o navegador não precisa gravar nesses buckets. Policies RESTRICTIVE somam
-- (AND) com as que já existem, sem precisar saber o nome delas.
-- Seguro rodar mais de uma vez.
-- ============================================================================

drop policy if exists meandyou_no_client_insert on storage.objects;
create policy meandyou_no_client_insert on storage.objects
  as restrictive for insert to anon, authenticated
  with check (bucket_id not in ('fotos', 'documentos', 'badge-images', 'bug-screenshots'));

drop policy if exists meandyou_no_client_update on storage.objects;
create policy meandyou_no_client_update on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id not in ('fotos', 'documentos', 'badge-images', 'bug-screenshots'));

drop policy if exists meandyou_no_client_delete on storage.objects;
create policy meandyou_no_client_delete on storage.objects
  as restrictive for delete to anon, authenticated
  using (bucket_id not in ('fotos', 'documentos', 'badge-images', 'bug-screenshots'));

-- documentos: nem listar/baixar pelo navegador (admin vê por URL assinada gerada no servidor)
drop policy if exists meandyou_no_client_read_documentos on storage.objects;
create policy meandyou_no_client_read_documentos on storage.objects
  as restrictive for select to anon, authenticated
  using (bucket_id <> 'documentos');

-- ROLLBACK:
-- drop policy if exists meandyou_no_client_insert on storage.objects;
-- drop policy if exists meandyou_no_client_update on storage.objects;
-- drop policy if exists meandyou_no_client_delete on storage.objects;
-- drop policy if exists meandyou_no_client_read_documentos on storage.objects;
