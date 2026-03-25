# Cerebro MeAndYou — 2026-03-24

## Visao Geral

- **Stack:** Next.js 16.1.6 + React 19.2.3 + TypeScript
- **Framework:** Next.js App Router (src/app/)
- **Banco:** Supabase (PostgreSQL) — projeto `akignnxgjyryqcgxesqn`
- **Auth:** Supabase Auth (cookies SSR via @supabase/ssr)
- **Deploy:** Vercel (auto-deploy branch main)
- **Dominio:** https://www.meandyou.com.br
- **Email:** Resend (40 funcoes em src/app/lib/email.ts)
- **Push:** Web Push API (web-push + VAPID)
- **Video:** LiveKit (livekit-server-sdk + @livekit/components-react)
- **Pagamentos:** AbacatePay (PIX + cartao de credito)
- **Moderacao fotos:** Sightengine (opcional — sem credenciais = sem moderacao)
- **2FA:** otplib + qrcode
- **Localizacao:** GPS nativo + fallback ipapi.co
- **CSS:** globals.css com CSS variables (Dark Romantic v2). Tailwind v4 instalado mas usado minimamente (apenas utilitarios de fonte)
- **PWA:** manifest.json + service worker sw.js (registrado em layout.tsx)
- **Protecao de rotas:** src/proxy.ts (middleware Next.js)

---

## Arquitetura de Autenticacao

- Login via POST /api/auth/login -> seta cookies SSR via createServerClient (@supabase/ssr)
- Logout via POST /api/auth/logout -> signOut + limpa cookies
- Middleware (src/proxy.ts) protege rotas server-side lendo cookies
- Cliente browser: createBrowserClient em src/app/lib/supabase.ts
- Servidor/API routes: createClient() ou createAdminClient() em src/lib/supabase/server.ts
- REGRA CRITICA: login redirect usa window.location.href (nao router.push) para evitar race condition com cookies
- 2FA: login retorna requires_2fa + temp_token -> validado em /api/auth/2fa/verificar

---

## Estrutura de Rotas

### Paginas Publicas
- `/` -> src/app/page.tsx (Landing Page)
- `/login` -> src/app/login/page.tsx
- `/cadastro` -> src/app/cadastro/page.tsx
- `/recuperar-senha` -> src/app/recuperar-senha/page.tsx
- `/nova-senha` -> src/app/nova-senha/page.tsx
- `/privacidade` -> src/app/privacidade/page.tsx
- `/termos` -> src/app/termos/page.tsx
- `/ajuda` -> src/app/ajuda/page.tsx
- `/fale-conosco` -> src/app/fale-conosco/page.tsx
- `/suporte` -> src/app/suporte/page.tsx
- `/obrigado` -> src/app/obrigado/page.tsx
- `/banido` -> src/app/banido/page.tsx
- `/verificar-email` -> src/app/verificar-email/page.tsx
- `/confirmar-email` -> src/app/confirmar-email/page.tsx

### Paginas de Onboarding / Cadastro
- `/cadastro` -> multi-step: email > senha > nome completo > nome exibicao > CPF > telefone > codigo de convite
- `/aguardando-email` -> src/app/aguardando-email/page.tsx
- `/verificacao` -> src/app/verificacao/page.tsx (verificacao facial com mascara oval SVG)
- `/onboarding` -> src/app/onboarding/page.tsx (soft ask GPS/notif)

### Paginas Protegidas (usuario logado + onboarding_completed = true)
- `/modos` -> src/app/modos/page.tsx (hub de descoberta — tela principal do app)
- `/modos-guia` -> src/app/modos-guia/page.tsx
- `/match` -> src/app/match/page.tsx
- `/matches` -> src/app/matches/page.tsx
- `/conversas` -> src/app/conversas/page.tsx
- `/conversas/[id]` -> src/app/conversas/[id]/page.tsx
- `/chat/[matchId]` -> src/app/chat/[matchId]/page.tsx
- `/perfil` -> src/app/perfil/page.tsx (perfil proprio)
- `/perfil/[id]` -> src/app/perfil/[id]/page.tsx (ver perfil de outro)
- `/configuracoes` -> src/app/configuracoes/page.tsx
- `/configuracoes/editar-perfil` -> src/app/configuracoes/editar-perfil/page.tsx
- `/configuracoes/2fa` -> src/app/configuracoes/2fa/page.tsx
- `/configuracoes/alterar-email` -> src/app/configuracoes/alterar-email/page.tsx
- `/configuracoes/sessoes` -> src/app/configuracoes/sessoes/page.tsx
- `/configuracoes/casal` -> src/app/configuracoes/casal/page.tsx
- `/planos` -> src/app/planos/page.tsx
- `/minha-assinatura` -> src/app/minha-assinatura/page.tsx
- `/loja` -> src/app/loja/page.tsx
- `/destaque` -> src/app/destaque/page.tsx
- `/roleta` -> src/app/roleta/page.tsx
- `/streak` -> src/app/streak/page.tsx
- `/recompensas` -> src/app/recompensas/page.tsx
- `/emblemas` -> src/app/emblemas/page.tsx
- `/curtidas` -> src/app/curtidas/page.tsx (quem curtiu voce)
- `/indicar` -> src/app/indicar/page.tsx
- `/notificacoes` -> src/app/notificacoes/page.tsx
- `/backstage` -> src/app/backstage/page.tsx (plano Black exclusivo)
- `/backstage/chat/[id]` -> src/app/backstage/chat/[id]/page.tsx
- `/deletar-conta` -> src/app/deletar-conta/page.tsx
- `/videochamada/[matchId]` -> src/app/videochamada/[matchId]/page.tsx
- `/amigos` -> src/app/amigos/page.tsx
- `/salas` -> src/app/salas/page.tsx
- `/salas/[id]` -> src/app/salas/[id]/page.tsx
- `/salas/criar` -> src/app/salas/criar/page.tsx
- `/casal/aceitar` -> src/app/casal/aceitar/page.tsx
- `/dashboard` -> src/app/dashboard/page.tsx
- (NOTE: src/app/busca/page.tsx existe mas pode ser legado — rota atual eh /modos)

### Paginas Admin
- `/admin` -> src/app/admin/page.tsx
- `/admin/usuarios` -> src/app/admin/usuarios/page.tsx
- `/admin/financeiro` -> src/app/admin/financeiro/page.tsx
- `/admin/denuncias` -> src/app/admin/denuncias/page.tsx
- `/admin/seguranca` -> src/app/admin/seguranca/page.tsx
- `/admin/marketing` -> src/app/admin/marketing/page.tsx
- `/admin/cancelamentos` -> src/app/admin/cancelamentos/page.tsx
- `/admin/equipe` -> src/app/admin/equipe/page.tsx
- `/admin/emblemas` -> src/app/admin/emblemas/page.tsx
- `/admin/bugs` -> src/app/admin/bugs/page.tsx
- `/admin/insights` -> src/app/admin/insights/page.tsx
- `/admin/recompensas` -> src/app/admin/recompensas/page.tsx

---

## API Routes

### Auth (`src/app/api/auth/`)

**POST /api/auth/login**
- Faz: rate limit (RPC check_login_attempts), ban check pre-auth, signInWithPassword, 2FA check (retorna requires_2fa + temp_token), detecta novo dispositivo, registra sessao, seta cookies SSR
- Tabelas: users, profiles, auth_2fa_pending, user_sessions
- RPC: check_login_attempts, register_login_attempt, update_streak_on_login
- Emails: sendAccountBlockedEmail, sendSuspiciousLoginEmail, sendNewDeviceLoginEmail

**POST /api/auth/cadastro**
- Faz: valida CPF (algoritmo), Cloudflare Turnstile, cria usuario Supabase Auth (email_confirm: true), retry loop para trigger handle_new_user, inicializa saldos zerados, vincula referral, gera token verificacao email (30min), inicializa campos reg_*
- Tabelas: users, profiles, user_tickets, user_lupas, user_superlikes, user_boosts, user_rewinds, daily_streaks, referrals
- APP_URL hardcoded: 'https://www.meandyou.com.br'

**POST /api/auth/logout** -> signOut via SSR client, limpa cookies

**POST /api/auth/recuperar-senha** -> envia email reset senha

**POST /api/auth/nova-senha** -> atualiza senha

**DELETE /api/auth/deletar-conta**
- Faz: delete Supabase Auth primeiro, depois LGPD cascade completo
- Deleta: fotos/documentos (buckets), messages, matches, likes, referrals, notifications, profile_views, reports, roleta_history, streak_calendar, daily_streaks, push_subscriptions, analytics_events, video_calls, profiles, users
- Emails: sendAccountDeletedEmail, sendDataDeletionConfirmedEmail

**POST /api/auth/alterar-email** -> gera token 30min, envia email de confirmacao
**GET /api/auth/confirmar-email** -> valida token, atualiza email no Supabase Auth
**POST /api/auth/verificar-email** -> marca reg_email_verified = true
**POST /api/auth/reenviar-verificacao-email** -> reenvia email de verificacao

**2FA:**
- POST /api/auth/2fa/gerar -> gera secret TOTP + QR code, salva secret criptografado
- POST /api/auth/2fa/ativar -> valida TOTP, ativa 2FA, retorna 8 codigos backup
- POST /api/auth/2fa/desativar -> valida TOTP, desativa 2FA
- POST /api/auth/2fa/verificar -> step 2 do login (consome temp_token + codigo TOTP)

**Sessoes:**
- GET /api/auth/sessoes -> lista sessoes ativas do usuario
- DELETE /api/auth/sessoes/[id] -> encerra sessao especifica

### Chat (`src/app/api/chat/`)

**POST /api/chat/send**
- Auth: Bearer token
- Faz: modera conteudo (moderation.ts), verifica dados sensiveis (CPF/cartao/telefone), verifica participacao no match, rate limit server-side 20 msgs/60s, insere mensagem
- Tabelas: matches (verificacao), messages (insert)
- Alerta critico: chama /api/salas/alertar em background

### Matches (`src/app/api/matches/`)

**POST /api/matches/notify**
- Auth: Bearer token
- Faz: envia email de match para ambos (se notifications_email = true), envia push para ambos
- Importa enviarPushParaUsuario() de push/send/route.ts
- Tabelas: profiles (notifications_email, name)

### Pagamentos (`src/app/api/payments/`)

**POST /api/payments/create**
- Auth: Bearer token
- Faz: valida type/method, calcula valor, cria PIX ou billing AbacatePay, salva payment pendente
- Tabelas: profiles (display_name, cpf), payments (insert)
- Tipos/precos: essencial (997/2690/4780/8370 centavos), plus (3997/10790/19180/33570), black (9997/26990/47980/83970)
- Fichas: fichas_50(597), fichas_150(1497), fichas_400(3497), fichas_900(5997)
- Camarote: 4990 centavos

**GET /api/payments/status/[id]**
- Auth: Bearer token
- Faz: retorna status do pagamento (usado em polling PIX do CheckoutModal)

**POST /api/webhooks/abacatepay**
- Auth: secret na URL (timing-safe timingSafeEqual)
- Faz: processa billing.paid / pixQrCode.paid, claim atomico (pending->paid), ativa assinatura, credita fichas, ativa camarote
- RPC: activate_subscription, reward_referral, add_fichas
- ATENCAO: FICHAS_PACKAGES aqui usa {990->50, 2490->150, 4990->350} — DIFERENTE de payments/create

### XP / Gamificacao

**POST /api/xp/award**
- Auth: Bearer token
- Faz: verifica xp_bonus_until (2x), chama RPC award_xp
- Eventos e XP: like(5), dislike(1), superlike(15), match(25), message_sent(3), profile_complete(150), photo_added(10), purchase(50), spin_roleta(5), login_streak(10), invite_friend(100)

**POST /api/roleta/girar**
- Auth: cookie session (createServerClient) + admin para escrever (createAdminClient)
- Faz: chama RPC spin_roleta (debita ticket, sorteia por peso, credita premio)
- Premios possiveis: fichas, supercurtida, boost, lupa, rewind, invisivel_1d, plan_plus_1d, plan_black_1d

**POST /api/streak/resgatar**
- Auth: cookie session + admin client
- Faz: chama RPC claim_streak_reward(p_user_id, p_day_number)

**POST /api/streak/sincronizar** -> sincroniza streak diario

**POST /api/boosts/activate**
- Auth: Bearer token
- Faz: verifica plano (Black: max 2 boosts simultaneos), chama RPC activate_boost

**POST /api/boosts/notify-expired** -> notifica boost expirado por push/email

**POST /api/badges/award** -> concede badge (apenas admin ou staff_members)
**POST /api/badges/auto-award** -> concessao automatica de badges por condicoes
**POST /api/badges/upload** -> upload de imagem para badge

### Moderacao / Upload

**POST /api/moderar-foto**
- Auth: Bearer token
- Faz: rate limit 10 uploads/hora (via analytics_events), modera via Sightengine (nudity, offensive, gore), faz upload no bucket 'fotos', concede XP photo_added
- Storage: fotos/{userId}/foto_{index}.{ext}
- Thresholds: nudity.raw > 0.5, nudity.partial > 0.6, nudity.suggestive > 0.7, offensive > 0.7, gore > 0.7

**POST /api/confirmar-verificacao** -> confirma verificacao facial aprovada
**POST /api/enviar-verificacao** -> envia para verificacao facial
**POST /api/upload-verificacao** -> upload documento verificacao (bucket 'documentos')

**POST /api/denuncias**
- Auth: Bearer token
- Faz: valida categoria, impede auto-denuncia, insere em reports
- Categorias: fake, inappropriate, harassment, spam, minor, other

### Video

**POST /api/livekit/token**
- Auth: Bearer token
- Faz: verifica match participante e status='active', verifica limite minutos/dia por plano, gera JWT LiveKit (TTL: 2h, sala: match-{matchId})
- Tabelas: matches, profiles (plan), video_minutes
- Limites: essencial(60min), plus(300min), black(600min)

**POST /api/webhooks/livekit** -> processa eventos LiveKit (fim de sessao, contabiliza minutos)

### Push Notifications

**POST /api/push/subscribe** -> registra subscription (endpoint, p256dh, auth) na tabela push_subscriptions
**POST /api/push/send** -> NAO e um endpoint HTTP — arquivo exporta funcao enviarPushParaUsuario() usada internamente

### Salas

**POST /api/salas/criar** -> cria sala (valida/modera nome com moderation.ts)
**POST /api/salas/entrar** -> adiciona usuario como membro da sala
**POST /api/salas/alertar** -> dispara alerta ao suporte (conteudo critico detectado)

### Seguranca Encontros

**POST /api/safety/save** -> salva registro privado de encontro (safety_records)
**POST /api/safety/checkin** -> marca checked_in = true no safety_records

**POST /api/meeting/invite** -> cria ou responde convite de encontro estruturado

### Admin

**POST /api/admin/badges** -> gerencia badges (admin only)
**POST /api/admin/injetar-saldo** -> injeta saldo para usuario (admin only)
**POST /api/admin/marketing/campanha** -> envia campanha de email marketing
**GET /api/admin/marketing/historico** -> historico de campanhas
**POST /api/admin/notificacoes/settings** -> configura notificacoes
**POST /api/admin/recompensas** -> gerencia recompensas
**GET /api/admin/usuarios/export** -> exporta usuarios em CSV
**POST /api/admin/bugs/[id]/verificar** -> verifica/confirma bug reportado
**POST /api/admin/bugs/[id]/recusar** -> recusa bug reportado

### Outros

**POST /api/bugs/reportar** -> usuario reporta bug
**POST /api/contato** -> formulario de contato
**POST /api/suporte** -> abre ticket de suporte
**GET /api/notificacoes** -> lista notificacoes do usuario
**GET /api/validar-token** -> valida token generico
**POST /api/destaque/revelar** -> revela quem curtiu (consome lupa do inventario)
**POST /api/loja/gastar** -> consome fichas do usuario
**POST /api/likes/superlike-notify** -> notifica o usuario que recebeu superlike
**POST /api/assinatura/cancelar** -> cancela assinatura ativa
**POST /api/casal/route** -> funcionalidades do modo casal
**POST /api/amigos/route** -> funcionalidades de amigos
**POST /api/cron/expire-matches** -> cron job que expira matches inativos

---

## Componentes

### AppShell (`src/components/AppShell.tsx`)
- Faz: wrapper condicional que renderiza shell apenas para rotas em SHELL_PREFIXES; fora do shell renderiza apenas ToastProvider
- Importa: AppHeader, AppBottomNav, AppSidebar, AppHeaderContext, ToastProvider
- Exporta: AppShell
- SHELL_PREFIXES: /dashboard, /modos, /match, /matches, /chat, /conversas, /perfil, /configuracoes, /planos, /minha-assinatura, /loja, /destaque, /roleta, /streak, /recompensas, /indicar, /notificacoes, /backstage, /emblemas
- SHELL_EXACT: /salas

### AppHeader (`src/components/AppHeader.tsx`)
- Faz: header mobile (56px sticky) com logo/back, slot centro (modeSelector ou pageTitle), Bell (/notificacoes) + Settings (/configuracoes)
- Props: modeSelector, rightActions, leftAction, backHref, pageTitle
- Exporta: AppHeader

### AppBottomNav (`src/components/AppBottomNav.tsx`)
- Itens atuais: /matches (Users), /modos (Compass), /roleta (Zap — FAB central accent), /recompensas (Gift), /perfil (User)
- Usa useHaptics.tap() em todos os cliques

### AppSidebar (`src/components/AppSidebar.tsx`)
- Faz: sidebar desktop (72px icon-only) com mesma navegacao

### AppHeaderContext (`src/contexts/AppHeaderContext.tsx`)
- Faz: contexto para paginas injetarem conteudo dinamico no header
- Exporta: AppHeaderProvider, useAppHeader
- Campos: modeSelector, setModeSelector, rightActions, setRightActions, leftAction, setLeftAction, backHref, setBackHref, pageTitle, setPageTitle

### Toast (`src/components/Toast.tsx`)
- Faz: sistema global de toasts (success/error/info), auto-dismiss 3.2s, max 3 simultaneos, posicao bottom 80px
- Exporta: ToastProvider, useToast
- ATENCAO: existe tambem src/components/ui/Toast.tsx (duplicado)

### ReportModal (`src/components/ReportModal.tsx`)
- Faz: modal de denuncia em 3 passos (razao > detalhes > sucesso)
- Chama: POST /api/denuncias
- Exporta: ReportModal, ReportButton
- Mapeamento de razoes: fake_profile->fake, scam->other, harassment->harassment, minor->minor, inappropriate->inappropriate

### PaywallCard (`src/components/PaywallCard.tsx`)
- Faz: card de bloqueio com countdown e CTA -> /planos
- Props: title, description, resetAt (Date), ctaLabel

### CheckoutModal (`src/components/CheckoutModal.tsx`)
- Faz: modal de checkout multi-step (ciclo > pagamento > PIX/cartao > sucesso)
- Chama: POST /api/payments/create, GET /api/payments/status/[id] (polling 3s para PIX)
- Polling para confirmacao PIX ativo enquanto step=3 + method='pix'
- Tipos: subscription | fichas | camarote
- Exporta: default CheckoutModal

### StoreBottomSheet (`src/components/StoreBottomSheet.tsx`)
- Faz: bottom sheet de microtransacoes com 3 pacotes por tipo
- Tipos: superlike | boost | lupa | rewind | ghost

### MatchModal (`src/components/MatchModal.tsx`)
- Faz: tela "Deu Match!" fullscreen com animacoes, particulas (canvas-confetti), haptics no mount
- Props: matchId, myPhoto, otherPhoto, otherName, onClose, onStartChat

### Skeleton (`src/components/Skeleton.tsx`)
- Exporta: SkeletonList, SkeletonCard, SkeletonGrid e variantes

### OnlineIndicator (`src/components/OnlineIndicator.tsx`)
- Faz: bolinha de status — verde (< 1h), ambar (< 24h), sem ponto (> 48h)
- Modos: 'dot' (sobreposto ao avatar), 'text' (no header do chat)
- Dados: last_active_at, show_last_active da tabela profiles

### VideoCall (`src/components/VideoCall.tsx`)
- Faz: interface de videochamada via LiveKit
- Importa: livekit-client, @livekit/components-react, @livekit/components-styles

### EmptyState (`src/components/EmptyState.tsx`)
- ATENCAO: existe tambem src/components/ui/EmptyState.tsx — possivel conflito de import

---

## Componentes UI (`src/components/ui/`)

| Componente | Descricao |
|-----------|-----------|
| Pill.tsx | Chip/tag clicavel (selected, hover, disabled, loading) |
| SliderRange.tsx | Slider duplo de intervalo (idade/distancia) |
| ToggleSwitch.tsx | Toggle com label e descricao |
| BottomSheet.tsx | Painel sobe da base com portal, blur, handle |
| Modal.tsx | Pop-up centralizado com portal e ESC |
| FAB.tsx | Botao de acao flutuante (primary/surface) |
| SkeletonLoader.tsx | Silhueta piscante (text/avatar/card/rect) |
| EmptyState.tsx | Icone + titulo + descricao + CTA (DUPLICADO) |
| Toast.tsx | Banner flutuante (DUPLICADO de src/components/Toast.tsx) |
| BadgePill.tsx | Tag de raridade: Comum/Incomum/Raro/Lendario |
| Accordion.tsx | Sanfona para filtros |
| ChatBubble.tsx | Balao enviado/recebido (sending/sent/delivered/read) |
| SwipeButton.tsx | Botao circular da action bar (default/danger/primary/gold/info) |
| ProfileCard.tsx | Card de swipe 3:4 com fotos navegaveis |
| MatchCard.tsx | Avatar redondo para fila de matches |

---

## Hooks

### useAuth (`src/hooks/useAuth.ts`)
- Faz: pega sessao Supabase, ouve onAuthStateChange, dispara (fire-and-forget) update_daily_streak + awardXp('login_streak') + saveUserLocation
- Exporta: { user, loading, supabase }
- NOTA: awardXp chama internamente /api/xp/award via fetch

### useChat (`src/hooks/useChat.ts`)
- Faz: carrega mensagens, subscreve Realtime (postgres_changes INSERT em messages), rate limit client-side (5 msgs/min sem resposta), optimistic update, marca como lida ao receber
- Interface Message: { id, match_id, sender_id, content, created_at, read }
- CAMPO CORRETO: 'read' (boolean) — nao 'read_at'
- MAX_CHARS = 500, MAX_MSGS_PER_MIN = 5
- Exporta: { messages, loading, sending, error, sendMessage, currentUserId }

### usePlan (`src/hooks/usePlan.ts`)
- Faz: carrega plano e todos os saldos em paralelo (7 queries)
- Planos: essencial (20 likes/dia, 1 superlike/dia), plus (30 likes/dia, 5 superlikes/dia), black (Infinity likes, 10 superlikes/dia max, 2 boosts simultaneos)
- Inventario sobrescreve plano: lupasBalance > 0 libera canSeeWhoLiked; rewindsBalance > 0 libera canUndo
- Exporta: { limits, loading, canLike, getUpgradeMessage, reload }

### useSwipe (`src/hooks/useSwipe.ts`)
- Faz: gerencia deck de perfis, processa swipe, rate limit client-side 10 likes/min
- RPC: process_like(p_user_id, p_target_id, p_is_superlike)
- Dislike: upsert silencioso em dislikes (nao bloqueia UI)
- Exporta: { currentProfile, currentIndex, hasMore, processing, matchResult, swipe, dismissMatch }

### useSearch (`src/hooks/useSearch.ts`)
- Faz: busca perfis via RPC, carrega filtros salvos, captura GPS (com fallback IP), filtra ghost_mode_until client-side apos retorno do RPC
- RPC: search_profiles(p_user_id, p_lat, p_lng, p_max_distance_km, p_min_age, p_max_age, p_gender)
- Interface ProfileResult: { id, name, birthdate, bio, city, state, gender, pronouns, photo_best, distance_km, age, profile_score, last_active_at, show_last_active }
- lat/lng NUNCA expostos na interface publica
- Exporta: { filters, setFilters, results, loading, error, locationGranted, savedFilters, search, saveFilters, resetFilters, updateLocation }

### useHaptics (`src/hooks/useHaptics.ts`)
- Faz: wrapper navigator.vibrate — silencioso em dispositivos sem suporte
- Exporta: { tap(10ms), medium(25ms), success([15,40,15]), error([30,20,30]), match([20,60,80]) }

---

## Lib / Utilitarios

### src/app/lib/supabase.ts
- Exporta: supabase (createBrowserClient com ANON_KEY)
- REGRA: usar em pages/components cliente. API routes usam src/lib/supabase/server.ts

### src/lib/supabase/server.ts
- Exporta: createClient() (SSR com cookies, ANON_KEY), createAdminClient() (service role, SERVICE_ROLE_KEY)
- REGRA: createAdminClient() para operacoes que precisam ignorar RLS

### src/app/lib/email.ts
- Exporta: 40 funcoes async via Resend
- Funcao interna enviar() tem try/catch que silencia erros (falhas sao apenas logadas — nunca propagadas)
- Domain hardcoded: 'https://www.meandyou.com.br'
- Usa: RESEND_API_KEY, RESEND_FROM_EMAIL

### src/app/lib/xp.ts
- Faz: fire-and-forget XP — chama getSession() e faz POST /api/xp/award
- Exporta: awardXp(userId, eventType)
- Erros silenciados com .catch(() => {})

### src/app/lib/location.ts
- Faz: GPS com timeout 8s (enableHighAccuracy: true), fallback ipapi.co (timeout 5s), salva lat/lng + last_seen em profiles
- Exporta: saveUserLocation(userId), getLocation()

### src/app/lib/moderation.ts
- Faz: normaliza texto (sem acento, lowercase), verifica PALAVRAS_PROIBIDAS (bloqueia) e PALAVRAS_CRITICAS (bloqueia + alerta suporte)
- Exporta: moderateContent(text), getModerationMessage(result), moderateRoomName(name), containsSensitiveData(text)
- containsSensitiveData: detecta CPF, numero de cartao, telefone com DDD

### src/proxy.ts (middleware)
- Exporta: proxy() function + config (matcher)
- PROTECTED_ROUTES: /modos, /match, /matches, /chat, /perfil, /planos, /dashboard, /conversas, /loja, /destaque, /indicar, /backstage, /roleta, /streak, /onboarding, /notificacoes, /suporte, /ajuda, /deletar-conta, /minha-assinatura, /videochamada, /curtidas, /configuracoes, /salas, /amigos, /casal, /aguardando-email
- PUBLIC_ONLY_ROUTES (redireciona para /modos se logado): /login, /cadastro, /recuperar-senha, /nova-senha
- Fluxo de cadastro: reg_credentials_set=false -> /cadastro; reg_credentials_set=true -> /aguardando-email; reg_email_verified=true -> /verificacao; reg_facial_verified=true -> /onboarding; onboarding_completed=true -> acesso total
- Permissoes staff admin: gerente, suporte_financeiro, suporte_tecnico, suporte_chat
- NOTA IMPORTANTE: /busca NAO esta em PROTECTED_ROUTES

---

## Banco de Dados

### Migrations encontradas (raiz do projeto)
- `migration_abacatepay.sql` — tabela payments, renomeia cakto_order_id -> gateway_order_id, adiciona cycle em subscriptions, indices
- `migration_admin_recompensas.sql` — tabelas para o sistema de recompensas do admin
- `migration_cadastro_progress.sql` — colunas reg_* em profiles, email_verified/email_verify_token em users, migracao de dados existentes de onboarding_done para onboarding_completed
- `migration_cadastro_step.sql` — versao anterior (step numerico) — provavelmente obsoleto
- `migration_camarote_e_indicar.sql` — tabelas camarote e programa de indicacoes/referrals
- `migration_limpeza_campos_legados.sql` — remove campos obsoletos do banco
- `migration_profile_optional_fields.sql` — campos opcionais do perfil (corpo, estilo de vida, etc.)
- `migration_roleta_fichas.sql` — substitui premios ticket por fichas, reescreve funcao spin_roleta (cria user_fichas se nao existir)
- `migration_roleta_fix.sql` — correcoes na roleta
- `migration_salas.sql` — 6 tabelas de salas de chat + 8 salas padrao inseridas + Realtime habilitado
- `migration_tabelas_faltando.sql` — match_ratings, bolo_reports, safety_records, meeting_invites
- `migration_security_fase1.sql` — REFERENCIADO em CLAUDE.md mas NAO encontrado na raiz — cria auth_2fa_pending, user_sessions, email_change_tokens, colunas TOTP em users

### Tabelas identificadas no codigo

**auth.users** (Supabase Auth — gerenciada automaticamente)

**public.users** (criada por trigger handle_new_user)
- id, email, cpf (unico), phone, nome_completo
- verified (boolean — verificacao facial)
- banned (boolean)
- known_ua_hashes (text[] — hashes SHA256 de User-Agents conhecidos)
- totp_enabled (boolean), totp_secret (text), totp_backup_codes (text[])
- email_verified (boolean), email_verify_token (text), email_verify_token_expires_at (timestamptz)

**public.profiles** (criada por trigger handle_new_user)
- id, name (exibicao), display_name, plan ('essencial'|'plus'|'black'), role ('admin'|null)
- bio, birthdate, city, state, gender, pronouns
- lat, lng (localizacao — NUNCA exposto em selects publicos)
- last_seen, last_active_at, show_last_active
- photo_best (URL), photos (array URLs), highlight_tags, filters (jsonb)
- profile_score (interno), referred_by, referral_code
- notifications_email (boolean)
- incognito_until (timestamptz — modo invisivel / conta pausada)
- ghost_mode_until (timestamptz — modo fantasma no feed de busca)
- camarote_expires_at (timestamptz)
- curtidas_reveals_until (timestamptz — permissao temporaria para ver quem curtiu)
- xp, xp_level, xp_bonus_until
- onboarding_completed, reg_credentials_set, reg_email_verified, reg_document_verified, reg_facial_verified, reg_name_confirmed, reg_username_confirmed, reg_invite_provided, reg_invite_code
- cpf (tambem em profiles — usado em payments/create para AbacatePay)

**public.matches** — id, user1, user2, status ('active'|'blocked'|...), created_at

**public.messages** — id, match_id, sender_id, content, created_at, read (BOOLEAN — nao 'read_at')

**public.likes** — id, from_user (user_id), to_user, is_superlike, created_at

**public.dislikes** — from_user, to_user (upsert com onConflict 'from_user,to_user')

**public.filters** — user_id, search_max_distance_km, search_min_age, search_max_age, search_gender, search_saved

**public.notifications** — id, user_id, type, from_user_id, read, data (jsonb), created_at

**public.push_subscriptions** — user_id, endpoint, p256dh, auth

**public.reports** — id, reporter_id, reported_id, reason, details, status, created_at

**public.subscriptions** — user_id, plan, status, cycle, gateway_order_id, starts_at, ends_at

**public.payments** — id, user_id, type, gateway_id (UNIQUE), method, amount (numeric 10,2), status, metadata (jsonb), created_at, paid_at

**public.user_superlikes** — user_id, amount
**public.user_boosts** — user_id, amount, active_until
**public.user_lupas** — user_id, amount
**public.user_rewinds** — user_id, amount
**public.user_tickets** — user_id, amount
**public.user_fichas** — user_id, amount (tabela criada por migration_roleta_fichas.sql)

**public.daily_streaks** — user_id, current_streak, longest_streak, last_login_date
**public.streak_calendar** — user_id (detalhes nao lidos diretamente)
**public.roleta_history** — user_id, reward_type, reward_amount, was_jackpot
**public.roleta_prizes** — id, reward_type, reward_amount, weight, active

**public.badges** — id (RLS ativo — escrita OBRIGATORIAMENTE via service role em /api/admin/badges)
**public.user_badges** — user_id, badge_id, expires_at

**public.analytics_events** — user_id, event_type, metadata, created_at (usado para rate limit de fotos)
**public.video_minutes** — user_id, date, minutes
**public.video_calls** — caller_id, callee_id (pode nao existir em todos os ambientes)

**public.referrals** — referrer_id, referred_id, status ('pending')
**public.profile_views** — viewer_id, viewed_id
**public.staff_members** — user_id, role, active

**public.auth_2fa_pending** — user_id, temp_token, access_token, refresh_token
**public.user_sessions** — user_id, ip, user_agent, device_info, created_at
**public.email_change_tokens** — user_id, token, expires_at, used_at

**public.match_ratings** — match_id, rater_id, rated_id, rating, created_at (UNIQUE: match_id+rater_id)
**public.bolo_reports** — match_id, reporter_id, reported_id, user_id (GENERATED ALWAYS AS reporter_id), created_at
**public.safety_records** — user_id, match_id, match_name, local, meeting_date, checked_in, checked_in_at, created_at
**public.meeting_invites** — match_id, proposer_id, receiver_id, local, meeting_date, status ('pending'|'accepted'|'declined'|'rescheduled'|'cancelled'), reschedule_note, responded_at

**public.chat_rooms** — id, name, type ('public'|'private'|'black'), description, emoji, max_members, created_by, is_active
**public.room_members** — room_id, user_id, nickname, joined_at (PK: room_id+user_id)
**public.room_messages** — id, room_id, sender_id, nickname, content, is_system, created_at
**public.room_profile_requests** — room_id, requester_id, target_id, status, expires_at (default: +10min)
**public.room_chat_requests** — room_id, requester_id, target_id, status, expires_at
**public.room_blocks** — room_id, blocker_id, blocked_id (UNIQUE: room_id+blocker_id+blocked_id)

### RPCs identificadas no codigo
- `update_daily_streak(p_user_id)` — useAuth
- `update_streak_on_login(p_user_id)` — /api/auth/login
- `search_profiles(p_user_id, p_lat, p_lng, p_max_distance_km, p_min_age, p_max_age, p_gender)` — useSearch
- `process_like(p_user_id, p_target_id, p_is_superlike)` — useSwipe
- `process_swipe` — referenciada em curtidas/page.tsx (relacao com process_like a verificar)
- `check_login_attempts(p_email)` — /api/auth/login
- `register_login_attempt(p_email, p_ip, p_success)` — /api/auth/login
- `activate_boost(p_user_id)` — /api/boosts/activate
- `award_xp(p_user_id, p_event_type, p_base_xp)` — /api/xp/award, /api/moderar-foto
- `activate_subscription(p_user_id, p_plan, p_order_id)` — /api/webhooks/abacatepay
- `reward_referral(p_referred_id)` — /api/webhooks/abacatepay
- `add_fichas(p_user_id, p_amount)` — /api/webhooks/abacatepay
- `spin_roleta(p_user_id)` — /api/roleta/girar
- `claim_streak_reward(p_user_id, p_day_number)` — /api/streak/resgatar
- `get_my_conversations` — referenciada em conversas/page.tsx (CLAUDE.md)

---

## Variaveis de Ambiente

### Publicas (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_SUPABASE_URL` — URL Supabase (akignnxgjyryqcgxesqn.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave anonima Supabase
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — chave publica VAPID
- `NEXT_PUBLIC_APP_URL` — URL do app (fallback: https://www.meandyou.com.br)
- `NEXT_PUBLIC_LIVEKIT_URL` — URL do servidor LiveKit
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — chave publica Turnstile (usada no frontend cadastro)

### Privadas (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` — CRITICA — usada em todas as API routes para bypass RLS
- `RESEND_API_KEY` — envio de emails
- `RESEND_FROM_EMAIL` — email remetente
- `VAPID_PRIVATE_KEY` — Web Push
- `LIVEKIT_API_KEY` — LiveKit server
- `LIVEKIT_API_SECRET` — LiveKit server
- `ABACATEPAY_API_KEY` — gateway de pagamento
- `ABACATEPAY_WEBHOOK_SECRET` — valida webhooks AbacatePay
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile (opcional em dev — obrigatorio em prod)
- `SIGHTENGINE_API_USER` — moderacao de fotos (OPCIONAL — sem isso, fotos nao sao moderadas)
- `SIGHTENGINE_API_SECRET` — moderacao de fotos (OPCIONAL)
- `CRON_SECRET` — protege endpoints cron (referenciado em memory/pendencias)

---

## Dependencias Externas

| Lib | Versao | Uso |
|-----|--------|-----|
| next | 16.1.6 | Framework App Router |
| react | 19.2.3 | UI |
| @supabase/supabase-js | ^2.98.0 | Auth + DB cliente e servidor |
| @supabase/ssr | ^0.9.0 | Supabase em server components e middleware |
| @supabase/auth-helpers-react | ^0.15.0 | INSTALADO mas provavelmente NAO USADO (legado pre-SSR) |
| @livekit/components-react | ^2.9.20 | UI de videochamada |
| @livekit/components-styles | ^1.2.0 | Estilos LiveKit |
| livekit-client | ^2.17.2 | Client LiveKit browser |
| livekit-server-sdk | ^2.15.0 | Geracao de JWT LiveKit server-side |
| lucide-react | ^0.577.0 | Icones (regra: strokeWidth={1.5} em todos) |
| resend | ^6.9.3 | Envio de emails |
| web-push | ^3.6.7 | Web Push notifications |
| otplib | ^13.3.0 | TOTP para 2FA |
| qrcode | ^1.5.4 | QR code para setup 2FA |
| canvas-confetti | ^1.9.4 | Animacao de confeti no MatchModal |
| tailwindcss | ^4 | CSS (uso minimo — apenas utilitarios de fonte) |
| typescript | ^5 | Tipos |

---

## Layouts

### Root Layout (`src/app/layout.tsx`)
- Fontes Google: Fraunces (--font-fraunces, peso 700) + Plus Jakarta Sans (--font-jakarta, pesos 400/500/600/700) com display: 'swap'
- Metadata: titulo, descricao, OG, Twitter Card, manifest PWA, apple-touch-icon
- PWA: registra sw.js via script dangerouslySetInnerHTML
- Wraps tudo com AppShell

### Admin Layout (`src/app/admin/layout.tsx`)
- Server Component
- Verifica user autenticado + role='admin' em profiles OU staff_members.active=true
- Renderiza AdminLayoutClient passando role
- Redireciona /login (sem auth) ou /dashboard (sem acesso admin/staff)

---

## Identidade Visual (Dark Romantic v2 — OFICIAL)

| Variavel CSS | Valor |
|-------------|-------|
| --bg | #08090E |
| --bg-card | #0F1117 |
| --bg-card2 | #13161F |
| --accent | #E11D48 (vermelho) |
| --accent-dark | #be123c |
| --accent-light / --accent-soft | rgba(225,29,72,0.10) |
| --accent-border | rgba(225,29,72,0.25) |
| --text | #F8F9FA |
| --muted | rgba(248,249,250,0.50) |
| --muted-2 | rgba(248,249,250,0.30) |
| --border | rgba(255,255,255,0.07) |
| --border-soft | rgba(255,255,255,0.04) |
| --gold | #F59E0B (exclusivo VIP/Black) |
| --gold-light | rgba(245,158,11,0.10) |
| --gold-border | rgba(245,158,11,0.25) |
| --green | #10b981 |
| --green-light | rgba(16,185,129,0.12) |
| --red / --accent | #E11D48 |
| --red-2 | #F43F5E |

REGRA CRITICA: Botao vermelho (--accent) = texto SEMPRE #fff. NUNCA texto escuro.
Branding: "MeAnd" branco + "You" vermelho.

Keyframes CSS definidos em globals.css: shimmer, slideUp, (toast-in definido inline em Toast.tsx)

---

## Problemas Obvios Ja Visiveis (encontrados durante o mapeamento)

### CRITICO
1. **Discrepancia de precos fichas entre dois arquivos:** `/api/webhooks/abacatepay` usa FICHAS_PACKAGES = {990 cents -> 50 fichas, 2490 -> 150, 4990 -> 350}. `/api/payments/create` usa FICHAS_PACKAGES = {fichas_50: 597 cents, fichas_150: 1497, fichas_400: 3497, fichas_900: 5997}. Os valores em centavos NAO CASAM — o webhook provavelmente nao encontra o gateway_id correto ou credita quantidades erradas.

2. **migration_security_fase1.sql ausente:** O arquivo e referenciado em CLAUDE.md como obrigatorio para as features de 2FA, sessoes e alterar-email. Nao foi encontrado na raiz do projeto. Se nao foi rodado no Supabase, as tabelas auth_2fa_pending, user_sessions e email_change_tokens podem nao existir, quebrando login com 2FA e gestao de sessoes.

3. **Moderacao de fotos desabilitada em producao se SIGHTENGINE nao configurado:** O codigo simplesmente ignora a moderacao e aprova qualquer foto. Um aviso e logado mas o upload prossegue. Sem SIGHTENGINE_API_USER + SIGHTENGINE_API_SECRET, conteudo impróprio pode ser publicado.

### ATENCAO
4. **Rota /busca vs /modos:** CLAUDE.md documenta /busca como tela principal de swipe. O proxy.ts protege /modos. A AppBottomNav aponta para /modos. O arquivo src/app/busca/page.tsx existe mas nao aparece no shell nem no proxy como rota principal. Pode ser um arquivo orfao ou alias nao documentado.

5. **Componentes duplicados:** EmptyState existe em src/components/EmptyState.tsx E em src/components/ui/EmptyState.tsx. Toast existe em src/components/Toast.tsx E em src/components/ui/Toast.tsx. Imports errados podem usar a versao desatualizada.

6. **CPF em profiles vs users:** A tabela users.cpf e a tabela profiles.cpf — o codigo de /api/payments/create busca profiles.cpf (via `select('display_name, cpf')`). A validacao de CPF unico no cadastro verifica users.cpf. Os dois campos podem ficar dessincronizados.

7. **process_swipe vs process_like:** useSwipe chama RPC process_like. CLAUDE.md menciona process_swipe em curtidas/page.tsx. Se existirem dois nomes diferentes para RPCs que fazem a mesma coisa, inconsistencia de schema.

8. **incognito_until vs ghost_mode_until:** Dois campos para "invisibilidade". incognito_until e usado para pausar a conta (deletar-conta/page.tsx). ghost_mode_until e filtrado em useSearch apos retorno do RPC. Verificar se o RPC search_profiles ja filtra ghost_mode_until internamente (seria dupla filtragem) ou se os dois sao complementares.

9. **@supabase/auth-helpers-react instalado mas possivelmente nao usado:** Dependencia legada, versao antiga. Pode ser removida.

### AVISO
10. **Verificacao de admin em /api/badges/award usa createClient() (ANON_KEY):** A verificacao de role usa o cliente SSR que le cookies do usuario atual. Um usuario com cookies validos poderia theoricamente manipular a sessao. O correto para verificar roles seria usar createAdminClient() para buscar profile/staff.

11. **Funcao enviar() em email.ts silencia todos os erros:** Todos os 40 fluxos de email tem falhas silenciadas. Em producao, se Resend falhar, o sistema continua sem notificacao. Considerar pelo menos logging estruturado.

12. **Polling PIX sem timeout global:** CheckoutModal faz polling a cada 3s indefinidamente enquanto status != 'paid' e status != 'expired'. Se o pagamento ficar preso em 'pending' para sempre (bug no webhook), o polling nunca para.

13. **useSearch filtra ghost_mode_until com query separada:** Apos receber resultados do RPC search_profiles, faz uma segunda query para filtrar ghost_mode_until. Isso gera N+1 queries quando ha resultados. Idealmente o RPC ja filtraria internamente.

14. **Pagina /busca pode ser orfao:** src/app/busca/page.tsx existe mas nao esta em PROTECTED_ROUTES nem no shell. Se for acessada, nao tem header/nav e nao e protegida pelo middleware.

15. **Saldos inicializados sem tabela user_fichas no cadastro:** /api/auth/cadastro inicializa user_tickets, user_lupas, user_superlikes, user_boosts, user_rewinds mas NAO user_fichas. A tabela user_fichas foi criada em migration_roleta_fichas.sql. Novos usuarios podem nao ter linha em user_fichas, e o RPC spin_roleta usa INSERT ... IF NOT FOUND como fallback.

---

## Log de Sessoes

### Sessao #1 — 2026-03-24

**Auditoria completa executada:** 90 issues encontradas, 13 falsos positivos, 77 confirmadas. Checklist em `.revisor-sas/checklist.md`.

**Correcoes aplicadas nesta sessao:**

#### Curtidas por modo (issue #003 — CORRIGIDO PARCIALMENTE)
- `src/hooks/usePlan.ts`: Plus `likesPerDay` alterado de 30 para 50
- `src/app/modos/page.tsx`:
  - Funcao `getLikeLimit()` substituida por `getModeLimit(plan, mode)` e `getDailyMatchLimit(plan)`
  - Limites por plano e modo:
    - Essencial: 20/dia em Descobrir e Busca Avancada, 1 recomendacao/dia em Match do Dia
    - Plus: 50/dia em Descobrir e Busca Avancada, 3 recomendacoes/dia em Match do Dia
    - Black: ilimitado em Descobrir e Busca Avancada, 8 recomendacoes/dia em Match do Dia
  - Estado `likesUsed` substituido por `modeLikesUsed: Record<string, number>` (contador por modo)
  - Carregamento inicial agora busca contagens de hoje por modo da tabela `mode_likes`
  - `triggerSwipe`: insere em `mode_likes` e usa limite do modo atual
  - Undo: decrementa apenas o modo correto
  - Display: mostra `modeLikesUsed[viewMode] / limite` (exibe infinito para Black)
  - Match do Dia: deck usa `getDailyMatchLimit(userPlan)` em vez de hardcoded 5
- `migration_likes_mode.sql` **CRIADA** (pendente de rodar no Supabase):
  - Tabela `mode_likes` (id, user_id, mode, created_at)
  - Indice por user_id + mode + date
  - RLS: SELECT, INSERT, DELETE apenas do proprio usuario

#### Schema real da tabela `likes` (confirmado 2026-03-24 via SQL Editor)
- Colunas corretas: `user_id` (quem curtiu), `target_id` (quem recebeu), `is_superlike` (boolean)
- Unica RPC existente: `process_like(p_user_id, p_target_id, p_is_superlike)`
- `process_swipe` NAO EXISTE no banco — era chamada em 4 arquivos, todos corrigidos

#### RPC process_swipe → process_like (issues #004 e #005 — CORRIGIDO)
- `src/app/curtidas/page.tsx`: colunas `from_user`/`to_user`/`type` → `user_id`/`target_id`/`is_superlike`. RPC corrigida.
- `src/app/perfil/[id]/page.tsx`: dislike agora insere em `dislikes` diretamente; like/superlike usam `process_like`
- `src/app/destaque/page.tsx`: RPC e params corrigidos
- `src/app/backstage/page.tsx`: RPC e params corrigidos (removido `p_action` inexistente)

**Issues pendentes (nao corrigidas):**
- #001/#002: Fichas nao creditadas (AbacatePay) — aguardando configuracao dos produtos
- #006: migration_security_fase1.sql RECRIADA (2026-03-24) — tabelas ja existiam no banco, arquivo salvo para historico
- #007: FALSO POSITIVO — expires_at tem DEFAULT no banco (NOW() + 10min), funciona corretamente
- #019: telefone hardcoded corrigido em payments/create/route.ts — agora usa profile.phone
- #012/#013/#014: Botoes de compra com checkoutUrl '#' — aguardando configuracao AbacatePay
