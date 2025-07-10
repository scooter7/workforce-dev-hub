-- supabase/migrations/<timestamp>_add_media_to_quiz_questions.sql

ALTER TABLE public.quiz_questions
ADD COLUMN image_url TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN media_position TEXT DEFAULT 'above_text' CHECK (media_position IN ('above_text', 'below_text', 'left_of_text', 'right_of_text'));

COMMENT ON COLUMN public.quiz_questions.image_url IS 'Optional URL for an image to display with the question.';
COMMENT ON COLUMN public.quiz_questions.video_url IS 'Optional URL for a video to embed with the question (e.g., YouTube embed link).';
COMMENT ON COLUMN public.quiz_questions.media_position IS 'Position of the media relative to the question text.';

-- Note: If you want to re-apply the updated_at trigger because you added columns,
-- you might need to drop and re-add it if it wasn't set to handle all column updates.
-- However, our existing trigger on quiz_questions should still work.
-- CREATE TRIGGER on_quiz_questions_updated
--   BEFORE UPDATE ON public.quiz_questions
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();