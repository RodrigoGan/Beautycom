-- Teste de acesso direto ao salão
-- Vamos verificar se conseguimos acessar o salão diretamente

-- 1. Teste direto sem RLS (temporariamente)
ALTER TABLE salons_studios DISABLE ROW LEVEL SECURITY;

-- 2. Buscar o salão diretamente
SELECT 
  s.*,
  u.name as owner_name,
  u.email as owner_email
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 3. Reabilitar RLS
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se o problema é específico do Rodrigo
SELECT 
  'TESTE_DIRETO' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email,
  CASE 
    WHEN s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'RODRIGO'
    ELSE 'OUTRO'
  END as proprietario
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



