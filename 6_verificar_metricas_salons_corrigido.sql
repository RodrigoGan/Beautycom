-- Script 6: Verificar métricas dos salões (VERSÃO CORRIGIDA)
-- Este script mostra as métricas atuais de todos os salões para verificar se estão corretas

-- Verificar métricas detalhadas de todos os salões
WITH salon_metrics AS (
    SELECT 
        s.id as salon_id,
        s.name as salon_name,
        s.owner_id,
        u.name as owner_name,
        u.user_type as owner_type,
        s.created_at,
        
        -- Contar seguidores
        (SELECT COUNT(*) FROM salon_follows sf WHERE sf.salon_id = s.id) as seguidores,
        
        -- Contar profissionais vinculados (apenas profissionais aceitos)
        (SELECT COUNT(*) 
         FROM salon_professionals sp 
         JOIN users u2 ON u2.id = sp.professional_id 
         WHERE sp.salon_id = s.id 
           AND sp.status = 'accepted' 
           AND u2.user_type = 'profissional') as profissionais,
        
        -- Contar clientes (interações)
        (SELECT COUNT(DISTINCT si.user_id) 
         FROM salon_interactions si 
         WHERE si.salon_id = s.id) as clientes,
        
        -- Contar posts dos profissionais vinculados
        (SELECT COUNT(*) 
         FROM posts p 
         JOIN salon_professionals sp ON sp.professional_id = p.user_id 
         WHERE sp.salon_id = s.id 
           AND sp.status = 'accepted' 
           AND p.is_active = true) as posts
        
    FROM salons_studios s
    JOIN users u ON u.id = s.owner_id
)
SELECT 
    salon_id,
    salon_name,
    owner_name,
    owner_type,
    seguidores,
    profissionais,
    clientes,
    posts,
    CASE 
        WHEN profissionais = 0 THEN '❌ SEM PROFISSIONAIS'
        WHEN profissionais > 0 THEN '✅ COM PROFISSIONAIS'
    END as status_profissionais,
    CASE 
        WHEN posts = 0 THEN '❌ SEM POSTS'
        WHEN posts > 0 THEN '✅ COM POSTS'
    END as status_posts
FROM salon_metrics
ORDER BY created_at;

-- Verificar especificamente o salão do Rodrigo
SELECT 
    'BARBEARIA DO RODRIGO' as salao,
    s.id as salon_id,
    s.name as salon_name,
    u.name as owner_name,
    
    -- Profissionais vinculados
    (SELECT COUNT(*) 
     FROM salon_professionals sp 
     JOIN users u2 ON u2.id = sp.professional_id 
     WHERE sp.salon_id = s.id 
       AND sp.status = 'accepted' 
       AND u2.user_type = 'profissional') as profissionais_vinculados,
    
    -- Posts dos profissionais
    (SELECT COUNT(*) 
     FROM posts p 
     JOIN salon_professionals sp ON sp.professional_id = p.user_id 
     WHERE sp.salon_id = s.id 
       AND sp.status = 'accepted' 
       AND p.is_active = true) as posts_profissionais,
    
    -- Posts do Rodrigo especificamente
    (SELECT COUNT(*) 
     FROM posts p 
     WHERE p.user_id = s.owner_id 
       AND p.is_active = true) as posts_rodrigo
    
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.name ILIKE '%Barbearia do Rodrigo%';

-- Listar profissionais vinculados ao salão do Rodrigo
SELECT 
    sp.id as vinculo_id,
    sp.salon_id,
    sp.professional_id,
    sp.status as vinculo_status,
    u.name as professional_name,
    u.user_type,
    u.email
FROM salon_professionals sp
JOIN users u ON u.id = sp.professional_id
JOIN salons_studios s ON s.id = sp.salon_id
WHERE s.name ILIKE '%Barbearia do Rodrigo%'
ORDER BY sp.created_at;

-- Listar posts do Rodrigo
SELECT 
    p.id,
    p.title,
    p.post_type,
    p.is_active,
    p.created_at,
    c.name as categoria
FROM posts p
LEFT JOIN categories c ON c.id = p.category_id
JOIN salons_studios s ON s.owner_id = p.user_id
WHERE s.name ILIKE '%Barbearia do Rodrigo%'
  AND p.is_active = true
ORDER BY p.created_at DESC;



