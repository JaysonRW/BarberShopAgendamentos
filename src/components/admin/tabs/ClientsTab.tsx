import React from 'react';
import { Client, ClientFormData, ClientStats } from '../../../types';
import { ClientService } from '../../../firestoreService';
import { ClientFormModal } from '../modals/ClientFormModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface ClientsTabProps {
  barberId: string;
  clients: Client[];
  isLoading: boolean;
  onDataUpdate: () => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ barberId, clients, isLoading, onDataUpdate }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'lastVisit' | 'totalVisits'>('name');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const clientStats: ClientStats = React.useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newThisMonth = (clients || []).filter(c => c.createdAt && c.createdAt.toDate() >= firstDayOfMonth).length;
    const activeClients = (clients || []).filter(c => c.totalVisits > 0).length;
    const totalVisits = (clients || []).reduce((sum, c) => sum + c.totalVisits, 0);
    const avgVisits = activeClients > 0 ? totalVisits / activeClients : 0;

    return {
      totalClients: (clients || []).length,
      newThisMonth,
      activeClients,
      avgVisits: parseFloat(avgVisits.toFixed(1)),
    };
  }, [clients]);

  const filteredAndSortedClients = React.useMemo(() => {
    return (clients || [])
      .filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.whatsapp.includes(searchTerm)
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'totalVisits') return b.totalVisits - a.totalVisits;
        if (sortBy === 'lastVisit') {
          const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [clients, searchTerm, sortBy]);

  const handleOpenModal = (client: Client | null = null) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = async (formData: ClientFormData, clientId?: string) => {
    setIsSaving(true);
    try {
      if (clientId) {
        // Update
        await ClientService.update(barberId, clientId, formData);
        alert('Cliente atualizado com sucesso!');
      } else {
        // Create
        await ClientService.create(barberId, formData);
        alert('Cliente criado com sucesso!');
      }
      onDataUpdate();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Ocorreu um erro ao salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        await ClientService.delete(barberId, clientId);
        alert('Cliente excluído com sucesso.');
        onDataUpdate();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Ocorreu um erro ao excluir o cliente.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestão de Clientes</h2>
        <button onClick={() => handleOpenModal()} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300">
          Adicionar Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Clientes</p><p className="text-2xl font-bold">{clientStats.totalClients}</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Novos este Mês</p><p className="text-2xl font-bold">{clientStats.newThisMonth}</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Clientes Ativos</p><p className="text-2xl font-bold">{clientStats.activeClients}</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Média de Visitas</p><p className="text-2xl font-bold">{clientStats.avgVisits}</p></div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <input type="text" placeholder="Buscar por nome ou WhatsApp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="name">Ordenar por Nome</option>
          <option value="lastVisit">Ordenar por Recentes</option>
          <option value="totalVisits">Ordenar por Mais Visitas</option>
        </select>
      </div>

      {/* Client List */}
      {isLoading ? <LoadingSpinner message="Carregando clientes..." /> : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4 text-center">Visitas</th>
                  <th className="p-4">Última Visita</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClients.map(client => (
                  <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4 font-semibold">{client.name}</td>
                    <td className="p-4 text-gray-300">{client.whatsapp}</td>
                    <td className="p-4 text-center text-lg font-bold">{client.totalVisits}</td>
                    <td className="p-4 text-gray-300">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(client)} className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700">Editar</button>
                      <button onClick={() => handleDeleteClient(client.id)} className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ClientFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        client={editingClient}
        isLoading={isSaving}
      />
    </div>
  );
};
