import { createContext, useContext, useState, useCallback } from 'react'

interface CommentContextType {
  refreshCommentCount: (postId: string) => void
  subscribeToCommentUpdates: (postId: string, callback: () => void) => void
  unsubscribeFromCommentUpdates: (postId: string, callback: () => void) => void
}

const CommentContext = createContext<CommentContextType | undefined>(undefined)

export const CommentProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscribers, setSubscribers] = useState<Map<string, Set<() => void>>>(new Map())

  const refreshCommentCount = useCallback((postId: string) => {
    const callbacks = subscribers.get(postId)
    if (callbacks) {
      callbacks.forEach(callback => callback())
    }
  }, [subscribers])

  const subscribeToCommentUpdates = useCallback((postId: string, callback: () => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev)
      const callbacks = newSubscribers.get(postId) || new Set()
      callbacks.add(callback)
      newSubscribers.set(postId, callbacks)
      return newSubscribers
    })
  }, [])

  const unsubscribeFromCommentUpdates = useCallback((postId: string, callback: () => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev)
      const callbacks = newSubscribers.get(postId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          newSubscribers.delete(postId)
        }
      }
      return newSubscribers
    })
  }, [])

  return (
    <CommentContext.Provider value={{
      refreshCommentCount,
      subscribeToCommentUpdates,
      unsubscribeFromCommentUpdates
    }}>
      {children}
    </CommentContext.Provider>
  )
}

export const useCommentContext = () => {
  const context = useContext(CommentContext)
  if (!context) {
    throw new Error('useCommentContext must be used within a CommentProvider')
  }
  return context
}
