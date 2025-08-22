-- Política simples para permitir upload de fotos de perfil
-- Esta política permite que qualquer usuário autenticado faça upload no bucket fotoperfil

-- Verificar se o bucket fotoperfil existe
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'fotoperfil';

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
