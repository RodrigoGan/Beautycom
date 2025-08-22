-- Verificar estrutura da tabela salon_employees
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_employees FROM salon_employees;

-- Verificar se há RLS ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'salon_employees';

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'salon_employees';

-- Verificar constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_employees'::regclass;

-- Testar inserção simples (comentado para não executar)
-- INSERT INTO salon_employees (salon_id, user_id, role, permissions, status) 
-- VALUES ('test-salon-id', 'test-user-id', 'receptionist', '{}', 'active');



