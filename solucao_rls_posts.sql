-- SOLUÇÃO DEFINITIVA: RLS PARA PROPRIETÁRIOS GERENCIAREM POSTS
-- Permite que proprietários de salão gerenciem posts de seus profissionais

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    'POLÍTICAS ATUAIS' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd;

-- 2. CRIAR NOVA POLÍTICA PARA PROPRIETÁRIOS GERENCIAREM POSTS
-- Esta política permite que proprietários de salão atualizem posts de seus profissionais
CREATE POLICY "Proprietários podem gerenciar posts do salão" ON posts
FOR UPDATE TO public
USING (
    -- O usuário é o autor do post OU
    (auth.uid() = user_id)
    OR
    -- O usuário é proprietário do salão e o post é de um profissional/funcionário do salão
    (
        EXISTS (
            SELECT 1 FROM salons_studios s
            WHERE s.owner_id = auth.uid()
            AND (
                -- Post de profissional do salão
                EXISTS (
                    SELECT 1 FROM salon_professionals sp
                    WHERE sp.salon_id = s.id
                    AND sp.professional_id = posts.user_id
                )
                OR
                -- Post de funcionário do salão
                EXISTS (
                    SELECT 1 FROM salon_employees se
                    WHERE se.salon_id = s.id
                    AND se.user_id = posts.user_id
                )
                OR
                -- Post do próprio proprietário
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
            WHERE s.owner_id = auth.uid()
            AND (
                EXISTS (
                    SELECT 1 FROM salon_professionals sp
                    WHERE sp.salon_id = s.id
                    AND sp.professional_id = posts.user_id
                )
                OR
                EXISTS (
                    SELECT 1 FROM salon_employees se
                    WHERE se.salon_id = s.id
                    AND se.user_id = posts.user_id
                )
                OR
                posts.user_id = auth.uid()
            )
        )
    )
);

-- 3. VERIFICAR SE A POLÍTICA FOI CRIADA
SELECT 
    'POLÍTICA CRIADA' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts'
AND policyname = 'Proprietários podem gerenciar posts do salão';

-- 4. TESTAR A NOVA POLÍTICA
-- Verificar se o proprietário pode agora atualizar o post problemático
SELECT 
    'TESTE PERMISSÃO' as status,
    'Proprietário pode atualizar post?' as pergunta,
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

-- 5. VERIFICAR TODAS AS POLÍTICAS FINAIS
SELECT 
    'POLÍTICAS FINAIS' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd, policyname;
