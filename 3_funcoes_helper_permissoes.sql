-- Script com funções helper para gerenciamento de permissões
-- Execute este script após criar as tabelas

-- Função para verificar se um usuário tem permissão específica em um salão
CREATE OR REPLACE FUNCTION check_salon_permission(
    p_salon_id UUID,
    p_user_id UUID,
    p_permission_path TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    permission_value BOOLEAN;
    path_parts TEXT[];
    current_level JSONB;
    i INTEGER;
BEGIN
    -- Buscar permissões do usuário no salão
    SELECT permissions INTO user_permissions
    FROM salon_employees
    WHERE salon_id = p_salon_id 
      AND user_id = p_user_id 
      AND status = 'active';
    
    -- Se não encontrou permissões, retorna false
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se é dono do salão (tem todas as permissões)
    IF EXISTS (
        SELECT 1 FROM salons_studios 
        WHERE id = p_salon_id AND owner_id = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Dividir o caminho da permissão em partes
    path_parts := string_to_array(p_permission_path, '.');
    current_level := user_permissions;
    
    -- Navegar pela estrutura de permissões
    FOR i IN 1..array_length(path_parts, 1) LOOP
        IF current_level IS NULL OR NOT (current_level ? path_parts[i]) THEN
            RETURN FALSE;
        END IF;
        
        IF i = array_length(path_parts, 1) THEN
            -- Último nível - verificar se é true
            permission_value := current_level->>path_parts[i];
            RETURN permission_value::BOOLEAN;
        ELSE
            -- Nível intermediário - continuar navegando
            current_level := current_level->path_parts[i];
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as permissões de um usuário em um salão
CREATE OR REPLACE FUNCTION get_user_salon_permissions(
    p_salon_id UUID,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
    is_owner BOOLEAN;
BEGIN
    -- Verificar se é dono do salão
    SELECT EXISTS (
        SELECT 1 FROM salons_studios 
        WHERE id = p_salon_id AND owner_id = p_user_id
    ) INTO is_owner;
    
    -- Se for dono, retorna todas as permissões
    IF is_owner THEN
        RETURN '{
            "manage_employees": {"view": true, "add": true, "edit": true, "remove": true, "manage_permissions": true},
            "manage_service_professionals": {"view": true, "add": true, "edit": true, "remove": true, "view_schedule": true, "manage_schedule": true},
            "appointments": {"view": true, "create": true, "edit": true, "cancel": true, "reschedule": true, "view_all_professionals": true},
            "salon_info": {"view": true, "edit_basic_info": true, "edit_social_media": true, "edit_photos": true, "edit_description": true},
            "reports": {"view": true, "export": true, "financial_reports": true, "performance_reports": true},
            "system_settings": {"view": true, "edit": true, "manage_integrations": true}
        }'::JSONB;
    END IF;
    
    -- Buscar permissões do funcionário
    SELECT permissions INTO user_permissions
    FROM salon_employees
    WHERE salon_id = p_salon_id 
      AND user_id = p_user_id 
      AND status = 'active';
    
    RETURN COALESCE(user_permissions, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter o cargo de um usuário em um salão
CREATE OR REPLACE FUNCTION get_user_salon_role(
    p_salon_id UUID,
    p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    is_owner BOOLEAN;
BEGIN
    -- Verificar se é dono do salão
    SELECT EXISTS (
        SELECT 1 FROM salons_studios 
        WHERE id = p_salon_id AND owner_id = p_user_id
    ) INTO is_owner;
    
    -- Se for dono, retorna 'owner'
    IF is_owner THEN
        RETURN 'owner';
    END IF;
    
    -- Buscar cargo do funcionário
    SELECT role INTO user_role
    FROM salon_employees
    WHERE salon_id = p_salon_id 
      AND user_id = p_user_id 
      AND status = 'active';
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se um usuário tem acesso a um salão
CREATE OR REPLACE FUNCTION has_salon_access(
    p_salon_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se é dono
    IF EXISTS (
        SELECT 1 FROM salons_studios 
        WHERE id = p_salon_id AND owner_id = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se é funcionário ativo
    IF EXISTS (
        SELECT 1 FROM salon_employees
        WHERE salon_id = p_salon_id 
          AND user_id = p_user_id 
          AND status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION check_salon_permission IS 'Verifica se um usuário tem uma permissão específica em um salão';
COMMENT ON FUNCTION get_user_salon_permissions IS 'Retorna todas as permissões de um usuário em um salão';
COMMENT ON FUNCTION get_user_salon_role IS 'Retorna o cargo de um usuário em um salão';
COMMENT ON FUNCTION has_salon_access IS 'Verifica se um usuário tem acesso a um salão';



