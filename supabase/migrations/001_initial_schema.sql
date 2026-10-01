-- Migration 001: Initial schema — users, pillars, tasks
-- Never edit this file. Create a new migration instead.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pillars table
CREATE TABLE IF NOT EXISTS pillars (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL UNIQUE,
  nickname    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Users table (mirrors auth.users with extra profile fields)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  full_name   text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'head' CHECK (role IN ('admin', 'head')),
  pillar_id   uuid REFERENCES pillars(id) ON DELETE SET NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  pillar_id    uuid NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  assignee_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status       text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'submitted', 'returned', 'approved')),
  due_date     date,
  kpi_ref      text,
  recurrence   text DEFAULT 'none' CHECK (recurrence IN ('none', 'weekly', 'biweekly', 'monthly')),
  archived     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks   ENABLE ROW LEVEL SECURITY;
