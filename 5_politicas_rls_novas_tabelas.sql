-- Script para criar políticas RLS para as novas tabelas
-- Execute este script após criar as tabelas e funções

-- =====================================================
-- POLÍTICAS PARA TABELA salon_employees
-- =====================================================

-- Habilitar RLS na tabela salon_employees (caso não esteja habilitado)
ALTER TABLE salon_employees ENABLE ROW LEVEL SECURITY;

-- Política 1: Visualizar funcionários do salão
-- Apenas dono do salão e funcionários ativos podem ver a lista de funcionários
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;
CREATE POLICY "Visualizar funcionários do salão" ON salon_employees FOR SELECT USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários ativos do mesmo salão
        SELECT user_id FROM salon_employees 
        WHERE salon_id = salon_employees.salon_id 
          AND status = 'active'
    )
);

-- Política 2: Gerenciar funcionários (apenas dono do salão)
-- Apenas o dono do salão pode inserir, atualizar e deletar funcionários
DROP POLICY IF EXISTS "Gerenciar funcionários do salão" ON salon_employees;
CREATE POLICY "Gerenciar funcionários do salão" ON salon_employees FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM salons_studios WHERE id = salon_id)
);

-- Política 3: Funcionário pode ver seus próprios dados
-- Cada funcionário pode ver apenas seus próprios dados
DROP POLICY IF EXISTS "Ver próprios dados" ON salon_employees;
CREATE POLICY "Ver próprios dados" ON salon_employees FOR SELECT USING (
    auth.uid() = user_id
);

-- =====================================================
-- ATUALIZAR POLÍTICAS DA TABELA salon_professionals
-- =====================================================

-- Habilitar RLS na tabela salon_professionals (caso não esteja habilitado)
ALTER TABLE salon_professionals ENABLE ROW LEVEL SECURITY;

-- Política 1: Visualizar profissionais do salão
-- Dono do salão, funcionários com permissão e profissionais aceitos podem ver
DROP POLICY IF EXISTS "Visualizar profissionais do salão" ON salon_professionals;
CREATE POLICY "Visualizar profissionais do salão" ON salon_professionals FOR SELECT USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários com permissão para gerenciar profissionais
        SELECT se.user_id FROM salon_employees se
        WHERE se.salon_id = salon_professionals.salon_id 
          AND se.status = 'active'
          AND se.permissions->'manage_service_professionals'->>'view' = 'true'
        UNION
        -- Profissionais aceitos podem ver outros profissionais do mesmo salão
        SELECT professional_id FROM salon_professionals sp2
        WHERE sp2.salon_id = salon_professionals.salon_id 
          AND sp2.status = 'accepted'
    )
);

-- Política 2: Gerenciar profissionais (apenas dono e funcionários autorizados)
DROP POLICY IF EXISTS "Gerenciar profissionais do salão" ON salon_professionals;
CREATE POLICY "Gerenciar profissionais do salão" ON salon_professionals FOR ALL USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários com permissão para gerenciar profissionais
        SELECT se.user_id FROM salon_employees se
        WHERE se.salon_id = salon_professionals.salon_id 
          AND se.status = 'active'
          AND se.permissions->'manage_service_professionals'->>'add' = 'true'
    )
);

-- Política 3: Profissional pode ver seus próprios dados
DROP POLICY IF EXISTS "Profissional ver próprios dados" ON salon_professionals;
CREATE POLICY "Profissional ver próprios dados" ON salon_professionals FOR SELECT USING (
    auth.uid() = professional_id
);

-- Política 4: Profissional pode atualizar seus próprios dados básicos
DROP POLICY IF EXISTS "Profissional atualizar próprios dados" ON salon_professionals;
CREATE POLICY "Profissional atualizar próprios dados" ON salon_professionals FOR UPDATE USING (
    auth.uid() = professional_id
) WITH CHECK (
    auth.uid() = professional_id
    -- Apenas campos que o profissional pode editar
    AND (service_type IS NOT NULL OR service_type IS NULL)
);

-- =====================================================
-- POLÍTICAS PARA TABELA salons_studios (atualizar se necessário)
-- =====================================================

-- Verificar se a tabela salons_studios já tem RLS habilitado
-- Se não tiver, habilitar e criar políticas básicas

-- Habilitar RLS na tabela salons_studios (caso não esteja habilitado)
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- Política 1: Visualizar salões (público)
DROP POLICY IF EXISTS "Visualizar salões públicos" ON salons_studios;
CREATE POLICY "Visualizar salões públicos" ON salons_studios FOR SELECT USING (
    true -- Todos podem ver salões
);

-- Política 2: Gerenciar próprio salão
DROP POLICY IF EXISTS "Gerenciar próprio salão" ON salons_studios;
CREATE POLICY "Gerenciar próprio salão" ON salons_studios FOR ALL USING (
    auth.uid() = owner_id
);

-- Política 3: Funcionários podem ver dados básicos do salão onde trabalham
DROP POLICY IF EXISTS "Funcionários ver salão" ON salons_studios;
CREATE POLICY "Funcionários ver salão" ON salons_studios FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM salon_employees 
        WHERE salon_id = salons_studios.id 
          AND status = 'active'
    )
);

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

-- Listar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('salon_employees', 'salon_professionals', 'salons_studios')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('salon_employees', 'salon_professionals', 'salons_studios')
ORDER BY tablename;



