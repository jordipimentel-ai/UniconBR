-- Tornar password_hash opcional (Supabase Auth gerencia as senhas)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
