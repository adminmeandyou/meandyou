# Design — Admin: Export, Marketing, Webhooks e Reporte de Bugs

**Data:** 2026-03-18
**Status:** Aprovado

---

## 1. Export de Usuários (CSV/TXT)

### Onde
Botão "Exportar" adicionado na página `/admin/usuarios` (já existente).

### Filtros combinados
- Plano: Essencial / Plus / Black / Sem plano
- Status: ativo / inativo / banido / cancelado
- Data de cadastro: intervalo de/até

### Campos exportados
`Nome`, `E-mail`, `CPF`, `Telefone`, `Plano`, `Status`, `Data de cadastro`, `Total gasto na loja (R$)`

### Fluxo
1. Admin seleciona filtros na página de usuários
2. Escolhe formato (CSV ou TXT)
3. Clica em exportar
4. Download automático no browser

### API
```
GET /api/admin/usuarios/export?plano=black&status=ativo&data_inicio=2026-01-01&data_fim=2026-03-18&formato=csv
```
- Autenticação: service role, somente admin
- Retorna: arquivo para download com `Content-Disposition: attachment`
- Total gasto: calculado via join com tabela de transações/fichas

---

## 2. E-mail Marketing + Webhooks de Notificação

### Onde
Página `/admin/marketing` (já existe) — expandida com duas abas.

### Aba 1 — Campanhas
- Admin cria campanha: título, corpo do e-mail, segmento (todos / por plano / por status)
- Pré-visualização antes de enviar
- Disparo via **Resend** (já integrado)
- Histórico: data, assunto, quantidade de destinatários, status (enviado / falhou)

### Aba 2 — Configuração de Notificações Automáticas

Eventos configuráveis com toggle por canal:

| Evento | E-mail | WhatsApp |
|---|---|---|
| Novo cadastro | toggle | toggle |
| Pagamento aprovado | toggle | toggle |
| Plano cancelado | toggle | toggle |
| Usuário inativo (X dias) | toggle | toggle |
| Novo match | toggle | toggle |

- WhatsApp: campo de URL de webhook configurável (Z-API / Evolution / Twilio)
- Arquitetura preparada para WhatsApp — basta adicionar a URL quando contratar o serviço

### Banco de dados
Tabela `notification_settings`:
```sql
id uuid primary key
evento text not null           -- 'new_user', 'payment_approved', etc.
canal text not null            -- 'email' | 'whatsapp'
ativo boolean default false
webhook_url text               -- URL do WhatsApp provider (nullable)
dias_inatividade int           -- só para evento 'user_inactive'
updated_at timestamptz
```

### APIs
```
GET  /api/admin/notificacoes/settings    -- listar configurações atuais
POST /api/admin/notificacoes/settings    -- salvar configuração
POST /api/admin/marketing/campanha       -- criar e disparar campanha
GET  /api/admin/marketing/historico     -- histórico de campanhas
```

---

## 3. Reporte de Bugs

### No app — usuário

**Acesso:** Configurações → "Reportar problema"

**Modal de reporte:**
- Campo de texto: "O que aconteceu?" (obrigatório, min 20 caracteres)
- Anexar print: botão de upload (opcional, 1 imagem, max 5MB, formatos: jpg/png/webp)
- Botão "Enviar"

**Após envio:**
- Mensagem: "Obrigado pela sua contribuição! Se o problema for confirmado pela nossa equipe, você receberá uma recompensa especial."
- Nenhuma informação sobre valor da recompensa ou prazo

**Restrições:**
- Limite de 3 reports por usuário por dia (evitar spam)
- Usuário não vê status do report depois de enviado

### No admin — nova página `/admin/bugs`

**Lista de reports:**
- Colunas: data, usuário (nome), descrição resumida (50 chars), status badge (pendente / verificado / recusado)
- Filtro por status
- Ordenado por data decrescente (mais recentes primeiro)

**Detalhe do report (ao clicar):**
- Descrição completa
- Print (se houver) — renderizado na tela
- Info do usuário (nome, plano, e-mail)
- Botões de ação:
  - **"Verificar e recompensar"** → credita 5 fichas ao usuário via `credit_fichas` RPC
  - **"Recusar"** → marca como recusado, sem recompensa

**Notificação ao usuário após verificação:**
- Notificação in-app: "Seu reporte foi verificado! 5 fichas foram adicionadas à sua conta."

### Banco de dados
Tabela `bug_reports`:
```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id)
descricao text not null
screenshot_url text              -- nullable, URL do Supabase Storage
status text default 'pendente'   -- 'pendente' | 'verificado' | 'recusado'
created_at timestamptz default now()
reviewed_at timestamptz
reviewed_by uuid references profiles(id)  -- admin que revisou
```

### Storage
Bucket `bug-screenshots` no Supabase Storage:
- Visibilidade: **privado** (acesso somente via service role)
- RLS: usuário só pode fazer upload do próprio report

### APIs
```
POST /api/bugs/reportar              -- usuário envia report (com upload de imagem)
GET  /api/admin/bugs                 -- admin lista reports (com filtros)
POST /api/admin/bugs/[id]/verificar  -- admin verifica e credita fichas
POST /api/admin/bugs/[id]/recusar   -- admin recusa report
```

### Fluxo de recompensa
1. Admin clica "Verificar e recompensar"
2. API chama `supabaseAdmin.rpc('credit_fichas', { user_id, amount: 5 })`
3. Status do report muda para `verificado`
4. Notificação in-app enviada ao usuário

---

## Resumo de mudanças no banco

| Tabela/Bucket | Ação |
|---|---|
| `notification_settings` | Criar nova tabela |
| `bug_reports` | Criar nova tabela |
| `bug-screenshots` | Criar bucket privado no Storage |
| `marketing_campaigns` | Criar nova tabela (histórico de campanhas) |

## Resumo de novas páginas/rotas

| Rota | Tipo | Descrição |
|---|---|---|
| `/api/admin/usuarios/export` | API | Export CSV/TXT |
| `/api/admin/notificacoes/settings` | API | Config de notificações |
| `/api/admin/marketing/campanha` | API | Criar campanha |
| `/api/admin/marketing/historico` | API | Histórico de campanhas |
| `/api/bugs/reportar` | API | Usuário reporta bug |
| `/api/admin/bugs` | API | Admin lista bugs |
| `/api/admin/bugs/[id]/verificar` | API | Admin verifica bug |
| `/api/admin/bugs/[id]/recusar` | API | Admin recusa bug |
| `/admin/bugs` | Page | Painel admin de bugs |
