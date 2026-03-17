-- Função para gerar o calendário mensal de streak automaticamente
-- Chame esta função ou use o trigger abaixo para criar o calendário do mês para cada usuário

CREATE OR REPLACE FUNCTION generate_streak_calendar(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_day integer;
  v_reward_type text;
  v_reward_amount integer;
  v_exists integer;
BEGIN
  -- Verifica se já existe calendário para este usuário
  SELECT COUNT(*) INTO v_exists FROM streak_calendar WHERE user_id = p_user_id;
  IF v_exists > 0 THEN RETURN; END IF;

  -- Gera 60 dias de recompensas
  FOR v_day IN 1..60 LOOP
    -- Lógica de recompensas por faixa (interna, não visível ao usuário)
    IF v_day >= 30 THEN
      -- Fase lendária: mistura itens bons
      CASE (v_day % 8)
        WHEN 0 THEN v_reward_type := 'boost';        v_reward_amount := 1;
        WHEN 1 THEN v_reward_type := 'supercurtida'; v_reward_amount := 3;
        WHEN 2 THEN v_reward_type := 'ticket';       v_reward_amount := 5;
        WHEN 3 THEN v_reward_type := 'lupa';         v_reward_amount := 2;
        WHEN 4 THEN v_reward_type := 'supercurtida'; v_reward_amount := 5;
        WHEN 5 THEN v_reward_type := 'rewind';       v_reward_amount := 3;
        WHEN 6 THEN v_reward_type := 'ticket';       v_reward_amount := 10;
        ELSE       v_reward_type := 'invisivel_1d';  v_reward_amount := 1;
      END CASE;
    ELSIF v_day >= 21 THEN
      CASE (v_day % 6)
        WHEN 0 THEN v_reward_type := 'supercurtida'; v_reward_amount := 2;
        WHEN 1 THEN v_reward_type := 'ticket';       v_reward_amount := 3;
        WHEN 2 THEN v_reward_type := 'boost';        v_reward_amount := 1;
        WHEN 3 THEN v_reward_type := 'lupa';         v_reward_amount := 1;
        WHEN 4 THEN v_reward_type := 'ticket';       v_reward_amount := 4;
        ELSE       v_reward_type := 'rewind';        v_reward_amount := 2;
      END CASE;
    ELSIF v_day >= 14 THEN
      CASE (v_day % 5)
        WHEN 0 THEN v_reward_type := 'ticket';       v_reward_amount := 2;
        WHEN 1 THEN v_reward_type := 'supercurtida'; v_reward_amount := 1;
        WHEN 2 THEN v_reward_type := 'ticket';       v_reward_amount := 3;
        WHEN 3 THEN v_reward_type := 'lupa';         v_reward_amount := 1;
        ELSE       v_reward_type := 'rewind';        v_reward_amount := 1;
      END CASE;
    ELSIF v_day >= 7 THEN
      CASE (v_day % 4)
        WHEN 0 THEN v_reward_type := 'ticket';       v_reward_amount := 2;
        WHEN 1 THEN v_reward_type := 'supercurtida'; v_reward_amount := 1;
        WHEN 2 THEN v_reward_type := 'ticket';       v_reward_amount := 1;
        ELSE       v_reward_type := 'lupa';          v_reward_amount := 1;
      END CASE;
    ELSE
      -- Dias 1-6: maioria tickets
      IF v_day % 3 = 0 THEN
        v_reward_type := 'supercurtida'; v_reward_amount := 1;
      ELSE
        v_reward_type := 'ticket'; v_reward_amount := 1;
      END IF;
    END IF;

    INSERT INTO streak_calendar (user_id, day_number, reward_type, reward_amount, claimed)
    VALUES (p_user_id, v_day, v_reward_type, v_reward_amount, false)
    ON CONFLICT (user_id, day_number) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gerar calendário para todos os usuários existentes que ainda não têm
DO $$
DECLARE
  v_user record;
BEGIN
  FOR v_user IN SELECT id FROM profiles LOOP
    PERFORM generate_streak_calendar(v_user.id);
  END LOOP;
END;
$$;
