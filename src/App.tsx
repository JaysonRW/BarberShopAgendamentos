

import React, { useState, useCallback, useMemo, ChangeEvent, useEffect, useRef } from 'react';
import type { Promotion, GalleryImage, Service, Appointment, LoyaltyClient } from './types';
import { FirestoreService, BarberData } from './firestoreService';
import { auth } from './firebaseConfig';
import { testFirebaseConnection, testFirestoreWrite, testFirestoreRead } from './firebaseTest';
import { APP_CONFIG, getBarberSlugFromUrl, debugLog } from './config';
import { populateTestData, createTestBarber } from './populateTestData';


//Adicione estas funções no início do seu App.tsx, logo após os imports

// === SISTEMA DE ROTEAMENTO MELHORADO ===
const useRouting = () => {
  const [currentRoute, setCurrentRoute] = useState<{
    type: 'barber' | 'admin' | 'notfound';
    slug?: string;
  } | null>(null);

  useEffect(() => {
    const determineRoute = () => {
      const path = window.location.pathname;
      const slug = getBarberSlugFromUrl();
      
      if (path === '/' || path === '') {
        setCurrentRoute({ type: 'barber', slug: 'nobresdobairro' });
        return;
      }
      
      if (slug) {
        if (path.includes('/admin')) {
          setCurrentRoute({ type: 'admin', slug });
        } else {
          setCurrentRoute({ type: 'barber', slug });
        }
      } else {
        setCurrentRoute({ type: 'notfound' });
      }
    };

    determineRoute();
    
    const handlePopState = () => {
      determineRoute();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return currentRoute;
};

// Helper function to calculate financial summary from appointments
const calculateFinancials = (appointments: (Appointment & { servicePrice?: number })[]) => {
  let confirmedTotal = 0;
  let pendingTotal = 0;

  appointments.forEach(appt => {
    // Use servicePrice if available (for historical accuracy), fallback to service.price
    const price = appt.servicePrice ?? appt.service?.price ?? 0;
    
    if (appt.status === 'Confirmado') {
      confirmedTotal += price;
    } else if (appt.status === 'Pendente') {
      pendingTotal += price;
    }
  });

  return {
    confirmedTotal,
    pendingTotal,
    totalRevenue: confirmedTotal + pendingTotal
  };
};


// === COMPONENTE APP PRINCIPAL REATORADO ===
const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [barberData, setBarberData] = useState<BarberData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(() => auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');

  const currentRoute = useRouting();

  const handleFirestoreError = useCallback((error: any) => {
    console.error('Firestore Error:', error);
    if (error.code === 'unavailable') {
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.CONNECTION_ERROR);
    } else {
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.FIREBASE_ERROR);
    }
    setBarberData(null);
  }, []);

  const loadBarberData = useCallback(async (barberId: string | null) => {
    if (!barberId) {
      setBarberData(null);
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
      return;
    }
    
    try {
      const data = await FirestoreService.loadBarberData(barberId);
      if (data) {
        setBarberData(data);
        setErrorMessage(null);
      } else {
        setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
      }
    } catch (error) {
      handleFirestoreError(error);
    }
  }, [handleFirestoreError]);

  // Efeito para gerenciar o estado de autenticação
  useEffect(() => {
    console.log('🔒 Auth effect setup');
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
      console.log('🔑 Auth state changed:', currentUser ? currentUser.uid : 'logged out');
    });
    return () => unsubscribe();
  }, []);

  // Efeito para carregar os dados com base na rota e no usuário
  useEffect(() => {
    const initializeApp = async () => {
      if (!currentRoute || isAuthLoading) {
        console.log('⏳ Aguardando rota ou autenticação...');
        return;
      }
      
      console.log('🚀 Inicializando aplicação com rota:', currentRoute, 'e usuário:', user?.uid);
      setLoading(true);
      setErrorMessage(null);
      
      try {
        const isConnected = await testFirebaseConnection();
        if (!isConnected) {
          console.error('❌ Falha na conexão com Firebase');
          setErrorMessage(APP_CONFIG.ERROR_MESSAGES.CONNECTION_ERROR);
          setLoading(false);
          return;
        }

        if (currentRoute.type === 'admin') {
          if (user) {
            const barberId = await FirestoreService.findBarberByUserId(user.uid);
            if (barberId) {
              await loadBarberData(barberId);
              setView('admin');
            } else {
              setErrorMessage('Você não tem permissão para acessar esta área.');
            }
          } else {
            // Não logado tentando acessar admin, carrega a visão do cliente por trás
            if (currentRoute.slug) {
              const barberId = await FirestoreService.findBarberBySlug(currentRoute.slug);
              await loadBarberData(barberId);
            }
            setView('client');
          }
        } else if (currentRoute.type === 'barber') {
          setView('client');
          if (currentRoute.slug) {
            const barberId = await FirestoreService.findBarberBySlug(currentRoute.slug);
            await loadBarberData(barberId);
          } else {
             setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
          }
        } else if (currentRoute.type === 'notfound') {
          setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        handleFirestoreError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [currentRoute, user, isAuthLoading, loadBarberData, handleFirestoreError]);
  
  // Handlers
  const handleAdminAreaClick = () => {
    if (user && view === 'admin') {
       // Se já está na visão de admin, não faz nada
       return;
    }
    if (user) {
      setView('admin');
    } else {
      setLoginError('');
      setShowLoginModal(true);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError('');
      await auth.signInWithEmailAndPassword(email, password);
      setShowLoginModal(false);
      // onAuthStateChanged irá lidar com o resto
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Email ou senha inválidos. Tente novamente.');
    }
  };
  
  const handleSignUp = async (data: SignUpData) => {
    try {
      setLoginError('');
      const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.pass);
      const user = userCredential.user;
  
      if (user) {
        const barberProfileData = {
          shopName: data.shopName,
          location: data.location,
          whatsappNumber: data.whatsappNumber,
          email: data.email,
        };
        const barberId = await FirestoreService.createNewBarber(user.uid, barberProfileData);
  
        if (barberId) {
          setShowLoginModal(false); // Sucesso, o onAuthStateChanged fará o resto
        } else {
          await user.delete();
          setLoginError('Erro ao criar o perfil da barbearia. Tente novamente.');
        }
      } else {
        throw new Error('Usuário não foi criado no Firebase Auth.');
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError('Este email já está em uso por outra conta.');
      } else if (error.code === 'auth/weak-password') {
        setLoginError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setLoginError('Ocorreu um erro ao criar a conta. Verifique os dados e tente novamente.');
      }
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setView('client');
    // A mudança de 'user' no onAuthStateChanged vai recarregar os dados corretos.
  };

  const handleBookingSuccess = () => {
    if (barberData) {
      loadBarberData(barberData.id);
    }
  };

  if (loading || isAuthLoading || !currentRoute) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (errorMessage) {
    return <ConnectionError message={errorMessage} />;
  }

  if (!barberData) {
    return <LoadingSpinner message="Carregando dados da barbearia..." />;
  }
  
  if (view === 'admin' && user) {
     return (
      <AdminPanel 
        barberData={barberData} 
        onLogout={handleLogout}
        onDataUpdate={() => loadBarberData(barberData.id)}
      />
    );
  }

  return (
    <div className="bg-white">
      <DebugPanel 
        user={user}
        barberData={barberData}
        view={view}
        useMockData={false} // Simplificado, já que o fallback é por erro
        onRefreshData={() => barberData && loadBarberData(barberData.id)}
        onSetUser={setUser}
        onSetView={setView}
      />
      
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          error={loginError}
          clearError={() => setLoginError('')}
        />
      )}
      
      <Header 
        onAdminClick={handleAdminAreaClick} 
        logoUrl={barberData.profile.logoUrl} 
        shopName={barberData.profile.shopName}
      />
      
      <main>
        <Hero shopName={barberData.profile.shopName} />
        <Promotions promotions={barberData.promotions} />
        <Gallery images={barberData.galleryImages} />
        <BookingForm
          services={barberData.services}
          availability={barberData.availability}
          barberData={barberData}
          onBookingSuccess={handleBookingSuccess}
        />
      </main>
      
      <Footer 
        shopName={barberData.profile.shopName} 
        location={barberData.profile.location} 
      />
    </div>
  );
};



// --- Helper para rolagem suave ---
const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Função para obter slug da URL agora está em config.ts

// === ÍCONES SVG (reutilizáveis) ===
const Icon = ({ path, className = "h-5 w-5" }: { path: string, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" />;
const CreditCardIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2h2v2H6V6zm4 0h2v2h-2V6zM6 9h2v2H6V9zm4 0h2v2h-2V9z" />;
const MapPinIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />;
const ChevronLeftIcon = ({ className = "h-6 w-6" }) => <Icon className={className} path="M15 19l-7-7 7-7" />;
const ChevronRightIcon = ({ className = "h-6 w-6" }) => <Icon className={className} path="M5 19l7-7-7-7" />;
const UploadIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 12a1 1 0 011 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 112 0v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3a1 1 0 011-1zm5-10a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 10.586V3a1 1 0 011-1z" />;

// Ícones específicos
const WhatsAppIcon = ({className = "h-5 w-5 mr-2"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.3 2.2C5.7 2.2 2 5.9 2 10.5c0 1.6.4 3.1 1.3 4.4L2 20l5.2-1.3c1.3.8 2.8 1.2 4.4 1.2 4.6 0 8.3-3.7 8.3-8.3S14.9 2.2 10.3 2.2zM10.3 18.1c-1.4 0-2.8-.4-4-1.2l-.3-.2-3 .8.8-2.9-.2-.3c-.8-1.2-1.3-2.7-1.3-4.2 0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5zm3.2-4.9c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1s-.5.6-.6.7c-.1.1-.2.2-.4.1-.2 0-.8-.3-1.5-.9s-1.1-1.3-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1 0-.3-.1-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3s-.7.7-.7 1.6.7 1.9 1.4 2.6c1.1 1.1 2.1 1.7 3.3 1.7.2 0 .4 0 .6-.1.6-.2 1.1-.7 1.2-1.3.1-.6.1-1.1 0-1.2-.1-.1-.3-.2-.5-.3z" /></svg>;
const LogoutIcon = ({className = "h-5 w-5 mr-2"}) => <Icon className={className} path="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />;
const UserIcon = ({className = "h-6 w-6"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

// Ícones do Painel Admin - Tema Barbearia Moderna
const DashboardIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />;
const ShopIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />;
const ScissorsIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z" />;
const TagIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />;
const GalleryIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />;
const CalendarIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />;
const StarIcon = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />;

// === COMPONENTES ===

// Loading Spinner
const LoadingSpinner = ({ message = 'Carregando...', progress }: { message?: string, progress?: number }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-red-600"></div>
      <p className="text-white mt-4">{message}</p>
      {progress !== undefined && (
        <div className="w-48 bg-gray-600 rounded-full h-2.5 mt-4">
          <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  </div>
);


// Página não encontrada
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <h1 className="text-4xl font-bold mb-4">Barbearia não encontrada</h1>
    <p className="text-gray-300">O link que você acessou não existe ou foi removido.</p>
  </div>
);

// Novo: Componente para erro de conexão
const ConnectionError = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
    <h1 className="text-4xl font-bold mb-4">Erro de Conexão</h1>
    <p className="text-gray-300 max-w-md">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transition duration-300"
    >
      Tentar Novamente
    </button>
  </div>
);

// Componente de Debug (apenas em desenvolvimento)
const DebugPanel = ({ 
  user, 
  barberData, 
  view, 
  useMockData,
  onRefreshData,
  onSetUser,
  onSetView
}: { 
  user: any; 
  barberData: BarberData | null; 
  view: string; 
  useMockData: boolean;
  onRefreshData: () => void;
  onSetUser: (user: any) => void;
  onSetView: (view: 'client' | 'admin') => void;
}) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const handlePopulateTestData = async () => {
    if (barberData && !useMockData) {
      console.log('🧪 Populando dados de teste...');
      await populateTestData(barberData.id);
      onRefreshData();
    }
  };
  
  const handleCreateTestBarber = async () => {
    console.log('👤 Criando barbeiro de teste...');
    const testBarberId = await createTestBarber();
    if (testBarberId) {
      console.log('✅ Barbeiro de teste criado! ID:', testBarberId);
      alert('Barbeiro de teste criado! Acesse: /barbearia-teste');
    }
  };
  
  const handleTestLogin = () => {
    console.log('🧪 Simulando login com userID do barbeiro existente...');
    // Simular login com o userID que está no Firebase
    onSetUser({ uid: 'RnCu9uIUU2a6d7ZGa35XHs1ubfn2', email: 'barbeiro@exemplo.com' });
    onSetView('admin');
  };
  
  const handleCreateNewBarber = async () => {
    const shopName = prompt('Nome da Barbearia:');
    const location = prompt('Localização:');
    const whatsapp = prompt('WhatsApp (apenas números):');
    const email = prompt('Email:');
    
    if (shopName && location && whatsapp && email) {
      console.log('👤 Criando novo barbeiro...');
      const barberId = await FirestoreService.createNewBarber('new-user-' + Date.now(), {
        shopName,
        location,
        whatsappNumber: whatsapp,
        email
      });
      
      if (barberId) {
        const slug = await FirestoreService.generateUniqueSlug(shopName);
        alert(`✅ Novo barbeiro criado!\n\nSlug: ${slug}\nAcesse: /${slug}`);
      } else {
        alert('❌ Erro ao criar barbeiro');
      }
    }
  };
  
  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      <div className="space-y-1 mb-3">
        <p><strong>Usuário:</strong> {user ? 'Logado' : 'Não logado'}</p>
        <p><strong>View:</strong> {view}</p>
        <p><strong>Dados:</strong> {barberData ? 'Carregados' : 'Não carregados'}</p>
        <p><strong>Mock:</strong> {useMockData ? 'Sim' : 'Não'}</p>
        <p><strong>URL:</strong> {window.location.pathname}</p>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={onRefreshData}
          className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          🔄 Recarregar Dados
        </button>
        
        {barberData && !useMockData && (
          <button
            onClick={handlePopulateTestData}
            className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            🧪 Popular Dados Teste
          </button>
        )}
        
        <button
          onClick={handleCreateTestBarber}
          className="w-full bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
        >
          👤 Criar Barbeiro Teste
        </button>
        
        <button
          onClick={handleTestLogin}
          className="w-full bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
        >
          🔑 Testar Login Admin
        </button>
        
        <button
          onClick={handleCreateNewBarber}
          className="w-full bg-cyan-600 text-white px-2 py-1 rounded text-xs hover:bg-cyan-700"
        >
          🆕 Criar Novo Barbeiro
        </button>
      </div>
    </div>
  );
};

// Header
const Header: React.FC<{ onAdminClick: () => void; logoUrl: string; shopName: string }> = ({ 
  onAdminClick, 
  logoUrl, 
  shopName 
}) => (
  <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <img 
          src={logoUrl} 
          alt={`Logo ${shopName}`} 
          className="h-12 w-auto"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/200x80/111827/FFFFFF/png?text=LOGO';
          }}
        />
      </div>
      <nav className="hidden md:flex items-center space-x-6">
        <button 
          onClick={() => scrollToSection('promocoes')} 
          className="hover:text-red-500 transition duration-300"
        >
          Promoções
        </button>
        <button 
          onClick={() => scrollToSection('galeria')} 
          className="hover:text-red-500 transition duration-300"
        >
          Galeria
        </button>
        <button 
          onClick={() => scrollToSection('agendamento')} 
          className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
        >
          AGENDAR AGORA
        </button>
      </nav>
      <button 
        onClick={onAdminClick} 
        className="text-sm border border-red-600 px-3 py-2 rounded-md hover:bg-red-600 transition duration-300"
      >
        Área do Barbeiro
      </button>
    </div>
  </header>
);

// Hero Section
const Hero: React.FC<{ shopName: string }> = ({ shopName }) => (
  <section className="bg-gray-800 text-white bg-cover bg-center" 
    style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://i.ibb.co/pBBb2bKJ/Image-fx.png')" }}>
    <div className="container mx-auto px-6 py-32 text-center">
      <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-widest">{shopName}</h2>
      <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
        Sua aparência é nosso cartão de visita. Agende seu horário e experimente o melhor serviço da cidade.
      </p>
      <button 
        onClick={() => scrollToSection('agendamento')} 
        className="mt-8 inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transform hover:scale-105 transition duration-300"
      >
        Agendar Horário
      </button>
    </div>
  </section>
);

// Promoções
const Promotions: React.FC<{ promotions: Promotion[] }> = ({ promotions }) => (
  <section id="promocoes" className="py-20 bg-gray-100">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 uppercase text-gray-800">
        Nossas <span className="text-red-600">Promoções</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions.length > 0 ? promotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-xl p-8 transform hover:-translate-y-2 transition duration-300 border-l-4 border-red-600">
            <h3 className="text-2xl font-bold text-gray-900">{promo.title}</h3>
            <p className="mt-4 text-gray-600">{promo.description}</p>
          </div>
        )) : (
          <p className="col-span-full text-center text-gray-600">Nenhuma promoção ativa no momento.</p>
        )}
      </div>
    </div>
  </section>
);

// Galeria
const Gallery: React.FC<{ images: GalleryImage[] }> = ({ images }) => (
  <section id="galeria" className="py-20 bg-gray-900">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 uppercase text-white">
        Nossos <span className="text-red-600">Trabalhos</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.length > 0 ? images.map(img => (
          <div key={img.id} className="overflow-hidden rounded-lg shadow-lg">
            <img 
              src={img.src} 
              alt={img.alt} 
              className="w-full h-full object-cover transform hover:scale-110 transition duration-500 cursor-pointer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x300/1f2937/FFFFFF/png?text=Imagem';
              }}
            />
          </div>
        )) : (
          <p className="col-span-full text-center text-white">Galeria em breve.</p>
        )}
      </div>
    </div>
  </section>
);

// Formulário de Agendamento
const BookingForm: React.FC<{ 
  services: Service[]; 
  availability: Record<string, string[]>;
  barberData: BarberData;
  onBookingSuccess: () => void;
}> = ({ services, availability, barberData, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientWhatsapp: '',
    serviceId: '',
    date: '',
    time: '',
    paymentMethod: 'PIX'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const availableDates = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      if (availability[dateString]?.length > 0) {
        dates.push(dateString);
      }
    }
    return dates;
  }, [availability]);

  const availableTimes = formData.date ? availability[formData.date] || [] : [];

  const selectedService = services.find(s => s.id === formData.serviceId);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'date' && { time: '' }) // Reset time when date changes
    }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientWhatsapp || !selectedService || !formData.date || !formData.time) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar agendamento no Firestore
      const appointmentData = {
        clientName: formData.clientName,
        clientWhatsapp: formData.clientWhatsapp,
        service: selectedService,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: formData.date,
        time: formData.time,
        paymentMethod: formData.paymentMethod,
        status: 'Pendente' as const
      };

      const appointmentId = await FirestoreService.createAppointment(barberData.id, appointmentData);

      if (appointmentId) {
        // Enviar para WhatsApp do barbeiro
        const formattedDate = new Date(formData.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const barberMessage = `*Novo Agendamento*\n\n*Cliente:* ${formData.clientName}\n*Serviço:* ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})\n*Data:* ${formattedDate}\n*Hora:* ${formData.time}\n*Pagamento:* ${formData.paymentMethod}\n*WhatsApp:* ${formData.clientWhatsapp}`;
        const barberUrl = `https://wa.me/${barberData.profile.whatsappNumber}?text=${encodeURIComponent(barberMessage)}`;

        // Abrir WhatsApp do barbeiro
        window.open(barberUrl, '_blank');

        setShowSuccess(true);
        onBookingSuccess();

        // Reset form
        setFormData({
          clientName: '',
          clientWhatsapp: '',
          serviceId: '',
          date: '',
          time: '',
          paymentMethod: 'PIX'
        });
      } else {
        alert('Erro ao criar agendamento. Horário pode não estar mais disponível.');
      }
    } catch (error) {
      console.error('Erro ao agendar:', error);
      alert('Erro ao processar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <section id="agendamento" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Agendamento Enviado!</h3>
            <p className="mb-4">Sua solicitação foi enviada para o barbeiro. Em breve você receberá a confirmação.</p>
            <button 
              onClick={() => setShowSuccess(false)} 
              className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-300"
            >
              Fazer Novo Agendamento
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="agendamento" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 uppercase text-gray-800">
          Agende seu <span className="text-red-600">Horário</span>
        </h2>
        
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-6">
          
          {/* Serviços */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <ScissorsIcon className="h-5 w-5 mr-2" /> Serviço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {services.map(service => (
                <button 
                  key={service.id} 
                  type="button" 
                  onClick={() => handleInputChange('serviceId', service.id)}
                  className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${
                    formData.serviceId === service.id 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  {service.name}
                  <span className="block text-xs opacity-80">R$ {service.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Datas */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" /> Data
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {availableDates.map(date => (
                <button 
                  key={date} 
                  type="button" 
                  onClick={() => handleInputChange('date', date)}
                  className={`p-3 border rounded-lg text-center transition duration-300 ${
                    formData.date === date 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC'})}
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          {formData.date && (
            <div>
              <label className="block text-gray-800 font-bold mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" /> Horário
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {availableTimes.map(time => (
                  <button 
                    key={time} 
                    type="button" 
                    onClick={() => handleInputChange('time', time)}
                    className={`p-3 border rounded-lg transition duration-300 ${
                      formData.time === time 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dados pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="block text-gray-800 font-bold mb-2">Nome Completo</label>
              <input 
                type="text" 
                value={formData.clientName}
                onChange={e => handleInputChange('clientName', e.target.value)}
                placeholder="Seu nome completo" 
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900" 
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 font-bold mb-2">WhatsApp</label>
              <input 
                type="tel" 
                value={formData.clientWhatsapp}
                onChange={e => handleInputChange('clientWhatsapp', e.target.value)}
                placeholder="Ex: 5511999998888" 
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900" 
                required
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-gray-800 font-bold mb-3 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" /> Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['PIX', 'Débito', 'Crédito', 'Dinheiro'].map(method => (
                <button 
                  key={method} 
                  type="button" 
                  onClick={() => handleInputChange('paymentMethod', method)}
                  className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${
                    formData.paymentMethod === method 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.clientName || !formData.serviceId || !formData.date || !formData.time}
            className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-lg text-lg uppercase hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Agendamento'}
          </button>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer: React.FC<{ shopName: string; location: string }> = ({ shopName, location }) => (
  <footer className="bg-gray-900 text-gray-300 py-8">
    <div className="container mx-auto px-6 text-center">
      <h3 className="text-2xl font-bold uppercase text-white mb-2">{shopName}</h3>
      <p className="flex items-center justify-center mb-4">
        <MapPinIcon className="h-5 w-5 mr-2" /> {location}
      </p>
      <p className="text-sm">
        &copy; {new Date().getFullYear()} {shopName}. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

// Interface para dados de cadastro
interface SignUpData {
  email: string;
  pass: string;
  shopName: string;
  location: string;
  whatsappNumber: string;
}

// Modal de Login e Cadastro
const LoginModal: React.FC<{
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignUp: (data: SignUpData) => Promise<void>;
  error: string;
  clearError: () => void;
}> = ({ onClose, onLogin, onSignUp, error, clearError }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // State for both forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (mode === 'login') {
      await onLogin(email, password);
    } else {
      await onSignUp({ email, pass: password, shopName, location, whatsappNumber: whatsapp });
    }
    setIsLoading(false);
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    clearError();
    setEmail('');
    setPassword('');
    setShopName('');
    setLocation('');
    setWhatsapp('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-md m-4">
        <h2 className="text-3xl font-bold text-center mb-6">
          {mode === 'login' ? 'Acesso do Barbeiro' : 'Crie sua Conta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mínimo 6 caracteres)"
            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />

          {mode === 'signup' && (
            <>
              <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Nome da Barbearia" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (Ex: 55419...)" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            </>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300 disabled:bg-gray-500"
            >
              {isLoading ? (mode === 'login' ? 'Entrando...' : 'Cadastrando...') : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-gray-500 transition duration-300"
            >
              Cancelar
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-cyan-400 hover:text-cyan-300">
            {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Painel Administrativo Completo
const AdminPanel: React.FC<{
  barberData: BarberData;
  onLogout: () => void;
  onDataUpdate: () => void;
}> = ({ barberData, onLogout, onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'dashboard' | 'services' | 'promotions' | 'gallery' | 'appointments' | 'loyalty'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);

  // State for loyalty clients, managed by the parent panel
  const [loyaltyClients, setLoyaltyClients] = useState<LoyaltyClient[]>([]);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(true);

  // Function to load loyalty data
  const loadLoyaltyData = useCallback(async () => {
    if (!barberData.id) return;
    setIsLoyaltyLoading(true);
    const clients = await FirestoreService.getLoyaltyClientsForBarber(barberData.id);
    setLoyaltyClients(clients);
    setIsLoyaltyLoading(false);
  }, [barberData.id]);
  
  // Effect to load loyalty data on mount or when the barber changes
  useEffect(() => {
    loadLoyaltyData();
  }, [loadLoyaltyData]);

  // Combined data update handler to refresh both barber data and loyalty data
  const handleAdminDataUpdate = useCallback(() => {
    onDataUpdate(); // Reloads barberData (appointments, services, etc.)
    loadLoyaltyData(); // Reloads loyalty data
  }, [onDataUpdate, loadLoyaltyData]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!barberData) {
      return { confirmedTotal: 0, pendingTotal: 0, totalRevenue: 0 };
    }
    return calculateFinancials(barberData.appointments);
  }, [barberData]);


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

      // Etapa de Upload de Imagem
      if (uploadFile) {
        const folder = activeTab === 'profile' ? 'logos' : 'gallery';
        const newUrl = await FirestoreService.uploadImage(
          uploadFile, 
          folder,
          (progress) => setUploadProgress(progress)
        );

        if (activeTab === 'profile') finalEditData.logoUrl = newUrl;
        if (activeTab === 'gallery') finalEditData.src = newUrl;
      }
      
      console.log('💾 Salvando dados:', finalEditData);
      
      // Etapa de Salvamento no Firestore
      let success = false;
      let message = '';
      
      switch (activeTab) {
        case 'profile':
          success = await FirestoreService.updateBarberProfile(barberData.id, finalEditData);
          message = 'Perfil';
          break;
        case 'services':
          if (finalEditData.id) {
            success = await FirestoreService.updateService(barberData.id, finalEditData.id, finalEditData);
          } else {
            success = !!await FirestoreService.addService(barberData.id, finalEditData);
          }
          message = 'Serviço';
          break;
        case 'promotions':
          if (finalEditData.id) {
            success = await FirestoreService.updatePromotion(barberData.id, finalEditData.id, finalEditData);
          } else {
            success = !!await FirestoreService.addPromotion(barberData.id, finalEditData);
          }
          message = 'Promoção';
          break;
        case 'gallery':
          if (finalEditData.id) {
            success = await FirestoreService.updateGalleryImage(barberData.id, finalEditData.id, finalEditData);
          } else {
            success = !!await FirestoreService.addGalleryImage(barberData.id, finalEditData);
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
      let userMessage = 'Ocorreu um erro ao salvar. Verifique o console para mais detalhes.';
      if (error && error.code === 'storage/unauthorized') {
        userMessage = 'Erro de permissão ao salvar a imagem. Isso geralmente é causado por uma configuração incorreta de CORS no Firebase Storage. Por favor, verifique as regras e a configuração de CORS do seu bucket.';
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
      {isUploading && <LoadingSpinner message="Salvando dados..." progress={uploadProgress} />}
      {/* Header */}
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
              <LogoutIcon /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
                { id: 'profile', label: 'Perfil da Barbearia', icon: <ShopIcon /> },
                { id: 'services', label: 'Serviços', icon: <ScissorsIcon /> },
                { id: 'promotions', label: 'Promoções', icon: <TagIcon /> },
                { id: 'gallery', label: 'Galeria', icon: <GalleryIcon /> },
                { id: 'appointments', label: 'Agendamentos', icon: <CalendarIcon /> },
                { id: 'loyalty', label: 'Fidelidade', icon: <StarIcon /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <DashboardTab 
                barberData={barberData} 
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
                images={barberData.galleryImages}
                barberId={barberData.id}
                onEdit={handleEdit}
                isEditing={isEditing}
                editData={editData}
                onSave={handleSave}
                onCancel={handleCancel}
                onEditDataChange={setEditData}
                uploadFile={uploadFile}
                setUploadFile={setUploadFile}
                isUploading={isUploading}
                onDataUpdate={handleAdminDataUpdate}
              />
            )}
            
            {activeTab === 'appointments' && (
              <AppointmentsTab 
                barberData={barberData}
                appointments={barberData.appointments}
                barberId={barberData.id}
                onDataUpdate={handleAdminDataUpdate}
                availability={barberData.availability}
              />
            )}
            
            {activeTab === 'loyalty' && (
              <LoyaltyTab 
                barberId={barberData.id}
                clients={loyaltyClients}
                isLoading={isLoyaltyLoading}
                onRefresh={loadLoyaltyData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes das Abas do Painel Administrativo

// Dashboard Tab
const DashboardTab: React.FC<{ 
  barberData: BarberData;
  financialSummary: { confirmedTotal: number; pendingTotal: number; totalRevenue: number };
}> = ({ barberData, financialSummary }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold">Dashboard</h2>
    
    {/* Cards de Estatísticas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Total de Agendamentos</h3>
        <p className="text-3xl font-bold text-white">{barberData.appointments.length}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Serviços Ativos</h3>
        <p className="text-3xl font-bold text-white">{barberData.services.length}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Promoções Ativas</h3>
        <p className="text-3xl font-bold text-white">{barberData.promotions.length}</p>
      </div>
    </div>
    
    {/* Novos Cards Financeiros */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Receita Confirmada</h3>
        <p className="text-3xl font-bold text-green-500">R$ {financialSummary.confirmedTotal.toFixed(2)}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">A Confirmar (Previsão)</h3>
        <p className="text-3xl font-bold text-yellow-500">R$ {financialSummary.pendingTotal.toFixed(2)}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300">Receita Total (Previsão)</h3>
        <p className="text-3xl font-bold text-white">R$ {financialSummary.totalRevenue.toFixed(2)}</p>
      </div>
    </div>

    {/* Agendamentos Recentes */}
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Agendamentos Recentes</h3>
      {barberData.appointments.length > 0 ? (
        <div className="space-y-4">
          {barberData.appointments.slice(0, 5).map(appointment => (
            <div key={appointment.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold">{appointment.clientName}</p>
                <p className="text-sm text-gray-300">
                  {appointment.service?.name || 'Serviço não especificado'} - {new Date(appointment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {appointment.time}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                appointment.status === 'Confirmado' ? 'bg-green-600' : 'bg-yellow-600'
              }`}>
                {appointment.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Nenhum agendamento ainda.</p>
      )}
    </div>
  </div>
);

// Profile Tab
const ProfileTab: React.FC<{
  barberData: BarberData;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  isUploading: boolean;
}> = ({ barberData, onEdit, isEditing, editData, onSave, onCancel, onEditDataChange, uploadFile, setUploadFile, isUploading }) => {
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uploadFile) {
      const url = URL.createObjectURL(uploadFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadFile]);

  const portalUrl = `${window.location.origin}/${barberData.profile.slug}`;

  const handleShare = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Perfil da Barbearia</h2>
        {!isEditing && (
          <button
            onClick={() => onEdit('profile', barberData.profile)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Editar Perfil
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-8">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <img 
                  src={previewUrl || editData.logoUrl || 'https://placehold.co/96x96/374151/FFFFFF/png?text=LOGO'}
                  alt="Pré-visualização do Logo"
                  className="w-24 h-24 rounded-lg object-cover bg-gray-700"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-300 flex items-center"
                >
                  <UploadIcon className="mr-2" /> Carregar Imagem
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Barbearia</label>
              <input
                type="text"
                value={editData.shopName || ''}
                onChange={(e) => onEditDataChange({...editData, shopName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
              <input
                type="text"
                value={editData.location || ''}
                onChange={(e) => onEditDataChange({...editData, location: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp</label>
              <input
                type="text"
                value={editData.whatsappNumber || ''}
                onChange={(e) => onEditDataChange({...editData, whatsappNumber: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Preencha somente com números.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Slug do Portal</label>
              <input
                type="text"
                value={editData.slug || ''}
                onChange={(e) => onEditDataChange({...editData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-xs text-gray-400 mt-1">O final do link do seu portal. Use apenas letras, números e hifens.</p>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={onSave}
                disabled={isUploading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
              >
                {isUploading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={onCancel}
                disabled={isUploading}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start gap-8">
            <img 
              src={barberData.profile.logoUrl} 
              alt="Logo" 
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/96x96/1f2937/FFFFFF/png?text=LOGO';
              }}
            />
            <div className="flex-grow w-full">
              <h3 className="text-2xl font-bold">{barberData.profile.shopName}</h3>
              <p className="text-gray-400 mt-1">{barberData.profile.location}</p>

              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400">WhatsApp</label>
                  <p className="text-white mt-1">{barberData.profile.whatsappNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Link do Portal</label>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 break-all">
                      {barberData.profile.slug}
                    </a>
                    <button
                      onClick={handleShare}
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition duration-300"
                    >
                      {isCopied ? 'Copiado!' : 'Compartilhar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Services Tab
const ServicesTab: React.FC<{
  services: Service[];
  barberId: string;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  onDataUpdate: () => void;
}> = ({ services, barberId, onEdit, isEditing, editData, onSave, onCancel, onEditDataChange, onDataUpdate }) => (
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
          <p className="text-2xl font-bold text-red-500">R$ {service.price.toFixed(2)}</p>
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
                  const success = await FirestoreService.deleteService(barberId, service.id);
                  if (success) {
                    alert('✅ Serviço deletado com sucesso!');
                    onDataUpdate();
                  } else {
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

// Promotions Tab
const PromotionsTab: React.FC<{
  promotions: Promotion[];
  barberId: string;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  onDataUpdate: () => void;
}> = ({ promotions, barberId, onEdit, isEditing, editData, onSave, onCancel, onEditDataChange, onDataUpdate }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold">Promoções</h2>
      <button
        onClick={() => onEdit('promotions', { title: '', description: '' })}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
      >
        Adicionar Promoção
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {promotions.map(promotion => (
        <div key={promotion.id} className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-600">
          <h3 className="text-lg font-semibold">{promotion.title}</h3>
          <p className="text-gray-300 mt-2">{promotion.description}</p>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => onEdit('promotions', promotion)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition duration-300"
            >
              Editar
            </button>
            <button
              onClick={async () => {
                if (confirm('Tem certeza que deseja deletar esta promoção?')) {
                  const success = await FirestoreService.deletePromotion(barberId, promotion.id);
                  if (success) {
                    alert('✅ Promoção deletada com sucesso!');
                    onDataUpdate();
                  } else {
                    alert('❌ Erro ao deletar promoção.');
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
        <h3 className="text-xl font-bold mb-4">Editar Promoção</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => onEditDataChange({...editData, title: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => onEditDataChange({...editData, description: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              rows={3}
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

// Gallery Tab
const GalleryTab: React.FC<{
  images: GalleryImage[];
  barberId: string;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  isUploading: boolean;
  onDataUpdate: () => void;
}> = ({ images, barberId, onEdit, isEditing, editData, onSave, onCancel, onEditDataChange, uploadFile, setUploadFile, isUploading, onDataUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (uploadFile) {
      const url = URL.createObjectURL(uploadFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadFile]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Galeria</h2>
        <button
          onClick={() => onEdit('gallery', { src: '', alt: '' })}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        >
          Adicionar Imagem
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-32 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/300x200/1f2937/FFFFFF/png?text=Imagem';
              }}
            />
            <div className="p-3">
              <p className="text-sm text-gray-300">{image.alt}</p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => onEdit('gallery', image)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition duration-300"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja deletar esta imagem?')) {
                      const success = await FirestoreService.deleteGalleryImage(barberId, image.id, image.src);
                      if (success) {
                        alert('✅ Imagem deletada com sucesso!');
                        onDataUpdate();
                      } else {
                        alert('❌ Erro ao deletar imagem.');
                      }
                    }
                  }}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition duration-300"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">{editData.id ? 'Editar Imagem' : 'Adicionar Imagem'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagem</label>
               <div className="flex flex-col items-start gap-4">
                <img 
                  src={previewUrl || editData.src || 'https://placehold.co/300x200/374151/FFFFFF/png?text=Selecione'}
                  alt="Pré-visualização"
                  className="w-48 h-32 rounded-lg object-cover bg-gray-700"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-300 flex items-center"
                >
                  <UploadIcon className="mr-2" /> Carregar Imagem
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
              <input
                type="text"
                value={editData.alt || ''}
                onChange={(e) => onEditDataChange({...editData, alt: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onSave}
                disabled={isUploading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
              >
                {isUploading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={onCancel}
                disabled={isUploading}
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

// Appointments Tab
const AppointmentsTab: React.FC<{
  appointments: Appointment[];
  barberId: string;
  onDataUpdate: () => void;
  availability: Record<string, string[]>;
  barberData: BarberData;
}> = ({ appointments, barberId, onDataUpdate, availability, barberData }) => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'Todos' | 'Pendente' | 'Confirmado'>('Todos');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => appointments
    .filter(app => filter === 'Todos' || app.status === filter)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
  }), [appointments, filter]);
  
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { year, month, daysInMonth, firstDayOfMonth };
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
    setSelectedDate(null);
  };
  
  const handleDateClick = (day: number) => {
    const date = new Date(calendarData.year, calendarData.month, day);
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };
  
  const selectedDateAvailability = useMemo(() => selectedDate ? (availability[selectedDate] || []).sort() : [], [selectedDate, availability]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Agendamentos</h2>
        <div className="flex bg-gray-700 p-1 rounded-lg">
          <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Lista</button>
          <button onClick={() => setView('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'calendar' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Calendário</button>
        </div>
      </div>
      
      {view === 'list' ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-start items-center mb-6 gap-2 border-b border-gray-700 pb-4">
            <h3 className="text-lg font-semibold mr-4">Filtrar por status:</h3>
            {(['Todos', 'Pendente', 'Confirmado'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {f}
              </button>
            ))}
          </div>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map(appointment => (
                <div key={appointment.id} className="bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-grow space-y-4 w-full">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{appointment.clientName}</p>
                        <a href={`https://wa.me/${appointment.clientWhatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-green-400 hover:text-green-300 transition-colors">
                          <WhatsAppIcon className="h-4 w-4 mr-1" />
                          {appointment.clientWhatsapp}
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-gray-600">
                      <div className="flex items-start gap-3">
                        <ScissorsIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-400">Serviço</p>
                          <p className="font-semibold text-white">{appointment.service?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-300">R$ {appointment.service?.price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-400">Data & Hora</p>
                          <p className="font-semibold text-white">{new Date(appointment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {appointment.time}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCardIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-400">Pagamento</p>
                          <p className="font-semibold text-white">{appointment.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center md:items-end justify-between self-stretch gap-4 w-full md:w-auto md:min-w-[120px] pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-600 md:pl-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${appointment.status === 'Confirmado' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {appointment.status}
                    </span>
                    <div className="flex flex-row md:flex-col gap-2 mt-auto w-full">
                      {appointment.status === 'Pendente' && (
                        <button onClick={async () => {
                          const success = await FirestoreService.updateAppointmentStatus(barberId, appointment.id, 'Confirmado');
                           if (success) {
                              const clientWhatsapp = appointment.clientWhatsapp.replace(/\D/g, '');
                              const serviceName = appointment.service?.name || 'seu serviço';
                              const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                              const time = appointment.time;
                              const shopName = barberData.profile.shopName;
                              
                              const message = `Olá, ${appointment.clientName}!\n\nSeu agendamento na ${shopName} foi CONFIRMADO com sucesso.\n\nServiço: ${serviceName}\nData: ${formattedDate}\nHora: ${time}\n\nCaso você ocorra algum imprevisto, por favor nos envie uma mensagem para cancelar o seu agendamento!\n\nAté breve!`;
                              
                              const whatsappUrl = `https://wa.me/${clientWhatsapp}?text=${encodeURIComponent(message)}`;
                              
                              window.open(whatsappUrl, '_blank');
                              alert('Agendamento confirmado!');
                              onDataUpdate();
                          } else {
                              alert('Erro ao confirmar agendamento.');
                          }
                        }} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Confirmar</button>
                      )}
                      <button onClick={async () => {
                        if (confirm(`Tem certeza que deseja cancelar o agendamento de ${appointment.clientName}?`)) {
                          const success = await FirestoreService.cancelAppointment(barberId, appointment.id);
                          if (success) {
                            alert('Agendamento cancelado e horário restaurado.');
                            onDataUpdate();
                          } else {
                            alert('Erro ao cancelar agendamento.');
                          }
                        }
                      }} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Cancelar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Nenhum agendamento encontrado para o filtro "{filter}".</p>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ChevronLeftIcon /></button>
            <h3 className="text-xl font-bold capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ChevronRightIcon /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="font-semibold text-sm text-gray-400 py-2">{day}</div>)}
            {Array.from({ length: calendarData.firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: calendarData.daysInMonth }).map((_, day) => {
              const dayNumber = day + 1;
              const date = new Date(calendarData.year, calendarData.month, dayNumber);
              const dateString = date.toISOString().split('T')[0];
              const availableSlotsCount = availability[dateString]?.length || 0;
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              return (
                <button key={dayNumber} onClick={() => handleDateClick(dayNumber)}
                  className={`flex flex-col items-center justify-center h-20 p-2 rounded-lg transition-colors text-white text-lg ${
                    selectedDate === dateString ? 'bg-red-600' : isToday ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={availableSlotsCount === 0}
                >
                  {dayNumber}
                  {availableSlotsCount > 0 && <span className="block text-xs font-semibold text-green-300 mt-1">{availableSlotsCount} {availableSlotsCount === 1 ? 'horário' : 'horários'}</span>}
                </button>
              );
            })}
          </div>
          
          {selectedDate && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-bold mb-4">Horários disponíveis para {new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}:</h4>
              {selectedDateAvailability.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedDateAvailability.map(time => <span key={time} className="bg-gray-700 px-4 py-2 rounded-lg font-mono text-sm">{time}</span>)}
                </div>
              ) : (
                <p className="text-gray-400">Nenhum horário disponível para esta data.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Loyalty Tab
const LoyaltyTab: React.FC<{ 
  barberId: string;
  clients: LoyaltyClient[];
  isLoading: boolean;
  onRefresh: () => void;
}> = ({ barberId, clients, isLoading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<LoyaltyClient | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  const rewards = useMemo(() => [
    { stars: 5, description: 'Prêmio (Ex: Corte Grátis)' },
  ], []);

  const filteredClients = useMemo(() => clients.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientWhatsapp.includes(searchTerm)
  ), [clients, searchTerm]);

  const handleRedeem = async (client: LoyaltyClient) => {
    if (!client || !client.goal) return;

    const success = await FirestoreService.redeemStars(
      barberId,
      client.clientWhatsapp,
      client.goal
    );

    if (success) {
      alert(`✅ Prêmio resgatado com sucesso para ${client.clientName}! O saldo de estrelas foi atualizado.`);
      setIsRedeemModalOpen(false);
      onRefresh(); // Refresh client list using prop
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

                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setIsRedeemModalOpen(true);
                        }}
                        className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={!canRedeem}
                      >
                        Resgatar Prêmio
                      </button>
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
                    disabled={(selectedClient.stars || 0) < (selectedClient.goal || 5)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    Resgatar
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

export default App;