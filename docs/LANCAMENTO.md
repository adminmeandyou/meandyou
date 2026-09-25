# Checklist de lançamento — MeAndYou

Uma etapa por vez. Cada etapa concluída = commit local. Push só com ok do Leandro (push publica na Vercel).

## Etapas

- [x] 1. LGPD — levantar o que o app já tem e o que falta (termos, privacidade, cookies, consentimento, exclusão de conta, exportação de dados, dados sensíveis/biometria)
- [x] 2. LGPD — aplicar as correções levantadas na etapa 1
- [~] 3. Auditoria de funcionalidades (fluxos principais: cadastro, verificação, perfil, discovery, match, chat, videochamada, planos/pagamento)
- [ ] 4. Correção dos erros encontrados na etapa 3
- [ ] 5. Auditoria visual / UI / UX (telas, responsividade, estados de loading/erro/vazio)
- [ ] 6. Correção dos problemas da etapa 5
- [ ] 7. Pré-publicação: build, variáveis de ambiente, segurança (checklist global), keep-alive Supabase, domínio
- [ ] 8. Publicar

## Registro

- 2026-09-25: checkpoint `f3d1450` salvo. Sessão anterior (subagentes em paralelo) travou e não deixou alterações de código.

## Etapa 1 — Achados LGPD (2026-09-25)

Já existe: /privacidade, /termos, /deletar-conta (apaga auth, fotos, documentos, mensagens, matches, likes etc.), link de privacidade no rodapé da landing, política cita direitos do art. 18 e DPO (adminmeandyou@proton.me). Bucket `documentos` é PRIVADO (ok). Nenhum script de analytics/pixel no layout (sem banner de cookies obrigatório por enquanto).

Problemas encontrados:

- L1 [ALTA] Cadastro (`src/app/cadastro/page.tsx` + `api/auth/cadastro`) não tem aceite de Termos/Privacidade nem confirmação de 18+. Não fica registrado quando/qual versão o usuário aceitou.
- L2 [ALTA] Verificação não pede consentimento explícito para biometria/documento (LGPD art. 11 exige consentimento específico e destacado). A política diz que ele é pedido, mas o código não pede.
- L3 [ALTA] Política diz que selfie/documento são "descartados após confirmação" e que "nenhuma imagem biométrica é transmitida". O que acontece de verdade: `api/upload-verificacao` grava frente, verso e selfie no bucket `documentos` sem prazo para apagar, e `confirmar-verificacao` não apaga nada. Ou o código passa a apagar, ou o texto muda. → DECISÃO
- L4 [MÉDIA] `upload-verificacao` monta `doc_frente_url`/`selfie_url` com URL `/object/public/` num bucket privado. O link não abre (o que é bom), mas está errado; o admin precisa usar URL assinada.
- L5 [ALTA] Operadores não informados na política: AbacatePay (gateway, recebe CPF), Google Cloud Vision (lê o documento), Sightengine (analisa as fotos), ipapi.co (recebe o IP), Cloudflare Turnstile/Calls, Brevo (se for usado). A política cita "Cloudflare (videochamada)" e "Resend", mas não os outros. Transferência internacional (EUA) precisa de menção explícita (art. 33).
- L6 [MÉDIA] Política diz que as fotos usam "URLs com expiração", mas o bucket `fotos` é público.
- L7 [MÉDIA] Não existe exportação/portabilidade de dados pelo próprio usuário (art. 18 V). Hoje só por e-mail. Aceitável no lançamento se o e-mail responder em 15 dias, mas o ideal é um botão "baixar meus dados".
- L8 [MÉDIA] "Última atualização" em /termos e /privacidade usa `new Date()`, então mostra sempre a data de hoje. Precisa ser uma data fixa.
- L9 [MÉDIA] Controlador sem identificação: falta razão social/CNPJ (ou nome e CPF do responsável) e endereço na política e nos termos. → DECISÃO (dados da empresa)
- L10 [BAIXA] Dados sensíveis coletados no perfil (religião em ValoresSection; orientação sexual, se existir) são dados sensíveis pelo art. 5 II, e a política não trata disso.
- L11 [BAIXA] Conferir se /deletar-conta cobre as tabelas novas (friendships, chat de amigos, salas, casal, backstage). Verificar na etapa 3.

## Decisões pendentes para o Leandro (responder no final)

- D1 (L3) Documentos/selfie de verificação: (a) apagar automaticamente após aprovar/reprovar [recomendado], ou (b) guardar por X dias pra revisão manual e dizer isso na política.
- D2 (L9) Dados do controlador: CNPJ/razão social ou pessoa física responsável, e endereço de contato.
- D3 (L7) Exportação de dados: botão no app agora, ou só por e-mail no lançamento.
- D4 Aplicar `migration_lgpd_aceite.sql` no Supabase de produção (aditiva, sem risco). Posso rodar eu mesmo se você autorizar.
- D5 [BLOQUEADOR] Aplicar `migration_seguranca_colunas_protegidas.sql` no SQL Editor do Supabase (você cola e roda; eu testo depois).
- D6 Confirmar se as 3 contas admin em profiles são suas (S2).
- D8 [BLOQUEADOR] Aplicar `migration_seguranca_leitura.sql` no SQL Editor (depois da D5).

## Etapa 2 — Correções LGPD (em andamento)

- [x] L8 data fixa "25 de setembro de 2026" em /termos e /privacidade
- [x] L1 checkbox obrigatório (18+ e aceite de Termos/Privacidade) no último passo do cadastro; API recusa sem aceite e grava `terms_accepted_at`, `terms_version`, `age_confirmed` em `users`. Enquanto a migration não for aplicada, o cadastro funciona normal e só loga erro.
  - PENDENTE D4: aplicar `migration_lgpd_aceite.sql` no Supabase (só adiciona 3 colunas).
- [x] L2 checkbox obrigatório de consentimento (CPF, documento, selfie/biometria, leitura automática) na tela "Seus dados" da verificação.
- [x] L12 (novo) rascunho da verificação (selfie base64 + CPF) saía no localStorage e ficava pra sempre; agora vai para o sessionStorage e o resto legado é apagado.

## !!! BLOQUEADOR DE LANÇAMENTO — S1 (achado em 2026-09-25)

Testado em produção com um usuário temporário (apagado logo depois): qualquer usuário logado, usando só a chave pública (anon) pelo navegador, consegue fazer UPDATE no próprio registro e mudar:
- `profiles.role = 'admin'` → vira admin completo (painel /admin, exportar usuários com CPF, injetar saldo)
- `profiles.plan` / `users.plan = 'black'` → plano pago de graça
- `profiles.verified` / `users.verified = true` → selo de verificado sem documento
- `profiles.banned` / `users.banned = false` → se desbane sozinho
Causa: a policy de UPDATE de `profiles`/`users` deixa o dono editar qualquer coluna.
Correção: migration com trigger que bloqueia essas colunas para quem não é service_role/admin (ver `migration_seguranca_colunas_protegidas.sql`). PRECISA SER APLICADA no Supabase antes de publicar (D5).
- S1b: saldos também vulneráveis: user_fichas, user_superlikes, user_boosts, user_tickets, user_lupas, user_rewinds aceitaram `amount = 9999` direto do navegador. `staff_members` está protegida (RLS recusou).
- S1c: `users.email_verified` também era editável → dava pra pular a confirmação de e-mail.
- Correção pronta: `migration_seguranca_colunas_protegidas.sql` (triggers; libera service_role, RPCs SECURITY DEFINER e admin/equipe; tem ROLLBACK comentado no fim).
  - Como aplicar: Supabase > SQL Editor > colar o arquivo inteiro > Run. (Não tenho acesso SQL direto; só REST.)
  - Depois de aplicar, testar: curtir, superlike, usar boost, comprar na loja, editar perfil, onboarding, aprovar verificação no admin. Se algo der "Alteração não permitida", é alguma RPC SECURITY INVOKER mexendo em saldo; me avisar.
  - Eu re-rodo o teste de invasão depois (usuário temporário, apagado na hora) pra confirmar.
- S2 [VERIFICAR] 3 perfis com role=admin em produção. Confirmar no Supabase (Table Editor > profiles, filtro role=admin) se as 3 contas são suas. (Minha leitura de e-mails de produção foi bloqueada pela permissão.)
- S3 [BAIXA] `profiles.incognito_until` pode ser editado pelo usuário (usado pelo "pausar conta"), mas também é o "Modo invisível" pago da loja. Dá pra ganhar Modo invisível de graça. Mudar o pausar-conta para uma API no servidor.
- [x] L3 (texto) política agora descreve o que acontece de verdade: documento e selfie guardados em storage privado, apagados ao excluir a conta, com leitura automática do Google Vision. Se D1 = apagar após a análise, ajustar esse parágrafo.
- [x] L5 lista completa de operadores (Supabase, Vercel, Resend, Cloudflare, AbacatePay, Google Vision, Sightengine, ipapi.co) e transferência internacional (art. 33).
- [x] L6 texto das fotos corrigido (bucket `fotos` é público).
- [x] L10 parágrafo sobre dados sensíveis opcionais (o app tem orientação sexual, swing, fetiche, poliamor, religião).
- [x] L11 exclusão de conta agora apaga 30 tabelas a mais (amigos, salas, camarote, sessões, tokens, dislikes, saldos, emblemas, xp...). Registros financeiros ficam guardados de propósito (obrigação fiscal).
- [ ] L4 URL de documento (depende de D1) · [ ] L7 exportação (D3) · [ ] L9 controlador (D2)
- D7: registros financeiros (payments, subscriptions, store_purchases, fichas_transactions) ficam após a exclusão. Confirmar isso na política (hoje ela fala em "prazo legal", ok) ou anonimizar.

## Etapa 3 — Auditoria de funcionalidades (em andamento)

Base: `tsc` ok, `npm run build` ok (sem erros).

Corrigido:
- [x] F1 [ALTA] `api/confirmar-verificacao` dava o selo de verificado sem conferir se documento/selfie foram enviados (dava pra chamar direto). Agora exige `frente.jpg` e `selfie.jpg` no storage.
- [x] F2 [ALTA] `api/enviar-verificacao` era pública e usava userId/e-mail do body: qualquer um disparava e-mail do MeAndYou para qualquer endereço e invalidava o link de outros usuários. Agora usa a sessão.
- [x] F3 [MÉDIA] `api/upload-verificacao` gravava URL "pública" em colunas inexistentes de `profiles` (falhava calada). Agora grava o caminho em `users.documento_url / documento_verso_url / selfie_url` (resolve L4).
- [x] F4 [MÉDIA] upload sem validação de tamanho/tipo real. Agora: máx. 10 MB + checagem por magic bytes (JPEG/PNG/WebP/PDF).
- [x] F5 [ALTA] foto da galeria subia sem compressão; acima de 4,5 MB a Vercel recusa e o usuário via só "Erro ao fazer upload". Agora comprime no navegador (1800px, JPEG 0.85); PDF limitado a 4 MB.

Pendente (anotado):
- F6 [ALTA] `/admin/seguranca` (aba verificações) consulta `profiles.email` e `profiles.selfie_url`, que não existem → a lista vem sempre vazia/erro. Precisa de uma API admin que leia `users` e gere URL assinada do bucket `documentos`. Junto com D1.
- [x] F7 [ALTA] `api/salas/sair` era pública e usava userId/nickname do body: dava pra expulsar qualquer um de qualquer sala e postar mensagem falsa de "Sistema". Agora usa sessão e o apelido do registro.
- ok: `api/auth/reenviar-verificacao-email` confere a sessão.

### S4 — Vazamento de leitura (teste com usuário temporário, só contagens, apagado depois)
- S4a [ALTA/LGPD] qualquer usuário logado lê todas as colunas de todos os perfis, inclusive `rua`, `bairro`, `cep`, `lat`, `lng` (endereço e coordenada exata).
- S4b [ALTA] `room_messages` (11 msgs) e `friendships` legíveis SEM login.
- S4c [BAIXA] `user_badges` legível sem login (inofensivo).
- Correção: `migration_seguranca_leitura.sql` (esconde as 5 colunas de endereço do cliente; restringe friendships às partes e room_messages aos membros; se o RLS estiver desligado, liga preservando as gravações). → D8 aplicar junto com a D5.
- Verificado ok: users (só o próprio), messages, matches, likes, payments, subscriptions, tokens, sessões, denúncias, staff_members etc. retornam 0 para usuário alheio.

### Tabelas que o código usa mas NÃO existem no banco (404)
- F8 `cancellation_requests` → `/admin/cancelamentos` quebrado (e o pedido de cancelamento do usuário provavelmente também). VERIFICAR na etapa 3.
- F9 `push_subscriptions` → notificações push não funcionam. VERIFICAR.
- F10 `analytics_events`, `profile_views` → só a exclusão de conta referencia (loga erro, inofensivo). Conferir se "quem viu meu perfil" existe em outra tabela.
- S5 [MÉDIA] o cliente da sala (`salas/[id]` linha ~152) insere mensagens de "Sistema" em nome de outros usuários (sender_id alheio). Se a policy de INSERT de room_messages permitir isso, dá pra forjar mensagens. Mover para o servidor.
