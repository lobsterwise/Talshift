CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('student', 'professional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS profile JSONB;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_fields_check;

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_talent (
  student_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  talent JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'student_profiles'
      AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'student_profiles'
      AND column_name = 'student_id'
  ) THEN
    ALTER TABLE student_profiles RENAME COLUMN user_id TO student_id;
  END IF;
END $$;

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS student_id BIGINT,
  ADD COLUMN IF NOT EXISTS profile JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE student_profiles SET profile = '{}'::jsonb WHERE profile IS NULL;

ALTER TABLE student_profiles
  ALTER COLUMN profile SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_student_id_uidx
  ON student_profiles (student_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'student_profiles_student_id_fkey'
      AND conrelid = 'student_profiles'::regclass
  ) THEN
    ALTER TABLE student_profiles
      ADD CONSTRAINT student_profiles_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
DECLARE
  legacy_column RECORD;
BEGIN
  FOR legacy_column IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'user_profiles'
      AND is_nullable = 'NO'
      AND column_name NOT IN ('user_id', 'profile')
      AND column_default IS NULL
  LOOP
    EXECUTE format('ALTER TABLE user_profiles ALTER COLUMN %I DROP NOT NULL', legacy_column.column_name);
  END LOOP;
END $$;