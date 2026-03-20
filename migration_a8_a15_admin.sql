-- migration_a8_a15_admin.sql
-- A8: tabelas para marketing admin (historico de campanhas + configuracoes de notificacao)
-- A15: views admin_users e admin_metrics para o painel admin

-- A8: marketing_campaigns

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo               text        NOT NULL,
  corpo                text,
  segmento             text        NOT NULL DEFAULT 'todos',
  total_destinatarios  int         NOT NULL DEFAULT 0,
  status               text        NOT NULL DEFAULT 'enviado',
  created_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only" ON marketing_campaigns
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid() AND active = true)
  );

-- A8: notification_settings

CREATE TABLE IF NOT EXISTS notification_settings (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento            text        NOT NULL,
  canal             text        NOT NULL,
  ativo             boolean     NOT NULL DEFAULT false,
  webhook_url       text,
  dias_inatividade  int,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento, canal)
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only" ON notification_settings
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid() AND active = true)
  );

INSERT INTO notification_settings (evento, canal, ativo) VALUES
  ('new_user',          'email',    true),
  ('new_user',          'whatsapp', false),
  ('payment_approved',  'email',    true),
  ('payment_approved',  'whatsapp', false),
  ('plan_cancelled',    'email',    true),
  ('plan_cancelled',    'whatsapp', false),
  ('user_inactive',     'email',    false),
  ('user_inactive',     'whatsapp', false),
  ('new_match',         'email',    false),
  ('new_match',         'whatsapp', false)
ON CONFLICT (evento, canal) DO NOTHING;

-- A15: views

DROP VIEW IF EXISTS admin_users;
DROP VIEW IF EXISTS admin_metrics;

CREATE VIEW admin_metrics AS
SELECT
  COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND COALESCE(u.banned, false) = false)   AS total_users,
  COUNT(*) FILTER (WHERE p.created_at >= now() - interval '1 day')                     AS new_today,
  COUNT(*) FILTER (WHERE COALESCE(u.banned, false) = true)                             AS total_banned,
  COUNT(*) FILTER (WHERE p.deleted_at IS NOT NULL)                                     AS total_deleted,
  COUNT(*) FILTER (WHERE COALESCE(u.verified, false) = true)                           AS total_verified,
  COUNT(*) FILTER (
    WHERE COALESCE(u.verified, false) = false
      AND COALESCE(u.banned, false) = false
      AND p.deleted_at IS NULL
  )                                                                                     AS pending_verification,
  COUNT(*) FILTER (WHERE p.last_seen >= now() - interval '5 minutes')                  AS online_now,
  COUNT(*) FILTER (WHERE p.last_seen >= now() - interval '1 day')                      AS active_today,
  COUNT(*) FILTER (WHERE p.plan = 'essencial')                                         AS plan_essencial,
  COUNT(*) FILTER (WHERE p.plan = 'plus')                                              AS plan_plus,
  COUNT(*) FILTER (WHERE p.plan = 'black')                                             AS plan_black,
  COUNT(*) FILTER (
    WHERE p.plan IN ('essencial', 'plus', 'black')
      AND p.created_at >= now() - interval '1 day'
  )                                                                                     AS new_subscribers_today,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending')                               AS reports_pending,
  (SELECT COUNT(*) FROM reports WHERE status = 'resolved')                              AS reports_resolved,
  COALESCE((SELECT COUNT(*) FROM referrals), 0)                                         AS referrals_total,
  COALESCE((SELECT COUNT(*) FROM referrals WHERE status = 'rewarded'), 0)               AS referrals_converted
FROM profiles p
LEFT JOIN users u ON u.id = p.id;

CREATE VIEW admin_users AS
SELECT
  p.id,
  p.name,
  u.email,
  p.plan,
  COALESCE(u.verified, false)                                         AS verified,
  COALESCE(u.banned, false)                                           AS banned,
  p.deleted_at,
  p.created_at,
  p.last_seen                                                         AS last_active_at,
  p.banned_reason,
  p.city,
  EXTRACT(YEAR FROM AGE(now(), p.birthdate::date))::int               AS age,
  p.gender,
  p.photo_best,
  (SELECT COUNT(*) FROM reports r WHERE r.reported_id = p.id)        AS reports_count
FROM profiles p
LEFT JOIN users u ON u.id = p.id;
