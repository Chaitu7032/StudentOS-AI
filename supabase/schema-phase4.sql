-- Phase 4: Personalization tables
-- Run in Supabase SQL Editor after base schema

CREATE TABLE IF NOT EXISTS learning_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    study_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_study_minutes INTEGER DEFAULT 0,
    minutes_today INTEGER DEFAULT 0,
    daily_goal_minutes INTEGER DEFAULT 30,
    learning_goal VARCHAR(500),
    last_active_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_profiles_user ON learning_profiles(user_id);

CREATE TABLE IF NOT EXISTS user_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    mastery_score INTEGER DEFAULT 0,
    practice_count INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_topics_user ON user_topics(user_id);

CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    plan_data JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

CREATE TABLE IF NOT EXISTS revision_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES user_topics(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revision_user ON revision_items(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_date ON revision_items(scheduled_date);

CREATE TABLE IF NOT EXISTS learning_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON learning_memories(user_id);
