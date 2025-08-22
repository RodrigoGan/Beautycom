-- =====================================================
-- PASSO 1: VERIFICAR POSTS PRINCIPAIS ATUAIS
-- =====================================================

SELECT 
    'ANTES DA LIMPEZA' as status,
    COUNT(*) as total_posts_principais
FROM salon_main_posts 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';
