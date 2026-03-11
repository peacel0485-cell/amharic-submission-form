-- Add deleted_at column for soft delete functionality
-- Run this in Supabase SQL Editor

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_deleted_at ON submissions(deleted_at);

-- Update the existing data to set deleted_at as NULL
UPDATE submissions SET deleted_at = NULL WHERE deleted_at IS NULL;
