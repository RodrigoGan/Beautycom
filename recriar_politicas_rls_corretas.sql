-- RECRIAR POLÍTICAS RLS CORRETAS PARA SALONS_STUDIOS
-- Execute este SQL para recriar as políticas de segurança

-- 1. Primeiro, vamos remover todas as políticas existentes
DROP POLICY IF EXISTS "Salons studios are viewable by everyone" ON salons_studios;
DROP POLICY IF EXISTS "Users can insert their own salon" ON salons_studios;
DROP POLICY IF EXISTS "Users can update own salon" ON salons_studios;
DROP POLICY IF EXISTS "Users can delete own salon" ON salons_studios;
DROP POLICY IF EXISTS "Salon employees can view salon data" ON salons_studios;

-- 2. Reabilitar RLS
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para visualização pública (qualquer pessoa pode ver salões)
CREATE POLICY "Salons studios are viewable by everyone" ON salons_studios
  FOR SELECT USING (true);

-- 4. Criar política para inserção (apenas usuários autenticados podem criar salões)
CREATE POLICY "Users can insert their own salon" ON salons_studios
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 5. Criar política para atualização (apenas o proprietário pode atualizar)
CREATE POLICY "Users can update own salon" ON salons_studios
  FOR UPDATE USING (auth.uid() = owner_id);

-- 6. Criar política para exclusão (apenas o proprietário pode excluir)
CREATE POLICY "Users can delete own salon" ON salons_studios
  FOR DELETE USING (auth.uid() = owner_id);

-- 7. Criar política para funcionários visualizarem dados básicos do salão
CREATE POLICY "Salon employees can view salon data" ON salons_studios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM salon_employees 
      WHERE salon_employees.salon_id = salons_studios.id 
      AND salon_employees.user_id = auth.uid() 
      AND salon_employees.status = 'active'
    )
  );

-- 8. Verificar se as políticas foram criadas corretamente
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'salons_studios'
ORDER BY policyname;

-- 9. Testar se o salão do Rodrigo ainda está acessível
SELECT 
  'TESTE_POS_RLS' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



