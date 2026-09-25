# Checklist de lançamento — MeAndYou

Uma etapa por vez. Cada etapa concluída = commit local. Push só com ok do Leandro (push publica na Vercel).

## Etapas

- [ ] 1. LGPD — levantar o que o app já tem e o que falta (termos, privacidade, cookies, consentimento, exclusão de conta, exportação de dados, dados sensíveis/biometria)
- [ ] 2. LGPD — aplicar as correções levantadas na etapa 1
- [ ] 3. Auditoria de funcionalidades (fluxos principais: cadastro, verificação, perfil, discovery, match, chat, videochamada, planos/pagamento)
- [ ] 4. Correção dos erros encontrados na etapa 3
- [ ] 5. Auditoria visual / UI / UX (telas, responsividade, estados de loading/erro/vazio)
- [ ] 6. Correção dos problemas da etapa 5
- [ ] 7. Pré-publicação: build, variáveis de ambiente, segurança (checklist global), keep-alive Supabase, domínio
- [ ] 8. Publicar

## Registro

- 2026-09-25: checkpoint `f3d1450` salvo. Sessão anterior (subagentes em paralelo) travou e não deixou alterações de código.
