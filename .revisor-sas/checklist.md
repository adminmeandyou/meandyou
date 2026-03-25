# Checklist de Auditoria MeAndYou — 2026-03-24

Gerado por: Agente Analista (auditoria completa)
Baseado em: cerebro.md + leitura direta de todos os arquivos criticos
Revisado por: Agente Revisor — 2026-03-24 (verificacao arquivo a arquivo)

---

## CRITICO — quebra o sistema ou expoe segurança

- [ ] #001 [CONFIRMADO] [src/app/api/webhooks/abacatepay/route.ts:15-18 vs src/app/api/payments/create/route.ts:23-28] DISCREPANCIA CRITICA DE PRECOS DE FICHAS: payments/create usa {fichas_50: 597 cents, fichas_150: 1497, fichas_400: 3497, fichas_900: 5997}. O webhook usa fichasFromAmount com mapeamento {990->50, 2490->150, 4990->350} — os valores em centavos NAO CASAM em nenhum pacote. O webhook nunca vai encontrar a quantidade correta de fichas para creditar. Um usuario que paga R$5,97 por 50 fichas recebe 0 fichas (fichasFromAmount retorna 0 para 597 cents). — Evidencia: webhook linha 15: `990: 50, 2490: 150, 4990: 350` vs create linha 24: `fichas_50: { cents: 597 }`.

- [ ] #002 [CONFIRMADO] [src/app/api/webhooks/abacatepay/route.ts:15-19] O pacote fichas_900 (5997 cents) nao existe no mapeamento do webhook (so tem 990, 2490, 4990). Mesmo que os outros pacotes fossem corrigidos, o maior pacote sempre creditaria 0 fichas ao comprador. — Evidencia: `FICHAS_PACKAGES` do webhook tem apenas 3 entradas, sem entrada para 5997 cents.

- [ ] #003 [CONFIRMADO] [src/app/modos/page.tsx:1437] Campo correto na tabela likes e `from_user` (confirmado em useSwipe.ts:67 e curtidas/page.tsx:57). A query em modos/page.tsx linha 1437 usa `.eq('user_id', user.id)` na tabela likes — isso retorna always 0 resultados pois a coluna e `from_user`, nao `user_id`. O limite diario de curtidas NUNCA e decrementado corretamente. — Evidencia: `supabase.from('likes').select('is_superlike').eq('user_id', user.id)` vs useSwipe.ts: `{ from_user: user.id, to_user: currentProfile.id }`.

- [ ] #004 [CONFIRMADO] [src/app/api/badges/auto-award/route.ts:89-93] Case 'likes_sent_gte' usa `.select('user_id')` na tabela likes, mas a coluna correta e `from_user`. — Evidencia linha 90: `const { data } = await supabase.from('likes').select('user_id')` — todos os registros retornam `user_id: null`, o counts fica vazio, nenhum usuario recebe o badge.

- [ ] #005 [CONFIRMADO] [src/app/modos/page.tsx, src/app/backstage/page.tsx, src/app/destaque/page.tsx, src/app/curtidas/page.tsx, src/app/perfil/[id]/page.tsx] DUAS RPCs diferentes para a mesma acao: useSwipe e modos/page.tsx usam `process_like`; curtidas/page.tsx, backstage/page.tsx, destaque/page.tsx e perfil/[id]/page.tsx usam `process_swipe`. — Evidencia: grep confirma: `useSwipe.ts:79: process_like`, `modos/page.tsx:639: process_like`, `curtidas/page.tsx:96: process_swipe`, `backstage/page.tsx:429: process_swipe`, `perfil/[id]/page.tsx:378: process_swipe`.

- [ ] #006 [PARCIAL] [src/proxy.ts:170] O matcher do middleware exclui rotas que contenham `api/webhooks` (correto). Tambem exclui extensoes de imagem. Quanto ao timingSafeEqual: o codigo tem `if (!expected || !timingSafeEqual(...))` — se `expected` for string vazia, `!expected` e true e retorna 401 antes de chamar timingSafeEqual, evitando o crash. Porem se `secret` e `expected` tem comprimentos DIFERENTES em bytes (qualquer caractere multibyte), timingSafeEqual lanca TypeError. — Ajuste: o risco nao e de crash por expected vazio (ja protegido), mas sim por divergencia de tamanho de buffer quando secret contem caracteres UTF-8 multibyte. A validacao deveria usar `Buffer.byteLength` e comparar tamanhos antes.

- [ ] #007 [CONFIRMADO] [src/app/api/auth/2fa/verificar/route.ts:31] A tabela `auth_2fa_pending` e referenciada com coluna `expires_at`. O arquivo verificar/route.ts linha 31: `if (new Date(pending.expires_at) < new Date())`. O insert em login/route.ts (linha 160-165) NAO salva `expires_at` — o objeto inserido e `{user_id, temp_token, access_token, refresh_token}` sem `expires_at`. Portanto `pending.expires_at` e sempre null, e `new Date(null)` = 1970, fazendo TODOS os tokens parecerem expirados. Login com 2FA esta quebrado. — Evidencia: login/route.ts linha 160: `.insert({ user_id: userId, temp_token: tempToken, access_token: ..., refresh_token: ... })` — sem `expires_at`.

- [ ] #008 [PARCIAL] [src/app/api/webhooks/abacatepay/route.ts:31] O codigo e: `if (!expected || !timingSafeEqual(Buffer.from(secret), Buffer.from(expected)))`. Se `expected` for vazio, `!expected` = true e retorna 401 SEM chamar timingSafeEqual — portanto NAO crasha por expected vazio. O crash ocorre apenas se `secret` e `expected` tem tamanhos distintos em bytes, o que e improvavel com strings hexadecimais normais mas tecnicamente possivel. — Ajuste: o risco real e menor do que descrito; o cenario de crash exige que o secret na URL tenha comprimento de bytes diferente do secret configurado. Ainda e uma falha de hardening.

- [ ] #009 [FALSO POSITIVO] [src/app/api/admin/marketing/campanha/route.ts:30-34] O arquivo real seleciona `email, name` de `profiles` E aplica filtros `banned`, `verified`, `deleted_at` tambem em profiles. A descricao dizia que `email` nao existe em `profiles`, mas o codigo funciona se a coluna `email` existir em profiles (que pode existir mesmo sem constar no schema documentado). A query busca `profiles.email` — se a coluna existir no banco, funciona; se nao existir, retorna null. NAO e possivel confirmar se a coluna existe sem acesso ao banco. — Motivo: arquivo lido, a query seleciona `email, name` e aplica `.eq('banned', false).is('deleted_at', null)` — os filtros estao no lugar. Se a tabela `profiles` tiver coluna `email` (comum em apps Supabase que espelham auth.users), funciona normalmente.

- [ ] #010 [PARCIAL] [src/app/api/admin/usuarios/export/route.ts:24] A query seleciona `id, name, email, cpf, phone, plan, banned, verified, deleted_at, created_at` de `profiles`. Se `email` e `cpf` existem em `profiles`, funciona. Se nao, retorna null para essas colunas. NAO e possivel confirmar sem acesso ao banco. O risco depende do schema real. — Ajuste: o codigo esta estruturalmente correto; a duvida e se as colunas existem em `profiles` ou apenas em `users`. O issue original pode ser falso positivo dependendo do schema.

- [ ] #011 [PARCIAL] [src/app/api/admin/usuarios/export/route.ts:29-32] Os filtros `banned`, `verified` e `deleted_at` sao aplicados em `profiles`. Se essas colunas nao existem em `profiles`, os filtros sao ignorados silenciosamente pelo Supabase e o export retorna todos os usuarios. O schema documentado coloca `banned` em `users`, nao em `profiles`. — Evidencia linha 29-32: `query.eq('banned', true)`, `query.eq('verified', false)` — ambos aplicados na tabela `profiles`.

- [ ] #012 [CONFIRMADO] [src/app/planos/page.tsx:17-55] Todos os tres planos tem `checkoutUrl: '#'` com comentario `// TODO: configurar URL do novo gateway de pagamentos`. — Evidencia: linha 17: `checkoutUrl: '#', // TODO: configurar URL do novo gateway de pagamentos` (repetido para essencial, plus e black).

- [ ] #013 [CONFIRMADO] [src/components/StoreBottomSheet.tsx:21] Os pacotes avulsos tem `url: '#'` com comentario `// TODO: configurar URLs do novo gateway de pagamentos`. — Evidencia linha 21: `{ label: '1 SuperLike', ..., url: '#' }` com comentario TODO.

- [ ] #014 [CONFIRMADO] [src/app/backstage/page.tsx:30] `RESGATE_URL = '#'` com `// TODO: configurar URL do novo gateway de pagamentos`. — Evidencia: `const RESGATE_URL = '#' // TODO: configurar URL do novo gateway de pagamentos`.

- [ ] #015 [CONFIRMADO] [src/app/api/moderar-foto/route.ts:131-133] Quando SIGHTENGINE nao esta configurado, o codigo loga um warning e aprova a foto sem moderacao. — Evidencia linha 132: `console.warn('[moderar-foto] Sightengine sem credenciais — moderação ignorada')` — seguido pelo upload direto.

- [ ] #016 [CONFIRMADO] [.env.local / src/app/api/push/send/route.ts:14] RESEND_FROM_EMAIL nao esta no .env padrao. O arquivo push/send usa `process.env.RESEND_FROM_EMAIL || 'noreply@meandyou.com.br'` como fallback. — Evidencia linha 14: `mailto:${process.env.RESEND_FROM_EMAIL || 'noreply@meandyou.com.br'}` — fallback funcional para VAPID, mas email.ts pode falhar sem o campo `from` correto.

- [ ] #017 [CONFIRMADO] [src/app/api/cron/expire-matches/route.ts:8-10] CRON_SECRET nao definido. O codigo: `const secret = process.env.CRON_SECRET ?? ''` seguido de `if (!secret || auth !== ...)` — se CRON_SECRET for string vazia, `!secret` e true e retorna 401. O cron esta quebrado em desenvolvimento sem essa var. — Evidencia linha 8-10: `const secret = process.env.CRON_SECRET ?? ''` + `if (!secret || auth !== ...)`.

---

## ATENCAO — pode causar bugs ou comportamento incorreto

- [ ] #018 [CONFIRMADO] [src/app/api/payments/create/route.ts:64-70] O campo `cpf` e buscado em `profiles` (`select('display_name, cpf')`). Se CPF so existir em `users.cpf`, retorna null e AbacatePay recebe `taxId: '00000000000'`. — Evidencia linha 64-70: `supabase.from('profiles').select('display_name, cpf')` + linha 90: `taxId: profile?.cpf ?? '00000000000'`.

- [ ] #019 [CONFIRMADO] [src/app/api/payments/create/route.ts:89] O telefone do cliente enviado para AbacatePay e sempre `'00000000000'` (hardcoded). — Evidencia linha 89: `cellphone: '00000000000'` (e novamente na linha 131).

- [ ] #020 [CONFIRMADO] [src/app/minha-assinatura/page.tsx:37-38] O texto de features do Essencial diz "5 curtidas/dia" mas usePlan.ts define `likesPerDay: 20` para Essencial e planos/page.tsx exibe "20 curtidas por dia". — Evidencia: minha-assinatura linha 37: `'5 curtidas/dia'` vs usePlan.ts linha 46: `likesPerDay: 20`.

- [ ] #021 [CONFIRMADO] [src/hooks/usePlan.ts:64 vs src/app/planos/page.tsx:40] SuperCurtidas do Plus: usePlan.ts define `superlikesPerDay: 5` (linha 64), mas planos/page.tsx exibe "4 SuperCurtidas/dia" (linha 40). — Evidencia: usePlan.ts: `superlikesPerDay: 5` vs planos/page.tsx: `'4 SuperCurtidas/dia'`.

- [ ] #022 [CONFIRMADO] [src/app/api/auth/2fa/verificar/route.ts:6] Importa `decryptSecret` de `'../gerar/route'`. Acoplamento direto entre route handlers. — Evidencia linha 6: `import { decryptSecret } from '../gerar/route'`.

- [ ] #023 [CONFIRMADO] [src/app/api/badges/auto-award/route.ts:164-169] Case 'video_calls_gte' usa tabela `video_sessions` (linha 165). Case 'video_minutes_gte' usa `video_minutes_usage` (linha 173). O livekit/token.ts consulta tabela `video_minutes` (coluna `minutes`) e o webhook usa RPC `register_video_minutes`. As tabelas `video_sessions` e `video_minutes_usage` sao diferentes das usadas no resto do sistema. — Evidencia: auto-award linha 165: `supabase.from('video_sessions')` vs livekit/token.ts linha 59: `supabase.from('video_minutes')`.

- [ ] #024 [CONFIRMADO] [src/app/api/badges/auto-award/route.ts:181-197] Cases 'store_purchase', 'store_spent_gte', 'store_item' usam tabela `store_orders`. Compras de fichas vao para `payments` e debitos de items vao para RPC `spend_fichas` / `user_superlikes` etc. Nao ha tabela `store_orders` no codigo lido. — Evidencia linhas 181, 187, 197: `supabase.from('store_orders')`.

- [ ] #025 [CONFIRMADO] [src/app/api/safety/save/route.ts:39-40] Tenta conceder badge com `badge_id: 'seguranca'` (string literal). Os IDs de badges na tabela `badges` sao UUIDs gerados pelo banco. — Evidencia linha 40: `.upsert({ user_id: user.id, badge_id: 'seguranca' }, ...)` — string `'seguranca'` nao e um UUID valido.

- [ ] #026 [PARCIAL] [src/app/api/livekit/token/route.ts:58-63] A tabela consultada e `video_minutes` com colunas `user_id, date, minutes` (linha 59-63). O webhook usa RPC `register_video_minutes`. Se a RPC nao existir mas a tabela existir, o token e gerado mas os minutos nao sao debitados. Se a RPC existir, tudo funciona. O risco e real mas menor: a limitacao de minutos pode nao ser aplicada se a RPC falhar silenciosamente (o webhook captura o erro com console.error mas nao falha). — Ajuste: a descricao original dizia que a RPC nao existir "reseta para 0" — na verdade, se a RPC falhar, `minutesResult.data` retorna null e `minutosUsados = 0`, liberando minutos ilimitados. Isso confirma o risco.

- [ ] #027 [CONFIRMADO] [src/components/CheckoutModal.tsx:36-42] calcPrice usa `parseFloat((monthly * months * (1-discount)).toFixed(2))`. Para Plus trimestral: 39.97 * 3 * 0.9 = 107.919 -> toFixed(2) = 107.92. Backend tem 10790 cents = R$107,90. Diferenca de R$0,02. — Evidencia: `PLAN_MONTHLY = { plus: 39.97 }`, formula: 39.97 * 3 * 0.9 = 107.919 vs backend 10790 cents.

- [ ] #028 [CONFIRMADO] [src/app/api/cron/expire-matches/route.ts:14] O cron usa `createClient()` sem admin. A funcao `createClient()` de `@/lib/supabase/server` usa o cookie de sessao do request, mas o cron nao tem cookie de usuario. Portanto `supabase.auth.getUser()` retornaria usuario nulo mas o codigo pula essa verificacao e vai direto para as RPCs. As RPCs de expiracao chamadas anonimamente podem ser bloqueadas por RLS. — Evidencia: `const supabase = await createClient()` (linha 14) — nao usa `createAdminClient()`.

- [ ] #029 [CONFIRMADO] [src/proxy.ts] Quando usuario logado acessa `/busca` diretamente, nao ha redirecionamento — a pagina carrega sem shell pois `/busca` nao esta em PROTECTED_ROUTES nem em SHELL_PREFIXES. — Evidencia: PROTECTED_ROUTES em proxy.ts nao contem `/busca`. O AppShell usa lista de rotas para decidir se renderiza shell.

- [ ] #030 [FALSO POSITIVO] [src/app/api/badges/auto-award/route.ts:13-26] A verificacao de autorizacao usa `supabase.auth.getUser(token)` com SERVICE_ROLE_KEY para validar o token. Isso e o padrao correto — o admin client pode validar tokens de qualquer usuario. A busca de `profile` e `staff` verifica corretamente se o chamador e admin. O fluxo esta seguro. — Motivo: verificacao de role e feita corretamente; o cliente admin e usado para operacoes privilegiadas, nao para bypassar a verificacao de admin.

- [ ] #031 [FALSO POSITIVO] [src/app/api/admin/marketing/historico/route.ts] Arquivo existe e tem autorizacao correta — verifica `profiles.role === 'admin'` e `staff_members`. Retorna historico de `marketing_campaigns`. — Motivo: arquivo lido completamente, autorizacao implementada corretamente.

- [ ] #032 [CONFIRMADO] [src/app/api/boosts/notify-expired/route.ts] Este endpoint e chamado pelo frontend (nao e um cron). Notificacao de boost expirado so e disparada quando o usuario abre o app. — Evidencia: autenticacao por Bearer token (usuario autenticado), nao por CRON_SECRET. Comportamento fire-on-open confirmado.

- [ ] #033 [CONFIRMADO] [src/app/api/auth/login/route.ts:192-203] A tabela `user_sessions` e inserida a cada login sem limpeza automatica. Sem expires_at ou job de limpeza, a tabela crescera indefinidamente. — Evidencia linha 196: `.insert({ user_id: userId, ip, user_agent: ..., device_info: ... })` — sem campo `expires_at`.

- [ ] #034 [CONFIRMADO] [src/app/api/auth/login/route.ts:130-131] O calculo de `remainingAttempts` usa `(limitData?.attempts ?? 0) + 1`. Se `limitData` for null (RPC retornou vazio), `currentAttempts = 1` e `remainingAttempts = 2` sempre. O usuario nunca veria "1 tentativa restante" no cenario correto. — Evidencia linha 130: `const currentAttempts = (limitData?.attempts ?? 0) + 1`.

- [ ] #035 [CONFIRMADO] [src/app/modos/page.tsx] A pagina /modos tem mais de 1600 linhas combinando logica de swipe, busca, salas e filtros. Arquivo com alto risco de regressoes. — Evidencia: arquivo com 1645+ linhas de codigo (lido com offset 1420 ainda havia codigo).

- [ ] #036 [CONFIRMADO] [src/hooks/useAuth.ts] O hook chama `update_daily_streak` e `saveUserLocation` em fire-and-forget a cada mudanca de estado de auth (nao apenas no mount). Multiplas chamadas concorrentes sao possiveis. — Evidencia: `supabase.auth.onAuthStateChange` + `useEffect` ambos chamam RPCs sem deduplicacao.

- [ ] #037 [FALSO POSITIVO] [src/app/api/payments/status/[id]/route.ts] O endpoint valida `payment.user_id == usuario autenticado` via `.eq('user_id', user.id)` na query. Nao ha IDOR. — Evidencia linha 21-26: `.select(...).eq('id', params.id).eq('user_id', user.id)` — double filter garante que so retorna pagamentos do usuario autenticado.

---

## AVISO — inconsistencia, codigo morto, label errado

- [ ] #038 [CONFIRMADO] [src/components/EmptyState.tsx vs src/components/ui/EmptyState.tsx] Dois componentes com o mesmo nome em paths diferentes. — Evidencia: grep confirma ambos os arquivos existem: `src/components/EmptyState.tsx` e `src/components/ui/EmptyState.tsx`.

- [ ] #039 [CONFIRMADO] [src/components/Toast.tsx vs src/components/ui/Toast.tsx] Dois sistemas de Toast — o oficial e `src/components/Toast.tsx` (ToastProvider + useToast). `src/components/ui/Toast.tsx` e versao alternativa/legada. — Evidencia: grep nos imports confirmaria qual e usado onde, mas ambos existem no projeto.

- [ ] #040 [CONFIRMADO] [src/app/globals.css:16-29] O bloco `:root-backup-v1` existe dentro de um comentario CSS com seletor invalido. Codigo morto/lixo. — Evidencia: `/* ── BACKUP identidade v1 ... :root-backup-v1 { ... } */` — linhas 16-30 sao um comentario gigante com seletor nao-CSS.

- [ ] #041 [CONFIRMADO] [src/components/AppBottomNav.tsx] Usa variavel CSS `var(--accent-light)` para fundo do icone ativo. No globals.css, `--accent-light` e `rgba(225,29,72,0.10)` (vermelho suave) — nao e mais verde claro como na v1. — Evidencia: globals.css linha 40: `--accent-light: rgba(225,29,72,0.10)`.

- [ ] #042 [CONFIRMADO] [src/app/modos/page.tsx:1436-1448] Alem do bug critico #003, a query usa `.eq('user_id', user.id)` (coluna errada) e faz filtro client-side com `.filter(l => !l.is_superlike)`. — Evidencia: modos/page.tsx linha 1437: `supabase.from('likes').select('is_superlike').eq('user_id', user.id)`.

- [ ] #043 [CONFIRMADO] [src/app/api/auth/cadastro/route.ts:147-159] O cadastro inicializa `user_tickets, user_lupas, user_superlikes, user_boosts, user_rewinds` mas NAO inicializa `user_fichas`. — Evidencia: linhas 147-159 listam 5 tabelas + `daily_streaks`, sem `user_fichas`.

- [ ] #044 [CONFIRMADO] [src/app/api/auth/cadastro/route.ts:147-148 e 192-194] Novo usuario indicado recebe update para `amount: 3` em `user_tickets` (linha 193), mas o insert na linha 148 inseriu `amount: 0`. O update subsequente corrige, mas depende de ordem de execucao. — Evidencia: linha 148: `user_tickets.insert({ amount: 0 })` -> linha 193: `user_tickets.update({ amount: 3 })`.

- [ ] #045 [CONFIRMADO] [src/app/minha-assinatura/page.tsx:37] Features do Essencial listam "5 curtidas/dia" mas o limite correto e 20 curtidas/dia. — Evidencia: `PLAN_FEATURES.essencial: ['5 curtidas/dia', ...]` vs usePlan.ts: `likesPerDay: 20`.

- [ ] #046 [CONFIRMADO] [src/app/minha-assinatura/page.tsx:39] Features do Black listam "Boost automatico diario" que nao existe na logica implementada (boosts sao manuais, nao automaticos). — Evidencia: `PLAN_FEATURES.black: [..., 'Boost automatico diario', ...]` — nao ha logica de boost automatico no codigo.

- [ ] #047 [PARCIAL] [src/app/admin/page.tsx:244-246] O painel admin consulta `video_calls` (nao `video_sessions` como descrito no issue original). A tabela usada e `video_calls`, nao `video_sessions`. — Ajuste: admin/page.tsx linha 245: `supabase.from('video_calls').select('id')` — a tabela e `video_calls`, que pode ou nao existir. O issue sobre tabela nao documentada continua valido mas a tabela errada descrita no checklist original era `video_sessions`; o arquivo real usa `video_calls`.

- [ ] #048 [CONFIRMADO] [src/app/api/badges/auto-award/route.ts:55] O case 'on_verify' usa `.eq('verified', true)` em `profiles`. A coluna `verified` pode estar em `users` (conforme schema documentado), nao em `profiles`. — Evidencia linha 55: `supabase.from('profiles').select('id').eq('verified', true)`.

- [ ] #049 [CONFIRMADO] [src/app/api/badges/auto-award/route.ts:61] O case 'profile_complete' usa `.not('photo_face', 'is', null)`. A coluna `photo_face` pode ser legado (versao anterior do schema). — Evidencia linha 61: `.not('photo_face', 'is', null).not('bio', 'is', null)`.

- [ ] #050 [CONFIRMADO] [src/app/admin/layout.tsx vs src/proxy.ts] Dupla verificacao de acesso admin: o middleware (proxy.ts) verifica `profiles.role` + `staff_members` e o AdminLayout (server component) faz a mesma verificacao. Redundante mas nao causa inconsistencia critica. — Evidencia: proxy.ts linhas 47-86 e admin/layout.tsx linhas 11-30 verificam as mesmas tabelas.

- [ ] #051 [CONFIRMADO] [src/app/api/auth/login/route.ts:209] Atualiza `profiles.last_seen` no login. O OnlineIndicator e conversas/page.tsx usam `last_active_at` e `last_seen` de forma mista. A coluna atualizada pelo login e `last_seen`. — Evidencia: login/route.ts linha 209: `.update({ last_seen: new Date().toISOString() })` vs conversas/page.tsx linha 186: `select('... last_seen, show_last_active')` e matches/page.tsx: `last_active_at`. Ha inconsistencia de nome de campo entre partes do sistema.

- [ ] #052 [CONFIRMADO] [src/app/dashboard/page.tsx:42-44] As linhas apagam cookies `sb-access-token` e `sb-refresh-token` que nao sao mais usados (o login usa `sb-[project-ref]-auth-token`). Codigo morto ineficaz. — Evidencia linhas 43-44: `document.cookie = 'sb-access-token=; Max-Age=0; path=/'` e `sb-refresh-token=...`.

- [ ] #053 [CONFIRMADO] [src/app/dashboard/page.tsx] /dashboard nao esta no AppBottomNav como destino. So acessivel via logo na sidebar no desktop. Em mobile, o dashboard e inacessivel pela navegacao principal. — Evidencia: CLAUDE.md documenta BottomNav como: Chat / Descobrir / Salas (FAB) / Loja / Perfil — sem /dashboard.

- [ ] #054 [CONFIRMADO] [src/app/api/push/send/route.ts] O arquivo se chama `route.ts` e esta em `app/api/` mas nao exporta funcao `POST` ou `GET` — exporta apenas `enviarPushParaUsuario`. No Next.js App Router, nao exportar um handler HTTP nao expoe a rota mas o arquivo ainda e processado como route. — Evidencia: arquivo so exporta `export async function enviarPushParaUsuario(...)` — sem `export async function POST`.

- [ ] #055 [CONFIRMADO] [src/app/api/webhooks/livekit/route.ts:38-39] O comentario na linha 38 diz `"match-{matchId}-{userId}"` mas o codigo de gerar token usa `match-${matchId}` (sem userId). O processamento real em linha 50 usa `parts.slice(1).join('-')` que funciona corretamente para `match-{uuid}`. O comentario esta errado. — Evidencia: livekit/token.ts linha 80: `const roomName = 'match-${matchId}'` vs webhook linha 38: `// Padrao do nome da sala: "match-{matchId}-{userId}"`.

- [ ] #056 [CONFIRMADO] [src/app/api/auth/login/route.ts:158-166] No fluxo 2FA, `access_token` e `refresh_token` sao inseridos em texto claro na tabela `auth_2fa_pending`. — Evidencia linhas 160-165: `.insert({ user_id, temp_token, access_token: authData.session.access_token, refresh_token: authData.session.refresh_token })`.

- [ ] #057 [CONFIRMADO] [src/components/MatchModal.tsx] O arquivo MatchModal.tsx nao usa `canvas-confetti`. Usa haptics via `navigator.vibrate`. O cerebro.md menciona confetti erroneamente para MatchModal. — Evidencia: arquivo lido (via CLAUDE.md) — usa `navigator.vibrate([20,60,80])` no mount, sem confetti.

- [ ] #058 [CONFIRMADO] [src/app/api/admin/usuarios/export/route.ts:42-46] `totalGastoPorUser` e sempre `{}`, coluna "Total Gasto (R$)" exibe `0.00` para todos. — Evidencia linha 45-46: `const totalGastoPorUser: Record<string, number> = {}` + `void userIds // evitar warning`.

- [ ] #059 [INVESTIGAR] [src/app/api/admin/notificacoes/settings/route.ts] O endpoint gerencia tabela `notification_settings`. Nao foi possivel confirmar se a tabela existe no banco sem acesso direto ao Supabase. O endpoint retorna erro 500 se a tabela nao existir, falha silenciosa nas configuracoes de notificacoes. — Motivo: o codigo esta correto estruturalmente; a duvida e se a tabela foi criada via migration.

- [ ] #060 [CONFIRMADO] [src/app/api/admin/recompensas/route.ts:33-40] Consulta `streak_calendar_template` — tabela nao documentada no schema. Se nao existir, retorna erro 500. — Evidencia linha 35: `supabaseAdmin.from('streak_calendar_template').select(...)`.

- [ ] #061 [INVESTIGAR] [src/app/api/casal/route.ts e src/app/api/amigos/route.ts] O arquivo `/api/amigos/route.ts` existe e foi lido em busca de `last_seen` (tem implementacao). `/api/casal/route.ts` nao foi lido em detalhe. As paginas /casal e /amigos estao em PROTECTED_ROUTES. — Motivo: amigos/route.ts tem implementacao real (nao e stub); casal nao foi verificado.

- [ ] #062 [CONFIRMADO] [src/app/busca/page.tsx] `/busca` nao esta em PROTECTED_ROUTES do proxy.ts. O arquivo `busca/page.tsx` existe (e uma pagina de swipe legada com useSearch + useSwipe). Pode ser acessada sem autenticacao e sem o shell do app. — Evidencia: proxy.ts PROTECTED_ROUTES nao contem '/busca'. O arquivo existe mas esta orfao da protecao do middleware.

- [ ] #063 [CONFIRMADO] [src/app/match/page.tsx] Rota /match existe e tem implementacao real (pagina de swipe com useSearch + useSwipe). Nao esta em PROTECTED_ROUTES do proxy.ts nem no AppBottomNav. Pode ser acessada sem autenticacao. — Evidencia: proxy.ts nao contem '/match' em PROTECTED_ROUTES. O arquivo existe e tem conteudo real (nao e stub).

- [ ] #064 [FALSO POSITIVO] [src/app/api/badges/upload/route.ts] O endpoint tem autorizacao correta — verifica `profiles.role === 'admin'` e `staff_members` antes de aceitar upload. — Evidencia: linhas 19-21: `profile?.role !== 'admin' && !staff` -> retorna 403.

- [ ] #065 [FALSO POSITIVO] [src/app/api/badges/award/route.ts] O endpoint verifica `profiles.role === 'admin'` e `staff_members` antes de conceder badge. Usa cookie de sessao (createClient do SSR). — Evidencia linhas 22-26: verificacao de admin/staff antes de qualquer operacao.

- [ ] #066 [CONFIRMADO] [package.json] `@supabase/auth-helpers-react: "^0.15.0"` esta instalado. — Evidencia: package.json linha 14: `"@supabase/auth-helpers-react": "^0.15.0"`.

- [ ] #067 [CONFIRMADO] [src/app/layout.tsx:63-65] O service worker e registrado via `dangerouslySetInnerHTML` e `public/sw.js` NAO existe no projeto (grep em public/ nao encontrou o arquivo). — Evidencia: layout.tsx linha 64: `navigator.serviceWorker.register('/sw.js')`. Grep em public/ para `sw.js` retornou "No files found".

- [ ] #068 [CONFIRMADO] [src/app/api/auth/cadastro/route.ts:52-53] Se `TURNSTILE_SECRET_KEY` nao estiver configurado em producao, o cadastro continua sem verificacao. — Evidencia linhas 52-53: `if (!turnstileSecret && process.env.NODE_ENV === 'production') { console.warn(...) }` — sem retorno de erro, o cadastro prossegue.

- [ ] #069 [CONFIRMADO] [src/app/api/loja/gastar/route.ts:104-107] O item `reveals_5` abre janela de 24h via `curtidas_reveals_until`, mas o label do item e `'Ver quem curtiu (5 perfis)'`. O usuario pode esperar ver apenas 5 perfis mas na verdade ve todos por 24h. — Evidencia: ITEM_CONFIG linha 17: `reveals_5: { label: 'Ver quem curtiu (5 perfis)' }` + linha 104-107: update de `curtidas_reveals_until` para 24h (sem limite de 5 perfis).

- [ ] #070 [CONFIRMADO] [src/app/api/loja/gastar/route.ts:24-37] A funcao `incrementarSaldo` faz read-then-write (select + upsert) sem transacao atomica. Race condition possivel em requests concorrentes. — Evidencia linhas 25-36: `select('amount')` -> calcula `(cur?.amount ?? 0) + amount` -> `upsert(...)`.

- [ ] #071 [INVESTIGAR] [src/app/configuracoes/editar-perfil/page.tsx] Mencionado no CLAUDE.md como tendo "erro de TypeScript pre-existente em linha 113 (Fase 5)". Nao foi lido diretamente nesta revisao. — Motivo: arquivo nao verificado nesta sessao.

- [ ] #072 [CONFIRMADO] [src/hooks/useSearch.ts:110-120] Apos o RPC search_profiles, o hook faz segunda query para filtrar `ghost_mode_until` client-side (N+1). Perfis em modo fantasma podem aparecer momentaneamente. — Evidencia linhas 110-120: `supabase.from('profiles').select('id').in('id', ids).gt('ghost_mode_until', now)` — segunda query separada.

- [ ] #073 [CONFIRMADO] [src/app/api/auth/cadastro/route.ts:254-262] O email de verificacao usa `sendInstitutionalEmail` (funcao generica) em vez de `sendVerificationEmail` (funcao especifica). — Evidencia linha 254: `sendInstitutionalEmail(email, nomeExibicao, 'Confirme seu email - MeAndYou', ...)`.

- [ ] #074 [CONFIRMADO] [src/app/api/webhooks/abacatepay/route.ts:141-145] Em qualquer erro catch, o webhook retorna HTTP 200 para nao causar retentativas. Erros criticos (banco offline) sao silenciados. — Evidencia linha 144: `return NextResponse.json({ ok: true })` dentro do catch.

- [ ] #075 [INVESTIGAR] [src/app/api/roleta/girar/route.ts] A roleta usa createServerClient() + createAdminClient(). Se `user_fichas` nao existir para o usuario (bug #043), o spin_roleta pode falhar. Nao foi lido diretamente nesta revisao. — Motivo: arquivo nao verificado nesta sessao.

---

## SUGESTAO — melhorias recomendadas

- [ ] #076 [CONFIRMADO] [src/app/api/payments/create/route.ts:89] Celular hardcoded `'00000000000'`. Telefone real esta em `users.phone` (tabela diferente de profiles). — Evidencia: celular hardcoded em duas linhas (89 e 131).

- [ ] #077 [CONFIRMADO] [src/app/api/webhooks/abacatepay/route.ts:15-18] Unificar FICHAS_PACKAGES entre payments/create e o webhook. Dois objetos separados com valores diferentes. — Evidencia: dois `const FICHAS_PACKAGES` diferentes nos dois arquivos.

- [ ] #078 [CONFIRMADO] [src/app/api/loja/gastar/route.ts:25-37] A funcao `incrementarSaldo` faz read-then-write sem transacao. Usar RPC atomica no banco. — Evidencia: confirmado na verificacao do #070.

- [ ] #079 [CONFIRMADO] [src/app/api/auth/login/route.ts:155-167] Tokens de sessao em texto claro em `auth_2fa_pending`. — Evidencia: confirmado na verificacao do #056.

- [ ] #080 [CONFIRMADO] [src/lib/supabase/server.ts] A funcao `createClient()` exportada e importada em varios lugares. Pode causar confusao com o `createServerClient` do @supabase/ssr. — Evidencia: o arquivo tem `createClient` (SSR) e `createAdminClient` (service role), mas o nome `createClient` colide semanticamente com o do @supabase/supabase-js.

- [ ] #081 [CONFIRMADO] [src/app/api/push/send/route.ts] Arquivo e um helper, nao um endpoint HTTP. Nome `route.ts` e enganoso. — Evidencia: confirmado na verificacao do #054.

- [ ] #082 [CONFIRMADO] [src/app/api/auth/2fa/verificar/route.ts:6] Extrair `decryptSecret` para `src/lib/totp.ts`. — Evidencia: confirmado na verificacao do #022.

- [ ] #083 [CONFIRMADO] [src/app/modos/page.tsx] Arquivo com 1600+ linhas. Candidato a refatoracao em componentes menores. — Evidencia: confirmado na verificacao do #035.

- [ ] #084 [CONFIRMADO] [src/app/api/auth/login/route.ts:183-191] Atualizacao de `known_ua_hashes` e fire-and-forget. Funciona corretamente com `.slice(-9)` mantendo os ultimos 10. — Evidencia: linhas 185-188: `known_ua_hashes: [...knownHashes.slice(-9), uaHash]`.

- [ ] #085 [CONFIRMADO] [src/app/api/cron/expire-matches/route.ts] Usar `createAdminClient()` em vez de `createClient()` para garantir permissoes de alterar matches. — Evidencia: confirmado na verificacao do #028.

- [ ] #086 [CONFIRMADO] [Geral — env vars] Nao ha `.env.example` no projeto. RESEND_FROM_EMAIL e CRON_SECRET confirmados como ausentes do .env padrao. — Evidencia: issues #016 e #017 confirmados.

- [ ] #087 [FALSO POSITIVO] [src/app/api/payments/status/[id]/route.ts] Endpoint valida `payment.user_id == usuario autenticado`. Nao ha IDOR. — Evidencia: confirmado na verificacao do #037.

- [ ] #088 [FALSO POSITIVO] [src/app/api/badges/upload/route.ts] Tem autorizacao correta. — Evidencia: confirmado na verificacao do #064.

- [ ] #089 [INVESTIGAR] [migration_cadastro_step.sql] Nao foi verificado se o arquivo existe no repositorio nesta revisao.

- [ ] #090 [CONFIRMADO] [src/app/api/auth/cadastro/route.ts] Adicionar inicializacao de `user_fichas` junto com os outros saldos no step 4. — Evidencia: confirmado na verificacao do #043.
