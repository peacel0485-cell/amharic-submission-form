const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true, 
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all submissions (admin only)
app.get('/api/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, replies(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, submissions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own submissions
app.get('/api/submissions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const { data, error } = await supabase
      .from('submissions')
      .select('*, replies(*)')
      .eq('username', username)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, submissions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create submission
app.post('/api/submissions', async (req, res) => {
  try {
    const submissionData = req.body;
    
    const { data, error } = await supabase
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, submission: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reply (admin only)
app.post('/api/replies', async (req, res) => {
  try {
    const replyData = req.body;
    
    const { data, error } = await supabase
      .from('replies')
      .insert([replyData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, reply: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
