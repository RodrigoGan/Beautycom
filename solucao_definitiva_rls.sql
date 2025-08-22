-- =====================================================
-- ADICIONAR CAMPO DE DESCRIÇÃO DO CARGO (MÍNIMO)
-- =====================================================

-- 1. ADICIONAR COLUNA PARA DESCRIÇÃO DO CARGO
ALTER TABLE salon_employees 
ADD COLUMN IF NOT EXISTS role_description TEXT;

-- 2. VERIFICAR SE A COLUNA FOI ADICIONADA
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
  AND column_name = 'role_description';

-- 3. VERIFICAR RLS NA TABELA salon_employees
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'salon_employees'
ORDER BY policyname;

-- 4. VERIFICAR SE RLS ESTÁ ATIVO NA TABELA
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'salon_employees';

-- 5. VERIFICAR PERMISSÕES DO USUÁRIO ATUAL
SELECT 
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'salon_employees'
  AND grantee = current_user;

-- 6. VERIFICAR A CONSTRAINT QUE ESTÁ BLOQUEANDO
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_employees'::regclass
  AND conname = 'salon_employees_role_check';

-- 7. VERIFICAR TODAS AS CONSTRAINTS DA TABELA
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_employees'::regclass
ORDER BY conname;

-- 8. CORRIGIR A CONSTRAINT PARA PERMITIR 'other'
-- Primeiro, vamos dropar a constraint atual
ALTER TABLE salon_employees 
DROP CONSTRAINT IF EXISTS salon_employees_role_check;

-- Agora, vamos recriar a constraint incluindo 'other'
ALTER TABLE salon_employees 
ADD CONSTRAINT salon_employees_role_check 
CHECK (role IN ('admin', 'secretary', 'manager', 'receptionist', 'cleaner', 'other'));

-- 9. TESTAR INSERÇÃO NOVAMENTE
INSERT INTO salon_employees (
  salon_id, 
  user_id, 
  role, 
  role_description, 
  permissions, 
  status
) VALUES (
  '18e3a823-b280-4b75-9518-c01ed31fa197',
  'e4fe20f9-fec8-483f-86cc-5cf6f1106942',
  'other',
  'Teste de Inserção',
  '{}',
  'pending'
) ON CONFLICT DO NOTHING
RETURNING id, role, role_description;

-- Verificar autorização do proprietário para posts principais
-- SQL para verificar se o usuário logado é proprietário do salão
SELECT 
    'VERIFICAÇÃO DE AUTORIZAÇÃO' as info,
    auth.uid() as current_user_id,
    ss.owner_id as salon_owner_id,
    CASE 
        WHEN auth.uid() = ss.owner_id THEN 'SIM - É PROPRIETÁRIO'
        ELSE 'NÃO - NÃO É PROPRIETÁRIO'
    END as is_owner,
    ss.id as salon_id,
    ss.name as salon_name
FROM salons_studios ss
WHERE ss.id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- Verificar se o proprietário está sendo identificado corretamente
-- SQL para debug da verificação de proprietário
SELECT 
    'VERIFICAÇÃO DE PROPRIETÁRIO' as info,
    'e4fe20f9-fec8-483f-86cc-5cf6f1106942' as current_user_id,
    ss.owner_id as salon_owner_id,
    CASE 
        WHEN 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' = ss.owner_id THEN 'SIM - É PROPRIETÁRIO'
        ELSE 'NÃO - NÃO É PROPRIETÁRIO'
    END as is_owner_check,
    ss.id as salon_id,
    ss.name as salon_name
FROM salons_studios ss
WHERE ss.id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- Verificar se o proprietário está em salon_professionals
SELECT 
    'PROPRIETÁRIO EM SALON_PROFESSIONALS' as info,
    sp.id,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    ss.owner_id,
    CASE 
        WHEN sp.professional_id = ss.owner_id THEN 'SIM - PROPRIETÁRIO É PROFISSIONAL'
        ELSE 'NÃO - PROPRIETÁRIO NÃO É PROFISSIONAL'
    END as owner_is_professional
FROM salon_professionals sp
JOIN salons_studios ss ON sp.salon_id = ss.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND sp.professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- Verificar posts principais atuais com detalhes de autorização
SELECT 
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    CASE 
        WHEN sp.id IS NOT NULL THEN 'profissional'
        WHEN se.id IS NOT NULL THEN 'funcionario'
        WHEN ss.owner_id = p.user_id THEN 'proprietario'
        ELSE 'outro'
    END as tipo_usuario,
    sp.id as profissional_id,
    se.id as funcionario_id,
    ss.owner_id as salon_owner_id,
    CASE 
        WHEN p.user_id = ss.owner_id THEN 'SIM - POST DO PROPRIETÁRIO'
        WHEN sp.id IS NOT NULL THEN 'SIM - POST DE PROFISSIONAL'
        WHEN se.id IS NOT NULL THEN 'SIM - POST DE FUNCIONÁRIO'
        ELSE 'NÃO - POST DE OUTRO USUÁRIO'
    END as post_authorization
FROM posts p
LEFT JOIN salon_professionals sp ON p.user_id = sp.professional_id
LEFT JOIN salon_employees se ON p.user_id = se.user_id
LEFT JOIN salons_studios ss ON (
    (sp.salon_id = ss.id) OR 
    (se.salon_id = ss.id) OR 
    (ss.owner_id = p.user_id)
)
WHERE p.is_salon_main_post = true
AND ss.id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY p.salon_main_post_priority;

-- Verificar posts de profissionais que o proprietário deveria conseguir gerenciar
SELECT 
    'POSTS DE PROFISSIONAIS PARA GERENCIAR' as info,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    CASE 
        WHEN p.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'POST DO PROPRIETÁRIO'
        ELSE 'POST DE PROFISSIONAL'
    END as post_type,
    sp.professional_id,
    sp.status as professional_status
FROM posts p
LEFT JOIN salon_professionals sp ON p.user_id = sp.professional_id AND sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197' 
    AND status = 'accepted'
)
ORDER BY p.created_at DESC
LIMIT 5;

-- Verificar estado atual dos posts principais
SELECT 
    'ESTADO ATUAL DOS POSTS PRINCIPAIS' as info,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    p.created_at,
    CASE 
        WHEN p.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'PROPRIETÁRIO'
        ELSE 'PROFISSIONAL'
    END as tipo_usuario
FROM posts p
WHERE p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority;

-- Verificar se há posts com is_salon_main_post = true mas priority = null
SELECT 
    'POSTS COM ESTADO INCONSISTENTE' as info,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    CASE 
        WHEN p.is_salon_main_post = true AND p.salon_main_post_priority IS NULL THEN 'INCONSISTENTE - TRUE MAS NULL'
        WHEN p.is_salon_main_post = false AND p.salon_main_post_priority IS NOT NULL THEN 'INCONSISTENTE - FALSE MAS TEM PRIORITY'
        ELSE 'CONSISTENTE'
    END as status
FROM posts p
WHERE (p.is_salon_main_post = true AND p.salon_main_post_priority IS NULL)
   OR (p.is_salon_main_post = false AND p.salon_main_post_priority IS NOT NULL);

-- Ativar todas as permissões para o proprietário do salão
-- SQL para dar todas as permissões ao proprietário existente

-- Primeiro, verificar se o proprietário já tem registro na tabela salon_employees
SELECT 
    'VERIFICANDO SE PROPRIETÁRIO JÁ É FUNCIONÁRIO' as info,
    se.id,
    se.user_id,
    se.salon_id,
    se.role,
    se.status
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- Se não existir, inserir o proprietário como funcionário com todas as permissões
INSERT INTO salon_employees (
    user_id, 
    salon_id, 
    role, 
    status, 
    role_description,
    permissions
) 
SELECT 
    'e4fe20f9-fec8-483f-86cc-5cf6f1106942' as user_id,
    '18e3a823-b280-4b75-9518-c01ed31fa197' as salon_id,
    'owner' as role,
    'active' as status,
    'Proprietário do salão' as role_description,
    '{
        "manage_employees": {
            "manage_employees.view": true,
            "manage_employees.add": true,
            "manage_employees.edit": true,
            "manage_employees.remove": true,
            "manage_employees.manage_permissions": true
        },
        "manage_service_professionals": {
            "manage_service_professionals.view": true,
            "manage_service_professionals.add": true,
            "manage_service_professionals.edit": true,
            "manage_service_professionals.remove": true,
            "manage_service_professionals.view_schedule": true,
            "manage_service_professionals.manage_schedule": true
        },
        "appointments": {
            "appointments.view": true,
            "appointments.create": true,
            "appointments.edit": true,
            "appointments.cancel": true,
            "appointments.reschedule": true,
            "appointments.view_all_professionals": true
        },
        "salon_info": {
            "salon_info.view": true,
            "salon_info.edit_basic_info": true,
            "salon_info.edit_social_media": true,
            "salon_info.edit_photos": true,
            "salon_info.edit_description": true
        },
        "reports": {
            "reports.view": true,
            "reports.export": true,
            "reports.financial_reports": true,
            "reports.performance_reports": true
        },
        "system_settings": {
            "system_settings.view": true,
            "system_settings.edit": true,
            "system_settings.manage_integrations": true
        },
        "content_management": {
            "content_management.view_posts": true,
            "content_management.manage_main_posts": true,
            "content_management.moderate_posts": true
        }
    }'::jsonb as permissions
WHERE NOT EXISTS (
    SELECT 1 FROM salon_employees 
    WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
    AND salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
);

-- Se já existir, atualizar as permissões para incluir a nova permissão
UPDATE salon_employees 
SET permissions = permissions || '{
    "content_management": {
        "content_management.view_posts": true,
        "content_management.manage_main_posts": true,
        "content_management.moderate_posts": true
    }
}'::jsonb
WHERE user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND NOT (permissions ? 'content_management');

-- Verificar se as permissões foram aplicadas corretamente
SELECT 
    'VERIFICANDO PERMISSÕES APLICADAS' as info,
    se.id,
    se.user_id,
    se.role,
    se.status,
    se.permissions->'content_management'->'content_management.manage_main_posts' as has_manage_main_posts_permission
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';


