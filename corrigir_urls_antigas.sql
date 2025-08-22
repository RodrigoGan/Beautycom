-- =====================================================
-- CORRIGIR URLs ANTIGAS DOS POSTS
-- =====================================================

-- Primeiro, vamos ver quais posts têm URLs de exemplo
SELECT 
    id,
    title,
    media_urls,
    CASE 
        WHEN media_urls::text LIKE '%example.com%' THEN 'URL de exemplo'
        WHEN media_urls::text LIKE '%supabase.co%' THEN 'URL real'
        ELSE 'Outro formato'
    END as url_type
FROM posts 
WHERE media_urls IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- ATUALIZAR POSTS COM URLs DE EXEMPLO
-- =====================================================

-- Post 1: "Transformação incrível!" (fcf51ac5-6020-4fc4-9806-822dbb474901)
UPDATE posts 
SET media_urls = '{"type": "before-after", "before": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-before-after/c3f63819-2c92-4332-8490-9e29068025fe/before_1754565323060_67t6ohhk5ym.jpg", "after": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-before-after/c3f63819-2c92-4332-8490-9e29068025fe/after_1754565323060_67t6ohhk5ym.jpg"}'
WHERE id = 'fcf51ac5-6020-4fc4-9806-822dbb474901';

-- Post 2: "Barba perfeita!" (8665b7e7-45ee-4588-94e7-1934bafaae13)
UPDATE posts 
SET media_urls = '{"type": "normal", "url": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-media/f974a69e-962d-43c8-ace5-2b23e8465b38/1754503283149_7b9vbyoqtkb.jpg"}'
WHERE id = '8665b7e7-45ee-4588-94e7-1934bafaae13';

-- Post 3: "Nail art delicada" (37d927c8-6264-4336-8889-a60d52f86203)
UPDATE posts 
SET media_urls = '{"type": "normal", "url": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-media/66d19962-e8d6-4e9e-9074-104e5adde09b/1754503243404_rwny1hhnrh.jpg"}'
WHERE id = '37d927c8-6264-4336-8889-a60d52f86203';

-- Post 4: "Maquiagem para festa" (39c2ebfd-f89e-4ac4-9cc7-1b094948e705)
UPDATE posts 
SET media_urls = '{"type": "normal", "url": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-media/98224b1c-fba6-4019-9ee6-a1e80f1f201d/1754509359425_tqyh77upuv.mp4"}'
WHERE id = '39c2ebfd-f89e-4ac4-9cc7-1b094948e705';

-- Post 5: "Tratamento facial" (ddb72440-78b2-4497-a84e-036e9a74f38f)
UPDATE posts 
SET media_urls = '{"type": "normal", "url": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-media/f974a69e-962d-43c8-ace5-2b23e8465b38/1754503283149_7b9vbyoqtkb.jpg"}'
WHERE id = 'ddb72440-78b2-4497-a84e-036e9a74f38f';

-- Post 6: "Design de sobrancelhas" (d5cecd1d-9785-4b96-b798-0296f2335102)
UPDATE posts 
SET media_urls = '{"type": "normal", "url": "https://dgkzxadlmiafbegmdxcz.supabase.co/storage/v1/object/public/post-media/66d19962-e8d6-4e9e-9074-104e5adde09b/1754503243404_rwny1hhnrh.jpg"}'
WHERE id = 'd5cecd1d-9785-4b96-b798-0296f2335102';

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar se todas as URLs foram corrigidas
SELECT 
    id,
    title,
    media_urls,
    CASE 
        WHEN media_urls::text LIKE '%example.com%' THEN '❌ URL de exemplo'
        WHEN media_urls::text LIKE '%supabase.co%' THEN '✅ URL real'
        ELSE '❓ Outro formato'
    END as status
FROM posts 
WHERE media_urls IS NOT NULL
ORDER BY created_at DESC;
