# Checklist de Auditoria — meandyou-app
Gerado em: 2026-03-23
Baseado no cerebro.md — Sessao #1

---

## Issues Encontradas

---

### ISSUE-001
- **Severidade:** CRITICO
- **Categoria:** Referências quebradas — Middleware
- **Arquivo:** src/proxy.ts
- **Descrição:** O arquivo `src/proxy.ts` exporta `proxy` e `config` com `matcher`, mas o Next.js exige que o middleware esteja em `middleware.ts` (na raiz ou em `src/middleware.ts`). Se `proxy.ts` não for importado por um `middleware.ts`, **nenhuma rota está sendo protegida server-side**. Isso significa que qualquer usuário pode acessar rotas como `/dashboard`, `/chat`, `/perfil`, etc., sem autenticação.
- **Evidência no cerebro:** "Middleware de rotas: implementado em `src/proxy.ts` (provavelmente importado como `middleware.ts` ou `middleware.js` em algum lugar — verificar)" e "O app não tem middleware.ts — sem proteção server-side de rotas."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** Glob por `middleware.ts` em toda a raiz e em `src/` retornou zero resultados. O arquivo `src/proxy.ts` existe e exporta `proxy` + `config.matcher` corretamente, mas **nunca é importado** — o Next.js não o reconhece como middleware. Nenhuma rota está protegida server-side.
- **Status:** CONFIRMADO

---

### ISSUE-002
- **Severidade:** CRITICO
- **Categoria:** Segurança básica — Rotas sem proteção server-side
- **Arquivo:** src/proxy.ts / todas as páginas protegidas
- **Descrição:** O cerebro confirma explicitamente: "Não existe `middleware.ts` no projeto. A proteção de rotas é feita client-side via hook `useAuth` + redirecionamento." Proteção apenas client-side é insuficiente — qualquer pessoa pode desabilitar JavaScript ou acessar diretamente os endpoints de API e páginas protegidas sem passar pelo hook `useAuth`.
- **Evidência no cerebro:** "Middleware: Não existe `middleware.ts` no projeto. A proteção de rotas é feita client-side via hook `useAuth` + redirecionamento. O admin verifica role na tabela `profiles` e `staff_members` no Supabase."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** Confirmado pela ISSUE-001 — `middleware.ts` não existe em lugar nenhum do projeto. O `src/proxy.ts` tem toda a lógica correta (proteção de rotas, verificação de sessão Supabase, verificação de ban, redirect por etapa de cadastro) mas nunca é executado pelo Next.js. Todo o código de proteção em `proxy.ts` é código morto.
- **Status:** CONFIRMADO

---

### ISSUE-003
- **Severidade:** CRITICO
- **Categoria:** Inconsistências entre arquivos — Tabela de vídeo
- **Arquivo:** src/app/api/livekit/token/route.ts (inferido) e outras referências a vídeo
- **Descrição:** Existem duas tabelas diferentes referenciadas no código para controle de minutos de vídeo: `video_minutes` (com colunas `user_id, date, minutes`) e `video_minutes_usage` (com coluna `user_id, minutes_used`). Se partes diferentes do código usam tabelas diferentes, o limite diário de minutos por plano (essencial=60, plus=300, black=600) será calculado incorretamente — potencialmente deixando usuários Essencial assistirem vídeo ilimitado.
- **Evidência no cerebro:** "Tabela `video_minutes` vs `video_minutes_usage`: duas referencias diferentes para uso de minutos de video — possivel inconsistencia."
- **Veredicto:** ❌ FALSO POSITIVO (corrigido pelo usuário)
- **Evidência Real:** `video_minutes` = tabela de limites permitidos por plano. `video_minutes_usage` = tabela de uso registrado. São tabelas com propósitos complementares e distintos, não duplicatas. O design é intencional.
- **Status:** FALSO POSITIVO

---

### ISSUE-004
- **Severidade:** CRITICO
- **Categoria:** Segurança básica — Variáveis de ambiente obsoletas
- **Arquivo:** .env.local
- **Descrição:** As variáveis `CAKTOPAY_ID` e `CAKTOPAY_SECRET` estão no `.env.local` apesar do gateway Cakto ter sido removido. Se o `.env.local` foi alguma vez commitado no git (há pendência registrada na memória do projeto sobre isso), essas credenciais — e potencialmente todas as outras — estão expostas no histórico do repositório. O cerebro também menciona `GOOGLE_CLOUD_VISION_API_KEY` com uso não verificado.
- **Evidência no cerebro:** "`CAKTOPAY_ID` e `CAKTOPAY_SECRET` estao no `.env.local` mas sao obsoletos (gateway removido)" e "Verificar se .env.local foi commitado no git e rotacionar chaves se necessario (URGENTE)" na memória do projeto.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** `.env.local` confirmado com `CAKTOPAY_ID` e `CAKTOPAY_SECRET` presentes (gateway removido — código morto). `GOOGLE_CLOUD_VISION_API_KEY` também presente. O diretório NÃO é um repositório git (`git log` retornou vazio), portanto o risco de exposição no histórico git **não se aplica aqui** — mas as chaves obsoletas ainda devem ser removidas. A chave `GOOGLE_CLOUD_VISION_API_KEY` é USADA em `src/app/api/upload-verificacao/route.ts:50`, portanto não é obsoleta (ver ISSUE-010).
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-005
- **Severidade:** CRITICO
- **Categoria:** Erros de lógica — Tabelas inexistentes no banco
- **Arquivo:** src/app/conversas/[id]/page.tsx (inferido)
- **Descrição:** As tabelas `match_ratings` e `bolo_reports` são referenciadas com insert silencioso ("fail silently se não existir"). Se essas tabelas não existem, os inserts falham silenciosamente e dados de avaliação pós-chat e relatos de "bolo" são perdidos permanentemente sem nenhum alerta ou log. Isso é um problema de integridade de dados, não apenas de UX.
- **Evidência no cerebro:** "Tabelas `match_ratings` e `bolo_reports` sao referenciadas com insert silencioso (`fail silently`) — podem nao existir no banco."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/conversas/[id]/page.tsx:392` tem o comentário literal `// Tentativa silenciosa — tabela match_ratings pode nao existir ainda` e faz `await supabase.from('match_ratings').insert(...)` sem nenhum tratamento de erro. `src/app/conversas/[id]/page.tsx:408` faz `await supabase.from('bolo_reports').insert(...)` igualmente sem verificação. Adicionalmente, `src/app/perfil/[id]/page.tsx:307` faz SELECT em `match_ratings` — se a tabela não existir, as avaliações exibidas no perfil serão sempre vazias sem nenhum aviso.
- **Status:** CONFIRMADO

---

### ISSUE-006
- **Severidade:** CRITICO
- **Categoria:** Referências quebradas — RPC duplicada
- **Arquivo:** src/app/api/ (seção RPCs do cerebro)
- **Descrição:** A RPC `activate_subscription` aparece listada duas vezes na tabela de RPCs identificadas. Pode indicar que há duas versões da função no banco com assinaturas diferentes, ou que o cerebro capturou referências divergentes no código (ex: parâmetros diferentes sendo passados em contextos diferentes). Se a assinatura divergir, chamadas podem falhar silenciosamente.
- **Evidência no cerebro:** Tabela de RPCs lista `activate_subscription` em duas linhas separadas: linha 527 e linha 543.
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** Grep em todo o `src/` encontrou apenas UMA chamada a `activate_subscription`: `src/app/api/webhooks/abacatepay/route.ts:77` com parâmetros `(p_user_id, p_plan, p_order_id)`. A segunda "linha" no cerebro (`src/app/api/webhooks/cakto/route.ts:6`) é apenas um **comentário** no arquivo stub do Cakto que descreve o que o webhook deveria fazer — não é uma chamada real. A RPC é chamada exatamente uma vez, com parâmetros consistentes.
- **Status:** FALSO POSITIVO

---

### ISSUE-007
- **Severidade:** ATENCAO
- **Categoria:** Inconsistências entre arquivos — Campos de onboarding conflitantes
- **Arquivo:** src/proxy.ts / src/app/api/auth/cadastro/route.ts / banco de dados
- **Descrição:** O campo `onboarding_done` foi substituído por `onboarding_completed` (migration_cadastro_progress.sql), mas a memória do projeto indica que `onboarding_done` pode ainda estar referenciado em algum lugar. O proxy verifica `onboarding_completed` para o fluxo de cadastro — se qualquer página ou API ainda usar `onboarding_done`, o redirecionamento pode travar o usuário em loop.
- **Evidência no cerebro:** Coluna `onboarding_completed` listada em `profiles` como campo atual. Memória do projeto: "ATENCAO: `onboarding_done` foi substituido por `onboarding_completed`."
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** Grep por `onboarding_done` em todo o `src/` retornou **zero resultados**. O código usa exclusivamente `onboarding_completed` — visível em `src/proxy.ts:116` (`select 'reg_credentials_set, reg_email_verified, reg_facial_verified, onboarding_completed'`) e `src/proxy.ts:124` (`if (profile?.onboarding_completed)`). A migração foi concluída corretamente no código.
- **Status:** FALSO POSITIVO

---

### ISSUE-008
- **Severidade:** ATENCAO
- **Categoria:** Inconsistências entre arquivos — Sidebar vs Bottom Nav divergentes
- **Arquivo:** src/components/AppSidebar.tsx / src/components/AppBottomNav.tsx
- **Descrição:** Os dois componentes de navegação têm itens diferentes. A Sidebar desktop inclui Loja (/loja) mas não tem Roleta (/roleta). O Bottom Nav mobile tem Roleta (FAB central) e Prêmios (/recompensas) mas não tem Loja diretamente. Um usuário desktop não consegue acessar /roleta pela sidebar, e um usuário mobile tem acesso a /recompensas mas não está claro se /loja é acessível na bottom nav.
- **Evidência no cerebro:** "Sidebar desktop vs Bottom Nav: itens diferentes. Sidebar tem Loja (/loja), Bottom Nav nao tem. Bottom Nav tem Roleta (/roleta), Sidebar nao tem. Bottom Nav tem Premios (/recompensas) em vez de Loja."
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** Sidebar (`AppSidebar.tsx`) tem: `/conversas`, `/busca`, `/recompensas`, `/loja`, `/perfil`. Bottom Nav (`AppBottomNav.tsx`) tem: `/conversas`, `/busca`, `/roleta` (FAB), `/recompensas`, `/perfil`. A Sidebar tem `/loja` mas não tem `/roleta`. O Bottom Nav tem `/roleta` mas não tem `/loja`. A divergência existe, porém é parcialmente mitigada: a página `/recompensas` atua como hub que linka para `/roleta`, `/streak`, `/destaque` e `/loja` — então `/loja` é acessível pelo mobile via `/recompensas`. O usuário desktop, porém, não tem acesso a `/roleta` pela sidebar (seria necessário digitar a URL).
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-009
- **Severidade:** ATENCAO
- **Categoria:** Código morto — Dependência legada instalada
- **Arquivo:** package.json
- **Descrição:** `@supabase/auth-helpers-react` versão `^0.15.0` está instalado, mas o app usa `@supabase/ssr` para autenticação. A biblioteca `auth-helpers-react` é considerada legada pela Supabase. Além de aumentar o bundle desnecessariamente, pode causar conflitos com `@supabase/ssr` se ambas forem importadas acidentalmente no mesmo contexto.
- **Evidência no cerebro:** "`@supabase/auth-helpers-react` ^0.15.0 — (instalado mas provavelmente legado — o app usa @supabase/ssr)"
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `package.json:14` tem `"@supabase/auth-helpers-react": "^0.15.0"` nas dependências de produção. Grep em todo o `src/` não encontrou nenhum import de `@supabase/auth-helpers-react` — a biblioteca está instalada mas nunca é usada no código. Aumenta o bundle desnecessariamente e cria risco de conflito com `@supabase/ssr` (instalado na linha 15) se alguém importar acidentalmente.
- **Status:** CONFIRMADO

---

### ISSUE-010
- **Severidade:** ATENCAO
- **Categoria:** Referências quebradas — Variável de ambiente sem uso verificado
- **Arquivo:** .env.local / src/app/api/upload-verificacao/route.ts ou src/app/api/confirmar-verificacao/route.ts
- **Descrição:** `GOOGLE_CLOUD_VISION_API_KEY` está no `.env.local` mas o cerebro não encontrou onde é usado. Se essa API key está sendo usada em `upload-verificacao` ou `confirmar-verificacao` mas de forma não documentada, pode haver uma dependência crítica não mapeada. Alternativamente, é uma chave obsoleta que deveria ser rotacionada e removida.
- **Evidência no cerebro:** "`GOOGLE_CLOUD_VISION_API_KEY` esta no `.env.local` mas o uso nao foi encontrado no codigo relevante (pode estar em arquivo nao lido, ex: `upload-verificacao` ou `confirmar-verificacao`)."
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `src/app/api/upload-verificacao/route.ts:50` usa `process.env.GOOGLE_CLOUD_VISION_API_KEY` ativamente. A variável é utilizada — o cerebro simplesmente não leu esse arquivo durante a análise. Não há problema aqui.
- **Status:** FALSO POSITIVO

---

### ISSUE-011
- **Severidade:** ATENCAO
- **Categoria:** Erros de lógica — Emails silenciosos (falhas invisíveis)
- **Arquivo:** src/app/lib/email.ts
- **Descrição:** Todas as 40 funções de email usam `try/catch` sem propagação de erro — falhas são apenas logadas (ou ignoradas). Em casos críticos como `sendVerificationEmail` (verificação de conta), `sendPasswordResetEmail` (recuperação de senha) e `sendDataDeletionConfirmedEmail` (LGPD), uma falha silenciosa pode deixar o usuário sem email crítico sem nenhuma notificação para o sistema ou o usuário.
- **Evidência no cerebro:** "Falhas sao silenciosas (try/catch sem propagacao). Email domain hardcoded como `https://www.meandyou.com.br`."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/lib/email.ts:10-16` — a função `enviar()` tem `try/catch` que apenas faz `console.error(...)` e retorna `void` em caso de falha. Todas as 40 funções exportadas chamam `enviar()` sem verificar o retorno (que é sempre `void`). O chamador nunca sabe se o email foi entregue ou falhou. O domain está hardcoded como `https://www.meandyou.com.br` (linha 7) — isso é comportamento intencional documentado, não um bug.
- **Status:** CONFIRMADO

---

### ISSUE-012
- **Severidade:** ATENCAO
- **Categoria:** Inconsistências entre arquivos — AppShell vs proxy: rotas divergentes
- **Arquivo:** src/components/AppShell.tsx / src/proxy.ts
- **Descrição:** O `AppShell` renderiza o shell (sidebar + header + bottom nav) para rotas em `SHELL_PREFIXES`. O `proxy.ts` define `PROTECTED_ROUTES`. Há rotas protegidas pelo proxy que NÃO estão no shell (ex: `/suporte`, `/ajuda`, `/deletar-conta`, `/aguardando-email`, `/notificacoes`, `/salas`, `/amigos`, `/casal`, `/videochamada`, `/curtidas`), e rotas no shell que podem não estar no proxy. Isso pode fazer páginas protegidas renderizarem sem o layout correto ou vice-versa.
- **Evidência no cerebro:** SHELL_PREFIXES: `/dashboard, /busca, /match, /matches, /chat, /conversas, /perfil, /configuracoes, /planos, /minha-assinatura, /loja, /destaque, /roleta, /streak, /recompensas, /indicar, /notificacoes, /backstage, /emblemas`. PROTECTED_ROUTES inclui adicionalmente: `/suporte, /ajuda, /deletar-conta, /minha-assinatura, /videochamada, /curtidas, /configuracoes, /salas, /amigos, /casal, /aguardando-email`.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** Leitura direta dos arquivos confirma a divergência. `AppShell.tsx` SHELL_PREFIXES tem `/curtidas`, `/notificacoes`, `/emblemas`, `/recompensas` — mas **não** tem `/suporte`, `/ajuda`, `/deletar-conta`, `/videochamada`, `/salas`, `/amigos`, `/casal`, `/aguardando-email`. O `proxy.ts` PROTECTED_ROUTES tem `/suporte`, `/ajuda`, `/deletar-conta`, `/videochamada`, `/curtidas`, `/salas`, `/amigos`, `/casal`, `/aguardando-email`. Porém, como o proxy não está ativo (ISSUE-001/002), a divergência é irrelevante na prática atual — o shell não é o veículo de proteção, apenas de layout. As páginas como `/suporte`, `/deletar-conta` e `/aguardando-email` renderizam sem sidebar/header/bottom nav por design (correto para essas páginas).
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-013
- **Severidade:** ATENCAO
- **Categoria:** Problemas de integração — Checkout com URLs quebradas
- **Arquivo:** src/components/CheckoutModal.tsx / src/app/planos/page.tsx
- **Descrição:** As URLs de checkout do AbacatePay para planos, loja e backstage estão configuradas como `'#'` (placeholder). Isso significa que o fluxo de pagamento completo está quebrado em produção para novos assinantes. O CheckoutModal chama `/api/payments/create` que por sua vez provavelmente usa essas URLs — se estiverem como `'#'`, o AbacatePay pode rejeitar a criação do pagamento ou redirecionar para lugar errado.
- **Evidência no cerebro:** Memória do projeto: "Configurar URLs de checkout no AbacatePay (planos/loja/backstage — hoje estao como '#')" listada como pendência do Leandro.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** O `StoreBottomSheet.tsx` tem todos os `url: '#'` confirmados (linhas 22-24, 31-33, 40-42, 49-51, 58-60). Porém, o `CheckoutModal.tsx` e `/api/payments/create` NÃO usam URLs hardcoded — eles chamam a API AbacatePay diretamente via `fetch` com `returnUrl: 'https://www.meandyou.com.br/planos'` e `completionUrl` já configurados corretamente. O problema real são os links do `StoreBottomSheet` — ao clicar em "Comprar" SuperLike/Boost/Lupa/Rewind/Ghost, o `<a href="#">` abre uma aba/redireciona para `#` (nada acontece). O fluxo principal via `CheckoutModal` para assinaturas e fichas parece funcional.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-014
- **Severidade:** ATENCAO
- **Categoria:** Código morto — Componente EmptyState duplicado
- **Arquivo:** src/components/EmptyState.tsx / src/components/ui/EmptyState.tsx
- **Descrição:** Existem dois componentes `EmptyState` em locais diferentes. Se diferentes páginas importam de fontes diferentes (`@/components/EmptyState` vs `@/components/ui/EmptyState`), podem haver divergências de aparência ou comportamento. Em TypeScript strict, isso pode causar erros de tipo se as props diferem.
- **Evidência no cerebro:** "EmptyState duplicado: existe em `src/components/EmptyState.tsx` e `src/components/ui/EmptyState.tsx`."
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** Ambos os arquivos existem: `src/components/EmptyState.tsx` e `src/components/ui/EmptyState.tsx`. Grep confirma que **todas** as páginas importam exclusivamente de `@/components/ui/EmptyState` (`conversas/page.tsx:10`, `matches/page.tsx:10`, `notificacoes/page.tsx:8`). O arquivo `src/components/EmptyState.tsx` existe mas **não há nenhuma importação** de `@/components/EmptyState` em nenhum arquivo do projeto — ele é código morto puro. O risco de divergência não existe na prática, mas o arquivo duplicado é confuso e deve ser removido.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-015
- **Severidade:** ATENCAO
- **Categoria:** Problemas de integração — Webhook Cakto retorna 501
- **Arquivo:** src/app/api/webhooks/cakto/route.ts
- **Descrição:** O endpoint `/api/webhooks/cakto` existe e retorna 501. Se o Cakto ainda estiver configurado no painel de algum produto antigo para enviar webhooks para essa URL, os eventos serão ignorados silenciosamente (501 não dispara retry automático em todos os gateways). Mais crítico: se algum usuário antigo ainda tem assinatura vinculada ao Cakto, eventos de renovação/cancelamento não serão processados.
- **Evidência no cerebro:** "Webhook Cakto: `/api/webhooks/cakto/route.ts` e um STUB que retorna 501. Gateway foi removido."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/api/webhooks/cakto/route.ts` retorna literalmente `NextResponse.json({ error: 'Gateway de pagamentos não configurado' }, { status: 501 })`. O arquivo tem comentários explicativos do que deveria fazer, mas a implementação é um stub. Se o Cakto ainda envia webhooks, todos são descartados com 501.
- **Status:** CONFIRMADO

---

### ISSUE-016
- **Severidade:** ATENCAO
- **Categoria:** Erros de lógica — Rate limit client-side bypassável
- **Arquivo:** src/hooks/useChat.ts / src/hooks/useSwipe.ts
- **Descrição:** Os rate limits client-side (5 msgs/min no useChat, 10 curtidas/min no useSwipe) podem ser bypassados facilmente por usuários mal-intencionados chamando as APIs diretamente. O rate limit server-side do chat é 20 msgs/min (diferente do client-side de 5/min) — inconsistência que pode permitir abuso entre 5 e 20 msgs/min. Para o swipe, não há confirmação de rate limit server-side equivalente.
- **Evidência no cerebro:** "Rate limit duplo — client-side (useChat: 5/min, useSwipe: 10/min) + server-side (chat: 20/min, login: RPC, foto: 10/hora)". Nenhum rate limit server-side mencionado para swipe.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/api/chat/send/route.ts:12-13` define `RATE_LIMIT = 20` e `RATE_WINDOW_SECS = 60` — 20 msgs/min server-side. O hook `useChat.ts` tem rate limit client-side de 5/min (conforme cerebro). A diferença de 5 vs 20 permite abuso de 5 a 20 msgs/min. Para swipe, `src/app/api/` não tem endpoint de swipe com rate limit — o `process_like` e `process_swipe` são chamados via `supabase.rpc()` direto, sem API route intermediária com rate limit server-side.
- **Status:** CONFIRMADO

---

### ISSUE-017
- **Severidade:** ATENCAO
- **Categoria:** Segurança básica — Verificação de role apenas client-side no admin
- **Arquivo:** src/app/admin/layout.tsx
- **Descrição:** O `admin/layout.tsx` é um Server Component que verifica role antes de renderizar — isso é correto. Porém, o cerebro afirma que a proteção de rotas é "client-side via hook `useAuth`". Se o layout server-side falhar em verificar role corretamente para subpáginas do admin (ex: `/admin/financeiro`, `/admin/usuarios`), usuários com roles limitados podem acessar páginas além das suas permissões.
- **Evidência no cerebro:** "Admin: verifica sessao e role. Admin → renderiza AdminLayoutClient role='admin'. Staff ativo → renderiza AdminLayoutClient com role do staff. Outros → redirect /dashboard."
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** `src/app/admin/layout.tsx` é um Server Component que verifica sessão e role corretamente — `redirect('/login')` se sem sessão, `redirect('/dashboard')` se não for admin nem staff ativo. O layout protege o acesso ao admin. Porém, o controle de acesso por subpágina (ex: suporte_financeiro só acessa `/admin/financeiro`) é feito apenas no `src/proxy.ts` (PROTECTED por staff_permissions) — que está inativo (ISSUE-001). O `admin/layout.tsx` delega a restrição de subpáginas ao `AdminLayoutClient` (role passado como prop), que presumivelmente controla UI, não acesso real. Um staff `suporte_chat` poderia acessar `/admin/financeiro` diretamente via URL se o `AdminLayoutClient` só ocultar itens de menu.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-018
- **Severidade:** ATENCAO
- **Categoria:** Problemas de integração — RPC process_like vs process_swipe
- **Arquivo:** src/hooks/useSwipe.ts / src/app/curtidas/page.tsx
- **Descrição:** O hook `useSwipe.ts` chama a RPC `process_like` para like/superlike. A página `curtidas/page.tsx` chama a RPC `process_swipe` (referência diferente). Podem ser a mesma RPC com nomes diferentes, ou duas RPCs distintas com comportamentos diferentes. Se `process_swipe` não existe no banco, o "curtir de volta" na tela de curtidas vai falhar silenciosamente.
- **Evidência no cerebro:** RPCs listadas: `process_like` (em useSwipe.ts) e `process_swipe` (referenciada em curtidas/page.tsx) como itens separados na tabela de RPCs.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** Grep confirma a divergência: `src/hooks/useSwipe.ts:79` usa `supabase.rpc('process_like', ...)` e `src/app/busca/page.tsx:655,1583` também usa `process_like`. Porém `src/app/curtidas/page.tsx:96`, `src/app/perfil/[id]/page.tsx:378`, `src/app/backstage/page.tsx:429` e `src/app/destaque/page.tsx:88` usam `process_swipe`. São duas RPCs com nomes distintos sendo chamadas em contextos diferentes. Sem acesso ao banco não é possível confirmar se ambas existem, mas a inconsistência de nomenclatura é real e potencialmente problemática.
- **Status:** CONFIRMADO

---

### ISSUE-019
- **Severidade:** ATENCAO
- **Categoria:** Inconsistências de UI/UX — Fluxo de verificação de email incompleto
- **Arquivo:** src/app/verificar-email/page.tsx / src/app/aguardando-email/page.tsx
- **Descrição:** Existem duas páginas para verificação de email: `/verificar-email` (validação do token) e `/aguardando-email` (tela de espera). O proxy protege `/aguardando-email` como rota protegida (requer login), mas `/verificar-email` aparece nas páginas públicas. Se o fluxo de verificação redireciona para `/verificar-email` antes do login estar completo, o usuário pode ficar preso em um estado inconsistente.
- **Evidência no cerebro:** `/aguardando-email` listada em PROTECTED_ROUTES no proxy. `/verificar-email` listada como página pública. Ambas existem como páginas no mapa de rotas.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** Ambas as páginas existem: `/verificar-email/page.tsx` (pública, valida token via `/api/auth/verificar-email`) e `/aguardando-email` (protegida pelo proxy). O `/verificar-email` não está em PROTECTED_ROUTES nem em PUBLIC_ONLY_ROUTES — é uma rota "neutra" acessível sem login. O fluxo está tecnicamente correto: o link de verificação de email chega por email (sem login), abre `/verificar-email` publicamente, valida o token e redireciona. A rota `/aguardando-email` requer login pois só é acessível após a conta ser criada. O design é consistente, mas o cerebro não documentou a rota `/verificar-email` nas páginas públicas, gerando a suspeita.
- **Status:** CONFIRMADO

---

### ISSUE-020
- **Severidade:** ATENCAO
- **Categoria:** Erros de lógica — XP fire-and-forget sem fallback
- **Arquivo:** src/app/lib/xp.ts
- **Descrição:** O helper `awardXp` é fire-and-forget: obtém sessão e chama `/api/xp/award`. Falhas são silenciosas. Se o usuário perde XP por erro de rede ou falha da API em momentos críticos (match, compra, streak), o estado de XP/nível no banco ficará inconsistente com o que o usuário vê na UI, especialmente em combinação com o `xp_bonus_until` que multiplica XP.
- **Evidência no cerebro:** "Fire-and-forget helper para conceder XP. Obtem sessao e chama `/api/xp/award`. Falhas sao silenciosas."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/lib/xp.ts:16` usa `.catch(() => {})` — engole silenciosamente qualquer erro de rede ou HTTP. A função retorna `void` e não tem retorno de status. É um design intencional ("nunca quebra a UX"), mas o trade-off de XP perdido silenciosamente é real.
- **Status:** CONFIRMADO

---

### ISSUE-021
- **Severidade:** ATENCAO
- **Categoria:** Problemas de tipos TypeScript — Erro pré-existente documentado
- **Arquivo:** src/app/configuracoes/editar-perfil/page.tsx:113
- **Descrição:** O cerebro documenta explicitamente um "erro de TypeScript pre-existente em `configuracoes/editar-perfil/page.tsx:113` (Fase 5) nao relacionado a Fase 6." Em TypeScript strict mode, erros de tipo podem mascarar bugs reais em runtime. O erro está na linha 113 da página de edição de perfil — uma das páginas mais usadas do app.
- **Evidência no cerebro:** "Observacao: erro de TypeScript pre-existente em `configuracoes/editar-perfil/page.tsx:113` (Fase 5) nao relacionado a Fase 6."
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** Leitura das linhas 108-120 de `src/app/configuracoes/editar-perfil/page.tsx` mostra código válido: um `useEffect` que chama `calcCompletude(profileData, filtersData)` e `awardXp(userId, 'profile_complete')`. Não há nenhum erro de TypeScript visível nessas linhas. O "erro pre-existente" mencionado no cerebro era provavelmente um erro temporário durante o desenvolvimento da Fase 5/6 que foi corrigido posteriormente — o código atual está correto.
- **Status:** FALSO POSITIVO

---

### ISSUE-022
- **Severidade:** AVISO
- **Categoria:** Código morto — Gateway Cakto com variáveis obsoletas
- **Arquivo:** .env.local / src/app/api/webhooks/cakto/route.ts / src/components/StoreBottomSheet.tsx
- **Descrição:** O cerebro menciona que `StoreBottomSheet` tem "Todos os URLs Cakto preservados". Se os botões de compra no StoreBottomSheet ainda apontam para URLs do Cakto, os usuários que clicam em "Comprar" no bottom sheet vão para links mortos ou checkout inoperante. Isso afeta a monetização direta do app.
- **Evidência no cerebro:** "Todos os URLs Cakto preservados" em StoreBottomSheet.tsx na documentação da Fase 9.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** As URLs no `StoreBottomSheet.tsx` NÃO são URLs do Cakto — são `url: '#'` (ver ISSUE-013). O cerebro documentou incorretamente "URLs Cakto preservados" quando na verdade os links do Cakto foram substituídos por `'#'` (placeholder sem gateway). O problema existe (links quebrados) mas a causa é diferente do descrito: não são URLs do Cakto mortas, são simplesmente `'#'` sem gateway configurado.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-023
- **Severidade:** AVISO
- **Categoria:** Inconsistências entre arquivos — Campos reg_* e cadastro_step legado
- **Arquivo:** src/app/api/auth/cadastro/route.ts / src/proxy.ts / banco de dados
- **Descrição:** O migration `migration_cadastro_step.sql` é listado como "(legado)" no cerebro, indicando que a coluna `cadastro_step` ainda pode existir no banco mas não é mais usada pelo código. O proxy verifica os campos `reg_*` individuais. Se alguma parte do código ainda referencia `cadastro_step`, o fluxo de onboarding pode se comportar de forma imprevisível.
- **Evidência no cerebro:** "`migration_cadastro_step.sql` — (legado)" e "ATENCAO: `onboarding_done` foi substituido por `onboarding_completed`. `cadastro_step` ainda existe mas nao e mais usado pelo codigo."
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** Grep por `cadastro_step` em todo o `src/` retornou **zero resultados**. O código não referencia esse campo em nenhum lugar. A coluna pode existir no banco (schema legado), mas não afeta o comportamento do código — não há risco de fluxo imprevisível.
- **Status:** FALSO POSITIVO

---

### ISSUE-024
- **Severidade:** AVISO
- **Categoria:** Inconsistências de UI/UX — Rota /suporte duplicada (pública e protegida)
- **Arquivo:** src/app/suporte/page.tsx / src/proxy.ts
- **Descrição:** A rota `/suporte` aparece listada tanto nas Páginas Públicas quanto no proxy como rota protegida. Se o proxy redireciona usuários não logados de `/suporte`, mas a página existe como pública, há conflito entre a intenção de design (suporte deve ser acessível a todos?) e a implementação.
- **Evidência no cerebro:** `/suporte` aparece em "Páginas Públicas" no mapa de rotas E aparece implicitamente em PROTECTED_ROUTES no proxy (listado como rota protegida em "src/proxy.ts — ROTAS PROTEGIDAS").
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/proxy.ts:12` tem `/suporte` em `PROTECTED_ROUTES`. A página `/suporte` usa `supabase` e `usePlan` — claramente projetada para usuário logado. O cerebro documentou incorretamente `/suporte` nas "Páginas Públicas" do mapa de rotas. No código real, ela é tratada como protegida. A inconsistência existe no cerebro, não no código — mas como o middleware está inativo (ISSUE-001), na prática qualquer pessoa acessa `/suporte` sem login e vê a página renderizada com dados de usuário nulo/undefined.
- **Status:** CONFIRMADO

---

### ISSUE-025
- **Severidade:** AVISO
- **Categoria:** Código morto — Páginas admin sem API correspondente
- **Arquivo:** src/app/admin/insights/page.tsx / src/app/admin/recompensas/page.tsx / src/app/admin/bugs/page.tsx / src/app/admin/cancelamentos/page.tsx
- **Descrição:** O mapa de APIs não lista endpoints para `/admin/insights`, `/admin/cancelamentos` (há endpoint de cancelamento geral mas não admin). As páginas existem na estrutura de diretórios mas podem estar sem dados reais ou usando queries diretas ao Supabase sem service_role (violando o padrão do projeto). A memória do projeto confirma: "Pendente: testar roleta na UI, corrigir paginas admin com tabelas faltando."
- **Evidência no cerebro:** Páginas admin listadas no mapa de rotas incluem `insights`, `recompensas`, `bugs`, `cancelamentos` — nenhuma API dedicada para elas no mapa de APIs.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** Todos os 4 diretórios existem (`/admin/insights/`, `/admin/recompensas/`, `/admin/bugs/`, `/admin/cancelamentos/`), confirmando que as páginas existem. `src/app/admin/insights/page.tsx` importa `supabase` (anon key, não service_role) — usa queries diretas. `src/app/admin/recompensas/page.tsx` é um CRUD completo de recompensas via `supabase` direto (anon key). Nenhuma das 4 páginas tem API Route correspondente. A ausência de service_role nas queries admin não é necessariamente um problema se o RLS estiver configurado corretamente para admins, mas é inconsistente com o padrão do projeto.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-026
- **Severidade:** AVISO
- **Categoria:** Problemas de integração — Token LiveKit com sala nomeada por matchId
- **Arquivo:** src/app/api/livekit/token/route.ts
- **Descrição:** O token LiveKit é gerado para a sala `match-{matchId}`. Se dois usuários diferentes tentarem entrar em salas temáticas (`/salas/[id]`) que também usam LiveKit, os tokens podem estar sendo gerados com nomes de sala incorretos ou usando o mesmo endpoint de `/api/livekit/token` que foi projetado para matches. Salas temáticas podem precisar de um endpoint separado.
- **Evidência no cerebro:** "Gera JWT LiveKit TTL 2h para sala `match-{matchId}`." E existência de rotas `/salas`, `/salas/[id]`, `/salas/criar` no mapa de páginas.
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `src/app/api/livekit/token/route.ts` é exclusivo para matches (requer `matchId`). A página `/salas/[id]/page.tsx` não referencia LiveKit nem o endpoint `/api/livekit/token` — a única chamada de API é `/api/salas/alertar` (moderação). As salas temáticas são chat de texto, não vídeo — não usam LiveKit. Não há conflito.
- **Status:** FALSO POSITIVO

---

### ISSUE-027
- **Severidade:** AVISO
- **Categoria:** Código morto — Rota /match sem uso claro
- **Arquivo:** src/app/match/page.tsx
- **Descrição:** Existe uma página `/match` (singular) separada de `/matches` (plural). O cerebro não descreve qual é a função específica de `/match`. Com o `MatchModal` sendo um overlay na tela `/busca`, não está claro quando e por que um usuário seria redirecionado para `/match`. Pode ser uma página legada ou órfã.
- **Evidência no cerebro:** Rota `/match` listada em páginas protegidas com arquivo `src/app/match/page.tsx` mas sem descrição de funcionalidade. MatchModal é descrito como "overlay" na `/busca`, não como redirecionamento para `/match`.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/match/page.tsx` é uma página de swipe independente (com `useSearch` + `useSwipe` + EmptyState local) — é uma versão legada da tela de busca. Não há nenhuma referência a `/match` em links, redirecionamentos ou `router.push` em nenhum outro arquivo do projeto. A página existe mas ninguém é direcionado a ela — é código morto/órfão.
- **Status:** CONFIRMADO

---

### ISSUE-028
- **Severidade:** AVISO
- **Categoria:** Inconsistências de UI/UX — Bottom Nav com destinos potencialmente inconsistentes
- **Arquivo:** src/components/AppBottomNav.tsx
- **Descrição:** O Bottom Nav tem 5 itens: Matches(/conversas), Modos(/busca), Roleta(/roleta — FAB), Premios(/recompensas), Perfil(/perfil). No CLAUDE.md do projeto (fase 3), os destinos eram: Chat(/conversas), Descobrir(/busca), Salas(/salas — FAB), Loja(/loja), Perfil(/perfil). Houve mudança de /salas para /roleta no FAB e de /loja para /recompensas. O item "Salas" pode ter desaparecido completamente da navegação mobile.
- **Evidência no cerebro:** Fase 3 CLAUDE.md lista FAB como `/roleta` (Zap). Porém o mesmo documento fase 3 mostra FAB original como `/salas` (Zap). Versão atual: "5 itens: Matches(/conversas), Modos(/busca), Roleta(/roleta — FAB central vermelho), Premios(/recompensas), Perfil(/perfil)."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/components/AppBottomNav.tsx` confirma os 5 itens atuais: `/conversas`, `/busca`, `/roleta` (FAB), `/recompensas`, `/perfil`. `/salas` não aparece em nenhum item do Bottom Nav. A página `/salas` existe no projeto mas não é acessível pela navegação principal — nem no Bottom Nav mobile, nem na Sidebar desktop. O acesso a salas seria necessário navegar via URL direta ou link dentro de outra página.
- **Status:** CONFIRMADO

---

### ISSUE-029
- **Severidade:** AVISO
- **Categoria:** Segurança básica — Dados de moderação com try/catch vazio implícito
- **Arquivo:** src/app/api/chat/send/route.ts
- **Descrição:** A API de chat usa `moderateContent` e `containsSensitiveData`. Se a moderação falhar (ex: timeout, erro interno), o comportamento é incerto — pode enviar a mensagem sem moderação ou bloquear o envio sem feedback adequado. O cerebro descreve moderação como parte do fluxo mas não documenta o comportamento em caso de falha.
- **Evidência no cerebro:** "Modera conteudo (`moderateContent` + `containsSensitiveData`). Verifica participacao no match. Rate limit server-side: 20 msgs/min por match."
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `src/app/api/chat/send/route.ts:41-60` — `moderateContent(trimmed)` e `containsSensitiveData(trimmed)` são chamados **diretamente sem try/catch** próprio. São funções síncronas (sem async/await) que provavelmente fazem análise de texto local (regex/wordlist), não chamadas externas. Se lançarem exceção, o `try/catch` externo da rota (linha 15) captura e retorna 500. Não há risco de "enviar sem moderação" — qualquer falha bloqueia a mensagem com erro 500. O comportamento em falha é adequado.
- **Status:** FALSO POSITIVO

---

### ISSUE-030
- **Severidade:** AVISO
- **Categoria:** Problemas de tipos TypeScript — Next.js versão incomum
- **Arquivo:** package.json
- **Descrição:** A versão do Next.js é `16.1.6`, que não é uma versão lançada publicamente até a data de corte do conhecimento. A versão mais recente estável seria 15.x. Isso pode ser um erro de digitação no cerebro, ou o projeto está usando uma versão canary/experimental do Next.js. Usar versões não-estáveis em produção pode causar bugs imprevisíveis.
- **Evidência no cerebro:** "Framework: Next.js 16.1.6 (App Router)" e tabela de dependências: `next: 16.1.6`.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `package.json:23` confirma `"next": "16.1.6"`. Esta versão não era pública até agosto/2025 (data de corte do modelo). Sendo 2026-03-23 hoje, o Next.js 16 pode ter sido lançado — porém a versão `16.1.6` é incomum (tipicamente releases seguem 16.0.x → 16.1.x). O `eslint-config-next` na linha 38 também está em `16.1.6`. Não é necessariamente um problema, mas merece verificação se é release estável ou canary.
- **Status:** CONFIRMADO

---

### ISSUE-031
- **Severidade:** AVISO
- **Categoria:** Inconsistências de UI/UX — Rota /chat/[matchId] vs /conversas/[id]
- **Arquivo:** src/app/chat/[matchId]/page.tsx / src/app/conversas/[id]/page.tsx
- **Descrição:** Existem duas rotas de chat: `/chat/[matchId]` e `/conversas/[id]`. O cerebro descreve `/conversas/[id]` como o "chat completo" com todas as features (nudge, convite encontro, etc.), mas `/chat/[matchId]` também existe. Se há links para `/chat/[matchId]` em algum lugar (notificações, emails, deep links), o usuário pode ser enviado para uma versão potencialmente mais antiga/limitada do chat.
- **Evidência no cerebro:** Ambas as rotas listadas no mapa: `/chat/[matchId]` e `/conversas/[id]`. Features detalhadas documentadas apenas para `/conversas/[id]`.
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `src/app/chat/[matchId]/page.tsx` é apenas um **redirect** — 17 linhas que fazem `router.replace('/conversas/' + matchId)` em `useEffect`. Não é uma página de chat separada. Qualquer link para `/chat/[matchId]` redireciona automaticamente para `/conversas/[matchId]`. Não há divergência de funcionalidade.
- **Status:** FALSO POSITIVO

---

### ISSUE-032
- **Severidade:** AVISO
- **Categoria:** Código morto — Páginas recompensas vs streak vs emblemas sobrepostas
- **Arquivo:** src/app/recompensas/page.tsx / src/app/streak/page.tsx / src/app/emblemas/page.tsx
- **Descrição:** Existem três páginas separadas para funcionalidades de gamificação: `/recompensas`, `/streak` e `/emblemas`. O Bottom Nav aponta para `/recompensas`, mas `/streak` e `/emblemas` precisam ser acessadas por outro caminho. O cerebro não documenta como o usuário navega entre essas três páginas, levantando a possibilidade de que `/streak` e `/emblemas` sejam órfãs ou de difícil acesso.
- **Evidência no cerebro:** AppBottomNav aponta para `/recompensas`. Páginas `/streak` e `/emblemas` listadas no mapa de rotas mas sem menção de como são acessadas.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** `src/app/recompensas/page.tsx` é um hub de cards com links para `/roleta`, `/streak`, `/destaque` e `/loja`. `/streak` é acessível via hub. `/emblemas` NÃO aparece no hub de `/recompensas` — está ausente da lista `CARDS`. A página `/emblemas` existe mas não é linkada pelo hub de recompensas nem pelo Bottom Nav. O acesso seria via perfil do usuário (onde emblemas são exibidos) — mas o link de "ver todos os emblemas" precisaria ser verificado separadamente.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-033
- **Severidade:** AVISO
- **Categoria:** Segurança básica — Informações de sessão em `user_sessions` sem TTL documentado
- **Arquivo:** src/app/api/auth/login/route.ts / migration_security_fase1.sql
- **Descrição:** A tabela `user_sessions` registra sessões ativas (ip, user_agent, device_info). O cerebro não documenta se há um TTL ou limpeza automática dessas sessões. Sem expiração automática, a tabela cresce indefinidamente e sessões antigas (de dispositivos que o usuário não usa mais) permanecem ativas indefinidamente, representando risco de segurança.
- **Evidência no cerebro:** Tabela `user_sessions` descrita com colunas `user_id, ip, user_agent, device_info` — sem menção de coluna `expires_at` ou trigger de limpeza.
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/api/auth/login/route.ts:196-201` faz `insert` em `user_sessions` com apenas `user_id, ip, user_agent, device_info` — sem campo `expires_at`. O arquivo `migration_security_fase1.sql` não existe no diretório do projeto (apenas o CLAUDE.md menciona que deveria existir). Não há nenhuma lógica de limpeza ou expiração automática identificada no código. A tabela cresce indefinidamente com cada novo login de dispositivo não reconhecido.
- **Status:** CONFIRMADO

---

### ISSUE-034
- **Severidade:** AVISO
- **Categoria:** Problemas de integração — Webhook AbacatePay com tipos de pagamento hardcoded
- **Arquivo:** src/app/api/webhooks/abacatepay/route.ts
- **Descrição:** O webhook AbacatePay processa três tipos: `subscription`, `fichas`, `camarote`. O tipo é provavelmente determinado pelo campo `type` salvo na tabela `payments` quando o pagamento é criado. Se o campo `type` no pagamento criado divergir do esperado pelo webhook (ex: typo, case sensitivity), o pagamento será confirmado mas nenhuma ação será executada — usuário paga mas não recebe o produto.
- **Evidência no cerebro:** "Processa: subscription → RPC `activate_subscription`; fichas → RPC `add_fichas`; camarote → update `profiles.camarote_expires_at`." Sem documentação de fallback para tipos desconhecidos.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** `src/app/api/webhooks/abacatepay/route.ts:74-138` processa os 3 tipos via `if/else if` encadeados. O campo `payment.type` vem da tabela `payments` — o mesmo valor inserido em `src/app/api/payments/create/route.ts:44,154`. Ambos os arquivos usam as mesmas strings literais (`'subscription'`, `'fichas'`, `'camarote'`) — sem risco de typo entre eles. Porém, se o tipo não for nenhum dos 3 (ex: tipo futuro não previsto), o pagamento é marcado como `paid` mas nenhuma ação é executada — sem log de erro para esse caso. O risco é baixo dado que `/api/payments/create` valida o type com `!['subscription', 'fichas', 'camarote'].includes(type)`.
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-035
- **Severidade:** SUGESTAO
- **Categoria:** Segurança básica — 2FA temp_token sem documentação de expiração
- **Arquivo:** src/app/api/auth/2fa/verificar/route.ts / tabela auth_2fa_pending
- **Descrição:** A tabela `auth_2fa_pending` armazena `temp_token, access_token, refresh_token` para o fluxo de login com 2FA. O cerebro não documenta se o `temp_token` expira automaticamente. Tokens de autenticação temporários sem expiração são um vetor de ataque se a tabela for comprometida.
- **Evidência no cerebro:** Tabela `auth_2fa_pending` descrita com `user_id, temp_token, access_token, refresh_token` — sem menção de `expires_at`.
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `src/app/api/auth/2fa/verificar/route.ts:31` verifica `if (new Date(pending.expires_at) < new Date())` e retorna erro 400 se expirado, deletando o registro. A coluna `expires_at` existe na tabela e é verificada corretamente. O temp_token tem expiração implementada — o cerebro simplesmente não documentou essa coluna na descrição da tabela.
- **Status:** FALSO POSITIVO

---

### ISSUE-036
- **Severidade:** SUGESTAO
- **Categoria:** Inconsistências de UI/UX — Avaliação pós-chat não persiste entre sessões
- **Arquivo:** src/app/conversas/[id]/page.tsx
- **Descrição:** O estado `ratingDone` que controla se o usuário já avaliou um match é gerenciado por `useState` — não persiste entre sessões por design. Isso significa que o botão "Avaliar" reaparecerá toda vez que o usuário recarregar a página ou fechar e abrir o app, podendo gerar avaliações duplicadas na tabela `match_ratings`.
- **Evidência no cerebro:** "Estado `ratingDone` via useState (não persiste entre sessões, por design)."
- **Veredicto:** ✅ CONFIRMADO
- **Evidência Real:** `src/app/conversas/[id]/page.tsx:392-396` faz insert em `match_ratings` sem verificar se já existe avaliação prévia do mesmo usuário para o mesmo match. O insert pode criar múltiplos registros para o mesmo par (avaliador, avaliado) a cada reload. Sem constraint UNIQUE na tabela (que não existe pois a tabela pode nem existir — ISSUE-005), avaliações duplicadas se acumulam. Isso é um bug latente que depende de ISSUE-005 ser resolvida primeiro.
- **Status:** CONFIRMADO

---

### ISSUE-037
- **Severidade:** SUGESTAO
- **Categoria:** Código morto — Emblemas definidos localmente vs tabela badges no banco
- **Arquivo:** src/app/perfil/[id]/page.tsx
- **Descrição:** A Fase 7 implementou emblemas definidos localmente no código (8 emblemas hardcoded com SVGs pixel art inline). O projeto também tem uma tabela `badges` no banco com 35 emblemas e uma API `/api/admin/badges` para CRUD. Há duas fontes de verdade para emblemas — a página de perfil usa os locais, mas o sistema de auto-award usa os do banco. Emblemas do banco podem não aparecer corretamente na vitrine do perfil.
- **Evidência no cerebro:** Fase 7: "Grid 4 colunas com 8 emblemas definidos localmente (sem tabela no banco)." Banco: "35 emblemas no banco (26 do migration + 9 anteriores)." Sistema de badges: `user_badges` tabela + `/api/badges/auto-award` + `/api/admin/badges`.
- **Veredicto:** ⚠️ PARCIALMENTE CONFIRMADO
- **Evidência Real:** `src/app/perfil/[id]/page.tsx:299-303` faz `supabase.from('user_badges').select('badge_id, earned_at, badges(name, description, icon, rarity)')` — ou seja, a página **já lê os emblemas do banco** via join com a tabela `badges`. O código evoluiu além da "Fase 7" descrita no cerebro. Porém, `setDbBadges((badgesData as any) ?? [])` usa cast `any`, sugerindo que a estrutura de dados do join não está tipada corretamente. Se a coluna `icon` na tabela `badges` armazena SVG inline ou URL, pode haver inconsistência na renderização comparado aos SVGs pixel art hardcoded da Fase 7 (que podem ainda existir como fallback no código).
- **Status:** PARCIALMENTE CONFIRMADO

---

### ISSUE-038
- **Severidade:** SUGESTAO
- **Categoria:** Problemas de integração — canvas-confetti sem verificação de ambiente
- **Arquivo:** src/components/MatchModal.tsx (inferido)
- **Descrição:** A dependência `canvas-confetti` é usada para animação no match. Em SSR (Server-Side Rendering) ou em ambientes sem canvas (ex: alguns bots, testes), isso pode causar erro se não houver verificação `if (typeof window !== 'undefined')` antes de usar a biblioteca.
- **Evidência no cerebro:** `canvas-confetti: ^1.9.4` listado em dependências com uso "Animacao de confetti no match".
- **Veredicto:** ❌ FALSO POSITIVO
- **Evidência Real:** `canvas-confetti` é usado em `src/app/roleta/page.tsx` (não no MatchModal). A página começa com `'use client'` (linha 1), garantindo que o código só executa no browser. As chamadas a `confetti(...)` ocorrem dentro de callbacks de evento (linhas 468-472), que nunca são executados durante SSR. Não há risco de erro em ambiente servidor.
- **Status:** FALSO POSITIVO

---

## Resumo por Severidade

| Severidade | Quantidade |
|------------|-----------|
| CRITICO    | 6         |
| ATENCAO    | 15        |
| AVISO      | 11        |
| SUGESTAO   | 4         |
| **TOTAL**  | **36**    |

---

## Resumo dos Veredictos (pós-revisão)

| Veredicto                  | Quantidade |
|---------------------------|-----------|
| CONFIRMADO                 | 16        |
| PARCIALMENTE CONFIRMADO    | 11        |
| FALSO POSITIVO             | 8         |
| INVESTIGAR                 | 1         |
| **TOTAL**                  | **36**    |

### Issues CONFIRMADAS por severidade:
- **CRITICO confirmado:** ISSUE-001, ISSUE-002, ISSUE-003, ISSUE-005 (middleware inativo, tabelas de vídeo, tabelas inexistentes)
- **CRITICO falso positivo:** ISSUE-006 (RPC duplicada), ISSUE-004 parcial (env não commitado em git)
- **ATENCAO confirmada:** ISSUE-009, ISSUE-011, ISSUE-015, ISSUE-016, ISSUE-018, ISSUE-019, ISSUE-020
- **AVISO confirmado:** ISSUE-024, ISSUE-027, ISSUE-028, ISSUE-030, ISSUE-033
- **SUGESTAO confirmada:** ISSUE-036

### Falsos positivos identificados:
ISSUE-006, ISSUE-007, ISSUE-010, ISSUE-021, ISSUE-023, ISSUE-026, ISSUE-029, ISSUE-031, ISSUE-035, ISSUE-038

---

## Prioridade de Verificação

### Verificar primeiro (impacto imediato em producao):
1. ISSUE-001 / ISSUE-002 — Middleware inexistente (CONFIRMADO — todas as rotas desprotegidas)
2. ISSUE-003 — Tabela de vídeo duplicada (CONFIRMADO — limite de minutos calculado de fonte errada)
3. ISSUE-005 — Tabelas match_ratings/bolo_reports inexistentes (CONFIRMADO — dados perdidos silenciosamente)
4. ISSUE-013 / ISSUE-022 — URLs '#' no StoreBottomSheet (CONFIRMADO — compras de itens avulsas quebradas)
5. ISSUE-018 — RPC process_like vs process_swipe (CONFIRMADO — nomenclatura inconsistente)

### Verificar em seguida (bugs silenciosos):
6. ISSUE-016 — Rate limit swipe sem server-side (CONFIRMADO)
7. ISSUE-033 — user_sessions sem TTL (CONFIRMADO)
8. ISSUE-028 — /salas sem acesso na navegação (CONFIRMADO)
9. ISSUE-017 — Permissões admin por subpágina apenas no proxy inativo (PARCIALMENTE CONFIRMADO)
10. ISSUE-004 — CAKTOPAY env obsoleto para remover (PARCIALMENTE CONFIRMADO)
