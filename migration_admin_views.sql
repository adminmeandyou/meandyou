-- =============================================
-- VIEWS DO PAINEL ADMIN
-- admin_users: lista unificada de usuários (profiles + users)
-- admin_metrics: métricas agregadas para o dashboard admin
-- Execute no Supabase SQL Editor
-- =============================================

-- ── admin_users ──────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_users
WITH (security_invoker = false)  -- SECURITY DEFINER: roda como owner, bypassa RLS
AS
SELECT
  p.id,
  p.name,
  u.email,
  p.plan,
  COALESCE(u.verified, false)                                        AS verified,
  COALESCE(u.banned, false)                                          AS banned,
  p.deleted_at,
  p.created_at,
  p.last_seen,
  u.nome_completo,
  p.city,
  p.gender,
  EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthdate))::integer         AS age,
  p.photo_best,
  p.photo_face,
  p.plan                                                             AS plan_name,
  NULL::text                                                           AS banned_reason,
  (
    SELECT COUNT(*)::integer
    FROM public.reports r
    WHERE r.reported_id = p.id
  )                                                                  AS reports_count,
  (
    SELECT COUNT(*)::integer
    FROM public.reports r
    WHERE r.reported_id = p.id
  )                                                                  AS reports_received
FROM public.profiles p
LEFT JOIN public.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- Permitir acesso apenas a usuários autenticados
-- (controle de acesso admin é feito no admin/layout.tsx)
GRANT SELECT ON public.admin_users TO authenticated;
REVOKE SELECT ON public.admin_users FROM anon;


-- ── admin_metrics ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_metrics
WITH (security_invoker = false)  -- SECURITY DEFINER: roda como owner, bypassa RLS
AS
SELECT
  -- Usuários totais (não banidos, não deletados)
  (SELECT COUNT(*)::integer FROM public.profiles
   WHERE deleted_at IS NULL AND COALESCE((SELECT banned FROM public.users WHERE id = profiles.id), false) = false
  )                                                                  AS total_users,

  -- Novos hoje
  (SELECT COUNT(*)::integer FROM public.profiles
   WHERE created_at >= CURRENT_DATE
  )                                                                  AS new_today,

  -- Total banidos
  (SELECT COUNT(*)::integer FROM public.users WHERE banned = true)   AS total_banned,

  -- Total excluídos
  (SELECT COUNT(*)::integer FROM public.profiles WHERE deleted_at IS NOT NULL) AS total_deleted,

  -- Verificados
  (SELECT COUNT(*)::integer FROM public.users WHERE verified = true) AS total_verified,

  -- Aguardando verificação (não verificados, não banidos, não deletados)
  (SELECT COUNT(*)::integer
   FROM public.users u
   JOIN public.profiles p ON p.id = u.id
   WHERE u.verified = false AND u.banned = false AND p.deleted_at IS NULL
  )                                                                  AS pending_verification,

  -- Online agora (ativos nos últimos 5 minutos)
  (SELECT COUNT(*)::integer FROM public.profiles
   WHERE last_seen >= NOW() - INTERVAL '5 minutes'
  )                                                                  AS online_now,

  -- Ativos hoje
  (SELECT COUNT(*)::integer FROM public.profiles
   WHERE last_seen >= CURRENT_DATE
  )                                                                  AS active_today,

  -- Por plano
  (SELECT COUNT(*)::integer FROM public.profiles WHERE plan = 'essencial') AS plan_essencial,
  (SELECT COUNT(*)::integer FROM public.profiles WHERE plan = 'plus')      AS plan_plus,
  (SELECT COUNT(*)::integer FROM public.profiles WHERE plan = 'black')     AS plan_black,

  -- Novos assinantes hoje (plano diferente de free, criado hoje)
  (SELECT COUNT(*)::integer FROM public.profiles
   WHERE plan NOT IN ('free', 'essencial') AND created_at >= CURRENT_DATE
  )                                                                  AS new_subscribers_today,

  -- Denúncias pendentes
  (SELECT COUNT(*)::integer FROM public.reports WHERE status = 'pending')  AS reports_pending,

  -- Denúncias resolvidas
  (SELECT COUNT(*)::integer FROM public.reports WHERE status = 'resolved') AS reports_resolved,

  -- Indicações totais
  (SELECT COUNT(*)::integer FROM public.referrals)                   AS referrals_total,

  -- Indicações convertidas (indicado fez cadastro = tem profile)
  (SELECT COUNT(*)::integer FROM public.referrals r
   JOIN public.profiles p ON p.id = r.referred_id
  )                                                                  AS referrals_converted;

-- Permitir acesso apenas a usuários autenticados
GRANT SELECT ON public.admin_metrics TO authenticated;
REVOKE SELECT ON public.admin_metrics FROM anon;
