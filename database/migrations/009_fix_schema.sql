-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 009 — Correções de Schema
-- ─────────────────────────────────────────────────────────────────────────
-- Esta migration corrige:
--   1. Conflito de schema na tabela `sagas` (001 vs 007 definem schemas diferentes)
--   2. Coluna `exercise_category` faltando em `exercises`
--   3. Tabelas Hevy ausentes: hunter_follows, workout_likes, user_plate_config,
--      leaderboard_snapshots
--   4. Colunas faltando em workout_sessions (copy dungeon)
--   5. Colunas faltando em reminders (geofence e validação)
--   6. Campo `reminder_events` que a spec define mas a migration 001 não criou
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CORREÇÃO DA TABELA SAGAS
-- A migration 001 criou sagas com schema antigo (title, goal_json, status default 'active')
-- A migration 007 tentou recriar com IF NOT EXISTS — ficou silenciosa e não aplicou
-- Aqui adicionamos as colunas novas usando ALTER TABLE IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE sagas
    ADD COLUMN IF NOT EXISTS saga_type    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS saga_name    VARCHAR(200),
    ADD COLUMN IF NOT EXISTS goals_json   JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS rewards_json JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS progress_pct DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();

-- Populando saga_name a partir de title onde for NULL (compatibilidade)
UPDATE sagas SET saga_name = title WHERE saga_name IS NULL AND title IS NOT NULL;

-- Garantindo que saga_type tem fallback para registros antigos
UPDATE sagas SET saga_type = 'legacy' WHERE saga_type IS NULL;

-- Atualiza default de status para aceitar 'pending' (migration 007 usa 'pending')
ALTER TABLE sagas DROP CONSTRAINT IF EXISTS sagas_status_check;
ALTER TABLE sagas ADD CONSTRAINT sagas_status_check
    CHECK (status IN ('active', 'completed', 'abandoned', 'pending'));

-- ─────────────────────────────────────────────────────────────────────────
-- 2. COLUNA exercise_category EM exercises
-- Necessária para o XpCalculatorService calcular corretamente o XP por série
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS exercise_category VARCHAR(30) NOT NULL DEFAULT 'isolation'
        CHECK (exercise_category IN ('compound_heavy','compound_medium','bodyweight','isolation'));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. TABELAS HEVY AUSENTES (spec seção 34)
-- ─────────────────────────────────────────────────────────────────────────

-- Follows entre hunters (social feed)
CREATE TABLE IF NOT EXISTS hunter_follows (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, following_id),
    CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_hunter_follows_follower  ON hunter_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_hunter_follows_following ON hunter_follows (following_id);

-- Likes em sessões de treino
CREATE TABLE IF NOT EXISTS workout_likes (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID        NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workout_likes_session ON workout_likes (session_id);

-- Configuração de anilhas do usuário (plate calculator)
CREATE TABLE IF NOT EXISTS user_plate_config (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    plate_sizes INT[]       NOT NULL DEFAULT '{1,2,5,10,15,20,25}',  -- kg
    bar_weight  DECIMAL(5,2) NOT NULL DEFAULT 20.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots de leaderboard por exercício
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_name  VARCHAR(150) NOT NULL,
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rm1_kg         DECIMAL(6,2),
    rank_position  INT,
    snapshot_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_exercise ON leaderboard_snapshots (exercise_name, snapshot_date);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. COLUNAS FALTANDO EM workout_sessions (copy dungeon + visibilidade pública)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE workout_sessions
    ADD COLUMN IF NOT EXISTS copied_from_session_id UUID REFERENCES workout_sessions(id),
    ADD COLUMN IF NOT EXISTS copied_from_user_id    UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS is_public              BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS shareable_image_url    TEXT;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. COLUNAS FALTANDO EM reminders (geofence e validação — spec seção 9)
-- A migration 001 criou reminders sem campos de geolocalização
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS validation_mode         VARCHAR(30) NOT NULL DEFAULT 'none'
        CHECK (validation_mode IN ('none','time_only','time_and_location')),
    ADD COLUMN IF NOT EXISTS window_before_minutes   INT NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS window_after_minutes    INT NOT NULL DEFAULT 90,
    ADD COLUMN IF NOT EXISTS geofence_label          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS geofence_lat            DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS geofence_lng            DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS geofence_radius_m       INT,
    ADD COLUMN IF NOT EXISTS require_confirmation    BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS confirmation_type       VARCHAR(20) NOT NULL DEFAULT 'tap'
        CHECK (confirmation_type IN ('tap','qr','photo','manual'));

-- ─────────────────────────────────────────────────────────────────────────
-- 6. TABELA reminder_events (spec seção 3.4 — ausente nas migrations anteriores)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reminder_events (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id          UUID        NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_for        TIMESTAMPTZ NOT NULL,
    confirmed_at         TIMESTAMPTZ,
    confirmation_source  VARCHAR(20),
    confirmation_lat     DECIMAL(9,6),
    confirmation_lng     DECIMAL(9,6),
    validation_status    VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (validation_status IN ('pending','valid','invalid_time','invalid_location','missed')),
    validation_notes     VARCHAR(255),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminder_events_user    ON reminder_events (user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_events_reminder ON reminder_events (reminder_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. COLUNA exercise_personal_records — strength_level (spec seção 32)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE exercise_personal_records
    ADD COLUMN IF NOT EXISTS strength_level_category VARCHAR(20)
        CHECK (strength_level_category IN ('beginner','novice','intermediate','advanced','elite')),
    ADD COLUMN IF NOT EXISTS population_percentile DECIMAL(5,2);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. is_profile_public em hunter_profiles (necessário para endpoints sociais)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE hunter_profiles
    ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN NOT NULL DEFAULT FALSE;
