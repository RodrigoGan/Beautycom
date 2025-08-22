-- =====================================================
-- VERIFICAR SE POST FOI INSERIDO
-- =====================================================

-- 1. Verificar posts principais atuais
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as status,
    COUNT(*) as total_posts_principais
FROM salon_main_posts 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 2. Verificar detalhes dos posts principais
SELECT 
    smp.id,
    smp.post_id,
    smp.priority_order,
    smp.created_at,
    p.title
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY smp.priority_order;

-- 3. Verificar se há posts recentes (últimos 5 minutos)
SELECT 
    'POSTS RECENTES' as status,
    smp.id,
    smp.post_id,
    smp.priority_order,
    smp.created_at,
    p.title
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND smp.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY smp.created_at DESC;
