-- =====================================================
-- VERIFICAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Verificar todas as políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname;

-- =====================================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('posts', 'post_likes', 'post_comments');

-- =====================================================
-- TESTAR INSERÇÃO DE POST (SIMULAÇÃO)
-- =====================================================

-- Verificar se o usuário atual pode inserir na tabela posts
-- (Execute isso quando estiver logado)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- =====================================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar estrutura da tabela posts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela post_likes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_likes'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela post_comments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_comments'
ORDER BY ordinal_position; 