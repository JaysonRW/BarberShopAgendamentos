import React from 'react';
import { LoyaltyClient } from '../../../types';
import { LoyaltyService } from '../../../firestoreService';
import { UserIcon, StarIcon, WhatsAppIcon } from '../../common/Icons';

interface LoyaltyTabProps {
  barberId: string;
  clients: LoyaltyClient[];
  isLoading: boolean;
  onRefresh: () => void;
  shopName: string;
}

export const LoyaltyTab: React.FC<LoyaltyTabProps> = ({ barberId, clients, isLoading, onRefresh, shopName }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedClient, setSelectedClient] = React.useState<LoyaltyClient | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = React.useState(false);
  const [updatingClientId, setUpdatingClientId] = React.useState<string | null>(null);

  const rewards = React.useMemo(() => [
    { stars: 5, description: 'Prêmio (Ex: Corte Grátis)' },
  ], []);

  const filteredClients = React.useMemo(() => (clients || []).filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientWhatsapp.includes(searchTerm)
  ), [clients, searchTerm]);
  
  const handleAddStar = async (client: LoyaltyClient) => {
    setUpdatingClientId(client.id);
    try {
      await LoyaltyService.addStar(barberId, client.clientWhatsapp);
      alert(`⭐ Estrela adicionada para ${client.clientName}!`);
      onRefresh();
    } catch (error) {
      console.error("Erro ao adicionar estrela:", error);
      alert("Erro ao adicionar estrela.");
    } finally {
      setUpdatingClientId(null);
    }
  };

  const handleShareProgress = (client: LoyaltyClient) => {
    const clientStars = (client.stars || 0) + 1; // Assume the star was just added for the message
    const clientGoal = client.goal || 5;
    const message = `Olá, ${client.clientName}! Agradecemos a sua preferência na ${shopName}. 💈\n\nVocê ganhou +1 estrela no nosso programa de fidelidade!\n\nSeu progresso atual é: ${clientStars} de ${clientGoal} estrelas para o próximo prêmio. 🌟\n\nContinue conosco!`;
    const whatsappUrl = `https://wa.me/${client.clientWhatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  const handleRedeem = async (client: LoyaltyClient) => {
    if (!client || !client.goal) return;
    
    setUpdatingClientId(client.id);
    try {
      await LoyaltyService.redeemStars(barberId, client.clientWhatsapp);
      alert(`✅ Prêmio resgatado com sucesso para ${client.clientName}! O saldo de estrelas foi atualizado.`);
      setIsRedeemModalOpen(false);
      onRefresh();
    } catch (error) {
        console.error("Erro ao resgatar prêmio:", error);
        alert("Erro ao resgatar prêmio.");
    } finally {
      setUpdatingClientId(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Programa de Fidelidade (Selos)</h2>

      <div className="bg-gray-800 rounded-lg p-6">
        <input
          type="text"
          placeholder="Buscar cliente por nome ou WhatsApp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white mb-6"
        />

        {isLoading ? (
          <p className="text-center py-8 text-gray-400">Carregando clientes...</p>
        ) : (
          <div>
            {filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => {
                  const clientGoal = client.goal || 5;
                  const clientStars = client.stars || 0;
                  const canRedeem = clientStars >= clientGoal;
                  const isUpdating = updatingClientId === client.id;

                  return (
                    <div key={client.id} className="bg-gray-700 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                           <div className="flex-shrink-0 w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                           </div>
                           <div>
                              <p className="font-bold text-lg text-white">{client.clientName}</p>
                              <p className="text-sm text-gray-400">{client.clientWhatsapp}</p>
                           </div>
                        </div>
                        
                        <div className="text-center my-4">
                          <p className="text-sm text-gray-400 mb-2">Cartão Fidelidade</p>
                          <div className="flex items-center justify-center gap-2">
                              {[...Array(clientGoal)].map((_, i) => (
                              <StarIcon key={i} className={`h-8 w-8 transition-colors ${i < clientStars ? 'text-yellow-400' : 'text-gray-600'}`} />
                              ))}
                          </div>
                          <p className="text-lg font-bold text-white mt-2">{clientStars} / {clientGoal}</p>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-md text-center h-20 flex flex-col justify-center">
                           {canRedeem ? (
                            <>
                              <p className="text-sm font-semibold text-green-400">Recompensa Disponível!</p>
                              <p className="text-xs text-gray-300">O cliente pode resgatar o prêmio.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-gray-300">Próxima Recompensa</p>
                              <p className="text-xs text-gray-400">Faltam {clientGoal - clientStars} estrelas</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-2">
                         <div className="flex gap-2">
                            <button
                                onClick={() => handleAddStar(client)}
                                disabled={canRedeem || isUpdating}
                                className="w-full bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isUpdating && !isRedeemModalOpen ? 'Adicionando...' : 'Adicionar Estrela'}
                            </button>
                            <button
                                onClick={() => handleShareProgress(client)}
                                disabled={isUpdating}
                                className="flex-shrink-0 bg-green-500 text-white p-2.5 rounded-lg hover:bg-green-600 transition duration-300 disabled:bg-gray-500"
                            >
                                <WhatsAppIcon className="h-5 w-5 m-0" />
                            </button>
                         </div>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setIsRedeemModalOpen(true);
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                          disabled={!canRedeem || isUpdating}
                        >
                          Resgatar Prêmio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400">Nenhum cliente encontrado.</p>
            )}
          </div>
        )}
      </div>

      {isRedeemModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-md m-4">
            <h3 className="text-2xl font-bold text-center mb-2">Resgatar Prêmio</h3>
            <p className="text-center text-gray-300 mb-1">Cliente: {selectedClient.clientName}</p>
            <p className="text-center text-lg font-bold text-yellow-400 mb-6">Saldo: {selectedClient.stars || 0} estrelas</p>
            
            <div className="space-y-4">
              {rewards.map(reward => (
                <div key={reward.stars} className={`p-4 rounded-lg flex justify-between items-center ${(selectedClient.stars || 0) >= (selectedClient.goal || 5) ? 'bg-gray-700' : 'bg-gray-700 opacity-50'}`}>
                  <div>
                    <p className="font-semibold">{reward.description}</p>
                    <p className="text-sm text-yellow-400">{selectedClient.goal || 5} estrelas</p>
                  </div>
                  <button
                    onClick={() => handleRedeem(selectedClient)}
                    disabled={(selectedClient.stars || 0) < (selectedClient.goal || 5) || updatingClientId === selectedClient.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {updatingClientId === selectedClient.id ? 'Resgatando...' : 'Resgatar'}
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setIsRedeemModalOpen(false)}
              className="mt-6 w-full bg-gray-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-gray-500 transition duration-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
