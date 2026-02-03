import React from 'react';
import { Appointment, Transaction, Financials } from '../../../types';
import { FinancialService } from '../../../firestoreService';
import { ExpenseModal } from '../modals/ExpenseModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { SyncIcon, PlusIcon, CalendarIcon } from '../../common/Icons';

interface FinancialsTabProps {
  barberId: string;
  appointments: Appointment[];
  onDataUpdate: () => void;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ barberId, onDataUpdate }) => {
  type Period = 'week' | 'month' | 'quarter' | 'year';
  const [period, setPeriod] = React.useState<Period>('month');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [transactionFilter, setTransactionFilter] = React.useState<'Todas' | 'Receitas' | 'Despesas'>('Todas');

  const { startDate, endDate } = React.useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (period) {
      case 'week':
        // Início da semana (Domingo)
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        // Fim da semana (Sábado)
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1); // Dia 1 do mês atual
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Último dia do mês atual
        break;
      case 'quarter':
        const currentQuarter = Math.floor(start.getMonth() / 3);
        start.setMonth(currentQuarter * 3, 1); // Dia 1 do primeiro mês do trimestre
        end = new Date(start.getFullYear(), start.getMonth() + 3, 0); // Último dia do último mês do trimestre
        break;
      case 'year':
        start.setMonth(0, 1); // 1 de Janeiro
        end.setMonth(11, 31); // 31 de Dezembro
        break;
    }
    
    // Ajustar horas para garantir cobertura total do dia na comparação (embora a query use YYYY-MM-DD)
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { startDate: start, endDate: end };
  }, [period]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FinancialService.getTransactions(barberId, startDate, endDate);
      setTransactions(data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      alert("Não foi possível carregar os dados financeiros. O Firebase pode precisar de um índice. Verifique o console de logs (F12) para um link de criação do índice.");
    } finally {
      setIsLoading(false);
    }
  }, [barberId, startDate, endDate]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleDataUpdateAndReload = () => {
      onDataUpdate();
      loadData();
  }

  const financials: Financials = React.useMemo(() => {
    const summary: Financials = {
      totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0,
      revenueByPaymentMethod: {}, flow: [], pendingRevenue: 0
    };

    (transactions || []).forEach(t => {
      if (t.type === 'receita') {
        summary.totalRevenue += t.amount;
        if (t.paymentMethod) {
          summary.revenueByPaymentMethod[t.paymentMethod] = (summary.revenueByPaymentMethod[t.paymentMethod] || 0) + t.amount;
        }
      } else {
        summary.totalExpenses += t.amount;
      }
    });

    summary.netProfit = summary.totalRevenue - summary.totalExpenses;
    summary.profitMargin = summary.totalRevenue > 0 ? (summary.netProfit / summary.totalRevenue) * 100 : 0;
    return summary;
  }, [transactions]);
  
  const filteredTransactions = React.useMemo(() => {
    const type = transactionFilter === 'Receitas' ? 'receita' : 'despesa';
    const sorted = (transactions || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (transactionFilter === 'Todas') return sorted;
    return sorted.filter(t => t.type === type);
  }, [transactions, transactionFilter]);

  const handleSaveExpense = async (expenseData: Omit<Transaction, 'id' | 'barberId' | 'createdAt' | 'type'>) => {
    setIsSaving(true);
    try {
      await FinancialService.addTransaction(barberId, { 
        ...expenseData, 
        type: 'despesa',
        barberId,
        createdAt: new Date()
      });
      alert('Despesa adicionada com sucesso!');
      handleDataUpdateAndReload();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Ocorreu um erro ao salvar a despesa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!confirm('Isso irá verificar os agendamentos confirmados no período selecionado e criar transações de receita para aqueles que ainda não foram registrados. Deseja continuar?')) {
        return;
    }
    setIsSyncing(true);
    try {
        const newTransactionsCount = await FinancialService.syncFromAppointments(barberId, startDate, endDate);
        if (newTransactionsCount > 0) {
            alert(`Sincronização concluída! ${newTransactionsCount} nova(s) transação(ões) de agendamento foram adicionadas.`);
            loadData(); // Recarrega os dados financeiros
        } else {
            alert('Sincronização concluída. Nenhum agendamento novo para registrar.');
        }
    } catch (error) {
        console.error("Erro ao sincronizar agendamentos:", error);
        alert("Ocorreu um erro durante a sincronização. O Firebase pode precisar de um índice. Verifique o console para mais detalhes.");
    } finally {
        setIsSyncing(false);
    }
  };
  
  const summaryCards = [
    { title: 'Receita Total', value: `R$ ${financials.totalRevenue.toFixed(2)}`, color: 'bg-green-500' },
    { title: 'Despesas', value: `R$ ${financials.totalExpenses.toFixed(2)}`, color: 'bg-red-500' },
    { title: 'Lucro Líquido', value: `R$ ${financials.netProfit.toFixed(2)}`, color: 'bg-blue-500', isNegative: financials.netProfit < 0 },
    { title: 'Margem de Lucro', value: `${financials.profitMargin.toFixed(0)}%`, color: 'bg-purple-500', isNegative: financials.profitMargin < 0 }
  ];

  if (isLoading) return <LoadingSpinner message="Carregando dados financeiros..." />;

  return (
    <div className="space-y-6">
      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} isLoading={isSaving} />

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Financeiro</h2>
          <p className="text-gray-400">Visão geral das suas finanças.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSync} 
                disabled={isSyncing} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-500"
                title="Sincronizar agendamentos confirmados que ainda não viraram transação de receita."
            >
                <SyncIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}/> {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary-dark transition-colors">
                <PlusIcon className="h-4 w-4"/> Nova Despesa
            </button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-2 rounded-lg flex flex-wrap gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full sm:w-auto flex-1 ${period === p ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  { {week: 'Semana', month: 'Mês', quarter: 'Trimestre', year: 'Ano'}[p] }
              </button>
          ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
            <div key={card.title} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                <span className={`flex-shrink-0 w-3 h-3 rounded-full ${card.color}`}></span>
                <div>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.isNegative ? 'text-red-400' : 'text-white'}`}>{card.value}</p>
                </div>
            </div>
        ))}
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-2xl font-anton text-white tracking-wider uppercase">Transações</h3>
              <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                  {(['Todas', 'Receitas', 'Despesas'] as const).map(f => (
                      <button key={f} onClick={() => setTransactionFilter(f)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-full sm:w-auto flex-1 ${transactionFilter === f ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                          {f}
                      </button>
                  ))}
              </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <div key={t.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/50 p-3 rounded-md gap-2">
                      <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{t.description}</p>
                          <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {t.paymentMethod || t.category}</p>
                      </div>
                      <p className={`font-bold text-lg whitespace-nowrap ${t.type === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </p>
                  </div>
              )) : (
                  <div className="text-center py-10 text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Nenhuma transação neste período</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
