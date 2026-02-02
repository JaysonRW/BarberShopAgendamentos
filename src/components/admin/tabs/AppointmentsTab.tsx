import React from 'react';
import { Appointment } from '../../../types';
import { AppointmentService } from '../../../firestoreService';
import { WhatsAppIcon, TrashIcon } from '../../common/Icons';

interface AppointmentsTabProps {
  appointments: Appointment[];
  barberId: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ 
  appointments, barberId, isLoading, onRefresh 
}) => {
  const [filter, setFilter] = React.useState<'all' | 'today' | 'pending'>('all');

  const filteredAppointments = React.useMemo(() => {
    let filtered = appointments;
    const today = new Date().toISOString().split('T')[0];

    if (filter === 'today') {
      filtered = filtered.filter(a => a.date === today);
    } else if (filter === 'pending') {
      filtered = filtered.filter(a => a.status === 'Pendente');
    }
    return filtered;
  }, [appointments, filter]);

  const handleStatusChange = async (appointment: Appointment, newStatus: 'Confirmado' | 'Cancelado') => {
    if (newStatus === 'Confirmado') {
      const success = await AppointmentService.updateStatus(barberId, appointment.id, 'Confirmado');
      if (success) {
        // Enviar msg whatsapp
        const message = `Olá ${appointment.clientName}, seu agendamento para ${appointment.service?.name || 'serviço'} no dia ${new Date(appointment.date).toLocaleDateString('pt-BR')} às ${appointment.time} foi CONFIRMADO!`;
        const url = `https://wa.me/${appointment.clientWhatsapp}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        onRefresh();
      } else {
        alert('Erro ao confirmar agendamento.');
      }
    } else {
      if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        const success = await AppointmentService.cancel(barberId, appointment.id);
        if (success) {
           onRefresh();
        } else {
           alert('Erro ao cancelar agendamento.');
        }
      }
    }
  };

  if (isLoading) return <div className="text-center py-8">Carregando agendamentos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Agendamentos</h2>
        <div className="flex space-x-2 bg-gray-700 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('today')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'today' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
          >
            Hoje
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'pending' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
          >
            Pendentes
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
        ) : (
          filteredAppointments.map(appt => (
            <div key={appt.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{appt.clientName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    appt.status === 'Confirmado' ? 'bg-green-900 text-green-300' :
                    appt.status === 'Pendente' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {appt.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {new Date(appt.date).toLocaleDateString('pt-BR')} às {appt.time} • {appt.service?.name || 'Serviço'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <WhatsAppIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-300">{appt.clientWhatsapp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {appt.status === 'Pendente' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(appt, 'Confirmado')}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex-1 md:flex-none text-center"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatusChange(appt, 'Cancelado')}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex-1 md:flex-none text-center"
                    >
                      Recusar
                    </button>
                  </>
                )}
                {appt.status === 'Confirmado' && (
                   <button
                      onClick={() => handleStatusChange(appt, 'Cancelado')}
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded hover:bg-gray-600 text-sm"
                    >
                      Cancelar
                    </button>
                )}
                 <a 
                  href={`https://wa.me/${appt.clientWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                  title="Conversar no WhatsApp"
                >
                  <WhatsAppIcon className="h-5 w-5 text-white" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
