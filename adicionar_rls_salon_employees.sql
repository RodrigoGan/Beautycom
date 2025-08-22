-- Adicionar políticas RLS para salon_employees

-- 1. Habilitar RLS na tabela
ALTER TABLE salon_employees ENABLE ROW LEVEL SECURITY;

-- 2. Política para visualizar funcionários (dono e funcionários podem ver)
CREATE POLICY "Funcionários podem visualizar funcionários do salão" ON salon_employees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM salons_studios ss 
    WHERE ss.id = salon_employees.salon_id 
    AND ss.owner_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM salon_employees se 
    WHERE se.salon_id = salon_employees.salon_id 
    AND se.user_id = auth.uid()
  )
);

-- 3. Política para inserir funcionários (apenas dono pode adicionar)
CREATE POLICY "Dono pode adicionar funcionários" ON salon_employees
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM salons_studios ss 
    WHERE ss.id = salon_employees.salon_id 
    AND ss.owner_id = auth.uid()
  )
);

-- 4. Política para atualizar funcionários (dono pode editar)
CREATE POLICY "Dono pode editar funcionários" ON salon_employees
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM salons_studios ss 
    WHERE ss.id = salon_employees.salon_id 
    AND ss.owner_id = auth.uid()
  )
);

-- 5. Política para deletar funcionários (dono pode remover)
CREATE POLICY "Dono pode remover funcionários" ON salon_employees
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM salons_studios ss 
    WHERE ss.id = salon_employees.salon_id 
    AND ss.owner_id = auth.uid()
  )
);

-- Verificar se as políticas foram criadas
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



