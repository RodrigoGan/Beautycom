import { createContext, useContext, useState, ReactNode } from 'react'

interface LoginModalContextType {
  showLoginModal: () => void
  hideLoginModal: () => void
  isLoginModalOpen: boolean
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined)

export const useLoginModal = () => {
  const context = useContext(LoginModalContext)
  if (!context) {
    throw new Error('useLoginModal deve ser usado dentro de um LoginModalProvider')
  }
  return context
}

interface LoginModalProviderProps {
  children: ReactNode
}

export const LoginModalProvider = ({ children }: LoginModalProviderProps) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const showLoginModal = () => setIsLoginModalOpen(true)
  const hideLoginModal = () => setIsLoginModalOpen(false)

  return (
    <LoginModalContext.Provider value={{
      showLoginModal,
      hideLoginModal,
      isLoginModalOpen
    }}>
      {children}
    </LoginModalContext.Provider>
  )
}
