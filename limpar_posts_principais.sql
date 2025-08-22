-- =====================================================
-- LIMPAR POSTS PRINCIPAIS DO SALÃO
-- =====================================================

-- 1. Verificar posts principais atuais
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as tipo,
    smp.id,
    smp.salon_id,
    smp.post_id,
    smp.priority_order,
    p.title as post_titulo
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY smp.priority_order;

-- 2. Contar posts principais por salão
SELECT 
    salon_id,
    COUNT(*) as total_posts_principais
FROM salon_main_posts 
GROUP BY salon_id;

-- 3. LIMPAR POSTS PRINCIPAIS (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM salon_main_posts 
-- WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 4. Verificar se foi limpo
-- SELECT 
--     'APÓS LIMPEZA' as tipo,
--     COUNT(*) as posts_restantes
-- FROM salon_main_posts 
-- WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 5. Verificar se há problemas de integridade
SELECT 
    'VERIFICAÇÃO INTEGRIDADE' as tipo,
    smp.id,
    smp.salon_id,
    smp.post_id,
    CASE 
        WHEN p.id IS NULL THEN 'POST NÃO EXISTE'
        WHEN ss.id IS NULL THEN 'SALÃO NÃO EXISTE'
        ELSE 'OK'
    END as status
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
LEFT JOIN salons_studios ss ON smp.salon_id = ss.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 6. Verificar se os posts ainda existem
SELECT 
    'POSTS EXISTENTES' as tipo,
    p.id,
    p.title,
    p.user_id,
    u.name as autor
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.id IN (
    'c3f63819-2c92-4332-8490-9e29068025fe',
    '2d1e6121-5485-4633-8fa1-2e84c68d631a',
    '56893b15-85d4-452e-bfcb-a0762a2299e5'
);
