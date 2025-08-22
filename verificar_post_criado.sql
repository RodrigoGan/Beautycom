-- =====================================================
-- VERIFICAR POST CRIADO NO BANCO DE DADOS
-- =====================================================

-- Buscar o post mais recente do usuário Rodrigo Gandolpho
SELECT
    p.id,
    p.title,
    p.description,
    p.post_type,
    p.media_urls,
    p.user_id,
    u.nickname as author_nickname,
    u.email as author_email,
    c.name AS category_name,
    p.created_at,
    p.updated_at,
    p.is_active
FROM
    posts p
JOIN
    categories c ON p.category_id = c.id
JOIN
    users u ON p.user_id = u.id
WHERE
    u.email = 'rodrigo_gan@hotmail.com'
ORDER BY
    p.created_at DESC
LIMIT 1;

-- =====================================================
-- VERIFICAR TODOS OS POSTS DO USUÁRIO
-- =====================================================

-- Listar todos os posts do Rodrigo Gandolpho
SELECT
    p.id,
    p.title,
    p.description,
    p.post_type,
    p.media_urls,
    c.name AS category,
    p.created_at
FROM
    posts p
JOIN
    categories c ON p.category_id = c.id
JOIN
    users u ON p.user_id = u.id
WHERE
    u.email = 'rodrigo_gan@hotmail.com'
ORDER BY
    p.created_at DESC;

-- =====================================================
-- VERIFICAR ESTRUTURA DO MEDIA_URLS
-- =====================================================

-- Verificar como ficou o JSON do media_urls do post mais recente
SELECT
    p.id,
    p.title,
    p.media_urls,
    jsonb_typeof(p.media_urls) as media_urls_type,
    jsonb_array_length(p.media_urls->'media') as media_count
FROM
    posts p
JOIN
    users u ON p.user_id = u.id
WHERE
    u.email = 'rodrigo_gan@hotmail.com'
ORDER BY
    p.created_at DESC
LIMIT 1;

-- =====================================================
-- VERIFICAR SE AS IMAGENS ESTÃO NO STORAGE
-- =====================================================

-- Para verificar se há arquivos no bucket post-media:
-- SELECT * FROM storage.objects WHERE bucket_id = 'post-media' ORDER BY created_at DESC LIMIT 5;

-- Para verificar se há arquivos no bucket post-gallery:
-- SELECT * FROM storage.objects WHERE bucket_id = 'post-gallery' ORDER BY created_at DESC LIMIT 5;

-- Para verificar se há arquivos no bucket post-before-after:
-- SELECT * FROM storage.objects WHERE bucket_id = 'post-before-after' ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- VERIFICAR DADOS ESPECÍFICOS DO POST
-- =====================================================

-- Verificar se o post tem os dados corretos
SELECT
    CASE 
        WHEN p.title = 'Unhas de princesa ou achou brega?' THEN '✅ Título correto'
        ELSE '❌ Título incorreto: ' || p.title
    END as title_check,
    CASE 
        WHEN p.description = 'Faria isso ou considera muito chamativa?' THEN '✅ Descrição correta'
        ELSE '❌ Descrição incorreta: ' || p.description
    END as description_check,
    CASE 
        WHEN c.name = 'Cuidados com as Unhas' THEN '✅ Categoria correta'
        ELSE '❌ Categoria incorreta: ' || c.name
    END as category_check,
    CASE 
        WHEN p.post_type = 'normal' THEN '✅ Tipo de post correto'
        ELSE '❌ Tipo de post incorreto: ' || p.post_type
    END as post_type_check,
    CASE 
        WHEN p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls->'media') > 0 THEN '✅ Media URLs presentes'
        ELSE '❌ Media URLs ausentes'
    END as media_check
FROM
    posts p
JOIN
    categories c ON p.category_id = c.id
JOIN
    users u ON p.user_id = u.id
WHERE
    u.email = 'rodrigo_gan@hotmail.com'
ORDER BY
    p.created_at DESC
LIMIT 1; 