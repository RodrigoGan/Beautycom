-- Solução definitiva para o erro de constraint
-- PASSO 1: Verificar dados existentes que podem estar causando conflito
SELECT 
    'DADOS EXISTENTES NA TABELA' as info,
    se.id,
    se.user_id,
    se.salon_id,
    se.role,
    se.status
FROM salon_employees se
WHERE se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- PASSO 2: Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_employees'::regclass
    AND conname = 'salon_employees_role_check';

-- PASSO 3: Remover constraint atual (se existir)
ALTER TABLE salon_employees DROP CONSTRAINT IF EXISTS salon_employees_role_check;

-- PASSO 4: Verificar se ainda há constraints bloqueando
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_employees'::regclass
    AND contype = 'c'  -- check constraints
ORDER BY conname;

-- PASSO 5: Criar nova constraint mais permissiva
ALTER TABLE salon_employees ADD CONSTRAINT salon_employees_role_check 
CHECK (role IN ('admin', 'secretary', 'manager', 'receptionist', 'cleaner', 'assistant', 'other', 'owner'));

-- PASSO 6: Inserir proprietário como funcionário (método alternativo)
-- Usar UPSERT para evitar duplicatas
INSERT INTO salon_employees (
    user_id, 
    salon_id, 
    role, 
    status, 
    role_description,
    permissions
) VALUES (
    'e4fe20f9-fec8-483f-86cc-5cf6f1106942',
    '18e3a823-b280-4b75-9518-c01ed31fa197',
    'owner',
    'active',
    'Proprietário do salão',
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
    }'::jsonb
)
ON CONFLICT (user_id, salon_id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    role_description = EXCLUDED.role_description,
    permissions = EXCLUDED.permissions;

-- PASSO 7: Verificar se funcionou
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    se.id,
    se.user_id,
    se.salon_id,
    se.role,
    se.status,
    se.role_description,
    se.permissions->'content_management'->'content_management.manage_main_posts' as has_manage_main_posts_permission
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';
