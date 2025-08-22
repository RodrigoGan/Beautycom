-- DIAGNÓSTICO COMPLETO DO PROBLEMA
-- Post problemático: 2d1e6121-5485-4633-8fa1-2e84c68d631a

-- 1. VERIFICAR SE O POST PROBLEMÁTICO EXISTE
SELECT 
    'POST PROBLEMÁTICO EXISTE?' as teste,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SIM - ' || COUNT(*) || ' registros'
        ELSE 'NÃO ENCONTRADO'
    END as resultado
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 2. ESTADO ATUAL DO POST PROBLEMÁTICO
SELECT 
    'ESTADO ATUAL POST PROBLEMÁTICO' as teste,
    id,
    title,
    user_id,
    is_salon_main_post,
    salon_main_post_priority,
    created_at,
    updated_at
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 3. VERIFICAR SE O POST PERTENCE AO SALÃO
SELECT 
    'VÍNCULO COM SALÃO' as teste,
    p.id,
    p.title,
    p.user_id,
    CASE 
        WHEN sp.professional_id IS NOT NULL THEN 'PROFISSIONAL'
        WHEN se.user_id IS NOT NULL THEN 'FUNCIONÁRIO'
        WHEN p.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'PROPRIETÁRIO'
        ELSE 'NÃO VINCULADO'
    END as tipo_membro
FROM posts p
LEFT JOIN salon_professionals sp ON p.user_id = sp.professional_id AND sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
LEFT JOIN salon_employees se ON p.user_id = se.user_id AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
WHERE p.id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 4. TODOS OS POSTS PRINCIPAIS ATUAIS
SELECT 
    'TODOS POSTS PRINCIPAIS' as teste,
    id,
    title,
    user_id,
    is_salon_main_post,
    salon_main_post_priority,
    created_at
FROM posts 
WHERE is_salon_main_post = true
ORDER BY salon_main_post_priority;

-- 5. TESTAR UPDATE DIRETO
-- Primeiro, verificar se conseguimos fazer um UPDATE simples
UPDATE posts 
SET updated_at = NOW()
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 6. VERIFICAR SE O UPDATE SIMPLES FUNCIONOU
SELECT 
    'UPDATE SIMPLES FUNCIONOU?' as teste,
    id,
    title,
    updated_at
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 7. AGORA TESTAR O UPDATE ESPECÍFICO
UPDATE posts 
SET 
    is_salon_main_post = false,
    salon_main_post_priority = NULL,
    updated_at = NOW()
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 8. VERIFICAR SE O UPDATE ESPECÍFICO FUNCIONOU
SELECT 
    'UPDATE ESPECÍFICO FUNCIONOU?' as teste,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    updated_at
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 9. VERIFICAR RLS NA TABELA POSTS
SELECT 
    'RLS STATUS' as teste,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'posts';

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 
    'POLÍTICAS RLS' as teste,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts';
