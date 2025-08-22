-- =====================================================
-- CORRIGIR TRIGGER SALON_MAIN_POSTS
-- =====================================================

-- 1. Remover trigger problemático temporariamente
DROP TRIGGER IF EXISTS trigger_validate_salon_main_posts_limit ON salon_main_posts;

-- 2. Recriar função de validação com mais logs
CREATE OR REPLACE FUNCTION validate_salon_main_posts_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Validando inserção: salon_id=%, post_id=%, priority_order=%', NEW.salon_id, NEW.post_id, NEW.priority_order;
    
    -- Verificar se já existem 3 posts principais para este salão
    SELECT COUNT(*) INTO current_count 
    FROM salon_main_posts 
    WHERE salon_id = NEW.salon_id;
    
    RAISE NOTICE 'Posts principais atuais para salão %: %', NEW.salon_id, current_count;
    
    -- Se já tem 3 posts, não permitir inserção
    IF current_count >= 3 THEN
        RAISE EXCEPTION 'Limite de 3 posts principais por salão foi atingido (salão: %, posts atuais: %)', NEW.salon_id, current_count;
    END IF;
    
    RAISE NOTICE 'Validação aprovada para inserção';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar trigger
CREATE TRIGGER trigger_validate_salon_main_posts_limit
    BEFORE INSERT ON salon_main_posts
    FOR EACH ROW
    EXECUTE FUNCTION validate_salon_main_posts_limit();

-- 4. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'salon_main_posts';

-- 5. Testar inserção manual (substitua os UUIDs pelos valores reais)
-- INSERT INTO salon_main_posts (salon_id, post_id, priority_order) 
-- VALUES ('uuid-do-salao', 'uuid-do-post', 1);

-- 6. Verificar se há registros órfãos
SELECT 
    'REGISTROS ORFAOS' as tipo,
    smp.id,
    smp.salon_id,
    smp.post_id
FROM salon_main_posts smp
LEFT JOIN salons_studios ss ON smp.salon_id = ss.id
LEFT JOIN posts p ON smp.post_id = p.id
WHERE ss.id IS NULL OR p.id IS NULL;

-- 7. Limpar registros órfãos se existirem
-- DELETE FROM salon_main_posts 
-- WHERE id IN (
--     SELECT smp.id
--     FROM salon_main_posts smp
--     LEFT JOIN salons_studios ss ON smp.salon_id = ss.id
--     LEFT JOIN posts p ON smp.post_id = p.id
--     WHERE ss.id IS NULL OR p.id IS NULL
-- );

-- 8. Verificar se as políticas RLS estão funcionando
-- Desabilitar RLS temporariamente para teste
-- ALTER TABLE salon_main_posts DISABLE ROW LEVEL SECURITY;

-- 9. Verificar se há problemas de constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_main_posts'::regclass;
