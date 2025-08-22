-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS - STORAGE
-- =====================================================

-- O erro no upload de fotos indica que as políticas RLS do Storage
-- estão impedindo o upload de arquivos

-- =====================================================
-- 1. VERIFICAR BUCKETS EXISTENTES
-- =====================================================

-- Verificar buckets de storage
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- =====================================================
-- 2. CONFIGURAR BUCKET FOTOPERFIL
-- =====================================================

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotoperfil', 'fotoperfil', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. REMOVER POLÍTICAS RESTRITIVAS DO STORAGE
-- =====================================================

-- Remover políticas que podem estar bloqueando uploads
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;

-- =====================================================
-- 4. CRIAR POLÍTICAS CORRETAS PARA STORAGE
-- =====================================================

-- Política para permitir upload de arquivos autenticados
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir visualização de arquivos públicos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'fotoperfil');

-- Política para permitir atualização de arquivos próprios
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE 
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir exclusão de arquivos próprios
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE 
  USING (auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- 5. CONFIGURAR BUCKETS ADICIONAIS
-- =====================================================

-- Bucket para fotos de posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotopost', 'fotopost', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de capa
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotodecapa', 'fotodecapa', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para logotipos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logotipo', 'logotipo', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Verificar buckets configurados
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- Verificar políticas do storage
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

/*
CONFIGURAÇÃO DE STORAGE:

✅ BUCKETS CRIADOS:
- fotoperfil: Fotos de perfil dos usuários
- fotopost: Fotos dos posts do BeautyWall
- fotodecapa: Fotos de capa de salões/estúdios
- logotipo: Logotipos de salões/estúdios

✅ POLÍTICAS RLS:
- Upload: Usuários autenticados podem fazer upload
- Visualização: Arquivos públicos podem ser vistos
- Atualização: Usuários podem atualizar seus arquivos
- Exclusão: Usuários podem excluir seus arquivos

✅ SEGURANÇA:
- Arquivos organizados por usuário
- Controle de acesso por autenticação
- Buckets públicos para visualização
*/

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 