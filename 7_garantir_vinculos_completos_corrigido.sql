-- Script 7: Garantir vínculos completos (VERSÃO CORRIGIDA)
-- Este script garante que todos os salões tenham vínculos corretos e mostra um resumo final

-- 1. Adicionar vínculos para todos os salões que ainda não têm
INSERT INTO salon_professionals (salon_id, professional_id, status)
SELECT 
    s.id as salon_id,
    s.owner_id as professional_id,
    'accepted' as status
FROM salons_studios s
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
WHERE sp.id IS NULL
  AND s.owner_id IS NOT NULL
ON CONFLICT (salon_id, professional_id) DO NOTHING;

-- 2. Resumo final de todos os salões e seus vínculos
SELECT 
    'RESUMO FINAL' as tipo,
    COUNT(*) as total_saloes,
    COUNT(sp.id) as total_com_vinculo,
    COUNT(*) - COUNT(sp.id) as total_sem_vinculo
FROM salons_studios s
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id;

-- 3. Lista detalhada de todos os salões
SELECT 
    ROW_NUMBER() OVER (ORDER BY s.created_at) as posicao,
    s.id as salon_id,
    s.name as salon_name,
    u.name as owner_name,
    u.user_type as owner_type,
    CASE 
        WHEN sp.id IS NOT NULL THEN '✅ VINCULADO'
        ELSE '❌ SEM VÍNCULO'
    END as status_vinculo,
    sp.status as vinculo_status,
    s.created_at as salao_criado_em,
    sp.created_at as vinculo_criado_em
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
ORDER BY s.created_at;

-- 4. Verificar se há algum problema
SELECT 
    'VERIFICAÇÃO DE PROBLEMAS' as tipo,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS OS SALÕES ESTÃO CORRETOS'
        ELSE '❌ EXISTEM SALÕES SEM VÍNCULO'
    END as status
FROM salons_studios s
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
WHERE sp.id IS NULL;



