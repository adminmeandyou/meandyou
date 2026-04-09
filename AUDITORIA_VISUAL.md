# Auditoria Visual e Design — MeAndYou
Data: 2026-04-09

## RESUMO EXECUTIVO
- **Total de problemas:** 23
- **Críticos:** 6 | **Atenção:** 9 | **Avisos:** 8

---

## 🔴 CRÍTICO — Quebra identidade ou ilegível

| Arquivo | Linha | Problema | Valor atual | Deveria ser |
|---------|-------|---------|-------------|-------------|
| src/app/landing/PerfilSection.tsx | 22 | Texto escuro (#000) em badge gold gradient | `color:'#000', background:'linear-gradient(135deg,#F59E0B,#d97706)'` | `color:'#fff'` |
| src/app/landing/BackstageSection.tsx | 21 | Texto escuro (#000) em botão gold gradient | `color:'#000', background:'linear-gradient(135deg,#F59E0B,#d97706)'` | `color:'#fff'` |
| src/app/backstage/chat/[id]/page.tsx | 345 | Texto escuro (#000) em botão com fundo gold | `color: '#000'` em gradient gold | `color: '#fff'` |
| src/app/backstage/chat/[id]/page.tsx | 431 | Texto escuro (#000) em badge gold | `color: '#000'` | `color: '#fff'` |
| src/app/backstage/chat/[id]/page.tsx | 546 | Texto escuro (#000) em botão convite gold | `color: '#000'` (quando ativo) | `color: '#fff'` |
| src/app/backstage/chat/[id]/page.tsx | 681 | Texto escuro (#000) em botão meeting gold | `color: '#000'` (quando preenchido) | `color: '#fff'` |

**Impacto crítico:** Violação direta da identidade visual — "Botão vermelho = texto BRANCO (#fff). NUNCA texto escuro no accent". O mesmo padrão aplica-se a gold (#F59E0B) para VIP/Black.

---

## 🟡 ATENÇÃO — Inconsistência visível

| Arquivo | Linha | Problema | Valor atual | Deveria ser |
|---------|-------|---------|-------------|-------------|
| src/app/conversas/[id]/page.tsx | 148 | Fallback de nome sem acento | `name: profile?.name ?? 'Usuario'` | `'Usuário'` |
| src/app/conversas/page.tsx | 210 | Fallback de nome sem acento | `name: p.name ?? 'Usuario'` | `'Usuário'` |
| src/app/salas/criar/page.tsx | 106 | Label sem acento | `"Descricao (opcional)"` | `"Descrição (opcional)"` |
| src/app/indicar/page.tsx | 222 | Fallback de nome | `{r.referred?.name ?? 'Usuario'}` | `'Usuário'` |
| src/app/admin/bugs/page.tsx | 133 | Fallback de nome | `{selectedBug.user?.name ?? 'Usuario'}` | `'Usuário'` |
| src/app/api/payments/create/route.ts | 80 | Fallback de nome | `const customerName = profile?.display_name ?? 'Usuario'` | `'Usuário'` |
| src/app/backstage/page.tsx | 815 | Cor de texto em elemento gold | `color: liked ? G : '#000'` | Quando não-liked: `'#fff'` |
| src/app/backstage/page.tsx | 1306 | Botão CTA com texto escuro | `color: '#000'` em gradient gold | `color: '#fff'` |
| src/app/landing/HeroSection.tsx | 47 | CTA inconsistente | `"Entrar agora"` | Padronizar com `"Começar agora"` |

---

## 🔵 AVISO — Ortografia / Escrita

| Arquivo | Linha | Texto errado | Texto correto |
|---------|-------|-------------|---------------|
| src/app/salas/criar/page.tsx | 106 | "Descricao (opcional)" | "Descrição (opcional)" |
| src/app/admin/bugs/page.tsx | 69 | "Usuario" em header de tabela | "Usuário" |
| src/app/admin/bugs/page.tsx | 139 | "Descricao" em label | "Descrição" |
| src/app/admin/marketing/page.tsx | 18 | "Usuario inativo" | "Usuário inativo" |
| src/app/suporte/page.tsx | 176 | `"Descricao * ({form.descricao.length}/1000)"` | "Descrição *" |
| src/app/configuracoes/page.tsx | 435–454 | "bugDescricao" em formulário | Verificar se afeta label visível |
| src/app/modos/page.tsx | 1038 | `emoji: '🔥'` em sala | Remover emoji — identidade visual proíbe emojis sem solicitação |
| src/app/landing/CtaFinalSection.tsx | 7 | "Comece agora" | "Começar agora" (variação inconsistente) |

---

## ✅ SUGESTÃO — Melhorias de UX/Design

| Arquivo | Linha | Sugestão |
|---------|-------|---------|
| src/app/landing/PlanosSection.tsx | 112 | Padronizar CTA: "Assinar o Plus" vs "Começar agora" em outras seções |
| src/app/landing/NavBar.tsx | 19 | Verificar consistência: `/planos` vs `/cadastro` em CTAs |
| src/app/landing/NavBar.tsx | 37 | Mobile menu aponta `/planos`; desktop aponta `/cadastro` — padronizar |
| src/app/login/page.tsx | 52 | Mensagem de erro genérica: "Erro de conexão. Tente novamente." | Oferecer mais contexto |
| src/app/backstage/page.tsx | 756 | Botão com cor gold: `color: '#000'` deve ser `'#fff'` |

---

## Detalhamento dos Problemas Críticos

### Problema Principal: Texto Escuro (#000) em Fundos Gold (#F59E0B)

**Ocorrências totais:** 8 (6 críticas + 2 no backstage/page.tsx)

**Localização:**
1. `src/app/landing/PerfilSection.tsx` — Badge "BLACK" (linha 22)
2. `src/app/landing/BackstageSection.tsx` — Botão "Ver o plano Black" (linha 21)
3. `src/app/backstage/chat/[id]/page.tsx` — Botões convite, meeting, badge (linhas 345, 431, 546, 681)
4. `src/app/backstage/page.tsx` — Botão CTA principal (linha 1306) e botão curtir (linha 815)

**Raiz do problema:** A regra da identidade é "Botão vermelho = texto BRANCO (#fff). NUNCA texto escuro no accent". Isso se estende ao gold VIP — fundo dourado exige texto branco.

**Solução:** Trocar `color: '#000'` por `color: '#fff'` em TODOS os elementos com `background` contendo `#F59E0B` ou gradient gold.

---

## Inconsistências de Ortografia PT-BR

### "Usuario" → "Usuário" (8 ocorrências)
Fallback values em templates:
- `conversas/[id]/page.tsx`
- `conversas/page.tsx`
- `backstage/chat/[id]/page.tsx`
- `indicar/page.tsx`
- `admin/bugs/page.tsx`
- `api/payments/create/route.ts`
- `suporte/page.tsx`
- `admin/marketing/page.tsx`

### "Descricao" → "Descrição" (4 ocorrências)
Labels em formulários:
- `salas/criar/page.tsx`
- `admin/bugs/page.tsx`
- `suporte/page.tsx`
- `configuracoes/page.tsx`

### Emoji 🔥 não permitido
**Linha:** `src/app/modos/page.tsx:1038`
```javascript
{ emoji: '🔥', name: 'Paquera Livre', members: 12, max: 20 }
```
Identidade visual proíbe: "NUNCA usar emojis sem ser pedido". Substituir por ícone SVG ou remover campo.

---

## Inconsistências de CTA (Call-to-Action) na Landing

| Seção | Texto atual | Proposta de padronização |
|-------|-------------|--------------------------|
| HeroSection | "Entrar agora" | "Começar agora" |
| NavBar | "Começar agora" | OK — referência |
| PlanosSection | "Assinar o Essencial/Plus/Black" | Manter (contexto de plano) |
| CtaFinalSection | "Comece agora" | "Começar agora" |
| NavBar mobile | aponta `/planos` | Padronizar para `/cadastro` como desktop |

---

## Branding "MeAndYou" — Verificado

✅ Logo: "MeAnd" branco + "You" vermelho — presente e correto em NavBar.tsx
✅ Nome: "MeAndYou" padronizado em todo o projeto
✅ Texto branco em todos os CTAs com fundo vermelho (#E11D48) — correto
✅ Iconografia Lucide-React — consistente
✅ Títulos de página — consistentes
✅ Placeholders em inglês — não encontrados em inputs visíveis
✅ Mensagens de erro genéricas — não encontradas nas telas principais

---

## Checklist de Áreas Auditadas

- [x] Landing Page (`src/app/page.tsx` e `src/app/landing/`)
- [x] Autenticação (login, cadastro, verificação, onboarding)
- [x] Dashboard
- [x] Modos (Descobrir, Busca Avançada, Match do Dia, Salas)
- [x] Conversas e Chat
- [x] Perfil
- [x] Backstage / Camarote
- [x] Salas
- [x] Roleta
- [x] Loja
- [x] Indicar
- [x] Minha Assinatura / Planos
- [x] Configurações
- [x] Suporte
- [x] Admin Panel (todos os subpainéis)
- [x] API Routes (textos expostos ao usuário)

---

## Priorização de Correções

### Imediato — 🔴 Crítico
1. Trocar `color: '#000'` → `color: '#fff'` em 8 elementos com fundo gold
2. Remover emoji 🔥 de sala ou implementar ícone SVG

### Curto Prazo — 🟡 Semana
1. Corrigir acentuação: "Usuario" → "Usuário" (8 ocorrências)
2. Corrigir acentuação: "Descricao" → "Descrição" (4 ocorrências)
3. Padronizar CTAs da landing (escolher "Começar agora" como padrão)
4. Padronizar link do NavBar mobile (`/planos` → `/cadastro`)

### Futuro — 💡 Polish
1. Revisar acessibilidade WCAG AA completa
2. Revisar comentários de código PT-BR (acentuação)
