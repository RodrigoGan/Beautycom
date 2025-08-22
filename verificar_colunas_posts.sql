-- =====================================================
-- VERIFICAR TODAS AS COLUNAS DA TABELA posts
-- =====================================================

-- Verificar todas as colunas da tabela posts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Verificar especificamente colunas relacionadas a tipo de post
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND (
    column_name LIKE '%video%' 
    OR column_name LIKE '%carousel%' 
    OR column_name LIKE '%before%' 
    OR column_name LIKE '%after%'
    OR column_name LIKE '%type%'
    OR column_name LIKE '%post%'
)
ORDER BY column_name;
