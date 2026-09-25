# Testes das migrations de segurança (banco local, sem tocar produção)

`mock.sql` imita o Supabase (papéis anon/authenticated/service_role, auth.uid()/auth.role(),
tabelas/views/RPCs simplificadas, com as falhas como estavam em produção).
`test.sql` roda 42 cenários como usuário comum, admin, servidor e anônimo.

Como rodar (Postgres local qualquer na porta 54329, usuário/senha postgres):

    psql -h localhost -p 54329 -U postgres -f docs/testes-seguranca/mock.sql
    for m in migration_lgpd_aceite migration_seguranca_colunas_protegidas migration_seguranca_leitura \
             migration_seguranca_admin migration_seguranca_rpcs_usuario migration_rpc_distancia; do
      psql -h localhost -p 54329 -U postgres -v ON_ERROR_STOP=1 -f $m.sql; done
    psql -h localhost -p 54329 -U postgres -tA -f docs/testes-seguranca/test.sql | grep -E "^(ok|FALHOU)"

Nenhuma linha "FALHOU" = tudo certo. Resultado em 2026-09-25: 42/42 ok.
