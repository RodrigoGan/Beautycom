-- RESOLVER ERRO IMEDIATO: Remover apenas a política problemática
-- Execute este SQL primeiro para resolver o erro

-- 1. Remover a política problemática que está causando o erro
DROP POLICY IF EXISTS "Funcionários ver salão" ON salons_studios;

-- 2. Agora fazer a alteração na tabela salon_employees
ALTER TABLE salon_employees 
ALTER COLUMN status TYPE VARCHAR(20);

-- 3. Adicionar constraint para incluir 'pending' como status válido
ALTER TABLE salon_employees 
DROP CONSTRAINT IF EXISTS salon_employees_status_check;

ALTER TABLE salon_employees 
ADD CONSTRAINT salon_employees_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected'));

-- 4. Atualizar registros existentes para 'active'
UPDATE salon_employees 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 5. Verificar se funcionou
SELECT 
    'SUCESSO' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
  AND column_name = 'status';



