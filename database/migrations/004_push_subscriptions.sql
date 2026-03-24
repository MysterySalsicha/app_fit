-- ─── Migration 004: Push Subscriptions ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint     TEXT        NOT NULL UNIQUE,
    p256dh_key   TEXT        NOT NULL,
    auth_key     TEXT        NOT NULL,
    user_agent   TEXT,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
    ON push_subscriptions (user_id, is_active);

COMMENT ON TABLE push_subscriptions IS
    'Web Push subscriptions VAPID dos dispositivos dos usuários';
