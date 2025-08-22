-- Testar se o sistema de permissões está funcionando
-- Verificar se o usuário tem a permissão necessária

-- 1. Verificar se o hook useSalonPermissions vai encontrar o usuário
SELECT 
    'TESTE SISTEMA DE PERMISSÕES' as info,
    se.user_id,
    se.salon_id,
    se.role,
    se.status,
    se.permissions,
    CASE 
        WHEN se.permissions->'content_management'->'content_management.manage_main_posts' = 'true'::jsonb 
        THEN 'SIM - TEM PERMISSÃO'
        ELSE 'NÃO - SEM PERMISSÃO'
    END as has_permission_check
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND se.status = 'active';

-- 2. Simular a query que o hook useSalonPermissions faz
SELECT 
    'SIMULAÇÃO DO HOOK useSalonPermissions' as info,
    se.user_id,
    se.salon_id,
    se.permissions->'content_management' as content_management_permissions,
    se.permissions->'content_management'->'content_management.manage_main_posts' as manage_main_posts_permission
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 3. Verificar se há algum outro registro conflitante
SELECT 
    'VERIFICAR REGISTROS CONFLITANTES' as info,
    COUNT(*) as total_records,
    string_agg(se.role, ', ') as roles_found,
    string_agg(se.status, ', ') as statuses_found
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 4. Verificar posts que deveriam ter botões de estrela
SELECT 
    'POSTS QUE DEVERIAM TER BOTÕES' as info,
    p.id,
    p.title,
    p.user_id,
    CASE 
        WHEN p.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'POST DO PROPRIETÁRIO'
        ELSE 'POST DE OUTRO PROFISSIONAL'
    END as post_owner_type,
    p.is_salon_main_post,
    p.salon_main_post_priority
FROM posts p
JOIN salon_professionals sp ON p.user_id = sp.professional_id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND sp.status = 'accepted'
ORDER BY p.created_at DESC
LIMIT 5;
