import React from 'react';
import { BarberData } from '../../../types';

interface DashboardTabProps {
  barberData: BarberData;
  financialSummary: {
    confirmedTotal: number;
    pendingTotal: number;
    totalRevenue: number;
  };
}

const DashboardTab: React.FC<DashboardTabProps> = ({ barberData, financialSummary }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold">Dashboard</h2>
    
    {/* Cards de Estatísticas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Total de Agendamentos</h3>
        <p className="text-3xl font-bold text-white">{barberData.appointments.length}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Serviços Ativos</h3>
        <p className="text-3xl font-bold text-white">{barberData.services.length}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Promoções Ativas</h3>
        <p className="text-3xl font-bold text-white">{barberData.promotions.length}</p>
      </div>
    </div>
    
    {/* Novos Cards Financeiros */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Receita Confirmada</h3>
        <p className="text-3xl font-bold text-green-500">R$ {financialSummary.confirmedTotal.toFixed(2)}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">A Confirmar (Previsão)</h3>
        <p className="text-3xl font-bold text-yellow-500">R$ {financialSummary.pendingTotal.toFixed(2)}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Receita Total (Previsão)</h3>
        <p className="text-3xl font-bold text-white">R$ {financialSummary.totalRevenue.toFixed(2)}</p>
      </div>
    </div>

    {/* Agendamentos Recentes */}
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Agendamentos Recentes</h3>
      {barberData.appointments.length > 0 ? (
        <div className="space-y-4">
          {barberData.appointments.slice(0, 5).map(appointment => (
            <div key={appointment.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold">{appointment.clientName}</p>
                <p className="text-sm text-gray-300">
                  {appointment.service?.name || 'Serviço não especificado'} - {new Date(appointment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {appointment.time}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                appointment.status === 'Confirmado' ? 'bg-green-600' : 'bg-yellow-600'
              }`}>
                {appointment.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Nenhum agendamento ainda.</p>
      )}
    </div>
  </div>
);

export default DashboardTab;
