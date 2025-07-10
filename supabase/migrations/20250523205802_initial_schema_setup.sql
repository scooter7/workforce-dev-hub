-- supabase/migrations/<timestamp>_initial_schema_setup.sql

CREATE EXTENSION IF NOT EXISTS vector; -- Ensures pgvector is enabled first

-- Optional: Enable other common extensions if needed by your project
-- CREATE EXTENSION IF NOT EXISTS moddatetime; -- For advanced timestamp functions (not strictly needed for our current handle_updated_at)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto; -- For gen_random_uuid() if not using the default function for UUIDs

--------------------------------------------------------------------------------
-- Helper function for automatically updating 'updated_at' timestamps
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Automatically updates the updated_at timestamp on row modification.';

--------------------------------------------------------------------------------
-- Profiles Table (for user-specific data and points)
--------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  company TEXT,
  role TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);
COMMENT ON TABLE public.profiles IS 'Public user profiles, extending auth.users, storing points and custom fields.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references auth.users.id';
COMMENT ON COLUMN public.profiles.points IS 'Gamification points for the user.';

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Function to create a profile for a new user (from auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, points)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 0); -- Set initial points to 0
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile row when a new user signs up.';

-- Trigger to call the function after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--------------------------------------------------------------------------------
-- User Goals Table
--------------------------------------------------------------------------------
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 255),
  description TEXT CHECK (char_length(description) <= 1000),
  type TEXT CHECK (type IN ('personal', 'academic', 'professional', 'other')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_status ON public.user_goals(status);
COMMENT ON TABLE public.user_goals IS 'Stores goals created by users.';
COMMENT ON COLUMN public.user_goals.type IS 'Type of goal, e.g., personal, academic, professional, other.';
COMMENT ON COLUMN public.user_goals.status IS 'Current status of the goal, e.g., not_started, in_progress, completed.';


CREATE TRIGGER on_user_goals_updated
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for user_goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own goals."
  ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals."
  ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals."
  ON public.user_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals."
  ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Point Logs Table
--------------------------------------------------------------------------------
CREATE TABLE public.point_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL,
  reason_code TEXT NOT NULL,
  reason_message TEXT,
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_point_logs_user_id ON public.point_logs(user_id);
CREATE INDEX idx_point_logs_created_at ON public.point_logs(created_at);
CREATE INDEX idx_point_logs_reason_code ON public.point_logs(reason_code);
COMMENT ON TABLE public.point_logs IS 'Records each instance of points being awarded to a user.';
COMMENT ON COLUMN public.point_logs.reason_code IS 'A code representing the reason for points (e.g., GOAL_ADDED).';
COMMENT ON COLUMN public.point_logs.reason_message IS 'A human-readable description of why points were awarded.';
COMMENT ON COLUMN public.point_logs.related_entity_id IS 'ID of the entity (goal, quiz, etc.) related to this point award.';
COMMENT ON COLUMN public.point_logs.related_entity_type IS 'Type of the entity related to this point award.';

-- RLS for point_logs
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own point logs."
  ON public.point_logs FOR SELECT USING (auth.uid() = user_id);
-- Inserts are handled by admin/service role via API routes.

--------------------------------------------------------------------------------
-- Quizzes Table
--------------------------------------------------------------------------------
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL, -- <<< CHANGED: Added NOT NULL
  subtopic_id TEXT,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 255),
  description TEXT CHECK (char_length(description) <= 1000),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_quizzes_topic_id ON public.quizzes(topic_id);
CREATE INDEX idx_quizzes_difficulty ON public.quizzes(difficulty);
COMMENT ON TABLE public.quizzes IS 'Stores metadata for quizzes.';
COMMENT ON COLUMN public.quizzes.topic_id IS 'Identifier for the main topic this quiz relates to.';
COMMENT ON COLUMN public.quizzes.subtopic_id IS 'Optional identifier for a subtopic.';
COMMENT ON COLUMN public.quizzes.difficulty IS 'Difficulty level of the quiz (e.g., easy, medium, hard).';


CREATE TRIGGER on_quizzes_updated
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view all quizzes."
  ON public.quizzes FOR SELECT TO authenticated USING (true);
-- Admin manages inserts/updates/deletes.

--------------------------------------------------------------------------------
-- Quiz Questions Table
--------------------------------------------------------------------------------
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (char_length(question_text) > 0),
  question_type TEXT NOT NULL DEFAULT 'multiple-choice' CHECK (question_type IN ('multiple-choice', 'true-false')),
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (quiz_id, order_num)
);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_type ON public.quiz_questions(question_type);
COMMENT ON TABLE public.quiz_questions IS 'Stores individual questions for each quiz.';
COMMENT ON COLUMN public.quiz_questions.quiz_id IS 'The quiz this question belongs to.';
COMMENT ON COLUMN public.quiz_questions.question_type IS 'Type of question (e.g., multiple-choice, true-false).';
COMMENT ON COLUMN public.quiz_questions.explanation IS 'Explanation for the answer, shown after attempting.';
COMMENT ON COLUMN public.quiz_questions.points IS 'Points awarded for correctly answering this question.';
COMMENT ON COLUMN public.quiz_questions.order_num IS 'Sequence number of the question within its quiz.';

CREATE TRIGGER on_quiz_questions_updated
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view quiz questions."
  ON public.quiz_questions FOR SELECT TO authenticated USING (true);
-- Admin manages inserts/updates/deletes.

--------------------------------------------------------------------------------
-- Question Options Table
--------------------------------------------------------------------------------
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL CHECK (char_length(option_text) > 0),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  -- order_num INTEGER, -- Optional
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);
COMMENT ON TABLE public.question_options IS 'Stores answer options for quiz questions, especially multiple-choice.';
COMMENT ON COLUMN public.question_options.question_id IS 'The question these options belong to.';
COMMENT ON COLUMN public.question_options.is_correct IS 'Indicates if this option is the correct answer.';

CREATE TRIGGER on_question_options_updated
  BEFORE UPDATE ON public.question_options
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for question_options
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view question options."
  ON public.question_options FOR SELECT TO authenticated USING (true);
-- Admin manages inserts/updates/deletes. API serving options to client for taking quiz omits 'is_correct'.

--------------------------------------------------------------------------------
-- Quiz Attempts Table
--------------------------------------------------------------------------------
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  questions_answered INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_quiz_attempts_status ON public.quiz_attempts(status);
COMMENT ON TABLE public.quiz_attempts IS 'Records each attempt a user makes on a quiz.';
COMMENT ON COLUMN public.quiz_attempts.score IS 'The number of correctly answered questions.';
COMMENT ON COLUMN public.quiz_attempts.total_questions IS 'Total questions in the quiz when this attempt was made.';
COMMENT ON COLUMN public.quiz_attempts.status IS 'Status of the quiz attempt (e.g., in_progress, completed).';
COMMENT ON COLUMN public.quiz_attempts.points_awarded IS 'Points awarded for this quiz attempt.';


CREATE TRIGGER on_quiz_attempts_updated
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz attempts."
  ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz attempts."
  ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz attempts."
  ON public.quiz_attempts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- User Answers Table
--------------------------------------------------------------------------------
CREATE TABLE public.user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT, -- Or CASCADE if answers should vanish if question does
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_user_answers_attempt_id ON public.user_answers(attempt_id);
COMMENT ON TABLE public.user_answers IS 'Stores the specific answers given by a user during a quiz attempt.';
COMMENT ON COLUMN public.user_answers.selected_option_id IS 'The option selected by the user (for multiple-choice).';
COMMENT ON COLUMN public.user_answers.is_correct IS 'Whether the provided answer was correct (determined server-side).';


-- RLS for user_answers
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own answers for their attempts."
  ON public.user_answers FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.user_id = auth.uid()
  ));
-- Inserts are handled by admin/service role via API routes.

--------------------------------------------------------------------------------
-- Knowledge Base Chunks Table (for RAG)
--------------------------------------------------------------------------------
CREATE TABLE public.knowledge_base_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  subtopic_id TEXT,
  source_document_name TEXT,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- Dimension for text-embedding-3-small
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);
CREATE INDEX idx_kb_chunks_topic_id ON public.knowledge_base_chunks(topic_id);
COMMENT ON TABLE public.knowledge_base_chunks IS 'Stores text chunks from knowledge base documents and their vector embeddings for RAG.';
COMMENT ON COLUMN public.knowledge_base_chunks.embedding IS 'Vector embedding of the chunk_text (e.g., from OpenAI text-embedding-3-small, 1536 dimensions).';

-- RLS for knowledge_base_chunks
ALTER TABLE public.knowledge_base_chunks ENABLE ROW Level SECURITY;
CREATE POLICY "Service role has full access to knowledge base chunks"
  ON public.knowledge_base_chunks FOR ALL
  USING (true)  -- This effectively allows service role to bypass RLS
  WITH CHECK (true); -- For service role, this is fine. More granular policies for other roles.

-- pgvector index (Using HNSW as a good general default)
CREATE INDEX ON public.knowledge_base_chunks USING hnsw (embedding vector_cosine_ops);
-- Alternative IVFFlat index (commented out):
-- CREATE INDEX ON public.knowledge_base_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


--------------------------------------------------------------------------------
-- Database Functions for RAG and Points
--------------------------------------------------------------------------------
-- Function for RAG similarity search
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks (
  query_embedding vector(1536),
  match_topic_id text,
  match_subtopic_id text DEFAULT NULL,
  match_threshold float DEFAULT 0.75,
  match_count integer DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  topic_id TEXT,
  subtopic_id TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    kbc.id,
    kbc.chunk_text,
    kbc.topic_id,
    kbc.subtopic_id,
    1 - (kbc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base_chunks kbc
  WHERE
    kbc.topic_id = match_topic_id AND
    (match_subtopic_id IS NULL OR kbc.subtopic_id = match_subtopic_id) AND
    (1 - (kbc.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
COMMENT ON FUNCTION public.match_knowledge_chunks(vector,text,text,float,integer) IS 'Finds relevant knowledge base chunks based on embedding similarity and topic filters.';

-- Function for incrementing user points
CREATE OR REPLACE FUNCTION public.increment_user_points(
  user_id_param uuid,
  points_to_add integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + points_to_add
  WHERE id = user_id_param;
END;
$$;
COMMENT ON FUNCTION public.increment_user_points(uuid,integer) IS 'Increments total points for a user in their profile.';