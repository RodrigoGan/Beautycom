-- =====================================================
-- AUDITORIA DO STORAGE - ANÁLISE DE OTIMIZAÇÃO (CORRIGIDO)
-- =====================================================

-- Objetivo: Analisar arquivos existentes para identificar oportunidades de compressão
-- CORREÇÃO: Tratar corretamente os tipos de dados do metadata

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DO METADATA
-- =====================================================

-- Verificar como o campo 'size' está armazenado
SELECT 
    'ESTRUTURA METADATA' as tipo,
    o.metadata->>'size' as size_raw,
    pg_typeof(o.metadata->>'size') as tipo_size,
    o.metadata as metadata_completo
FROM storage.objects o
LIMIT 5;

-- =====================================================
-- 2. RESUMO GERAL DO STORAGE (CORRIGIDO)
-- =====================================================

-- Total de buckets e arquivos
SELECT 
    'RESUMO GERAL' as tipo,
    COUNT(DISTINCT b.id) as total_buckets,
    COUNT(o.id) as total_arquivos,
    COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id;

-- =====================================================
-- 3. ANÁLISE POR BUCKET (CORRIGIDO)
-- =====================================================

-- Detalhes por bucket
SELECT 
    b.name as bucket,
    COUNT(o.id) as total_arquivos,
    COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb,
    ROUND(AVG(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ) / 1024.0 / 1024.0, 2) as tamanho_medio_mb,
    MAX(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ) as maior_arquivo_bytes,
    ROUND(MAX(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ) / 1024.0 / 1024.0, 2) as maior_arquivo_mb
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.id, b.name
ORDER BY tamanho_total_mb DESC;

-- =====================================================
-- 4. ANÁLISE POR TIPO DE ARQUIVO (CORRIGIDO)
-- =====================================================

-- Distribuição por tipo MIME
SELECT 
    o.metadata->>'mimetype' as tipo_mime,
    COUNT(*) as quantidade,
    COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ), 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb,
    ROUND(AVG(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END
    ) / 1024.0 / 1024.0, 2) as tamanho_medio_mb
FROM storage.objects o
GROUP BY o.metadata->>'mimetype'
ORDER BY tamanho_total_mb DESC;

-- =====================================================
-- 5. ARQUIVOS MAIORES (CORRIGIDO)
-- =====================================================

-- Top 20 maiores arquivos
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    o.metadata->>'mimetype' as tipo_mime,
    CASE 
        WHEN o.metadata->>'size' ~ '^[0-9]+$' 
        THEN (o.metadata->>'size')::bigint 
        ELSE 0 
    END as tamanho_bytes,
    ROUND(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END / 1024.0 / 1024.0, 2
    ) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'size' ~ '^[0-9]+$' -- Apenas arquivos com size válido
ORDER BY (o.metadata->>'size')::bigint DESC
LIMIT 20;

-- =====================================================
-- 6. ANÁLISE DE VÍDEOS (CORRIGIDO)
-- =====================================================

-- Todos os vídeos
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    CASE 
        WHEN o.metadata->>'size' ~ '^[0-9]+$' 
        THEN (o.metadata->>'size')::bigint 
        ELSE 0 
    END as tamanho_bytes,
    ROUND(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END / 1024.0 / 1024.0, 2
    ) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'mimetype' LIKE 'video/%'
  AND o.metadata->>'size' ~ '^[0-9]+$'
ORDER BY (o.metadata->>'size')::bigint DESC;

-- =====================================================
-- 7. ANÁLISE DE IMAGENS (CORRIGIDO)
-- =====================================================

-- Imagens maiores que 1MB (oportunidades de compressão)
SELECT 
    o.name as nome_arquivo,
    b.name as bucket,
    o.metadata->>'mimetype' as tipo_mime,
    CASE 
        WHEN o.metadata->>'size' ~ '^[0-9]+$' 
        THEN (o.metadata->>'size')::bigint 
        ELSE 0 
    END as tamanho_bytes,
    ROUND(
        CASE 
            WHEN o.metadata->>'size' ~ '^[0-9]+$' 
            THEN (o.metadata->>'size')::bigint 
            ELSE 0 
        END / 1024.0 / 1024.0, 2
    ) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'mimetype' LIKE 'image/%'
  AND o.metadata->>'size' ~ '^[0-9]+$'
  AND (o.metadata->>'size')::bigint > 1024 * 1024 -- > 1MB
ORDER BY (o.metadata->>'size')::bigint DESC;

-- =====================================================
-- 8. ESTIMATIVA DE ECONOMIA (CORRIGIDO)
-- =====================================================

-- Estimativa de economia baseada em compressão típica
WITH tamanhos_atuais AS (
    SELECT 
        o.metadata->>'mimetype' as tipo_mime,
        COUNT(*) as quantidade,
        SUM(
            CASE 
                WHEN o.metadata->>'size' ~ '^[0-9]+$' 
                THEN (o.metadata->>'size')::bigint 
                ELSE 0 
            END
        ) as tamanho_atual_bytes
    FROM storage.objects o
    WHERE o.metadata->>'size' ~ '^[0-9]+$'
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
-- 9. RESUMO DE RECOMENDAÇÕES
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


