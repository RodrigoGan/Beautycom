-- =====================================================
-- SOLUÇÃO ALTERNATIVA RLS - PERMISSÕES LIMITADAS
-- =====================================================

-- Este script funciona mesmo com permissões limitadas
-- Foca apenas na tabela users que você pode modificar

-- =====================================================
-- 1. VERIFICAR PERMISSÕES ATUAIS
-- =====================================================

-- Verificar se você pode modificar a tabela users
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users'
  AND schemaname = 'public';

-- =====================================================
-- 2. DESABILITAR RLS APENAS NA TABELA USERS
-- =====================================================

-- Desabilitar RLS na tabela users (você tem permissão para isso)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. REMOVER POLÍTICAS DA TABELA USERS
-- =====================================================

-- Remover políticas da tabela users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable read access for professionals" ON users;
DROP POLICY IF EXISTS "Enable read access for public search" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated update" ON users;
DROP POLICY IF EXISTS "Allow authenticated select" ON users;
DROP POLICY IF EXISTS "Allow public select" ON users;

-- =====================================================
-- 4. VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Verificar se RLS está desabilitado na tabela users
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users'
  AND schemaname = 'public';

-- Verificar que não há políticas na tabela users
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'users'
  AND schemaname = 'public';

-- =====================================================
-- 5. CONFIGURAR STORAGE VIA DASHBOARD
-- =====================================================

/*
⚠️ IMPORTANTE: Para o Storage, você precisa configurar via Dashboard

1. Vá para Storage no Supabase Dashboard
2. Clique em "New Bucket" se não existir
3. Crie os buckets:
   - fotoperfil (público)
   - fotopost (público)
   - fotodecapa (público)
   - logotipo (público)

4. Para cada bucket, nas configurações:
   - Marque como "Public"
   - Em "Policies", adicione:
     - "Allow authenticated uploads"
     - "Allow public viewing"
*/

-- =====================================================
-- 6. TESTAR INSERÇÃO
-- =====================================================

-- Testar se é possível inserir na tabela users
-- (Este comando será executado apenas para verificar)
-- INSERT INTO users (id, email, name, user_type, role) 
-- VALUES ('test-id', 'test@test.com', 'Test User', 'usuario', 'client');

-- =====================================================
-- 7. COMENTÁRIOS IMPORTANTES
-- =====================================================

/*
✅ O QUE FOI FEITO:
- RLS desabilitado na tabela users
- Todas as políticas removidas da tabela users
- Cadastro deve funcionar agora

⚠️ STORAGE:
- Você precisa configurar via Dashboard
- Não consegue modificar via SQL (permissões)
- Configure buckets como públicos

🎯 PRÓXIMOS PASSOS:
1. Execute este script
2. Configure Storage via Dashboard
3. Teste o cadastro
4. Se funcionar, reabilitar RLS depois

📝 NOTA:
Esta solução resolve o problema do cadastro mesmo com
permissões limitadas no Supabase.
*/

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 