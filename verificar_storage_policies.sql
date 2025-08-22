-- =====================================================
-- VERIFICAR POLÍTICAS DO STORAGE
-- =====================================================

-- Verificar se o bucket post-media existe e suas políticas
SELECT 
    bucket_id,
    name,
    public
FROM storage.buckets 
WHERE name = 'post-media';

-- =====================================================
-- VERIFICAR POLÍTICAS DE ACESSO
-- =====================================================

-- Listar políticas do bucket post-media
SELECT 
    bucket_id,
    name,
    definition
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'post-media');

-- =====================================================
-- VERIFICAR SE ARQUIVOS EXISTEM NO STORAGE
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