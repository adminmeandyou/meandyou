-- Migration: tabela de configurações de notificações para o painel admin
-- Usada por: /api/admin/notificacoes/settings (GET e POST)

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento            text        NOT NULL,
  canal             text        NOT NULL,
  ativo             boolean     NOT NULL DEFAULT true,
  webhook_url       text,
  dias_inatividade  integer,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento, canal)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Apenas service role acessa (admin usa service role via createAdminClient)
CREATE POLICY "service_role_full_access" ON public.notification_settings
  USING (true)
  WITH CHECK (true);
