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
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold">Serviços</h2>
      <button
        onClick={() => onEdit('services', { name: '', price: 0 })}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
      >
        Adicionar Serviço
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map(service => (
        <div key={service.id} className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold">{service.name}</h3>
          <p className="text-2xl font-bold text-primary">R$ {service.price.toFixed(2)}</p>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => onEdit('services', service)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition duration-300"
            >
              Editar
            </button>
            <button
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
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition duration-300"
            >
              Deletar
            </button>
          </div>
        </div>
      ))}
    </div>

    {isEditing && (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Editar Serviço</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço</label>
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => onEditDataChange({...editData, name: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preço</label>
            <input
              type="number"
              step="0.01"
              value={editData.price || ''}
              onChange={(e) => onEditDataChange({...editData, price: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={onSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
            >
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ServicesTab;
