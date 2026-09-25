# Checklist de lançamento — MeAndYou

Uma etapa por vez. Cada etapa concluída = commit local. Push só com ok do Leandro (push publica na Vercel).

## Etapas

- [x] 1. LGPD — levantar o que o app já tem e o que falta (termos, privacidade, cookies, consentimento, exclusão de conta, exportação de dados, dados sensíveis/biometria)
- [x] 2. LGPD — aplicar as correções levantadas na etapa 1
- [x] 3. Auditoria de funcionalidades (fluxos principais: cadastro, verificação, perfil, discovery, match, chat, videochamada, planos/pagamento)
- [x] 4. Correção dos erros encontrados na etapa 3 (feita junto com a 3; baixas prioridades anotadas)
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
- D9 Aplicar `migration_cancellation_requests.sql`, `migration_push_subscriptions.sql` e `migration_rpc_distancia.sql` (criam o que falta; sem risco).
- D10 [BLOQUEADOR] Aplicar `migration_seguranca_admin.sql` logo DEPOIS do deploy (fecha views e RPCs de admin pro navegador).
- D11 [BLOQUEADOR] Aplicar `migration_seguranca_rpcs_usuario.sql` (ver "Ordem para aplicar").
- D12 [BLOQUEADOR] Aplicar `migration_seguranca_escritas.sql`.
- D13 [BLOQUEADOR] Aplicar `migration_seguranca_storage.sql`, `migration_seguranca_fotos.sql` e `migration_analytics_events.sql`.
- D14 Prova social inventada na landing ("+1.000 pessoas", notificações falsas de cadastro): manter, trocar por número real, ou remover?

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
- [x] F6 `/admin/seguranca` reescrita para usar a nova `api/admin/verificacoes` (lê `users`, URLs assinadas de 10 min para selfie/frente/verso, aprovar grava `users.verified` e `profiles.verified`). Pendentes = quem enviou arquivos e não está verificado.
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
- [x] F8 criada `migration_cancellation_requests.sql` (colunas que o admin usa; leitura só admin/equipe). Rota de cancelar agora loga o erro do insert (antes engolia).
- [x] F9 criada `migration_push_subscriptions.sql` (colunas usadas por push/subscribe e lib/push). Só servidor acessa.

### Tabelas/RPCs usadas no código que NÃO existem no banco (varredura completa)
- [x] F11 [ALTA] view `public_profiles` inexistente → "Quem curtiu você" (/curtidas), pedido de perfil nas salas e modo casal quebrados. Trocado para `profiles` (mesmas colunas).
- [x] F12 [ALTA] RPC `get_or_create_conversation` inexistente → botão de iniciar conversa em /matches não fazia nada. Agora navega para `/conversas/{matchId}` (padrão do resto do app).
- [x] F13 [ALTA] RPC `use_lupa` inexistente → "Revelar com lupa" em /destaque sempre dava 500 (item pago). Reescrito na API com desconto atômico (compare-and-swap).
- [x] F14 [MÉDIA] RPC `get_user_distance` inexistente → distância no perfil vazia. Tela protegida contra `undefined` + criada `migration_rpc_distancia.sql` (servidor, km inteiro, a partir do usuário logado).
- F15 [BAIXA] `video_call_logs` inexistente (e `video_calls` não tem duração) → emblemas de videochamada nunca são concedidos.
- F16 [BAIXA] `support_tickets` inexistente → card do /admin (dashboard) falha. `update_profile_score`, `get_users_with_referrals` inexistentes, mas com try/catch (sem efeito visível).
- F17 [BAIXA] `analytics_events`/`profile_views` inexistentes → só logs (moderar-foto, validar-token, deletar-conta).
- F18 [BAIXA] /admin (dashboard) lê `video_calls.duration_minutes`, coluna que não existe.

### Colunas erradas (varredura completa select/insert/update × esquema)
- [x] F19 [ALTA] videochamada usava `video_minutes.minutes`; a coluna é `minutes_used`. Limite de minutos por plano nunca era aplicado (vídeo ilimitado pra todos) e nada era contado.
- [x] F20 [ALTA] login gravava `profiles.last_active_at` (não existe) junto com `last_seen`; o update inteiro falhava e o "online" não atualizava no login.
- [x] F21 [ALTA] Vitrine do Camarote (Black) pedia `profiles.age` (não existe) → sempre vazia. Agora usa `birthdate` (filtro por faixa de data + idade calculada).
- [x] F22 [MÉDIA] /admin/denuncias pedia `reports.description` → agora `details`.
- [x] F23 [MÉDIA] exportação de usuários do admin pedia email/cpf/phone em `profiles` e `payments.amount_cents` → falhava. Agora busca em `users`, valor em reais, em lotes. + proteção contra CSV injection (nome começando com =,+,-,@).
- [x] F24 [MÉDIA] campanha de marketing buscava e-mail em `profiles` → nunca enviava nada. Corrigido + agora respeita `notifications_email = false`.
- L13 [MÉDIA/LGPD] e-mails de marketing sem link de descadastro. Adicionar no template antes de usar campanhas.
- F6 (reforço) /admin/seguranca: `profiles.email` e `profiles.selfie_url` não existem.
- F16b /admin (dashboard) `video_calls.duration_minutes` não existe.
- `profiles.profile_completeness` (confirmar-verificacao) não existe (está em try, sem efeito).

### S6 — Painel admin acessível a qualquer usuário (BLOQUEADOR)
Testado com usuário temporário (apagado): usuário comum lê a view `admin_users` (9 usuários com e-mail, nome completo, idade, cidade, denúncias) e `admin_metrics`, e EXECUTA `admin_ban_user`, `admin_unban_user`, `admin_resolve_report` (testei com ID inexistente, nada foi alterado).
- [x] Código: novas rotas `api/admin/consulta` (lê as 4 views com filtros permitidos) e `api/admin/acao` (banir/desbanir/resolver; admin_id sempre da sessão; não deixa banir a si mesmo). Helper `src/lib/adminView.ts` com a mesma sintaxe encadeada. 7 páginas do /admin migradas.
- [ ] D10 [BLOQUEADOR] aplicar `migration_seguranca_admin.sql` DEPOIS do deploy desse código (senão o painel fica sem dados até o deploy).

### S7 — RPCs que confiam no ID enviado pelo cliente (BLOQUEADOR)
Testado com usuário temporário (só contagem, apagado): `get_my_conversations(p_user_id)` e `get_my_matches(p_user_id)` devolvem conversas/matches de QUALQUER usuário. Mesmo padrão em process_like (curtir como outro), room_heartbeat, search_profiles, get_highlights, update_daily_streak, create/rescue_access_request, get_available/rescued_requests.
- [x] `migration_seguranca_rpcs_usuario.sql`: renomeia cada função para `_impl` (sem acesso do cliente) e cria no lugar uma "porteira" com a mesma assinatura que exige ID = usuário logado (servidor, cron e admin passam). Não depende do código atual das funções.
- [ ] D11 [BLOQUEADOR] aplicar no SQL Editor (depois da D5, usa `meandyou_is_staff`).

### Validação das migrations em banco local (2026-09-25)
Todas as migrations de segurança foram aplicadas 2x (idempotentes) num Postgres local que imita o Supabase, e passaram em 42/42 cenários (bloqueia o que deve, não quebra bio/localização/pausar/onboarding/superlike/busca/distância/salas/amizades/servidor/admin). Scripts em `docs/testes-seguranca/`.

### Ordem para aplicar no Supabase (SQL Editor, um arquivo por vez)
1. `migration_lgpd_aceite.sql`
2. `migration_seguranca_colunas_protegidas.sql`
3. `migration_seguranca_leitura.sql`
4. `migration_seguranca_rpcs_usuario.sql`
5. `migration_rpc_distancia.sql`
6. `migration_cancellation_requests.sql`
7. `migration_push_subscriptions.sql`
7b. `migration_seguranca_escritas.sql`
7c. `migration_seguranca_storage.sql`
7d. `migration_seguranca_fotos.sql`
7e. `migration_analytics_events.sql`
8. (depois do deploy do código) `migration_seguranca_admin.sql`

### S8 — Gravações diretas indevidas (teste com IDs inexistentes; 2 linhas gravadas foram apagadas na hora)
- Vulnerável: `matches` (criar match com qualquer um sem curtida mútua), `user_video_extra` (minutos pagos grátis), `access_requests` (pedido já aprovado), `user_badges`, `couple_profiles`.
- Protegido ok: subscriptions, payments, store_purchases, xp_events, fichas_transactions, verification_tokens, messages, likes, notifications, room_members.
- [x] `migration_seguranca_escritas.sql` (só permite ao navegador `matches.status = 'blocked'`, que é o "desfazer match"). Testado local: 11/11 (`docs/testes-seguranca/test_escritas.sql`).
- [ ] D12 aplicar (item 7b da ordem).
- S9 [BAIXA] `video_calls`: navegador insere chamada; RLS não confere se o match é do usuário. Baixo impacto (só cria "tocando"). Mover para API depois.

### S10 — Storage (arquivos de teste apagados)
- `fotos` (público): qualquer usuário subia arquivo na pasta de outro e na raiz (contorna moderação, hospeda qualquer coisa em link do MeAndYou).
- `documentos`: upload direto pelo navegador, sem passar pela API → dava pra burlar a verificação.
- Todos os uploads do app já passam pelo servidor. [x] `migration_seguranca_storage.sql` bloqueia gravação do navegador em fotos/documentos/badge-images/bug-screenshots e leitura de documentos. Testado local 8/8.

### S11 — Upload e URL de foto de perfil
- [x] `api/moderar-foto`: extensão/tipo vinham do navegador (sem Sightengine configurado, qualquer arquivo ia pro bucket público). Agora: tipo real por magic bytes (JPG/PNG/WEBP), máx. 10 MB, índice de slot 0-9.
- [x] O rate limit de 10 uploads/hora (e o de validar-token por IP) dependia de `analytics_events`, que não existia → SEM LIMITE, e cada upload chama o Sightengine (pago). Criada `migration_analytics_events.sql`.
- [x] O navegador grava a URL da foto em `profiles` → dava pra pôr link externo sem moderação. `migration_seguranca_fotos.sql`: foto nova só aceita URL da pasta do próprio usuário em `fotos`. Testado local 5/5.

### Configuração e dependências
- ok: `.env*` no .gitignore, nenhum .env versionado; `NEXT_PUBLIC_*` só com valores públicos (URL, anon key, Turnstile site key, VAPID público).
- ok: cabeçalhos de segurança no next.config (X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP).
- ok: keep-alive do Supabase — crons diários da Vercel (`/api/cron/expire-*`) fazem consultas reais, protegidos por CRON_SECRET. CONFERIR na etapa 7 que CRON_SECRET está setado na Vercel.
- [x] Next 16.1.6 tinha vulnerabilidade CRÍTICA → atualizado para 16.3.6 (mesma major) + `npm audit fix` (ws, nanoid, uuid, svix, resend...). `npm audit`: 0 vulnerabilidades. tsc e build ok.

## Etapa 5 — Auditoria visual / UI / UX (em andamento)

Páginas públicas (/, /login, /cadastro, /termos, /privacidade, /acesso) em 390px e 1440px: sem erro de console, sem rolagem horizontal, visual coerente (escuro, Fraunces + Plus Jakarta, vermelho #E11D48).
- [x] Termos e Privacidade estavam atrás do portão `/acesso` (ninguém de fora conseguia ler). Liberadas no middleware.
- [x] Resumo da Privacidade dizia "excluir todos os seus dados"; agora menciona a retenção legal de pagamentos.
- D14 [DECISÃO — risco legal] Prova social inventada na landing: "+1.000 pessoas já estão usando em {cidade do visitante}" é fixo no código (hoje há 9 perfis), e há notificações aleatórias "Fulana, 28 · acabou de se cadastrar em X" (LandingClient.tsx:184) e "+1.000 pessoas já garantiram" no /lancamento. Isso pode ser propaganda enganosa (CDC art. 37) e é o anti-padrão 12 da sua lista. Sugestão: trocar por número real vindo do banco ou tirar. Não mexi porque é texto seu.
- [x] UI1 [ALTA] Tailwind v4 não gerava nenhuma classe (globals.css usava diretivas do v3). Efeitos: no DESKTOP a sidebar nunca aparecia e o app virava o layout de celular esticado; /curtidas e o PaywallCard sem estilo; spinners `animate-spin` parados. Agora importa só theme+utilities (sem preflight). Landing e login comparados pixel a pixel: sem mudança (fora animações).
- [x] UI2 [ALTA/economia] `useAuth` roda em TODA página e a cada navegação chamava streak + XP de login + localização. Usuário de teste foi a 440 XP / nível 3 / +3 tickets só navegando. Agora: streak+XP 1x por dia por sessão, localização a cada 30 min.
- [x] S12 [ALTA/economia] `/api/xp/award` aceitava QUALQUER evento pedido pelo navegador (ex.: badge_lendario = 500 XP) sem limite. Agora só 8 eventos do app, com teto (login 1/dia; onboarding, perfil completo e 1º match 1x na vida; match 20/dia; mensagem 50/dia; dislike 100/dia; encontro 3/dia), registrado em xp_events.
- [x] UI3 [MÉDIA] ipapi.co era chamado do navegador em toda página (plano grátis = 1.000/dia; já dava 429 no teste) e a landing pedia permissão de GPS ao visitante só para escrever a cidade. Landing/lançamento agora usam `/api/geo` (cabeçalho `x-vercel-ip-city`, grátis, sem GPS).
- [x] Política: incluído OpenStreetMap/Nominatim (busca do local do encontro) e ajustado o uso do ipapi.
- UI4 [BAIXA] /matches: erro "Lock broken by another request with the 'steal' option" (vários clientes Supabase disputando a sessão). Não quebra a tela; revisar depois.
- [x] UI5 /loja em 390px: subtítulo não quebra mais em 3 linhas (reticências), ícone não encolhe.
- UI6 [BAIXA] /cadastro no desktop: botão "Continuar" fica muito abaixo do campo (vão grande).
- [x] UI7 [ALTA] /destaque (Plus/Black) ficava com spinner infinito: o efeito dependia de [period, canAccess] mas saía cedo sem `user`; se o plano carregava antes do usuário, nunca recarregava. `user` adicionado às dependências. (Varri os outros 10 avisos do ESLint do mesmo tipo: todos usam `user?.id` e estão corretos.)
- [x] UI8 [MÉDIA] /indicar: lista de indicados nunca carregava (embed `referred:referred_id(name)` dava 400, sem FK). Agora busca os nomes numa 2ª consulta.
- [x] UI9a /streak "1 Dias" → "1 Dia". - UI9 [BAIXA] /roleta usa roda de cores arco-íris (anti-padrão visual da sua lista).
