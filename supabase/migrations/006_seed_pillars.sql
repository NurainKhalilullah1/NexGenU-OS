-- Migration 006: Seed the 5 NexGenU pillars
-- Never edit this file. Create a new migration instead.

INSERT INTO pillars (name, nickname) VALUES
  ('The Builders',     'Builders'),
  ('The Educators',    'Educators'),
  ('The Innovators',   'Innovators'),
  ('The Connectors',   'Connectors'),
  ('The Guardians',    'Guardians')
ON CONFLICT (name) DO NOTHING;
