-- 009_storage_rls.sql
-- Add RLS policies to storage.objects for task-submissions bucket

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Ensure task-submissions bucket exists
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('task-submissions', 'task-submissions', false, 52428800)
    ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800;

    -- RLS Policies on storage.objects
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload task submission files'
    ) THEN
      CREATE POLICY "Authenticated users can upload task submission files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'task-submissions');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can view task submission files'
    ) THEN
      CREATE POLICY "Authenticated users can view task submission files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'task-submissions');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update their task submission files'
    ) THEN
      CREATE POLICY "Authenticated users can update their task submission files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'task-submissions')
      WITH CHECK (bucket_id = 'task-submissions');
    END IF;
  END IF;
END $$;
