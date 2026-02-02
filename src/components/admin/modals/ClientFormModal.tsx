import React from 'react';
import { Client, ClientFormData } from '../../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientFormData, clientId?: string) => Promise<void>;
  client?: Client | null;
  isLoading: boolean;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, isLoading }) => {
  const [formData, setFormData] = React.useState<ClientFormData>({
    name: '',
    whatsapp: '',
    email: '',
    birthdate: '',
    tags: [],
    notes: '',
  });

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        birthdate: client.birthdate || '',
        tags: client.tags || [],
        notes: client.notes || '',
      });
    } else {
      setFormData({ name: '', whatsapp: '', email: '', birthdate: '', tags: [], notes: '' });
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) {
      alert('Nome e WhatsApp são obrigatórios.');
      return;
    }
    await onSave(formData, client?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-6">
          {client ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo *" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp (somente números) *" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email (opcional)" className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} placeholder="Data de Nascimento" className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
          </div>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações sobre o cliente..." rows={4} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button type="submit" disabled={isLoading} className="w-full md:w-auto flex-1 bg-red-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300 disabled:bg-gray-500">
              {isLoading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
            <button type="button" onClick={onClose} className="w-full md:w-auto bg-gray-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-gray-500 transition duration-300">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
