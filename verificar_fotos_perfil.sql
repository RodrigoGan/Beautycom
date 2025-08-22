-- Verificar se as fotos de perfil estão sendo salvas
SELECT 
    id,
    name,
    nickname,
    email,
    profile_photo,
    user_type,
    created_at
FROM users 
WHERE profile_photo IS NOT NULL 
ORDER BY created_at DESC;

-- Verificar usuários sem foto de perfil
SELECT 
    id,
    name,
    nickname,
    email,
    user_type,
    created_at
FROM users 
WHERE profile_photo IS NULL 
ORDER BY created_at DESC;

-- Contar usuários com e sem foto
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(profile_photo) as com_foto,
    COUNT(*) - COUNT(profile_photo) as sem_foto
FROM users;
