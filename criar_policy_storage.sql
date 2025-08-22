-- =====================================================
-- CRIAR POLÍTICA PÚBLICA PARA STORAGE
-- =====================================================

-- Habilitar acesso público ao bucket post-media
UPDATE storage.buckets 
SET public = true 
WHERE name = 'post-media';

-- =====================================================
-- CRIAR POLÍTICA PARA LER ARQUIVOS
-- =====================================================

-- Política para permitir leitura pública de arquivos
INSERT INTO storage.policies (bucket_id, name, definition)
SELECT 
    id as bucket_id,
    'Public Access' as name,
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"s3:GetObject","Resource":"arn:aws:s3:::post-media/*"}]}' as definition
FROM storage.buckets 
WHERE name = 'post-media'
ON CONFLICT (bucket_id, name) DO NOTHING;

-- =====================================================
-- VERIFICAR SE POLÍTICA FOI CRIADA
-- =====================================================

-- Verificar se o bucket está público
SELECT 
    name,
    public
FROM storage.buckets 
WHERE name = 'post-media'; 