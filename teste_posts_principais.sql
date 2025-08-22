-- TESTE POSTS PRINCIPAIS - VERIFICAR ESTADO ATUAL
-- Verificar se a lógica de limite de 3 posts está funcionando

-- 1. VERIFICAR POSTS PRINCIPAIS ATUAIS
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as status,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id,
    created_at
FROM posts 
WHERE is_salon_main_post = true
ORDER BY salon_main_post_priority;

-- 2. VERIFICAR TOTAL DE POSTS PRINCIPAIS
SELECT 
    'TOTAL POSTS PRINCIPAIS' as status,
    COUNT(*) as total
FROM posts 
WHERE is_salon_main_post = true;

-- 3. VERIFICAR SE HÁ POSTS PRINCIPAIS SEM PRIORIDADE
SELECT 
    'POSTS PRINCIPAIS SEM PRIORIDADE' as status,
    COUNT(*) as total
FROM posts 
WHERE is_salon_main_post = true
AND salon_main_post_priority IS NULL;

-- 4. VERIFICAR SE HÁ POSTS COM PRIORIDADE MAS NÃO PRINCIPAIS
SELECT 
    'POSTS COM PRIORIDADE MAS NÃO PRINCIPAIS' as status,
    COUNT(*) as total
FROM posts 
WHERE is_salon_main_post = false
AND salon_main_post_priority IS NOT NULL;

-- 5. SIMULAR ADIÇÃO DE QUARTO POST (TESTE MANUAL)
-- Primeiro, verificar se conseguimos adicionar um quarto post
SELECT 
    'SIMULAÇÃO - ADICIONAR QUARTO POST' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM posts WHERE is_salon_main_post = true) >= 3 
        THEN 'DEVE REMOVER O ÚLTIMO POST'
        ELSE 'PODE ADICIONAR NORMALMENTE'
    END as resultado;

-- 6. VERIFICAR POSTS DISPONÍVEIS PARA SEREM PRINCIPAIS
SELECT 
    'POSTS DISPONÍVEIS PARA PRINCIPAIS' as status,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_salon_main_post = false
AND p.user_id IN (
    SELECT professional_id FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197' 
    AND status = 'accepted'
    UNION
    SELECT user_id FROM salon_employees 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197' 
    AND status = 'active'
)
ORDER BY p.created_at DESC
LIMIT 5;
