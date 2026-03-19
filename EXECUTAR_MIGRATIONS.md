# 🚀 Executar Migrations — Passo a Passo

## 📌 Introdução

Olá Leandro! Criei duas migrations importantes para corrigir bugs e habilitar funcionalidades. Siga este guia para executá-las no Supabase.

---

## 🔧 Pré-requisitos

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (MeAndYou)
3. Vá em **SQL Editor** (menu lateral esquerdo)

---

## 📦 Migrations a Executar

### 1. migration_xp_system.sql

**O que faz:**
- Adiciona colunas de XP na tabela `profiles` (se ainda não existirem)
- Cria a função `award_xp` para creditar XP
- Cria a função `get_xp_stats` para consultar estatísticas

**Como executar:**
1. No SQL Editor, clique em **New Query**
2. Copie TODO o conteúdo do arquivo `migration_xp_system.sql`
3. Cole no editor
4. Clique em **Run** (ou pressione Ctrl+Enter)

**Verificação:**
- Deve aparecer `"Success. No rows returned"` ou similar
- Não deve ter erros

---

### 2. migration_streak_system.sql

**O que faz (IMPORTANTE):**
- Cria a tabela `daily_streaks` (streak do usuário)
- Cria a tabela `streak_calendar` (calendário de recompensas)
- Cria a função `claim_streak_reward` — **esta corrige o bug de não creditar saldo**
- Cria a função `update_streak_on_login` para atualizar o streak no login

**Como executar:**
1. Crie uma **nova query** (New Query novamente)
2. Copie TODO o conteúdo do arquivo `migration_streak_system.sql`
3. Cole no editor
4. Clique em **Run**

**Verificação:**
- Deve aparecer sucesso
- Se aparecer erro de "already exists", ignore — significa que alguma tabela ou função já foi criada anteriormente. A migration usa `CREATE IF NOT EXISTS` e `CREATE OR REPLACE`, então é seguro rodar mesmo assim.

---

## ✅ Após Executar

### 1. Atualizar o código (JÁ FOI FEITO)

*Não precisa fazer nada — a rota de login `/api/auth/login/route.ts` já foi atualizada para chamar `update_streak_on_login`.*

### 2. Testar o funcionamento

1. Faça login no app
2. Vá para **Prêmios Diários** (`/streak`)
3. Se for um usuário novo, o calendário será gerado automaticamente
4. Clique em **"Resgatar"** de um dia acessível (day_number <= streak atual)
5. Verifique se o item apareceu no saldo:
   - **Tickets**: aparecem na roleta (canto superior direito)
   - **Superlikes**: aparecem no perfil ou na loja?
   - **Boosts**: aparecem no perfil ou na loja?
   - **Lupas**: ?
   - **Desfazer**: ?

---

## 🐛 Problemas Comuns

### Erro "function award_xp does not exist"
- Certifique-se de rodar a `migration_xp_system.sql` primeiro
- A função `award_xp` é necessária para a RPC `claim_streak_reward`

### Erro "relation 'streak_calendar' does not exist"
- Rodou a migration? Tente rodar novamente
- A tabela será criada automaticamente

### Botão "Resgatar" não aparece
- Verifique se o streak atual é maior ou igual ao day_number
- O calendário pode ainda não ter sido gerado — saia e entre na página novamente

### Item não sumiu do calendário após resgatar
- Recarregue a página (F5)
- Verifique no banco se a coluna `claimed` foi marcada como true

---

## 📊 Onde Ver os Dados no Supabase

- **Tabela `streak_calendar`**: View → Table Editor → `streak_calendar`
- **Tabela `daily_streaks`**: Table Editor → `daily_streaks`
- **Funções (RPCs)**: Database → Functions

---

## ⚠️ Importante

- **Não delete ou modifique** as migrations após executar
- As migrations usam `IF NOT EXISTS` e `CREATE OR REPLACE`, então podem ser rodadas múltiplas vezes com segurança
- Backups automáticos do Supabase permitem恢复 se algo der errado

---

## 📞 Dúvidas?

Consulte o arquivo `TAREFAS.md` para ver o progresso geral do projeto, ou me pergunte!
