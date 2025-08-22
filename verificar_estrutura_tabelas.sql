-- =====================================================
-- VERIFICAR ESTRUTURA DAS TABELAS ENVOLVIDAS
-- =====================================================

-- 1. ESTRUTURA DA TABELA posts
SELECT 
    'ESTRUTURA TABELA posts' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 2. ESTRUTURA DA TABELA salon_professionals
SELECT 
    'ESTRUTURA TABELA salon_professionals' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'salon_professionals'
ORDER BY ordinal_position;

-- 3. ESTRUTURA DA TABELA salon_main_posts (estrutura antiga)
SELECT 
    'ESTRUTURA TABELA salon_main_posts' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'salon_main_posts'
ORDER BY ordinal_position;

-- 4. ESTRUTURA DA TABELA users
SELECT 
    'ESTRUTURA TABELA users' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. VERIFICAR SE OS CAMPOS NOVOS EXISTEM NA TABELA posts
SELECT 
    'VERIFICAÇÃO CAMPOS NOVOS posts' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('is_salon_main_post', 'salon_main_post_priority')
ORDER BY column_name;
