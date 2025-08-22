-- POLÍTICAS RLS DEFINITIVAS PARA SALONS_STUDIOS
-- Políticas que funcionam independentemente de problemas de auth.uid()

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Salons studios are viewable by everyone" ON salons_studios;
DROP POLICY IF EXISTS "Users can insert their own salon" ON salons_studios;
DROP POLICY IF EXISTS "Users can update own salon" ON salons_studios;
DROP POLICY IF EXISTS "Users can delete own salon" ON salons_studios;
DROP POLICY IF EXISTS "Salon employees can view salon data" ON salons_studios;

-- 2. Reabilitar RLS
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- 3. Política SIMPLES para visualização pública (qualquer pessoa pode ver salões)
CREATE POLICY "Salons studios are viewable by everyone" ON salons_studios
  FOR SELECT USING (true);

-- 4. Política para inserção (apenas usuários autenticados podem criar salões)
-- Usando uma abordagem mais robusta
CREATE POLICY "Users can insert their own salon" ON salons_studios
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = owner_id
  );

-- 5. Política para atualização (apenas o proprietário pode atualizar)
-- Usando uma abordagem mais robusta
CREATE POLICY "Users can update own salon" ON salons_studios
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = owner_id
  );

-- 6. Política para exclusão (apenas o proprietário pode excluir)
-- Usando uma abordagem mais robusta
CREATE POLICY "Users can delete own salon" ON salons_studios
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = owner_id
  );

-- 7. Verificar se as políticas foram criadas corretamente
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'salons_studios'
ORDER BY policyname;

-- 8. Testar se o salão está acessível com as novas políticas
SELECT 
  'TESTE_POLITICAS_DEFINITIVAS' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email,
  auth.uid() as current_user,
  CASE 
    WHEN auth.uid() IS NOT NULL AND s.owner_id = auth.uid() THEN 'DEVERIA_TER_ACESSO'
    WHEN auth.uid() IS NULL THEN 'AUTH_NULL_MAS_POLITICA_PUBLICA_PERMITE'
    ELSE 'NAO_DEVERIA_TER_ACESSO'
  END as acesso_esperado
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



