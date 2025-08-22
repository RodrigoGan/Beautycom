-- =====================================================
-- LIMPAR POSTS PRINCIPAIS DO SALÃO - LIMPEZA COMPLETA
-- =====================================================

-- 1. LIMPAR TABELA salon_main_posts (estrutura antiga)
DELETE FROM salon_main_posts 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 2. LIMPAR CAMPOS NOVOS NA TABELA posts
UPDATE posts 
SET 
    is_salon_main_post = false,
    salon_main_post_priority = null
WHERE id IN (
    SELECT p.id 
    FROM posts p
    INNER JOIN salon_professionals sp ON p.user_id = sp.professional_id
    WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND sp.status = 'accepted'
);

-- 3. VERIFICAR RESULTADO DA LIMPEZA
SELECT 
    'POSTS PRINCIPAIS APÓS LIMPEZA' as status,
    COUNT(*) as total_posts_principais
FROM posts 
WHERE is_salon_main_post = true;

SELECT 
    'REGISTROS NA TABELA salon_main_posts' as status,
    COUNT(*) as total_registros
FROM salon_main_posts;
