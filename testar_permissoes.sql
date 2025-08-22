-- Testar permissões dos funcionários existentes
SELECT 
  id,
  role,
  permissions,
  CASE 
    WHEN permissions IS NULL THEN 'PERMISSÕES NULAS - PROBLEMA!'
    WHEN permissions = '{}' THEN 'PERMISSÕES VAZIAS - PROBLEMA!'
    WHEN permissions::text LIKE '%"manage_employees"%' THEN 'PERMISSÕES OK'
    ELSE 'ESTRUTURA DIFERENTE'
  END as status_permissoes
FROM salon_employees 
WHERE status = 'active';

-- Corrigir permissões de funcionários que não têm permissões definidas
-- Primeiro, vamos ver quais precisam ser corrigidos
SELECT 
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '{"manage_employees":{"view":true,"add":true,"edit":true,"remove":true,"manage_permissions":true},"manage_service_professionals":{"view":true,"add":true,"edit":true,"remove":true,"view_schedule":true,"manage_schedule":true},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":true,"edit_social_media":true,"edit_photos":true,"edit_description":true},"reports":{"view":true,"export":true,"financial_reports":true,"performance_reports":true},"system_settings":{"view":true,"edit":true,"manage_integrations":true}}'
    WHEN role = 'manager' THEN '{"manage_employees":{"view":true,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":true,"edit":true,"remove":false,"view_schedule":true,"manage_schedule":true},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":true,"edit_social_media":true,"edit_photos":false,"edit_description":true},"reports":{"view":true,"export":true,"financial_reports":true,"performance_reports":true},"system_settings":{"view":true,"edit":false,"manage_integrations":false}}'
    WHEN role = 'secretary' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":false,"edit":false,"remove":false,"view_schedule":true,"manage_schedule":false},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":true,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'
    WHEN role = 'receptionist' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":false,"edit":false,"remove":false,"view_schedule":true,"manage_schedule":false},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'
    WHEN role = 'cleaner' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":false,"add":false,"edit":false,"remove":false,"view_schedule":false,"manage_schedule":false},"appointments":{"view":false,"create":false,"edit":false,"cancel":false,"reschedule":false,"view_all_professionals":false},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'
    ELSE '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":false,"add":false,"edit":false,"remove":false,"view_schedule":false,"manage_schedule":false},"appointments":{"view":false,"create":false,"edit":false,"cancel":false,"reschedule":false,"view_all_professionals":false},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'
  END as permissoes_corrigidas
FROM salon_employees 
WHERE status = 'active' 
AND (permissions IS NULL OR permissions = '{}');

-- ATENÇÃO: Execute este UPDATE apenas se quiser corrigir as permissões
-- UPDATE salon_employees 
-- SET permissions = CASE 
--   WHEN role = 'admin' THEN '{"manage_employees":{"view":true,"add":true,"edit":true,"remove":true,"manage_permissions":true},"manage_service_professionals":{"view":true,"add":true,"edit":true,"remove":true,"view_schedule":true,"manage_schedule":true},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":true,"edit_social_media":true,"edit_photos":true,"edit_description":true},"reports":{"view":true,"export":true,"financial_reports":true,"performance_reports":true},"system_settings":{"view":true,"edit":true,"manage_integrations":true}}'::jsonb
--   WHEN role = 'manager' THEN '{"manage_employees":{"view":true,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":true,"edit":true,"remove":false,"view_schedule":true,"manage_schedule":true},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":true,"edit_social_media":true,"edit_photos":false,"edit_description":true},"reports":{"view":true,"export":true,"financial_reports":true,"performance_reports":true},"system_settings":{"view":true,"edit":false,"manage_integrations":false}}'::jsonb
--   WHEN role = 'secretary' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":false,"edit":false,"remove":false,"view_schedule":true,"manage_schedule":false},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":true,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'::jsonb
--   WHEN role = 'receptionist' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":true,"add":false,"edit":false,"remove":false,"view_schedule":true,"manage_schedule":false},"appointments":{"view":true,"create":true,"edit":true,"cancel":true,"reschedule":true,"view_all_professionals":true},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'::jsonb
--   WHEN role = 'cleaner' THEN '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":false,"add":false,"edit":false,"remove":false,"view_schedule":false,"manage_schedule":false},"appointments":{"view":false,"create":false,"edit":false,"cancel":false,"reschedule":false,"view_all_professionals":false},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'::jsonb
--   ELSE '{"manage_employees":{"view":false,"add":false,"edit":false,"remove":false,"manage_permissions":false},"manage_service_professionals":{"view":false,"add":false,"edit":false,"remove":false,"view_schedule":false,"manage_schedule":false},"appointments":{"view":false,"create":false,"edit":false,"cancel":false,"reschedule":false,"view_all_professionals":false},"salon_info":{"view":true,"edit_basic_info":false,"edit_social_media":false,"edit_photos":false,"edit_description":false},"reports":{"view":false,"export":false,"financial_reports":false,"performance_reports":false},"system_settings":{"view":false,"edit":false,"manage_integrations":false}}'::jsonb
-- END
-- WHERE status = 'active' 
-- AND (permissions IS NULL OR permissions = '{}');



