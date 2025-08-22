const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTI0OTUsImV4cCI6MjA2OTM2ODQ5NX0.MyYN4cA5pLsKb1uklQRIpX1rEuahBj4DZFcp1ljgvss'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPostsStructure() {
  console.log('🔍 Testando estrutura dos posts...')
  
  try {
    // Buscar alguns posts com dados do autor
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          name,
          nickname,
          profile_photo
        )
      `)
      .limit(3)

    if (error) {
      console.error('❌ Erro ao buscar posts:', error.message)
      return
    }

    console.log(`✅ Posts encontrados: ${posts?.length || 0}`)
    
    if (posts && posts.length > 0) {
      posts.forEach((post, index) => {
        console.log(`\n📋 POST ${index + 1}:`)
        console.log('  ID:', post.id)
        console.log('  user_id:', post.user_id)
        console.log('  title:', post.title)
        console.log('  author:', post.author)
        console.log('  author.id:', post.author?.id)
        console.log('  author.name:', post.author?.name)
        console.log('  author.nickname:', post.author?.nickname)
      })
    } else {
      console.log('❌ Nenhum post encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testPostsStructure()
