# Design: Integração AbacatePay — Checkout Transparente

**Data:** 2026-03-21
**Status:** Aprovado

---

## Contexto

O gateway anterior (Cakto) foi removido. O MeAndYou precisa de um novo gateway de pagamentos com checkout transparente (sem redirecionamento externo). A AbacatePay foi escolhida.

O sistema tem 3 tipos de cobrança:

1. **Assinatura recorrente** — planos mensais (Essencial R$9,97 / Plus R$39,97 / Black R$99,97), renova ate cancelar
2. **Recarga de fichas** — pagamento unico, sem expiracao, credito imediato na loja
3. **Camarote Black** — pagamento unico, acesso da pessoa resgatada expira em 30 dias

---

## Abordagem escolhida: Modal unico reutilizavel

Um componente `<CheckoutModal>` serve para os 3 casos. O usuario nunca sai da tela onde esta — tudo acontece inline.

---

## Arquitetura

### Componentes novos
- `src/components/CheckoutModal.tsx` — modal com stepper de 4 passos
- `src/app/api/payments/create/route.ts` — cria pagamento na AbacatePay
- `src/app/api/payments/status/[id]/route.ts` — consulta status (usado no polling do PIX)
- `src/app/api/webhooks/abacatepay/route.ts` — recebe confirmacao e ativa o produto

### Variaveis de ambiente
```
ABACATEPAY_API_KEY=abc_prod_...
ABACATEPAY_WEBHOOK_SECRET=<secret definido pelo dev>
```

### Webhook URL (producao)
```
https://www.meandyou.com.br/api/webhooks/abacatepay
```

---

## Fluxos de pagamento

### Assinatura recorrente
- **Cartao:** AbacatePay gerencia recorrencia automatica (cobra todo mes/trimestre/semestre/ano)
- **PIX:** pagamento unico do valor total do ciclo; ao expirar, app notifica para renovar

### Fichas (recarga avulsa)
- Pagamento unico, PIX ou cartao
- Fichas creditadas via RPC imediatamente apos webhook de confirmacao

### Camarote Black
- Pagamento unico, PIX ou cartao
- Acesso da pessoa resgatada ativado por 30 dias via RPC

---

## Ciclos de assinatura com desconto

| Ciclo | Desconto | Essencial | Plus | Black |
|-------|----------|-----------|------|-------|
| Mensal | - | R$9,97 | R$39,97 | R$99,97 |
| Trimestral | ~10% | R$26,90 | R$107,90 | R$269,90 |
| Semestral | ~20% | R$47,80 | R$191,80 | R$479,80 |
| Anual | ~30% | R$83,70 | R$335,70 | R$839,70 |

*(valores exatos a confirmar)*

---

## Modelo de dados

### Tabela `payments` (nova)
| coluna | tipo | descricao |
|--------|------|-----------|
| `id` | uuid | chave primaria |
| `user_id` | uuid | quem pagou |
| `type` | text | `subscription` / `fichas` / `camarote` |
| `gateway_id` | text | ID do pagamento na AbacatePay |
| `method` | text | `pix` / `credit_card` |
| `amount` | numeric | valor cobrado |
| `status` | text | `pending` / `paid` / `failed` / `expired` |
| `metadata` | jsonb | dados extras (ciclo, plano, id resgatado, etc.) |
| `created_at` | timestamptz | - |
| `paid_at` | timestamptz | quando confirmou |

### Alteracoes na tabela `subscriptions`
- Renomear `cakto_order_id` para `gateway_order_id`
- Adicionar coluna `cycle` (text: `monthly` / `quarterly` / `semiannual` / `annual`)

---

## Interface do CheckoutModal

### Stepper (4 passos)
```
[1. Ciclo] -> [2. Pagamento] -> [3. Dados] -> [4. Confirmacao]
```
O passo 1 e exibido apenas para assinaturas.

### Passo 1 — Ciclo (so assinaturas)
Cards selecionaveis com borda vermelha no selecionado. Badge "Melhor desconto" no anual.

### Passo 2 — Forma de pagamento
Dois botoes: PIX e Cartao de credito.

### Passo 3a — PIX
QR code centralizado, botao "Copiar codigo PIX", timer regressivo de 15 minutos, spinner "Aguardando pagamento...". Frontend faz polling em `/api/payments/status/[id]` a cada 3 segundos.

### Passo 3b — Cartao
Formulario: numero do cartao, nome, validade, CVV. Botao vermelho com o valor.

### Passo 4 — Confirmacao
Check animado, descricao do produto ativado, botao "Continuar" fecha o modal.

### Identidade visual
- Fundo `#0F1117`, bordas `rgba(255,255,255,0.07)`
- Accent `#E11D48`, botao de acao com texto branco (#fff)
- Segue Dark Romantic v2

---

## Seguranca

- Webhook valida assinatura HMAC antes de processar qualquer acao
- Idempotencia: verifica se `gateway_id` ja foi processado antes de ativar produto
- API key e webhook secret somente em variaveis de ambiente (nunca no frontend)
- Todas as chamadas a AbacatePay feitas exclusivamente via API routes com service role

---

## Arquivos a modificar

- `src/app/planos/page.tsx` — abrir CheckoutModal ao clicar em plano
- `src/app/minha-assinatura/page.tsx` — renomear referencias a `cakto_order_id`
- `src/app/api/assinatura/cancelar/route.ts` — implementar cancelamento via AbacatePay API
- `src/app/api/webhooks/cakto/route.ts` — renomear para `abacatepay/route.ts`
- Loja de fichas — abrir CheckoutModal ao clicar em pacote de recarga
- Camarote Black — abrir CheckoutModal ao clicar em resgatar
