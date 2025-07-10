-- supabase/migrations/<timestamp>_add_card_image_url_to_quizzes.sql

ALTER TABLE public.quizzes
ADD COLUMN card_image_url TEXT;