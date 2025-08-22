-- Criar bucket fotoperfil se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fotoperfil',
    'fotoperfil',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas RLS para o bucket fotoperfil
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
CREATE POLICY "Usuários podem deletar suas fotos de perfil" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'fotoperfil' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
