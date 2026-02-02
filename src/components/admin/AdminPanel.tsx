import * as React from 'react';
import { 
  DashboardIcon, 
  ShopIcon, 
  VisualsIcon, 
  ChartBarIcon, 
  UsersIcon, 
  ScissorsIcon, 
  TagIcon, 
  GalleryIcon, 
  CalendarIcon, 
  StarIcon, 
  LogoutIcon 
} from '../common/Icons';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ThemeStyles } from '../common/ThemeStyles';
import { 
  DashboardTab, 
  ProfileTab, 
  ServicesTab, 
  PromotionsTab, 
  GalleryTab, 
  AppointmentsTab, 
  LoyaltyTab, 
  ClientsTab, 
  VisualsTab, 
  FinancialsTab 
} from './tabs';
import { 
  BarberService, 
  AppointmentService, 
  LoyaltyService, 
  ClientService, 
  ServiceService, 
  PromotionService, 
  GalleryService, 
  FinancialService 
} from '../../firestoreService';
import { calculateFinancialsFromAppointments } from '../../utils/financials';
import type { 
  BarberData, 
  Appointment, 
  LoyaltyClient, 
  Client 
} from '../../types';

interface AdminPanelProps {
  barberData: BarberData;
  onLogout: () => void;
  onDataUpdate: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ barberData, onLogout, onDataUpdate }) => {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'profile' | 'visuals' | 'services' | 'promotions' | 'gallery' | 'appointments' | 'loyalty' | 'clients' | 'financials'>('dashboard');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<any>({});
  
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | undefined>(undefined);

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = React.useState(true);
  const [loyaltyClients, setLoyaltyClients] = React.useState<LoyaltyClient[]>([]);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = React.useState(true);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = React.useState(true);

  const loadAppointments = React.useCallback(async () => {
    if (!barberData.id) return;
    setIsLoadingAppointments(true);
    try {
      const appts = await AppointmentService.getAll(barberData.id);
      setAppointments(appts);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      alert("Não foi possível carregar os agendamentos. Verifique as permissões e sua conexão.");
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [barberData.id]);

  const loadLoyaltyData = React.useCallback(async () => {
    if (!barberData.id) return;
    setIsLoyaltyLoading(true);
    try {
      const clients = await LoyaltyService.getClients(barberData.id);
      setLoyaltyClients(clients);
    } catch (error) {
      console.error("Erro ao carregar fidelidade:", error);
    } finally {
      setIsLoyaltyLoading(false);
    }
  }, [barberData.id]);

  const loadClients = React.useCallback(async () => {
    if (!barberData.id) return;
    setIsLoadingClients(true);
    try {
      const clientsData = await ClientService.getAll(barberData.id);
      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoadingClients(false);
    }
  }, [barberData.id]);

  React.useEffect(() => {
    loadAppointments();
    loadLoyaltyData();
    loadClients();
  }, [loadAppointments, loadLoyaltyData, loadClients]);

  const fullBarberData = React.useMemo(() => ({
    ...barberData,
    appointments,
  }), [barberData, appointments]);
  
  const handleAdminDataUpdate = React.useCallback(() => {
    onDataUpdate();
    loadAppointments();
    loadLoyaltyData();
    loadClients();
  }, [onDataUpdate, loadAppointments, loadLoyaltyData, loadClients]);

  const financialSummary = React.useMemo(() => {
    return calculateFinancialsFromAppointments(appointments);
  }, [appointments]);

  const handleEdit = (section: string, data: any) => {
    setEditData({ ...data });
    setUploadFile(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsUploading(true);
    setUploadProgress(uploadFile ? 0 : undefined);
    try {
      let finalEditData = { ...editData };

      if (uploadFile) {
        const folder = activeTab === 'profile' ? 'logos' : 'gallery';
        // Note: GalleryService.uploadImage might need to be moved to a shared StorageService if used elsewhere
        const newUrl = await GalleryService.uploadImage(
          barberData.id,
          uploadFile, 
          folder
        );

        if (activeTab === 'profile') finalEditData.logoUrl = newUrl;
        if (activeTab === 'gallery') finalEditData.src = newUrl;
        if (activeTab === 'gallery') finalEditData.url = newUrl; // Support both naming conventions
      }
      
      let success = false;
      let message = '';
      
      switch (activeTab) {
        case 'profile':
          await BarberService.updateProfile(barberData.id, finalEditData);
          success = true;
          message = 'Perfil';
          break;
        case 'services':
          if (finalEditData.id) {
            await ServiceService.update(barberData.id, finalEditData.id, finalEditData);
            success = true;
          } else {
            await ServiceService.create(barberData.id, finalEditData);
            success = true;
          }
          message = 'Serviço';
          break;
        case 'promotions':
          if (finalEditData.id) {
            await PromotionService.update(barberData.id, finalEditData.id, finalEditData);
            success = true;
          } else {
            await PromotionService.create(barberData.id, finalEditData);
            success = true;
          }
          message = 'Promoção';
          break;
        case 'gallery':
          // Adaptar campos para GalleryImage
          const galleryData = {
            url: finalEditData.src || finalEditData.url,
            description: finalEditData.alt || finalEditData.description || '',
            ...finalEditData
          };
          if (finalEditData.id) {
            await GalleryService.update(barberData.id, finalEditData.id, galleryData);
            success = true;
          } else {
            await GalleryService.add(barberData.id, galleryData);
            success = true;
          }
          message = 'Imagem';
          break;
      }
      
      if (success) {
        alert(`✅ ${message} salvo com sucesso!`);
      } else {
        throw new Error(`Erro ao salvar ${message}`);
      }
      
      setIsEditing(false);
      handleAdminDataUpdate();
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      let userMessage = error.message || 'Ocorreu um erro ao salvar.';
      if (error && error.code === 'storage/unauthorized') {
        userMessage = 'Erro de permissão ao salvar a imagem. Verifique as regras do Storage.';
      }
      alert(userMessage);
    } finally {
      setIsUploading(false);
      setUploadFile(null);
      setUploadProgress(undefined);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setUploadFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ThemeStyles theme={barberData.profile.theme} />
      {isUploading && <LoadingSpinner message="Salvando dados..." progress={uploadProgress} />}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <span className="ml-4 text-sm text-gray-400">{barberData.profile.shopName}</span>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
            >
              <LogoutIcon className="h-5 w-5 mr-2" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="h-5 w-5" /> },
                { id: 'profile', label: 'Perfil da Barbearia', icon: <ShopIcon className="h-5 w-5" /> },
                { id: 'visuals', label: 'Personalização Visual', icon: <VisualsIcon className="h-5 w-5" /> },
                { id: 'financials', label: 'Financeiro', icon: <ChartBarIcon className="h-5 w-5" /> },
                { id: 'clients', label: 'Clientes', icon: <UsersIcon className="h-5 w-5" /> },
                { id: 'services', label: 'Serviços', icon: <ScissorsIcon className="h-5 w-5" /> },
                { id: 'promotions', label: 'Promoções', icon: <TagIcon className="h-5 w-5" /> },
                { id: 'gallery', label: 'Galeria', icon: <GalleryIcon className="h-5 w-5" /> },
                { id: 'appointments', label: 'Agendamentos', icon: <CalendarIcon className="h-5 w-5" /> },
                { id: 'loyalty', label: 'Fidelidade', icon: <StarIcon className="h-5 w-5" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            {isLoadingAppointments || isLoadingClients ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner message="Carregando dados do painel..." />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardTab 
                    barberData={fullBarberData} 
                    financialSummary={financialSummary}
                  />
                )}
                
                {activeTab === 'profile' && (
                  <ProfileTab 
                    barberData={barberData} 
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    editData={editData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onEditDataChange={setEditData}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    isUploading={isUploading}
                  />
                )}
                
                {activeTab === 'visuals' && (
                  <VisualsTab
                    barberData={barberData}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}

                {activeTab === 'financials' && (
                  <FinancialsTab
                    barberId={barberData.id}
                    appointments={appointments}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}

                 {activeTab === 'clients' && (
                  <ClientsTab
                    barberId={barberData.id}
                    clients={clients}
                    isLoading={isLoadingClients}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}
                
                {activeTab === 'services' && (
                  <ServicesTab 
                    services={barberData.services}
                    barberId={barberData.id}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    editData={editData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onEditDataChange={setEditData}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}
                
                {activeTab === 'promotions' && (
                  <PromotionsTab 
                    promotions={barberData.promotions}
                    barberId={barberData.id}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    editData={editData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onEditDataChange={setEditData}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}
                
                {activeTab === 'gallery' && (
                  <GalleryTab 
                    images={barberData.gallery}
                    barberId={barberData.id}
                    onEdit={handleEdit}
                    isEditing={isEditing}
                    editData={editData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onEditDataChange={setEditData}
                    onDataUpdate={handleAdminDataUpdate}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    isUploading={isUploading}
                  />
                )}
                
                {activeTab === 'appointments' && (
                  <AppointmentsTab 
                    appointments={appointments}
                    barberId={barberData.id}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}

                {activeTab === 'loyalty' && (
                  <LoyaltyTab 
                    loyaltyClients={loyaltyClients}
                    barberId={barberData.id}
                    isLoading={isLoyaltyLoading}
                    onDataUpdate={handleAdminDataUpdate}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
