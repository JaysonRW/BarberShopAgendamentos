import React from 'react';
import { Transaction } from '../../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Transaction, 'id' | 'barberId' | 'createdAt' | 'type'>) => Promise<void>;
  isLoading: boolean;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = React.useState({
    description: '',
    amount: '',
    category: 'Outros',
    paymentMethod: 'Dinheiro',
    date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.date) {
      alert('Todos os campos são obrigatórios.');
      return;
    }
    await onSave({ ...formData, amount: parseFloat(formData.amount) });
    setFormData({ description: '', amount: '', category: 'Outros', paymentMethod: 'Dinheiro', date: new Date().toISOString().split('T')[0] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Nova Despesa</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descrição (ex: Aluguel, Compra de Produtos)" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} placeholder="Valor (R$)" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Aluguel</option>
              <option>Produtos</option>
              <option>Marketing</option>
              <option>Salários</option>
              <option>Contas (Água, Luz, etc.)</option>
              <option>Outros</option>
            </select>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Dinheiro</option>
              <option>PIX</option>
              <option>Débito</option>
              <option>Crédito</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button type="submit" disabled={isLoading} className="w-full md:w-auto flex-1 bg-gradient-to-r from-purple-600 to-blue-600 font-bold py-3 px-6 rounded-lg uppercase hover:opacity-90 transition duration-300 disabled:bg-gray-500">
              {isLoading ? 'Salvando...' : 'Salvar Despesa'}
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
