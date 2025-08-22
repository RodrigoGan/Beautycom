-- Script para verificar se a implementação foi feita corretamente
-- Execute este script após executar todos os outros

-- Verificar se as tabelas foram criadas
SELECT 
    'salon_employees' as tabela,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'salon_employees'
    ) as existe
UNION ALL
SELECT 
    'salon_professionals com service_type' as tabela,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_professionals' 
        AND column_name = 'service_type'
    ) as existe;

-- Verificar se as funções foram criadas
SELECT 
    'check_salon_permission' as funcao,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'check_salon_permission'
    ) as existe
UNION ALL
SELECT 
    'get_user_salon_permissions' as funcao,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_user_salon_permissions'
    ) as existe
UNION ALL
SELECT 
    'get_user_salon_role' as funcao,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_user_salon_role'
    ) as existe
UNION ALL
SELECT 
    'has_salon_access' as funcao,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'has_salon_access'
    ) as existe;

-- Verificar se os índices foram criados
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('salon_employees', 'salon_professionals')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar se as políticas RLS foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'salon_employees'
ORDER BY policyname;

-- Mostrar estrutura da tabela salon_employees
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees'
ORDER BY ordinal_position;

-- Mostrar estrutura da tabela salon_professionals (apenas colunas relevantes)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_professionals'
  AND column_name IN ('service_type', 'salon_id', 'professional_id', 'status')
ORDER BY ordinal_position;

-- Contar registros existentes (se houver)
SELECT 
    'salon_employees' as tabela,
    COUNT(*) as total_registros
FROM salon_employees
UNION ALL
SELECT 
    'salon_professionals' as tabela,
    COUNT(*) as total_registros
FROM salon_professionals;

-- Testar função de permissões (substitua os UUIDs pelos valores reais)
-- SELECT check_salon_permission('UUID_DO_SALAO', 'UUID_DO_USUARIO', 'manage_employees.view');
-- SELECT get_user_salon_role('UUID_DO_SALAO', 'UUID_DO_USUARIO');
-- SELECT has_salon_access('UUID_DO_SALAO', 'UUID_DO_USUARIO');



