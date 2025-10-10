

// FIX: Changed React import to a namespace import (`import * as React from 'react'`) to resolve multiple 'Property does not exist on type JSX.IntrinsicElements' errors.
import * as React from 'react';
import type { Promotion, GalleryImage, Service, Appointment, LoyaltyClient, Client, ClientStats, ClientFormData, Transaction, Financials } from './types';
import { FirestoreService, BarberData } from './firestoreService';
import { auth } from './firebaseConfig';
import { testFirestoreWrite, testFirestoreRead } from './firebaseTest';
import { APP_CONFIG, getBarberSlugFromUrl, debugLog } from './config';
import { populateTestData, createTestBarber } from './populateTestData';


//Adicione estas funções no início do seu App.tsx, logo após os imports

// === SISTEMA DE ROTEAMENTO MELHORADO ===
const useRouting = () => {
  const [currentRoute, setCurrentRoute] = React.useState<{
    type: 'barber' | 'admin' | 'notfound';
    slug?: string;
  } | null>(null);

  React.useEffect(() => {
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
const calculateFinancialsFromAppointments = (appointments: (Appointment & { servicePrice?: number })[]) => {
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

// === FUNÇÃO DE VALIDAÇÃO DE ACESSO ===
const validateBarberAccess = (
  barberData: BarberData,
  user: any,
  setUnauthorizedAccessInfo: (info: { userEmail: string; attemptedSlug: string } | null) => void
): boolean => {
  if (!barberData || !user) return false;
  
  // O ID do documento do barbeiro DEVE ser o UID do usuário.
  const ownerId = barberData.id;
  
  if (user.uid !== ownerId) {
    console.warn(
      `SECURITY VIOLATION: User ${user.uid} (${user.email}) attempted to access admin panel for barber ${barberData.id} (${barberData.profile.shopName}).`
    );
    setUnauthorizedAccessInfo({
      userEmail: user.email || 'Desconhecido',
      attemptedSlug: barberData.profile.slug,
    });
    return false;
  }
  
  setUnauthorizedAccessInfo(null);
  return true;
};

// === COMPONENTE DE ACESSO NÃO AUTORIZADO ===
const UnauthorizedAccess: React.FC<{
  userEmail: string;
  attemptedSlug: string;
  onLogout: () => void;
}> = ({ userEmail, attemptedSlug, onLogout }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
    <h1 className="text-4xl font-bold mb-4 text-red-500">Acesso Não Autorizado</h1>
    <p className="text-gray-300 max-w-md mb-2">
      Você está logado como <strong className="text-white">{userEmail}</strong>, mas não tem permissão para gerenciar a barbearia <strong className="text-white">"{attemptedSlug}"</strong>.
    </p>
    <p className="text-gray-400 max-w-md">
      Isso pode acontecer se você estiver logado com a conta errada. Por favor, saia e entre com a conta correta associada a esta barbearia.
    </p>
    <button
      onClick={async () => {
        await onLogout();
        window.location.href = `/${attemptedSlug}/admin`;
      }}
      className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transition duration-300"
    >
      Sair e Tentar Novamente
    </button>
  </div>
);

// Componente para aplicar estilos do tema dinamicamente
const ThemeStyles: React.FC<{ theme?: { primaryColor: string; secondaryColor: string } }> = ({ theme }) => {
  const defaultTheme = {
    primaryColor: '#DC2626', // red-600
    secondaryColor: '#7F1D1D', // red-900
  };

  const currentTheme = theme && theme.primaryColor ? theme : defaultTheme;
  const { primaryColor, secondaryColor } = currentTheme;

  // Helper para escurecer uma cor hexadecimal
  const darkenColor = (hex: string, percent: number) => {
    hex = hex.replace(/^#/, '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + percent;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + percent;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + percent;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
  };
  
  const primaryHover = darkenColor(primaryColor, -20);
  const effectiveSecondaryColor = secondaryColor || primaryHover;

  const css = `
    :root {
      --color-primary: ${primaryColor};
      --color-primary-hover: ${primaryHover};
      --color-secondary: ${effectiveSecondaryColor};
    }
    .bg-primary { background-color: var(--color-primary); }
    .hover\\:bg-primary-dark:hover { background-color: var(--color-primary-hover); }
    .text-primary { color: var(--color-primary); }
    .border-primary { border-color: var(--color-primary); }
    .hover\\:bg-primary:hover { background-color: var(--color-primary); }
    .ring-primary:focus {
      --tw-ring-color: var(--color-primary);
      --tw-ring-opacity: 1;
      box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    }
    .bg-gradient-primary {
      background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
    }
  `;

  return <style>{css}</style>;
};

// === COMPONENTE APP PRINCIPAL REATORADO ===
const App: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [barberData, setBarberData] = React.useState<BarberData | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any | null>(() => auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [view, setView] = React.useState<'client' | 'admin'>('client');
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');
  const [unauthorizedAccessInfo, setUnauthorizedAccessInfo] = React.useState<{ userEmail: string; attemptedSlug: string } | null>(null);

  const currentRoute = useRouting();

  const handleFirestoreError = React.useCallback((error: any) => {
    console.error('Firestore Error:', error);
    if (error.code === 'unavailable' || error.code === 'permission-denied') {
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.CONNECTION_ERROR);
    } else {
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.FIREBASE_ERROR);
    }
    setBarberData(null);
  }, []);

  const loadBarberData = React.useCallback(async (barberId: string | null) => {
    if (!barberId) {
      setBarberData(null);
      setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
      return;
    }
    
    try {
      const data = await FirestoreService.loadPublicBarberData(barberId);
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
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Efeito para carregar os dados com base na rota e no usuário
  React.useEffect(() => {
    const initializeApp = async () => {
      if (!currentRoute || isAuthLoading) {
        return;
      }
      
      setLoading(true);
      setErrorMessage(null);
      setUnauthorizedAccessInfo(null); // Reset on every navigation
      
      try {
        const slug = currentRoute.slug;
        if (!slug && (currentRoute.type === 'admin' || currentRoute.type === 'notfound')) {
            setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
            setLoading(false);
            return;
        }
        
        const barberId = slug ? await FirestoreService.findBarberBySlug(slug) : null;
        
        if (currentRoute.type === 'notfound' || !barberId) {
            setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
            setLoading(false);
            return;
        }
        
        const data = await FirestoreService.loadPublicBarberData(barberId);
        
        if (!data) {
            setErrorMessage(APP_CONFIG.ERROR_MESSAGES.BARBER_NOT_FOUND);
            setLoading(false);
            return;
        }
        
        setBarberData(data); // Set public data for client view regardless

        if (currentRoute.type === 'admin') {
            if (user) {
                // Perform security validation
                if (validateBarberAccess(data, user, setUnauthorizedAccessInfo)) {
                    setView('admin'); // Authorized
                } else {
                    setView('client'); // Unauthorized, keep client view in background
                }
            } else {
                setView('client');
                setShowLoginModal(true);
            }
        } else {
            setView('client');
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        handleFirestoreError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [currentRoute, user, isAuthLoading, handleFirestoreError]);
  
  // Handlers
  const handleAdminAreaClick = () => {
    if (user && view === 'admin') {
       return;
    }
    if (user) {
       // A validação ocorrerá no useEffect quando a rota mudar
       window.history.pushState({}, '', `/${barberData?.profile.slug}/admin`);
       window.dispatchEvent(new PopStateEvent('popstate'));
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
          setShowLoginModal(false); 
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
    // Força o recarregamento para limpar o estado e voltar à página pública
    window.location.href = `/${barberData?.profile.slug || ''}`;
  };

  const handleBookingSuccess = () => {
    if (barberData) {
      loadBarberData(barberData.id);
    }
  };

  if (loading || isAuthLoading || !currentRoute) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (unauthorizedAccessInfo) {
    return (
      <UnauthorizedAccess
        userEmail={unauthorizedAccessInfo.userEmail}
        attemptedSlug={unauthorizedAccessInfo.attemptedSlug}
        onLogout={handleLogout}
      />
    );
  }
  
  if (errorMessage) {
    return <ConnectionError message={errorMessage} />;
  }

  if (!barberData) {
    return <LoadingSpinner message="Carregando dados da barbearia..." />;
  }
  
  if (view === 'admin' && user && !unauthorizedAccessInfo) {
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
      <ThemeStyles theme={barberData.profile.theme} />
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

// FIX: Export the `App` component as a default export to resolve the "Module has no default export" error in `index.tsx`.
export default App;

// --- Helper para rolagem suave ---
const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Função para obter slug da URL agora está em config.ts

// === ÍCONES SVG (reutilizáveis) ===
// FIX: Add explicit React.FC types to icon components for better type safety and to resolve potential JSX intrinsic element errors.
const Icon: React.FC<{ path: string, className?: string }> = ({ path, className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const ClockIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" />;
const CreditCardIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2h2v2H6V6zm4 0h2v2h-2V6zM6 9h2v2H6V9zm4 0h2v2h-2V9z" />;
const MapPinIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />;
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => <Icon className={className} path="M15 19l-7-7 7-7" />;
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => <Icon className={className} path="M5 19l7-7-7-7" />;
const UploadIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 12a1 1 0 011 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 112 0v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3a1 1 0 011-1zm5-10a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 10.586V3a1 1 0 011-1z" />;
const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => <Icon className={className} path="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />;

// Ícones específicos
const WhatsAppIcon: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.3 2.2C5.7 2.2 2 5.9 2 10.5c0 1.6.4 3.1 1.3 4.4L2 20l5.2-1.3c1.3.8 2.8 1.2 4.4 1.2 4.6 0 8.3-3.7 8.3-8.3S14.9 2.2 10.3 2.2zM10.3 18.1c-1.4 0-2.8-.4-4-1.2l-.3-.2-3 .8.8-2.9-.2-.3c-.8-1.2-1.3-2.7-1.3-4.2 0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5zm3.2-4.9c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1s-.5.6-.6.7c-.1.1-.2.2-.4.1-.2 0-.8-.3-1.5-.9s-1.1-1.3-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1 0-.3-.1-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3s-.7.7-.7 1.6.7 1.9 1.4 2.6c1.1 1.1 2.1 1.7 3.3 1.7.2 0 .4 0 .6-.1.6-.2 1.1-.7 1.2-1.3.1-.6.1-1.1 0-1.2-.1-.1-.3-.2-.5-.3z" /></svg>;
const LogoutIcon: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => <Icon className={className} path="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />;
const UserIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const VisualsIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => <Icon className={className} path="M10 3.22l-.61-.6a10 10 0 00-12.78 12.78l.61.61A10 10 0 0010 3.22zM17.39 6.61a10 10 0 00-10.78-3.39l-3.22 3.22a10 10 0 003.39 10.78l3.22-3.22A10 10 0 0017.39 6.61zM10 12a2 2 0 110-4 2 2 0 010 4z" />;

// Ícones do Painel Admin - Tema Barbearia Moderna
const DashboardIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />;
const ShopIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />;
const ScissorsIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z" />;
const TagIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />;
const GalleryIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />;
const CalendarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />;
const StarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />;
const UsersIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zm-4 6a3 3 0 11-6 0 3 3 0 016 0zM5 20a2 2 0 01-2-2v-6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2-2H5z" />;
const ChartBarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M3 12v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2zm2-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2zm10-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V6z" />;
const TrendingUpIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => <Icon className={className} path="M13 7h8v8h-2V9.414l-6.293 6.293-4-4L1 19.414 2.414 18l7.293-7.293 4 4L19.586 9H15V7z" />;
const ArrowSmDownIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 14l-5-5h10l-5 5z" />;
const ArrowSmUpIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 6l5 5H5l5-5z" />;

// === COMPONENTES ===

// Loading Spinner
// FIX: Added React.FC type for consistency and to fix potential JSX intrinsic element errors.
const LoadingSpinner: React.FC<{ message?: string, progress?: number }> = ({ message = 'Carregando...', progress }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      <p className="text-white mt-4">{message}</p>
      {progress !== undefined && (
        <div className="w-48 bg-gray-600 rounded-full h-2.5 mt-4">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  </div>
);


// Página não encontrada
// FIX: Added React.FC type for consistency and to fix potential JSX intrinsic element errors.
const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <h1 className="text-4xl font-bold mb-4">Barbearia não encontrada</h1>
    <p className="text-gray-300">O link que você acessou não existe ou foi removido.</p>
  </div>
);

// Novo: Componente para erro de conexão
// FIX: Added React.FC type for consistency and to fix potential JSX intrinsic element errors.
const ConnectionError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
    <h1 className="text-4xl font-bold mb-4">Erro de Conexão</h1>
    <p className="text-gray-300 max-w-md">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-8 bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-primary-dark transition duration-300"
    >
      Tentar Novamente
    </button>
  </div>
);

// Componente de Debug (apenas em desenvolvimento)
// FIX: Added React.FC type for consistency and to fix potential JSX intrinsic element errors.
const DebugPanel: React.FC<{ 
  user: any; 
  barberData: BarberData | null; 
  view: string; 
  useMockData: boolean;
  onRefreshData: () => void;
  onSetUser: (user: any) => void;
  onSetView: (view: 'client' | 'admin') => void;
}> = ({ 
  user, 
  barberData, 
  view, 
  useMockData,
  onRefreshData,
  onSetUser,
  onSetView
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
          className="hover:text-primary transition duration-300"
        >
          Promoções
        </button>
        <button 
          onClick={() => scrollToSection('galeria')} 
          className="hover:text-primary transition duration-300"
        >
          Galeria
        </button>
        <button 
          onClick={() => scrollToSection('agendamento')} 
          className="bg-primary px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
        >
          AGENDAR AGORA
        </button>
      </nav>
      <button 
        onClick={onAdminClick} 
        className="text-sm border border-primary px-3 py-2 rounded-md hover:bg-primary transition duration-300"
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
        className="mt-8 inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-primary-dark transform hover:scale-105 transition duration-300"
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
        Nossas <span className="text-primary">Promoções</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions.length > 0 ? promotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-xl p-8 transform hover:-translate-y-2 transition duration-300 border-l-4 border-primary">
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
        Nossos <span className="text-primary">Trabalhos</span>
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
  const [formData, setFormData] = React.useState({
    clientName: '',
    clientWhatsapp: '',
    serviceId: '',
    date: '',
    time: '',
    paymentMethod: 'PIX',
    birthdate: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const availableDates = React.useMemo(() => {
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
        birthdate: formData.birthdate,
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
          paymentMethod: 'PIX',
          birthdate: ''
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
              className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition duration-300"
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
          Agende seu <span className="text-primary">Horário</span>
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
                      ? 'bg-primary text-white shadow-md' 
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
                      ? 'bg-primary text-white shadow-md' 
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
                        ? 'bg-primary text-white shadow-md' 
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
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900" 
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
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900" 
                required
              />
            </div>
             <div>
              <label className="block text-gray-800 font-bold mb-2">Data de Nascimento</label>
              <input 
                type="date" 
                value={formData.birthdate}
                onChange={e => handleInputChange('birthdate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary text-gray-900"
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
                      ? 'bg-primary text-white shadow-md' 
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
            className="w-full bg-primary text-white font-bold py-4 px-6 rounded-lg text-lg uppercase hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
        &copy; {new Date().getFullYear()} {shopName}. Todos os direitos reservados. Site desenvolvido por{' '}
        <a 
          href="https://propagounegocios.com.br" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          propagounegocios.com.br
        </a>
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
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  
  // State for both forms
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [shopName, setShopName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  
  const [isLoading, setIsLoading] = React.useState(false);

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

// Modal de Lembretes de Agendamento
const RemindersModal: React.FC<{
  reminders: Appointment[];
  barberId: string;
  shopName: string;
  onClose: () => void;
  onReminderSent: () => void;
}> = ({ reminders, barberId, shopName, onClose, onReminderSent }) => {
  const [sentIds, setSentIds] = React.useState<string[]>([]);

  const handleSend = async (reminder: Appointment) => {
    // Mensagem amigável para o cliente
    const message = `Olá, ${reminder.clientName}! Passando para lembrar do seu horário na ${shopName} amanhã, às ${reminder.time}. Mal podemos esperar para te ver!`;
    const whatsappUrl = `https://wa.me/${reminder.clientWhatsapp}?text=${encodeURIComponent(message)}`;
    
    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
    
    // Marca como enviado no Firestore para não notificar novamente
    await FirestoreService.markReminderAsSent(barberId, reminder.id);
    
    // Atualiza a UI localmente para dar feedback imediato
    setSentIds(prev => [...prev, reminder.id]);
  };
  
  const handleClose = () => {
    if (sentIds.length > 0) {
      onReminderSent(); // Recarrega os dados se algum lembrete foi enviado
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-6">Lembretes de 24h Pendentes</h2>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {reminders.map(reminder => {
            const isSent = sentIds.includes(reminder.id);
            return (
              <div key={reminder.id} className={`p-4 rounded-lg flex justify-between items-center ${isSent ? 'bg-gray-700' : 'bg-gray-600'}`}>
                <div>
                  <p className="font-bold text-white">{reminder.clientName}</p>
                  <p className="text-sm text-gray-300">Amanhã às {reminder.time} - {reminder.service.name}</p>
                </div>
                {isSent ? (
                  <span className="text-green-400 font-bold">Enviado ✔️</span>
                ) : (
                  <button
                    onClick={() => handleSend(reminder)}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center gap-2"
                  >
                    <WhatsAppIcon className="h-5 w-5 m-0" /> Enviar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClose}
          className="mt-6 w-full bg-gray-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-gray-500 transition duration-300"
        >
          Fechar
        </button>
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
      const appts = await FirestoreService.getAppointments(barberData.id);
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
    const clients = await FirestoreService.getLoyaltyClientsForBarber(barberData.id);
    setLoyaltyClients(clients);
    setIsLoyaltyLoading(false);
  }, [barberData.id]);

  const loadClients = React.useCallback(async () => {
    if (!barberData.id) return;
    setIsLoadingClients(true);
    try {
      const clientsData = await FirestoreService.getClients(barberData.id);
      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      alert("Não foi possível carregar os clientes.");
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
        const newUrl = await FirestoreService.uploadImage(
          barberData.id,
          uploadFile, 
          folder,
          (progress) => setUploadProgress(progress)
        );

        if (activeTab === 'profile') finalEditData.logoUrl = newUrl;
        if (activeTab === 'gallery') finalEditData.src = newUrl;
      }
      
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
      let userMessage = error.message || 'Ocorreu um erro ao salvar. Verifique o console para mais detalhes.';
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
              <LogoutIcon /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
                { id: 'profile', label: 'Perfil da Barbearia', icon: <ShopIcon /> },
                { id: 'visuals', label: 'Personalização Visual', icon: <VisualsIcon /> },
                { id: 'financials', label: 'Financeiro', icon: <ChartBarIcon /> },
                { id: 'clients', label: 'Clientes', icon: <UsersIcon /> },
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
                    barberData={fullBarberData}
                    appointments={fullBarberData.appointments}
                    barberId={fullBarberData.id}
                    onDataUpdate={handleAdminDataUpdate}
                    availability={fullBarberData.availability}
                  />
                )}
                
                {activeTab === 'loyalty' && (
                  <LoyaltyTab 
                    barberId={barberData.id}
                    clients={loyaltyClients}
                    isLoading={isLoyaltyLoading}
                    onRefresh={loadLoyaltyData}
                    shopName={barberData.profile.shopName}
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
  const [isCopied, setIsCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Seu Endereço de Perfil	ex: nomedasuabarbearia</label>
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
        <div key={promotion.id} className="bg-gray-800 rounded-lg p-4 border-l-4 border-primary">
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  
  React.useEffect(() => {
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
  const [view, setView] = React.useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = React.useState<'Todos' | 'Pendente' | 'Confirmado'>('Todos');
  const [showRemindersModal, setShowRemindersModal] = React.useState(false);
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const filteredAppointments = React.useMemo(() => appointments
    .filter(app => filter === 'Todos' || app.status === filter)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
  }), [appointments, filter]);
  
  const pendingReminders = React.useMemo(() => {
    const now = new Date();
    return appointments.filter(app => {
      if (app.status !== 'Confirmado' || app.lembrete24henviado) {
        return false;
      }
      const appointmentTime = new Date(`${app.date}T${app.time}`);
      const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil > 0 && hoursUntil <= 24;
    });
  }, [appointments]);

  const appointmentsByDate = React.useMemo(() => {
    return appointments.reduce((acc, app) => {
        (acc[app.date] = acc[app.date] || []).push(app);
        return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  const calendarData = React.useMemo(() => {
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
  
  const selectedDateAvailability = React.useMemo(() => selectedDate ? (availability[selectedDate] || []).sort() : [], [selectedDate, availability]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold">Agendamentos</h2>
        <div className="flex items-center gap-4">
          {pendingReminders.length > 0 && (
            <button 
              onClick={() => setShowRemindersModal(true)} 
              className="relative bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-300"
            >
              Enviar Lembretes
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {pendingReminders.length}
              </span>
            </button>
          )}
          <div className="flex bg-gray-700 p-1 rounded-lg">
            <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Lista</button>
            <button onClick={() => setView('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'calendar' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Calendário</button>
          </div>
        </div>
      </div>
      
      {view === 'list' ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-start items-center mb-6 gap-2 border-b border-gray-700 pb-4">
            <h3 className="text-lg font-semibold mr-4">Filtrar por status:</h3>
            {(['Todos', 'Pendente', 'Confirmado'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
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
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              const availableSlotsCount = availability[dateString]?.length || 0;
              const bookedSlotsCount = appointmentsByDate[dateString]?.length || 0;

              let dayBgClass = 'bg-gray-700';
              let dayTextColor = 'text-gray-500';
              let hoverBgClass = 'hover:bg-gray-700';
              let isDisabled = true;

              if (bookedSlotsCount > 0) {
                dayBgClass = 'bg-red-900';
                hoverBgClass = 'hover:bg-red-800';
                dayTextColor = 'text-white';
                isDisabled = false;
              } else if (availableSlotsCount > 0) {
                dayBgClass = 'bg-green-900';
                hoverBgClass = 'hover:bg-green-800';
                dayTextColor = 'text-white';
                isDisabled = false;
              }

              if (selectedDate === dateString) {
                dayBgClass = 'bg-primary';
                hoverBgClass = 'hover:bg-primary-dark';
              } else if (isToday) {
                dayBgClass += ' ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400';
              }

              const infoContent = [];
              if (bookedSlotsCount > 0) {
                  infoContent.push(
                      <span key="booked" className="text-xs font-semibold text-red-300">
                          {bookedSlotsCount} agendado{bookedSlotsCount > 1 ? 's' : ''}
                      </span>
                  );
              }
              if (availableSlotsCount > 0) {
                  infoContent.push(
                      <span key="available" className="text-xs font-semibold text-green-300">
                          {availableSlotsCount} livre{availableSlotsCount > 1 ? 's' : ''}
                      </span>
                  );
              }

              return (
                <button
                  key={dayNumber}
                  onClick={() => !isDisabled && handleDateClick(dayNumber)}
                  className={`flex flex-col items-center justify-center h-24 p-2 rounded-lg transition-colors text-lg ${dayBgClass} ${hoverBgClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isDisabled}
                >
                  <span className={`font-bold ${dayTextColor}`}>{dayNumber}</span>
                  <div className="flex flex-col items-center mt-1 space-y-1">
                      {infoContent}
                  </div>
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
      
      {showRemindersModal && (
        <RemindersModal
          reminders={pendingReminders}
          barberId={barberId}
          shopName={barberData.profile.shopName}
          onClose={() => setShowRemindersModal(false)}
          onReminderSent={onDataUpdate}
        />
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
  shopName: string;
}> = ({ barberId, clients, isLoading, onRefresh, shopName }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedClient, setSelectedClient] = React.useState<LoyaltyClient | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = React.useState(false);
  const [updatingClientId, setUpdatingClientId] = React.useState<string | null>(null);

  const rewards = React.useMemo(() => [
    { stars: 5, description: 'Prêmio (Ex: Corte Grátis)' },
  ], []);

  const filteredClients = React.useMemo(() => clients.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientWhatsapp.includes(searchTerm)
  ), [clients, searchTerm]);
  
  const handleAddStar = async (client: LoyaltyClient) => {
    setUpdatingClientId(client.id);
    try {
      const result = await FirestoreService.addStar(
        barberId,
        client.clientWhatsapp,
        client.clientName
      );
      if (result) {
        alert(`⭐ Estrela adicionada para ${client.clientName}! Total: ${result.newStars} de ${result.goal}.`);
        onRefresh();
      } else {
        alert(`❌ Erro ao adicionar estrela para ${client.clientName}.`);
      }
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
      const success = await FirestoreService.redeemStars(
        barberId,
        client.clientWhatsapp,
        client.goal
      );

      if (success) {
        alert(`✅ Prêmio resgatado com sucesso para ${client.clientName}! O saldo de estrelas foi atualizado.`);
        setIsRedeemModalOpen(false);
        onRefresh();
      }
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

// --- NOVOS COMPONENTES PARA GERENCIAMENTO DE CLIENTES ---

// Modal para Criar/Editar Cliente
const ClientFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientFormData, clientId?: string) => Promise<void>;
  client?: Client | null;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSave, client, isLoading }) => {
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


// Aba de Clientes
const ClientsTab: React.FC<{
  barberId: string;
  clients: Client[];
  isLoading: boolean;
  onDataUpdate: () => void;
}> = ({ barberId, clients, isLoading, onDataUpdate }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'lastVisit' | 'totalVisits'>('name');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const clientStats: ClientStats = React.useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newThisMonth = clients.filter(c => c.createdAt?.toDate() >= firstDayOfMonth).length;
    const activeClients = clients.filter(c => c.totalVisits > 0).length;
    const totalVisits = clients.reduce((sum, c) => sum + c.totalVisits, 0);
    const avgVisits = activeClients > 0 ? totalVisits / activeClients : 0;

    return {
      totalClients: clients.length,
      newThisMonth,
      activeClients,
      avgVisits: parseFloat(avgVisits.toFixed(1)),
    };
  }, [clients]);

  const filteredAndSortedClients = React.useMemo(() => {
    return clients
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
        await FirestoreService.updateClient(barberId, clientId, formData);
        alert('Cliente atualizado com sucesso!');
      } else {
        // Create
        await FirestoreService.addClient(barberId, formData);
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
        await FirestoreService.deleteClient(barberId, clientId);
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

// --- NOVA ABA DE PERSONALIZAÇÃO VISUAL ---
const VisualsTab: React.FC<{
    barberData: BarberData;
    onDataUpdate: () => void;
}> = ({ barberData, onDataUpdate }) => {
    const defaultTheme = { primaryColor: '#4F46E5', secondaryColor: '#7C3AED' };
    const [colors, setColors] = React.useState(barberData.profile.theme || defaultTheme);
    const [isSaving, setIsSaving] = React.useState(false);

    const palettes = [
        { name: 'Índigo/Violeta', primary: '#4F46E5', secondary: '#7C3AED' },
        { name: 'Azul/Ciano', primary: '#0EA5E9', secondary: '#14B8A6' },
        { name: 'Verde Esmeralda', primary: '#10B981', secondary: '#34D399' },
        { name: 'Âmbar/Vermelho', primary: '#F59E0B', secondary: '#EF4444' },
        { name: 'Rosa/Roxo', primary: '#EC4899', secondary: '#8B5CF6' },
        { name: 'Índigo/Púrpura', primary: '#6366F1', secondary: '#A855F7' },
    ];

    const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', value: string) => {
        setColors(prev => ({ ...prev, [colorType]: value }));
    };

    const handleSaveTheme = async () => {
        setIsSaving(true);
        try {
            const updatedProfile = {
                ...barberData.profile,
                theme: colors,
            };
            const success = await FirestoreService.updateBarberProfile(barberData.id, updatedProfile);
            if (success) {
                alert('Tema salvo com sucesso!');
                onDataUpdate();
            } else {
                throw new Error('Falha ao salvar o tema.');
            }
        } catch (error) {
            console.error("Erro ao salvar tema:", error);
            alert("Não foi possível salvar o tema.");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Personalização Visual</h2>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Cores do Tema</h3>
                <p className="text-gray-400 mb-6">Personalize as cores da sua página de agendamentos.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {palettes.map(palette => (
                        <button key={palette.name} onClick={() => setColors({ primaryColor: palette.primary, secondaryColor: palette.secondary })} className="bg-gray-700 p-3 rounded-lg text-center hover:bg-gray-600 transition-all">
                            <div className="h-10 rounded-md mb-2" style={{ background: `linear-gradient(to right, ${palette.primary}, ${palette.secondary})` }}></div>
                            <span className="text-sm">{palette.name}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cor Primária</label>
                        <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                            <input type="color" value={colors.primaryColor} onChange={e => handleColorChange('primaryColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                            <input type="text" value={colors.primaryColor} onChange={e => handleColorChange('primaryColor', e.target.value)} className="w-full bg-transparent text-white focus:outline-none" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cor Secundária</label>
                         <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                            <input type="color" value={colors.secondaryColor} onChange={e => handleColorChange('secondaryColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                            <input type="text" value={colors.secondaryColor} onChange={e => handleColorChange('secondaryColor', e.target.value)} className="w-full bg-transparent text-white focus:outline-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prévia</label>
                    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <div className="h-12 rounded-lg" style={{ background: `linear-gradient(to right, ${colors.primaryColor}, ${colors.secondaryColor})` }}></div>
                    </div>
                </div>
            </div>

            <button onClick={handleSaveTheme} disabled={isSaving} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-green-700 disabled:bg-gray-500 transition duration-300">
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
    );
};

// --- NOVA ABA FINANCEIRA E COMPONENTES ---

const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Transaction, 'id' | 'barberId' | 'createdAt' | 'type'>) => Promise<void>;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSave, isLoading }) => {
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


const FinancialsTab: React.FC<{
  barberId: string;
  appointments: Appointment[];
  onDataUpdate: () => void;
}> = ({ barberId, onDataUpdate }) => {
  type Period = 'week' | 'month' | 'quarter' | 'year';
  const [period, setPeriod] = React.useState<Period>('month');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [transactionFilter, setTransactionFilter] = React.useState<'Todas' | 'Receitas' | 'Despesas'>('Todas');

  const { startDate, endDate } = React.useMemo(() => {
    const end = new Date();
    let start = new Date();
    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 6);
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
    }
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [period]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FirestoreService.getTransactions(barberId, startDate, endDate);
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

    transactions.forEach(t => {
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
    if (transactionFilter === 'Todas') return transactions;
    const type = transactionFilter === 'Receitas' ? 'receita' : 'despesa';
    return transactions.filter(t => t.type === type);
  }, [transactions, transactionFilter]);

  const handleSaveExpense = async (expenseData: Omit<Transaction, 'id' | 'barberId' | 'createdAt' | 'type'>) => {
    setIsSaving(true);
    try {
      await FirestoreService.addTransaction(barberId, { ...expenseData, type: 'despesa' });
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
  
  if (isLoading) return <LoadingSpinner message="Carregando dados financeiros..." />;

  return (
    <div className="space-y-6">
      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} isLoading={isSaving} />

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Financeiro</h2>
          <p className="text-gray-400">Controle de receitas e despesas.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Exportar</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <PlusIcon className="h-4 w-4"/> Nova Despesa
            </button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-2 rounded-lg flex flex-wrap gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  { {week: 'Última Semana', month: 'Este Mês', quarter: 'Último Trimestre', year: 'Este Ano'}[p] }
              </button>
          ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg flex items-start gap-4"><div className="bg-green-500/20 p-3 rounded-full"><TrendingUpIcon className="text-green-400"/></div><div><p className="text-sm text-gray-400">Receita Total</p><p className="text-2xl font-bold">R$ {financials.totalRevenue.toFixed(2)}</p></div></div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start gap-4"><div className="bg-red-500/20 p-3 rounded-full"><ArrowSmDownIcon className="text-red-400"/></div><div><p className="text-sm text-gray-400">Despesas</p><p className="text-2xl font-bold">R$ {financials.totalExpenses.toFixed(2)}</p></div></div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start gap-4"><div className="bg-blue-500/20 p-3 rounded-full"><ShopIcon className="text-blue-400"/></div><div><p className="text-sm text-gray-400">Lucro Líquido</p><p className="text-2xl font-bold">R$ {financials.netProfit.toFixed(2)}</p></div></div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start gap-4"><div className="bg-purple-500/20 p-3 rounded-full"><StarIcon className="text-purple-400"/></div><div><p className="text-sm text-gray-400">Margem de Lucro</p><p className="text-2xl font-bold">{financials.profitMargin.toFixed(0)}%</p></div></div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Transações</h3>
          <div className="flex gap-2 mb-4 border-b border-gray-700 pb-4">
              {(['Todas', 'Receitas', 'Despesas'] as const).map(f => (
                  <button key={f} onClick={() => setTransactionFilter(f)} className={`px-3 py-1 text-sm rounded-full ${transactionFilter === f ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>{f}</button>
              ))}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                      <div>
                          <p className="font-semibold">{t.description}</p>
                          <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {t.paymentMethod || t.category}</p>
                      </div>
                      <p className={`font-bold text-lg ${t.type === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </p>
                  </div>
              )) : (
                  <div className="text-center py-10 text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Nenhuma transação encontrada</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};