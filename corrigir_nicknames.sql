-- =====================================================
-- CORRIGIR NICKNAMES DOS USUÁRIOS
-- =====================================================

-- Atualizar nicknames com nomes mais legíveis
UPDATE users SET nickname = 'rodrigo' WHERE email = 'rodrigo_gan@hotmail.com';
UPDATE users SET nickname = 'ricardo' WHERE email = 'ricardo@moveisforty.com.br';
UPDATE users SET nickname = 'ana_silva' WHERE email = 'ana.silva@example.com';
UPDATE users SET nickname = 'carlos_santos' WHERE email = 'carlos.santos@example.com';
UPDATE users SET nickname = 'bella_salon' WHERE email = 'bella.salon@example.com';
UPDATE users SET nickname = 'maria_costa' WHERE email = 'maria.costa@example.com';
UPDATE users SET nickname = 'joao_pereira' WHERE email = 'joao.pereira@example.com';
UPDATE users SET nickname = 'fernanda_lima' WHERE email = 'fernanda.lima@example.com';
UPDATE users SET nickname = 'rafael_costa' WHERE email = 'rafael.costa@example.com';
UPDATE users SET nickname = 'juliana_santos' WHERE email = 'juliana.santos@example.com';
UPDATE users SET nickname = 'roberto_alves' WHERE email = 'roberto.alves@example.com';
UPDATE users SET nickname = 'patricia_santos' WHERE email = 'patricia.santos@example.com';

-- =====================================================
-- VERIFICAR NICKNAMES CORRIGIDOS
-- =====================================================

-- Listar usuários com nicknames corrigidos
SELECT 
    name,
    nickname,
    email
FROM users 
ORDER BY name; 