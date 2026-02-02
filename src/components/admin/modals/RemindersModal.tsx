import React from 'react';
import { Appointment } from '../../../types';
import { AppointmentService } from '../../../firestoreService';
import { WhatsAppIcon } from '../../common/Icons';

interface RemindersModalProps {
  reminders: Appointment[];
  barberId: string;
  shopName: string;
  onClose: () => void;
  onReminderSent: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ 
  reminders, barberId, shopName, onClose, onReminderSent 
}) => {
  const [sentIds, setSentIds] = React.useState<string[]>([]);

  const handleSend = async (reminder: Appointment) => {
    // Mensagem amigável para o cliente
    const message = `Olá, ${reminder.clientName}! Passando para lembrar do seu horário na ${shopName} amanhã, às ${reminder.time}. Mal podemos esperar para te ver!`;
    const whatsappUrl = `https://wa.me/${reminder.clientWhatsapp}?text=${encodeURIComponent(message)}`;
    
    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
    
    // Marca como enviado no Firestore para não notificar novamente
    await AppointmentService.markReminderAsSent(barberId, reminder.id);
    
    // Atualiza a UI localmente para dar feedback imediato
    setSentIds(prev => [...prev, reminder.id]);
  };
  
  const handleClose = () => {
    if (sentIds.length > 0) {
      onReminderSent(); // Recarrega os dados se algum lembrete foi enviado
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-6">Lembretes de 24h Pendentes</h2>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {reminders.map(reminder => {
            const isSent = sentIds.includes(reminder.id);
            return (
              <div key={reminder.id} className={`p-4 rounded-lg flex justify-between items-center ${isSent ? 'bg-gray-700' : 'bg-gray-600'}`}>
                <div>
                  <p className="font-bold text-white">{reminder.clientName}</p>
                  <p className="text-sm text-gray-300">Amanhã às {reminder.time} - {reminder.service?.name || 'Serviço'}</p>
                </div>
                {isSent ? (
                  <span className="text-green-400 font-bold">Enviado ✔️</span>
                ) : (
                  <button
                    onClick={() => handleSend(reminder)}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center gap-2"
                  >
                    <WhatsAppIcon className="h-5 w-5 m-0" /> Enviar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClose}
          className="mt-6 w-full bg-gray-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-gray-500 transition duration-300"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
