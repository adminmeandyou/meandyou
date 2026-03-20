# Registro de Correções e Funcionalidades Pendentes

## Como usar
- Cada item tem um ID para referência
- Quando resolvido: mover para seção "Concluídos" no final
- Ordem de execução: de cima para baixo dentro de cada prioridade

---

## 🔴 CRÍTICO

### C1 — Perfil: edição inline no próprio perfil
- Clicar em "Perfil" na nav mostra a pré-visualização (como outras pessoas veem) — redirect corrigido
- Falta: botões de edição inline por seção (fotos, bio, tags, emblemas, características) direto na pré-visualização

### ~~C3 — Roleta: não toca som de efeito ao girar/parar~~ ✅
- Sons implementados via Web Audio API (sem arquivos externos): ticks ao iniciar, jingle ao ganhar (jackpot = jingle mais épico)

---

## 🟠 ALTA PRIORIDADE

### ~~A3 — Boost: CTA no dashboard~~ ✅
- Banner acima dos cards na tela de swipe: se boost ativo mostra contador; se não, CTA "Dar um boost" → /loja

### A4 — Boost: funcionalidade real
- Ao ativar boost, o perfil deve aparecer no TOPO da fila para os outros usuários
- Com múltiplos boosts ativos: quem ativou mais recentemente aparece primeiro
- Quem não tem boost aparece depois de todos com boost (mas o usuário não sabe, vê normalmente)

### A6 — Emblemas: painel do próprio perfil
- Usuário deve ver APENAS os emblemas que possui (sem cadeado)
- Pode ativar/desativar cada emblema (visibilidade)
- Apenas 3 emblemas ficam visíveis no perfil público
- Os demais ficam ocultos e só aparecem se a pessoa clicar em "Ver todos os emblemas"

### A7 — Emblemas: painel admin não está funcionando
- Emblema criado no painel admin não aparece na loja/perfil
- Função de "enviar para quem se cadastrou antes da data X" não está executando
- Código pronto — depende de rodar `migration_badges_painel.sql` no Supabase

---

## 🟡 MÉDIA PRIORIDADE

### M1 — Funcionalidades da loja que precisam existir de verdade

#### M1a — Superlike
- Quando usa superlike, a pessoa recebe notificação destacada
- Aparece com indicador especial no feed da outra pessoa

#### ~~M1b — Lupa (ver quem curtiu)~~ ✅
- `usePlan` agora busca saldo de `user_lupas` e seta `canSeeWhoLiked=true` se tiver lupa no inventário

#### ~~M1c — Desfazer curtida~~ ✅
- `lastSwipe` state rastreia último swipe; botão Voltar deleta o like do banco e decrementa contador

#### ~~M1d — Fantasma (modo invisível)~~ ✅
- `useSearch` e `loadDeck` filtram profiles com `ghost_mode_until > now()` após a RPC

#### M1e — Bônus de XP
- Quando ativo (`xp_bonus_until` setado), multiplicador de XP em todas as ações por X horas
- Verificar se a RPC `award_xp` já aplica o bônus ou se precisa passar o multiplicador pelo frontend

#### ~~M1f — Selo verificado~~ ✅
- Ao comprar `verified_plus`, agora também concede automaticamente o emblema de Identidade Verificada (busca por `condition_type=on_verify` nos badges)

#### M1g — Caixa Super Lendária
- Ao clicar para abrir: animação da caixa tremendo → salto → explosão
- Exibe o prêmio ganho (item aleatório do pool)
- Prêmio vai direto para o inventário

### M2 — Salas de Bate-Papo (redesign completo)

- [x] Renomear "Salas Sociais" para "Salas de Bate-papo" (busca/page.tsx:765)
- [ ] Salas públicas: Bate-papo 1 ao 20, limite 20 pessoas por sala
- [ ] Salas privadas: criadas por usuários, nome customizável, limite 10 pessoas
- [ ] Salas Black: limite 20 pessoas
- [ ] Modo apenas texto (sem áudio/vídeo)
- [ ] Anti-flood/spam: limite de mensagens por tempo (ex: 3 msgs/10s)
- [ ] Nome fantasia ao entrar na sala (ex: Queijo40, Moranguinho35)
- [ ] Ver perfil: requer solicitação — A pede para ver B; B aceita/ignora/recusa; expira em 3min; se recusado, A não pode reenviar até B desbloquear
- [ ] Chat privado: requer solicitação — mesma lógica com timeout de 3min
- [ ] Bloquear e silenciar usuário dentro da sala
- [ ] Filtro de palavras proibidas em chat, nomes de salas e qualquer campo
- [ ] Alerta automático ao suporte para palavras de abuso, pornografia infantil, crimes
- [ ] Emoticons permitidos no chat
- [ ] Criar design da tela de conversa das salas
- [ ] Testar e garantir funcionamento completo das salas

### M3 — Plano Black: perfil de casal
- Usuário Black pode configurar parceiro(a) com conta ativa
- Parceiro(a) recebe 50% de desconto enquanto perfil duplo estiver ativo
- Card no feed aparece como "casal" (dois perfis em leque/sobrepostos)
- Ao clicar: ver perfil de um e depois do outro
- Parceiro também precisa ter plano ativo para manter o desconto

### M4 — Sistema de amigos / adicionar pessoa
- Após um match (em qualquer modo), opção de "Adicionar como amigo"
- Seção "Amigos online" visível em alguma parte do app

### ~~M5 — Match do dia: garantir algoritmo funcionando~~ ✅
- Compatibilidade mútua implementada (média das duas direções)
- Filtro >= 59% aplicado antes de exibir
- CTA "Curtir e tentar conversar →" para bons matches

---

## 🔵 BAIXO / INFRAESTRUTURA

### B1 — Banco: RPC spend_fichas precisa ser verificada
- Se a compra não funciona mesmo com código correto, a RPC no Supabase está errada
- Verificar: parâmetros, retorno, RLS policies

### B2 — Banco: RPC claim_streak_reward precisa creditar corretamente
- Ao resgatar recompensa de streak, o saldo não é atualizado nas tabelas corretas

### B3 — Moderação de conteúdo global
- Filtro de palavras proibidas em: chat, nome de sala, bio, tags, qualquer campo de texto
- Integrar lista de palavras-chave críticas com alerta automático ao suporte

---

## ✅ Concluídos

- [x] Logo MeAndYou redirecionava para onboarding — corrigido (commit 06a74c1)
- [x] Dashboard: redirecionava para onboarding — removida dependência da coluna `onboarding_done` que não existia (commit 06a74c1)
- [x] Perfil: redireciona para onboarding ao clicar em Perfil — removida coluna `onboarding_done` do SELECT (commit 06a74c1)
- [x] Perfil: imagem não aparecia na pré-visualização — trocado `className="object-cover"` por `style={{ objectFit: 'cover' }}`; adicionado `priority` no hero (commit 06a74c1)
- [x] Loja: compra não descontava fichas — corrigido mismatch de item_key entre frontend e backend; API reescrita (commit 06a74c1)
- [x] Loja: Boost removido da loja — não aparece mais como item comprável (commit 06a74c1)
- [x] Loja: mochila oculta fichas quando aberta — tabs e conteúdo somem quando mochila está aberta (commit 06a74c1)
- [x] Loja: Pacote Lendário redesign — sem "economize/valeria", badge "PROMOÇÃO EXCLUSIVA", preço R$ 174,62, bônus variável 20-70%, caixas variáveis 1-2, aparece só em semanas de pagamento ou slot de 6h (commit 06a74c1)
- [x] Loja: mochila — itens com tempo (Ver curtidas + Bônus XP) — `curtidas_reveals_until` e `xp_bonus_until` com countdown na mochila
- [x] Roleta: parava de uma vez sem desaceleração — adicionado `animateDecelerate` (commit 06a74c1)
- [x] Roleta: erro "tente novamente" sem animação — agora desacelera antes de mostrar toast de erro (commit 06a74c1)
- [x] Roleta: não mostrava o prêmio ganho — corrigido handling de `data[0]` vs `data` no retorno do RPC (commit 06a74c1)
- [x] "Streak" renomeado para "Prêmios diários" — em roleta, streak/page.tsx e AppShell (commit 06a74c1)
- [x] next.config.ts: imagens Supabase não apareciam — adicionado remotePatterns para domínio do Supabase (commit 06a74c1)
- [x] Match do Dia — score de compatibilidade: badge "X% de acordo com o que voce procura", borda accent e CTA para perfis >= 60%
- [x] Modo Busca — filtro client-side por compatibilidade (AND entre categorias, OR dentro de cada categoria)
- [x] Busca vs Descobrir: diferenciados — Descobrir mostra aviso e oculta filtros avançados; Busca exibe todas as categorias
- [x] Seções de editar perfil não abriam — `filtersData &&` bloqueava render para usuários novos
- [x] Barra de completude não avancava — `filtersData` nunca atualizado no estado após salvar
- [x] Revelação gradual removida de editar-perfil e perfil/[id]
- [x] Sistema de XP: awardXp chamado em like, dislike, superlike, match, mensagem, login diário, foto aprovada, compra na loja, perfil 100%
