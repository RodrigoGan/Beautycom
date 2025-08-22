-- SOLUÇÃO TEMPORÁRIA: Desabilitar RLS novamente
-- Execute este SQL para restaurar o funcionamento enquanto investigamos

-- 1. Desabilitar RLS temporariamente
ALTER TABLE salons_studios DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se o salão está acessível
SELECT 
  'SOLUCAO_TEMPORARIA' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 3. Verificar se conseguimos acessar pelo ID direto
SELECT 
  'TESTE_ID_DIRETO' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';



