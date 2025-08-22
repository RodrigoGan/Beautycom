-- Verificar se o bucket fotoperfil existe
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'fotoperfil';

-- Verificar arquivos no bucket fotoperfil
SELECT 
    name,
    size,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'fotoperfil'
ORDER BY updated_at DESC;

-- Verificar políticas RLS do bucket
SELECT 
    name,
    definition
FROM storage.policies 
WHERE bucket_id = 'fotoperfil';
