-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA posts
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

-- Verificar especificamente colunas relacionadas a imagem/mídia
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name LIKE '%image%' 
   OR column_name LIKE '%media%'
   OR column_name LIKE '%url%'
   OR column_name LIKE '%file%'
ORDER BY column_name;

-- 2. Verificar alguns posts de exemplo
SELECT 
    id,
    title,
    description,
    user_id,
    created_at
FROM posts 
LIMIT 5;

-- 3. Verificar posts principais atuais (versão simplificada)
SELECT 
    'POSTS PRINCIPAIS' as tipo,
    smp.id,
    smp.salon_id,
    smp.post_id,
    smp.priority_order,
    p.title
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY smp.priority_order;

-- 4. Contar posts principais por salão
SELECT 
    salon_id,
    COUNT(*) as total_posts_principais
FROM salon_main_posts 
GROUP BY salon_id;
