-- =====================================================
-- LIMPEZA E OTIMIZAÇÃO DO STORAGE
-- =====================================================

-- Objetivo: Limpar arquivos antigos e otimizar o espaço de storage

-- =====================================================
-- 1. BACKUP DOS DADOS ATUAIS (OPCIONAL)
-- =====================================================

-- Criar tabela de backup dos objetos atuais
CREATE TABLE IF NOT EXISTS storage_backup AS
SELECT 
    o.id,
    o.name,
    o.bucket_id,
    o.owner,
    o.metadata,
    o.created_at,
    o.updated_at
FROM storage.objects o;

-- =====================================================
-- 2. IDENTIFICAR ARQUIVOS PARA REMOÇÃO
-- =====================================================

-- Arquivos muito grandes (> 25MB)
SELECT 
    'ARQUIVOS GRANDES' as categoria,
    o.name as nome_arquivo,
    b.name as bucket,
    ROUND(o.metadata->>'size'::bigint / 1024.0 / 1024.0, 2) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.metadata->>'size'::bigint > 25 * 1024 * 1024 -- > 25MB
ORDER BY o.metadata->>'size'::bigint DESC;

-- Arquivos antigos (> 30 dias) que não são posts principais
SELECT 
    'ARQUIVOS ANTIGOS' as categoria,
    o.name as nome_arquivo,
    b.name as bucket,
    ROUND(o.metadata->>'size'::bigint / 1024.0 / 1024.0, 2) as tamanho_mb,
    o.created_at as data_criacao
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE o.created_at < NOW() - INTERVAL '30 days'
  AND b.name NOT IN ('fotoperfil', 'logotipo') -- Manter fotos de perfil e logos
ORDER BY o.created_at ASC;

-- =====================================================
-- 3. REMOVER ARQUIVOS GRANDES (OPCIONAL)
-- =====================================================

-- ⚠️ ATENÇÃO: Execute apenas se tiver certeza!
-- Descomente as linhas abaixo para remover arquivos grandes

/*
-- Remover arquivos maiores que 25MB
DELETE FROM storage.objects 
WHERE metadata->>'size'::bigint > 25 * 1024 * 1024;
*/

-- =====================================================
-- 4. REMOVER ARQUIVOS ANTIGOS (OPCIONAL)
-- =====================================================

-- ⚠️ ATENÇÃO: Execute apenas se tiver certeza!
-- Descomente as linhas abaixo para remover arquivos antigos

/*
-- Remover arquivos antigos (exceto fotos de perfil e logos)
DELETE FROM storage.objects o
USING storage.buckets b
WHERE o.bucket_id = b.id
  AND o.created_at < NOW() - INTERVAL '30 days'
  AND b.name NOT IN ('fotoperfil', 'logotipo');
*/

-- =====================================================
-- 5. ATUALIZAR LIMITES DOS BUCKETS
-- =====================================================

-- Reduzir limite de tamanho dos buckets para forçar compressão
-- ⚠️ ATENÇÃO: Isso pode afetar uploads futuros

/*
-- Atualizar bucket post-media
UPDATE storage.buckets 
SET file_size_limit = 25 * 1024 * 1024 -- 25MB
WHERE name = 'post-media';

-- Atualizar bucket post-gallery
UPDATE storage.buckets 
SET file_size_limit = 25 * 1024 * 1024 -- 25MB
WHERE name = 'post-gallery';

-- Atualizar bucket post-before-after
UPDATE storage.buckets 
SET file_size_limit = 25 * 1024 * 1024 -- 25MB
WHERE name = 'post-before-after';
*/

-- =====================================================
-- 6. VERIFICAR RESULTADO DA LIMPEZA
-- =====================================================

-- Resumo após limpeza
SELECT 
    'RESUMO APÓS LIMPEZA' as tipo,
    COUNT(DISTINCT b.id) as total_buckets,
    COUNT(o.id) as total_arquivos,
    COALESCE(SUM(o.metadata->>'size')::bigint, 0) as tamanho_total_bytes,
    ROUND(COALESCE(SUM(o.metadata->>'size')::bigint, 0) / 1024.0 / 1024.0, 2) as tamanho_total_mb
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id;

-- =====================================================
-- 7. RECOMENDAÇÕES PÓS-LIMPEZA
-- =====================================================

SELECT 
    'RECOMENDAÇÕES' as tipo,
    'Implementar compressão automática em todos os uploads' as acao,
    'Prioridade: Alta' as prioridade
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Configurar monitoramento de uso de storage',
    'Prioridade: Média'
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Implementar limpeza automática de arquivos antigos',
    'Prioridade: Baixa'
UNION ALL
SELECT 
    'RECOMENDAÇÕES',
    'Testar compressão com arquivos reais antes de implementar',
    'Prioridade: Alta';


