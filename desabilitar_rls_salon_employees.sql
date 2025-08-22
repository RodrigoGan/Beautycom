-- SOLUÇÃO TEMPORÁRIA: Desabilitar RLS na tabela salon_employees
-- Isso resolve o problema de auth.uid() retornando NULL no ambiente Supabase

-- 1. Desabilitar RLS na tabela
ALTER TABLE salon_employees DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Funcionários podem visualizar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode adicionar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode editar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode remover funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Gerenciar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Ver próprios dados" ON salon_employees;
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;

-- 3. Verificar se RLS foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'salon_employees';

-- 4. Verificar se não há mais políticas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'salon_employees'
ORDER BY policyname;



