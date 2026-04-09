# Auditoria de Concorrência e Multi-usuário — MeAndYou
Data: 2026-04-09

## RESUMO EXECUTIVO
- **Total de riscos encontrados:** 12
- **Críticos (dados podem corromper):** 3
- **Atenção (bugs intermitentes):** 5
- **Avisos (melhorias preventivas):** 4

---

## 🔴 CRÍTICO — Pode corromper dados ou dar vantagem indevida

### 1. ROLETA: Prêmio pode ser creditado ANTES de validar que tickets foram debitados
- **Arquivo:** `src/app/api/roleta/girar/route.ts` (linhas 16–33)
- **RPC:** `spin_roleta()` em `migration_roleta_fichas.sql` (linhas 17–160)
- **Cenário de falha:**
  - Usuário A tem 1 ticket. Clica girar 2x rapidamente (t=0).
  - Ambas as requests chegam quase ao mesmo tempo à API.
  - `spin_roleta` usa `FOR UPDATE` (bom!), mas há uma lacuna:
    - O ticket é debitado (linha 44–47)
    - Depois, o prêmio é creditado (linha 70–136)
    - Se a RPC falhar ENTRE o débito e o crédito (rede, timeout, OOM), o prêmio é perdido.
  - Usuário perde 1 ticket mas nunca recebe o prêmio.
- **Impacto:** Perda de confiança do usuário. Reclamações no suporte. Credibilidade da app afetada.
- **Causa raiz:** A operação não é atômica entre débito e crédito. Se o PostgreSQL cai entre INSERT de débito e INSERT de crédito, há inconsistência.

---

### 2. LIKES/MATCHES: Dois usuários podem criar 2 matches simultâneos (race condition)
- **Arquivo:** `migration_fix_swipe_match_presence.sql` (linhas 170–234)
- **RPC:** `process_like()`
- **Cenário de falha:**
  - t=0.00: Usuário A clica like em B — `process_like(A, B)` iniciada
  - t=0.01: Usuário B clica like em A — `process_like(B, A)` iniciada
  - RPC A executa: INSERT like(A→B), verifica se B já deu like em A → NÃO AINDA → INSERT match1(A, B)
  - RPC B executa em paralelo: INSERT like(B→A), verifica se A já deu like em B → NÃO AINDA → INSERT match2(B, A)
  - Resultado: **2 matches criados** entre os mesmos usuários
- **Impacto:**
  - 2 cards idênticos do mesmo match na tela
  - 2 canais Realtime para o mesmo par de usuários
  - Notificações duplicadas de match
- **Causa raiz:** `process_like()` verifica `EXISTS (SELECT ... FROM likes WHERE ...)` **SEM lock**. Entre o SELECT e o INSERT do match, a outra RPC insere o like e cria um match paralelo.
- **Linha específica do risco:** Linhas 213–227 — falta `FOR UPDATE` nos dois sentidos antes de criar o match.

---

### 3. CHAT: Rate limit não serializa salas públicas — flood possível
- **Arquivo:** `src/app/api/chat/send/route.ts` (linhas 78–84)
- **RPC:** `send_chat_message()` em `migration_badges_chat_rpcs.sql` (linhas 116–167)
- **Cenário de falha:**
  - Advisory lock usa `hashtext(p_sender_id) + hashtext(p_match_id)`
  - Em DMs (1:1): funciona — apenas 1 transação por sender+match
  - Em salas públicas: 100+ users têm sender_id diferentes → locks diferentes → **sem serialização entre users**
  - Rate limit (linhas 140–147) checa apenas mensagens DO MESMO SENDER
  - Resultado: 2+ usuários podem fazer flood de 100+ msgs/min em uma sala
- **Impacto:** Spam/flood possível em salas públicas. DMs estão protegidos, salas NÃO.
- **Causa raiz:** Advisory lock é específico do sender, não da sala. Falta lock adicional por sala.

---

## 🟡 ATENÇÃO — Bugs intermitentes sob carga

### 4. SALAS: Cleanup de membros fantasma pode deletar membro ativo
- **Arquivo:** `src/app/api/salas/entrar/route.ts` (linha 70)
- **RPC:** `entrar_sala()` em `migration_sala_entrar_atomico.sql` (linhas 49–51)
- **Cenário de falha:**
  - Usuário A entra na sala (heartbeat = t0)
  - Heartbeat client-side falha por 2:01 minutos (rede lenta, JS pausado em background)
  - Cleanup no `entrar_sala()` executa: `DELETE ... WHERE last_heartbeat < now() - interval '2 minutes'`
  - Usuário A é deletado de `room_members` ENQUANTO ainda está ativo/conectado
  - Usuário A recebe erro ou mensagem não entra
- **Impacto:** Usuário expulso sem saber. Confusão, UX muito ruim.
- **Causa raiz:** `last_heartbeat` depende de heartbeat client-side. Se o cliente não enviar a tempo (qualquer motivo), é deletado mesmo estando ativo.
- **Observação crítica:** Não há evidência no frontend de que `room_heartbeat()` está sendo chamado periodicamente. Risco ALTO.

---

### 5. PAGAMENTOS: Fichas podem ser creditadas 2x em retry do webhook
- **Arquivo:** `src/app/api/webhooks/abacatepay/route.ts` (linhas 72–151)
- **Cenário de falha:**
  - Webhook recebido: `billing.paid` com gateway_id=XYZ123
  - Idempotência check: busca payment por gateway_id → encontra (status='pending')
  - Claim atômico: `UPDATE payment SET status='paid' WHERE id=payment.id AND status='pending'` ✅
  - Após o claim, executa RPC `activate_subscription()` ou `add_fichas()`
  - Se `add_fichas()` falhar (timeout, erro BD), webhook retorna 200 SEM informar retry necessário
  - AbacatePay faz retry automático
  - Segunda vez: payment já está status='paid', claim falha, mas se houver race, `add_fichas()` pode rodar novamente
- **Impacto:** Fichas creditadas 2x em cenários raros.
- **Causa raiz:** Idempotência está no UPDATE da payment, não no creditar das fichas. Se `add_fichas()` não for idempotente (ON CONFLICT), fichas podem ser duplicadas.

---

### 6. PERFIL: Update de `last_active_at` pode sobrescrever dados mais recentes
- **Arquivo:** `src/app/api/auth/login/route.ts` (linha 222)
- **Cenário de falha:**
  - Usuário A faz login (t=0): `UPDATE profiles SET last_seen = t0, last_active_at = t0`
  - Simultaneamente, outro endpoint (chat, perfil) faz UPDATE de last_active_at com t1 (mais recente)
  - Dois UPDATEs paralelos
  - Se o UPDATE de t0 executar DEPOIS do de t1, `last_active_at` fica com valor mais antigo
- **Impacto:** OnlineIndicator mostra status errado. "Ativo agora" pode virar "Ativo há 5 minutos".
- **Causa raiz:** Sem `FOR UPDATE` ou optimistic locking. Dois UPDATEs paralelos no mesmo registro sobrescrevem um ao outro.

---

### 7. SALAS: Múltiplas abas do mesmo usuário geram heartbeats conflitantes
- **Cenário de falha:**
  - Usuário A abre a sala na Aba 1 → heartbeat iniciado
  - Usuário A abre a MESMA sala na Aba 2 → outro heartbeat iniciado
  - Aba 1 fecha sem cleanup/unsubscribe → sem `DELETE FROM room_members`
  - Aba 2 mantém heartbeat
  - Membro fica "ativo" até 2 minutos após fechar todas as abas
  - Outro usuário vê Aba 1 como "ativa" (fantasma) por até 2 minutos
- **Impacto:** Usuários fantasmas em salas. Confusão sobre quem está realmente presente.
- **Causa raiz:** Sem UNSUBSCRIBE explícito do Realtime + sem cleanup ao fechar aba. Heartbeat depende do client-side.

---

### 8. CONVERSAS: Dedup de mensagens Realtime + Otimista pode falhar
- **Arquivo:** `src/app/conversas/[id]/page.tsx` (linhas 173–179)
- **Lógica atual:**
  - Cliente envia com `tempId`
  - Servidor faz INSERT (novo ID real)
  - Realtime notifica (ID real)
  - Cliente faz dedup: `if (prev.find(m => m.id === newMsg.id))`
- **Problema:** Se ID real ≠ tempId, o dedup falha → 2 mensagens no UI (a otimista + a real)
- **Recomendação:** Usar `idempotency_key` para dedup 100% confiável.

---

## 🔵 AVISO — Melhorias preventivas recomendadas

### 9. LOJA: Débito e crédito não são uma transação única
- **Arquivo:** `src/app/api/loja/gastar/route.ts` (linhas 70–149)
- **Contexto:**
  - Linha 71–75: RPC `spend_fichas()` debita fichas
  - Linha 86–149: credita o item (RPC ou UPDATE direto)
  - Se a API cair entre os dois passos, fichas foram gastas mas o item não foi creditado
- **Recomendação:** Criar RPC atômica `spend_fichas_and_award_item()` que debita + credita em uma única transação.

---

### 10. SESSIONS: Limite de 5 pode ter race condition
- **Arquivo:** `src/app/api/auth/login/route.ts` (linhas 206–214)
- **Cenário:**
  - Usuário faz login em 2 dispositivos ao mesmo tempo
  - Ambos INSERT em `user_sessions` → ambos veem 4 sessões → ambos não deletam → 6 sessões
- **Recomendação:** Usar RPC com lock ou `ON CONFLICT`.

---

### 11. MATCHES: Não há cron job para expirar matches antigos
- **Contexto:** Matches antigos acumulam sem cleanup automático
- **Recomendação:** Implementar `/api/cron/expire-matches` para limpar matches com 7+ dias.

---

### 12. BOOST: Cron pode executar expiração em paralelo
- **Contexto:** Cron job pode chamar `/api/boosts/notify-expired` em paralelo.
- **Impacto:** Baixo (UPDATE é idempotente em maioria dos casos).
- **Recomendação:** Adicionar `WHERE active = true` explicitamente.

---

## ✅ CONFIRMADO OK — Implementado corretamente

| Feature | Como está protegida |
|---------|---------------------|
| Roleta (concorrência por usuário) | `FOR UPDATE` serializa giro por usuário — OK |
| Salas (limite de capacidade) | `FOR UPDATE` + contagem atômica — OK |
| Chat rate limit (DMs) | `pg_advisory_xact_lock` serializa por sender+match — OK |
| Likes (duplicatas client) | `ON CONFLICT DO UPDATE` idempotente — OK |
| Webhook AbacatePay (idempotência) | Claim atômico com `UPDATE ... WHERE status='pending'` — OK |
| Fichas/itens increment | `INSERT ... ON CONFLICT DO UPDATE` atômico — OK |
| RLS (segurança de dados) | Ativo em todas as tabelas críticas — OK |
| Dedup Realtime (base) | `if (prev.find(m => m.id === newMsg.id))` — parcialmente OK |

---

## RECOMENDAÇÕES POR PRIORIDADE

### 🔴 IMEDIATO — Antes do lançamento
1. **Confirmar se `room_heartbeat()` está sendo chamado** no frontend das salas. Se não estiver, implementar.
2. **Adicionar `FOR UPDATE` em ambos os sentidos na RPC `process_like()`** para serializar matches mútuos.
3. **Criar RPC `spend_fichas_and_award_item()`** que debita + credita atomicamente (loja).

### 🟡 CURTO PRAZO — Semana do lançamento
4. Implementar **`idempotency_key`** no chat para dedup 100% confiável.
5. Adicionar **`FOR UPDATE` em updates de `last_active_at`** ou usar batch updates.
6. Criar **cron job `/api/cron/expire-matches`** para limpar matches antigos.

### 🔵 MÉDIO PRAZO — Pós-lançamento
7. Adicionar **rate limiting por sala** (não apenas por usuário) na RPC `send_chat_message`.
8. Implementar **transações explícitas** para operações multi-step.
9. Executar **testes de carga** com 100+ usuários simultâneos em cada cenário crítico.

---

## CONCLUSÃO

O projeto MeAndYou tem **sólida proteção contra race conditions na maioria dos fluxos** (FOR UPDATE, advisory lock, ON CONFLICT), mas possui **3 buracos específicos** que precisam ser corrigidos antes do lançamento:

1. **Matches duplos** — `process_like()` sem lock bilateral → RISCO ALTO de dados inconsistentes
2. **Heartbeat de salas não confirmado** — presença falsa/expulsão indevida → RISCO ALTO de UX quebrada
3. **Loja sem transação atômica** — débito sem crédito em falha → RISCO MÉDIO de fichas perdidas

Estes 3 problemas devem ser corrigidos antes de abrir para múltiplos usuários simultâneos.
