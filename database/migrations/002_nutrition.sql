-- ─── Migration 002: Nutrition ───────────────────────────────────────────────
-- Adiciona tabela nutrition_logs e campos de meta nutricional no hunter_profiles

-- nutrition_logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_name     TEXT NOT NULL,
    kcal_consumed INT  NOT NULL DEFAULT 0,
    protein_g     REAL NOT NULL DEFAULT 0,
    carbs_g       REAL NOT NULL DEFAULT 0,
    fat_g         REAL NOT NULL DEFAULT 0,
    water_ml      INT  NOT NULL DEFAULT 0,
    source        TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual', 'ai_vision', 'import')),
    logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date
    ON nutrition_logs (user_id, logged_at);

-- Metas nutricionais no perfil do hunter
ALTER TABLE hunter_profiles
    ADD COLUMN IF NOT EXISTS daily_kcal_target     INT   NOT NULL DEFAULT 2450,
    ADD COLUMN IF NOT EXISTS daily_protein_g_target REAL  NOT NULL DEFAULT 180,
    ADD COLUMN IF NOT EXISTS daily_carbs_g_target   REAL  NOT NULL DEFAULT 220,
    ADD COLUMN IF NOT EXISTS daily_fat_g_target     REAL  NOT NULL DEFAULT 70,
    ADD COLUMN IF NOT EXISTS daily_water_ml_target  INT   NOT NULL DEFAULT 3500;

COMMENT ON TABLE nutrition_logs IS
    'Registro diário de refeições e hidratação do hunter';
