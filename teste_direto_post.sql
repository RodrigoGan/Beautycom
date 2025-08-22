-- TESTE DIRETO DO POST PROBLEMÁTICO
-- Post ID: 2d1e6121-5485-4633-8fa1-2e84c68d631a

-- 1. VERIFICAR ESTADO ATUAL
SELECT 
    'ESTADO ATUAL' as teste,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id,
    updated_at
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 2. TESTAR UPDATE SIMPLES (DESMARCAR COMO PRINCIPAL)
UPDATE posts 
SET 
    is_salon_main_post = false,
    salon_main_post_priority = NULL,
    updated_at = NOW()
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 3. VERIFICAR SE O UPDATE FUNCIONOU
SELECT 
    'APÓS UPDATE' as teste,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id,
    updated_at
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 4. VERIFICAR TODOS OS POSTS PRINCIPAIS ATUAIS
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as teste,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id
FROM posts 
WHERE is_salon_main_post = true
ORDER BY salon_main_post_priority;
