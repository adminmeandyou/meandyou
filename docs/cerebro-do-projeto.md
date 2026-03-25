# Cerebro do Projeto — MeAndYou

> Documento vivo. Sempre que criar ou alterar uma funcionalidade, atualize a secao correspondente.
> Fonte da verdade: este arquivo reflete o codigo real em `src/`, nao suposicoes ou memoria.
> Ultima atualizacao: 2026-03-24

---

## Indice

1. [Visao Geral](#visao-geral)
2. [Planos e Precos](#planos-e-precos)
3. [Limites por Plano](#limites-por-plano)
4. [Moeda — Fichas](#moeda--fichas)
5. [Loja](#loja)
6. [Roleta](#roleta)
7. [Streak / Premios Diarios](#streak--premios-diarios)
8. [Modos de Exploracao](#modos-de-exploracao)
9. [Filtros de Busca](#filtros-de-busca)
10. [Emblemas (Badges)](#emblemas-badges)
11. [Sistema de XP](#sistema-de-xp)
12. [Salas de Bate-papo](#salas-de-bate-papo)
13. [Camarote](#camarote)
14. [Chat e Conversas](#chat-e-conversas)
15. [Videochamada](#videochamada)
16. [Seguranca de Encontros](#seguranca-de-encontros)
17. [Verificacao de Identidade](#verificacao-de-identidade)
18. [Sistema de Amigos](#sistema-de-amigos)
19. [Perfil de Casal (Black)](#perfil-de-casal-black)
20. [Notificacoes Push](#notificacoes-push)
21. [Emails (40 funcoes)](#emails-40-funcoes)
22. [Painel Admin](#painel-admin)
23. [Rotas do App](#rotas-do-app)
24. [APIs (Route Handlers)](#apis-route-handlers)
25. [Tabelas do Banco](#tabelas-do-banco)
26. [Migrations Pendentes](#migrations-pendentes)
27. [Conexoes entre Sistemas](#conexoes-entre-sistemas)
28. [Pendencias Criticas](#pendencias-criticas)

---

## Visao Geral

**App:** MeAndYou — app de relacionamentos com verificacao biometrica
**Stack:** Next.js 16, React 19, Supabase (Postgres + Auth + Realtime), Vercel
**Dominio:** https://www.meandyou.com.br
**Design:** Dark Romantic v2 — fundo #08090E, accent #E11D48, gold #F59E0B
**Repo:** GitHub -> Vercel (auto-deploy no push para `main`)

---

## Planos e Precos

Arquivo: `src/app/planos/page.tsx`

| Plano | Preco | Icone | Badge |
|-------|-------|-------|-------|
| Essencial | R$ 9,97/mes | Zap (branco) | — |
| Plus | R$ 39,97/mes | Star (vermelho) | "Melhor Custo-Beneficio" |
| Black | R$ 99,97/mes | Crown (dourado) | — |

**Status checkout:** URLs configuradas como `'#'` — pendente configurar gateway AbacatePay.
**Pagamento:** PIX ou cartao, via CheckoutModal (`src/components/CheckoutModal.tsx`).
**Tabela no banco:** `subscriptions` — colunas: `user_id`, `plan`, `status`, `ends_at`.

### O que cada plano inclui

| Feature | Essencial | Plus | Black |
|---------|-----------|------|-------|
| Fotos no perfil | 10 | 10 | 10 |
| Curtidas/dia | 5 | 30 | Ilimitadas |
| SuperCurtidas/dia | 1 | 4 | 10 |
| Tickets roleta/dia | 1 | 2 | 3 |
| Lupas/dia | 0* | 1 | 2 |
| Desfazer curtida | Nao | Sim (1/dia) | Sim |
| Ver quem curtiu | Nao | Sim | Sim |
| Destaque na busca | Nao | Sim | Sim |
| Filtros avancados | Nao | Sim | Sim |
| Filtros Fetiche/Sugar | Nao** | Nao** | Sim |
| Backstage | Nao | Nao | Sim |
| Boosts simultaneos | 1 | 1 | 2 |
| Video/dia | 1h (60min) | 5h (300min) | 10h (600min) |
| Salas de bate-papo | Nao | Sim | Sim |
| Camarote | Nao | Nao | Sim |

*Lupas podem ser compradas na loja por qualquer plano.
**Filtro Fetiche aparece como bloqueado (cadeado) para Essencial e Plus — so Black acessa.

> Nota: o codigo em `usePlan.ts` tem divergencia com a pagina de planos:
> - `planos/page.tsx` mostra "Lupa por dia" para Essencial
> - `usePlan.ts` define `lupasPerDay: 0` para Essencial e `lupasPerDay: 1` para Plus
> O `usePlan.ts` e a fonte de verdade para o backend.

---

## Limites por Plano

Arquivo: `src/hooks/usePlan.ts`

```
PLAN_CONFIG = {
  essencial: { likesPerDay: 5, superlikesPerDay: 1, canUndo: false, canSeeWhoLiked: false,
               canUseAllFilters: false, canUseExclusionFilter: false, canAccessBackstage: false,
               canAccessFetiche: true, maxSimultaneousBoosts: 1, lupasPerDay: 0,
               ticketsPerDay: 1, maxPhotos: 10, videoMinutesPerDay: 60 }

  plus:      { likesPerDay: 30, superlikesPerDay: 5, canUndo: true, canSeeWhoLiked: true,
               canUseAllFilters: true, canUseExclusionFilter: true, canAccessBackstage: false,
               canAccessFetiche: true, maxSimultaneousBoosts: 1, lupasPerDay: 1,
               ticketsPerDay: 2, maxPhotos: 10, videoMinutesPerDay: 300 }

  black:     { likesPerDay: Infinity, superlikesPerDay: 10, canUndo: true, canSeeWhoLiked: true,
               canUseAllFilters: true, canUseExclusionFilter: true, canAccessBackstage: true,
               canAccessFetiche: true, maxSimultaneousBoosts: 2, lupasPerDay: 2,
               ticketsPerDay: 3, maxPhotos: 10, videoMinutesPerDay: 600 }
}
```

### Saldos dinamicos (lidos do banco em tempo real)

| Tabela | Campo | O que representa |
|--------|-------|-----------------|
| `profiles` | `plan` | Plano ativo do usuario |
| `profiles` | `curtidas_reveals_until` | Data ate quando pode ver quem curtiu (compra temporaria) |
| `user_superlikes` | `amount` | Saldo de superlikes avulsos |
| `user_boosts` | `amount` | Saldo de boosts |
| `user_lupas` | `amount` | Saldo de lupas |
| `user_rewinds` | `amount` | Saldo de desfazeres |
| `user_tickets` | `amount` | Saldo de tickets da roleta |
| `likes` | count hoje | Curtidas usadas hoje |

### Regra de inventario sobrescreve plano

Se o usuario tem saldo em `user_lupas > 0`, `canSeeWhoLiked` vira `true` mesmo sem plano Plus.
Se tem saldo em `user_rewinds > 0`, `canUndo` vira `true` mesmo sem plano Plus.

---

## Moeda — Fichas

Fichas sao a moeda interna do app. Usadas para comprar itens na loja.

### Como ganhar fichas

| Fonte | Quantidade |
|-------|------------|
| Compra direta (loja) | 50 / 150 / 400 / 900 |
| Roleta (premio) | 1, 2 ou 5 fichas |
| Caixa Surpresa (premio possivel) | variavel |
| Admin injeta via painel | qualquer valor |

### Como gastar fichas

Todos os itens da loja sao pagos com fichas (ver secao Loja).

### Tabela no banco

`profiles.fichas_balance` — saldo atual.
RPC `spend_fichas(p_user_id, p_amount, p_description)` — debita de forma atomica.
RPC `credit_fichas(p_user_id, p_amount, p_description)` — credita.

---

## Loja

Arquivo: `src/app/loja/page.tsx`
API: `src/app/api/loja/gastar/route.ts`

### Pacotes de fichas (compra com dinheiro real)

| Pacote | Preco | Destaque |
|--------|-------|---------|
| 50 fichas | R$ 5,97 | — |
| 150 fichas | R$ 14,97 | "Mais popular" |
| 400 fichas | R$ 34,97 | — |
| 900 fichas | R$ 59,97 | "Melhor valor" |

**Status:** Checkout via CheckoutModal (AbacatePay) — URLs pendentes de configuracao.

### Pacote Lendario

- Preco: R$ 179,97
- Conteudo: boost + superlikes + caixas variaveis
- Aparece: apenas em semanas de pagamento ou slot de 6h
- URL: `#` (pendente configurar)

### Itens compraveis com fichas

| Item | Key | Fichas/un | Max | Tabela afetada |
|------|-----|-----------|-----|----------------|
| SuperLike | `superlike` | 30 | 10 | `user_superlikes` |
| Boost (30min destaque) | `boost` | 40 | 5 | `user_boosts` |
| Lupa (revela borrados) | `lupa` | 25 | 10 | `user_lupas` |
| Desfazer curtida | `rewind` | 20 | 10 | `user_rewinds` |
| Fantasma 7 dias | `ghost_7d` | 60 | 1 | `profiles.ghost_mode_until` |
| Fantasma 35 dias | `ghost_35d` | 220 | 1 | `profiles.ghost_mode_until` |
| Ver quem curtiu (5 perfis) | `reveals_5` | 50 | 5 | `profiles.curtidas_reveals_until` |
| Bonus XP 3 dias (dobro) | `xp_bonus_3d` | 50 | 1 | `profiles.xp_bonus_until` |
| Selo Verificado Plus (30 dias) | `verified_plus` | 200 | 1 | `profiles.verified_plus` |
| Caixa Surpresa | `caixa_surpresa` | 35 | 5 | sorteia item aleatorio |
| Caixa Super Lendaria | `caixa_lendaria` | 2250 | 1 | sorteia item exclusivo |
| Passaporte Camarote (30 dias) | `passaporte_camarote` | 70 | 1 | acesso ao Camarote — so Black |

### Premios da Caixa Surpresa

Sorteio aleatorio entre: ticket, supercurtida, boost, lupa, rewind, invisivel_1d, plan_plus_1d, plan_black_1d

### Premios da Caixa Super Lendaria

Sorteia EMBLEMAS exclusivos com `condition_type = 'caixa_lendaria'` da tabela badges.
Se nenhum emblema cadastrado ainda, exibe "Emblema Exclusivo — Em breve disponivel no seu perfil".
Para criar os emblemas exclusivos: /admin/emblemas, condition_type = caixa_lendaria.

### Mochila (inventario)

Itens com tempo mostram countdown na mochila:
- `curtidas_reveals_until` — "Ver curtidas" ate a data
- `xp_bonus_until` — "Bonus XP" ate a data

---

## Roleta

Arquivo: `src/app/roleta/page.tsx`
API: `src/app/api/roleta/girar/route.ts`
RPC no banco: `spin_roleta(p_user_id)`

### Custo

1 ticket por giro. Tickets vem do plano (diarios) ou podem ser ganhos no streak/roleta.

### Segmentos da roda (11 segmentos)

| Segmento | Premio | Raridade |
|----------|--------|---------|
| Fichas 1 | 1 ficha | comum |
| Fichas 2 | 2 fichas | comum |
| Fichas 5 | 5 fichas | incomum |
| SuperLike | 1 supercurtida | incomum |
| Lupa | 1 lupa | incomum |
| Ver Curtidas | ver quem curtiu | incomum |
| Boost | 1 boost | incomum |
| Desfazer | 1 rewind | incomum |
| Invisivel | 1 dia invisivel | raro |
| 1 dia Plus | plano Plus por 1 dia | raro |
| 1 dia Black | plano Black por 1 dia | lendario |

### Fluxo tecnico

1. Usuario clica em girar
2. Frontend chama `POST /api/roleta/girar`
3. API valida sessao, chama RPC `spin_roleta` com service_role
4. RPC debita 1 ticket, sorteia premio, credita no inventario
5. API retorna `{ reward_type, reward_amount, was_jackpot }`
6. Frontend anima a roda ate o segmento correto
7. Som de ticks na aceleracao, jingle no ganho (mais epico se jackpot)

---

## Streak / Premios Diarios

Arquivo: `src/app/streak/page.tsx`
Migration: `migration_admin_recompensas.sql`
RPC: `claim_streak_reward`, `generate_streak_calendar`, `extend_streak_calendar`
Tabelas: `streak_calendar`, `streak_calendar_template`

### Calendario padrao (30 dias)

| Dia | Premio | Qtd |
|-----|--------|-----|
| 1 | Ticket | 1 |
| 2 | SuperCurtida | 1 |
| 3 | Ticket | 1 |
| 4 | Lupa | 1 |
| 5 | Ticket | 2 |
| 6 | SuperCurtida | 1 |
| 7 | Boost | 1 |
| 8 | Ticket | 1 |
| 9 | Desfazer | 1 |
| 10 | Ticket | 2 |
| 11 | SuperCurtida | 2 |
| 12 | Lupa | 1 |
| 13 | Ticket | 2 |
| 14 | Boost | 1 |
| 15 | Ticket | 3 |
| 16 | SuperCurtida | 1 |
| 17 | Desfazer | 1 |
| 18 | Ticket | 2 |
| 19 | Lupa | 2 |
| 20 | Boost | 1 |
| 21 | Ticket | 3 |
| 22 | SuperCurtida | 2 |
| 23 | Invisivel 1 dia | 1 |
| 24 | Ticket | 3 |
| 25 | Boost | 2 |
| 26 | Lupa | 2 |
| 27 | SuperCurtida | 3 |
| 28 | Ticket | 4 |
| 29 | Desfazer | 2 |
| 30 | 1 dia Plus | 1 |

Apos dia 30: ciclo repete via `extend_streak_calendar`.
Template e editavel pelo admin em `/admin/recompensas`.

---

## Modos de Exploracao

Arquivo: `src/app/modos/page.tsx` (hub) + `src/app/busca/page.tsx` (busca/swipe/salas/daily)

### 4 modos disponiveis

| Modo | Key | Descricao | Acesso |
|------|-----|-----------|--------|
| Descobrir | `discovery` | Cards de swipe empilhados + action bar | Todos |
| Busca Avancada | `search` | Grid 2 colunas, filtros detalhados | Todos (filtros avancados: Plus/Black) |
| Match do Dia | `daily` | 5 perfis compativeis/dia, cartas viradas | Todos |
| Salas | `rooms` | Bate-papo em grupo | Plus+ |

### Camarote (5o modo)

| Modo | Key | Descricao | Acesso |
|------|-----|-----------|--------|
| Camarote | camarote | Sugar, Fetiche, salas VIP | Black + Passaporte |

### Match do Dia — algoritmo

- Busca ate 20 candidatos via RPC `search_profiles`
- Calcula compatibilidade mutua (media A->B e B->A)
- Filtra >= 59% de compatibilidade
- Exibe os 5 melhores, ordenados por score
- Cache em localStorage por dia (`daily_match_{userId}_{date}`)
- Cartas viradas: usuario clica para revelar, depois pode curtir ou passar

### Swipe (Descobrir)

- Cards empilhados: card de tras em scale(0.94) e opacity 0.55
- Toque lateral: navega entre fotos do perfil
- Carimbos: CURTIR (verde), NOPE (vermelho), SUPER (azul) ao arrastar
- Action bar: Undo, Dislike, SuperLike, Like, Boost
- Boost ativo: banner com countdown no topo

---

## Filtros de Busca

Arquivo: `src/app/modos/page.tsx` (FILTER_CATEGORIES)
Tabela: `filters` no banco (uma linha por usuario)

### Filtros basicos (todos os planos)

| Filtro | Tipo | Padrao |
|--------|------|--------|
| Distancia maxima | slider km | 40km |
| Idade minima | slider | 18 |
| Idade maxima | slider | 60 (120 = sem limite) |
| Genero | pills | Todos |
| Estado/Cidade | autocomplete IBGE | — |

### Opcoes de genero

`all`, `cis_woman`, `cis_man`, `trans_woman`, `trans_man`, `nonbinary`, `fluid`

### Categorias avancadas (Plus/Black)

#### Objetivos (obrigatorio)
`obj_serious`, `obj_casual`, `obj_friendship`, `obj_events`, `obj_conjugal`, `obj_open`, `obj_undefined`

#### Identidade (obrigatorio)
**Orientacao sexual:** `sex_hetero`, `sex_homo`, `sex_bi`, `sex_pan`, `sex_asex`, `sex_demi`, `sex_queer`
**Status civil:** `civil_single`, `civil_complicated`, `civil_married`, `civil_divorcing`, `civil_divorced`, `civil_widowed`, `civil_open`

#### Religiao (obrigatorio)
`rel_evangelical`, `rel_catholic`, `rel_spiritist`, `rel_umbanda`, `rel_candomble`, `rel_buddhist`, `rel_jewish`, `rel_islamic`, `rel_hindu`, `rel_agnostic`, `rel_atheist`, `rel_spiritual`

#### Vicios (obrigatorio)
**Fumo:** `smoke_yes`, `smoke_occasionally`, `smoke_no`
**Bebida:** `drink_yes`, `drink_socially`, `drink_no`

#### Aparencia (opcional)
**Cor dos olhos:** `eye_black`, `eye_brown`, `eye_green`, `eye_blue`, `eye_honey`, `eye_gray`, `eye_heterochromia`
**Cor do cabelo:** `hair_black`, `hair_brown`, `hair_blonde`, `hair_red`, `hair_colored`, `hair_gray`, `hair_bald`
**Tipo de cabelo:** `hair_short`, `hair_medium`, `hair_long`, `hair_straight`, `hair_wavy`, `hair_curly`, `hair_coily`
**Cor de pele/etnia:** `skin_white`, `skin_mixed`, `skin_black`, `skin_asian`, `skin_indigenous`, `skin_latin`, `skin_mediterranean`, `skin_vitiligo`
**Corpo:** `body_underweight`, `body_healthy`, `body_overweight`, `body_obese_mild`, `body_obese_severe`
**Caracteristicas:** `feat_freckles`, `feat_tattoo`, `feat_piercing`, `feat_scar`, `feat_glasses`, `feat_braces`, `feat_beard`

#### Estilo de vida (opcional)
**Rotina:** `routine_gym`, `routine_sports`, `routine_sedentary`, `routine_homebody`, `routine_goes_out`, `routine_party`, `routine_night_owl`, `routine_morning`, `routine_workaholic`, `routine_balanced`
**Personalidade:** `pers_extrovert`, `pers_introvert`, `pers_ambivert`, `pers_shy`, `pers_communicative`, `pers_antisocial`, `pers_calm`, `pers_intense`
**Alimentacao:** `diet_vegan`, `diet_vegetarian`, `diet_carnivore`, `diet_everything`, `food_cooks`, `food_no_cook`

#### Hobbies e musica (opcional)
**Hobbies:** `hob_gamer`, `hob_reader`, `hob_movies`, `hob_series`, `hob_anime`, `hob_photography`, `hob_art`, `hob_dance`, `hob_travel`, `hob_hiking`, `hob_meditation`, `hob_kpop`
**Musica:** `music_funk`, `music_sertanejo`, `music_pagode`, `music_rock`, `music_pop`, `music_electronic`, `music_hiphop`, `music_mpb`, `music_gospel`, `music_eclectic`

#### Familia (opcional)
**Filhos:** `kids_has`, `kids_no`, `kids_wants`, `kids_no_want`, `kids_adoption`, `kids_undecided`
**Pets:** `pet_dog`, `pet_cat`, `pet_loves`, `pet_none`, `pet_allergy`

#### Profissional (opcional)
**Escolaridade:** `edu_highschool`, `edu_college_incomplete`, `edu_college_complete`, `edu_postgrad`, `edu_masters`, `edu_phd`, `edu_civil_servant`, `edu_student`
**Trabalho:** `work_clt`, `work_entrepreneur`, `work_freelancer`, `work_autonomous`, `work_remote`, `work_unemployed`

#### Fetiche e Sugar (bloqueado — apenas Black)
`disc_throuple`, `disc_swing`, `disc_polyamory`, `disc_bdsm`, `obj_sugar_baby`, `obj_sugar_daddy`

### Como os filtros funcionam

- Filtros sao salvos em `profiles` como colunas booleanas (`obj_serious = true/false`)
- Busca usa RPC `search_profiles` com os filtros basicos (distancia, idade, genero)
- Compatibilidade calculada client-side comparando as keys ativas de cada perfil
- Logica: AND entre categorias, OR dentro de cada categoria
- Filtro de exclusao (`canUseExclusionFilter`): disponivel em Plus/Black

---

## Emblemas (Badges)

Arquivo: `src/app/admin/emblemas/page.tsx`
Tabela: `badges` (RLS ativo — escrita via `/api/admin/badges` com service_role)
API admin: `src/app/api/admin/badges/route.ts`

### Raridades

| Raridade | Cor |
|----------|-----|
| comum | #9ca3af (cinza) |
| incomum | #34d399 (verde) |
| raro | #60a5fa (azul) |
| lendario | #f59e0b (dourado) |

### Condicoes possiveis (condition_type)

| Grupo | condition_type | Descricao |
|-------|----------------|-----------|
| Basico | `manual` | Admin concede manualmente |
| Basico | `on_join` | Ao criar conta |
| Basico | `on_verify` | Ao verificar identidade |
| Basico | `profile_complete` | Perfil 100% completo (foto + bio) |
| Basico | `early_adopter` | Pioneiro — entrou antes de data X |
| Curtidas | `likes_received_gte` | Recebeu X+ curtidas |
| Curtidas | `likes_sent_gte` | Enviou X+ curtidas |
| Mensagens | `messages_sent_gte` | Enviou X+ mensagens |
| Mensagens | `messages_received_gte` | Recebeu X+ mensagens |
| Mensagens | `messages_total_gte` | Total de X+ mensagens |
| Matches | `matches_gte` | Fez X+ matches |
| Indicacoes | `invited_gte` | Indicou X+ amigos |
| Streak | `streak_gte` | Streak atual de X+ dias |
| Streak | `streak_longest_gte` | Maior streak historico de X+ dias |
| Videochamada | `video_calls_gte` | Realizou X+ videochamadas |
| Videochamada | `video_minutes_gte` | X+ minutos em videochamadas |
| Loja | `store_purchase` | Fez pelo menos 1 compra |
| Loja | `store_spent_gte` | Gastou X+ fichas |
| Loja | `store_item` | Comprou item especifico |
| Perfil | `photos_gte` | Tem X+ fotos no perfil |
| Plano | `plan_active` | Tem plano Plus ou Black ativo |
| Plano | `plan_black` | Tem plano Black ativo |
| Outros | `meetup_scheduled` | Marcou X+ encontros |
| Outros | `took_bolo` | Reportou ter levado bolo |

### Schema da tabela badges

Colunas: `id text` (gen_random_uuid()::text), `name`, `description`, `icon`, `icon_url text`, `rarity`, `requirement_description`, `condition_type`, `condition_value`, `condition_extra jsonb`, `user_cohort text DEFAULT 'all'`, `is_active`, `is_published`

### Showcase no perfil

- Usuarios podem exibir ate 3 emblemas no showcase
- Coluna: `profiles.badge_showcase text[]`
- Pagina de perfil: toggle para ativar/desativar emblemas do showcase
- Perfil alheio: mostra apenas showcase; "Ver todos" expande o resto

### Auto-award

API: `src/app/api/badges/auto-award/route.ts`
Condicao `on_verify`: disparada automaticamente ao comprar `verified_plus` na loja.

---

## Sistema de XP

Arquivo: `src/app/lib/xp.ts`, `src/app/api/xp/award/route.ts`

### Quando XP e concedido

| Acao | XP base |
|------|---------|
| Like enviado | +XP |
| Dislike | +XP |
| SuperLike | +XP |
| Match recebido | +XP |
| Mensagem enviada | +XP |
| Login diario | +XP |
| Foto aprovada | +XP |
| Compra na loja | +XP |
| Perfil 100% completo | +XP |

### Bonus de XP

Se `profiles.xp_bonus_until > now()`, o XP base e multiplicado por 2x.
O bonus e ativado ao comprar `xp_bonus_3d` na loja (50 fichas).

### Tabela no banco

`profiles.xp_total` e `profiles.xp_level` (ou tabela separada — verificar).
RPC `award_xp(p_user_id, p_base_xp)` — aplica o bonus se ativo.

---

## Salas de Bate-papo

Arquivo: `src/app/salas/page.tsx`, `src/app/salas/[id]/page.tsx`, `src/app/salas/criar/page.tsx`
APIs: `/api/salas/criar`, `/api/salas/entrar`, `/api/salas/alertar`
Migration: `migration_salas.sql`

### Tipos de sala

| Tipo | Limite | Acesso |
|------|--------|--------|
| Publica (1-20) | 20 pessoas | Todos |
| Privada (criada por usuario) | 10 pessoas | Quem entrar |
| Black | 20 pessoas | Plano Black |

### Seed inicial

20 salas publicas + 2 salas Black criadas na migration.

### Moderacao

- `lib/moderation.ts`: `moderateContent()`, `moderateRoomName()`, `containsSensitiveData()`
- Alerta automatico ao suporte para palavras criticas via `/api/salas/alertar`
- DMs tambem tem moderacao (integrada em `/api/chat/send`)

### Pendencias (tarefas.md M2 — nao concluidas)

- Nome fantasia ao entrar (ex: Queijo40)
- Ver perfil com solicitacao (timeout 3min)
- Chat privado com solicitacao
- Bloquear/silenciar dentro da sala
- Anti-flood (3 msgs/10s)

---

## Camarote

Arquivo: `src/app/backstage/page.tsx` (rota atual para Black)
Migration: `migration_camarote_e_indicar.sql`

### Acesso

- Plano Black: acesso automatico
- Outros planos: podem comprar "Passaporte Camarote" por 70 fichas (30 dias)

### O que oferece

- Filtros Fetiche & Sugar desbloqueados
- Salas VIP exclusivas
- Perfis sugar baby / sugar daddy / sugar mommy
- Busca com filtro `disc_bdsm`, `disc_swing`, `disc_throuple`, `disc_polyamory`

### Status das fases

- Fase 1: tabela + acesso + rota — CONCLUIDA
- Fases 2/3/4: conteudo e funcionalidades — PENDENTES
- Migration: `migration_camarote_fase1.sql` precisa ser rodada no Supabase

---

## Chat e Conversas

Arquivos: `src/app/conversas/page.tsx`, `src/app/conversas/[id]/page.tsx`
Hook: `src/hooks/useChat.ts`

### Limites

- Rate limit: 5 msgs/min por match individual (nao global)
- MAX_CHARS: 500 caracteres por mensagem
- Campo correto: `read` (nao `read_at`)

### Formatos especiais de mensagem

| Token | Formato | Renderizacao |
|-------|---------|--------------|
| Nudge | `__NUDGE__` | Separador centrado com icone Zap |
| Convite de encontro | `__CONVITE__:texto` | Card com header + pills de resposta |
| Normal | qualquer outro | ChatBubble (enviado/recebido) |

### Features

- **Quebra-gelo:** 6 sugestoes clicaveis que preenchem o textarea
- **Convite de encontro:** card interativo com pills "Aceito!", "Nao posso", "Em breve", "Me conta mais!"
- **Nudge:** vibra o celular do outro (navigator.vibrate) + animacao shake
- **Avaliacao pos-chat:** aparece apos 5+ msgs, 4 opcoes anonimas
- **Detector de bolo:** aparece ao aceitar convite de encontro
- **Arquivamento:** via localStorage (sem migration), abas Ativos/Arquivados
- **Aba Online:** amigos online com privacidade bidirecional, popup mensagem/ver perfil

### Seguranca

- Moderacao de conteudo em todas as mensagens
- Bloqueio de dados sensiveis (CPF, cartao, telefone)

---

## Videochamada

Arquivo: `src/app/videochamada/[matchId]/page.tsx`, `src/components/VideoCall.tsx`
API token: `src/app/api/livekit/token/route.ts`
Webhook: `src/app/api/webhooks/livekit/route.ts`

### Limites por plano

| Plano | Minutos/dia |
|-------|------------|
| Essencial | 60 min |
| Plus | 300 min |
| Black | 600 min |

### Stack

- LiveKit (`livekit-client`, `livekit-server-sdk`, `@livekit/components-react`)
- Token gerado server-side, valido por sessao

---

## Seguranca de Encontros

Arquivo: `src/app/conversas/[id]/page.tsx`

### Registro privado

- Armazenado em `localStorage` (chave `meandyou_meetings`)
- Campos: Com quem, Local, Data, Hora
- Zero backend — privado no dispositivo do usuario

### Check-in pos-encontro (modal bloqueante)

- Detectado automaticamente: `meeting.date + 2h < now AND !checkedIn`
- SEM botao X — usuario obrigado a escolher
- "Estou bem" → marca checkedIn no localStorage
- "Preciso de ajuda — 190" → `tel:190`

### Central de Seguranca (botao Shield)

- Denunciar → abre ReportModal
- Desfazer Match → marca `matches.status = 'blocked'`
- Modo Invisivel → mostra status e link para /loja
- Ligar 190 → `tel:190`

---

## Verificacao de Identidade

Arquivo: `src/app/verificacao/page.tsx`
APIs: `/api/upload-verificacao`, `/api/confirmar-verificacao`, `/api/enviar-verificacao`

### Fluxo

1. Usuario captura selfie com mascara oval SVG
2. Upload para Supabase Storage
3. Moderacao via Sightengine (se fora do ar, foto aprovada automaticamente — BUG M8)
4. Verificacao manual ou automatica
5. Emblema de identidade verificada concedido automaticamente (`condition_type = on_verify`)
6. `profiles.verified = true`

### Coluna no banco

`profiles.verified` — booleano
`users.verified` — tambem existe (tabela users separada)

---

## Sistema de Amigos

Arquivo: `src/app/amigos/page.tsx`
API: `src/app/api/amigos/route.ts` (GET/POST/PATCH)

### Funcionalidades

- Botao "Adicionar como amigo" nos cards de novos matches
- Botao "Amigo" na action bar do chat individual
- Lista de amigos com pedidos recebidos e enviados
- Amigos online aparecem na aba Online em /conversas

### Tabela no banco

`friendships` — colunas: `user_id`, `friend_id`, `status` (pending/accepted/rejected)

---

## Perfil de Casal (Black)

Arquivo: `src/app/configuracoes/casal/page.tsx`, `src/app/casal/aceitar/page.tsx`
API: `src/app/api/casal/route.ts`
Tabela: `couple_profiles`
Migration: `migration_m3_m4_casal_amigos.sql` (pendente rodar no Supabase)

### Como funciona

- Usuario Black convida parceiro(a) com conta ativa
- Parceiro recebe convite, aceita em `/casal/aceitar`
- Token de convite salvo em sessionStorage antes do redirect (nao exposto na URL)
- Parceiro(a) recebe 50% de desconto enquanto perfil duplo ativo
- Card no feed aparece como "casal" (dois perfis sobrepostos)
- Ambos precisam ter plano ativo para manter o desconto

---

## Notificacoes Push

Arquivo: `src/app/api/push/subscribe/route.ts`, `src/app/api/push/send/route.ts`
Lib: `web-push`

### Quando sao enviadas

- Novo match recebido (`/api/matches/notify`)
- SuperLike recebido (`/api/likes/superlike-notify`)
- Boost expirado (`/api/boosts/notify-expired`)
- Mensagem nao lida
- (outras via `sendPushParaUsuario` direto, sem HTTP)

### Tabela no banco

`push_subscriptions` — armazena endpoint + keys do browser

---

## Emails (40 funcoes)

Arquivo: `src/app/lib/email.ts`
Provider: Resend
Domain hardcoded: `https://www.meandyou.com.br`

### Categorias

| Categoria | Funcoes |
|-----------|---------|
| Conta | sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail, sendEmailChangeConfirmEmail |
| Seguranca | sendNewDeviceLoginEmail, sendSuspiciousLoginEmail, sendAccountBlockedEmail, sendAccountDeletedEmail |
| Pagamento | sendPlanActivatedEmail, sendReceiptEmail, sendRenewalReminderEmail, sendPaymentFailedEmail |
| Legal/LGPD | sendTermsUpdatedEmail, sendPrivacyUpdatedEmail, sendDataDeletionConfirmedEmail |
| Onboarding | sendOnboardingTipsEmail, sendIncompleteProfileEmail |
| Suporte | sendSupportTicketOpenedEmail, sendSupportTicketResolvedEmail |
| Verificacao | sendVerificationApprovedEmail, sendVerificationRejectedEmail, sendPhotoRejectedEmail |
| Engajamento | sendNewMatchEmail, sendNewLikeEmail, sendProfileViewEmail, sendConversationStartedEmail, sendUnreadMessageEmail |
| Reativacao | sendNewProfilesNearbyEmail, sendCompatibleProfilesEmail, sendReactivationLikesEmail, sendReactivationStreakEmail, sendReactivationMatchesEmail |
| Gamificacao | sendTicketAvailableEmail, sendRewardReceivedEmail |
| Monetizacao | sendBoostExpiredEmail, sendUpgradePromptEmail, sendSubscriptionPromoEmail |
| Genericos | sendMarketingEmail, sendInstitutionalEmail |

Todas sao `export async` e engolam erros silenciosamente (try/catch sem propagacao).

---

## Painel Admin

Rota base: `/admin`
Layout: `src/app/admin/layout.tsx` — Server Component, verifica role antes de renderizar

### Paginas admin

| Rota | O que faz |
|------|-----------|
| `/admin` | Dashboard com metricas gerais |
| `/admin/usuarios` | Lista e gerencia usuarios |
| `/admin/financeiro` | Receita, assinaturas, pagamentos |
| `/admin/denuncias` | Moderacao de denuncias |
| `/admin/seguranca` | Logs de seguranca |
| `/admin/marketing` | Campanhas e notificacoes em massa |
| `/admin/cancelamentos` | Usuarios que cancelaram |
| `/admin/equipe` | Gestao da equipe de suporte |
| `/admin/emblemas` | CRUD de emblemas — criar, editar, publicar, enviar |
| `/admin/recompensas` | Editar calendario de streak + injetar saldo |
| `/admin/insights` | Metricas avancadas |
| `/admin/bugs` | Relatos de bugs dos usuarios |

### APIs admin

| Endpoint | O que faz |
|----------|-----------|
| `GET/POST /api/admin/badges` | CRUD de emblemas (service role) |
| `POST /api/admin/badges/award` | Concede emblema a usuario |
| `GET /api/admin/usuarios` | Lista usuarios |
| `GET /api/admin/usuarios/export` | Exporta CSV de usuarios |
| `POST /api/admin/injetar-saldo` | Injeta fichas/tickets/etc no usuario |
| `GET /api/admin/marketing/historico` | Historico de campanhas |
| `POST /api/admin/marketing/campanha` | Cria campanha de marketing |
| `GET/POST /api/admin/notificacoes/settings` | Configuracoes de notificacoes |
| `GET/POST /api/admin/recompensas` | Edita template do calendario |
| `GET/POST/PATCH /api/admin/bugs` | Gerencia relatos de bugs |

---

## Rotas do App

### Publicas (sem autenticacao)

`/` landing, `/login`, `/cadastro`, `/recuperar-senha`, `/nova-senha`
`/privacidade`, `/termos`, `/ajuda`, `/fale-conosco`, `/suporte`
`/obrigado`, `/banido`, `/confirmar-email`, `/aguardando-email`

### Protegidas (usuario logado)

`/dashboard`, `/busca` (modos), `/modos`, `/modos-guia`
`/match`, `/matches`, `/chat/[matchId]`
`/conversas`, `/conversas/[id]`
`/perfil`, `/perfil/[id]`
`/configuracoes`, `/configuracoes/editar-perfil`, `/configuracoes/2fa`
`/configuracoes/sessoes`, `/configuracoes/alterar-email`, `/configuracoes/casal`
`/planos`, `/minha-assinatura`
`/loja`, `/destaque`, `/curtidas`
`/roleta`, `/streak`, `/emblemas`, `/recompensas`
`/verificacao`, `/onboarding`
`/videochamada/[matchId]`
`/indicar`, `/notificacoes`
`/backstage` (Black)
`/salas`, `/salas/[id]`, `/salas/criar`
`/amigos`
`/casal/aceitar`
`/deletar-conta`
`/ajuda`, `/fale-conosco`

### Admin

`/admin/*` — verificacao de role server-side

---

## APIs (Route Handlers)

### Auth

`POST /api/auth/login` — login com suporte a 2FA
`POST /api/auth/cadastro` — registro
`POST /api/auth/logout` — logout
`POST /api/auth/recuperar-senha` / `nova-senha`
`DELETE /api/auth/deletar-conta`
`POST /api/auth/alterar-email` / `confirmar-email`
`POST/GET /api/auth/2fa/gerar` / `ativar` / `desativar` / `verificar`
`GET /api/auth/sessoes` / `DELETE /api/auth/sessoes/[id]`
`POST /api/auth/reenviar-verificacao-email`
`POST /api/auth/verificar-email`

### Social

`POST /api/chat/send` — envia mensagem (com moderacao + rate limit)
`GET /api/notificacoes` — lista notificacoes
`GET/POST/PATCH /api/amigos` — sistema de amigos
`GET/POST /api/casal` — perfil de casal (Black)

### Loja e Pagamento

`POST /api/loja/gastar` — compra item com fichas
`POST /api/payments/create` — cria pagamento (AbacatePay)
`GET /api/payments/status/[id]` — status do pagamento
`POST /api/webhooks/abacatepay` — webhook de pagamento
`POST /api/webhooks/cakto` — webhook legado (Cakto)
`POST /api/assinatura/cancelar` — cancela assinatura

### Gamificacao

`POST /api/roleta/girar` — gira a roleta (debita ticket, sorteia premio)
`POST /api/streak/resgatar` — resgata premio do dia
`POST /api/streak/sincronizar` — sincroniza streak
`POST /api/xp/award` — concede XP
`POST /api/badges/auto-award` — auto-concede emblemas
`POST /api/badges/award` — concede emblema especifico

### Boosts e Likes

`POST /api/boosts/activate` — ativa boost
`POST /api/boosts/notify-expired` — notifica boost expirado
`POST /api/likes/superlike-notify` — notifica superlike recebido
`POST /api/matches/notify` — notifica novo match

### Upload e Moderacao

`POST /api/moderar-foto` — modera foto via Sightengine
`POST /api/upload-verificacao` — faz upload de selfie de verificacao
`POST /api/confirmar-verificacao` / `enviar-verificacao`

### Salas

`POST /api/salas/criar` — cria sala privada
`POST /api/salas/entrar` — entra em sala
`POST /api/salas/alertar` — alerta suporte sobre mensagem critica

### Seguranca Encontros

`POST /api/safety/checkin` — registra check-in de encontro
`POST /api/safety/save` — salva dados de seguranca

### Outros

`GET/POST /api/livekit/token` — token de videochamada
`POST /api/webhooks/livekit` — webhook LiveKit
`POST /api/push/subscribe` / `send` — push notifications
`POST /api/suporte` — abre ticket de suporte
`GET /api/validar-token` — valida token de convite
`POST /api/recuperar-senha` (rota legada)
`POST /api/denuncias` — denuncia de usuario

---

## Tabelas do Banco

### Principais

| Tabela | O que armazena |
|--------|----------------|
| `profiles` | Dados do usuario, plano, saldos, filtros basicos, XP |
| `filters` | Filtros avancados (uma coluna booleana por opcao) |
| `subscriptions` | Assinaturas ativas/canceladas |
| `likes` | Curtidas entre usuarios |
| `matches` | Matches formados |
| `messages` | Mensagens do chat |
| `conversations` | Conversas (view ou tabela) |
| `badges` | Catalogo de emblemas |
| `user_badges` | Emblemas concedidos a usuarios |
| `user_superlikes` | Saldo de superlikes |
| `user_boosts` | Saldo de boosts |
| `user_lupas` | Saldo de lupas |
| `user_rewinds` | Saldo de desfazeres |
| `user_tickets` | Saldo de tickets |
| `user_sessions` | Sessoes ativas (2FA/gestao) |
| `streak_calendar` | Calendario de premios diarios por usuario |
| `streak_calendar_template` | Template de 30 dias editavel pelo admin |
| `rooms` | Salas de bate-papo |
| `room_members` | Participantes das salas |
| `room_messages` | Mensagens das salas |
| `friendships` | Amizades entre usuarios |
| `couple_profiles` | Perfis de casal (Black) |
| `push_subscriptions` | Subscricoes push notification |
| `match_ratings` | Avaliacoes anonimas pos-chat |
| `bolo_reports` | Relatos de "levei bolo" |
| `email_change_tokens` | Tokens para troca de email |
| `auth_2fa_pending` | Tokens temporarios do login 2FA |
| `marketing_campaigns` | Historico de campanhas |
| `notification_settings` | Configuracoes de notificacoes (admin) |

### Views (podem nao existir — verificar)

| View | Usada em |
|------|----------|
| `admin_users` | `/admin/page.tsx` |
| `admin_metrics` | `/admin/insights/page.tsx` |
| `public_profiles` | curtidas/page.tsx |
| `get_my_conversations` | RPC usada em conversas |

### RPCs principais

| RPC | O que faz |
|-----|-----------|
| `search_profiles` | Busca perfis com filtros (distancia, idade, genero) |
| `process_like` / `process_swipe` | Processa curtida/dislike, verifica match |
| `spin_roleta` | Gira roleta, debita ticket, credita premio |
| `spend_fichas` | Debita fichas de forma atomica |
| `credit_fichas` | Credita fichas |
| `claim_streak_reward` | Resgata premio do dia |
| `generate_streak_calendar` | Gera calendario de 30 dias para usuario |
| `extend_streak_calendar` | Estende calendario (dia 31+) |
| `award_xp` | Concede XP com bonus se ativo |
| `get_my_conversations` | Retorna conversas com ultima mensagem |

---

## Migrations Pendentes

Arquivos que precisam ser rodados no Supabase SQL Editor:

| Arquivo | O que cria | Status |
|---------|-----------|--------|
| `migration_camarote_e_indicar.sql` | Tabelas do Camarote + sistema de indicacao | Pendente |
| `migration_salas.sql` | Tabelas de salas + seed inicial | Pendente |
| `migration_roleta_fichas.sql` | Logica da roleta com fichas | Pendente |
| `migration_roleta_fix.sql` | Correcoes na RPC spin_roleta | Pendente |
| `migration_admin_recompensas.sql` | streak_calendar_template + RPCs de calendario | Pendente |
| `migration_abacatepay.sql` | Tabelas para pagamentos AbacatePay | Pendente |
| `migration_profile_optional_fields.sql` | Campos opcionais no perfil (Paridade Tinder) | Pendente |
| `migration_cadastro_progress.sql` | Coluna onboarding_completed | Ja rodada |
| `migration_cadastro_step.sql` | Coluna cadastro_step | Ja rodada (nao usada mais) |
| `migration_limpeza_campos_legados.sql` | Remove colunas obsoletas | Pendente |

---

## Conexoes entre Sistemas

```
PLANO
  |-- define --> LIMITES (curtidas, superlikes, lupas, tickets, video, filtros, backstage)
  |-- desbloqueia --> CAMAROTE (Black)
  |-- desbloqueia --> SALAS (Plus+)
  |-- desbloqueia --> FILTRO FETICHE (Black)

FICHAS
  |-- ganhas via --> COMPRA DIRETA (loja, dinheiro real)
  |-- ganhas via --> ROLETA (premio)
  |-- gastas em --> ITENS DA LOJA (superlikes, boosts, lupas, ghost, etc)
  |-- gastas em --> CAIXAS SURPRESA (sorteia item aleatorio)
  |-- gastas em --> PASSAPORTE CAMAROTE

TICKETS
  |-- ganhos via --> PLANO (1/2/3 por dia)
  |-- ganhos via --> STREAK (calendario de premios)
  |-- ganhos via --> ROLETA (premio possivel)
  |-- gastos em --> ROLETA (1 ticket por giro)

ROLETA
  |-- custa --> 1 ticket
  |-- premia com --> fichas / superlikes / boosts / lupas / rewinds / 1dia invisivel / 1dia Plus / 1dia Black

STREAK
  |-- recompensa diaria --> tickets / superlikes / lupas / boosts / rewinds / 1dia Plus (dia 30)
  |-- template editavel --> painel admin (/admin/recompensas)

EMBLEMAS
  |-- concedidos por --> CONDICOES (verificacao, perfil completo, matches, etc)
  |-- exibidos em --> PERFIL (showcase de ate 3)
  |-- gerenciados por --> PAINEL ADMIN (/admin/emblemas)

XP
  |-- concedido por --> ACOES (like, match, mensagem, login, foto, compra)
  |-- bonus 2x --> compra xp_bonus_3d na loja (50 fichas, 3 dias)

FILTROS
  |-- basicos --> todos os planos (distancia, idade, genero, estado)
  |-- avancados --> Plus/Black (todas as categorias)
  |-- fetiche/sugar --> Black apenas
  |-- usados em --> Match do Dia (compatibilidade mutua)
  |-- usados em --> Busca Avancada (filtro direto)

LOJA
  |-- itens que creditam --> user_superlikes / user_boosts / user_lupas / user_rewinds / user_tickets
  |-- itens que alteram --> profiles (ghost_mode_until, curtidas_reveals_until, xp_bonus_until, verified_plus)
  |-- caixas --> sorteiam outros itens da lista acima
  |-- passaporte --> da acesso ao Camarote (30 dias)

VERIFICACAO
  |-- aprovada --> profiles.verified = true
  |-- aprovada --> emblema on_verify concedido automaticamente
  |-- aprovada --> selo verificado exibido no perfil

MATCH
  |-- formado --> notificacao push + email
  |-- formado --> XP concedido a ambos
  |-- chat desbloqueado --> conversas/[id]
  |-- chat aceito --> videochamada disponivel
```

---

## Pendencias Criticas

### Financeiro (bloqueia receita)

1. **Checkout URLs:** todas as URLs de planos e fichas estao como `'#'` — configurar no AbacatePay
2. **Fichas pos-compra:** credito de fichas apos pagamento confirmado (webhook AbacatePay) — verificar implementacao
3. **Cancelamento real:** `/api/assinatura/cancelar` nao chama gateway para parar recorrencia

### Banco (migrations nao rodadas)

- Ver tabela "Migrations Pendentes" acima
- Prioridade: `migration_roleta_fichas.sql`, `migration_salas.sql`, `migration_admin_recompensas.sql`

### Bugs conhecidos

| ID | Problema | Arquivo |
|----|---------|---------|
| M8 | Foto aprovada quando Sightengine fora do ar | `api/moderar-foto/route.ts:86-101` |
| A15 | Views `admin_users` e `admin_metrics` podem nao existir | `admin/page.tsx` |
| A9 | XP nunca creditado via servidor de forma consistente | `api/xp/award/route.ts` |
| M7 | Verified Plus sem exibicao visual no app | varias paginas |
| M9 | Rate limit de chat global em vez de por match | `api/chat/send/route.ts` |

### Seguranca (pre-lancamento)

- Verificar se `.env.local` foi commitado no git e rotacionar chaves se necessario
- RLS ativo em todas as tabelas — conferir policies por operacao
- Service_role somente no backend (API routes) — nunca no cliente

---

*Para atualizar este documento: edite diretamente a secao correspondente sempre que criar ou alterar uma funcionalidade.*
