-- SOLUÇÃO MELHORADA: RLS BASEADA EM PERMISSÕES
-- Permite que pessoas com permissão gerenciem posts (não apenas proprietários)

-- 1. REMOVER POLÍTICA ANTERIOR (se existir)
DROP POLICY IF EXISTS "Proprietários podem gerenciar posts do salão" ON posts;

-- 2. CRIAR NOVA POLÍTICA BASEADA EM PERMISSÕES
-- Esta política permite que pessoas com permissão gerenciem posts do salão
CREATE POLICY "Pessoas com permissão podem gerenciar posts do salão" ON posts
FOR UPDATE TO public
USING (
    -- O usuário é o autor do post OU
    (auth.uid() = user_id)
    OR
    -- O usuário tem permissão para gerenciar posts do salão
    (
        EXISTS (
            SELECT 1 FROM salons_studios s
            WHERE s.id IN (
                -- Salões onde o usuário é proprietário
                SELECT id FROM salons_studios WHERE owner_id = auth.uid()
                UNION
                -- Salões onde o usuário é funcionário com permissão
                SELECT se.salon_id FROM salon_employees se
                WHERE se.user_id = auth.uid()
                AND se.status = 'active'
                AND se.permissions ? 'manage_posts'  -- Se existir campo de permissões
                UNION
                -- Salões onde o usuário é profissional com permissão
                SELECT sp.salon_id FROM salon_professionals sp
                WHERE sp.professional_id = auth.uid()
                AND sp.status = 'active'
                AND sp.permissions ? 'manage_posts'  -- Se existir campo de permissões
            )
            AND (
                -- Post de profissional do salão
                EXISTS (
                    SELECT 1 FROM salon_professionals sp
                    WHERE sp.salon_id = s.id
                    AND sp.professional_id = posts.user_id
                    AND sp.status = 'active'
                )
                OR
                -- Post de funcionário do salão
                EXISTS (
                    SELECT 1 FROM salon_employees se
                    WHERE se.salon_id = s.id
                    AND se.user_id = posts.user_id
                    AND se.status = 'active'
                )
                OR
                -- Post do próprio usuário com permissão
                posts.user_id = auth.uid()
            )
        )
    )
)
WITH CHECK (
    -- Mesma condição para WITH CHECK
    (auth.uid() = user_id)
    OR
    (
        EXISTS (
            SELECT 1 FROM salons_studios s
            WHERE s.id IN (
                SELECT id FROM salons_studios WHERE owner_id = auth.uid()
                UNION
                SELECT se.salon_id FROM salon_employees se
                WHERE se.user_id = auth.uid()
                AND se.status = 'active'
                AND se.permissions ? 'manage_posts'
                UNION
                SELECT sp.salon_id FROM salon_professionals sp
                WHERE sp.professional_id = auth.uid()
                AND sp.status = 'active'
                AND sp.permissions ? 'manage_posts'
            )
            AND (
                EXISTS (
                    SELECT 1 FROM salon_professionals sp
                    WHERE sp.salon_id = s.id
                    AND sp.professional_id = posts.user_id
                    AND sp.status = 'active'
                )
                OR
                EXISTS (
                    SELECT 1 FROM salon_employees se
                    WHERE se.salon_id = s.id
                    AND se.user_id = posts.user_id
                    AND se.status = 'active'
                )
                OR
                posts.user_id = auth.uid()
            )
        )
    )
);

-- 3. VERIFICAR SE A NOVA POLÍTICA FOI CRIADA
SELECT 
    'POLÍTICA MELHORADA CRIADA' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts'
AND policyname = 'Pessoas com permissão podem gerenciar posts do salão';

-- 4. VERIFICAR TODAS AS POLÍTICAS FINAIS
SELECT 
    'POLÍTICAS FINAIS MELHORADAS' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd, policyname;

-- 5. TESTAR A NOVA POLÍTICA
-- Verificar se o proprietário ainda pode atualizar o post
SELECT 
    'TESTE PROPRIETÁRIO' as status,
    'Proprietário ainda pode atualizar?' as pergunta,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM salons_studios s
            WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
            AND s.id = '18e3a823-b280-4b75-9518-c01ed31fa197'
        ) THEN 'SIM - É proprietário do salão'
        ELSE 'NÃO - Não é proprietário'
    END as resultado
FROM posts p
WHERE p.id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';
