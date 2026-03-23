# Cerebro — meandyou-app
Gerado em: 2026-03-23
Sessao: #1

---

## Visao Geral

- **Framework:** Next.js 16.1.6 (App Router)
- **Linguagem:** TypeScript 5 (strict mode ativado)
- **Banco de dados:** Supabase (PostgreSQL) — projeto `akignnxgjyryqcgxesqn`
- **Autenticacao:** Supabase Auth + cookies SSR via `@supabase/ssr`
- **Deploy:** Vercel (auto-deploy ao push para `main`)
- **Dominio:** https://www.meandyou.com.br
- **CSS:** Inline styles + CSS variables como padrao. Tailwind v4 instalado mas usado apenas para utilitarios de fonte (`font-fraunces`, `font-jakarta`)
- **Pagamento:** AbacatePay (PIX + cartao de credito)
- **Video:** LiveKit (`wss://me-and-you-195o0nxw.livekit.cloud`)
- **Email:** Resend
- **Moderacao de fotos:** Sightengine
- **Push notifications:** Web Push (VAPID)
- **CAPTCHA:** Cloudflare Turnstile (no cadastro)
- **PWA:** Service Worker registrado em `public/sw.js`

---

## Estrutura de Diretorios

```
meandyou-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout (fontes, metadata, PWA, AppShell)
│   │   ├── page.tsx                    ← Landing Page publica
│   │   ├── globals.css                 ← CSS vars, tokens de design, keyframes
│   │   ├── favicon.ico
│   │   ├── icon.tsx
│   │   ├── apple-icon.tsx
│   │   ├── lib/
│   │   │   ├── email.ts                ← 40 funcoes de email via Resend
│   │   │   ├── supabase.ts             ← createBrowserClient (client-side)
│   │   │   ├── moderation.ts           ← Filtro de palavras proibidas/criticas
│   │   │   └── xp.ts                  ← fire-and-forget helper para awardXp
│   │   ├── api/                        ← Route handlers Next.js
│   │   │   ├── admin/                  ← APIs admin (badges, injetar-saldo, marketing, recompensas, usuarios/export)
│   │   │   ├── amigos/                 ← GET/POST/PATCH sistema de amigos
│   │   │   ├── assinatura/             ← POST cancelar assinatura
│   │   │   ├── auth/                   ← login, cadastro, logout, 2fa, sessoes, recuperar-senha, etc.
│   │   │   ├── badges/                 ← auto-award, award, upload de icone
│   │   │   ├── boosts/                 ← activate, notify-expired
│   │   │   ├── bugs/                   ← reportar bug
│   │   │   ├── casal/                  ← GET/POST/PATCH perfil de casal (Black)
│   │   │   ├── chat/send/              ← Envio de mensagens com moderacao
│   │   │   ├── confirmar-verificacao/  ← Confirmar verificacao facial
│   │   │   ├── contato/               ← Formulario de contato
│   │   │   ├── cron/expire-matches/    ← Cron para expirar matches (protegido por CRON_SECRET)
│   │   │   ├── denuncias/              ← POST nova denuncia
│   │   │   ├── destaque/revelar/       ← Revelar perfil destacado
│   │   │   ├── enviar-verificacao/     ← Enviar foto para verificacao facial
│   │   │   ├── likes/superlike-notify/ ← Notificar superlike
│   │   │   ├── livekit/token/          ← Gerar token LiveKit (valida match + limite de minutos)
│   │   │   ├── loja/gastar/            ← Debitar fichas e creditar item
│   │   │   ├── matches/notify/         ← Notificar novo match
│   │   │   ├── meeting/invite/         ← Convite de encontro
│   │   │   ├── moderar-foto/           ← Upload + moderacao via Sightengine
│   │   │   ├── notificacoes/           ← GET lista de notificacoes
│   │   │   ├── payments/create/        ← Criar pagamento AbacatePay
│   │   │   ├── payments/status/[id]/   ← Polling status do pagamento
│   │   │   ├── push/send|subscribe/    ← Web Push send e subscribe/unsubscribe
│   │   │   ├── roleta/girar/           ← Girar roleta (debita ticket, sorteia premio via RPC)
│   │   │   ├── safety/checkin|save/    ← Seguranca encontros
│   │   │   ├── salas/alertar|criar|entrar/ ← Salas tematicas
│   │   │   ├── streak/resgatar|sincronizar/ ← Recompensas de streak
│   │   │   ├── suporte/                ← Ticket de suporte
│   │   │   ├── upload-verificacao/     ← Upload de doc para verificacao
│   │   │   ├── validar-token/          ← Valida token de email
│   │   │   ├── webhooks/
│   │   │   │   ├── abacatepay/         ← Webhook de pagamentos (billing.paid / pixQrCode.paid)
│   │   │   │   ├── cakto/              ← STUB (gateway removido, retorna 501)
│   │   │   │   └── livekit/            ← Webhook de eventos LiveKit (fim de sala)
│   │   │   └── xp/award/              ← Conceder XP via RPC award_xp
│   │   ├── admin/                      ← Painel admin (layout proprio)
│   │   │   ├── layout.tsx              ← Server Component: verifica role/staff, renderiza AdminLayoutClient
│   │   │   ├── AdminLayoutClient.tsx   ← Client Component: sidebar admin com permissoes por role
│   │   │   ├── page.tsx                ← Dashboard admin
│   │   │   ├── bugs/page.tsx
│   │   │   ├── cancelamentos/page.tsx
│   │   │   ├── denuncias/page.tsx
│   │   │   ├── emblemas/page.tsx
│   │   │   ├── equipe/page.tsx
│   │   │   ├── financeiro/page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   ├── marketing/page.tsx
│   │   │   ├── recompensas/page.tsx
│   │   │   └── seguranca/page.tsx
│   │   │   └── usuarios/page.tsx
│   │   └── [demais paginas protegidas e publicas — ver secao Rotas]
│   ├── components/
│   │   ├── AppBottomNav.tsx            ← Nav inferior mobile (5 itens: Matches/Modos/Roleta/Premios/Perfil)
│   │   ├── AppHeader.tsx               ← Header mobile (logo/back + modeSelector + Bell/Settings)
│   │   ├── AppShell.tsx                ← Wrapper condicional: detecta rota, renderiza shell ou nao
│   │   ├── AppSidebar.tsx              ← Sidebar desktop (md+): logo + nav + logout
│   │   ├── CheckoutModal.tsx           ← Modal de checkout AbacatePay (PIX + cartao, steps, polling)
│   │   ├── EmptyState.tsx              ← Componente de estado vazio (duplicado de ui/EmptyState.tsx)
│   │   ├── MatchModal.tsx              ← Overlay de match com animacoes
│   │   ├── OnlineIndicator.tsx         ← Bolinha de status online/offline
│   │   ├── PaywallCard.tsx             ← Card de bloqueio com countdown e link para /planos
│   │   ├── ReportModal.tsx             ← Modal de denuncia de usuario
│   │   ├── Skeleton.tsx                ← Skeletons shimmer (SkeletonList, SkeletonCard, etc.)
│   │   ├── StoreBottomSheet.tsx        ← Bottom sheet de microtransacoes (5 tipos de item)
│   │   ├── Toast.tsx                   ← ToastProvider + useToast (success/error/info, auto-dismiss 3.2s)
│   │   ├── VideoCall.tsx               ← Componente de videochamada via LiveKit
│   │   └── ui/
│   │       ├── Accordion.tsx
│   │       ├── BadgePill.tsx           ← Tag de raridade de emblema
│   │       ├── BottomSheet.tsx         ← Painel com portal, blur, handle
│   │       ├── ChatBubble.tsx          ← Balao de chat (enviado/recebido + status)
│   │       ├── EmptyState.tsx
│   │       ├── FAB.tsx
│   │       ├── MatchCard.tsx           ← Avatar de match com badge de nao lidas
│   │       ├── Modal.tsx               ← Pop-up centralizado com portal
│   │       ├── Pill.tsx                ← Chip/tag clicavel
│   │       ├── ProfileCard.tsx         ← Card de swipe 3:4
│   │       ├── SkeletonLoader.tsx
│   │       ├── SliderRange.tsx         ← Slider duplo (idade/distancia)
│   │       ├── SwipeButton.tsx         ← Botao circular da action bar
│   │       └── ToggleSwitch.tsx
│   ├── contexts/
│   │   └── AppHeaderContext.tsx        ← Contexto para injetar modeSelector/backHref/pageTitle no header
│   ├── hooks/
│   │   ├── useAuth.ts                  ← Sessao do usuario, atualiza last_seen e streak no mount
│   │   ├── useChat.ts                  ← Mensagens realtime, rate limit 5/min, MAX_CHARS=500
│   │   ├── useHaptics.ts               ← navigator.vibrate wrapper (tap/medium/success/error/match)
│   │   ├── usePlan.ts                  ← Plano atual + todos os saldos (7 queries paralelas)
│   │   ├── useSearch.ts                ← Busca de perfis via RPC search_profiles
│   │   └── useSwipe.ts                 ← Acoes like/dislike/superlike via RPC process_like
│   ├── lib/
│   │   └── supabase/
│   │       └── server.ts               ← createClient (SSR com cookies) + createAdminClient (service_role)
│   └── proxy.ts                        ← Middleware de protecao de rotas (exporta proxy + config.matcher)
├── public/
│   ├── logo.png
│   ├── sw.js                           ← Service Worker (PWA)
│   ├── manifest.json                   ← Manifest PWA
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── backgrounds/                    ← Imagens de background da landing page
│   └── badges/                        ← SVGs dos emblemas (bio_detalhada, conversador, etc.)
├── scripts/
│   └── create-dev-admin.js             ← Script de criacao do usuario dev/admin
├── migration_abacatepay.sql            ← Tabela payments + modificacoes em subscriptions
├── migration_admin_recompensas.sql     ← Tabela streak_calendar_template + RPCs generate/extend
├── migration_cadastro_progress.sql     ← Campos reg_* em profiles + email_verify em users
├── migration_cadastro_step.sql         ← (legado)
├── migration_camarote_e_indicar.sql    ← Tabelas access_requests, camarote_ratings, camarote_messages, referrals
├── migration_limpeza_campos_legados.sql
├── migration_roleta_fix.sql            ← Tabelas roleta_prizes, roleta_history + RPC spin_roleta
├── next.config.ts                      ← Permite imagens de akignnxgjyryqcgxesqn.supabase.co
├── package.json
├── tsconfig.json                       ← strict: true, paths: @/* -> ./src/*
└── .env.local                          ← Variaveis de ambiente (ver secao abaixo)
```

---

## Arquivos — Detalhes

### src/app/layout.tsx
- **Funcao:** Root layout do Next.js. Carrega fontes Fraunces e Plus Jakarta Sans, define metadata SEO/OG/Twitter, configura PWA (manifest, apple-touch-icon, theme-color, service worker), envolve tudo com `<AppShell>`.
- **Importa:** `next/font/google`, `./globals.css`, `@/components/AppShell`
- **Exporta:** `RootLayout` (default), `metadata`
- **Conexoes:** AppShell envolve todos os children

### src/app/globals.css
- **Funcao:** CSS global. Define tokens de design v2 Dark Romantic via `:root` CSS variables, classes `.btn-primary`/`.btn-secondary`, tokens Tailwind v4 via `@theme`, keyframes (shimmer, slideUp, ui-spin, ui-pulse, ui-slide-up, ui-fade-in, ui-toast-in, nudge-shake), estilos do app-shell (`.app-shell-outer`, `.app-frame`, `.app-main-content`, `.app-sidebar`).
- **Tokens principais:**
  - `--bg: #08090E` / `--bg-card: #0F1117` / `--bg-card2: #13161F`
  - `--accent: #E11D48` / `--accent-dark: #be123c` / `--accent-light: rgba(225,29,72,0.10)`
  - `--text: #F8F9FA` / `--muted: rgba(248,249,250,0.50)` / `--muted-2: rgba(248,249,250,0.30)`
  - `--gold: #F59E0B` / `--green: #10b981`
  - `--border: rgba(255,255,255,0.07)` / `--border-soft: rgba(255,255,255,0.04)`

### src/app/lib/supabase.ts
- **Funcao:** Cria e exporta cliente Supabase para uso no browser (client components e pages).
- **Importa:** `@supabase/ssr` (`createBrowserClient`)
- **Exporta:** `supabase` (singleton do browser)
- **Usa:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### src/lib/supabase/server.ts
- **Funcao:** Dois clientes Supabase para uso no servidor.
  - `createClient()` — SSR client com cookies (leitura de sessao do usuario)
  - `createAdminClient()` — service_role client (bypassa RLS)
- **Importa:** `@supabase/supabase-js`, `@supabase/ssr`, `next/headers`
- **Exporta:** `createClient`, `createAdminClient`
- **Usa:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### src/proxy.ts
- **Funcao:** Middleware de protecao de rotas (nao e `middleware.ts` — e importado por outro arquivo ou e o proprio middleware — verificar). Protege rotas privadas, redireciona logados de rotas publicas, verifica banimento, checa progresso do cadastro (reg_credentials_set → reg_email_verified → reg_facial_verified → onboarding_completed), protege /admin por role/staff.
- **Importa:** `next/server`, `@supabase/ssr`
- **Exporta:** `proxy`, `config` (com matcher)
- **ROTAS PROTEGIDAS:** `/busca`, `/match`, `/matches`, `/chat`, `/perfil`, `/planos`, `/dashboard`, `/conversas`, `/loja`, `/destaque`, `/indicar`, `/backstage`, `/roleta`, `/streak`, `/onboarding`, `/notificacoes`, `/suporte`, `/ajuda`, `/deletar-conta`, `/minha-assinatura`, `/videochamada`, `/curtidas`, `/configuracoes`, `/salas`, `/amigos`, `/casal`, `/aguardando-email`
- **ROTAS PUBLICAS SOMENTE:** `/login`, `/cadastro`, `/recuperar-senha`, `/nova-senha`
- **STAFF PERMISSIONS:**
  - `gerente`: /admin, /financeiro, /usuarios, /denuncias, /cancelamentos
  - `suporte_financeiro`: /admin, /financeiro, /cancelamentos
  - `suporte_tecnico`: /admin, /usuarios, /seguranca
  - `suporte_chat`: /admin, /denuncias, /cancelamentos

### src/hooks/useAuth.ts
- **Funcao:** Hook para autenticacao. Obtem sessao atual, atualiza `profiles.last_seen`, chama RPC `update_daily_streak`, concede XP `login_streak`. Ouve mudancas de sessao via `onAuthStateChange`.
- **Importa:** `react`, `@/app/lib/supabase`, `@/app/lib/xp`
- **Exporta:** `useAuth` → `{ user, loading, supabase }`

### src/hooks/useChat.ts
- **Funcao:** Hook de chat em tempo real. Carrega historico de mensagens, assina canal Supabase Realtime `chat:{matchId}`, envia mensagens via `/api/chat/send`, marca como lidas, rate limit client-side (5 msgs/min sem resposta). Campo de leitura: `read` (boolean, nao `read_at`).
- **Importa:** `react`, `@/app/lib/supabase`, `@/hooks/useAuth`, `@/app/lib/xp`
- **Exporta:** `useChat` → `{ messages, loading, sending, error, sendMessage, currentUserId }`, interface `Message`

### src/hooks/usePlan.ts
- **Funcao:** Carrega plano do usuario e todos os saldos (7 queries paralelas: profiles, likes de hoje, user_superlikes, user_boosts, user_lupas, user_rewinds, user_tickets). Combina config estatica por plano com saldos dinamicos do banco.
- **Importa:** `react`, `@/app/lib/supabase`, `@/hooks/useAuth`
- **Exporta:** `usePlan` → `{ limits, loading, canLike, getUpgradeMessage, reload }`, tipos `PlanType`, `PlanLimits`
- **PLAN_CONFIG:** essencial (5 likes/dia), plus (30 likes/dia), black (infinito)

### src/hooks/useSwipe.ts
- **Funcao:** Gerencia acoes de swipe. Rate limit anti-fake: 10 curtidas/min. Dislike grava em `dislikes` (fire-and-forget). Like/superlike chama RPC `process_like`. Detecta match e atualiza `matchResult`.
- **Importa:** `react`, `@/app/lib/supabase`, `@/hooks/useAuth`, `@/app/lib/xp`, `@/hooks/useSearch`
- **Exporta:** `useSwipe` → `{ currentProfile, currentIndex, hasMore, processing, matchResult, swipe, dismissMatch }`, tipo `SwipeAction`

### src/hooks/useSearch.ts
- **Funcao:** Busca de perfis via RPC `search_profiles`. Carrega filtros salvos da tabela `filters`. Atualiza localizacao via GPS. Filtra perfis em ghost_mode. Salva filtros na tabela `filters`.
- **Importa:** `react`, `@/app/lib/supabase`, `@/hooks/useAuth`
- **Exporta:** `useSearch` → `{ filters, setFilters, results, loading, error, locationGranted, savedFilters, search, saveFilters, resetFilters, updateLocation }`, interfaces `SearchFilters`, `ProfileResult`

### src/hooks/useHaptics.ts
- **Funcao:** Wrapper de `navigator.vibrate`. Presets: tap(10ms), medium(25ms), success([15,40,15]), error([30,20,30]), match([20,60,80]).
- **Exporta:** `useHaptics` → `{ tap, medium, success, error, match }`

### src/app/lib/xp.ts
- **Funcao:** Fire-and-forget helper para conceder XP. Obtem sessao e chama `/api/xp/award`. Falhas sao silenciosas.
- **Importa:** `@/app/lib/supabase`
- **Exporta:** `awardXp(userId, eventType)`

### src/app/lib/moderation.ts
- **Funcao:** Filtro de conteudo (palavras proibidas e criticas). Normaliza texto (sem acentos, minusculo). Palavras criticas disparam alerta automatico ao suporte.
- **Exporta:** `moderateContent`, `getModerationMessage`, `moderateRoomName`, `containsSensitiveData`, tipo `ModerationResult`

### src/app/lib/email.ts
- **Funcao:** 40 funcoes de email via Resend. Falhas sao silenciosas (try/catch sem propagacao). Email domain hardcoded como `https://www.meandyou.com.br`.
- **Exporta:** 40 funcoes async (sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendNewMatchEmail, etc.)
- **Usa:** `RESEND_API_KEY`

### src/components/AppShell.tsx
- **Funcao:** Wrapper condicional. Se a rota esta em `SHELL_PREFIXES`, renderiza shell completo (AppSidebar + AppHeader + main + AppBottomNav) envolto em `ToastProvider` e `AppHeaderProvider`. Caso contrario, renderiza so `ToastProvider` com children.
- **SHELL_PREFIXES:** /dashboard, /busca, /match, /matches, /chat, /conversas, /perfil, /configuracoes, /planos, /minha-assinatura, /loja, /destaque, /roleta, /streak, /recompensas, /indicar, /notificacoes, /backstage, /emblemas
- **Importa:** `next/navigation`, `next/link`, `./AppHeader`, `./AppBottomNav`, `./AppSidebar`, `@/contexts/AppHeaderContext`, `./Toast`
- **Exporta:** `AppShell`

### src/components/AppHeader.tsx
- **Funcao:** Header mobile (56px, sticky top 0). Esquerda: back button ou logo MeAnd<You>. Centro: modeSelector (injetado pelo contexto) ou pageTitle. Direita: link /notificacoes (Bell) + link /configuracoes (Settings).
- **Importa:** `next/link`, `next/navigation`, `react`, `lucide-react`
- **Exporta:** `AppHeader`

### src/components/AppBottomNav.tsx
- **Funcao:** Navegacao inferior mobile (60px). 5 itens: Matches(/conversas), Modos(/busca), Roleta(/roleta — FAB central vermelho), Premios(/recompensas), Perfil(/perfil). Usa haptics.tap() no click.
- **Importa:** `next/link`, `next/navigation`, `lucide-react`, `@/hooks/useHaptics`
- **Exporta:** `AppBottomNav`

### src/components/AppSidebar.tsx
- **Funcao:** Sidebar desktop (visivel em md+). Logo MeAndYou, navegacao principal (5 itens), itens inferiores (Notificacoes, Configuracoes). Logout via `supabase.auth.signOut()` + limpeza de cookies + redirect para /login.
- **Importa:** `next/link`, `next/navigation`, `react`, `lucide-react`, `@/app/lib/supabase`
- **Exporta:** `AppSidebar`

### src/components/CheckoutModal.tsx
- **Funcao:** Modal de checkout AbacatePay com 4 steps (Ciclo → Metodo → Pagamento → Confirmacao). Suporta PIX (QR code + polling de status a cada 3s) e cartao (iframe AbacatePay). Timer regressivo de 15min para PIX.
- **Importa:** `react`, `@/app/lib/supabase`, `lucide-react`
- **Exporta:** `CheckoutModal` (default), tipos `CheckoutType`, `PaymentCycle`
- **Conexoes:** chama `/api/payments/create` e `/api/payments/status/[id]`

### src/components/Toast.tsx
- **Funcao:** Sistema de toasts global. `ToastProvider` gerencia estado e renderiza toasts. `useToast` expose `{ show, success, error, info }`. Max 3 toasts simultaneos, auto-dismiss em 3.2s. Posicao: bottom: 80px.
- **Importa:** `react`
- **Exporta:** `ToastProvider`, `useToast`

### src/components/MatchModal.tsx
- **Funcao:** Overlay full-screen de match com animacoes de entrada das fotos, particulas, CTA. Props: `matchId`, `myPhoto`, `otherPhoto`, `otherName`, `onClose`, `onStartChat`. Dispara haptics no mount.

### src/components/PaywallCard.tsx
- **Funcao:** Card de bloqueio com countdown ate `resetAt` e botao para /planos.

### src/components/StoreBottomSheet.tsx
- **Funcao:** Bottom sheet de microtransacoes. 5 tipos: superlike | boost | lupa | rewind | ghost. 3 pacotes por tipo. Animacao slideUp.

### src/components/OnlineIndicator.tsx
- **Funcao:** Indicador de status online. Regras: < 1h = verde "Ativo agora", < 24h = ambar "Ativo hoje", < 48h = "Ativo ontem", < 7d = "Ativo esta semana", > 7d ou show_last_active=false = nada.

### src/components/ReportModal.tsx
- **Funcao:** Modal de denuncia de usuario. Chama `/api/denuncias`.

### src/components/VideoCall.tsx
- **Funcao:** Componente de videochamada via `@livekit/components-react`.

### src/components/Skeleton.tsx
- **Funcao:** Skeletons shimmer (SkeletonList, SkeletonCard, SkeletonGrid, etc.)

### src/contexts/AppHeaderContext.tsx
- **Funcao:** Contexto para injetar conteudo no header. Expoe `modeSelector`, `backHref`, `pageTitle` e seus setters.
- **Exporta:** `AppHeaderProvider`, `useAppHeader`

### src/app/admin/layout.tsx
- **Funcao:** Server Component. Verifica sessao e role. Admin → renderiza AdminLayoutClient role="admin". Staff ativo → renderiza AdminLayoutClient com role do staff. Outros → redirect /dashboard.
- **Importa:** `next/navigation`, `@/lib/supabase/server`, `./AdminLayoutClient`

### src/app/admin/AdminLayoutClient.tsx
- **Funcao:** Layout do painel admin. Sidebar 220px com navegacao filtrada por permissoes. Roles: admin (acesso total), gerente, suporte_financeiro, suporte_tecnico, suporte_chat.
- **Exporta:** `AdminLayoutClient`

---

## APIs — Detalhes

### POST /api/auth/login
- **Funcao:** Login com email/senha. Rate limit via RPC `check_login_attempts`. Verifica banimento ANTES de criar sessao. Suporte a 2FA (retorna `requires_2fa + temp_token`). Detecta novo dispositivo (hash UA). Registra sessao em `user_sessions`. Seta cookies via SSR client.
- **Tabelas lidas:** `users`, `profiles`, `auth_2fa_pending`, `user_sessions`
- **RPCs:** `check_login_attempts`, `register_login_attempt`, `update_streak_on_login`

### POST /api/auth/cadastro
- **Funcao:** Cadastro completo. Valida CPF (algoritmo), verifica duplicidade por CPF, cria usuario no Supabase Auth, aguarda trigger `handle_new_user`, atualiza `users` com CPF/telefone, inicializa saldos (7 tabelas), processa referral se houver, gera token de verificacao de email (30min), atualiza campos `reg_*` em profiles, envia email de verificacao.
- **Tabelas escritas:** `users`, `profiles`, `user_tickets`, `user_lupas`, `user_superlikes`, `user_boosts`, `user_rewinds`, `daily_streaks`, `referrals`

### POST /api/auth/logout
- **Funcao:** Logout via `supabase.auth.signOut()` com SSR client. Limpa cookies.

### POST /api/chat/send
- **Funcao:** Envia mensagem. Autentica via Bearer. Modera conteudo (`moderateContent` + `containsSensitiveData`). Verifica participacao no match. Rate limit server-side: 20 msgs/min por match. Insere em `messages`.
- **Tabelas:** `matches`, `messages`

### POST /api/roleta/girar
- **Funcao:** Gira a roleta. Valida sessao via `createServerClient`. Chama RPC `spin_roleta` via `createAdminClient` (service_role). Retorna `{ reward_type, reward_amount, was_jackpot }`.
- **RPCs:** `spin_roleta`

### POST /api/payments/create
- **Funcao:** Cria pagamento AbacatePay. Suporta 3 tipos: subscription, fichas, camarote. Dois metodos: PIX (pixQrCode/create) e cartao (billing/create). Salva pagamento pendente em `payments`. Retorna dados do PIX (brCode, brCodeBase64) ou URL do billing.

### GET /api/payments/status/[id]
- **Funcao:** Polling de status do pagamento. Retorna `{ status }` da tabela `payments`.

### POST /api/webhooks/abacatepay
- **Funcao:** Webhook de confirmacao de pagamento. Valida secret via timing-safe comparison. Idempotente (claim atomico via update com where status='pending'). Processa: subscription → RPC `activate_subscription` + upsert em `subscriptions` + RPC `reward_referral`; fichas → RPC `add_fichas`; camarote → update `profiles.camarote_expires_at`.

### POST /api/moderar-foto
- **Funcao:** Upload de foto com moderacao via Sightengine. Rate limit: 10 uploads/hora (via `analytics_events`). Moderacao: nudez (raw>0.5, partial>0.6, suggestive>0.7), offensive>0.7, gore>0.7. Se aprovada, faz upload no storage Supabase `fotos/{userId}/foto_{index}.{ext}`. Concede XP `photo_added`.

### POST /api/livekit/token
- **Funcao:** Gera token LiveKit. Verifica participacao no match e status ativo. Verifica limite diario de minutos por plano (essencial=60, plus=300, black=600). Gera JWT LiveKit TTL 2h para sala `match-{matchId}`.

### POST /api/xp/award
- **Funcao:** Concede XP. Verifica bonus ativo (`profiles.xp_bonus_until`). Chama RPC `award_xp`. Retorna XP total e nivel atual.
- **XP_TABLE:** like=5, dislike=1, superlike=15, match=25, message_sent=3, profile_complete=150, photo_added=10, purchase=50, spin_roleta=5, login_streak=10, invite_friend=100

### POST /api/admin/badges
- **Funcao:** CRUD de emblemas via service_role (bypassa RLS). Verifica role admin ou staff.
- **Metodos:** POST (criar), PATCH (editar), DELETE (excluir + cascata em user_badges)

### POST /api/admin/injetar-saldo
- **Funcao:** Injeta saldo de qualquer tipo (fichas, tickets, superlikes, boosts, lupas, rewinds) para qualquer usuario. Apenas admin.

### POST /api/loja/gastar
- **Funcao:** Debita fichas e credita item. Itens: superlike(30 fichas), boost(40), lupa(25), rewind(20), ghost_7d(60), ghost_35d(220), reveals_5(50), xp_bonus_3d(50), verified_plus(200), caixa_surpresa(35), caixa_lendaria(2250). Usa RPC `spend_fichas` para deducao atomica.

### GET/POST/PATCH /api/amigos
- **Funcao:** Sistema de amizade. POST envia pedido, PATCH aceita/recusa/remove, GET lista amigos e pendentes (enriquecidos com dados de `public_profiles`).
- **Tabelas:** `friendships`, `public_profiles`

### GET/POST/PATCH /api/casal
- **Funcao:** Perfil de casal para assinantes Black. POST cria convite (gera invite_token). PATCH aceita (ativa casal, atualiza couple_id em ambos os profiles) ou dissolve.
- **Tabelas:** `couple_profiles`, `profiles`, `public_profiles`

### POST /api/webhooks/cakto
- **Funcao:** STUB. Gateway Cakto removido. Retorna 501.

### POST /api/cron/expire-matches
- **Funcao:** Cron protegido por `CRON_SECRET`. Chama RPCs `notify_expiring_matches` e `expire_matches`.

### POST /api/badges/auto-award
- **Funcao:** Concede emblema em lote para todos os usuarios que atendem a condicao. 20+ tipos de condicao suportados (on_join, early_adopter, on_verify, profile_complete, matches_gte, streak_gte, etc.). Aplica filtro de coorte (new/old/all).

---

## Rotas e Paginas

### Paginas Publicas
| Rota | Arquivo | Notas |
|------|---------|-------|
| `/` | `src/app/page.tsx` | Landing Page (arquivo muito grande) |
| `/login` | `src/app/login/page.tsx` | Suporte a 2FA (step 2 com codigo TOTP) |
| `/cadastro` | `src/app/cadastro/page.tsx` | 7 telas multi-step, Turnstile |
| `/recuperar-senha` | `src/app/recuperar-senha/page.tsx` | |
| `/nova-senha` | `src/app/nova-senha/page.tsx` | |
| `/privacidade` | `src/app/privacidade/page.tsx` | |
| `/termos` | `src/app/termos/page.tsx` | |
| `/ajuda` | `src/app/ajuda/page.tsx` | |
| `/fale-conosco` | `src/app/fale-conosco/page.tsx` | |
| `/suporte` | `src/app/suporte/page.tsx` | |
| `/obrigado` | `src/app/obrigado/page.tsx` | |
| `/banido` | `src/app/banido/page.tsx` | |
| `/confirmar-email` | `src/app/confirmar-email/page.tsx` | Alteracao de email |
| `/aguardando-email` | `src/app/aguardando-email/page.tsx` | Aguardando verificacao de email |
| `/verificar-email` | `src/app/verificar-email/page.tsx` | Validacao do token de email |

### Paginas Protegidas (usuario logado + onboarding concluido)
| Rota | Arquivo | Notas |
|------|---------|-------|
| `/onboarding` | `src/app/onboarding/page.tsx` | GPS/notif soft ask |
| `/verificacao` | `src/app/verificacao/page.tsx` | Verificacao facial com mascara oval SVG |
| `/dashboard` | `src/app/dashboard/page.tsx` | |
| `/busca` | `src/app/busca/page.tsx` | Swipe (discovery/search/rooms), filtros |
| `/match` | `src/app/match/page.tsx` | |
| `/matches` | `src/app/matches/page.tsx` | Carrossel + lista de conversas |
| `/chat/[matchId]` | `src/app/chat/[matchId]/page.tsx` | |
| `/conversas` | `src/app/conversas/page.tsx` | |
| `/conversas/[id]` | `src/app/conversas/[id]/page.tsx` | Chat completo: nudge, convite encontro, quebra-gelo, avaliacao, check-in seguranca |
| `/perfil` | `src/app/perfil/page.tsx` | Perfil proprio |
| `/perfil/[id]` | `src/app/perfil/[id]/page.tsx` | Perfil de outro usuario: Trust Score, emblemas, FABs |
| `/configuracoes` | `src/app/configuracoes/page.tsx` | 7 secoes com toggles de privacidade/notificacoes |
| `/configuracoes/editar-perfil` | `src/app/configuracoes/editar-perfil/page.tsx` | |
| `/configuracoes/2fa` | `src/app/configuracoes/2fa/page.tsx` | |
| `/configuracoes/sessoes` | `src/app/configuracoes/sessoes/page.tsx` | |
| `/configuracoes/alterar-email` | `src/app/configuracoes/alterar-email/page.tsx` | |
| `/configuracoes/casal` | `src/app/configuracoes/casal/page.tsx` | |
| `/planos` | `src/app/planos/page.tsx` | Cards horizontais com scroll snap |
| `/minha-assinatura` | `src/app/minha-assinatura/page.tsx` | |
| `/loja` | `src/app/loja/page.tsx` | Vitrine de itens, compra com fichas |
| `/curtidas` | `src/app/curtidas/page.tsx` | Quem curtiu voce (blur para Essencial) |
| `/destaque` | `src/app/destaque/page.tsx` | |
| `/roleta` | `src/app/roleta/page.tsx` | |
| `/recompensas` | `src/app/recompensas/page.tsx` | |
| `/streak` | `src/app/streak/page.tsx` | |
| `/emblemas` | `src/app/emblemas/page.tsx` | |
| `/indicar` | `src/app/indicar/page.tsx` | |
| `/notificacoes` | `src/app/notificacoes/page.tsx` | |
| `/amigos` | `src/app/amigos/page.tsx` | |
| `/casal/aceitar` | `src/app/casal/aceitar/page.tsx` | |
| `/backstage` | `src/app/backstage/page.tsx` | Exclusivo plano Black |
| `/backstage/chat/[id]` | `src/app/backstage/chat/[id]/page.tsx` | |
| `/salas` | `src/app/salas/page.tsx` | |
| `/salas/[id]` | `src/app/salas/[id]/page.tsx` | |
| `/salas/criar` | `src/app/salas/criar/page.tsx` | |
| `/videochamada/[matchId]` | `src/app/videochamada/[matchId]/page.tsx` | |
| `/deletar-conta` | `src/app/deletar-conta/page.tsx` | 4 etapas com fricao |

### Paginas Admin
| Rota | Arquivo |
|------|---------|
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/usuarios` | `src/app/admin/usuarios/page.tsx` |
| `/admin/financeiro` | `src/app/admin/financeiro/page.tsx` |
| `/admin/denuncias` | `src/app/admin/denuncias/page.tsx` |
| `/admin/seguranca` | `src/app/admin/seguranca/page.tsx` |
| `/admin/marketing` | `src/app/admin/marketing/page.tsx` |
| `/admin/cancelamentos` | `src/app/admin/cancelamentos/page.tsx` |
| `/admin/insights` | `src/app/admin/insights/page.tsx` |
| `/admin/equipe` | `src/app/admin/equipe/page.tsx` |
| `/admin/emblemas` | `src/app/admin/emblemas/page.tsx` |
| `/admin/recompensas` | `src/app/admin/recompensas/page.tsx` |
| `/admin/bugs` | `src/app/admin/bugs/page.tsx` |

---

## Banco de Dados

### Tabelas principais (identificadas no codigo)

| Tabela | Descricao | Colunas relevantes identificadas |
|--------|-----------|----------------------------------|
| `auth.users` | Usuarios do Supabase Auth | id, email |
| `users` (public) | Dados privados do usuario | id, email, cpf, phone, nome_completo, banned, verified, totp_enabled, totp_secret, totp_backup_codes, known_ua_hashes, email_verified, email_verify_token, email_verify_token_expires_at |
| `profiles` | Dados publicos/preferencias | id, name, display_name, bio, photo_best, photo_face, photo_body, photo_side, photo_extra1-3, lat, lng, city, state, birthdate, gender, pronouns, plan, role, last_seen, highlight_tags, filters, verified, verified_plus, referred_by, referral_code, couple_id, onboarding_completed, reg_credentials_set, reg_email_verified, reg_document_verified, reg_facial_verified, reg_name_confirmed, reg_username_confirmed, reg_invite_provided, reg_invite_code, incognito_until, ghost_mode_until, curtidas_reveals_until, xp_bonus_until, camarote_expires_at, camarote_interests, xp, xp_level, show_last_active, notifications_email |
| `public_profiles` | View publica de perfis | id, name, photo_best, city, plan, last_seen, distance_km |
| `messages` | Mensagens do chat | id, match_id, sender_id, content, created_at, read (boolean) |
| `matches` | Matches entre usuarios | id, user1, user2, status (active/blocked/expired) |
| `likes` | Curtidas | id, user_id, to_user, is_superlike, created_at |
| `dislikes` | Dislikes | from_user, to_user |
| `filters` | Filtros de busca salvos | user_id, search_max_distance_km, search_min_age, search_max_age, search_gender, search_saved |
| `user_superlikes` | Saldo de superlikes | user_id, amount |
| `user_boosts` | Saldo de boosts | user_id, amount, active_until |
| `user_lupas` | Saldo de lupas | user_id, amount |
| `user_rewinds` | Saldo de rewinds | user_id, amount |
| `user_tickets` | Saldo de tickets da roleta | user_id, amount |
| `user_fichas` | Saldo de fichas (moeda virtual) | user_id, amount |
| `badges` | Definicao de emblemas | id (text), name, description, icon_url, condition_type, condition_value, condition_extra (jsonb), user_cohort, active |
| `user_badges` | Emblemas conquistados | user_id, badge_id — UNIQUE(user_id, badge_id) |
| `payments` | Pagamentos | id, user_id, type, gateway_id, method, amount, status, metadata (jsonb), created_at, paid_at |
| `subscriptions` | Assinaturas | user_id, plan, status, cycle, gateway_order_id, starts_at, ends_at |
| `roleta_prizes` | Premios da roleta | id, reward_type, reward_amount, weight, active |
| `roleta_history` | Historico de giros | user_id, reward_type, reward_amount, was_jackpot |
| `daily_streaks` | Streak diario | user_id, current_streak, longest_streak, last_login_date |
| `streak_calendar` | Calendario de recompensas | user_id, day_number, reward_type, reward_amount, claimed |
| `streak_calendar_template` | Template 30 dias do calendario | day_number, reward_type, reward_amount |
| `referrals` | Indicacoes | referrer_id, referred_id, status (pending/rewarded) |
| `friendships` | Amizades | id, requester_id, receiver_id, status (pending/accepted/declined) |
| `couple_profiles` | Perfis de casal (Black) | id, user1_id, user2_id, status, invite_token, activated_at |
| `access_requests` | Pedidos de resgate no Camarote | id, requester_id, rescued_by, category, status, expires_at |
| `camarote_ratings` | Avaliacoes pos-encontro (Camarote) | request_id, rater_id, rated_id, rating |
| `camarote_messages` | Chat do Camarote | id, request_id, sender_id, content, read |
| `push_subscriptions` | Subscricoes Web Push | user_id, endpoint, p256dh, auth |
| `analytics_events` | Eventos de analytics (rate limit de upload) | user_id, event_type, metadata, created_at |
| `user_sessions` | Sessoes ativas | user_id, ip, user_agent, device_info |
| `email_change_tokens` | Tokens de alteracao de email | user_id, token, expires_at, used |
| `auth_2fa_pending` | Login pendente de 2FA | user_id, temp_token, access_token, refresh_token |
| `staff_members` | Equipe admin | user_id, role, active |
| `match_ratings` | Avaliacao anonima pos-chat | (tabela pode nao existir — insert silencioso) |
| `bolo_reports` | Relatos de bolo (nao compareceu) | user_id (tabela pode nao existir — insert silencioso) |
| `video_sessions` | Sessoes de video | user_id |
| `video_minutes` | Minutos de video usados | user_id, date, minutes |
| `video_minutes_usage` | (alternativo) | user_id, minutes_used |
| `store_orders` | Pedidos da loja | user_id, item_key, amount |

### RPCs (Stored Procedures) identificadas
| RPC | Descricao |
|-----|-----------|
| `search_profiles` | Busca de perfis com filtros de distancia/idade/genero |
| `process_like` | Processa like/superlike, detecta match |
| `process_swipe` | (referenciada em curtidas/page.tsx) |
| `activate_boost` | Ativa boost consumindo saldo |
| `activate_ghost_mode` | Ativa modo fantasma |
| `activate_subscription` | Ativa plano do usuario |
| `update_daily_streak` | Atualiza streak diario |
| `update_streak_on_login` | Atualiza streak no login |
| `claim_streak_reward` | Resgata recompensa do calendario |
| `generate_streak_calendar` | Gera calendario de 30 dias |
| `extend_streak_calendar` | Extende calendario |
| `spin_roleta` | Gira roleta com lock para evitar race condition |
| `award_xp` | Concede XP com multiplicador de bonus |
| `add_fichas` | Adiciona fichas ao saldo |
| `spend_fichas` | Debita fichas atomicamente |
| `reward_referral` | Recompensa indicacao apos assinatura |
| `get_users_with_referrals` | Usuarios com N+ indicacoes |
| `check_login_attempts` | Rate limit de login |
| `register_login_attempt` | Registra tentativa de login |
| `expire_matches` | Expira matches antigos |
| `notify_expiring_matches` | Notifica matches prestes a expirar |
| `get_my_conversations` | Conversas do usuario com metadados |
| `activate_subscription` | Ativar plano |

---

## Dependencias Externas

| Package | Versao | Uso |
|---------|--------|-----|
| `next` | 16.1.6 | Framework principal |
| `react` | 19.2.3 | UI |
| `react-dom` | 19.2.3 | DOM |
| `@supabase/supabase-js` | ^2.98.0 | Auth + banco de dados + realtime + storage |
| `@supabase/ssr` | ^0.9.0 | Supabase em server components (SSR client) |
| `@supabase/auth-helpers-react` | ^0.15.0 | (instalado mas provavelmente legado — o app usa @supabase/ssr) |
| `@livekit/components-react` | ^2.9.20 | UI de videochamada |
| `@livekit/components-styles` | ^1.2.0 | Estilos LiveKit |
| `livekit-client` | ^2.17.2 | Client LiveKit |
| `livekit-server-sdk` | ^2.15.0 | SDK servidor LiveKit (geracao de tokens JWT) |
| `lucide-react` | ^0.577.0 | Icones (strokeWidth=1.5 como padrao) |
| `resend` | ^6.9.3 | Envio de emails transacionais |
| `web-push` | ^3.6.7 | Web Push notifications (VAPID) |
| `otplib` | ^13.3.0 | TOTP para 2FA |
| `qrcode` | ^1.5.4 | QR codes para 2FA |
| `canvas-confetti` | ^1.9.4 | Animacao de confetti no match |
| `tailwindcss` | ^4 | CSS (minimo — so utilitarios de fonte) |

---

## Variaveis de Ambiente

| Variavel | Uso | Exposta publicamente |
|----------|-----|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publica Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin Supabase (bypassa RLS) | Nao (somente servidor) |
| `RESEND_API_KEY` | Chave da API Resend para emails | Nao |
| `NEXT_PUBLIC_APP_URL` | URL publica do app (`https://www.meandyou.com.br`) | Sim |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Chave publica Cloudflare Turnstile | Sim |
| `TURNSTILE_SECRET_KEY` | Chave secreta Turnstile | Nao |
| `SIGHTENGINE_API_USER` | Usuario API Sightengine | Nao |
| `SIGHTENGINE_API_SECRET` | Segredo API Sightengine | Nao |
| `LIVEKIT_API_KEY` | Chave API LiveKit | Nao |
| `LIVEKIT_API_SECRET` | Segredo API LiveKit | Nao |
| `NEXT_PUBLIC_LIVEKIT_URL` | URL WebSocket LiveKit | Sim |
| `CAKTOPAY_ID` | ID Cakto (gateway REMOVIDO — variavel obsoleta) | Nao |
| `CAKTOPAY_SECRET` | Segredo Cakto (gateway REMOVIDO — variavel obsoleta) | Nao |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave publica VAPID (Web Push) | Sim |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID | Nao |
| `GOOGLE_CLOUD_VISION_API_KEY` | API Key Google Vision (referenciada mas uso nao verificado) | Nao |
| `ABACATEPAY_API_KEY` | Chave API AbacatePay (pagamentos) | Nao |
| `ABACATEPAY_WEBHOOK_SECRET` | Segredo para validar webhooks AbacatePay | Nao |
| `CRON_SECRET` | Segredo para autenticar chamadas de cron | Nao |

---

## Decisoes Tecnicas Criticas

1. **Login redirect:** `window.location.href` (nao `router.push`) — evita race condition com cookies Supabase
2. **Email domain hardcoded:** `https://www.meandyou.com.br` em `email.ts` — nunca usar env var
3. **Supabase em pages (client):** `import { supabase } from '@/app/lib/supabase'`
4. **Supabase em API routes:** `createClient` ou `createAdminClient` de `@/lib/supabase/server`
5. **supabase.rpc()** nao tem `.catch()` — usar try/catch padrao
6. **Tabela `badges`** tem RLS — escrita deve usar `/api/admin/badges` (service role), nunca anon key
7. **Campo de leitura no chat:** `read` (boolean) — nao `read_at`
8. **Middleware de rotas:** implementado em `src/proxy.ts` (provavelmente importado como `middleware.ts` ou `middleware.js` em algum lugar — verificar)

---

## Padroes de Arquitetura

- **Client Components:** marcados com `'use client'` — hooks e interatividade
- **Server Components:** layout.tsx admin e alguns layouts — verificacao de sessao server-side
- **API Routes:** todos usam `service_role` via `createAdminClient` para escrita segura
- **Realtime:** Supabase Postgres Changes para chat (canal `chat:{matchId}`) e camarote_messages
- **Fire-and-forget:** XP, notificacoes por email, atualizacao de streak — nao bloqueiam UX
- **Optimistic updates:** chat envia mensagem otimisticamente (tempId) e reverte em caso de erro
- **Rate limit:** duplo — client-side (useChat: 5/min, useSwipe: 10/min) + server-side (chat: 20/min, login: RPC, foto: 10/hora)
- **Rollback no cadastro:** se etapa falha, deleta usuario do Supabase Auth para evitar conta fantasma

---

## Observacoes Importantes

- **Webhook Cakto:** `/api/webhooks/cakto/route.ts` e um STUB que retorna 501. Gateway foi removido.
- **`CAKTOPAY_ID` e `CAKTOPAY_SECRET`** estao no `.env.local` mas sao obsoletos (gateway removido).
- **`GOOGLE_CLOUD_VISION_API_KEY`** esta no `.env.local` mas o uso nao foi encontrado no codigo relevante (pode estar em arquivo nao lido, ex: `upload-verificacao` ou `confirmar-verificacao`).
- **`@supabase/auth-helpers-react`** esta instalado mas o app usa `@supabase/ssr` — possivel dependencia legada.
- **Tabelas `match_ratings` e `bolo_reports`** sao referenciadas com insert silencioso (`fail silently`) — podem nao existir no banco.
- **Tabela `video_minutes` vs `video_minutes_usage`:** duas referencias diferentes para uso de minutos de video — possivel inconsistencia.
- **`src/proxy.ts`** exporta `proxy` e `config` com `matcher` — mas o arquivo se chama `proxy.ts`, nao `middleware.ts`. O middleware do Next.js precisa ser `middleware.ts` na raiz ou `src/middleware.ts`. Verificar se ha um arquivo `middleware.ts` ou se `proxy.ts` e importado diretamente.
- **EmptyState duplicado:** existe em `src/components/EmptyState.tsx` e `src/components/ui/EmptyState.tsx`.
- **Sidebar desktop vs Bottom Nav:** itens diferentes. Sidebar tem Loja (/loja), Bottom Nav nao tem. Bottom Nav tem Roleta (/roleta), Sidebar nao tem. Bottom Nav tem Premios (/recompensas) em vez de Loja.

---

## Log de Sessoes

### Sessao #1 — 2026-03-23
- Arquivos mapeados: 137 arquivos de codigo (excluindo assets e migrations)
- Migrations lidas: 6 (abacatepay, admin_recompensas, cadastro_progress, camarote_e_indicar, roleta_fix, cadastro_step referenciado)
- Tabelas identificadas: 35+
- RPCs identificadas: 22+
- APIs mapeadas: 45+ route handlers
- Metodo: leitura direta de todos os arquivos .ts e .tsx relevantes
