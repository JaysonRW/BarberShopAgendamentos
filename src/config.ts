// Configurações da aplicação
export const APP_CONFIG = {
  // URLs e rotas
  BASE_URL: window.location.origin,
  ADMIN_PATH: '/admin',
  
  // Configurações de desenvolvimento
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  MOCK_DATA_FALLBACK: true,
  
  // Configurações do Firebase
  FIREBASE_CONFIG: {
    projectId: 'barbershop-agendamentos',
    authDomain: 'barbershop-agendamentos.firebaseapp.com'
  },
  
  // Configurações de fallback
  FALLBACK_BARBER_SLUG: 'barbearia-exemplo',
  
  // Mensagens de erro
  ERROR_MESSAGES: {
    CONNECTION_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
    BARBER_NOT_FOUND: 'Barbearia não encontrada. O link que você acessou não existe ou foi removido.',
    FIREBASE_ERROR: 'Ocorreu um erro inesperado ao carregar os dados. Por favor, tente novamente mais tarde.',
    AUTH_ERROR: 'Email ou senha inválidos. Tente novamente.'
  }
};

// Helper para obter slug da URL
export const getBarberSlugFromUrl = (): string | null => {
  const path = window.location.pathname.slice(1);
  if (path && path !== '' && path !== 'admin') {
    return path;
  }
  return APP_CONFIG.FALLBACK_BARBER_SLUG;
};

// Helper para verificar se está em modo admin
export const isAdminPath = (): boolean => {
  return window.location.pathname.includes('/admin');
};

// Helper para debug
export const debugLog = (message: string, data?: any) => {
  if (APP_CONFIG.DEBUG_MODE) {
    console.log(`🐛 [DEBUG] ${message}`, data || '');
  }
};
