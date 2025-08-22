-- =====================================================
-- AUDITORIA DO STORAGE - ANÁLISE DE OTIMIZAÇÃO
-- =====================================================

-- Objetivo: Analisar arquivos existentes para identificar oportunidades de compressão

-- =====================================================
-- 1. RESUMO GERAL DO STORAGE
-- =====================================================

-- Total de buckets e arquivos
SELECT 
    'RESUMO GERAL' as tipo,
    COUNT(DISTINCT b.id) as total_buckets,
    COUNT(o.id) as total_arquivos,
    COALESCE(SUM(o.metadata->>'size')::bigint, 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(o.metadata->>'size')::bigint, 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id;

-- =====================================================
-- 2. ANÁLISE POR BUCKET
-- =====================================================

-- Detalhes por bucket
SELECT 
    b.name as bucket,
    COUNT(o.id) as total_arquivos,
    COALESCE(SUM(o.metadata->>'size')::bigint, 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(o.metadata->>'size')::bigint, 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb,
    ROUND(AVG(o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as tamanho_medio_mb,
    MAX(o.metadata->>'size')::bigint as maior_arquivo_bytes,
    ROUND(MAX(o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as maior_arquivo_mb
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.id, b.name
ORDER BY tamanho_total_mb DESC;

-- =====================================================
-- 3. ANÁLISE POR TIPO DE ARQUIVO
-- =====================================================

-- Distribuição por tipo MIME
SELECT 
    o.metadata->>'mimetype' as tipo_mime,
    COUNT(*) as quantidade,
    COALESCE(SUM(o.metadata->>'size')::bigint, 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(o.metadata->>'size')::bigint, 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb,
    ROUND(AVG(o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as tamanho_medio_mb
FROM storage.objects o
GROUP BY o.metadata->>'mimetype'
ORDER BY tamanho_total_mb DESC;

-- =====================================================
-- 4. ARQUIVOS MAIORES (OPORTUNIDADES DE COMPRESSÃO)
-- =====================================================

-- Top 20 maiores arquivos
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    o.metadata->>'mimetype' as tipo_mime,
    o.metadata->>'size'::bigint as tamanho_bytes,
    ROUND(o.metadata->>'size'::bigint / 1024.0 / 1024.0, 2) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
ORDER BY o.metadata->>'size'::bigint DESC
LIMIT 20;

-- =====================================================
-- 5. ANÁLISE DE VÍDEOS (MAIOR IMPACTO)
-- =====================================================

-- Todos os vídeos
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    o.metadata->>'size'::bigint as tamanho_bytes,
    ROUND(o.metadata->>'size'::bigint / 1024.0 / 1024.0, 2) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'mimetype' LIKE 'video/%'
ORDER BY o.metadata->>'size'::bigint DESC;

-- =====================================================
-- 6. ANÁLISE DE IMAGENS
-- =====================================================

-- Imagens maiores que 1MB (oportunidades de compressão)
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    o.metadata->>'mimetype' as tipo_mime,
    o.metadata->>'size'::bigint as tamanho_bytes,
    ROUND(o.metadata->>'size'::bigint / 1024.0 / 1024.0, 2) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'mimetype' LIKE 'image/%'
  AND o.metadata->>'size'::bigint > 1024 * 1024 -- > 1MB
ORDER BY o.metadata->>'size'::bigint DESC;

-- =====================================================
-- 7. ESTIMATIVA DE ECONOMIA COM COMPRESSÃO
-- =====================================================

-- Estimativa de economia baseada em compressão típica
WITH tamanhos_atuais AS (
    SELECT 
        o.metadata->>'mimetype' as tipo_mime,
        COUNT(*) as quantidade,
        SUM(o.metadata->>'size')::bigint as tamanho_atual_bytes
    FROM storage.objects o
    GROUP BY o.metadata->>'mimetype'
)
SELECT 
    tipo_mime,
    quantidade,
    ROUND(tamanho_atual_bytes / 1024.0 / 1024.0, 2) as tamanho_atual_mb,
    CASE 
        WHEN tipo_mime LIKE 'video/%' THEN ROUND(tamanho_atual_bytes * 0.3 / 1024.0 / 1024.0, 2) -- 70% redução
        WHEN tipo_mime LIKE 'image/%' THEN ROUND(tamanho_atual_bytes * 0.4 / 1024.0 / 1024.0, 2) -- 60% redução
        ELSE ROUND(tamanho_atual_bytes / 1024.0 / 1024.0, 2)
    END as tamanho_estimado_mb,
    CASE 
        WHEN tipo_mime LIKE 'video/%' THEN ROUND(tamanho_atual_bytes * 0.7 / 1024.0 / 1024.0, 2) -- 70% economia
        WHEN tipo_mime LIKE 'image/%' THEN ROUND(tamanho_atual_bytes * 0.6 / 1024.0 / 1024.0, 2) -- 60% economia
        ELSE 0
    END as economia_estimada_mb
FROM tamanhos_atuais
ORDER BY economia_estimada_mb DESC;

-- =====================================================
-- 8. RESUMO DE RECOMENDAÇÕES
-- =====================================================

-- Resumo final com recomendações
SELECT 
    'RECOMENDAÇÕES' as tipo,
    'Vídeos: Implementar compressão H.264, 720p, 1.5Mbps' as recomendacao,
    'Impacto: Alto - Maior economia de espaço' as impacto
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Imagens: Converter para WebP, max 800px mobile, 1200px desktop',
    'Impacto: Médio - Boa economia mantendo qualidade'
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Posts: Implementar compressão no usePostUpload.ts',
    'Impacto: Alto - Todos os novos posts otimizados'
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Limites: Reduzir limite de bucket de 50MB para 25MB',
    'Impacto: Médio - Força compressão automática';


