# Checklist de lançamento — MeAndYou

Uma etapa por vez. Cada etapa concluída = commit local. Push só com ok do Leandro (push publica na Vercel).

## Etapas

- [x] 1. LGPD — levantar o que o app já tem e o que falta (termos, privacidade, cookies, consentimento, exclusão de conta, exportação de dados, dados sensíveis/biometria)
- [~] 2. LGPD — aplicar as correções levantadas na etapa 1
- [ ] 3. Auditoria de funcionalidades (fluxos principais: cadastro, verificação, perfil, discovery, match, chat, videochamada, planos/pagamento)
- [ ] 4. Correção dos erros encontrados na etapa 3
- [ ] 5. Auditoria visual / UI / UX (telas, responsividade, estados de loading/erro/vazio)
- [ ] 6. Correção dos problemas da etapa 5
- [ ] 7. Pré-publicação: build, variáveis de ambiente, segurança (checklist global), keep-alive Supabase, domínio
- [ ] 8. Publicar

## Registro

- 2026-09-25: checkpoint `f3d1450` salvo. Sessão anterior (subagentes em paralelo) travou e não deixou alterações de código.

## Etapa 1 — Achados LGPD (2026-09-25)

Já existe: /privacidade, /termos, /deletar-conta (apaga auth, fotos, documentos, mensagens, matches, likes etc.), link de privacidade no rodapé da landing, política cita direitos do art. 18 e DPO (adminmeandyou@proton.me). Bucket `documentos` é PRIVADO (ok). Nenhum script de analytics/pixel no layout (sem banner de cookies obrigatório por enquanto).

Problemas encontrados:

- L1 [ALTA] Cadastro (`src/app/cadastro/page.tsx` + `api/auth/cadastro`) não tem aceite de Termos/Privacidade nem confirmação de 18+. Não fica registrado quando/qual versão o usuário aceitou.
- L2 [ALTA] Verificação não pede consentimento explícito para biometria/documento (LGPD art. 11 exige consentimento específico e destacado). A política diz que ele é pedido, mas o código não pede.
- L3 [ALTA] Política diz que selfie/documento são "descartados após confirmação" e que "nenhuma imagem biométrica é transmitida". O que acontece de verdade: `api/upload-verificacao` grava frente, verso e selfie no bucket `documentos` sem prazo para apagar, e `confirmar-verificacao` não apaga nada. Ou o código passa a apagar, ou o texto muda. → DECISÃO
- L4 [MÉDIA] `upload-verificacao` monta `doc_frente_url`/`selfie_url` com URL `/object/public/` num bucket privado. O link não abre (o que é bom), mas está errado; o admin precisa usar URL assinada.
- L5 [ALTA] Operadores não informados na política: AbacatePay (gateway, recebe CPF), Google Cloud Vision (lê o documento), Sightengine (analisa as fotos), ipapi.co (recebe o IP), Cloudflare Turnstile/Calls, Brevo (se for usado). A política cita "Cloudflare (videochamada)" e "Resend", mas não os outros. Transferência internacional (EUA) precisa de menção explícita (art. 33).
- L6 [MÉDIA] Política diz que as fotos usam "URLs com expiração", mas o bucket `fotos` é público.
- L7 [MÉDIA] Não existe exportação/portabilidade de dados pelo próprio usuário (art. 18 V). Hoje só por e-mail. Aceitável no lançamento se o e-mail responder em 15 dias, mas o ideal é um botão "baixar meus dados".
- L8 [MÉDIA] "Última atualização" em /termos e /privacidade usa `new Date()`, então mostra sempre a data de hoje. Precisa ser uma data fixa.
- L9 [MÉDIA] Controlador sem identificação: falta razão social/CNPJ (ou nome e CPF do responsável) e endereço na política e nos termos. → DECISÃO (dados da empresa)
- L10 [BAIXA] Dados sensíveis coletados no perfil (religião em ValoresSection; orientação sexual, se existir) são dados sensíveis pelo art. 5 II, e a política não trata disso.
- L11 [BAIXA] Conferir se /deletar-conta cobre as tabelas novas (friendships, chat de amigos, salas, casal, backstage). Verificar na etapa 3.

## Decisões pendentes para o Leandro (responder no final)

- D1 (L3) Documentos/selfie de verificação: (a) apagar automaticamente após aprovar/reprovar [recomendado], ou (b) guardar por X dias pra revisão manual e dizer isso na política.
- D2 (L9) Dados do controlador: CNPJ/razão social ou pessoa física responsável, e endereço de contato.
- D3 (L7) Exportação de dados: botão no app agora, ou só por e-mail no lançamento.
- D4 Aplicar `migration_lgpd_aceite.sql` no Supabase de produção (aditiva, sem risco). Posso rodar eu mesmo se você autorizar.

## Etapa 2 — Correções LGPD (em andamento)

- [x] L8 data fixa "25 de setembro de 2026" em /termos e /privacidade
- [x] L1 checkbox obrigatório (18+ e aceite de Termos/Privacidade) no último passo do cadastro; API recusa sem aceite e grava `terms_accepted_at`, `terms_version`, `age_confirmed` em `users`. Enquanto a migration não for aplicada, o cadastro funciona normal e só loga erro.
  - PENDENTE D4: aplicar `migration_lgpd_aceite.sql` no Supabase (só adiciona 3 colunas).
- [x] L2 checkbox obrigatório de consentimento (CPF, documento, selfie/biometria, leitura automática) na tela "Seus dados" da verificação.
- [x] L12 (novo) rascunho da verificação (selfie base64 + CPF) saía no localStorage e ficava pra sempre; agora vai para o sessionStorage e o resto legado é apagado.

## !!! BLOQUEADOR DE LANÇAMENTO — S1 (achado em 2026-09-25)

Testado em produção com um usuário temporário (apagado logo depois): qualquer usuário logado, usando só a chave pública (anon) pelo navegador, consegue fazer UPDATE no próprio registro e mudar:
- `profiles.role = 'admin'` → vira admin completo (painel /admin, exportar usuários com CPF, injetar saldo)
- `profiles.plan` / `users.plan = 'black'` → plano pago de graça
- `profiles.verified` / `users.verified = true` → selo de verificado sem documento
- `profiles.banned` / `users.banned = false` → se desbane sozinho
Causa: a policy de UPDATE de `profiles`/`users` deixa o dono editar qualquer coluna.
Correção: migration com trigger que bloqueia essas colunas para quem não é service_role/admin (ver `migration_seguranca_colunas_protegidas.sql`). PRECISA SER APLICADA no Supabase antes de publicar (D5).
