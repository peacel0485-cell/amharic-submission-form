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
      .is('deleted_at', null) // Only show non-deleted submissions
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

// Upload file to Supabase Storage
app.post('/api/upload', async (req, res) => {
  try {
    const { fileName, fileData, fileType } = req.body;
    
    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(`${Date.now()}_${fileName}`, buffer, {
        contentType: fileType,
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(data.path);
    
    res.json({ success: true, url: urlData.publicUrl, path: data.path });
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

// User Management Routes (Admin only)

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, role, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Users fetched:', data?.length || 0);
    res.json({ success: true, users: data || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    userData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete submission (admin only) - Soft delete
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete: just mark as deleted with timestamp
    const { error } = await supabase
      .from('submissions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
