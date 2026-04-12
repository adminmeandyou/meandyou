# Checklist UX Writing — MeAndYou

Usar este checklist **antes de marcar qualquer arquivo como revisado**.
Verificar cada item linha a linha. Não avançar se qualquer ponto estiver pendente.

---

## Critérios obrigatórios (por arquivo)

- [ ] 1. **Ortografia e acentuação** — PT-BR correto, "email" sem hífen, sem erros tipográficos
- [ ] 2. **Sentence case** — Headings, títulos e labels: só a primeira palavra em maiúscula
- [ ] 3. **Botões** — Verbo no infinitivo: "Salvar", "Cancelar", "Buscar", "Confirmar", "Enviar"
- [ ] 4. **Labels** — Sem caps desnecessário: "Nome completo" (não "Nome Completo")
- [ ] 5. **Placeholders** — Padrão: "Digite...", "Selecione...", "Buscar..." conforme o tipo de campo
- [ ] 6. **Toasts de sucesso** — Sem ponto final: "Salvo com sucesso!" (não "Salvo com sucesso!.")
- [ ] 7. **Mensagens de erro** — Com ponto final: "Preencha todos os campos." ou sem ponto se for curto
- [ ] 8. **Estados vazios** — Padrão: "Nenhum X encontrado" ou "Ainda não há X"
- [ ] 9. **Dialogs de confirmação** — "Tem certeza?" + descrição do impacto da ação
- [ ] 10. **Em-dashes** — Zero `—` ou `–` em texto de UI (apenas em comentários de código é ok)
- [ ] 11. **Ellipsis** — Usar `...` (3 pontos normais), nunca `…` (caractere especial U+2026)

---

## Padrões de referência

| Tipo | Padrão correto | Errado |
|------|---------------|--------|
| Label de campo | "Nome completo" | "Nome Completo" / "NOME COMPLETO" |
| Placeholder texto | "Digite seu nome" | "nome..." / "Digite Nome" |
| Placeholder busca | "Buscar..." | "Buscar" / "buscar..." |
| Placeholder email | "seu@email.com" | "Digite seu e-mail" |
| Placeholder senha | "Mínimo 6 caracteres" | "senha" / "Digite senha" |
| Botão principal | "Salvar" / "Confirmar" | "SALVAR" / "salvar" |
| Botão loading | "Salvando..." | "Carregando" / "Wait..." |
| Toast sucesso | "Salvo com sucesso!" | "Salvo com sucesso!." |
| Mensagem erro | "Email inválido." | "email invalido" |
| Estado vazio | "Nenhuma conversa encontrada" | "No data" / "vazio" |
| Dialog confirm | "Tem certeza? Esta ação não pode ser desfeita." | "Confirmar?" |
