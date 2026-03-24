-- ═══════════════════════════════════════════════════════════════════════════
-- HunterFit — Migration 005: Strava athlete_id + workout source
-- ═══════════════════════════════════════════════════════════════════════════

-- Adiciona strava_athlete_id para rastrear o atleta Strava (deduplicação)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS strava_athlete_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_strava_athlete
    ON users (strava_athlete_id)
    WHERE strava_athlete_id IS NOT NULL;

-- Adiciona coluna source em workout_sessions (manual | strava | import)
ALTER TABLE workout_sessions
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'strava', 'import'));

-- Adiciona strava_activity_id se não existir (idempotente)
ALTER TABLE workout_sessions
    ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_strava_activity
    ON workout_sessions (strava_activity_id)
    WHERE strava_activity_id IS NOT NULL;

SELECT '005_strava_athlete migração aplicada com sucesso!' AS status;
