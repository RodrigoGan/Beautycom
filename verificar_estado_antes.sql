-- =====================================================
-- VERIFICAR ESTADO ANTES DE MARCAR POST COMO PRINCIPAL
-- =====================================================

-- 1. VERIFICAR SALÃO
SELECT 
    'DADOS DO SALÃO' as secao,
    id,
    name,
    owner_id
FROM salons_studios 
WHERE id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 2. VERIFICAR PROFISSIONAIS VINCULADOS AO SALÃO
SELECT 
    'PROFISSIONAIS DO SALÃO' as secao,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    u.name as nome_profissional,
    u.nickname as apelido_profissional
FROM salon_professionals sp
INNER JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND sp.status = 'accepted';

-- 3. VERIFICAR POSTS DOS PROFISSIONAIS (ANTES DE MARCAR COMO PRINCIPAL)
SELECT 
    'POSTS DOS PROFISSIONAIS (ANTES)' as secao,
    p.id as post_id,
    p.titulo,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
ORDER BY p.created_at DESC;

-- 4. VERIFICAR POSTS PRINCIPAIS ATUAIS
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as secao,
    COUNT(*) as total_posts_principais
FROM posts 
WHERE is_salon_main_post = true;

-- 5. VERIFICAR TABELA salon_main_posts (estrutura antiga)
SELECT 
    'TABELA salon_main_posts (ANTIGA)' as secao,
    COUNT(*) as total_registros
FROM salon_main_posts;
