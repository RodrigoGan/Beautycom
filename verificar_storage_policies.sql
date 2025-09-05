-- =====================================================
-- VERIFICAR POLÍTICAS DO BUCKET SERVICE-PHOTOS
-- =====================================================

-- 1. Verificar se o bucket service-photos existe
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'service-photos';

-- 2. Verificar se há arquivos no bucket service-photos
SELECT 
    o.name,
    o.bucket_id,
    o.owner,
    o.created_at,
    o.updated_at,
    o.last_accessed_at,
    o.metadata
FROM storage.objects o
WHERE o.bucket_id = 'service-photos'
LIMIT 10;

-- 3. Verificar políticas do bucket service-photos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%service-photos%';

-- 4. Verificar todas as políticas de storage
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- 5. Verificar estrutura da tabela storage.objects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
ORDER BY ordinal_position; 