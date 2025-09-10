const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function verificarCategorias() {
  try {
    console.log('🔍 Verificando categorias no banco...')
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('❌ Erro ao buscar categorias:', error)
      return
    }
    
    console.log('✅ Categorias encontradas:')
    data.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`)
    })
    
    // Verificar especificamente Sobrancelhas
    const sobrancelhas = data.find(cat => 
      cat.name.toLowerCase().includes('sobrancelha') || 
      cat.name.toLowerCase().includes('cílio')
    )
    
    if (sobrancelhas) {
      console.log('\n🎯 Categoria Sobrancelhas encontrada:')
      console.log(`  Nome: "${sobrancelhas.name}"`)
      console.log(`  ID: ${sobrancelhas.id}`)
    } else {
      console.log('\n❌ Categoria Sobrancelhas NÃO encontrada!')
      console.log('Categorias similares:')
      data.forEach(cat => {
        if (cat.name.toLowerCase().includes('sobran') || cat.name.toLowerCase().includes('cílio')) {
          console.log(`  - "${cat.name}"`)
        }
      })
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

verificarCategorias() 