
-- Add new structured analysis columns to feedback_analyses
ALTER TABLE public.feedback_analyses
  ADD COLUMN IF NOT EXISTS transfer_detected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_reason text,
  ADD COLUMN IF NOT EXISTS instance_code_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_sentiment_start text,
  ADD COLUMN IF NOT EXISTS client_sentiment_end text,
  ADD COLUMN IF NOT EXISTS robotic_communication boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS robotic_communication_details text,
  ADD COLUMN IF NOT EXISTS efficiency_conclusion text;
