import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFollows } from "@/hooks/useFollows"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { User, Users, UserCheck, UserPlus } from "lucide-react"

interface FollowModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'following' | 'followers'
  title: string
}

export const FollowModal = ({ isOpen, onClose, userId, type, title }: FollowModalProps) => {
  const { user: currentUser } = useAuthContext()
  const { followUser, unfollowUser, checkIfFollowing } = useFollows(currentUser?.id || '')
  const { toast } = useToast()
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({})

  // Buscar dados específicos baseado no tipo
  const { stats, followingList, followersList, loading } = useFollows(userId)
  
  const userList = type === 'following' ? followingList : followersList
  const isOwnProfile = currentUser?.id === userId

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) return

    try {
      const isCurrentlyFollowing = followingStates[targetUserId]
      
      if (isCurrentlyFollowing) {
        // Deixar de seguir
        const result = await unfollowUser(targetUserId)
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [targetUserId]: false }))
          toast({
            title: "Deixou de seguir",
            description: "Usuário removido da sua lista de seguindo.",
          })
        }
      } else {
        // Seguir
        const result = await followUser(targetUserId)
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [targetUserId]: true }))
          toast({
            title: "Seguindo",
            description: "Usuário adicionado à sua lista de seguindo.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de follow.",
        variant: "destructive"
      })
    }
  }

  // Verificar estados de follow ao carregar
  const checkFollowStates = async () => {
    if (!currentUser || !isOwnProfile) return

    const states: { [key: string]: boolean } = {}
    for (const user of userList) {
      states[user.id] = await checkIfFollowing(user.id)
    }
    setFollowingStates(states)
  }

  // Verificar estados quando a lista carrega
  useEffect(() => {
    if (isOpen && userList.length > 0) {
      checkFollowStates()
    }
  }, [isOpen, userList.length])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                {type === 'following' ? <UserCheck className="h-5 w-5 text-white" /> : <Users className="h-5 w-5 text-white" />}
              </div>
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[60vh] px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userList.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={user.profile_photo} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {user.name?.charAt(0) || user.nickname?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {user.name || user.nickname}
                        </p>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {user.user_type === 'profissional' ? 'Profissional' : 'Usuário'}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{user.nickname}
                      </p>
                      {user.cidade && user.uf && (
                        <p className="text-xs text-muted-foreground">
                          {user.cidade}, {user.uf}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botão de follow/unfollow apenas se for o próprio perfil */}
                  {isOwnProfile && type === 'following' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowToggle(user.id)}
                      className="ml-2 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {followingStates[user.id] ? (
                        <>
                          <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Seguir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
