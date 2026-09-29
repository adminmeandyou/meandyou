-- ============================================================================
-- Funções SECURITY DEFINER só do servidor deixam de ser chamáveis pelo navegador (29/09/2026)
-- Achado no teste E2E: 45 funções que recebem o ID do usuário estavam liberadas para
-- anon/authenticated. Ex.: activate_subscription (plano grátis), credit_fichas /
-- increment_user_balance (saldo infinito), ban_user (banir qualquer um), award_xp,
-- spin_roleta/claim_streak_reward/activate_boost em nome de outra pessoa.
-- Mantidas: as que o navegador usa (já passam por porteira que exige ID = usuário
-- logado, ver migration_seguranca_rpcs_usuario.sql), meandyou_is_staff (usada pelos
-- triggers de proteção) e is_user_banned. O servidor usa service_role e segue igual.
-- Idempotente.
-- ============================================================================

revoke execute on function public._credit_item(uuid, text, integer) from public, anon, authenticated;
grant execute on function public._credit_item(uuid, text, integer) to service_role;
revoke execute on function public.activate_access_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.activate_access_request(uuid, uuid, text) to service_role;
revoke execute on function public.activate_boost(uuid) from public, anon, authenticated;
grant execute on function public.activate_boost(uuid) to service_role;
revoke execute on function public.activate_ghost_mode(uuid, integer) from public, anon, authenticated;
grant execute on function public.activate_ghost_mode(uuid, integer) to service_role;
revoke execute on function public.activate_subscription(uuid, text, text) from public, anon, authenticated;
grant execute on function public.activate_subscription(uuid, text, text) to service_role;
revoke execute on function public.award_xp(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.award_xp(uuid, text, integer) to service_role;
revoke execute on function public.ban_user(uuid) from public, anon, authenticated;
grant execute on function public.ban_user(uuid) to service_role;
revoke execute on function public.check_video_limit(uuid) from public, anon, authenticated;
grant execute on function public.check_video_limit(uuid) to service_role;
revoke execute on function public.claim_streak_reward(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_streak_reward(uuid, integer) to service_role;
revoke execute on function public.create_report(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_report(uuid, uuid, text, text) to service_role;
revoke execute on function public.credit_boosts(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_boosts(uuid, integer, text, text) to service_role;
revoke execute on function public.credit_fichas(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.credit_fichas(uuid, integer, text) to service_role;
revoke execute on function public.credit_fichas(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_fichas(uuid, integer, text, text) to service_role;
revoke execute on function public.credit_lupas(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_lupas(uuid, integer, text, text) to service_role;
revoke execute on function public.credit_rewinds(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_rewinds(uuid, integer, text, text) to service_role;
revoke execute on function public.credit_superlikes(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_superlikes(uuid, integer, text, text) to service_role;
revoke execute on function public.ensure_balance_rows(uuid) from public, anon, authenticated;
grant execute on function public.ensure_balance_rows(uuid) to service_role;
revoke execute on function public.entrar_sala(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.entrar_sala(uuid, uuid, text) to service_role;
revoke execute on function public.extend_streak_calendar(uuid) from public, anon, authenticated;
grant execute on function public.extend_streak_calendar(uuid) to service_role;
revoke execute on function public.generate_streak_calendar(uuid) from public, anon, authenticated;
grant execute on function public.generate_streak_calendar(uuid) to service_role;
revoke execute on function public.increment_user_balance(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.increment_user_balance(text, uuid, integer) to service_role;
revoke execute on function public.register_video_minutes(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.register_video_minutes(uuid, uuid, integer) to service_role;
revoke execute on function public.register_video_minutes(uuid, integer) from public, anon, authenticated;
grant execute on function public.register_video_minutes(uuid, integer) to service_role;
revoke execute on function public.reward_referral(uuid) from public, anon, authenticated;
grant execute on function public.reward_referral(uuid) to service_role;
revoke execute on function public.send_chat_message(uuid, uuid, text, integer, interval) from public, anon, authenticated;
grant execute on function public.send_chat_message(uuid, uuid, text, integer, interval) to service_role;
revoke execute on function public.spend_fichas(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.spend_fichas(uuid, integer, text) to service_role;
revoke execute on function public.spin_roleta(uuid) from public, anon, authenticated;
grant execute on function public.spin_roleta(uuid) to service_role;
revoke execute on function public.update_streak(uuid) from public, anon, authenticated;
grant execute on function public.update_streak(uuid) to service_role;
revoke execute on function public.update_streak_on_login(uuid) from public, anon, authenticated;
grant execute on function public.update_streak_on_login(uuid) to service_role;
revoke execute on function public.use_superlike(uuid, uuid) from public, anon, authenticated;
grant execute on function public.use_superlike(uuid, uuid) to service_role;
