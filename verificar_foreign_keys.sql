-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DE FOREIGN KEYS - AGENDA
-- =====================================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('appointments', 'professional_availability', 'schedule_blocks')
ORDER BY table_name;

-- 2. VERIFICAR FOREIGN KEYS EXISTENTES
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('appointments', 'professional_availability', 'schedule_blocks');

-- 3. VERIFICAR SE AS TABELAS REFERENCIADAS EXISTEM
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'salons_studios', 'services');

-- 4. CORRIGIR FOREIGN KEYS SE NECESSÁRIO
-- Se as foreign keys não existirem, execute estes comandos:

-- Para appointments
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_salon_id_fkey;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES salons_studios(id) ON DELETE CASCADE;

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_professional_id_fkey 
FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_service_id_fkey;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

-- Para professional_availability
ALTER TABLE professional_availability 
DROP CONSTRAINT IF EXISTS professional_availability_professional_id_fkey;

ALTER TABLE professional_availability 
ADD CONSTRAINT professional_availability_professional_id_fkey 
FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE professional_availability 
DROP CONSTRAINT IF EXISTS professional_availability_salon_id_fkey;

ALTER TABLE professional_availability 
ADD CONSTRAINT professional_availability_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES salons_studios(id) ON DELETE CASCADE;

-- Para schedule_blocks
ALTER TABLE schedule_blocks 
DROP CONSTRAINT IF EXISTS schedule_blocks_professional_id_fkey;

ALTER TABLE schedule_blocks 
ADD CONSTRAINT schedule_blocks_professional_id_fkey 
FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE schedule_blocks 
DROP CONSTRAINT IF EXISTS schedule_blocks_salon_id_fkey;

ALTER TABLE schedule_blocks 
ADD CONSTRAINT schedule_blocks_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES salons_studios(id) ON DELETE CASCADE;

-- 5. VERIFICAR SE AS CORREÇÕES FUNCIONARAM
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('appointments', 'professional_availability', 'schedule_blocks')
ORDER BY tc.table_name, kcu.column_name;
