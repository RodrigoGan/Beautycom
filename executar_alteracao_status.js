const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk4NzQ5MCwiZXhwIjoyMDUwNTYzNDkwfQ.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateAppointmentsStatusConstraint() {
  try {
    console.log('🔄 Atualizando constraint de status da tabela appointments...')
    
    // Primeiro, remover a constraint existente
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;'
    })
    
    if (dropError) {
      console.error('❌ Erro ao remover constraint:', dropError)
      return
    }
    
    console.log('✅ Constraint antiga removida')
    
    // Adicionar nova constraint com o novo status
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
            CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'cancelled_confirmed', 'no_show'));`
    })
    
    if (addError) {
      console.error('❌ Erro ao adicionar nova constraint:', addError)
      return
    }
    
    console.log('✅ Nova constraint adicionada com sucesso!')
    console.log('📋 Status permitidos: pending, confirmed, completed, cancelled, cancelled_confirmed, no_show')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar a função
updateAppointmentsStatusConstraint()










