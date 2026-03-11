# Amharic Information Submission Portal

A modern, responsive web application for submitting information with admin dashboard and reply system.

## Features
- User authentication
- Form submission with Amharic support
- Admin dashboard to view all submissions
- Reply system for admin to respond to users
- File attachments support
- Mobile responsive design

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-setup.sql`
4. Go to Settings → API to get your:
   - Project URL
   - Anon/Public key

### 2. Local Development
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
# SUPABASE_URL=your_url_here
# SUPABASE_ANON_KEY=your_key_here

# Run development server
npm run dev
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
```

### 4. Deploy to Render
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repository
5. Add environment variables:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY

## Default Users
- Admin: `admin` / `admin123`
- User: `user1` / `user123`

**Important:** Change these passwords in production!

## Project Structure
```
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js (updated client)
├── server.js
├── package.json
├── vercel.json
├── render.yaml
└── supabase-setup.sql
```
