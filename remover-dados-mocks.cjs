const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function removerDadosMocks() {
  try {
    console.log('🗑️  Removendo dados mocks do banco...')
    
    // Lista de emails que são claramente mocks
    const emailsMocks = [
      'teste@beautycom.com',
      'ana.silva@example.com',
      'carlos.santos@example.com',
      'maria.costa@example.com',
      'joao.pereira@example.com',
      'fernanda.lima@example.com',
      'roberto.alves@example.com',
      'patricia.santos@example.com',
      'bella.salon@example.com',
      'studio.beauty@example.com',
      'beauty.studio@example.com',
      'elite.beauty@example.com',
      'juliana.santos@example.com',
      'rafael.costa@example.com',
      'amanda.silva@example.com'
    ]
    
    console.log(`📋 ${emailsMocks.length} emails mocks identificados`)
    
    // Remover usuários mocks
    for (const email of emailsMocks) {
      console.log(`🗑️  Removendo: ${email}`)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', email)
      
      if (error) {
        console.error(`❌ Erro ao remover ${email}:`, error.message)
      } else {
        console.log(`✅ Removido: ${email}`)
      }
    }
    
    // Verificar se ainda há dados mocks
    const { data: usuariosRestantes, error } = await supabase
      .from('users')
      .select('email, name')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao verificar usuários restantes:', error)
      return
    }
    
    console.log(`\n✅ Limpeza concluída! ${usuariosRestantes.length} usuários restantes:`)
    usuariosRestantes.forEach(user => {
      console.log(`   - ${user.name || 'Sem nome'} (${user.email})`)
    })
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

removerDadosMocks() 