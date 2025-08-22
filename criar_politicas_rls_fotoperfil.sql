-- Habilitar RLS no bucket fotoperfil
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam todas as fotos de perfil
CREATE POLICY "Fotos de perfil são visíveis para todos" ON storage.objects
    FOR SELECT USING (bucket_id = 'fotoperfil');

-- Política para permitir que usuários façam upload de suas próprias fotos
CREATE POLICY "Usuários podem fazer upload de suas fotos de perfil" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'fotoperfil' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas fotos de perfil" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'fotoperfil' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para permitir que usuários deletem suas próprias fotos
CREATE POLICY "Usuários podem deletem suas fotos de perfil" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'fotoperfil' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
