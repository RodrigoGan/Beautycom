-- =====================================================
-- TORNAR BUCKET PÚBLICO
-- =====================================================

-- Habilitar acesso público ao bucket post-media
UPDATE storage.buckets 
SET public = true 
WHERE name = 'post-media';

-- =====================================================
-- VERIFICAR SE FOI ALTERADO
-- =====================================================

-- Verificar se o bucket está público
SELECT 
    name,
    public
FROM storage.buckets 
WHERE name = 'post-media'; 