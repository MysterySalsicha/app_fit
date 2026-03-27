-- Migration 008: Exercise Library Seed Data
-- Full exercise library with alternatives for HunterFit
-- Run after 007_ai_coach.sql

-- ─── IMPORTANT: This seed creates GLOBAL exercises (not tied to any workout plan)
-- These are template exercises referenced by exercise_alternatives.
-- Actual plan exercises are user-specific and inserted via workout import.
-- We use a dedicated table approach: insert into a global library via exercise_alternatives.
-- ─────────────────────────────────────────────────────────────────────────────────

-- ── Global Exercise Library (no day_id — day_id is nullable for global exercises)
-- First, make day_id nullable if it isn't already (needed for global exercises)
ALTER TABLE exercises ALTER COLUMN day_id DROP NOT NULL;

-- ── Seed data using a DO block to avoid duplicate inserts ─────────────────────

DO $$
DECLARE
    -- PUSH exercises
    e_supino_barra     UUID;
    e_supino_halt      UUID;
    e_supino_inc_barra UUID;
    e_supino_inc_halt  UUID;
    e_supino_dec       UUID;
    e_crossover        UUID;
    e_flexao_normal    UUID;
    e_dip_peito        UUID;

    e_dev_barra        UUID;
    e_dev_halt         UUID;
    e_arnold           UUID;
    e_elev_lateral     UUID;
    e_elev_frontal     UUID;
    e_face_pull        UUID;
    e_crucifixo_inv    UUID;

    e_tricep_pulley    UUID;
    e_tricep_testa     UUID;
    e_tricep_mergulho  UUID;
    e_extensao_cabo    UUID;

    -- PULL exercises
    e_barra_fixa       UUID;
    e_puxada_pronada   UUID;
    e_puxada_supinada  UUID;
    e_remada_curvada   UUID;
    e_remada_unil      UUID;
    e_remada_cabos     UUID;
    e_pullover         UUID;
    e_shrug_barra      UUID;

    e_rosca_direta     UUID;
    e_rosca_alternada  UUID;
    e_rosca_martelo    UUID;
    e_rosca_concentr   UUID;
    e_rosca_cabo       UUID;

    -- LEGS exercises
    e_agach_livre      UUID;
    e_leg_press        UUID;
    e_hack_squat       UUID;
    e_afundo           UUID;
    e_cadeira_ext      UUID;
    e_agach_sumo       UUID;

    e_terra            UUID;
    e_terra_romano     UUID;
    e_mesa_flex        UUID;
    e_stiff            UUID;
    e_cadeira_flex     UUID;

    e_hip_thrust       UUID;
    e_glut_kick        UUID;

    e_panturrilha_pe   UUID;
    e_panturrilha_sent UUID;

    -- CORE/CARDIO
    e_abdominal        UUID;
    e_prancha          UUID;
    e_abdominal_cabo   UUID;
    e_rotacao_russa    UUID;
    e_hiperext         UUID;

    e_corrida          UUID;
    e_bike             UUID;
    e_rowing           UUID;

BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH — PEITO
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Supino Reto com Barra', 4, '8-12', 90, 1, 'chest', 'Exercício compound principal de peito')
RETURNING id INTO e_supino_barra;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Supino Reto com Halteres', 3, '10-12', 90, 2, 'chest', 'Maior amplitude de movimento que a barra')
RETURNING id INTO e_supino_halt;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Supino Inclinado com Barra', 4, '8-12', 90, 3, 'chest', 'Foco no peitoral superior')
RETURNING id INTO e_supino_inc_barra;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Supino Inclinado com Halteres', 3, '10-12', 90, 4, 'chest', 'Boa opção para ativação do peitoral superior')
RETURNING id INTO e_supino_inc_halt;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Supino Declinado', 3, '10-12', 90, 5, 'chest_lower', 'Foco na porção inferior do peitoral')
RETURNING id INTO e_supino_dec;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Crossover no Cabo', 3, '12-15', 60, 6, 'chest', 'Isolamento do peitoral com tensão constante')
RETURNING id INTO e_crossover;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Flexão de Braço', 3, '15-20', 60, 7, 'chest', 'Peito corpo livre — peso corporal')
RETURNING id INTO e_flexao_normal;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Dip com Peso (Peito)', 3, '8-12', 90, 8, 'chest_lower', 'Compound para peitoral inferior e tríceps')
RETURNING id INTO e_dip_peito;

-- ─── Alternativas — Supino Reto com Barra ────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_supino_barra, 'Supino Reto com Halteres',      'Peito, Ombro, Tríceps', 'Halteres',             95),
    (e_supino_barra, 'Supino Inclinado com Barra',     'Peito Superior',        'Barra, Banco inclinado',88),
    (e_supino_barra, 'Crossover no Cabo',              'Peito',                 'Polia',                 75),
    (e_supino_barra, 'Flexão de Braço Lastrada',       'Peito, Tríceps',        'Colete lastrado',       70),
    (e_supino_barra, 'Dip com Peso (Peito)',           'Peito Inferior, Tríceps','Paralelas + cinto',    72);

-- ─── Alternativas — Supino Inclinado com Barra ───────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_supino_inc_barra, 'Supino Inclinado com Halteres', 'Peito Superior',   'Halteres, Banco inclinado', 95),
    (e_supino_inc_barra, 'Supino Reto com Barra',         'Peito',            'Barra, Banco',              85),
    (e_supino_inc_barra, 'Crucifixo Inclinado',           'Peito Superior',   'Halteres, Banco inclinado', 78),
    (e_supino_inc_barra, 'Pec Deck',                      'Peito',            'Máquina Pec Deck',          72);

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH — OMBRO
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Desenvolvimento com Barra (Militar)', 4, '6-10', 90, 10, 'shoulder_front', 'Compound principal de ombro')
RETURNING id INTO e_dev_barra;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Desenvolvimento com Halteres', 3, '10-12', 75, 11, 'shoulder_front', 'Amplitude maior que a barra')
RETURNING id INTO e_dev_halt;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Arnold Press', 3, '10-12', 75, 12, 'shoulder_front', 'Ativa as 3 cabeças do deltóide')
RETURNING id INTO e_arnold;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Elevação Lateral com Halteres', 4, '12-15', 60, 13, 'shoulder_lateral', 'Isolamento do deltóide lateral')
RETURNING id INTO e_elev_lateral;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Elevação Frontal', 3, '12-15', 60, 14, 'shoulder_front', 'Deltóide anterior')
RETURNING id INTO e_elev_frontal;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Face Pull no Cabo', 3, '15-20', 60, 15, 'shoulder_rear', 'Essencial para saúde do manguito rotador')
RETURNING id INTO e_face_pull;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Crucifixo Invertido', 3, '12-15', 60, 16, 'shoulder_rear', 'Deltóide posterior com halteres')
RETURNING id INTO e_crucifixo_inv;

-- ─── Alternativas — Desenvolvimento com Barra ────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_dev_barra, 'Desenvolvimento com Halteres',    'Ombro, Tríceps',    'Halteres',          93),
    (e_dev_barra, 'Arnold Press',                    'Ombro',             'Halteres',          88),
    (e_dev_barra, 'Desenvolvimento na Máquina',      'Ombro',             'Máquina',           80),
    (e_dev_barra, 'Push Press',                      'Ombro, Trapézio',   'Barra',             82);

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH — TRÍCEPS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Tríceps Pulley', 3, '12-15', 60, 20, 'triceps', 'Isolamento clássico de tríceps')
RETURNING id INTO e_tricep_pulley;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Tríceps Testa (Skull Crusher)', 3, '10-12', 75, 21, 'triceps', 'Carga alta, excelente sobrecarga')
RETURNING id INTO e_tricep_testa;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Mergulho em Paralelas (Tríceps)', 3, '10-15', 75, 22, 'triceps', 'Peso corporal + possibilidade de lastre')
RETURNING id INTO e_tricep_mergulho;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Extensão de Tríceps no Cabo (sobre a cabeça)', 3, '12-15', 60, 23, 'triceps', 'Longa porção do tríceps')
RETURNING id INTO e_extensao_cabo;

-- ─── Alternativas — Tríceps Pulley ───────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_tricep_pulley, 'Tríceps Testa',                  'Tríceps',  'Barra EZ, Banco',    90),
    (e_tricep_pulley, 'Mergulho em Paralelas',           'Tríceps',  'Paralelas',          85),
    (e_tricep_pulley, 'Extensão de Tríceps com Halter',  'Tríceps',  'Halter',             82),
    (e_tricep_pulley, 'Kickback com Halter',             'Tríceps',  'Halter',             75);

-- ─────────────────────────────────────────────────────────────────────────────
-- PULL — COSTAS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Barra Fixa (Pull-up)', 4, '6-12', 120, 30, 'back_lat', 'King of back exercises — peso corporal')
RETURNING id INTO e_barra_fixa;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Puxada Frontal Pronada', 4, '8-12', 90, 31, 'back_lat', 'Alternativa à barra fixa com peso controlável')
RETURNING id INTO e_puxada_pronada;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Puxada Frontal Supinada', 3, '10-12', 90, 32, 'back_lat', 'Ativa mais o bíceps que a pronada')
RETURNING id INTO e_puxada_supinada;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Remada Curvada com Barra', 4, '6-10', 90, 33, 'back_upper', 'Compound principal de costas — espessura')
RETURNING id INTO e_remada_curvada;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Remada Unilateral com Halter', 3, '10-12', 75, 34, 'back_upper', 'Excelente amplitude e carga por lado')
RETURNING id INTO e_remada_unil;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Remada Sentado no Cabo', 3, '12-15', 75, 35, 'back_upper', 'Tensão constante, boa opção de volume')
RETURNING id INTO e_remada_cabos;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Pullover com Halter', 3, '12-15', 60, 36, 'back_lat', 'Isolamento do latíssimo')
RETURNING id INTO e_pullover;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Encolhimento de Ombros (Shrug)', 3, '12-15', 60, 37, 'back_upper', 'Trapézio superior')
RETURNING id INTO e_shrug_barra;

-- ─── Alternativas — Remada Curvada com Barra ─────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_remada_curvada, 'Remada Unilateral com Halter',  'Costas, Bíceps',  'Halter, Banco',        93),
    (e_remada_curvada, 'Remada Sentado no Cabo',        'Costas',          'Polia baixa',           88),
    (e_remada_curvada, 'Remada na Máquina',             'Costas',          'Máquina de remada',     82),
    (e_remada_curvada, 'Remada Curvada com Halteres',   'Costas, Bíceps',  'Halteres',              90);

-- ─── Alternativas — Barra Fixa ───────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_barra_fixa, 'Puxada Frontal Pronada',           'Costas, Bíceps',  'Puxador',             90),
    (e_barra_fixa, 'Puxada Frontal Supinada',          'Costas, Bíceps',  'Puxador',             87),
    (e_barra_fixa, 'Barra Fixa Assistida (máquina)',   'Costas, Bíceps',  'Máquina assistida',   78),
    (e_barra_fixa, 'Pullover com Halter',              'Costas',          'Halter, Banco',        65);

-- ─────────────────────────────────────────────────────────────────────────────
-- PULL — BÍCEPS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rosca Direta com Barra', 3, '8-12', 75, 40, 'biceps', 'Compound clássico de bíceps')
RETURNING id INTO e_rosca_direta;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rosca Alternada com Halteres', 3, '10-12', 75, 41, 'biceps', 'Permite supinação completa')
RETURNING id INTO e_rosca_alternada;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rosca Martelo', 3, '10-12', 60, 42, 'biceps', 'Ativa braquial e braquiorradial')
RETURNING id INTO e_rosca_martelo;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rosca Concentrada', 2, '12-15', 60, 43, 'biceps', 'Pico de contração do bíceps')
RETURNING id INTO e_rosca_concentr;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rosca no Cabo (polia baixa)', 2, '12-15', 60, 44, 'biceps', 'Tensão constante no bíceps')
RETURNING id INTO e_rosca_cabo;

-- ─── Alternativas — Rosca Direta ─────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_rosca_direta, 'Rosca Alternada com Halteres', 'Bíceps',  'Halteres',      93),
    (e_rosca_direta, 'Rosca Martelo',                'Bíceps, Braquial', 'Halteres', 85),
    (e_rosca_direta, 'Rosca no Cabo',                'Bíceps',  'Polia',         80),
    (e_rosca_direta, 'Rosca Scott (Preacher Curl)',  'Bíceps',  'Banco Scott, Barra EZ', 88);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEGS — QUADRÍCEPS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Agachamento Livre com Barra', 4, '6-10', 120, 50, 'quads', 'King of leg exercises — compound pesado')
RETURNING id INTO e_agach_livre;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Leg Press 45°', 4, '10-15', 90, 51, 'quads', 'Volume alto de quadríceps de forma segura')
RETURNING id INTO e_leg_press;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Hack Squat', 3, '10-12', 90, 52, 'quads', 'Quadríceps com suporte lombar')
RETURNING id INTO e_hack_squat;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Afundo (Lunges) com Halteres', 3, '12 cada perna', 75, 53, 'quads', 'Unilateral — correção de desequilíbrios')
RETURNING id INTO e_afundo;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Cadeira Extensora', 3, '12-15', 60, 54, 'quads', 'Isolamento do quadríceps')
RETURNING id INTO e_cadeira_ext;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Agachamento Sumô', 3, '10-12', 75, 55, 'quads', 'Adutores e glúteos + quadríceps')
RETURNING id INTO e_agach_sumo;

-- ─── Alternativas — Agachamento Livre ────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_agach_livre, 'Leg Press 45°',             'Quadríceps, Glúteo',   'Leg Press',         85),
    (e_agach_livre, 'Hack Squat',                'Quadríceps',           'Hack Squat',        90),
    (e_agach_livre, 'Agachamento Goblet',         'Quadríceps, Core',     'Halter pesado',     75),
    (e_agach_livre, 'Afundo com Halteres',        'Quadríceps, Glúteo',   'Halteres',          72),
    (e_agach_livre, 'Agachamento Sumô',           'Adutores, Glúteo',     'Barra ou haltere',  70);

-- ─── Alternativas — Leg Press 45° ────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_leg_press, 'Agachamento Livre com Barra', 'Quadríceps, Glúteo, Core', 'Barra, Rack',   92),
    (e_leg_press, 'Hack Squat',                  'Quadríceps',               'Hack Squat',    88),
    (e_leg_press, 'Afundo (Lunges)',             'Quadríceps, Glúteo',        'Halteres',      78),
    (e_leg_press, 'Cadeira Extensora',           'Quadríceps',                'Máquina',       65);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEGS — POSTERIOR / ISQUIOTIBIAIS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Levantamento Terra (Deadlift)', 4, '4-8', 120, 60, 'back_lower', 'Compound mais completo do corpo humano')
RETURNING id INTO e_terra;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Levantamento Terra Romeno', 4, '8-12', 90, 61, 'hamstrings', 'Foco na parte posterior da coxa')
RETURNING id INTO e_terra_romano;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Mesa Flexora', 3, '10-12', 75, 62, 'hamstrings', 'Isolamento dos isquiotibiais deitado')
RETURNING id INTO e_mesa_flex;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Stiff (Deadlift com pernas retas)', 3, '10-12', 75, 63, 'hamstrings', 'Posterior de coxa e glúteo')
RETURNING id INTO e_stiff;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Cadeira Flexora', 3, '12-15', 60, 64, 'hamstrings', 'Isolamento sentado dos isquiotibiais')
RETURNING id INTO e_cadeira_flex;

-- ─── Alternativas — Levantamento Terra ───────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_terra, 'Levantamento Terra Romeno',        'Posterior Coxa, Glúteo', 'Barra',           85),
    (e_terra, 'Stiff',                            'Posterior Coxa',          'Barra ou Halteres',82),
    (e_terra, 'Good Morning',                     'Posterior Coxa, Lombar',  'Barra',           75),
    (e_terra, 'Deadlift com Halteres',            'Posterior, Costas',       'Halteres',        80);

-- ─── Alternativas — Mesa Flexora ─────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_mesa_flex, 'Cadeira Flexora',              'Isquiotibiais',           'Máquina',         90),
    (e_mesa_flex, 'Leg Curl com Cabo (em pé)',    'Isquiotibiais',           'Polia',           78),
    (e_mesa_flex, 'Nordic Curl',                  'Isquiotibiais',           'Parceiro/fixação', 85),
    (e_mesa_flex, 'Stiff com Halteres',           'Isquiotibiais, Glúteo',   'Halteres',        70);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEGS — GLÚTEO
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Hip Thrust com Barra', 4, '8-12', 90, 70, 'glutes', 'Exercício mais eficiente para glúteo máximo')
RETURNING id INTO e_hip_thrust;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Glute Kickback no Cabo', 3, '12-15 cada', 60, 71, 'glutes', 'Isolamento do glúteo máximo')
RETURNING id INTO e_glut_kick;

-- ─── Alternativas — Hip Thrust ────────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_hip_thrust, 'Hip Thrust com Halter',     'Glúteo',         'Halter, Banco',      90),
    (e_hip_thrust, 'Glute Bridge',              'Glúteo',         'Corpo livre',        80),
    (e_hip_thrust, 'Agachamento Sumô',          'Glúteo, Adutores','Barra ou halter',   72),
    (e_hip_thrust, 'Afundo Reverso',            'Glúteo, Quadríceps','Halteres',        70);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEGS — PANTURRILHA
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Elevação de Calcanhar em Pé', 4, '15-20', 60, 75, 'calves', 'Gastrocnêmio — panturrilha em pé')
RETURNING id INTO e_panturrilha_pe;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Elevação de Calcanhar Sentado', 3, '15-20', 60, 76, 'calves', 'Sóleo — panturrilha sentado')
RETURNING id INTO e_panturrilha_sent;

-- ─── Alternativas — Panturrilha em Pé ────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_panturrilha_pe, 'Elevação de Calcanhar Sentado',  'Panturrilha', 'Máquina',           85),
    (e_panturrilha_pe, 'Panturrilha no Leg Press',       'Panturrilha', 'Leg Press',         82),
    (e_panturrilha_pe, 'Elevação Unilateral no Step',    'Panturrilha', 'Step/Degrau',       78);

-- ─────────────────────────────────────────────────────────────────────────────
-- CORE / ABDÔMEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Abdominal Crunch', 3, '15-20', 45, 80, 'abs', 'Abdômen superior clássico')
RETURNING id INTO e_abdominal;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Prancha Isométrica', 3, '30-60s', 45, 81, 'core', 'Core completo — estabilidade')
RETURNING id INTO e_prancha;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Abdominal com Cabo (ajoelhado)', 3, '12-15', 60, 82, 'abs', 'Sobrecarga progressiva no abdômen')
RETURNING id INTO e_abdominal_cabo;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Rotação Russa', 3, '20 (10 cada lado)', 45, 83, 'core_oblique', 'Oblíquos com rotação')
RETURNING id INTO e_rotacao_russa;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Hiperextensão Lombar', 3, '12-15', 60, 84, 'back_lower', 'Lombar e glúteo — banco romano')
RETURNING id INTO e_hiperext;

-- ─── Alternativas — Abdominal Crunch ─────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_abdominal, 'Abdominal com Cabo',           'Abdômen',      'Polia',              88),
    (e_abdominal, 'Sit-up',                       'Abdômen',      'Corpo livre',        85),
    (e_abdominal, 'Prancha Isométrica',            'Core',         'Corpo livre',        75),
    (e_abdominal, 'Dragon Flag',                  'Abdômen, Core','Banco',              90);

-- ─────────────────────────────────────────────────────────────────────────────
-- CARDIO / AERÓBICO
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Corrida na Esteira', 1, '45min', 0, 90, 'cardio', 'Cardio aeróbico principal')
RETURNING id INTO e_corrida;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Bike Ergométrica', 1, '45min', 0, 91, 'cardio', 'Baixo impacto — panturrilha + cardio')
RETURNING id INTO e_bike;

INSERT INTO exercises (name, sets, reps, rest_seconds, order_index, primary_muscle_group, notes)
VALUES ('Remo Ergométrico', 1, '20-30min', 0, 92, 'cardio', 'Full body + cardio')
RETURNING id INTO e_rowing;

-- ─── Alternativas — Corrida ───────────────────────────────────────────────────
INSERT INTO exercise_alternatives (exercise_id, alternative_name, muscle_groups, equipment_required, similarity_score)
VALUES
    (e_corrida, 'Bike Ergométrica',               'Cardio, Pernas',  'Bike',              85),
    (e_corrida, 'Elíptico',                       'Cardio',          'Elíptico',          82),
    (e_corrida, 'Remo Ergométrico',               'Cardio, Costas',  'Remo',              78),
    (e_corrida, 'Corrida ao Ar Livre',            'Cardio',          'Nenhum',            95);

END $$;
