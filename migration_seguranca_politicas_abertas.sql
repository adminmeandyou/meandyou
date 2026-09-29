-- ============================================================================
-- Remove políticas RLS que liberavam leitura/escrita para qualquer um (29/09/2026)
--
-- Achado no teste E2E: várias políticas chamadas "service role ..." foram criadas
-- para o papel `public` com USING (true). O service_role já ignora RLS, então elas só
-- serviam para abrir as tabelas para anon/authenticated (inclusive sem login).
-- Também remove as que deixavam o usuário editar o próprio calendário/streak: o
-- resgate (claim_streak_reward) usa reward_amount da tabela, então dava para
-- trocar o prêmio por 99999 e resgatar.
--
-- Escritas nessas tabelas continuam pelo servidor (service_role) e pelas RPCs
-- SECURITY DEFINER (update_daily_streak, claim_streak_reward, generate/extend_streak_calendar).
-- Idempotente.
-- ============================================================================

-- Abertas para todos (USING true)
drop policy if exists "service_role_all_bug"             on public.bug_reports;
drop policy if exists "system atualiza streak"           on public.daily_streaks;
drop policy if exists "Service role full access"         on public.friendships;
drop policy if exists "service_role_all_camp"            on public.marketing_campaigns;
drop policy if exists "service_role_all_notif"           on public.notification_settings;
drop policy if exists "service_role_full_access"         on public.notification_settings;
drop policy if exists "service_role_all_streak_calendar" on public.streak_calendar;
drop policy if exists "Service role full access"         on public.user_video_extra;
drop policy if exists "service role le para badges"      on public.bolo_reports;
drop policy if exists "messages_select_all"              on public.room_messages;

-- Usuário editando o próprio streak/calendário (fica só leitura; escrita via RPC)
drop policy if exists "daily_streaks_own"            on public.daily_streaks;
drop policy if exists "user_update_own_streak"       on public.daily_streaks;
drop policy if exists "streak_calendar_own"          on public.streak_calendar;
drop policy if exists "user resgata proprio premio"  on public.streak_calendar;

-- Membros de sala: a lista de salas precisa contar membros, mas só para quem está logado
drop policy if exists "members_select_all" on public.room_members;
drop policy if exists "members_select_authenticated" on public.room_members;
create policy "members_select_authenticated" on public.room_members
  for select to authenticated using (true);
