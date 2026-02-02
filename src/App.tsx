import * as React from 'react';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { BarberService } from './firestoreService';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { NotFound } from './components/common/NotFound';
import { ConnectionError } from './components/common/ConnectionError';
import { ThemeStyles } from './components/common/ThemeStyles';
import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { Footer } from './components/layout/Footer';
import { Promotions } from './components/features/Promotions';
import { ServicesList } from './components/features/ServicesList';
import { Gallery } from './components/features/Gallery';
import { BookingForm } from './components/features/BookingForm';
import { LoginModal } from './components/auth/LoginModal';
import { UnauthorizedAccess } from './components/auth/UnauthorizedAccess';
import { AdminPanel } from './components/admin/AdminPanel';
import { scrollToSection } from './utils/ui';
import type { BarberData, SignUpData } from './types';

const App: React.FC = () => {
  const [slug, setSlug] = React.useState<string>('');
  const [barberData, setBarberData] = React.useState<BarberData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const handleLogin = async (email: string, pass: string) => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, pass);
      setShowLoginModal(false);
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = "Erro ao fazer login.";
      if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (err.code === 'auth/invalid-email') msg = "Email inválido.";
      setAuthError(msg);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      setAuthError('');
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      
      // Criar perfil do barbeiro
      await BarberService.create({
        id: userCred.user.uid,
        profile: {
          shopName: data.shopName,
          slug: data.shopName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
          location: data.location,
          whatsappNumber: data.whatsappNumber,
          isActive: true,
          userID: userCred.user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        promotions: [],
        galleryImages: [],
        services: [],
        appointments: [],
        availability: {}
      });
      
      setShowLoginModal(false);
      // Redirecionar ou recarregar para pegar o novo slug
      window.location.href = `/${data.shopName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')}`;
    } catch (err: any) {
      console.error("Signup error:", err);
      setAuthError(err.message || "Erro ao criar conta.");
    }
  };

  // Detectar slug da URL
  React.useEffect(() => {
    const path = window.location.pathname.substring(1);
    const slugFromUrl = path.split('/')[0];
    
    if (slugFromUrl && slugFromUrl !== 'admin') {
      setSlug(slugFromUrl);
    } else {
      // Slug padrão para desenvolvimento ou redirecionamento
      setSlug('barbearia-modelo');
    }
  }, []);

  // Monitorar estado de autenticação
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Carregar dados da barbearia
  const loadBarberData = React.useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await BarberService.getBySlug(slug);
      
      if (data) {
        // Transformar dados do Firestore para o formato esperado pela aplicação
        // BarberService.getBySlug retorna { id, profile, availability }
        // Precisamos buscar subcoleções para montar o objeto BarberData completo para o frontend
        
        // Carregamento paralelo das subcoleções públicas
        const [services, promotions, gallery] = await Promise.all([
          import('./firestoreService').then(m => m.ServiceService.getAll(data.id)),
          import('./firestoreService').then(m => m.PromotionService.getAll(data.id)),
          import('./firestoreService').then(m => m.GalleryService.getAll(data.id))
        ]);

        setBarberData({
          id: data.id,
          profile: data.profile,
          services,
          promotions,
          gallery,
          availability: data.availability
        });
      } else {
        setError('Barbearia não encontrada');
      }
    } catch (err) {
      console.error('Erro ao carregar barbearia:', err);
      setError('Erro de conexão ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    loadBarberData();
  }, [loadBarberData]);

  // Se estiver carregando auth ou dados iniciais
  if (authLoading || (loading && !barberData && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner message="Carregando..." />
      </div>
    );
  }

  // Se houver erro de conexão ou não encontrado
  if (error) {
    if (error === 'Barbearia não encontrada') {
      return <NotFound />;
    }
    return <ConnectionError onRetry={loadBarberData} />;
  }

  // Se não houver dados carregados (caso raro após loading)
  if (!barberData) {
    return <NotFound />;
  }

  // Verificar se é o dono da barbearia logado
  const isOwner = currentUser && currentUser.uid === barberData.id;

  // Renderizar Painel Administrativo se for dono
  if (isOwner) {
    return (
      <AdminPanel 
        barberData={barberData} 
        onLogout={() => signOut(auth)} 
        onDataUpdate={loadBarberData} 
      />
    );
  }

  // Renderizar Página Pública
  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen">
      <ThemeStyles theme={barberData.profile.theme} />
      
      <Header 
        shopName={barberData.profile.shopName} 
        logoUrl={barberData.profile.logoUrl}
        onAdminClick={() => {
          if (currentUser) {
            // Se logado mas não é dono, mostra erro
            alert('Você não tem permissão para administrar esta barbearia.');
          } else {
            setShowLoginModal(true);
          }
        }}
      />
      
      <Hero shopName={barberData.profile.shopName} />
      
      <Promotions promotions={barberData.promotions} />
      
      <ServicesList services={barberData.services} />
      
      <Gallery images={barberData.gallery} />
      
      <BookingForm 
        services={barberData.services}
        availability={barberData.availability}
        barberData={barberData}
        onBookingSuccess={() => {
          // Opcional: Recarregar disponibilidade ou mostrar feedback
        }}
      />
      
      <Footer 
        shopName={barberData.profile.shopName} 
        location={barberData.profile.location} 
      />

      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          error={authError}
          clearError={() => setAuthError('')}
        />
      )}
      
      {/* Se logado mas tentando acessar admin de outra barbearia */}
      {currentUser && !isOwner && showLoginModal && (
        <UnauthorizedAccess 
          userEmail={currentUser.email}
          attemptedSlug={slug}
          onLogout={() => {
            signOut(auth);
            setShowLoginModal(false);
          }} 
        />
      )}
    </div>
  );
};

export default App;
