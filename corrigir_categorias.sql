-- =====================================================
-- CORREÇÃO DAS CATEGORIAS - BEAUTYCOM
-- =====================================================

-- Atualizar os nomes das categorias para os corretos
-- Baseado no que você especificou

-- =====================================================
-- 1. ATUALIZAR NOMES DAS CATEGORIAS
-- =====================================================

-- Atualizar "Unhas" para "Cuidados com as Unhas"
UPDATE categories 
SET name = 'Cuidados com as Unhas',
    description = 'Cuidados e decoração de unhas'
WHERE name = 'Unhas';

-- Atualizar "Barba" para "Cuidados com a Barba"
UPDATE categories 
SET name = 'Cuidados com a Barba',
    description = 'Cuidados e modelagem de barba'
WHERE name = 'Barba';

-- Atualizar "Sobrancelhas" para "Sobrancelhas/Cílios"
UPDATE categories 
SET name = 'Sobrancelhas/Cílios',
    description = 'Design e modelagem de sobrancelhas e cílios'
WHERE name = 'Sobrancelhas';

-- Atualizar "Depilação" para "Piercing"
UPDATE categories 
SET name = 'Piercing',
    description = 'Técnicas de piercing e body art',
    icon = '💎',
    color = '#FF1493'
WHERE name = 'Depilação';

-- =====================================================
-- 2. VERIFICAR CATEGORIAS ATUALIZADAS
-- =====================================================

-- Verificar se as atualizações funcionaram
SELECT 
  id,
  name,
  description,
  icon,
  color,
  level,
  parent_id
FROM categories 
ORDER BY sort_order, name;

-- =====================================================
-- 3. ATUALIZAR SORT_ORDER PARA ORGANIZAÇÃO
-- =====================================================

-- Reorganizar sort_order das categorias principais
UPDATE categories SET sort_order = 1 WHERE name = 'Cabelos Femininos';
UPDATE categories SET sort_order = 2 WHERE name = 'Cabelos Masculinos';
UPDATE categories SET sort_order = 3 WHERE name = 'Maquiagem';
UPDATE categories SET sort_order = 4 WHERE name = 'Cuidados com as Unhas';
UPDATE categories SET sort_order = 5 WHERE name = 'Cuidados com a Barba';
UPDATE categories SET sort_order = 6 WHERE name = 'Estética Facial';
UPDATE categories SET sort_order = 7 WHERE name = 'Estética Corporal';
UPDATE categories SET sort_order = 8 WHERE name = 'Sobrancelhas/Cílios';
UPDATE categories SET sort_order = 9 WHERE name = 'Tatuagem';
UPDATE categories SET sort_order = 10 WHERE name = 'Piercing';

-- =====================================================
-- 4. VERIFICAR RESULTADO FINAL
-- =====================================================

-- Verificar categorias finais
SELECT 
  name,
  description,
  icon,
  sort_order
FROM categories 
WHERE level = 1
ORDER BY sort_order;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 