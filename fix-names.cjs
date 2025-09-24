const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const fixNames = async () => {
  try {
    console.log('🧹 Corrigindo espaços extras dos nomes...')
    
    // Buscar todos os usuários
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name')
    
    if (fetchError) {
      console.error('❌ Erro ao buscar usuários:', fetchError.message)
      return
    }
    
    console.log(`📊 Encontrados ${users.length} usuários`)
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const user of users) {
      if (user.name && user.name !== user.name.trim()) {
        try {
          const trimmedName = user.name.trim()
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ name: trimmedName })
            .eq('id', user.id)
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar ${user.name}:`, updateError.message)
            errorCount++
          } else {
            console.log(`✅ Corrigido: "${user.name}" -> "${trimmedName}"`)
            updatedCount++
          }
        } catch (error) {
          console.error(`❌ Erro ao processar ${user.name}:`, error.message)
          errorCount++
        }
      }
    }
    
    console.log('\n--- Relatório de Correção ---')
    console.log(`✅ Nomes corrigidos: ${updatedCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    console.log(`📊 Total processado: ${users.length}`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

fixNames()

