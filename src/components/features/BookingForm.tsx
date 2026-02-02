import * as React from 'react';
import { ScissorsIcon, CalendarIcon, ClockIcon, CreditCardIcon } from '../common/Icons';
import type { Service, BarberData, Appointment } from '../../types';
import { AppointmentService } from '../../firestoreService';

export const BookingForm: React.FC<{ 
  services: Service[]; 
  availability: Record<string, string[]>;
  barberData: BarberData;
  onBookingSuccess: () => void;
}> = ({ services, availability, barberData, onBookingSuccess }) => {
  const [formData, setFormData] = React.useState({
    clientName: '',
    clientWhatsapp: '',
    serviceId: '',
    date: '',
    time: '',
    paymentMethod: 'PIX',
    birthdate: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const availableDates = React.useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      if (availability[dateString]?.length > 0) {
        dates.push(dateString);
      }
    }
    return dates;
  }, [availability]);

  const availableTimes = formData.date ? availability[formData.date] || [] : [];

  const selectedService = services.find(s => s.id === formData.serviceId);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'date' && { time: '' }) // Reset time when date changes
    }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientWhatsapp || !selectedService || !formData.date || !formData.time) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar agendamento no Firestore
      const appointmentData = {
        clientName: formData.clientName,
        clientWhatsapp: formData.clientWhatsapp,
        birthdate: formData.birthdate,
        service: selectedService,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: formData.date,
        time: formData.time,
        paymentMethod: formData.paymentMethod,
        status: 'Pendente' as const
      };

      const appointmentId = await AppointmentService.create(barberData.id, appointmentData);

      if (appointmentId) {
        // Enviar para WhatsApp do barbeiro
        const formattedDate = new Date(formData.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const barberMessage = `*Novo Agendamento*\n\n*Cliente:* ${formData.clientName}\n*Serviço:* ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})\n*Data:* ${formattedDate}\n*Hora:* ${formData.time}\n*Pagamento:* ${formData.paymentMethod}\n*WhatsApp:* ${formData.clientWhatsapp}`;
        const barberUrl = `https://wa.me/${barberData.profile.whatsappNumber}?text=${encodeURIComponent(barberMessage)}`;

        // Abrir WhatsApp do barbeiro
        window.open(barberUrl, '_blank');

        setShowSuccess(true);
        onBookingSuccess();

        // Reset form
        setFormData({
          clientName: '',
          clientWhatsapp: '',
          serviceId: '',
          date: '',
          time: '',
          paymentMethod: 'PIX',
          birthdate: ''
        });
      } else {
        alert('Erro ao criar agendamento. Horário pode não estar mais disponível.');
      }
    } catch (error) {
      console.error('Erro ao agendar:', error);
      alert('Erro ao processar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <section id="agendamento" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Agendamento Enviado!</h3>
            <p className="mb-4">Sua solicitação foi enviada para o barbeiro. Em breve você receberá a confirmação.</p>
            <button 
              onClick={() => setShowSuccess(false)} 
              className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition duration-300"
            >
              Fazer Novo Agendamento
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="agendamento" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 uppercase text-gray-800">
          Agende seu <span className="text-primary">Horário</span>
        </h2>
        
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-6">
          
          {/* Serviços */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <ScissorsIcon className="h-5 w-5 mr-2" /> Serviço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {services.map(service => (
                <button 
                  key={service.id} 
                  type="button" 
                  onClick={() => handleInputChange('serviceId', service.id)}
                  className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${
                    formData.serviceId === service.id 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  {service.name}
                  <span className="block text-xs opacity-80">R$ {service.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Datas */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" /> Data
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {availableDates.map(date => (
                <button 
                  key={date} 
                  type="button" 
                  onClick={() => handleInputChange('date', date)}
                  className={`p-2 border rounded-lg text-center transition duration-300 flex flex-col justify-center items-center h-16 ${
                    formData.date === date 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')}</span>
                  <span className="text-sm">{new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          {formData.date && (
            <div>
              <label className="block text-gray-800 font-bold mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" /> Horário
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {availableTimes.map(time => (
                  <button 
                    key={time} 
                    type="button" 
                    onClick={() => handleInputChange('time', time)}
                    className={`p-3 border rounded-lg transition duration-300 ${
                      formData.time === time 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dados pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="block text-gray-800 font-bold mb-2">Nome Completo</label>
              <input 
                type="text" 
                value={formData.clientName}
                onChange={e => handleInputChange('clientName', e.target.value)}
                placeholder="Seu nome completo" 
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900" 
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 font-bold mb-2">WhatsApp</label>
              <input 
                type="tel" 
                value={formData.clientWhatsapp}
                onChange={e => handleInputChange('clientWhatsapp', e.target.value)}
                placeholder="Ex: 5511999998888" 
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900" 
                required
              />
            </div>
             <div>
              <label className="block text-gray-800 font-bold mb-2">Data de Nascimento</label>
              <input 
                type="date" 
                value={formData.birthdate}
                onChange={e => handleInputChange('birthdate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900"
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" /> Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['PIX', 'Débito', 'Crédito', 'Dinheiro'].map(method => (
                <button 
                  key={method} 
                  type="button" 
                  onClick={() => handleInputChange('paymentMethod', method)}
                  className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${
                    formData.paymentMethod === method 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.clientName || !formData.serviceId || !formData.date || !formData.time}
            className="w-full bg-primary text-white font-bold py-4 px-6 rounded-lg text-lg uppercase hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Agendamento'}
          </button>
        </div>
      </div>
    </section>
  );
};
