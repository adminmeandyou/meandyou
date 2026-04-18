-- =============================================
-- SITE CONFIG + LANDING CONTENT — Fase 1 do PLANO_LANDING_ADMIN
-- Cria tabelas para gerenciar a landing, gate, obrigado e preços pelo /admin/site
-- Execute no Supabase SQL Editor
-- =============================================

-- ------------------------------------------------------------------
-- 1. Tabela site_config (singleton — uma única linha com id=1)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_config (
  id                       integer PRIMARY KEY DEFAULT 1,

  -- Modo do site
  modo_site                text    NOT NULL DEFAULT 'normal'
    CHECK (modo_site IN ('normal', 'lancamento', 'gated')),

  -- Lançamento
  lancamento_ativo         boolean NOT NULL DEFAULT false,
  lancamento_inicio        timestamptz,
  lancamento_fim           timestamptz,
  lancamento_desconto_pct  integer NOT NULL DEFAULT 0
    CHECK (lancamento_desconto_pct BETWEEN 0 AND 100),

  -- Gate de acesso
  gate_ativo               boolean NOT NULL DEFAULT false,
  gate_senha               text    NOT NULL DEFAULT '',
  gate_titulo              text    NOT NULL DEFAULT 'Em breve',
  gate_mensagem            text    NOT NULL DEFAULT 'Algo incrível está chegando.',

  -- Página /obrigado
  obrigado_titulo          text    NOT NULL DEFAULT 'Assinatura confirmada!',
  obrigado_mensagem        text    NOT NULL DEFAULT 'Seu acesso ao MeAndYou já está liberado. Aproveite a experiência completa.',
  obrigado_msg_essencial   text    NOT NULL DEFAULT 'Bem-vindo ao Essencial. Você já pode começar a usar a verificação e os filtros básicos.',
  obrigado_msg_plus        text    NOT NULL DEFAULT 'Plano Plus ativo. Aproveite ver quem curtiu você, filtros avançados e muito mais.',
  obrigado_msg_black       text    NOT NULL DEFAULT 'Plano Black ativo. Você tem acesso total: backstage, suporte prioritário e recursos exclusivos.',

  -- Preços dos planos
  preco_essencial          numeric(6,2) NOT NULL DEFAULT 14.90,
  preco_plus               numeric(6,2) NOT NULL DEFAULT 39.90,
  preco_black              numeric(6,2) NOT NULL DEFAULT 99.90,

  -- Auditoria
  updated_at               timestamptz  NOT NULL DEFAULT now(),
  updated_by               uuid,

  -- Trava de singleton: só permite id = 1
  CONSTRAINT site_config_singleton CHECK (id = 1)
);

-- ------------------------------------------------------------------
-- 2. Tabela landing_content (chave-valor por seção/página)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secao       text NOT NULL,
  chave       text NOT NULL,
  valor       text NOT NULL DEFAULT '',
  tipo        text NOT NULL DEFAULT 'texto'
    CHECK (tipo IN ('texto', 'texto_longo', 'imagem_url', 'booleano', 'numero')),
  pagina      text NOT NULL DEFAULT 'oficial'
    CHECK (pagina IN ('oficial', 'lancamento')),
  ordem       integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (secao, chave, pagina)
);

CREATE INDEX IF NOT EXISTS idx_landing_content_pagina_secao
  ON public.landing_content(pagina, secao, ordem);

-- ------------------------------------------------------------------
-- 3. RLS — site_config
--    Leitura anônima BLOQUEADA (tem gate_senha em texto simples).
--    Leitura pública segura é feita via view site_config_public.
--    Escrita apenas admin.
-- ------------------------------------------------------------------
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "site_config_admin_select" ON public.site_config
    FOR SELECT
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "site_config_admin_write" ON public.site_config
    FOR ALL
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------------
-- 4. View pública site_config_public — sem gate_senha
--    Leitura liberada para anon + authenticated.
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.site_config_public AS
SELECT
  id,
  modo_site,
  lancamento_ativo,
  lancamento_inicio,
  lancamento_fim,
  lancamento_desconto_pct,
  gate_ativo,
  gate_titulo,
  gate_mensagem,
  obrigado_titulo,
  obrigado_mensagem,
  obrigado_msg_essencial,
  obrigado_msg_plus,
  obrigado_msg_black,
  preco_essencial,
  preco_plus,
  preco_black,
  updated_at
FROM public.site_config;

GRANT SELECT ON public.site_config_public TO anon, authenticated;

-- ------------------------------------------------------------------
-- 5. RLS — landing_content
--    Leitura pública liberada (é conteúdo público da landing).
--    Escrita apenas admin.
-- ------------------------------------------------------------------
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "landing_content_public_read" ON public.landing_content
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "landing_content_admin_write" ON public.landing_content
    FOR ALL
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------------
-- 6. Trigger — atualiza updated_at em site_config
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.site_config_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_config_updated_at ON public.site_config;
CREATE TRIGGER trg_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW EXECUTE FUNCTION public.site_config_touch_updated_at();

CREATE OR REPLACE FUNCTION public.landing_content_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_content_updated_at ON public.landing_content;
CREATE TRIGGER trg_landing_content_updated_at
  BEFORE UPDATE ON public.landing_content
  FOR EACH ROW EXECUTE FUNCTION public.landing_content_touch_updated_at();

-- ------------------------------------------------------------------
-- 7. Seeds
-- ------------------------------------------------------------------

-- 7.1 — site_config: garantir a linha singleton (só insere se não existir)
INSERT INTO public.site_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 7.2 — landing_content: chaves básicas (oficial)
INSERT INTO public.landing_content (secao, chave, valor, tipo, pagina, ordem) VALUES
  ('hero', 'titulo',     'Encontre alguém real.',                                                                    'texto',       'oficial', 1),
  ('hero', 'subtitulo',  'Verificação com selfie, filtros sérios e conversas entre pessoas reais. Sem bots. Sem fakes.', 'texto_longo', 'oficial', 2),
  ('hero', 'cta_primario',   'Começar grátis',   'texto', 'oficial', 3),
  ('hero', 'cta_secundario', 'Ver planos',       'texto', 'oficial', 4),

  ('faq', 'p1', 'Como funciona a verificação?',                                                           'texto',       'oficial', 1),
  ('faq', 'r1', 'Você tira uma selfie no celular, a gente confirma que é você e libera o app. Leva menos de 2 minutos.', 'texto_longo', 'oficial', 2),
  ('faq', 'p2', 'Posso cancelar quando quiser?',                                                          'texto',       'oficial', 3),
  ('faq', 'r2', 'Sim, sem multa. O cancelamento vale do próximo ciclo em diante.',                          'texto_longo', 'oficial', 4),
  ('faq', 'p3', 'Meus dados estão seguros?',                                                              'texto',       'oficial', 5),
  ('faq', 'r3', 'Seguimos a LGPD. Você pode pedir a exclusão total da sua conta a qualquer momento pela página de privacidade.', 'texto_longo', 'oficial', 6)
ON CONFLICT (secao, chave, pagina) DO NOTHING;

-- 7.3 — landing_content: chaves básicas (lançamento)
INSERT INTO public.landing_content (secao, chave, valor, tipo, pagina, ordem) VALUES
  ('hero', 'titulo',     'Entre antes de todo mundo.',                                                              'texto',       'lancamento', 1),
  ('hero', 'subtitulo',  'Condição especial de lançamento. Emblema de Fundador vitalício para quem assinar agora.',   'texto_longo', 'lancamento', 2),
  ('hero', 'cta_primario',   'Garantir minha vaga', 'texto', 'lancamento', 3),
  ('hero', 'cta_secundario', 'Ver planos',          'texto', 'lancamento', 4)
ON CONFLICT (secao, chave, pagina) DO NOTHING;

-- =============================================
-- Critério de pronto:
--   SELECT * FROM public.site_config;                 -- 1 linha
--   SELECT * FROM public.site_config_public;          -- 1 linha (sem gate_senha)
--   SELECT count(*) FROM public.landing_content;      -- 14+ linhas (10 oficial + 4 lancamento)
-- =============================================
