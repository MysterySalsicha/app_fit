-- ═══════════════════════════════════════════════════════════════════════════
-- HunterFit — PostgreSQL 15 — Schema Completo v1.0
-- Spec: HunterFit_Master_Spec.md (Seções 3 e 34)
-- Executar como: psql -U postgres -d hunterfit -f 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE I — DOMÍNIO: USUÁRIO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE users (
    id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                    VARCHAR(255) UNIQUE NOT NULL,
    password_hash            VARCHAR(512) NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    height_cm                DECIMAL(5,2) NOT NULL,
    strava_access_token      TEXT,
    strava_refresh_token     TEXT,
    strava_token_expires_at  TIMESTAMPTZ,
    notification_preferences JSONB        NOT NULL DEFAULT '{}',
    challenge_start_date     DATE,
    tdee_current_estimate    INT          NOT NULL DEFAULT 2900,
    tdee_calculation_method  VARCHAR(20)  NOT NULL DEFAULT 'formula'
                             CHECK (tdee_calculation_method IN ('formula', 'adaptive')),
    caloric_deficit_target   INT          NOT NULL DEFAULT 400,
    tdee_confidence          DECIMAL(3,2) NOT NULL DEFAULT 0
                             CHECK (tdee_confidence BETWEEN 0 AND 1),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users USING btree (email);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE II — DOMÍNIO: TREINO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE workout_plans (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    raw_txt    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_user ON workout_plans (user_id);

CREATE TABLE workout_days (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id              UUID        NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number           INT         NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    day_label            VARCHAR(50) NOT NULL,
    muscle_groups        VARCHAR(200) NOT NULL,
    primary_muscle_group VARCHAR(50),
    is_rest_day          BOOLEAN     NOT NULL DEFAULT FALSE,
    cardio_required      BOOLEAN     NOT NULL DEFAULT TRUE,
    cardio_min_minutes   INT         NOT NULL DEFAULT 45
);

CREATE INDEX idx_workout_days_plan ON workout_days (plan_id);

CREATE TABLE exercises (
    id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id               UUID         NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    name                 VARCHAR(150) NOT NULL,
    sets                 INT          NOT NULL,
    reps                 VARCHAR(30)  NOT NULL,  -- "8-12" ou "15"
    rest_seconds         INT          NOT NULL DEFAULT 60,
    gif_url              TEXT,
    notes                TEXT,
    order_index          INT          NOT NULL,
    primary_muscle_group VARCHAR(50),
    last_session_data    JSONB                   -- cache offline (spec seção 6)
);

CREATE INDEX idx_exercises_day    ON exercises (day_id);
CREATE INDEX idx_exercises_muscle ON exercises (primary_muscle_group);
CREATE INDEX idx_exercises_name   ON exercises USING gin (name gin_trgm_ops);

CREATE TABLE exercise_alternatives (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id       UUID         NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    alternative_name  VARCHAR(150) NOT NULL,
    muscle_groups     VARCHAR(200),
    equipment_required VARCHAR(100),
    similarity_score  INT          NOT NULL DEFAULT 80 CHECK (similarity_score BETWEEN 0 AND 100),
    is_global         BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE workout_sessions (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_id                  UUID         NOT NULL REFERENCES workout_days(id),
    session_date            DATE         NOT NULL,
    started_at              TIMESTAMPTZ,
    finished_at             TIMESTAMPTZ,
    total_duration_seconds  INT,
    total_volume_load_kg    DECIMAL(10,2),
    prev_session_volume_kg  DECIMAL(10,2),
    sync_status             VARCHAR(20)  NOT NULL DEFAULT 'synced'
                            CHECK (sync_status IN ('synced','pending_sync','offline')),
    offline_payload         JSONB,
    strava_activity_id      BIGINT,
    -- RPG
    dungeon_type            VARCHAR(30)  NOT NULL DEFAULT 'normal'
                            CHECK (dungeon_type IN ('normal','crisis','red_gate','hidden','boss')),
    xp_earned               INT          NOT NULL DEFAULT 0,
    pr_beaten               BOOLEAN      NOT NULL DEFAULT FALSE,
    pr_exercises            TEXT[],
    xp_multiplier           DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    dungeon_cleared         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sessions_user      ON workout_sessions (user_id, session_date DESC);
CREATE INDEX idx_sessions_day       ON workout_sessions (day_id);
CREATE INDEX idx_sessions_sync      ON workout_sessions (sync_status) WHERE sync_status != 'synced';

CREATE TABLE exercise_sets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID         NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id     UUID         NOT NULL REFERENCES exercises(id),
    set_number      INT          NOT NULL CHECK (set_number > 0),
    weight_kg       DECIMAL(6,2),
    reps_done       INT,
    -- Coluna calculada: weight × reps
    volume_load_kg  DECIMAL(8,2) GENERATED ALWAYS AS (weight_kg * reps_done) STORED,
    completed       BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    rest_started_at TIMESTAMPTZ
);

CREATE INDEX idx_sets_session  ON exercise_sets (session_id);
CREATE INDEX idx_sets_exercise ON exercise_sets (exercise_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE III — DOMÍNIO: NUTRIÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE diet_plans (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    target_kcal      INT          NOT NULL,
    target_protein_g INT          NOT NULL,
    target_carbs_g   INT          NOT NULL,
    target_fat_g     INT          NOT NULL,
    target_water_ml  INT          NOT NULL DEFAULT 5000,
    raw_txt          TEXT
);

CREATE TABLE daily_nutrition_logs (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date            DATE        NOT NULL,
    kcal_consumed       INT,
    protein_g           DECIMAL(6,1),
    carbs_g             DECIMAL(6,1),
    fat_g               DECIMAL(6,1),
    water_ml            INT         NOT NULL DEFAULT 0,
    source              VARCHAR(20) NOT NULL
                        CHECK (source IN ('manual','ai_vision','strava')),
    screenshot_url      TEXT,
    ai_raw_json         JSONB,
    validated_by_user   BOOLEAN     NOT NULL DEFAULT FALSE,
    diet_streak_valid   BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, log_date)
);

CREATE INDEX idx_nutrition_user_date ON daily_nutrition_logs (user_id, log_date DESC);

CREATE TABLE water_intake_events (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount_ml  INT         NOT NULL CHECK (amount_ml > 0)
);

CREATE INDEX idx_water_user_date ON water_intake_events (user_id, logged_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE IV — DOMÍNIO: MONITORAMENTO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE body_measurements (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_at       TIMESTAMPTZ  NOT NULL,
    weight_kg         DECIMAL(5,2) NOT NULL,
    body_fat_pct      DECIMAL(4,1) NOT NULL,
    muscle_mass_kg    DECIMAL(5,2) NOT NULL,
    water_pct         DECIMAL(4,1),
    bmi               DECIMAL(4,1),
    screenshot_url    TEXT,
    ai_raw_json       JSONB,
    validated_by_user BOOLEAN      NOT NULL DEFAULT FALSE,
    alert_triggered   VARCHAR(50)
                      CHECK (alert_triggered IN ('muscle_loss','water_retention') OR alert_triggered IS NULL)
);

CREATE INDEX idx_body_user_date ON body_measurements (user_id, measured_at DESC);

CREATE TABLE streaks (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type     VARCHAR(20) NOT NULL
                    CHECK (streak_type IN ('workout','diet','cardio','water')),
    current_count   INT         NOT NULL DEFAULT 0,
    max_count       INT         NOT NULL DEFAULT 0,
    last_valid_date DATE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, streak_type)
);

CREATE TABLE reminders (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(30) NOT NULL
                  CHECK (reminder_type IN ('trt','supplement','water','meal','workout','cardio')),
    title         VARCHAR(100) NOT NULL,
    body          VARCHAR(255),
    time_of_day   TIME         NOT NULL,
    days_of_week  INT[]        NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE V — SISTEMA RPG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE hunter_profiles (
    id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hunter_rank            VARCHAR(20) NOT NULL DEFAULT 'E'
                           CHECK (hunter_rank IN ('E','D','C','B','A','S','National')),
    hunter_sub_rank        INT         NOT NULL DEFAULT 3 CHECK (hunter_sub_rank BETWEEN 1 AND 3),
    hunter_level           INT         NOT NULL DEFAULT 1,
    current_xp             BIGINT      NOT NULL DEFAULT 0,
    total_xp_ever          BIGINT      NOT NULL DEFAULT 0,
    hunter_class           VARCHAR(30) NOT NULL DEFAULT 'Balance Warrior',
    class_assigned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    class_changes_this_month INT       NOT NULL DEFAULT 0,
    -- Atributos (spec seção 16)
    stat_str               INT         NOT NULL DEFAULT 0,
    stat_vit               INT         NOT NULL DEFAULT 0,
    stat_agi               INT         NOT NULL DEFAULT 0,
    stat_int               INT         NOT NULL DEFAULT 0,
    stat_per               INT         NOT NULL DEFAULT 0,
    stat_points_available  INT         NOT NULL DEFAULT 0,
    -- Shadow Army (spec seção 23)
    shadow_igris_level     INT         NOT NULL DEFAULT 0,
    shadow_tank_level      INT         NOT NULL DEFAULT 0,
    shadow_iron_level      INT         NOT NULL DEFAULT 0,
    shadow_fang_level      INT         NOT NULL DEFAULT 0,
    -- Moedas
    mana_crystals          INT         NOT NULL DEFAULT 0,
    immunity_tokens        INT         NOT NULL DEFAULT 0,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE muscle_ranks (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muscle_group        VARCHAR(50)  NOT NULL,
    muscle_name_pt      VARCHAR(100) NOT NULL,
    muscle_rank         VARCHAR(30)  NOT NULL DEFAULT 'Untrained',
    muscle_rank_numeric INT          NOT NULL DEFAULT 0 CHECK (muscle_rank_numeric BETWEEN 0 AND 15),
    total_volume_30d    DECIMAL(12,2) NOT NULL DEFAULT 0,
    sessions_30d        INT          NOT NULL DEFAULT 0,
    best_exercise_pr_kg DECIMAL(6,2),
    best_exercise_name  VARCHAR(150),
    rank_up_count       INT          NOT NULL DEFAULT 0,
    last_rank_up        TIMESTAMPTZ,
    UNIQUE (user_id, muscle_group)
);

CREATE INDEX idx_muscle_ranks_user ON muscle_ranks (user_id);

CREATE TABLE muscle_rank_history (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muscle_group  VARCHAR(50) NOT NULL,
    previous_rank VARCHAR(30),
    new_rank      VARCHAR(30),
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exercise_personal_records (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name           VARCHAR(150) NOT NULL,
    exercise_category       VARCHAR(50)
                            CHECK (exercise_category IN ('compound_heavy','compound_medium','bodyweight','isolation')),
    primary_muscle_group    VARCHAR(50),
    max_weight_kg           DECIMAL(6,2),
    max_reps_at_max_weight  INT,
    max_volume_single_set   DECIMAL(8,2),
    max_reps_bodyweight     INT,
    times_beaten            INT          NOT NULL DEFAULT 0,
    last_beaten_at          TIMESTAMPTZ,
    first_logged_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, exercise_name)
);

CREATE INDEX idx_prs_user ON exercise_personal_records (user_id);

CREATE TABLE hunter_skills (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id      VARCHAR(50) NOT NULL,
    skill_type    VARCHAR(20) NOT NULL CHECK (skill_type IN ('passive','real')),
    skill_name    VARCHAR(100) NOT NULL,
    skill_rank    VARCHAR(10) NOT NULL DEFAULT 'Common'
                  CHECK (skill_rank IN ('Common','Rare','Epic','Legendary')),
    effect_type   VARCHAR(50),
    effect_value  DECIMAL(8,2),
    effect_target VARCHAR(50),
    unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE hunter_titles (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_id    VARCHAR(50) NOT NULL,
    title_name  VARCHAR(100) NOT NULL,
    title_type  VARCHAR(20) NOT NULL DEFAULT 'permanent'
                CHECK (title_type IN ('permanent','temporary')),
    expires_at  TIMESTAMPTZ,
    equipped    BOOLEAN     NOT NULL DEFAULT FALSE,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE xp_events (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type    VARCHAR(50)  NOT NULL,
    xp_gained     INT          NOT NULL,
    multiplier    DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    description   TEXT,
    source_id     UUID,
    exercise_name VARCHAR(150),
    muscle_group  VARCHAR(50),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_date ON xp_events (user_id, created_at DESC);

CREATE TABLE hunter_quests (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_type       VARCHAR(30)  NOT NULL
                     CHECK (quest_type IN ('daily','main','emergency','penalty_rescue','rank_test')),
    quest_key        VARCHAR(50),
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    narrative        TEXT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','completed','failed','rescued')),
    modules_json     JSONB        NOT NULL DEFAULT '{}',
    xp_reward        INT          NOT NULL DEFAULT 0,
    stat_points_reward INT        NOT NULL DEFAULT 0,
    crystal_reward   INT          NOT NULL DEFAULT 0,
    skill_reward     VARCHAR(50),
    title_reward     VARCHAR(50),
    starts_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_quests_user_status ON hunter_quests (user_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE VI — IA COACH (spec seção 43)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE ai_coach_profiles (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    experience_level      VARCHAR(20) NOT NULL DEFAULT 'beginner'
                          CHECK (experience_level IN ('beginner','intermediate','advanced','elite')),
    primary_goal          VARCHAR(50),
    secondary_goals       TEXT[],
    injuries_notes        TEXT,
    preferred_workout_time VARCHAR(10),
    available_equipment   TEXT[],
    onboarding_completed  BOOLEAN     NOT NULL DEFAULT FALSE,
    last_analysis_at      TIMESTAMPTZ,
    adaptation_score      DECIMAL(4,2) NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_coach_questions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question        TEXT        NOT NULL,
    answer          TEXT,
    question_type   VARCHAR(30),
    context_tags    TEXT[],
    asked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answered_at     TIMESTAMPTZ
);

CREATE TABLE ai_coach_plans (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type       VARCHAR(20) NOT NULL CHECK (plan_type IN ('workout','nutrition','habit')),
    title           VARCHAR(200) NOT NULL,
    content_json    JSONB        NOT NULL DEFAULT '{}',
    rationale       TEXT,
    valid_from      DATE         NOT NULL,
    valid_until     DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CACHE (pós-MVP v1.1)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE muscle_volume_cache (
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muscle_group     VARCHAR(50)  NOT NULL,
    period_days      INT          NOT NULL CHECK (period_days IN (3, 7, 30)),
    total_volume_kg  DECIMAL(10,2) NOT NULL DEFAULT 0,
    fatigue_score    DECIMAL(4,2) NOT NULL DEFAULT 0 CHECK (fatigue_score BETWEEN 0 AND 2),
    calculated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, muscle_group, period_days)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SAGAS (spec seção 42)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sagas (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    duration_days INT         NOT NULL DEFAULT 20,
    goal_json    JSONB        NOT NULL DEFAULT '{}',
    status       VARCHAR(20)  NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','completed','abandoned')),
    started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ends_at      TIMESTAMPTZ  NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sagas_user ON sagas (user_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em hunter_profiles
CREATE TRIGGER trg_hunter_profiles_updated_at
    BEFORE UPDATE ON hunter_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger em ai_coach_profiles
CREATE TRIGGER trg_ai_coach_profiles_updated_at
    BEFORE UPDATE ON ai_coach_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE users IS 'Usuários do HunterFit — dados base e OAuth Strava';
COMMENT ON TABLE hunter_profiles IS 'Perfil RPG — rank, nível, XP, atributos, Shadow Army';
COMMENT ON TABLE muscle_ranks IS '17 grupos musculares com rank progressivo (Untrained → Legend)';
COMMENT ON TABLE workout_sessions IS 'Sessões de treino — Dungeons do sistema HunterFit';
COMMENT ON TABLE exercise_sets IS 'Séries registradas — volume_load_kg é coluna gerada (weight × reps)';
COMMENT ON TABLE xp_events IS 'Log de XP para rastreabilidade e feed do hunter';
COMMENT ON TABLE hunter_quests IS 'Quests Daily, Main, Emergency, Penalty Rescue e Rank Test';
COMMENT ON TABLE sagas IS 'Arcos de 20 dias (spec seção 42) — opcional, app funciona sem elas';

-- Schema completo criado com sucesso.
SELECT 'HunterFit schema v1.0 instalado com sucesso!' AS status;
