-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  date DATE NOT NULL,
  full_name TEXT,
  sub_city TEXT,
  woreda TEXT,
  ketena TEXT,
  block TEXT,
  house_number TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create replies table
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users (you should change these passwords!)
INSERT INTO users (username, password, name, role) VALUES
  ('admin', 'admin123', 'አስተዳዳሪ', 'admin'),
  ('user1', 'user123', 'ተጠቃሚ 1', 'user');

-- Add updated_at column for tracking changes
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read replies" ON replies
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert replies" ON replies
  FOR INSERT WITH CHECK (true);
