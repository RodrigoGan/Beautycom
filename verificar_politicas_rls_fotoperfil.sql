-- Verificar políticas RLS do bucket fotoperfil
SELECT 
    name,
    definition
FROM storage.policies 
WHERE bucket_id = 'fotoperfil';

-- Verificar se o bucket fotoperfil existe
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'fotoperfil';

-- Verificar arquivos no bucket (sem a coluna size)
SELECT 
    name,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'fotoperfil'
ORDER BY updated_at DESC;
