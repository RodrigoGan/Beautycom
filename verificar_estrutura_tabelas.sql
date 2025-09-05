-- SQL para verificar a estrutura atual das tabelas

-- 1. Verificar se a tabela user_subscriptions existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions';

-- 2. Se a tabela existir, verificar suas colunas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar colunas relacionadas a assinatura na tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND (column_name LIKE '%subscription%' OR column_name LIKE '%stripe%')
ORDER BY ordinal_position;

-- 4. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('has_active_subscription', 'get_active_plan');

-- 5. Verificar políticas RLS da tabela user_subscriptions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_subscriptions';

-- 6. Verificar se há dados na tabela user_subscriptions (se existir)
SELECT COUNT(*) as total_registros
FROM user_subscriptions;

-- 7. Verificar estrutura completa da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;