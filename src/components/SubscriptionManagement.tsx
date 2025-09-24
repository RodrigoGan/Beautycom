import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscriptionInfo } from '@/hooks/useSubscriptionInfo';
import { useStripe } from '@/hooks/useStripe';
import { supabase } from '@/lib/supabase';

interface SubscriptionManagementProps {
  className?: string;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ className = '' }) => {
  const { user } = useAuthContext();
  const { subscriptionSummary, loading, error, refetch } = useSubscriptionInfo();
  const { cancelSubscription, loading: cancelLoading } = useStripe();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelSubscription = async () => {
    if (!user) return;

    try {
      const success = await cancelSubscription();
      if (success) {
        setShowCancelModal(false);
        await refetch(); // Recarregar dados
        alert('Assinatura cancelada com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'canceled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'expired': return 'Expirada';
      case 'canceled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar assinatura</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={refetch}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!subscriptionSummary || subscriptionSummary.type === 'none') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura ativa</h3>
          <p className="text-gray-600 mb-4">Você não possui uma assinatura ativa no momento.</p>
          <a 
            href="/planos"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver Planos Disponíveis
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {subscriptionSummary.planName}
              </h3>
              <p className="text-sm text-gray-600">
                {subscriptionSummary.type === 'trial' ? 'Trial Gratuito' : 'Assinatura Paga'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionSummary.status)}`}>
              {getStatusText(subscriptionSummary.status)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Profissionais</p>
              <p className="text-lg font-medium">
                {subscriptionSummary.currentProfessionals} / {subscriptionSummary.maxProfessionals}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expira em</p>
              <p className="text-lg font-medium">
                {subscriptionSummary.daysRemaining} dias
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data de expiração</p>
              <p className="text-lg font-medium">
                {subscriptionSummary.expirationDate ? 
                  new Date(subscriptionSummary.expirationDate).toLocaleDateString('pt-BR') : 
                  'N/A'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {subscriptionSummary.type === 'subscription' && subscriptionSummary.isActive && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
              </button>
            )}
            
            <a 
              href="/planos"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Alterar Plano
            </a>
            
            <button
              onClick={refetch}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancelar Assinatura
            </h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo do cancelamento (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Conte-nos o motivo do cancelamento..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
