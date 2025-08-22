-- =====================================================
-- VERIFICAR TABELA SALON_MAIN_POSTS
-- =====================================================

-- 1. Verificar se a tabela existe
SELECT 
    'TABELA' as tipo,
    table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salon_main_posts'
    ) as existe
FROM (VALUES ('salon_main_posts')) AS t(table_name);

-- 2. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_main_posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT 
    'RLS' as tipo,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'salon_main_posts';

-- 4. Verificar políticas RLS
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
WHERE tablename = 'salon_main_posts';

-- 5. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'salon_main_posts';

-- 6. Verificar registros existentes
SELECT 
    'REGISTROS' as tipo,
    COUNT(*) as total_registros
FROM salon_main_posts;

-- 7. Verificar registros por salão
SELECT 
    salon_id,
    COUNT(*) as posts_principais,
    STRING_AGG(post_id::text, ', ') as post_ids
FROM salon_main_posts 
GROUP BY salon_id;

-- 8. Verificar se há posts duplicados
SELECT 
    post_id,
    COUNT(*) as ocorrencias
FROM salon_main_posts 
GROUP BY post_id 
HAVING COUNT(*) > 1;

-- 9. Verificar se há problemas de integridade referencial
SELECT 
    'POSTS SEM AUTOR' as tipo,
    smp.post_id,
    smp.salon_id
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE p.id IS NULL;

-- 10. Verificar se há problemas de integridade referencial com salões
SELECT 
    'SALOES SEM AUTOR' as tipo,
    smp.salon_id,
    smp.post_id
FROM salon_main_posts smp
LEFT JOIN salons_studios ss ON smp.salon_id = ss.id
WHERE ss.id IS NULL;
