-- ═══════════════════════════════════════════════════════════════════════════
-- HunterFit — Seed Data (Perfil Base da Spec — seção 1.3)
-- ═══════════════════════════════════════════════════════════════════════════

-- Usuário fundador (dados de desenvolvimento/testes)
INSERT INTO users (id, email, password_hash, name, height_cm, tdee_current_estimate, caloric_deficit_target)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'igor@hunterfit.dev',
    '$2a$12$REPLACE_WITH_BCRYPT_HASH', -- bcrypt("hunter123")
    'Igor',
    193.00,
    2900,
    400
);

-- Hunter Profile inicial (Rank E, Nível 1)
INSERT INTO hunter_profiles (user_id, hunter_rank, hunter_level, hunter_class)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'E',
    1,
    'Balance Warrior'
);

-- Streaks iniciais (zerados)
INSERT INTO streaks (user_id, streak_type) VALUES
    ('00000000-0000-0000-0000-000000000001', 'workout'),
    ('00000000-0000-0000-0000-000000000001', 'diet'),
    ('00000000-0000-0000-0000-000000000001', 'cardio'),
    ('00000000-0000-0000-0000-000000000001', 'water');

-- 17 Grupos musculares com rank inicial Untrained
INSERT INTO muscle_ranks (user_id, muscle_group, muscle_name_pt, muscle_rank, muscle_rank_numeric)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'chest',       'Peito',                   'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'back_lat',    'Costas (Lat)',             'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'back_mid',    'Costas (Mid)',             'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'shoulders',   'Ombros',                  'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'biceps',      'Bíceps',                  'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'triceps',     'Tríceps',                 'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'forearms',    'Antebraços',              'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'quads',       'Quadríceps',              'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'hamstrings',  'Isquiotibiais',           'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'glutes',      'Glúteos',                 'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'calves',      'Panturrilha',             'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'abs',         'Abdômen',                 'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'obliques',    'Oblíquos',                'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'traps',       'Trapézio',                'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'neck',        'Pescoço',                 'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'hip_flexors', 'Flexores do Quadril',     'Untrained', 0),
    ('00000000-0000-0000-0000-000000000001', 'cardio',      'Cardio (AGI)',             'Untrained', 0);

-- Plano de treino PPL + Upper/Lower (baseado na spec seção 1.3)
INSERT INTO workout_plans (id, user_id, name) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PPL + Upper/Lower 5x/semana');

-- Dias de treino
INSERT INTO workout_days (id, plan_id, day_number, day_label, muscle_groups, primary_muscle_group, cardio_required, cardio_min_minutes) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Push A — Peito, Ombro, Tríceps', 'Peito, Ombros, Tríceps', 'chest', TRUE, 45),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Pull A — Costas, Bíceps',         'Costas, Bíceps',          'back_lat', TRUE, 45),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3, 'Legs A — Quadríceps, Glúteo',    'Quadríceps, Glúteos',     'quads', TRUE, 45),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 4, 'Upper — Força',                  'Peito, Costas, Ombros',   'chest', TRUE, 45),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 5, 'Lower — Força',                  'Quadríceps, Isquiotibiais','quads', TRUE, 45),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 6, 'Push B / Cardio',                'Peito, Ombros',           'chest', TRUE, 60),
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 7, 'Descanso', 'Rest', NULL, FALSE, 0);

-- Atualiza dia 7 como descanso
UPDATE workout_days SET is_rest_day = TRUE WHERE id = '20000000-0000-0000-0000-000000000007';

-- Exercícios do Push A
INSERT INTO exercises (day_id, name, sets, reps, rest_seconds, order_index, primary_muscle_group) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Supino Reto com Barra',     4, '8-12',  90,  0, 'chest'),
    ('20000000-0000-0000-0000-000000000001', 'Supino Inclinado Haltere',  3, '10-12', 75,  1, 'chest'),
    ('20000000-0000-0000-0000-000000000001', 'Desenvolvimento Ombro',     4, '8-12',  90,  2, 'shoulders'),
    ('20000000-0000-0000-0000-000000000001', 'Elevação Lateral',          3, '12-15', 60,  3, 'shoulders'),
    ('20000000-0000-0000-0000-000000000001', 'Tríceps Polia Alta',        3, '12-15', 60,  4, 'triceps'),
    ('20000000-0000-0000-0000-000000000001', 'Mergulho (Paralelas)',       3, '8-12',  75,  5, 'triceps');

-- Exercícios do Pull A
INSERT INTO exercises (day_id, name, sets, reps, rest_seconds, order_index, primary_muscle_group) VALUES
    ('20000000-0000-0000-0000-000000000002', 'Barra Fixa Supinada',       4, '6-10',  120, 0, 'back_lat'),
    ('20000000-0000-0000-0000-000000000002', 'Remada Curvada com Barra',  4, '8-12',  90,  1, 'back_mid'),
    ('20000000-0000-0000-0000-000000000002', 'Puxada Frente Polia',       3, '10-12', 75,  2, 'back_lat'),
    ('20000000-0000-0000-0000-000000000002', 'Remada Unilateral Haltere', 3, '10-12', 75,  3, 'back_mid'),
    ('20000000-0000-0000-0000-000000000002', 'Rosca Direta com Barra',    3, '10-12', 60,  4, 'biceps'),
    ('20000000-0000-0000-0000-000000000002', 'Rosca Martelo',             3, '12-15', 60,  5, 'biceps');

-- AI Coach Profile
INSERT INTO ai_coach_profiles (user_id, experience_level, primary_goal, onboarding_completed)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'intermediate',
    'body_recomposition',
    TRUE
);

SELECT 'Seed data inserido com sucesso!' AS status;
