import React from 'react';
import { Service } from '../../../types';
import { ServiceService } from '../../../firestoreService';

interface ServicesTabProps {
  services: Service[];
  barberId: string;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  onDataUpdate: () => void;
}

const ServicesTab: React.FC<ServicesTabProps> = ({ 
  services, 
  barberId, 
  onEdit, 
  isEditing, 
  editData, 
  onSave, 
  onCancel, 
  onEditDataChange, 
  onDataUpdate 
}) => {
  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isEditing && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEditing]);

  const handleAddService = () => {
    console.log('Adicionar serviço clicado');
    onEdit('services', { name: '', price: 0, duration: 30 });
  };

  const handleEditService = (service: Service) => {
    console.log('Editar serviço clicado', service);
    onEdit('services', service);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Serviços</h2>
        <button
          type="button"
          onClick={handleAddService}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Adicionar Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm hover:shadow-md transition duration-200">
            <h3 className="text-lg font-semibold text-white">{service.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <p className="text-2xl font-bold text-primary">R$ {service.price.toFixed(2)}</p>
              {service.duration && (
                <span className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  ⏱ {service.duration} min
                </span>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="button"
                onClick={() => handleEditService(service)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition duration-300 font-medium"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Tem certeza que deseja deletar este serviço?')) {
                    try {
                      await ServiceService.delete(barberId, service.id);
                      alert('✅ Serviço deletado com sucesso!');
                      onDataUpdate();
                    } catch (error) {
                      console.error('Erro ao deletar serviço:', error);
                      alert('❌ Erro ao deletar serviço');
                    }
                  }
                }}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition duration-300 font-medium"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div ref={formRef} className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-600 shadow-xl ring-1 ring-gray-700">
          <h3 className="text-xl font-bold mb-6 flex items-center text-white border-b border-gray-700 pb-2">
            {editData.id ? '✏️ Editar Serviço' : '➕ Novo Serviço'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço</label>
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => onEditDataChange({...editData, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                placeholder="Ex: Corte Degrade"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.price || ''}
                    onChange={(e) => onEditDataChange({...editData, price: parseFloat(e.target.value)})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duração (minutos)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">⏱</span>
                  <input
                    type="number"
                    step="5"
                    value={editData.duration || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onEditDataChange({...editData, duration: val === '' ? '' : parseInt(val)})
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="Ex: 30"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tempo estimado para agendamento.</p>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-6 border-t border-gray-700 mt-4">
              <button
                type="button"
                onClick={onSave}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-bold shadow-lg hover:shadow-green-500/20"
              >
                Salvar Serviço
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-300 font-medium"
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

export default ServicesTab;
