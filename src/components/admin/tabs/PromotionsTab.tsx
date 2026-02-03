import React from 'react';
import { Promotion } from '../../../types';
import { PromotionService } from '../../../firestoreService';

interface PromotionsTabProps {
  promotions: Promotion[];
  barberId: string;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  onDataUpdate: () => void;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ 
  promotions, barberId, onEdit, isEditing, editData, onSave, onCancel, onEditDataChange, onDataUpdate 
}) => {
  
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getInitialEditData = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { 
      title: '', 
      description: '', 
      discount: 0, 
      startDate: today, 
      endDate: nextWeek 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Promoções</h2>
        <button
          onClick={() => onEdit('promotions', getInitialEditData())}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        >
          Nova Promoção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map(promo => {
            // Compatibilidade com dados antigos que usavam validUntil
            const endDate = promo.endDate || (promo as any).validUntil;
            const startDate = promo.startDate;

            return (
            <div key={promo.id} className="bg-gray-800 rounded-lg p-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold">{promo.title}</h3>
              <p className="text-gray-300 mt-2">{promo.description}</p>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-400">Desconto: {promo.discount}%</p>
                  <p className="text-sm text-gray-400">
                    {startDate ? `De: ${formatDate(startDate)}` : ''} 
                    {startDate && endDate ? ' - ' : ''}
                    Até: {formatDate(endDate)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Deletar promoção?')) {
                      await PromotionService.delete(barberId, promo.id);
                      onDataUpdate();
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isEditing && (
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Nova Promoção</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Título"
              value={editData.title || ''}
              onChange={(e) => onEditDataChange({...editData, title: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <textarea
              placeholder="Descrição"
              value={editData.description || ''}
              onChange={(e) => onEditDataChange({...editData, description: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">Desconto (%)</label>
                  <input
                    type="number"
                    placeholder="Desconto (%)"
                    value={editData.discount || ''}
                    onChange={(e) => onEditDataChange({...editData, discount: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">Data Inicial</label>
                  <input
                    type="date"
                    value={editData.startDate || ''}
                    onChange={(e) => onEditDataChange({...editData, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">Data Final</label>
                  <input
                    type="date"
                    value={editData.endDate || ''}
                    onChange={(e) => onEditDataChange({...editData, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
              </div>
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
};
