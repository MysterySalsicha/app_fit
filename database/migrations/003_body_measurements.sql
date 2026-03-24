-- ─── Migration 003: Body Measurements ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS body_measurements (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Composição corporal
    weight_kg            DECIMAL(5,2),
    body_fat_pct         DECIMAL(4,1),
    muscle_mass_kg       DECIMAL(5,2),
    water_pct            DECIMAL(4,1),
    bone_mass_kg         DECIMAL(4,2),
    visceral_fat_level   DECIMAL(4,1),
    bmi                  DECIMAL(4,1),
    basal_metabolic_rate DECIMAL(6,1),

    -- Circunferências (cm)
    waist_cm             DECIMAL(5,1),
    chest_cm             DECIMAL(5,1),
    hip_cm               DECIMAL(5,1),
    arm_cm               DECIMAL(5,1),

    -- Metadados
    source               TEXT NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'ai_vision', 'import')),
    notes                TEXT,
    ai_validated         BOOLEAN NOT NULL DEFAULT FALSE,
    ai_raw_json          JSONB
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date
    ON body_measurements (user_id, measured_at);

COMMENT ON TABLE body_measurements IS
    'Histórico de composição corporal — entrada manual ou via IA Vision';
