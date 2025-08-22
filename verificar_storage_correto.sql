-- =====================================================
-- VERIFICAR STORAGE DO SUPABASE (CORRETO)
-- =====================================================

-- Verificar se o bucket post-media existe
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE name = 'post-media';

-- =====================================================
-- VERIFICAR ARQUIVOS NO BUCKET
-- =====================================================

-- Listar arquivos no bucket post-media
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'post-media')
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- VERIFICAR SE BUCKET ESTÁ PÚBLICO
-- =====================================================

-- Verificar configuração do bucket
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'post-media'; 