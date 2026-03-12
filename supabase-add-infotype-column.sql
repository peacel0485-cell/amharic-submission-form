-- Add info_type column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS info_type TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN submissions.info_type IS 'Type of information being reported (theft, anti-peace forces, disaster, violence, economic crime, etc.)';
