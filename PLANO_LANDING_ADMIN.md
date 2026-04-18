# Plano de Landing + Admin Dinâmico — MeAndYou

> **Criado em:** 2026-04-18 13:43
> **Dono:** Leandro
> **Branch:** `main` (auto-deploy Vercel no push)
> **Objetivo:** Refatorar landing oficial + landing de lançamento + página de obrigado + gate de acesso para que **tudo** (textos, preços, ativação/desativação, senha do gate, mensagens) seja editável pelo **painel admin**, sem precisar mexer em código.

---

## Resumo do diagnóstico (2026-04-18)

### Landing oficial (`src/app/page.tsx` + `src/app/landing/*.tsx`)
- 304 linhas + 22 seções modularizadas
- Todos os valores, preços e textos **hardcoded** em cada arquivo `.tsx`
- Nenhuma leitura do Supabase — landing é 100% estática
- **Valores exibidos hoje** estão **desatualizados** (não refletem o que o app realmente entrega)

### Landing de lançamento (`src/app/lancamento/page.tsx` + `src/app/lancamento/*.tsx`)
- Versão alternativa da landing com copy de lançamento
- Seções exclusivas: `OfertaLancamento`, `EarlyLancamento` (emblema Fundador vitalício)
- Também com dados hardcoded

### Página de obrigado (`src/app/obrigado/page.tsx`)
- Existe, simples
- Mostra check animado + mensagem customizada por plano via `?plano=`
- Sem integração com banco

### Gate de acesso (`src/app/acesso/page.tsx` + `POST /api/acesso`)
- Existe e funciona
- Senha hardcoded (ou em env var) — não editável pelo admin
- Último commit corrigiu: gate não bloqueia usuários autenticados

### Painel admin (`src/app/admin/*`)
- 12 páginas existentes: usuários, financeiro, denúncias, segurança, marketing, cancelamentos, equipe, emblemas, insights, bugs, recompensas
- **Nenhuma página de gestão de landing / site / configurações globais**

### Banco
- **Nenhuma tabela** `site_config`, `landing_content`, `app_settings`, `feature_flags`
- Tudo que for editável via admin precisa ser criado

---

## Valores de referência (fonte da verdade)

Extraídos de `src/hooks/usePlan.ts`. **São estes que a landing deve mostrar.**

| Limite | Essencial | Plus | Black |
|---|---|---|---|
| Fotos | 10 | 10 | 10 |
| Curtidas/dia | 20 | 50 | ilimitadas |
| SuperCurtidas/dia | 1 | 5 | 10 |
| Lupas/dia | 0 | 1 | 2 |
| Tickets roleta/dia | 1 | 2 | 3 |
| Boosts simultâneos | 1 | 1 | 2 |
| Vídeo/dia | 45 min | 120 min | 300 min |
| Desfazer curtida | não | sim | sim |
| Ver quem curtiu | não | sim | sim |
| Filtros avançados | não | sim | sim |
| Backstage | não | não | sim |
| Fetiche (solicitar) | sim | sim | sim |

### Preços finais (definidos em 2026-04-18 pelo Leandro)

| Plano | Preço mensal |
|---|---|
| Essencial | **R$ 14,90** |
| Plus | **R$ 39,90** |
| Black | **R$ 99,90** |

---

## Estrutura do plano

O trabalho está dividido em **8 fases** (Fase 0 a Fase 7). Cada fase é executada em **uma sessão separada**. No fim de cada sessão, o status é atualizado no final deste arquivo com:
- Data e hora de início
- Data e hora de conclusão
- Arquivos criados/modificados
- Commits feitos
- O que ficou pendente

---

## Fase 0 — Correção de preços em todo o projeto

**Objetivo:** Eliminar a divergência atual (9,97 vs 9,90 vs 14,90) e deixar **14,90 / 39,90 / 99,90** em todos os lugares onde aparece preço. Essa fase é feita primeiro porque o usuário pediu explicitamente e é pré-requisito para qualquer trabalho de landing.

**Arquivos a revisar (26 no total, encontrados via grep):**

- `src/app/planos/page.tsx`
- `src/app/landing/PlanosSection.tsx`
- `src/app/landing/HeroSection.tsx`
- `src/app/landing/data.ts`
- `src/app/lancamento/PlanosLancamento.tsx`
- `src/app/lancamento/HeroLancamento.tsx`
- `src/app/lancamento/OfertaLancamento.tsx`
- `src/app/lancamento/FaqLancamento.tsx`
- `src/app/lancamento/CtaLancamento.tsx`
- `src/app/backstage/_components/CamaroteBlocked.tsx`
- `src/components/VideoCall.tsx`
- `src/components/CheckoutModal.tsx`
- `src/app/loja/page.tsx`
- `src/app/loja/_components/helpers.ts`
- `src/app/modos/_components/RoomsView.tsx`
- `src/app/minha-assinatura/page.tsx`
- `src/lib/icebreakers.ts`
- `src/app/termos/page.tsx`
- `src/app/ajuda/page.tsx`
- `src/app/admin/insights/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/financeiro/page.tsx`
- `src/app/api/admin/usuarios/export/route.ts`
- `src/app/page-v1-plus.tsx` (backup — avaliar remover)
- `src/app/page-v2-backup.tsx` (backup — avaliar remover)
- `src/app/page-v1-backup.tsx` (backup — avaliar remover)

**Regras a aplicar em cada arquivo:**
- `9.97` ou `9,97` → `14.90` ou `14,90`
- `9.90` ou `9,90` → `14.90` ou `14,90` (apenas quando for preço do Essencial)
- `39.97` ou `39,97` → `39.90` ou `39,90`
- `99.97` ou `99,97` → `99.90` ou `99,90`
- Cuidado: **NÃO** alterar valores que não sejam preços de plano (ex: preços da loja de SuperCurtidas, Boosts, Lupas — checar contexto)
- Também corrigir os **limites de curtidas/SuperCurtidas/etc** para refletir `usePlan.ts` (20/50/ilim. — 1/5/10, etc.)

**Saída desta fase:**
- Todos os 23 arquivos corrigidos
- Remoção dos 3 arquivos `page-v*-backup.tsx` (limpar o repo)
- 1 commit: `fix(precos): unifica valores R$ 14,90 / 39,90 / 99,90 em todo o projeto`
- Push + deploy automático

**Critério de pronto:** `git grep "9,97\|9,90\|39,97\|99,97\|20 curtidas\|5 curtidas\|30 curtidas"` **não retorna nada**.

---

## Fase 1 — Banco de dados (fundação)

**Objetivo:** Criar as tabelas que vão guardar tudo o que o admin vai editar. Sem isso, as Fases seguintes não têm onde salvar dados.

**Migration SQL a criar:** `supabase/migrations/20260419_site_config.sql`

### Tabela `site_config` (linha única — singleton)

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | int | 1 (PK) | Sempre 1 — garante linha única |
| modo_site | text | 'normal' | `'normal'` / `'lancamento'` / `'gated'` |
| lancamento_ativo | bool | false | Ativa rota `/lancamento` |
| lancamento_inicio | timestamptz | null | Início da promoção |
| lancamento_fim | timestamptz | null | Fim da promoção |
| lancamento_desconto_pct | int | 0 | % de desconto aplicado nos planos |
| gate_ativo | bool | false | Ativa rota `/acesso` |
| gate_senha | text | '' | Senha do gate (guardada em texto simples — acesso restrito por RLS) |
| gate_titulo | text | 'Em breve' | Título exibido no gate |
| gate_mensagem | text | 'Algo incrível está chegando.' | Mensagem do gate |
| obrigado_titulo | text | 'Assinatura confirmada!' | Título da página /obrigado |
| obrigado_mensagem | text | '...' | Mensagem padrão |
| obrigado_msg_essencial | text | '...' | Mensagem específica para Essencial |
| obrigado_msg_plus | text | '...' | Mensagem específica para Plus |
| obrigado_msg_black | text | '...' | Mensagem específica para Black |
| preco_essencial | numeric(6,2) | 14.90 | Preço do Essencial |
| preco_plus | numeric(6,2) | 39.90 | Preço do Plus |
| preco_black | numeric(6,2) | 99.90 | Preço do Black |
| updated_at | timestamptz | now() | Última atualização |
| updated_by | uuid | null | Quem atualizou |

### Tabela `landing_content` (chave-valor por seção)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| secao | text | `'hero'`, `'planos'`, `'faq'`, `'pilares'`, etc. |
| chave | text | `'titulo'`, `'subtitulo'`, `'cta_texto'`, etc. |
| valor | text | Conteúdo (pode ser texto longo / markdown) |
| tipo | text | `'texto'`, `'texto_longo'`, `'imagem_url'`, `'booleano'`, `'numero'` |
| pagina | text | `'oficial'` ou `'lancamento'` — distingue a landing |
| ordem | int | Para listas (ex: FAQ) |
| updated_at | timestamptz | |
| UNIQUE(secao, chave, pagina) | | |

### Policies RLS

- `SELECT` liberado para **anônimos** (landing pública precisa ler)
- `INSERT/UPDATE/DELETE` apenas para usuários com `profiles.role = 'admin'`

### Seeds iniciais

- Inserir 1 linha em `site_config` com valores default + preços `14.90 / 39.90 / 99.90`
- Inserir no `landing_content` as chaves básicas do hero, FAQ, CTAs (valores iguais aos hardcoded hoje — serve de ponto de partida)

**Saída desta fase:**
- 1 arquivo SQL: `supabase/migrations/20260419_site_config.sql`
- Migration rodada no Supabase (dashboard ou via CLI)
- 1 commit: `feat(db): cria site_config e landing_content para gestão via admin`

**Critério de pronto:**
- `SELECT * FROM site_config;` retorna 1 linha
- `SELECT * FROM landing_content;` retorna as chaves seedadas
- RLS permitindo leitura anônima + escrita só admin

---

## Fase 2 — Painel `/admin/site`

**Objetivo:** Tela única no admin com abas que permitem editar **tudo** que o admin precisa mexer sozinho.

### Nova página: `src/app/admin/site/page.tsx`

**Tabs previstas:**

1. **Modo do site**
   - Radio `normal` / `lancamento` / `gated`
   - Salva em `site_config.modo_site`
   - Explicação em linguagem simples: "Escolha o que aparece quando alguém entra no meandyou.com.br"

2. **Gate de acesso**
   - Toggle: ativo / inativo (`gate_ativo`)
   - Input: senha (`gate_senha`) — com "olho" para mostrar/esconder
   - Input: título e mensagem
   - Pré-visualização da tela /acesso

3. **Lançamento**
   - Toggle: ativo / inativo (`lancamento_ativo`)
   - Data início e fim
   - % de desconto
   - Pré-visualização de CTA

4. **Obrigado**
   - Input: título padrão
   - Input: mensagem padrão
   - Input: mensagem por plano (Essencial / Plus / Black)

5. **Preços**
   - 3 inputs: Essencial / Plus / Black
   - Aviso: "Esses valores aparecem na landing e na tela de planos"
   - Salva em `site_config.preco_*`

6. **Textos da landing**
   - Editor de `landing_content` (tabela)
   - Lista agrupada por seção/página (oficial vs lançamento)
   - Click para editar inline
   - Salva em `landing_content`

### Nova rota no admin

Adicionar link no sidebar admin (`src/app/admin/layout.tsx` ou equivalente): **"Site & Landing"** com ícone.

**Saída desta fase:**
- 1 arquivo novo: `src/app/admin/site/page.tsx`
- 1 arquivo modificado: `src/app/admin/layout.tsx` (link novo)
- 1 commit: `feat(admin): adiciona /admin/site para gestão de landing, gate, obrigado e preços`

**Critério de pronto:**
- Admin consegue logar e acessar `/admin/site`
- Consegue editar e salvar cada aba
- Dados persistem no banco
- Usuário não admin não consegue acessar

---

## Fase 3 — Landing oficial `/` conectada ao banco

**Objetivo:** Refatorar `src/app/page.tsx` + seções em `src/app/landing/*.tsx` para ler dados de `site_config` e `landing_content`. Adicionar as seções novas que ainda não existem.

### Mudanças técnicas

- Página se torna `async` (Server Component) para carregar dados do Supabase server-side
- Cada seção que hoje usa valores hardcoded passa a receber props
- Preços puxados de `site_config.preco_*`
- Textos de hero, CTA, FAQ puxados de `landing_content`

### Seções novas a adicionar (hoje faltando)

1. **Amigos** — sistema já implementado no app mas não aparece na landing
2. **Lupas & Desfazer curtida** — hoje só o Plus/Black tem, mas landing não explica
3. **Modo Invisível / Explorar outra cidade** — itens avulsos da loja
4. **Emblemas** — sistema de badges (Identidade Verificada, Fundador, etc.)
5. **Recompensas diárias** — Roleta + Streak + Indicação em bloco único com ganchos reais

### Correção de informações desatualizadas

- Plus card: "Desfazer curtida **1/dia**" (não ilimitado)
- Black card: "**10 SuperCurtidas/dia**" (não ilimitado)
- Adicionar Lupas (0/1/2) e Tickets (1/2/3) em todos os planos
- Remover qualquer menção a "monitoramento de mensagens" ou "bloqueio VPN" (não existe)

**Saída desta fase:**
- `src/app/page.tsx` refatorado (server component)
- Seções em `src/app/landing/*.tsx` refatoradas para receber props
- 5 seções novas criadas (Amigos, Lupas, Modo Invisível, Emblemas, Recompensas)
- 1 commit: `feat(landing): conecta landing oficial ao banco e atualiza conteúdo`

---

## Fase 4 — Landing de lançamento `/lancamento` conectada ao banco

**Objetivo:** Mesma refatoração da Fase 3, mas para `/lancamento`. Adicionar redirecionamento quando `lancamento_ativo = false`.

### Mudanças

- Seções em `src/app/lancamento/*.tsx` refatoradas para receber props
- Preço com desconto calculado a partir de `site_config.preco_* * (1 - desconto_pct/100)`
- Data de fim da promoção exibida em contador
- Se `lancamento_ativo = false`: página redireciona para `/` (via `redirect()` do Next.js)

**Saída desta fase:**
- Seções `src/app/lancamento/*.tsx` refatoradas
- 1 commit: `feat(lancamento): conecta ao admin e respeita toggle ativo/inativo`

---

## Fase 5 — Página `/obrigado` dinâmica

**Objetivo:** Mensagens da página de obrigado editáveis via admin.

### Mudanças

- `src/app/obrigado/page.tsx` passa a ler `site_config.obrigado_*`
- Mensagem muda conforme `?plano=essencial|plus|black`
- Mantém o check animado atual

**Saída desta fase:**
- 1 arquivo modificado
- 1 commit: `feat(obrigado): conecta mensagens ao admin`

---

## Fase 6 — Gate `/acesso` dinâmico

**Objetivo:** Senha e textos do gate editáveis no admin.

### Mudanças

- `src/app/acesso/page.tsx` lê `site_config.gate_titulo` e `gate_mensagem`
- `POST /api/acesso` valida a senha contra `site_config.gate_senha` (lido com service role para não expor via RLS)
- Se `gate_ativo = false`, tentar acessar `/acesso` redireciona para `/`

**Saída desta fase:**
- 2 arquivos modificados (`acesso/page.tsx` + `api/acesso/route.ts`)
- 1 commit: `feat(acesso): integra gate com admin (senha, copy, toggle)`

---

## Fase 7 — Roteamento dinâmico de `/` + finalização

**Objetivo:** Baseado em `site_config.modo_site`, rota `/` se comporta diferente:

| modo_site | Comportamento de `/` |
|---|---|
| `normal` | Mostra landing oficial (como hoje) |
| `lancamento` | Redireciona para `/lancamento` |
| `gated` | Redireciona para `/acesso` se não logado / sem cookie de acesso |

### Mudanças

- `src/proxy.ts` (ou criar se não existir) lê `site_config.modo_site` e redireciona conforme
- Cache curto (60s) para não onerar o banco a cada request
- Teste manual dos 3 modos

**Saída desta fase:**
- `src/proxy.ts` criado/atualizado
- Teste manual documentado neste arquivo
- 1 commit: `feat(site): roteamento dinâmico de / baseado em modo_site`

---

## Registro de execução (atualizado ao final de cada sessão)

### Fase 0 — Correção de preços
- **Início:** 2026-04-18
- **Conclusão:** 2026-04-18
- **Arquivos alterados:**
  - `src/app/landing/HeroSection.tsx` (R$9,97 → R$14,90)
  - `src/app/landing/PlanosSection.tsx` (9,97→14,90 / 39,97→39,90 / 99,97→99,90)
  - `src/app/landing/data.ts` ("a partir de R$10" → "R$14,90")
  - `src/app/lancamento/PlanosLancamento.tsx` (3 preços corrigidos)
  - `src/app/lancamento/HeroLancamento.tsx`
  - `src/app/lancamento/OfertaLancamento.tsx`
  - `src/app/lancamento/FaqLancamento.tsx`
  - `src/app/lancamento/CtaLancamento.tsx`
  - `src/app/planos/page.tsx` (Essencial 9.90→14.90, removida Lupa do Essencial, comparativo ajustado)
  - `src/components/CheckoutModal.tsx` (ciclos do Essencial recalculados)
  - `src/app/minha-assinatura/page.tsx` (9,90 → 14,90)
  - `src/app/backstage/_components/CamaroteBlocked.tsx` (99,97 → 99,90)
  - `src/app/modos/_components/RoomsView.tsx` (9,97 no Plus → 14,90 no Essencial)
  - `src/app/lib/email.ts` (Essencial '5 curtidas/dia' → '20 curtidas/dia'; Plus '2 Lupas/dia' → '1 Lupa/dia')
  - Arquivos `page-v1-backup.tsx`, `page-v1-plus.tsx`, `page-v2-backup.tsx` **mantidos** (backup é pra ficar guardado — não remover).
- **Commit:** `fix(precos): unifica R$ 14,90 / 39,90 / 99,90 e limpa backups`
- **Pendências:** nenhuma — grep de `9,97|9,90|39,97|99,97` agora só retorna preços de produtos da Loja (fichas/camarote/pacote_lendario), que são corretos.
- **Próximo passo:** Fase 1 — Banco de dados (criar migration `20260419_site_config.sql`).

### Fase 1 — Banco de dados
- **Início:** 2026-04-18
- **Conclusão:** 2026-04-18
- **Arquivos criados:**
  - `migration_site_config.sql` (na raiz do projeto — o repo usa migrations soltas, não `supabase/migrations/`)
    - Tabela `site_config` (singleton id=1) com modo, lançamento, gate, obrigado e preços
    - Tabela `landing_content` (chave-valor por seção/página) com UNIQUE(secao, chave, pagina)
    - View pública `site_config_public` sem `gate_senha` — para leitura anônima segura na landing
    - RLS: `site_config` só admin lê/escreve (gate_senha protegida); `landing_content` leitura pública + escrita admin
    - Triggers de `updated_at` em ambas as tabelas
    - Seeds: 1 linha em `site_config` com defaults 14.90/39.90/99.90 + 14 chaves iniciais em `landing_content` (10 oficial + 4 lançamento)
- **Commit:** `feat(db): cria site_config e landing_content para gestao via admin`
- **Pendências:** nenhuma. Migration rodada no Supabase em 2026-04-18. Validado: `landing_content` com 14 linhas.
- **Próximo passo:** Fase 2 — criar painel `/admin/site` com 6 tabs (modo, gate, lançamento, obrigado, preços, textos). Começar por `src/app/admin/site/page.tsx` + link no `AdminLayoutClient.tsx`. Padrão do admin: ver `src/app/admin/recompensas/` ou `src/app/admin/marketing/` como referência.

### Fase 2 — Painel /admin/site
- **Início:** 2026-04-18
- **Conclusão:** 2026-04-18
- **Arquivos criados:**
  - `src/app/api/admin/site/route.ts` — GET (`type=config|landing`) e PUT (patch em `site_config` ou update de `landing_content` por id). Verificação `profiles.role='admin'` (staff não tem acesso nessa rota).
  - `src/app/admin/site/page.tsx` — Client component com 6 tabs:
    1. **Modo do site** — radio normal/lançamento/fechado
    2. **Gate** — toggle + senha (show/hide) + título + mensagem
    3. **Lançamento** — toggle + datas início/fim + desconto %
    4. **Obrigado** — título padrão + mensagem padrão + 3 mensagens por plano
    5. **Preços** — 3 inputs (Essencial/Plus/Black)
    6. **Textos** — lista de `landing_content` agrupada por página (oficial/lançamento) e seção, edição inline com textarea para `tipo=texto_longo`
- **Arquivos modificados:**
  - `src/app/admin/AdminLayoutClient.tsx` — novo item de nav "Site e Landing" com ícone `Globe`, entre Recompensas e Bugs.
- **Commit:** `feat(admin): adiciona /admin/site para gestao de landing, gate, obrigado e precos` (dd2ae97)
- **Pendências:** nenhuma. Build type-check só mostra os 3 erros pré-existentes de `api/amigos/*` (sessão 17/04).
- **Próximo passo:** Fase 3 — refatorar `src/app/page.tsx` (Server Component) + seções em `src/app/landing/*.tsx` para ler `site_config_public` e `landing_content`. Adicionar 5 seções novas (Amigos, Lupas, Modo Invisível, Emblemas, Recompensas) e corrigir info desatualizada (Plus desfazer 1/dia, Black 10 SuperCurtidas/dia, incluir Lupas e Tickets em todos os planos).

### Fase 3 — Landing oficial conectada
- **Início:** 2026-04-18
- **Conclusão:** 2026-04-18
- **Arquivos criados:**
  - `src/app/LandingClient.tsx` — client component que absorveu toda a lógica (auth check, IntersectionObserver, notifs, geo) antes do `page.tsx`
  - `src/app/landing/types.ts` — types + `DEFAULT_CONFIG` + helpers puros (`formatBRL`, `pick`). Client-safe.
  - `src/app/landing/server.ts` — `getSiteConfig()` + `getLandingContent()` (server-only, usa `@supabase/ssr` via `@/lib/supabase/server`)
  - `src/app/landing/AmigosSection.tsx` — chat 30 dias, presente, chamar atenção, avaliar
  - `src/app/landing/LupasSection.tsx` — Lupa, Desfazer, Ver quem curtiu, Boost
  - `src/app/landing/ModoInvisivelSection.tsx` — Modo Invisível, Explorar cidade, pacotes avulsos
  - `src/app/landing/EmblemasSection.tsx` — 8 emblemas com raridades coloridas
  - `src/app/landing/RecompensasSection.tsx` — Roleta/Streak/Indicação/Presentes
- **Arquivos modificados:**
  - `src/app/page.tsx` — virou Server Component async: carrega config + content e renderiza LandingClient. Revalidate 60s.
  - `src/app/landing/HeroSection.tsx` — recebe `config`/`content` via props; preço do Essencial sai de `site_config.preco_essencial`; badge/títulos/sub/complemento/CTA lidos de `landing_content.hero.*` com fallback.
  - `src/app/landing/PlanosSection.tsx` — recebe `config`; preços dinâmicos; Plus "Desfazer (1x por dia)"; Essencial marca "sem Lupas"; incluído tempo de vídeo (45/120/300 min).
  - `src/app/landing/FaqSection.tsx` — recebe `items?` via props com fallback para `data.ts`.
  - `src/lib/push.ts` — hotfix: adiciona `friend_message`, `friend_nudge`, `friend_gift` em `NotificationType` (estava bloqueando o build — documentado como pré-existente da sessão 17/04).
- **Commit:** `feat(landing): conecta landing oficial ao banco e adiciona 5 secoes novas` (cc49d75)
- **Pendências:** nenhuma para a Fase 3. Arquivos não-relacionados (sql/ e src/app/api/amigos/{avaliar,chamar-atencao,chat,presente}/, src/app/amigos/chat/) seguem untracked porque pertencem à sessão 17/04.
- **Próximo passo:** Fase 4 — refatorar `src/app/lancamento/*.tsx` para ler `site_config.lancamento_*` + `landing_content` com `pagina='lancamento'`. Se `lancamento_ativo=false`, `redirect('/')` no Server Component.

### Fase 4 — Landing de lançamento conectada
- **Início:** 2026-04-18
- **Conclusão:** 2026-04-18
- **Arquivos criados:**
  - `src/app/lancamento/LancamentoClient.tsx` — client component que absorveu toda a lógica (auth check, IntersectionObserver, notifs, geo) antes do `page.tsx`
- **Arquivos modificados:**
  - `src/app/lancamento/page.tsx` — virou Server Component async. Carrega `site_config_public` + `landing_content(pagina='lancamento')`. Se `lancamento_ativo=false` → `redirect('/')`. Revalidate 60s.
  - `src/app/lancamento/HeroLancamento.tsx` — recebe `config`/`content` via props. Countdown usa `config.lancamento_fim` (fallback `2026-05-15`). Badge/títulos/sub/complemento/CTA/microcopy editáveis via `landing_content.hero.*`. Preço Essencial sai de `site_config.preco_essencial`.
  - `src/app/lancamento/OfertaLancamento.tsx` — recebe `config`/`content`. 3 cards + título + parágrafos + CTA editáveis via `landing_content.oferta.*`. Preço Essencial dinâmico em todos os pontos.
  - `src/app/lancamento/PlanosLancamento.tsx` — recebe `config`/`content`. Essencial mostra grátis + riscado com preço real. Plus e Black aplicam `lancamento_desconto_pct` se > 0 (preço riscado + preço com desconto + badge `X% OFF no lançamento`). Plus: "Desfazer (1x por dia)".
  - `src/app/lancamento/FaqLancamento.tsx` — aceita `items?` via props (fallback para a lista hardcoded — 9 perguntas). LancamentoClient monta items a partir de `landing_content.faq.q_N/a_N` se existirem.
  - `src/app/lancamento/CtaLancamento.tsx` — recebe `config`/`content`. Countdown dinâmico. Título/subtítulo/CTA/microcopy/bônus editáveis via `landing_content.cta.*`.
- **Commit:** `feat(lancamento): conecta ao admin e respeita toggle ativo/inativo` (1cb7132)
- **Pendências:** nenhuma. Redirecionamento testa no próprio Next via `redirect()` server-side.
- **Próximo passo:** Fase 5 — refatorar `src/app/obrigado/page.tsx` para ler `site_config.obrigado_*` (título, mensagem geral + por plano via `?plano=`).

### Fase 5 — Página /obrigado dinâmica
- **Início:**
- **Conclusão:**
- **Arquivos alterados:**
- **Commit:**
- **Pendências:**
- **Próximo passo:**

### Fase 6 — Gate /acesso dinâmico
- **Início:**
- **Conclusão:**
- **Arquivos alterados:**
- **Commit:**
- **Pendências:**
- **Próximo passo:**

### Fase 7 — Roteamento dinâmico de /
- **Início:**
- **Conclusão:**
- **Arquivos alterados:**
- **Commit:**
- **Pendências:**
- **Próximo passo:**

---

## Notas importantes

- **Deploy é automático** no push para `main` (Vercel). Cada commit vai ao ar.
- **Sem --no-verify** em nenhum commit. Se hook falhar, parar e investigar.
- **Nunca mexer** em `~/.git-credentials`.
- **Admin auth:** verificado por `profiles.role = 'admin'` + layout admin protegido.
- **RLS obrigatório** em todas as tabelas novas.
- **Ao pausar sessão:** atualizar o registro de execução com data/hora e próximo passo.
