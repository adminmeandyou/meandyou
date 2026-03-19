# Tarefas MeAndYou — Registro de Correções

> Apagar cada item quando estiver resolvido. Organizado por prioridade.

---

## 🔴 CRÍTICO — Quebra funcionalidade principal

- [ ] **Loja: compra não desconta fichas nem atualiza saldo** — verificar RPC `spend_fichas` no Supabase; garantir que o frontend chama corretamente e atualiza saldo após compra
- [ ] **Roleta: para de uma vez (sem desaceleração)** — animação precisa de easing de desaceleração gradual
- [ ] **Roleta: erro "tente novamente" aparece ao girar** — investigar e corrigir a chamada de API/RPC da roleta
- [ ] **Roleta: não mostra o prêmio ganho** — exibir resultado do prêmio após parar
- [ ] **Roleta: "Ganhar via streak" não faz nada** — corrigir o botão/função de resgate via streak
- [ ] **Perfil: redireciona para onboarding ao clicar em Perfil** — corrigir verificação de onboarding; perfil deve abrir pré-visualização
- [ ] **Logo MeAndYou: redireciona para onboarding** — deve redirecionar para home do dashboard
- [ ] **Perfil: imagem não aparece na pré-visualização** — corrigir exibição da foto de perfil

---

## 🟠 IMPORTANTE — Funcionalidades vendidas que precisam existir

- [ ] **Boost: implementar funcionalidade real** — quem usou boost aparece na frente dos sem boost; entre boosts, quem usou por último fica no topo; ninguém vê que está com boost
- [ ] **Superlike: implementar funcionalidade** — notifica a pessoa com destaque especial
- [ ] **Lupa (ver quem curtiu): implementar funcionalidade**
- [ ] **Desfazer curtida: implementar funcionalidade**
- [ ] **Modo Fantasma: implementar funcionalidade** — fica invisível na busca/descobrir
- [ ] **Bônus de XP: implementar funcionalidade** — multiplicador de XP por tempo
- [ ] **Selo verificado: implementar** — ao comprar/conquistar, ganha automaticamente emblema de verificado
- [ ] **Caixa Super Lendária: implementar animação de abertura** — caixa treme, salta, explode, aparece o prêmio aleatório
- [ ] **Streak → renomear para "Prêmios diários" em todo o app**
- [ ] **Streak: RPC `claim_streak_reward` não credita saldo** — verificar e corrigir

---

## 🟡 AJUSTES DE FUNCIONALIDADE

- [ ] **Perfil: substituir tela de edição por pré-visualização + edição inline** — mostrar perfil como outras pessoas veem; botões de editar foto, bio, tags, emblemas, características ao lado
- [ ] **Loja: itens com tempo — exibir contador de expiração** — buscar `curtidas_reveals_until` e `xp_bonus_until` do perfil e mostrar countdown
- [ ] **Loja: mochila — comportamento toggle** — quando mochila está aberta, ocultar seção de pacotes de fichas; pacotes só aparecem quando mochila fechada ou ao clicar em "Adquirir fichas"
- [ ] **Loja: Boost — remover da loja** — mover para dashboard acima dos cards; se tiver boost ativo, mostrar botão de usar; se não tiver, mostrar CTA "Dê um boost agora e apareça para mais pessoas"
- [ ] **Loja: Pacote Lendário — reduzir exagero visual** — remover exibição de "economiza X" e "valeria Y"
- [ ] **Loja: Caixa Super Lendária — ajustes** — badge dourado "Promoção Exclusiva" (substituir "Melhor deal"); preço = R$ 174,62; bônus variável (20-70% de fichas); quantidade de caixas variável (1 ou 2)
- [ ] **Loja: Caixa Super Lendária — aparecer só em períodos estratégicos** — semana de pagamento = aparece quase todos os dias; fora da semana = aparece aleatório, dura 6h com contador regressivo
- [ ] **Emblemas: painel do usuário** — mostrar só emblemas que o usuário TEM (sem cadeado); permitir ativar/desativar; escolher 3 para exibir no perfil; demais ficam em "Ver todos os emblemas"
- [ ] **Emblemas: admin — corrigir envio automático** — emblema criado no painel admin com condição de data de cadastro não está sendo enviado; deixar funcional

---

## 🔵 SALAS DE BATE-PAPO (redesign completo)

- [ ] **Renomear "Salas Sociais" para "Salas de Bate-papo"**
- [ ] **Salas públicas: Bate-papo 1 ao 20, limite 20 pessoas por sala**
- [ ] **Salas privadas: criadas por usuários, nome customizável, limite 10 pessoas**
- [ ] **Salas Black: limite 20 pessoas**
- [ ] **Modo apenas texto (sem áudio/vídeo)**
- [ ] **Anti-flood/spam: limite de mensagens por tempo**
- [ ] **Nome fantasia ao entrar na sala** — ex: Queijo40, Moranguinho35
- [ ] **Ver perfil: requer solicitação** — A pede para ver perfil de B; B aceita/ignora/recusa; sem resposta em 3min = cancelado; se recusado, A não pode reenviar até B desbloquear ou B convidar A
- [ ] **Chat privado: requer solicitação** — mesma lógica de aceitar/ignorar/recusar com timeout de 3min
- [ ] **Bloquear e silenciar usuário dentro da sala**
- [ ] **Filtro de palavras proibidas** — bloquear automático em chat, nomes de salas e qualquer campo do site
- [ ] **Alerta automático ao suporte** — palavras que remetem a abuso, pornografia infantil, crimes devem alertar suporte mesmo sem denúncia
- [ ] **Emoticons permitidos no chat**
- [ ] **Criar design da tela de conversa das salas**
- [ ] **Testar e garantir funcionamento completo das salas**

---

## 🟣 NOVAS FEATURES

- [ ] **Perfil de casal (plano Black + fetiche/BDSM ativo)** — dois usuários se vinculam; aparecem como um card de casal no match (estilo leque de cartas); parceiro precisa ter plano ativo; desconto de 50% para o parceiro enquanto vínculo ativo; perda do desconto na próxima renovação se desvincular
- [ ] **Adicionar pessoa após match** — botão de adicionar como amigo independente do modo (descobrir, busca, match do dia)
- [ ] **Campo "Amigos online"** — exibir amigos que estão online no momento
- [ ] **Match do dia: garantir algoritmo funcionando** — compatibilidade mútua (A busca o que B tem e vice-versa); mínimo 59% de compatibilidade para aparecer; exibir "X% de acordo com o que você procura" + CTA de conversa

---

## ⚪ ESCLARECIMENTOS / DEFINIÇÕES

- [ ] **Busca vs Descobrir: diferenciar claramente** — Descobrir = estilo Tinder (só filtro de idade e localização); Busca = filtros avançados completos (todos os filtros existentes)

---

## ✅ CONCLUÍDO

_(itens resolvidos serão movidos aqui antes de serem apagados)_
