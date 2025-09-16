import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgendaConfigurationStatus } from './useAgendaConfigurationStatus'
import { useAgendaActivation } from './useAgendaActivation'
import { supabase } from '@/lib/supabase'

export const useAgendaConfigurationModal = (userId?: string) => {
  const [showModal, setShowModal] = useState(false)
  const [hasCheckedToday, setHasCheckedToday] = useState(false)
  const [isProfessional, setIsProfessional] = useState(false)
  const navigate = useNavigate()
  
  const { checkConfigurationStatus, isComplete, missingItems, loading } = useAgendaConfigurationStatus(userId)
  const { trialInfo, checkAgendaActivationStatus } = useAgendaActivation(userId)

  // Verificar se já foi mostrado hoje
  const hasShownToday = useCallback(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('agenda-config-modal-last-shown')
    return lastShown === today
  }, [])

  // Marcar como mostrado hoje
  const markAsShownToday = useCallback(() => {
    const today = new Date().toDateString()
    localStorage.setItem('agenda-config-modal-last-shown', today)
  }, [])

  // Verificar se deve mostrar o modal
  const shouldShowModal = useCallback(() => {
    // Só mostra se:
    // 1. É profissional
    // 2. Tem trial ativo
    // 3. Agenda não está completa
    // 4. Não foi mostrado hoje
    return (
      userId &&
      isProfessional &&
      trialInfo?.status === 'active' &&
      !isComplete &&
      !hasShownToday() &&
      !loading
    )
  }, [userId, isProfessional, trialInfo, isComplete, loading, hasShownToday])

  // Verificar se é profissional
  const checkIfProfessional = useCallback(async () => {
    if (!userId) return
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single()
      
      if (!error && userData) {
        const isProf = userData.user_type === 'profissional'
        setIsProfessional(isProf)
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar user_type:', error)
    }
  }, [userId])

  // Verificar status da configuração
  const checkAndShowModal = useCallback(async () => {
    if (!userId || !isProfessional || hasCheckedToday) {
      return
    }

    try {
      setHasCheckedToday(true)
      const configResult = await checkConfigurationStatus()
      
      // Verificar se deve mostrar o modal usando o resultado direto
      const shouldShow = (
        userId &&
        isProfessional &&
        trialInfo?.status === 'active' &&
        !configResult.isComplete &&
        !hasShownToday() &&
        !configResult.loading
      )
      
      if (shouldShow) {
        setShowModal(true)
        markAsShownToday()
      }
    } catch (error) {
      console.error('Erro ao verificar configuração da agenda:', error)
    }
  }, [userId, isProfessional, hasCheckedToday, checkConfigurationStatus, shouldShowModal, markAsShownToday])

  // Verificar quando o componente monta
  useEffect(() => {
    if (userId && !hasCheckedToday) {
      checkIfProfessional()
    }
  }, [userId, hasCheckedToday, checkIfProfessional])

  // Verificar trial quando userId mudar
  useEffect(() => {
    if (userId) {
      checkAgendaActivationStatus()
    }
  }, [userId, checkAgendaActivationStatus])

  // Verificar modal quando isProfessional mudar
  useEffect(() => {
    if (isProfessional && !hasCheckedToday) {
      // Pequeno delay para garantir que outros hooks carregaram
      const timer = setTimeout(() => {
        checkAndShowModal()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isProfessional, hasCheckedToday, checkAndShowModal])

  // Handlers do modal
  const handleConfigureNow = useCallback(() => {
    setShowModal(false)
    navigate('/configuracoes-agenda')
  }, [navigate])

  const handleRemindLater = useCallback(() => {
    setShowModal(false)
    // Não marca como mostrado hoje, então pode aparecer novamente amanhã
  }, [])

  const handleClose = useCallback(() => {
    setShowModal(false)
  }, [])

  // Calcular dias restantes do trial
  const getDaysRemaining = useCallback(() => {
    if (!trialInfo?.end_date) return 0
    const end = new Date(trialInfo.end_date)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }, [trialInfo])

  return {
    showModal,
    daysRemaining: getDaysRemaining(),
    missingItems,
    loading,
    handleConfigureNow,
    handleRemindLater,
    handleClose
  }
}
