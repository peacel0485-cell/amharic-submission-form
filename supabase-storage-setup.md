# Supabase Storage Setup for File Attachments

## Steps to Enable File Uploads:

1. Go to your Supabase project dashboard
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket with these settings:
   - **Name:** `attachments`
   - **Public bucket:** ✅ Check this (so files can be accessed via URL)
   - Click **Create bucket**

5. Set bucket policies:
   - Click on the `attachments` bucket
   - Go to **Policies** tab
   - Click **New Policy**
   - Select **For full customization**
   - Add these two policies:

### Policy 1: Allow INSERT (Upload)
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'attachments');
```

### Policy 2: Allow SELECT (Download/View)
```sql
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');
```

6. Click **Review** and **Save policy**

## Alternative: Run this SQL in SQL Editor

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true);

-- Allow uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'attachments');

-- Allow public downloads
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');
```

## Update Database Schema

Run this in SQL Editor to add the attachment_url column:

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
```

## Done!

Now users can upload files and they will be stored in Supabase Storage with clickable download links!
