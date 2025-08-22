-- Corrigir constraint para permitir role 'owner'
-- Remover constraint existente
ALTER TABLE salon_employees DROP CONSTRAINT IF EXISTS salon_employees_role_check;

-- Recriar constraint incluindo 'owner'
ALTER TABLE salon_employees ADD CONSTRAINT salon_employees_role_check 
CHECK (role IN ('receptionist', 'assistant', 'manager', 'other', 'owner'));

-- Agora executar novamente o INSERT do proprietário
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

-- Verificar se foi inserido com sucesso
SELECT 
    'PROPRIETÁRIO INSERIDO COM SUCESSO' as status,
    se.id,
    se.user_id,
    se.salon_id,
    se.role,
    se.status,
    se.permissions->'content_management'->'content_management.manage_main_posts' as has_manage_main_posts_permission
FROM salon_employees se
WHERE se.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';
