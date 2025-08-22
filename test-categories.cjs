const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'Não configurado')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Configurado' : 'Não configurado')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCategories() {
  console.log('🧪 Testando mapeamento de categorias...')
  
  try {
    // 1. Buscar categorias
    console.log('\n📋 Buscando categorias...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message)
      return
    }

    console.log(`✅ ${categories.length} categorias encontradas:`)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`)
    })

    // 2. Buscar usuários com categorias
    console.log('\n👥 Buscando usuários com categorias...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, categories')
      .not('categories', 'is', null)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message)
      return
    }

    console.log(`✅ ${users.length} usuários com categorias encontrados:`)
    
    // 3. Testar mapeamento
    users.forEach(user => {
      console.log(`\n👤 ${user.name}:`)
      console.log(`  Categorias (UUIDs): ${user.categories?.join(', ') || 'Nenhuma'}`)
      
      // Mapear UUIDs para nomes
      const categoryNames = user.categories?.map(id => {
        const category = categories.find(cat => cat.id === id)
        return category?.name || id
      }).filter(name => name !== '') || []
      
      console.log(`  Categorias (Nomes): ${categoryNames.join(', ') || 'Nenhuma'}`)
    })

    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testCategories() 