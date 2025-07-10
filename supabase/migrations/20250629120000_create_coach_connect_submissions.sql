-- supabase/migrations/20250629120000_create_coach_connect_submissions.sql

CREATE TABLE public.coach_connect_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  had_coach_before BOOLEAN,
  support_needed TEXT,
  life_stage TEXT,
  coach_gender_preference TEXT,
  coach_language_preference TEXT,
  coaching_style_preference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

COMMENT ON TABLE public.coach_connect_submissions IS 'Stores user submissions from the Coach Connect form.';

-- RLS for coach_connect_submissions
ALTER TABLE public.coach_connect_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions."
  ON public.coach_connect_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions."
  ON public.coach_connect_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions if a role system is in place
CREATE POLICY "Admins can view all submissions."
  ON public.coach_connect_submissions FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );