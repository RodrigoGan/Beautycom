import { useSalons } from '@/hooks/useSalons'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const SalonDebug = () => {
  const { user } = useAuthContext()
  const { userSalon, loading, error, refetch } = useSalons(user?.id)

  const handleRefreshSession = async () => {
    try {
      console.log('🔄 Forçando refresh da sessão...')
      
      // Limpar cache do Supabase
      await supabase.auth.refreshSession()
      
      // Forçar refresh do salão
      await refetch()
      
      console.log('✅ Refresh concluído')
    } catch (error) {
      console.error('❌ Erro ao refresh:', error)
    }
  }

  const handleClearCache = async () => {
    try {
      console.log('🧹 Limpando cache...')
      
      // Limpar localStorage
      localStorage.clear()
      
      // Recarregar página
      window.location.reload()
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error)
    }
  }

  const handleTestStrategies = async () => {
    try {
      console.log('🧪 Testando estratégias de busca...')
      
      // Testar busca direta
      const { data, error } = await supabase
        .from('salons_studios')
        .select('*')
        .eq('id', '18e3a823-b280-4b75-9518-c01ed31fa197')
        .single()
      
      console.log('🧪 Resultado do teste direto:', { data, error })
      
      // Forçar refresh
      await refetch()
    } catch (error) {
      console.error('❌ Erro no teste:', error)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
      <h3 className="font-bold mb-2">🔍 Salon Debug</h3>
      <div>User ID: {user?.id || 'null'}</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Error: {error || 'null'}</div>
      <div>User Salon: {userSalon ? `ID: ${userSalon.id}` : 'null'}</div>
      <div>Salon Name: {userSalon?.name || 'null'}</div>
      <div className="flex gap-2 mt-2">
        <button 
          onClick={handleRefreshSession}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
        >
          🔄 Refresh
        </button>
        <button 
          onClick={handleClearCache}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs"
        >
          🧹 Clear Cache
        </button>
        <button 
          onClick={handleTestStrategies}
          className="px-2 py-1 bg-green-600 text-white rounded text-xs"
        >
          🧪 Test
        </button>
      </div>
    </div>
  )
}
