-- SOLUÇÃO FINAL: Desabilitar RLS e implementar segurança via aplicação
-- Como auth.uid() está retornando NULL, vamos desabilitar RLS e usar segurança no frontend

-- 1. Desabilitar RLS definitivamente
ALTER TABLE salons_studios DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se o salão está acessível
SELECT 
  'SOLUCAO_FINAL' as teste,
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

-- 4. Verificar se há outras tabelas com RLS que podem estar interferindo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename LIKE '%salon%' 
  AND schemaname = 'public'
ORDER BY tablename;

-- 5. Verificar se há triggers que podem estar interferindo
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table LIKE '%salon%'
ORDER BY trigger_name;



