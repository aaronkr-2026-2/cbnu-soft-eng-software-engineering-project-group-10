CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(trim(email)));

CREATE TABLE students (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 100),
  student_number text NOT NULL UNIQUE CHECK (length(trim(student_number)) BETWEEN 1 AND 50)
);

-- Store only the token hash; logout deletes the corresponding session.
CREATE TABLE auth_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
