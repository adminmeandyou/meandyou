# Registro de Correções e Funcionalidades Pendentes

## Como usar
- Cada item tem um ID para referência
- Quando resolvido: mover para seção "Concluídos" no final
- Ordem de execução: de cima para baixo dentro de cada prioridade

---

## 🔴 CRÍTICO

### ~~C1 — Perfil: edição inline no próprio perfil~~ ✅
- Botão lápis no topo-direito do hero substitui o de emergência → vai para editar-perfil
- Seções bio, emblemas, características e tags têm botão "Editar" inline quando usuário vê o próprio perfil
- Bio vazia mostra placeholder "Adicione uma bio..." quando é o próprio usuário

### ~~C3 — Roleta: não toca som de efeito ao girar/parar~~ ✅
- Sons implementados via Web Audio API (sem arquivos externos): ticks ao iniciar, jingle ao ganhar (jackpot = jingle mais épico)

### C4 — Fichas nao sao creditadas apos compra (FINANCEIRO)
- `api/webhooks/cakto/route.ts:31-36` — 4 slugs de fichas (50, 150, 400, 900) sao `TODO` no codigo
- Usuario paga na Cakto mas as fichas nunca chegam na conta
- **Acao:** Leandro precisa criar os 4 produtos na Cakto e substituir os slugs reais no codigo

### C5 — Cancelamento de assinatura nao cancela na Cakto (FINANCEIRO)
- `api/assinatura/cancelar/route.ts:43-46` — TODO explicito: nao chama API da Cakto para parar recorrencia
- Usuario cancela no app, banco marca como cancelado, mas cobranca continua na Cakto
- **Acao:** Aguardando resposta da Cakto sobre endpoint de cancelamento

### ~~C6 — SERVICE_ROLE_KEY usada como credencial em header HTTP~~ ✅
- POST handler de push/send removido — ninguem chamava via HTTP; todos importam enviarPushParaUsuario direto

### ~~C7 — Cron job acessivel sem secret configurado~~ ✅
- Codigo ja tinha !secret guard correto — retorna 401 se CRON_SECRET nao estiver configurado

### ~~C8 — Painel admin sem protecao server-side~~ ✅
- admin/layout.tsx convertido para Server Component — verifica role no servidor antes de renderizar qualquer HTML
- Sidebar extraido para AdminLayoutClient.tsx (client component)

### ~~C9 — Token de convite de casal exposto no URL~~ ✅
- Token salvo em sessionStorage antes do redirect para login
- URL de login nao contem mais o token; limpo do sessionStorage apos aceitar

---

## 🟠 ALTA PRIORIDADE

### A8 — APIs de marketing admin inexistentes
- `admin/marketing/page.tsx` chama dois endpoints que nao foram criados:
  - `GET /api/admin/marketing/historico` — historico de campanhas
  - `PUT /api/admin/notificacoes/settings` — salvar webhook WhatsApp e canais por evento
- Toda a aba de marketing do admin esta quebrada silenciosamente

### A9 — Sistema de XP nunca credita via servidor
- `api/xp/award/route.ts` existe e esta completo
- Nenhuma API route chama `POST /api/xp/award` — so os hooks locais chamam `awardXp()` que depende de RPC
- Bonus 2x XP vendido na loja tambem nunca e aplicado de fato
- **Verificar:** se `award_xp` RPC existe no banco e se chamadas dos hooks estao chegando

### ~~A10 — `containsSensitiveData()` nunca chamada~~ ✅
- Integrada em /api/chat/send — bloqueia mensagens com CPF, cartao de credito e telefone nos DMs

### ~~A11 — Moderacao ausente em DMs~~ ✅
- moderateContent() e containsSensitiveData() adicionados em /api/chat/send
- DMs agora tem a mesma moderacao das salas publicas

### ~~A12 — AppBottomNav "Salas" aponta para /roleta~~ ✅
- Corrigido: href='/salas' agora

### ~~A13 — OnlineIndicator quebrado no chat individual~~ ✅
- Query corrigida: seleciona last_active_at e show_last_active (era last_seen hardcoded)

### ~~A14 — Modal de reportar bug trava em loading~~ ✅
- try/catch/finally adicionado em enviarBug() — modal nao trava mais se fetch falhar

### A15 — Views `admin_users` e `admin_metrics` podem nao existir
- `admin/page.tsx` e `admin/insights/page.tsx` fazem query nessas views
- Se as views nao foram criadas no Supabase, todo o painel admin mostra vazio sem erro visivel
- **Acao:** Verificar se views existem no banco; criar se necessario

### ~~A3 — Boost: CTA no dashboard~~ ✅
- Banner acima dos cards na tela de swipe: se boost ativo mostra contador; se não, CTA "Dar um boost" → /loja

### ~~A4 — Boost: funcionalidade real~~ ✅
- loadDeck ordena perfis com boost ativo no topo (mais recente primeiro); sem boost aparecem depois

### ~~A6 — Emblemas: painel do próprio perfil~~ ✅
- Proprio perfil: grid de todos os emblemas desbloqueados com toggle (toque para ativar/desativar)
- Badge vermelho com checkmark indica emblema em exibicao; contador "X/3 em exibicao" no header
- Maximo de 3 emblemas em exibicao; toast de erro se tentar adicionar um 4o
- Perfil alheio: mostra apenas emblemas do showcase; "Ver todos" expande o restante
- Persistido em `profiles.badge_showcase text[]` — requer `migration_a6_emblemas.sql`

### A7 — Emblemas: painel admin não está funcionando
- Emblema criado no painel admin não aparece na loja/perfil
- Função de "enviar para quem se cadastrou antes da data X" não está executando
- Código pronto — depende de rodar `migration_badges_painel.sql` no Supabase

---

## 🟡 MÉDIA PRIORIDADE

### M1 — Funcionalidades da loja que precisam existir de verdade

#### ~~M1a — Superlike~~ ✅
- Push notification enviada ao alvo via /api/likes/superlike-notify após cada superlike

#### ~~M1b — Lupa (ver quem curtiu)~~ ✅
- `usePlan` agora busca saldo de `user_lupas` e seta `canSeeWhoLiked=true` se tiver lupa no inventário

#### ~~M1c — Desfazer curtida~~ ✅
- `lastSwipe` state rastreia último swipe; botão Voltar deleta o like do banco e decrementa contador

#### ~~M1d — Fantasma (modo invisível)~~ ✅
- `useSearch` e `loadDeck` filtram profiles com `ghost_mode_until > now()` após a RPC

#### ~~M1e — Bônus de XP~~ ✅
- `awardXp` em `xp.ts` consulta `xp_bonus_until` antes de chamar a RPC e aplica 2x no `p_base_xp` se ativo
- API route `/api/xp/award` faz o mesmo para chamadas server-side

#### ~~M1f — Selo verificado~~ ✅
- Ao comprar `verified_plus`, agora também concede automaticamente o emblema de Identidade Verificada (busca por `condition_type=on_verify` nos badges)

#### ~~M1g — Caixa Super Lendária~~ ✅
- Backend: sorteio ponderado (superlike/boost/lupa/ghost/reveals/xp/black). Frontend: animação shake→jump→explode→reveal

### M2 — Salas de Bate-Papo (redesign completo)

- [x] Renomear "Salas Sociais" para "Salas de Bate-papo" (busca/page.tsx:765)
- [ ] Salas públicas: Bate-papo 1 ao 20, limite 20 pessoas por sala
- [ ] Salas privadas: criadas por usuários, nome customizável, limite 10 pessoas
- [ ] Salas Black: limite 20 pessoas
- [ ] Modo apenas texto (sem áudio/vídeo)
- [ ] Anti-flood/spam: limite de mensagens por tempo (ex: 3 msgs/10s)
- [ ] Nome fantasia ao entrar na sala (ex: Queijo40, Moranguinho35)
- [ ] Ver perfil: requer solicitação — A pede para ver B; B aceita/ignora/recusa; expira em 3min; se recusado, A não pode reenviar até B desbloquear
- [ ] Chat privado: requer solicitação — mesma lógica com timeout de 3min
- [ ] Bloquear e silenciar usuário dentro da sala
- [ ] Filtro de palavras proibidas em chat, nomes de salas e qualquer campo
- [ ] Alerta automático ao suporte para palavras de abuso, pornografia infantil, crimes
- [ ] Emoticons permitidos no chat
- [ ] Criar design da tela de conversa das salas
- [ ] Testar e garantir funcionamento completo das salas

### M3 — Plano Black: perfil de casal
- Usuário Black pode configurar parceiro(a) com conta ativa
- Parceiro(a) recebe 50% de desconto enquanto perfil duplo estiver ativo
- Card no feed aparece como "casal" (dois perfis em leque/sobrepostos)
- Ao clicar: ver perfil de um e depois do outro
- Parceiro também precisa ter plano ativo para manter o desconto

### ~~M4 — Sistema de amigos / adicionar pessoa~~ ✅
- Botao "Adicionar como amigo" nos cards de novos matches (carrossel)
- Botao "Amigo" na action bar do chat individual
- API `/api/amigos` com GET/POST/PATCH implementada
- Pagina `/amigos` com lista, pedidos recebidos e enviados

### M6 — Reveals de curtidas (lupa) comprados mas sem efeito visual
- Loja credita `curtidas_reveals_until` ao comprar lupa
- Mas nenhuma tela usa esse campo para mostrar quem curtiu de fato
- `/curtidas/page.tsx` so tem blur para Essencial e grid para Plus/Black — lupa nao e usada

### M7 — Verified Plus sem exibicao no app
- Loja ativa `profiles.verified_plus = true` ao comprar
- Nenhuma pagina (perfil, chat, busca) exibe o selo ou diferencia esse usuario
- Feature invisivel para quem comprou

### M8 — Foto aprovada mesmo quando Sightengine esta fora do ar
- `api/moderar-foto/route.ts:86-101` — se Sightengine retornar erro, foto e aprovada automaticamente
- Fotos inapropriadas passam sem moderacao quando o servico cai

### M9 — Rate limit de chat por match, nao global
- `api/chat/send/route.ts` — limite de 20 msgs/min e por match individual
- Usuario com 10 matches pode enviar 200 msgs/min no total

### ~~M5 — Match do dia: garantir algoritmo funcionando~~ ✅
- Compatibilidade mútua implementada (média das duas direções)
- Filtro >= 59% aplicado antes de exibir
- CTA "Curtir e tentar conversar →" para bons matches

---

## 🔵 BAIXO / INFRAESTRUTURA

### ~~B1 — Banco: RPC spend_fichas precisa ser verificada~~ ✅
- RPC nao existia em nenhuma migration — criada em `migration_b1_spend_fichas.sql`
- Assina: `spend_fichas(p_user_id, p_amount, p_description) → boolean`
- Tambem inclui `credit_fichas` para garantir consistencia de parametros
- **Pendencia Leandro:** rodar `migration_b1_spend_fichas.sql` no Supabase SQL Editor

### ~~B2 — Banco: RPC claim_streak_reward precisa creditar corretamente~~ ✅
- Bug no frontend: RPC retorna TABLE (array), mas codigo fazia `data?.success` em vez de `data?.[0]?.success`
- Corrigido em `streak/page.tsx`: usa `Array.isArray(data) ? data[0] : data` antes de checar `success`

### ~~B3 — Moderação de conteúdo global~~ ✅
- `lib/moderation.ts` criado com `moderateContent()`, `moderateRoomName()`, `containsSensitiveData()`
- Integrado no chat das salas e criacao de salas privadas
- Alerta automatico ao suporte para palavras criticas via `/api/salas/alertar`

### B4 — Toast.tsx duplicado
- `components/Toast.tsx` — provider global correto, usado no AppShell
- `components/ui/Toast.tsx` — componente standalone legado com interface diferente
- Remover `components/ui/Toast.tsx` para evitar confusao

### B5 — Aba "Arquivados" em matches sempre vazia
- `matches/page.tsx:151` — botao "Arquivados (0)" mas feature de arquivar nunca foi implementada
- Ou implementar ou remover o botao

### B6 — `show_last_active` ignorado em matches e conversas
- `matches/page.tsx` renderiza `OnlineIndicator` sem verificar preferencia de privacidade
- Usuario que desativou "mostrar quando estou ativo" ainda aparece como online

### B7 — Coluna `photo_face` pode nao existir no schema
- `api/badges/auto-award/route.ts:61` — query referencia `photo_face` da tabela `profiles`
- Verificar nome real das colunas de foto no banco; auto-award pode estar falhando silenciosamente

---

## ✅ Concluídos

- [x] Logo MeAndYou redirecionava para onboarding — corrigido (commit 06a74c1)
- [x] Dashboard: redirecionava para onboarding — removida dependência da coluna `onboarding_done` que não existia (commit 06a74c1)
- [x] Perfil: redireciona para onboarding ao clicar em Perfil — removida coluna `onboarding_done` do SELECT (commit 06a74c1)
- [x] Perfil: imagem não aparecia na pré-visualização — trocado `className="object-cover"` por `style={{ objectFit: 'cover' }}`; adicionado `priority` no hero (commit 06a74c1)
- [x] Loja: compra não descontava fichas — corrigido mismatch de item_key entre frontend e backend; API reescrita (commit 06a74c1)
- [x] Loja: Boost removido da loja — não aparece mais como item comprável (commit 06a74c1)
- [x] Loja: mochila oculta fichas quando aberta — tabs e conteúdo somem quando mochila está aberta (commit 06a74c1)
- [x] Loja: Pacote Lendário redesign — sem "economize/valeria", badge "PROMOÇÃO EXCLUSIVA", preço R$ 174,62, bônus variável 20-70%, caixas variáveis 1-2, aparece só em semanas de pagamento ou slot de 6h (commit 06a74c1)
- [x] Loja: mochila — itens com tempo (Ver curtidas + Bônus XP) — `curtidas_reveals_until` e `xp_bonus_until` com countdown na mochila
- [x] Roleta: parava de uma vez sem desaceleração — adicionado `animateDecelerate` (commit 06a74c1)
- [x] Roleta: erro "tente novamente" sem animação — agora desacelera antes de mostrar toast de erro (commit 06a74c1)
- [x] Roleta: não mostrava o prêmio ganho — corrigido handling de `data[0]` vs `data` no retorno do RPC (commit 06a74c1)
- [x] "Streak" renomeado para "Prêmios diários" — em roleta, streak/page.tsx e AppShell (commit 06a74c1)
- [x] next.config.ts: imagens Supabase não apareciam — adicionado remotePatterns para domínio do Supabase (commit 06a74c1)
- [x] Match do Dia — score de compatibilidade: badge "X% de acordo com o que voce procura", borda accent e CTA para perfis >= 60%
- [x] Modo Busca — filtro client-side por compatibilidade (AND entre categorias, OR dentro de cada categoria)
- [x] Busca vs Descobrir: diferenciados — Descobrir mostra aviso e oculta filtros avançados; Busca exibe todas as categorias
- [x] Seções de editar perfil não abriam — `filtersData &&` bloqueava render para usuários novos
- [x] Barra de completude não avancava — `filtersData` nunca atualizado no estado após salvar
- [x] Revelação gradual removida de editar-perfil e perfil/[id]
- [x] Sistema de XP: awardXp chamado em like, dislike, superlike, match, mensagem, login diário, foto aprovada, compra na loja, perfil 100%
- [x] M2 — Salas de bate-papo: tabelas, RLS, seed de 20 salas publicas + 2 Black, paginas /salas /salas/criar /salas/[id], APIs entrar/criar/alertar, moderacao integrada (commit cb7d359) — **Pendencia Leandro:** rodar `migration_m2_salas.sql` e ativar Realtime
- [x] M3 — Perfil de casal Black: tabela couple_profiles, pagina /configuracoes/casal, API /api/casal, pagina /casal/aceitar para parceiro aceitar convite (commits cb7d359, b5ca97a) — **Pendencia Leandro:** rodar `migration_m3_m4_casal_amigos.sql`
- [x] B3 — Moderacao de conteudo global: lib/moderation.ts criado e integrado em salas (commit cb7d359)
