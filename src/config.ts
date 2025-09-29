// FIX: Removed duplicated React rendering code from this config file.
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

// Helper para obter slug da URL - VERSÃO OTIMIZADA
export const getBarberSlugFromUrl = (): string | null => {
  // Pegar o pathname sem a barra inicial
  const path = window.location.pathname.slice(1);
  
  // Paths que devem ser ignorados (não são slugs de barbeiro)
  const ignoredPaths = ['admin', 'api', 'static', '_next', '', 'favicon.ico'];
  
  // Se o path está vazio ou é um path ignorado, retornar null
  if (!path || ignoredPaths.includes(path)) {
    return null;
  }
  
  // Para paths multi-parte (ex: slug/admin), pegar apenas a primeira parte
  const slugPart = path.split('/')[0];
  
  // Validar se o slug é válido (apenas letras, números e hifens)
  const isValidSlug = /^[a-z0-9-]+$/i.test(slugPart);
  
  if (isValidSlug && slugPart.length > 0) {
    return slugPart.toLowerCase();
  }
  
  return null;
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

// Novo helper para navegação programática
export const navigateToBarber = (slug: string) => {
  const url = `${APP_CONFIG.BASE_URL}/${slug}`;
  window.location.href = url;
};

// Novo helper para compartilhamento
export const getBarberUrl = (slug: string): string => {
  return `${APP_CONFIG.BASE_URL}/${slug}`;
};

// Helper para detectar se está na página principal
export const isHomePage = (): boolean => {
  const path = window.location.pathname;
  return path === '/' || path === '';
};
