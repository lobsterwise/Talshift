--- CREATE EXTENSION IF NOT EXISTS vector;

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

CREATE TABLE IF NOT EXISTS student_credibility (
  student_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  report JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attribute_embeddings (
  content_hash TEXT NOT NULL CHECK (length(content_hash) = 64),
  model TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_hash, model)
);

CREATE INDEX IF NOT EXISTS attribute_embeddings_vector_hnsw_idx
  ON attribute_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS search_attributes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'student_profile', 'student_learning_goal', 'professional_offer', 'professional_demand', 'job_posting'
  )),
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  evidence TEXT,
  score SMALLINT CHECK (score BETWEEN 0 AND 100),
  priority SMALLINT CHECK (priority BETWEEN 0 AND 100),
  embedding_hash TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  source_hash TEXT NOT NULL DEFAULT '',
  extractor_model TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (embedding_hash, embedding_model)
    REFERENCES attribute_embeddings(content_hash, model) ON DELETE RESTRICT,
  CHECK (
    (source_type IN ('student_profile', 'student_learning_goal') AND score IS NOT NULL AND priority IS NULL) OR
    (source_type IN ('professional_offer', 'professional_demand', 'job_posting') AND score IS NULL AND priority IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS search_attributes_source_name_uidx
  ON search_attributes (owner_id, source_type, source_id, lower(name));

CREATE INDEX IF NOT EXISTS search_attributes_owner_source_idx
  ON search_attributes (owner_id, source_type);

ALTER TABLE search_attributes
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS source_hash TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS extractor_model TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS search_settings (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  discoverable BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE search_settings
  ALTER COLUMN discoverable SET DEFAULT true;

UPDATE search_settings
  SET discoverable = true, updated_at = now()
  WHERE discoverable = false;

CREATE TABLE IF NOT EXISTS professional_postings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL CHECK (length(description) <= 4000),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS professional_postings_owner_status_idx
  ON professional_postings (owner_id, status, updated_at DESC);

-- Where students apply. Required for new and edited postings; older postings have ''
-- until their owner adds one.
ALTER TABLE professional_postings
  ADD COLUMN IF NOT EXISTS application_url TEXT NOT NULL DEFAULT '' CHECK (length(application_url) <= 500);

CREATE TABLE IF NOT EXISTS saved_professional_candidates (
  professional_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (professional_id, student_id)
);

CREATE TABLE IF NOT EXISTS saved_student_postings (
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  posting_id BIGINT NOT NULL REFERENCES professional_postings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, posting_id)
);

CREATE INDEX IF NOT EXISTS saved_student_postings_student_created_idx
  ON saved_student_postings (student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS student_reputation_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating BETWEEN 0.5 AND 5 AND rating * 2 = trunc(rating * 2)),
  review_text TEXT NOT NULL DEFAULT '' CHECK (length(review_text) <= 500),
  source_type TEXT NOT NULL CHECK (source_type IN ('professional_demand', 'job_posting')),
  source_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, student_id)
);

CREATE INDEX IF NOT EXISTS student_reputation_reviews_student_idx
  ON student_reputation_reviews (student_id, updated_at DESC);

-- Ratings moved from whole stars (1-5) to half-star steps (0.5-5).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'student_reputation_reviews'
      AND column_name = 'rating'
      AND data_type = 'smallint'
  ) THEN
    ALTER TABLE student_reputation_reviews
      DROP CONSTRAINT IF EXISTS student_reputation_reviews_rating_check;
    ALTER TABLE student_reputation_reviews
      ALTER COLUMN rating TYPE NUMERIC(2, 1);
    ALTER TABLE student_reputation_reviews
      ADD CONSTRAINT student_reputation_reviews_rating_check
      CHECK (rating BETWEEN 0.5 AND 5 AND rating * 2 = trunc(rating * 2));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS student_connections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);

-- One connection per pair of students, whichever of them asked first.
CREATE UNIQUE INDEX IF NOT EXISTS student_connections_pair_uidx
  ON student_connections (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));

CREATE TABLE IF NOT EXISTS student_roadmaps (
  student_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roadmap JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peer_comparison_advice (
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_hash TEXT NOT NULL,
  advice JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, peer_id)
);

CREATE TABLE IF NOT EXISTS professional_review_queues (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  professional_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('professional_demand', 'job_posting')),
  source_id TEXT NOT NULL,
  exploration_seed TEXT NOT NULL,
  algorithm_version SMALLINT NOT NULL DEFAULT 1,
  cursor_position INTEGER NOT NULL DEFAULT 0 CHECK (cursor_position >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS professional_review_queues_active_source_uidx
  ON professional_review_queues (professional_id, source_type, source_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS professional_review_queue_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  queue_id BIGINT NOT NULL REFERENCES professional_review_queues(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  relevance_score NUMERIC(8, 6) NOT NULL CHECK (relevance_score BETWEEN 0 AND 1),
  reputation_score NUMERIC(8, 6) NOT NULL CHECK (reputation_score BETWEEN 0 AND 1),
  reputation_stars NUMERIC(4, 2) NOT NULL CHECK (reputation_stars BETWEEN 1 AND 5),
  review_count INTEGER NOT NULL CHECK (review_count >= 0),
  final_score NUMERIC(8, 6) NOT NULL CHECK (final_score BETWEEN 0 AND 1),
  is_exploration BOOLEAN NOT NULL DEFAULT false,
  candidate_snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'skipped')),
  completed_at TIMESTAMPTZ,
  UNIQUE (queue_id, position),
  UNIQUE (queue_id, student_id)
);

CREATE INDEX IF NOT EXISTS professional_review_queue_entries_pending_idx
  ON professional_review_queue_entries (queue_id, position)
  WHERE status = 'pending';

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