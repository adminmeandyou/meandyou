# Preferências globais
Sempre responda em português do Brasil.

---

## MeAndYou — Referência do Projeto

> **Branch de trabalho:** `design-v2`
> **Última atualização:** Fase 10 — Onboarding (2026-03-16)

---

### Fase 10 Concluída

#### Onboarding — Cadastro multi-step, GPS/Notif Soft Ask, Verificação, Fricção na Saída

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/cadastro/page.tsx` | Reescrito: 7 telas (1 pergunta/tela), barra de progresso, pills no passo do código de convite. Lógica de validação e Turnstile preservadas. |
| `src/app/onboarding/page.tsx` | Adicionado passo 3 "Permissoes": soft ask para GPS (navigator.geolocation) e notificações (Notification.requestPermission) com botão "Talvez depois". |
| `src/app/verificacao/page.tsx` | Máscara oval SVG com corte (escurece fora do rosto) durante liveness. Tela de sucesso substituída por selo azul animado com ícone de escudo. |
| `src/app/deletar-conta/page.tsx` | 4 etapas: aviso → pausar conta 30d (usa incognito_until) → motivo com pills → confirmar senha. |

#### Detalhes de implementação

**Cadastro multi-step:**
- Steps: email → senha → nome completo → nome exibição → CPF → telefone → código de convite
- Cada step valida antes de avançar (mesmo critério da versão anterior)
- Step 6 usa pills "Tenho um código" / "Não tenho" — Turnstile aparece após escolha
- Enter avança automaticamente

**Soft Ask GPS/Notif:**
- Cards clicáveis que disparam `navigator.geolocation.getCurrentPosition()` e `Notification.requestPermission()`
- Se o usuário recusar, segue sem erro — botão "Talvez depois" pula o passo inteiro
- Estado ativado muda aparência do card (fundo accent + check)

**Máscara oval (verificacao):**
- SVG com `<mask>` para criar corte na forma do rosto
- Cantos em L vermelhos (E11D48) como guias visuais
- Video usa `aspectRatio: 3/4` para manter proporção vertical

**Pause conta:**
- Usa `profiles.incognito_until = now() + 30d` — oculta do feed sem apagar dados
- Redireciona para `/perfil?paused=1`

**Motivo antes de deletar:**
- 6 pills de motivo (opcional — "Pular e continuar" disponível)
- Valor enviado no body do DELETE para registro futuro

---

### Fase 9 Concluída

#### Loja e Monetização

---

### Fase 8 Concluída

#### Segurança Encontros

#### Arquivo modificado

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/conversas/[id]/page.tsx` | Registro privado, check-in bloqueante e Central de Segurança |

#### Features implementadas

**Registro Privado (botão MapPin no action bar):**
- Modal com campos: Com quem (prefixado), Local, Data, Hora
- Salvo em `localStorage` chave `meandyou_meetings` (privado, sem backend)
- Confirmação visual com check verde

**Check-in Pós-Encontro (modal bloqueante):**
- Detecta automaticamente no carregamento da página
- Condição: `meeting.date + 2h < now AND !checkedIn`
- SEM botão X, SEM fechar no backdrop — usuário obrigado a escolher
- "Estou bem" → marca `checkedIn: true` no localStorage
- "Preciso de ajuda — 190" → `tel:190` direto

**Central de Segurança (BottomSheet no botão Shield do header):**
- Botão ShieldAlert substituído por Shield que abre o sheet
- Denunciar → abre `ReportModal` existente
- Desfazer Match → confirmação inline → `matches.update({status:'blocked'})` + redirect
- Modo Invisível → mostra status ativo/data expiry + link `/loja`
- Ligar 190 → `tel:190` direto no sheet

---

### Fase 9 Concluída

#### Loja e Monetização

#### Arquivos criados

| Arquivo | O que faz |
|---------|-----------|
| `src/components/PaywallCard.tsx` | Card de bloqueio reutilizável com cronômetro de reset e botão de upgrade para /planos |
| `src/components/StoreBottomSheet.tsx` | Bottom sheet de microtransações com 3 pacotes por tipo de item (superlike, boost, lupa, rewind, ghost) |
| `src/app/curtidas/page.tsx` | Página "Quem curtiu você" — grid blur pesado + PaywallCard para Essencial; grid real com Like Back para Plus/Black |

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/planos/page.tsx` | Cards horizontais com scroll snap; badge "Melhor Custo-Beneficio" no Plus; tabela comparativa rápida |
| `src/app/loja/page.tsx` | Vitrine redesenhada: uma linha por categoria com botão "Comprar" que abre StoreBottomSheet |
| `src/app/busca/page.tsx` | Tela "curtidas esgotadas" substituída pelo PaywallCard com countdown até meia-noite |
| `src/proxy.ts` | `/curtidas` adicionado às rotas protegidas |
| `src/app/globals.css` | Keyframe `slideUp` para animação do bottom sheet |

#### Features implementadas

**PaywallCard (`src/components/PaywallCard.tsx`):**
- Ícone de cadeado vermelho, título, descrição
- Cronômetro countdown até `resetAt` (ex: meia-noite para curtidas)
- Botão "Fazer upgrade" → `/planos`
- Reutilizável em qualquer página

**StoreBottomSheet (`src/components/StoreBottomSheet.tsx`):**
- Slide up animado com `@keyframes slideUp`
- 5 tipos: `superlike | boost | lupa | rewind | ghost`
- 3 pacotes por tipo com destaque "Popular" no meio
- Todos os URLs Cakto preservados
- Fecha no backdrop, no X ou no Escape

**Planos — cards horizontais:**
- Container `overflow-x-auto snap-x snap-mandatory`
- Cada card: 272px de largura, snap-center
- Plus badge: "Melhor Custo-Beneficio" (era "Mais popular")
- Black com borda dourada
- Tabela comparativa 4 colunas ao final

**Quem Curtiu Você (`/curtidas`):**
- Essencial: 6 silhuetas borradas (blur 16px) + overlay opaco + PaywallCard
- Plus/Black: grid 3 colunas com foto real, badge ⭐ p/ superlike, botão "Curtir" que chama `process_swipe`
- Query: `likes` WHERE `to_user = userId` → join com `public_profiles`
- Estado `likedBack` por ID para feedback visual imediato

---

### Fase 7 Concluída

#### Gamificação

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/perfil/[id]/page.tsx` | StatusPills flutuantes, Vitrine de Emblemas pixel art, Modal Pokédex. Query adicional em `users` para `verified, last_active_at, created_at`. |
| `src/app/conversas/[id]/page.tsx` | Avaliação anônima pós-chat (botão "Avaliar" aparece após 5+ msgs), Detector de Bolo pós-encontro (banner "O encontro?" após aceitar convite). |

#### Features implementadas

**StatusPills (flutuando no card — `perfil/[id]`):**
- 4 tipos: "Online agora" (< 5min, verde), "Ativo hoje" (< 24h, amarelo), "Verificado" (vermelho rose), "Novo no app" (< 7 dias, azul)
- Posição: acima do overlay de nome, bottom-left do hero
- Dados vindos da tabela `users` (colunas: `verified`, `last_active_at`, `created_at`)

**Vitrine de Emblemas + Modal Pokédex (`perfil/[id]`):**
- Grid 4 colunas com 8 emblemas definidos localmente (sem tabela no banco)
- Pixel art SVGs de 8x8 viewBox renderizados em 40x40 com `imageRendering: 'pixelated'`
- Emblemas: Identidade Verificada (raro), Perfil Completo (raro), Galeria Rica (incomum), Bio Detalhada (incomum), Tags Escolhidas (comum), Match Maker (lendario), Conversador (incomum), Muito Popular (lendario)
- Emblemas bloqueados mostram cadeado com opacity 0.25
- Modal Pokédex: pixel art ampliado (scale 1.8), nome, `BadgePill` de raridade, descrição, barra de progresso (para emblemas não desbloqueados)

**Avaliação anônima pós-chat (`conversas/[id]`):**
- Botão "Avaliar" na action bar, aparece apenas após 5+ mensagens e se não avaliou ainda
- 4 opções: "Pessoa incrivel!", "Conversa agradavel", "Nao me interessei", "Fui ignorado(a)"
- Insert silencioso em tabela `match_ratings` (falha silenciosamente se não existir)
- Estado `ratingDone` via useState (não persiste entre sessões, por design)

**Detector de Bolo (`conversas/[id]`):**
- Detecta quando usuário enviou "Aceito!" como resposta a um convite de encontro
- Botão "O encontro?" aparece na action bar com estilo active (accent)
- 4 opções: "Foi incrivel!", "Foi estranho", "Levei um bolo", "Ainda nao aconteceu"
- "Levei um bolo" insere em `bolo_reports` (falha silenciosamente se não existir)

---

### Fase 6 Concluída

#### Hub de Comunicacao

#### Arquivos criados

| Arquivo | Descricao |
|---------|-----------|
| `src/components/MatchModal.tsx` | Tela "Deu Match!" — overlay full-screen com animacoes de entrada das fotos, particulas, CTA "Enviar mensagem" + "Continuar explorando". Importar em `busca/page.tsx` quando houver match. Props: `matchId`, `myPhoto`, `otherPhoto`, `otherName`, `onClose`, `onStartChat`. Haptics (`navigator.vibrate`) no mount. |

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/matches/page.tsx` | Reescrita visual completa — paleta v2. Toggle Ativos/Arquivados. Carrossel horizontal snap para novos matches (cards 130px, avatar 76px). Badges de expiracao calculados por horas desde match: "Novo" (<2h), "Expira hoje" (22-36h), "Ultimo dia" (36-48h). Lista de conversas abaixo do carrossel. Toda logica RPC preservada. |
| `src/app/conversas/page.tsx` | Reescrita visual completa — paleta v2. Toggle Ativos/Arquivados (Arquivados = empty state, sem DB change). Badge de nao lidas vermelho. Toda logica Realtime + RPC `get_my_conversations` preservada. |
| `src/app/conversas/[id]/page.tsx` | Reescrita visual + features novas. Usa `ChatBubble` da Fase 2 para mensagens normais. Barra de acoes: Mic (placeholder), Quebra-gelo, Convite Encontro, Nudge. Toda logica Realtime + rate limit + marcarComoLidas preservada. |

#### Features novas no chat

**Quebra-gelo:**
- Botao na action bar abre painel com 6 sugestoes clicaveis
- Clicar preenche o textarea (usuario ainda pode editar antes de enviar)

**Convite Encontro:**
- Botao abre painel inline com input de texto
- Enviado como mensagem com prefixo `__CONVITE__:texto`
- Renderizado como card interativo com header vermelho e pills de resposta rapida: "Aceito!", "Nao posso", "Em breve", "Me conta mais!"
- Banner amarelo/vermelho aparece no topo do chat quando ha convite recebido nao respondido (banner tem botao "Aceito!" direto)

**Nudge:**
- Enviado como mensagem `__NUDGE__`
- Trigger: `navigator.vibrate([200,100,200])` no sender E no receiver (via Realtime)
- Receiver: shake animation CSS (`nudge-shake` keyframe) na area de mensagens
- Renderizado como separador centrado: "[Nome] deu um nudge!" com icone Zap

**Formatos especiais de mensagem:**
| Token | Formato | Renderizacao |
|-------|---------|--------------|
| Nudge | `__NUDGE__` | Separador centrado com icone Zap |
| Convite | `__CONVITE__:texto` | Card com header + pills de resposta |
| Normal | qualquer outro | `ChatBubble` da Fase 2 |

**Observacao:** erro de TypeScript pre-existente em `configuracoes/editar-perfil/page.tsx:113` (Fase 5) nao relacionado a Fase 6.

---

### Fase 5 Concluída

#### Perfil — visualização e edição

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/app/perfil/[id]/page.tsx` | Reescrita visual completa — paleta v2, Trust Score, Conquistas, Sticky FABs com SwipeButton |
| `src/app/configuracoes/editar-perfil/page.tsx` | Reescrita visual completa — paleta v2, barra de conclusão, Foto Inteligente, pílulas de bio |

#### perfil/[id] — visualização

- **Barra de progresso de fotos** (thin segments no topo do hero)
- **Trust Score** calculado localmente: fotos (8pts cada, máx 48) + bio >30 chars (20pts) + highlight_tags (12pts) + filters presente (10pts) + 5+ fotos (10pts) = máx 100. Exibe barra com fill `var(--accent)`.
- **Conquistas** calculadas localmente: "Perfil completo" (9 fotos), "Galeria rica" (5+), "Bio detalhada" (bio >100), "Tags escolhidas"
- **Stats grid 2-col** com paleta v2
- **TagSection** com pills usando paleta v2
- **Sticky FABs** usando `SwipeButton` da Fase 2 (danger/info/primary)
- Modais emergência e denúncia com paleta v2
- Toda lógica de swipe, RPC, distância, planos preservada

#### editar-perfil — edição

- **Barra de conclusão** no topo: calcula % com fotos (9 slots), bio, highlight_tags, filters. Fill `var(--accent)`.
- **Foto Inteligente**: botão pill que auto-seleciona primeiro slot com foto como `photo_best`. Aparece só com 2+ fotos.
- **Pílulas de sugestão de bio**: 9 sugestões clicáveis que appendam texto à bio (máx 300 chars)
- `Acordeao`, `TagChip`, `BotaoSalvar`, `BloqueioAviso` reestilizados com paleta v2
- Toda lógica de rate-limit (6h tags, 7d campos), upload via `/api/moderar-foto`, save no Supabase preservada

---

### Fase 4 Concluída

#### Tela Principal de Swipe — `/busca`

**Arquivo principal:** `src/app/busca/page.tsx` (reescrita visual completa — TODA lógica preservada)

#### Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/AppHeaderContext.tsx` | Contexto que permite páginas injetarem conteúdo no slot `modeSelector` do AppHeader |

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/components/AppShell.tsx` | Envolvido com `AppHeaderProvider`; usa `AppHeaderConnected` (lê modeSelector do contexto) em vez de `<AppHeader />` direto |
| `src/app/busca/page.tsx` | Reescrita visual completa — veja detalhes abaixo |

#### Como o seletor de modos funciona

1. `AppHeaderContext` expõe `setModeSelector(node: ReactNode)` via hook `useAppHeader()`
2. `AppShell` envolve tudo com `AppHeaderProvider` e usa `AppHeaderConnected` para ler do contexto e repassar ao `AppHeader`
3. A página `/busca` chama `setModeSelector(<ModeSelectorTabs .../>)` em `useEffect` sempre que `viewMode` muda
4. Ao desmontar, a página limpa o slot com `setModeSelector(null)`
5. O componente `ModeSelectorTabs` inclui as 3 tabs + ícone de filtros — tudo injetado no centro do `AppHeader`

#### Modos de visualização (`viewMode`)

| Modo | UI | Rota |
|------|----|----|
| `discovery` | Cards de swipe empilhados + Action Bar | padrão |
| `search` | Grid 2 colunas com perfis do deck atual | clica na tab "Busca" |
| `rooms` | Cards de salas temáticas (placeholder "Em breve") | clica na tab "Salas" |

#### Componentes da Fase 2 utilizados

| Componente | Uso |
|-----------|-----|
| `BottomSheet` | Painel de filtros (substitui painel inline anterior) |
| `Pill` | Seleção de gênero e opções de cada categoria de filtro |
| `SliderRange` | Faixa de idade nos filtros (dual handle) |
| `SwipeButton` | Action bar: Undo(default/sm), Dislike(danger/lg), SuperLike(info/md), Like(primary/lg), Boost(gold/sm) |

#### Funcionalidades visuais novas

- **Barra de progresso de fotos** no topo do card (suporta `photos[]`, fallback para `photo_best`)
- **Toque lateral** no card = navega entre fotos (tap < 8px de movimento)
- **Cards empilhados**: card de trás visível com `scale(0.94)` e `opacity: 0.55`
- **Carimbos** CURTIR (verde), NOPE (vermelho brand), SUPER (azul) ao arrastar
- **Gradiente overlay** dark na base do card com nome/idade/cidade/bio/botão de perfil
- **Filtros em BottomSheet** com Pill, SliderRange e accordion próprio (preserva `openCategories` state)
- **Botão salvar** sticky no bottom do BottomSheet (via `position: sticky; bottom: 0`)
- **Todos os modais** (Match, Upgrade) reestilizados com paleta v2

#### Lógica preservada (intacta)

Todos os states, hooks, funções de API, validação de filtros, triggerSwipe, matchResult, upgradeModal, countdown e contadores de likes/superlikes permanecem exatamente como estavam.

---

### Fase 3 Concluída

#### Arquitetura de Layout

**Abordagem:** `AppShell` client component inserido no root layout, que detecta a rota via `usePathname()` e renderiza o shell somente para rotas protegidas. Zero arquivos de página movidos ou modificados.

#### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/layout.tsx` | Importa e envolve `children` com `<AppShell>` |
| `src/app/globals.css` | Adicionado `#app-main-content::-webkit-scrollbar { display: none }` |

#### Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/AppShell.tsx` | Wrapper condicional: renderiza shell apenas para rotas protegidas |
| `src/components/AppHeader.tsx` | Header mobile: logo + slot de modos (Fase 4) + Bell + Shield |
| `src/components/AppBottomNav.tsx` | Nav inferior mobile: Chat / Descobrir / Salas (FAB) / Loja / Perfil |
| `src/components/AppSidebar.tsx` | Sidebar desktop (72px, icon-only): logo MAY + mesma navegação + logout |

#### Estrutura de navegação implementada

**Bottom Nav (mobile, < 768px):**
| Ícone | Rota |
|-------|------|
| MessageCircle | `/conversas` |
| Compass | `/busca` |
| Zap (FAB central accent) | `/roleta` |
| ShoppingBag | `/loja` |
| User | `/perfil` |

**Sidebar (desktop, >= 768px):**
- Logo "MAY" no topo → `/dashboard`
- Mesma navegação em ícones verticais
- Notificações (Bell) + Segurança (Shield) na base

**Rotas com shell:** `/dashboard`, `/busca`, `/match`, `/matches`, `/chat/*`, `/conversas/*`, `/perfil/*`, `/configuracoes/*`, `/planos`, `/minha-assinatura`, `/loja`, `/destaque`, `/roleta`, `/streak`, `/indicar`, `/notificacoes`, `/backstage`

**Rotas sem shell:** `/` (landing), `/login`, `/cadastro`, `/recuperar-senha`, `/nova-senha`, `/onboarding`, `/verificacao`, `/banido`, `/videochamada/*`, `/deletar-conta`, `/confirmar-email`, `/admin/*`, `/privacidade`, `/termos`, `/ajuda`, etc.

**Layout desktop:**
- `lg+`: Sidebar (72px) + frame app (max 430px) + painel direito reservado (280-400px, para Fase 4+)
- `md`: Sidebar (72px) + frame app (max 430px), sem painel direito

**Container mobile-first:** `max-width: 430px, height: 100vh, overflow: hidden, flexDirection: column`
**Fundo externo:** `radial-gradient(ellipse, rgba(225,29,72,0.09), #08090E)`

#### Slot reservado para Fase 4
- `AppHeader` aceita prop `modeSelector?: React.ReactNode` (espaço central do header)
- Painel direito do desktop: `div` vazio aguardando Chat/Matches da Fase 4

---

### Fase 2 Concluída

#### Tokens registrados no tailwind.config (via `@theme` em globals.css)

| Tipo | Tokens |
|------|--------|
| Cores | `brand-primary` (#E11D48), `brand-secondary` (#F43F5E), `brand-bg` (#08090E), `brand-surface` (#0F1117), `brand-surface2` (#13161F), `brand-danger` (#E11D48), `brand-success` (#10b981), `brand-gold` (#F59E0B), `brand-text` (#F8F9FA) |
| Fontes | `fraunces` (Fraunces serif), `jakarta` (Plus Jakarta Sans) |
| Border Radius | `input` (12px), `btn` (12px), `card` (16px), `card-sm` (10px), `pill` (100px) |
| Sombras | `accent`, `card`, `cta` |
| Spacing | Usa escala padrão Tailwind (base 4px) |

Classes utilitárias adicionadas: `.ui-skeleton`, `.ui-spinner`, `.ui-range-input`

Keyframes: `ui-spin`, `ui-pulse`, `ui-slide-up`, `ui-fade-in`, `ui-toast-in`

#### Componentes criados em `src/components/ui/`

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `Pill` | `src/components/ui/Pill.tsx` | Chip/tag clicável com estados (selected, hover, active, disabled, loading) |
| `SliderRange` | `src/components/ui/SliderRange.tsx` | Slider duplo de intervalo (idade/distância) |
| `ToggleSwitch` | `src/components/ui/ToggleSwitch.tsx` | Toggle substituto de checkbox, com label e descrição |
| `BottomSheet` | `src/components/ui/BottomSheet.tsx` | Painel sobe da base com portal, blur e handle |
| `Modal` | `src/components/ui/Modal.tsx` | Pop-up centralizado com portal, ESC e backdrop blur |
| `FAB` | `src/components/ui/FAB.tsx` | Botão de ação flutuante circular (primary/surface) |
| `SkeletonLoader` | `src/components/ui/SkeletonLoader.tsx` | Silhueta piscante (text/avatar/card/rect) |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Ícone + título + descrição + CTA opcional |
| `Toast` | `src/components/ui/Toast.tsx` | Banner flutuante (success/error/info/warning) auto-dismiss |
| `BadgePill` | `src/components/ui/BadgePill.tsx` | Tag de raridade: Comum/Incomum/Raro/Lendário |
| `Accordion` | `src/components/ui/Accordion.tsx` | Sanfona para filtros, suporte a múltiplos abertos |
| `ChatBubble` | `src/components/ui/ChatBubble.tsx` | Balão enviado/recebido com status (sending/sent/delivered/read) |
| `SwipeButton` | `src/components/ui/SwipeButton.tsx` | Botão circular da action bar (default/danger/primary/gold/info) |
| `ProfileCard` | `src/components/ui/ProfileCard.tsx` | Card de swipe 3:4 com fotos navegáveis, verified, tags |
| `MatchCard` | `src/components/ui/MatchCard.tsx` | Avatar redondo para fila de matches com badge de não lidas |

**Regra de ícones:** `strokeWidth={1.5}` em todos os `lucide-react`. Zero emojis em ações/menus.

---

### Fase 1 Concluída

**Observação:** As tarefas 1.1 (emails de segurança) e 1.4 (rate limiting server-side) já estavam implementadas no `auth/login/route.ts` antes desta fase.

#### Arquivos criados

| Arquivo | Tarefa | Descrição |
|---------|--------|-----------|
| `migration_security_fase1.sql` | 1.2/1.6/1.7 | Migration SQL: tabelas `email_change_tokens`, `auth_2fa_pending`, `user_sessions` + colunas TOTP na tabela `users` |
| `src/app/api/auth/alterar-email/route.ts` | 1.2 | API: gera token 30min, salva no banco, envia email de confirmação |
| `src/app/api/auth/confirmar-email/route.ts` | 1.2 | API: valida token, atualiza email no Supabase Auth, marca token como usado |
| `src/app/confirmar-email/page.tsx` | 1.2 | Página de confirmação de alteração de email (rota pública) |
| `src/app/configuracoes/alterar-email/page.tsx` | 1.2 | Tela de formulário para solicitar alteração de email |
| `src/app/api/auth/2fa/gerar/route.ts` | 1.6 | API: gera secret TOTP + QR code, salva secret criptografado |
| `src/app/api/auth/2fa/ativar/route.ts` | 1.6 | API: valida código TOTP, ativa 2FA, retorna 8 códigos de backup |
| `src/app/api/auth/2fa/desativar/route.ts` | 1.6 | API: valida código TOTP para desativar 2FA |
| `src/app/api/auth/2fa/verificar/route.ts` | 1.6 | API: step 2 do login com 2FA (consome temp_token + código TOTP) |
| `src/app/configuracoes/2fa/page.tsx` | 1.6 | Tela de ativação/desativação do 2FA com QR code e códigos de backup |
| `src/app/api/auth/sessoes/route.ts` | 1.7 | API: lista sessões ativas do usuário |
| `src/app/api/auth/sessoes/[id]/route.ts` | 1.7 | API: encerra sessão específica |
| `src/app/configuracoes/sessoes/page.tsx` | 1.7 | Tela de gestão de sessões ativas com botão de encerramento remoto |

#### Arquivos modificados

| Arquivo | Tarefa | O que mudou |
|---------|--------|-------------|
| `src/app/api/auth/deletar-conta/route.ts` | 1.3 | Adicionado `sendDataDeletionConfirmedEmail` junto com `sendAccountDeletedEmail` |
| `src/app/api/auth/login/route.ts` | 1.6/1.7 | Suporte a 2FA (retorna `requires_2fa + temp_token` se ativo), registra sessão em `user_sessions` |
| `src/app/login/page.tsx` | 1.6 | UI do step 2 do login com 2FA (input de código + chamada para `/api/auth/2fa/verificar`) |
| `src/app/perfil/page.tsx` | 1.5 | Link "Deletar minha conta" adicionado abaixo dos botões de navegação |
| `src/app/privacidade/page.tsx` | 1.5 | Bloco LGPD com link para `/deletar-conta` adicionado antes do footer |
| `src/app/configuracoes/page.tsx` | 1.6/1.7 | Nova seção "Segurança" com links para 2FA, Sessões e Alterar email |

#### Novas dependências instaladas

| Lib | Versão | Uso |
|-----|--------|-----|
| `otplib` | ^13.3.0 | Geração e validação de tokens TOTP |
| `qrcode` | ^1.5.4 | Geração de QR codes para 2FA |
| `@types/qrcode` | — | Tipos TypeScript para qrcode |

#### Importante — Migration obrigatória

Antes de usar as funcionalidades da Fase 1, rodar `migration_security_fase1.sql` no Supabase SQL Editor. Isso cria:
- Tabela `email_change_tokens` (fluxo de alteração de email)
- Tabela `auth_2fa_pending` (login com 2FA)
- Tabela `user_sessions` (gestão de sessões)
- Colunas `totp_secret`, `totp_enabled`, `totp_backup_codes` em `users`
- Coluna `known_ua_hashes` em `users` (caso não exista)

---

### Design Tokens (extraídos da Landing Page + globals.css)

#### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | `#08090E` | Fundo geral da página |
| `--bg-card` | `#0F1117` | Cards, modais, painéis |
| `--bg-card2` | `#13161F` | Cards secundários |
| `--accent` | `#E11D48` | Cor primária (vermelho rose) — botões, destaques |
| `--accent-dark` | `#be123c` | Hover do accent |
| `--accent-soft` | `rgba(225,29,72,0.10)` | Fundo de badges, tags |
| `--accent-border` | `rgba(225,29,72,0.25)` | Bordas com cor |
| `--red` / `--red-2` | `#E11D48` / `#F43F5E` | Vermelho, variante mais viva |
| `--gold` | `#F59E0B` | Exclusivo VIP/Black |
| `--gold-light` | `rgba(245,158,11,0.10)` | Fundo de elementos Gold |
| `--gold-border` | `rgba(245,158,11,0.25)` | Bordas Gold |
| `--text` | `#F8F9FA` | Texto principal |
| `--muted` | `rgba(248,249,250,0.50)` | Texto secundário |
| `--muted-2` | `rgba(248,249,250,0.30)` | Texto terciário/dim |
| `--border` | `rgba(255,255,255,0.07)` | Bordas padrão |
| `--border-soft` | `rgba(255,255,255,0.04)` | Bordas muito sutis |

**REGRA CRÍTICA:** Botão vermelho (`--accent`) = texto sempre BRANCO `#fff`. Nunca texto escuro.

#### Fontes

| Variável | Família | Pesos | Uso |
|----------|---------|-------|-----|
| `--font-fraunces` | Fraunces (serif) | 700 | Títulos h1/h2/h3, logo |
| `--font-jakarta` | Plus Jakarta Sans (sans-serif) | 400, 500, 600, 700 | Corpo, botões, nav |

Declaradas via `next/font/google` em `src/app/layout.tsx` como CSS variables.

#### Bordas (border-radius)

| Contexto | Valor |
|----------|-------|
| Inputs | `12px` |
| Botões principais | `12px` |
| Cards grandes | `16px` |
| Nav flutuante | `16px` |
| Cards pequenos / botões menores | `10px` |
| Badges / chips | `100px` (pill) |
| Phone mockup | `38px` |

#### Sombras

| Token | Valor |
|-------|-------|
| `--shadow-accent` | `0 20px 60px rgba(225,29,72,0.18)` |
| `--shadow-card` | `0 8px 32px rgba(0,0,0,0.4)` |
| `--shadow` | `0 4px 24px rgba(225,29,72,0.15)` |
| Botão CTA hover | `0 12px 40px rgba(225,29,72,0.45)` |

#### Gradientes

Usados apenas em placeholders de cards de perfil (não há gradientes estruturais na UI):
- `linear-gradient(160deg,#1a0a14 0%,#3d1530 50%,#2a0e24 100%)`
- `linear-gradient(160deg,#0a1020 0%,#1a2a4a 50%,#0d1830 100%)`

---

### Mapa de Rotas

#### Páginas Públicas

| Rota | Arquivo |
|------|---------|
| `/` | `src/app/page.tsx` (Landing Page — 52k tokens, muito grande) |
| `/login` | `src/app/login/page.tsx` |
| `/cadastro` | `src/app/cadastro/page.tsx` |
| `/recuperar-senha` | `src/app/recuperar-senha/page.tsx` |
| `/nova-senha` | `src/app/nova-senha/page.tsx` |
| `/privacidade` | `src/app/privacidade/page.tsx` |
| `/termos` | `src/app/termos/page.tsx` |
| `/ajuda` | `src/app/ajuda/page.tsx` |
| `/fale-conosco` | `src/app/fale-conosco/page.tsx` |
| `/suporte` | `src/app/suporte/page.tsx` |
| `/obrigado` | `src/app/obrigado/page.tsx` |
| `/banido` | `src/app/banido/page.tsx` |

#### Páginas Protegidas (usuário logado)

| Rota | Arquivo |
|------|---------|
| `/onboarding` | `src/app/onboarding/page.tsx` |
| `/dashboard` | `src/app/dashboard/page.tsx` |
| `/busca` | `src/app/busca/page.tsx` |
| `/match` | `src/app/match/page.tsx` |
| `/matches` | `src/app/matches/page.tsx` |
| `/chat/[matchId]` | `src/app/chat/[matchId]/page.tsx` |
| `/conversas` | `src/app/conversas/page.tsx` |
| `/conversas/[id]` | `src/app/conversas/[id]/page.tsx` |
| `/perfil` | `src/app/perfil/page.tsx` |
| `/perfil/[id]` | `src/app/perfil/[id]/page.tsx` |
| `/configuracoes` | `src/app/configuracoes/page.tsx` |
| `/configuracoes/editar-perfil` | `src/app/configuracoes/editar-perfil/page.tsx` |
| `/planos` | `src/app/planos/page.tsx` |
| `/minha-assinatura` | `src/app/minha-assinatura/page.tsx` |
| `/loja` | `src/app/loja/page.tsx` |
| `/destaque` | `src/app/destaque/page.tsx` |
| `/roleta` | `src/app/roleta/page.tsx` |
| `/streak` | `src/app/streak/page.tsx` |
| `/verificacao` | `src/app/verificacao/page.tsx` |
| `/videochamada/[matchId]` | `src/app/videochamada/[matchId]/page.tsx` |
| `/indicar` | `src/app/indicar/page.tsx` |
| `/notificacoes` | `src/app/notificacoes/page.tsx` |
| `/backstage` | `src/app/backstage/page.tsx` (exclusivo plano Black) |
| `/deletar-conta` | `src/app/deletar-conta/page.tsx` |

#### Páginas Admin

| Rota | Arquivo |
|------|---------|
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/usuarios` | `src/app/admin/usuarios/page.tsx` |
| `/admin/financeiro` | `src/app/admin/financeiro/page.tsx` |
| `/admin/denuncias` | `src/app/admin/denuncias/page.tsx` |
| `/admin/seguranca` | `src/app/admin/seguranca/page.tsx` |
| `/admin/marketing` | `src/app/admin/marketing/page.tsx` |
| `/admin/cancelamentos` | `src/app/admin/cancelamentos/page.tsx` |
| `/admin/equipe` | `src/app/admin/equipe/page.tsx` |

#### APIs (src/app/api)

| Endpoint | Arquivo |
|----------|---------|
| `POST /api/auth/login` | `auth/login/route.ts` |
| `POST /api/auth/cadastro` | `auth/cadastro/route.ts` |
| `POST /api/auth/logout` | `auth/logout/route.ts` |
| `POST /api/auth/recuperar-senha` | `auth/recuperar-senha/route.ts` |
| `POST /api/auth/nova-senha` | `auth/nova-senha/route.ts` |
| `DELETE /api/auth/deletar-conta` | `auth/deletar-conta/route.ts` |
| `POST /api/assinatura/cancelar` | `assinatura/cancelar/route.ts` |
| `POST /api/boosts/activate` | `boosts/activate/route.ts` |
| `POST /api/boosts/notify-expired` | `boosts/notify-expired/route.ts` |
| `POST /api/chat/send` | `chat/send/route.ts` |
| `POST /api/confirmar-verificacao` | `confirmar-verificacao/route.ts` |
| `POST /api/contato` | `contato/route.ts` |
| `POST /api/denuncias` | `denuncias/route.ts` |
| `POST /api/enviar-verificacao` | `enviar-verificacao/route.ts` |
| `GET/POST /api/livekit/token` | `livekit/token/route.ts` |
| `POST /api/matches/notify` | `matches/notify/route.ts` |
| `POST /api/moderar-foto` | `moderar-foto/route.ts` |
| `GET /api/notificacoes` | `notificacoes/route.ts` |
| `POST /api/push/send` | `push/send/route.ts` |
| `POST /api/push/subscribe` | `push/subscribe/route.ts` |
| `POST /api/suporte` | `suporte/route.ts` |
| `POST /api/upload-verificacao` | `upload-verificacao/route.ts` |
| `GET /api/validar-token` | `validar-token/route.ts` |
| `POST /api/webhooks/cakto` | `webhooks/cakto/route.ts` |
| `POST /api/webhooks/livekit` | `webhooks/livekit/route.ts` |

#### Middleware

**Não existe `middleware.ts` no projeto.** A proteção de rotas é feita **client-side** via hook `useAuth` + redirecionamento. O admin verifica role na tabela `profiles` e `staff_members` no Supabase.

---

### Mapa de Componentes

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `ReportModal` | `src/components/ReportModal.tsx` | Modal de denúncia de usuário |
| `VideoCall` | `src/components/VideoCall.tsx` | Componente de videochamada via LiveKit |
| `FaqItem` | inline em `src/app/page.tsx` | Accordion de FAQ (definido dentro da Landing Page) |

---

### Lógica Crítica (NÃO MEXER)

#### Hooks customizados

| Hook | Arquivo | Uso principal |
|------|---------|---------------|
| `useAuth` | `src/hooks/useAuth.ts` | Sessão do usuário. Usado em quase todas as páginas protegidas. Atualiza `last_active_at` no Supabase no login. |
| `useChat` | `src/hooks/useChat.ts` | Mensagens em tempo real. Rate limit: 5 msgs/min. MAX_CHARS=500. Campo correto: `read` (não `read_at`). |
| `usePlan` | `src/hooks/usePlan.ts` | Plano atual e limites (likes/dia, superlikes, lupas etc). |
| `useSearch` | `src/hooks/useSearch.ts` | Busca de perfis com filtros (distância, idade, gênero). |
| `useSwipe` | `src/hooks/useSwipe.ts` | Ações like/dislike/superlike. Rate limit: 10 curtidas/min. |

#### Decisões críticas de autenticação

- **Login redirect:** usar `window.location.href` (não `router.push`) — evita race condition com cookies
- **Email domain:** hardcoded `https://www.meandyou.com.br` em `email.ts` — nunca usar env var
- **Supabase em pages:** `import { supabase } from '@/app/lib/supabase'`
- **Supabase em API routes:** `createClient` com `SERVICE_ROLE_KEY` direto (via `src/lib/supabase/server.ts`)

#### States e animações da Landing Page (page.tsx)

Classes CSS que são gatilhos JS (IntersectionObserver):
- `.lp-anim` → recebe `.lp-visible` quando entra na tela (scroll reveal)
- `.lp-how-step` → recebe `.visible` em sequência (stagger 110ms)
- `.lp-ftag` → toggle entre `.neu` / `.inc` / `.exc` (filtros interativos)

States principais da Landing Page:
- `checking` — verifica sessão do usuário (redireciona para /dashboard se logado)
- `navVisible` — controla visibilidade da nav ao scroll
- `menuAberto` — mobile menu
- `currentCard` / `swipeDir` — card deck simulado
- `installPrompt` — PWA install (Android/Chrome)
- `notifList` — notificações animadas falsas (social proof)
- `userCity` — geolocalização via ipapi.co (fallback: cidade aleatória)

---

### Funções de Email (src/app/lib/email.ts)

Todas as 40 funções são `export async`. Todas chamam o helper interno `enviar()` que silencia erros (try/catch sem propagação).

#### Helpers internos (não exportados)

| Função | Descrição |
|--------|-----------|
| `enviar()` | Wrapper Resend com try/catch — falhas são apenas logadas |
| `base()` | Template HTML base (layout do email) |
| `btn()` | Botão CTA |
| `heading()` | Título do email |
| `sub()` | Subtítulo/parágrafo |
| `divider()` | Separador horizontal |
| `badge()` | Badge colorido |
| `note()` | Texto pequeno de rodapé |
| `infoBox()` | Caixa com lista de itens |
| `alertBox()` | Caixa de alerta |

#### Funções exportadas por categoria

**Conta (1-5):** `sendWelcomeEmail`, `sendVerificationEmail`, `sendPasswordResetEmail`, `sendPasswordChangedEmail`, `sendEmailChangeConfirmEmail`

**Segurança (6-9):** `sendNewDeviceLoginEmail`, `sendSuspiciousLoginEmail`, `sendAccountBlockedEmail`, `sendAccountDeletedEmail`

**Pagamento (10-13):** `sendPlanActivatedEmail`, `sendReceiptEmail`, `sendRenewalReminderEmail`, `sendPaymentFailedEmail`

**Legal/LGPD (14-16):** `sendTermsUpdatedEmail`, `sendPrivacyUpdatedEmail`, `sendDataDeletionConfirmedEmail`

**Onboarding (17-18):** `sendOnboardingTipsEmail`, `sendIncompleteProfileEmail`

**Suporte (19-20):** `sendSupportTicketOpenedEmail`, `sendSupportTicketResolvedEmail`

**Verificação/Fotos (21-23):** `sendVerificationApprovedEmail`, `sendVerificationRejectedEmail`, `sendPhotoRejectedEmail`

**Engajamento (24-28):** `sendNewMatchEmail`, `sendNewLikeEmail`, `sendProfileViewEmail`, `sendConversationStartedEmail`, `sendUnreadMessageEmail`

**Reativação (29-33):** `sendNewProfilesNearbyEmail`, `sendCompatibleProfilesEmail`, `sendReactivationLikesEmail`, `sendReactivationStreakEmail`, `sendReactivationMatchesEmail`

**Gamificação (34-35):** `sendTicketAvailableEmail`, `sendRewardReceivedEmail`

**Monetização (36-38):** `sendBoostExpiredEmail`, `sendUpgradePromptEmail`, `sendSubscriptionPromoEmail`

**Genéricos (39-40):** `sendMarketingEmail`, `sendInstitutionalEmail`

**Código morto:** Nenhuma função identificada como morta — todas são potencialmente chamadas por API routes. Funções de reativação/engajamento podem ser chamadas por cron jobs externos.

---

### Dependências Relevantes

| Lib | Versão | Uso |
|-----|--------|-----|
| `next` | 16.1.6 | Framework |
| `react` | 19.2.3 | UI |
| `@supabase/supabase-js` | ^2.98.0 | Auth + DB |
| `@supabase/ssr` | ^0.9.0 | Supabase em server components |
| `@livekit/components-react` | ^2.9.20 | UI de videochamada |
| `@livekit/components-styles` | ^1.2.0 | Estilos LiveKit |
| `livekit-client` | ^2.17.2 | Client LiveKit |
| `livekit-server-sdk` | ^2.15.0 | Server LiveKit (token) |
| `lucide-react` | ^0.577.0 | Ícones (usado no Admin) |
| `resend` | ^6.9.3 | Envio de emails |
| `web-push` | ^3.6.7 | Push notifications |
| `tailwindcss` | ^4 | CSS (mas UI usa inline styles e CSS vars) |

**Importante:** A maior parte da UI usa **inline styles + CSS variables** (não classes Tailwind). O Tailwind v4 está instalado mas só gera os utilitários `font-fraunces` e `font-jakarta` via `@layer utilities` em `globals.css`.

---

### Estrutura de Pastas

```
meandyou-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing Page (pública, 52k tokens)
│   │   ├── layout.tsx            ← Root layout (fontes, metadata, PWA)
│   │   ├── globals.css           ← CSS vars + base styles
│   │   ├── lib/
│   │   │   ├── email.ts          ← 40 funções de email (Resend)
│   │   │   └── supabase.ts       ← Client Supabase (browser)
│   │   ├── api/                  ← 25 route handlers
│   │   ├── admin/                ← Painel admin (layout próprio)
│   │   └── [demais páginas]/
│   ├── components/
│   │   ├── ReportModal.tsx
│   │   └── VideoCall.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── usePlan.ts
│   │   ├── useSearch.ts
│   │   └── useSwipe.ts
│   ├── lib/
│   │   └── supabase/
│   │       └── server.ts         ← Supabase server (SERVICE_ROLE_KEY)
│   └── proxy.ts
├── public/                       ← Assets estáticos (logo.png, fotos de perfil)
├── package.json
├── next.config.ts
└── postcss.config.mjs
```

---

### Layouts

| Layout | Arquivo | Aplica-se a |
|--------|---------|-------------|
| Root | `src/app/layout.tsx` | Todo o app (fontes, metadata, PWA, service worker) |
| Admin | `src/app/admin/layout.tsx` | Todas as páginas `/admin/*` (sidebar + controle de roles) |

O app **não tem middleware.ts** — sem proteção server-side de rotas.
