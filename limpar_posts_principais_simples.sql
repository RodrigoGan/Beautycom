-- =====================================================
-- LIMPAR POSTS PRINCIPAIS - VERSÃO SIMPLES
-- =====================================================

-- 1. Verificar posts principais atuais
SELECT 
    'ANTES DA LIMPEZA' as status,
    COUNT(*) as total_posts_principais
FROM salon_main_posts 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 2. Verificar detalhes dos posts principais
SELECT 
    smp.id,
    smp.post_id,
    smp.priority_order,
    p.title
FROM salon_main_posts smp
LEFT JOIN posts p ON smp.post_id = p.id
WHERE smp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY smp.priority_order;

-- 3. LIMPAR POSTS PRINCIPAIS (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM salon_main_posts 
-- WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 4. Verificar se foi limpo (DESCOMENTE APÓS EXECUTAR O DELETE)
-- SELECT 
--     'APÓS LIMPEZA' as status,
--     COUNT(*) as total_posts_principais
-- FROM salon_main_posts 
-- WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';
