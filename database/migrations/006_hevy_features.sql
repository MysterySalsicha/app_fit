-- ═══════════════════════════════════════════════════════════════════════════
-- HunterFit — Migration 006: Hevy Features (set_type, superset, RPE)
-- Spec Seção 32: Features do Hevy Absorvidas
-- ═══════════════════════════════════════════════════════════════════════════

-- HEVY-01: Tipos de série (warm-up, normal, drop set, failure)
ALTER TABLE exercise_sets
    ADD COLUMN IF NOT EXISTS set_type VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (set_type IN ('warmup', 'normal', 'drop_set', 'failure'));

-- HEVY-02: Supersets — agrupamento por UUID compartilhado
ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS superset_group_id UUID;

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS superset_order INT NOT NULL DEFAULT 0;

-- HEVY-04: RPE (Rate of Perceived Exertion) por série
ALTER TABLE exercise_sets
    ADD COLUMN IF NOT EXISTS rpe DECIMAL(3,1)
    CHECK (rpe IS NULL OR rpe BETWEEN 6.0 AND 10.0);

-- HEVY-05: 1RM estimado e real rastreados em exercise_personal_records
ALTER TABLE exercise_personal_records
    ADD COLUMN IF NOT EXISTS estimated_1rm_kg DECIMAL(6,2);

ALTER TABLE exercise_personal_records
    ADD COLUMN IF NOT EXISTS real_1rm_kg DECIMAL(6,2);

-- Notas por exercício (persistem entre sessões)
ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- Índice para superset_group lookups
CREATE INDEX IF NOT EXISTS idx_exercises_superset
    ON exercises (superset_group_id)
    WHERE superset_group_id IS NOT NULL;

SELECT '006_hevy_features migração aplicada com sucesso!' AS status;
