import React from 'react';
import { Client, Service } from '../../../types';
import { AppointmentService } from '../../../firestoreService';
import { CalendarIcon, ClockIcon, ScissorsIcon, CreditCardIcon, CloseIcon } from '../../common/Icons';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  services: Service[];
  availability: Record<string, string[]>;
  barberId: string;
  onSuccess: () => void;
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  isOpen,
  onClose,
  client,
  services,
  availability,
  barberId,
  onSuccess
}) => {
  const [formData, setFormData] = React.useState({
    serviceId: '',
    date: '',
    time: '',
    paymentMethod: 'PIX',
    status: 'Confirmado' as 'Pendente' | 'Confirmado'
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when modal opens/client changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        serviceId: '',
        date: '',
        time: '',
        paymentMethod: 'PIX',
        status: 'Confirmado'
      });
    }
  }, [isOpen, client]);

  const availableTimes = React.useMemo(() => {
    if (!formData.date) return [];
    
    // Se houver disponibilidade explícita no banco, usa ela
    if (availability[formData.date]) {
      return availability[formData.date];
    }

    // Fallback: Se não houver registro para a data (ex: datas futuras ainda não geradas),
    // assume horários padrão (Seg-Sáb)
    const dateObj = new Date(formData.date);
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Domingo, 6 = Sábado

    // Se for domingo, não há horários (ajuste conforme necessidade da barbearia)
    if (dayOfWeek === 0) return [];

    // Horários padrão
    return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  }, [formData.date, availability]);

  const availableDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    
    // Gerar próximas datas (hoje + 14 dias)
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      // Ignora domingos (0)
      if (d.getDay() === 0) continue;
      
      const dateStr = d.toISOString().split('T')[0];
      
      // Verifica disponibilidade:
      // 1. Se existir no objeto availability e tiver slots > 0
      // 2. OU se NÃO existir no objeto availability (assume padrão livre)
      const hasSlots = availability[dateStr] 
        ? availability[dateStr].length > 0 
        : true; // Se não tem registro, assume que é dia útil padrão com vagas

      if (hasSlots) {
        dates.push(dateStr);
      }

      if (dates.length >= 6) break; // Pegar 6 sugestões
    }
    
    return dates;
  }, [availability]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceId || !formData.date || !formData.time) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      
      const appointmentData = {
        clientName: client.name,
        clientWhatsapp: client.whatsapp,
        birthdate: client.birthdate,
        service: selectedService!,
        serviceId: selectedService!.id,
        serviceName: selectedService!.name,
        servicePrice: selectedService!.price,
        date: formData.date,
        time: formData.time,
        paymentMethod: formData.paymentMethod,
        status: formData.status
      };

      const createdId = await AppointmentService.create(barberId, appointmentData);
      
      if (createdId && formData.status === 'Confirmado') {
         await AppointmentService.updateStatus(barberId, createdId, 'Confirmado');
      }
      
      alert('Agendamento criado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Novo Agendamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Info (Read-only) */}
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-400">Cliente</p>
            <p className="font-bold text-white">{client.name}</p>
            <p className="text-sm text-gray-300">{client.whatsapp}</p>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <ScissorsIcon className="h-4 w-4 mr-2" /> Serviço
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Selecione um serviço...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - R$ {s.price.toFixed(2)} {s.duration ? `(${s.duration} min)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" /> Data
            </label>
            <input
              type="date"
              min={today}
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            
            {/* Sugestões de Datas */}
            {availableDates.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Próximas datas com horários:</p>
                <div className="flex flex-wrap gap-2">
                  {availableDates.map(date => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setFormData({...formData, date, time: ''})}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-gray-300 transition-colors"
                    >
                      {new Date(date).toLocaleDateString('pt-BR')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Selection */}
          {formData.date && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" /> Horário
              </label>
              
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({...formData, time})}
                      className={`p-2 rounded-lg text-sm font-medium transition duration-200 ${
                        formData.time === time
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-900/50">
                  Nenhum horário disponível para esta data.
                </p>
              )}
            </div>
          )}

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <CreditCardIcon className="h-4 w-4 mr-2" /> Pagamento
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="PIX">PIX</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
            </select>
          </div>

          {/* Status */}
          <div>
             <label className="flex items-center space-x-2 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={formData.status === 'Confirmado'}
                 onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Confirmado' : 'Pendente'})}
                 className="form-checkbox h-5 w-5 text-red-600 rounded focus:ring-red-500 bg-gray-700 border-gray-600"
               />
               <span className="text-white text-sm">Já confirmar agendamento?</span>
             </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
