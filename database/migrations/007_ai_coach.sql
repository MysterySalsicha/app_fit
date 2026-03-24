-- Migration 007: AI Coach tables + expanded user profile
-- Run after 006_hevy_features.sql

-- ── Expand users table with onboarding fields ─────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex CHAR(1);                    -- M / F / X
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(50);
  -- 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance' | 'recomposition' | 'return'
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20);
  -- 'beginner' | 'intermediate' | 'advanced' | 'athlete'
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_days_per_week INT DEFAULT 4;
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_location VARCHAR(30);
  -- 'full_gym' | 'basic_gym' | 'home_equipment' | 'home_bodyweight' | 'outdoor'
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_tone VARCHAR(20) DEFAULT 'balanced';
  -- 'solo_leveling' | 'motivational' | 'minimal' | 'balanced'
ALTER TABLE users ADD COLUMN IF NOT EXISTS injuries TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ── Onboarding Responses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    responses_json JSONB NOT NULL,     -- raw answers from the 12 questions
    ai_analysis JSONB NOT NULL DEFAULT '{}',  -- processed result by AI
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sagas (training programs / campaigns) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sagas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    saga_type VARCHAR(50) NOT NULL,
      -- 'cut' | 'bulk' | 'beginner_awakening' | 'strength_marathon'
      -- | 'cardio_warrior' | 'rehab_warrior' | 'custom'
    saga_name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
      -- 'pending' | 'active' | 'completed' | 'abandoned'
    goals_json JSONB NOT NULL DEFAULT '{}',
    rewards_json JSONB NOT NULL DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sagas_user_status ON sagas(user_id, status);

-- ── Long-term user goals ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    goal_description VARCHAR(500) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    achieved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id, is_active);

-- ── Weekly goals (AI-generated) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    goals_json JSONB NOT NULL DEFAULT '[]',
    generated_by_ai BOOLEAN DEFAULT TRUE,
    accepted_by_user BOOLEAN DEFAULT FALSE,
    completion_pct DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- ── AI Coach Conversations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_coach_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,          -- 'user' | 'assistant'
    message TEXT NOT NULL,
    context_snapshot JSONB,
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user_created ON ai_coach_conversations(user_id, created_at DESC);

-- ── Periodic check-ins ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    checkin_type VARCHAR(30) NOT NULL,
      -- 'weekly' | '30_days' | 'return_after_absence' | 'manual'
    questions_json JSONB NOT NULL DEFAULT '[]',
    answers_json JSONB,
    ai_analysis TEXT,
    adaptations_made JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_checkins_user ON ai_checkins(user_id, created_at DESC);

-- ── AI Insights ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
      -- 'plateau' | 'overtraining' | 'imbalance' | 'nutrition_gap'
      -- | 'progress' | 'weekly_analysis' | 'monthly_report'
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',  -- 'info' | 'warning' | 'critical' | 'positive'
    data_snapshot JSONB,
    actions_json JSONB,
    dismissed_at TIMESTAMPTZ,
    acted_upon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, dismissed_at, created_at DESC);

-- ── Extend diet_plans ─────────────────────────────────────────────────────
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS calculated_by_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS tdee_estimate INT;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS surplus_deficit_kcal INT DEFAULT -400;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS goal_type VARCHAR(30);
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS last_adjusted_at TIMESTAMPTZ;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;
