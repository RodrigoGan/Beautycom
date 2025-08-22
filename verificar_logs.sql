-- =====================================================
-- VERIFICAR LOGS DE DEBUG
-- =====================================================

-- Verificar logs mais recentes
SELECT 
    'LOGS RECENTES' as tipo,
    component_name,
    log_level,
    message,
    data,
    created_at
FROM debug_logs
WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' -- ID do Rodrigo
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- LOGS POR COMPONENTE
-- =====================================================

SELECT 
    'LOGS POR COMPONENTE' as tipo,
    component_name,
    log_level,
    COUNT(*) as total_logs
FROM debug_logs
WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
GROUP BY component_name, log_level
ORDER BY component_name, log_level;

-- =====================================================
-- LOGS DE ERRO
-- =====================================================

SELECT 
    'LOGS DE ERRO' as tipo,
    component_name,
    message,
    data,
    created_at
FROM debug_logs
WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
  AND log_level = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- LOGS DO SALONSKILLS
-- =====================================================

SELECT 
    'LOGS SALONSKILLS' as tipo,
    log_level,
    message,
    data,
    created_at
FROM debug_logs
WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
  AND component_name = 'SalonSkills'
ORDER BY created_at DESC
LIMIT 15;


