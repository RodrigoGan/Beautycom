-- =====================================================
-- LIMPEZA DE CATEGORIAS - BEAUTYCOM
-- =====================================================

-- Remover categorias que não estamos usando no momento
-- Manter apenas as categorias principais que fazem sentido para o MVP

-- =====================================================
-- 1. REMOVER CATEGORIAS DESNECESSÁRIAS
-- =====================================================

-- Remover categorias de nível 2 que não são essenciais
DELETE FROM categories WHERE name IN (
  'Maquiagem de Noiva',
  'Maquiagem Social', 
  'Maquiagem Artística',
  'Penteados',
  'Coloração',
  'Trança',
  'Cabelos Louros',
  'Nail Art',
  'Unhas Acrílicas',
  'Unhas de Gel'
);

-- =====================================================
-- 2. MANTER APENAS CATEGORIAS ESSENCIAIS
-- =====================================================

-- Categorias que vamos manter (Level 1):
-- ✅ Cabelos Femininos
-- ✅ Cabelos Masculinos  
-- ✅ Maquiagem
-- ✅ Cuidados com as Unhas
-- ✅ Cuidados com a Barba
-- ✅ Estética Facial
-- ✅ Estética Corporal
-- ✅ Sobrancelhas/Cílios
-- ✅ Tatuagem
-- ✅ Piercing

-- =====================================================
-- 3. VERIFICAR CATEGORIAS RESTANTES
-- =====================================================

-- Verificar quais categorias ficaram
SELECT 
  id,
  name,
  description,
  icon,
  color,
  level,
  parent_id
FROM categories 
ORDER BY level, sort_order, name;

-- =====================================================
-- 4. ATUALIZAR SORT_ORDER PARA ORGANIZAÇÃO
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
-- FIM DO SCRIPT
-- ===================================================== 