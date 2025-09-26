import React, { useState, useCallback, useMemo, ChangeEvent, useEffect } from 'react';
import type { Promotion, GalleryImage, Service, Appointment, BarberData } from './types';
import { FirestoreService } from './firestoreService.ts';
import { auth } from './firebaseConfig';

// --- Dados Mock para fallback/desenvolvimento ---
const createMockData = (): BarberData => ({
  id: 'mock-barber',
  profile: {
    shopName: 'Barbearia Exemplo',
    location: 'Av. Principal, 123, Centro, Sua Cidade - SC',
    logoUrl: 'https://via.placeholder.com/200x80.png?text=SUA+LOGO',
    whatsappNumber: '5541995343245',
    slug: 'barbearia-exemplo',
    isActive: true
  },
  promotions: [
    { id: '1', title: 'Corte & Barba', description: 'Combo com 10% de desconto' },
    { id: '2', title: 'Dia do Amigo', description: 'Traga um amigo e ganhe 15% off' }
  ],
  galleryImages: [
    { id: '1', src: 'https://picsum.photos/seed/barber1/600/400', alt: 'Corte moderno' },
    { id: '2', src: 'https://picsum.photos/seed/barber2/600/400', alt: 'Barba estilizada' }
  ],
  services: [
    { id: '1', name: 'Corte Cabelo', price: 50.00 },
    { id: '2', name: 'Barba', price: 30.00 },
    { id: '3', name: 'Cabelo + Barba', price: 75.00 }
  ],
  appointments: [],
  availability: FirestoreService.generateInitialAvailability()
});

// --- Helper para rolagem suave ---
const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// --- Função para obter slug da URL ---
const getBarberSlugFromUrl = (): string | null => {
  // Em ambiente real, ler da URL: window.location.pathname.slice(1)
  // Para teste, usar slug fixo ou deixar null para modo desenvolvimento
  return 'barbearia-exemplo';
};

// === ÍCONES SVG (mantidos do código original) ===
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const WhatsAppIcon = ({className = "h-5 w-5 mr-2"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.3 2.2C5.7 2.2 2 5.9 2 10.5c0 1.6.4 3.1 1.3 4.4L2 20l5.2-1.3c1.3.8 2.8 1.2 4.4 1.2 4.6 0 8.3-3.7 8.3-8.3S14.9 2.2 10.3 2.2zM10.3 18.1c-1.4 0-2.8-.4-4-1.2l-.3-.2-3 .8.8-2.9-.2-.3c-.8-1.2-1.3-2.7-1.3-4.2 0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5zm3.2-4.9c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1s-.5.6-.6.7c-.1.1-.2.2-.4.1-.2 0-.8-.3-1.5-.9s-1.1-1.3-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1 0-.3-.1-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3s-.7.7-.7 1.6.7 1.9 1.4 2.6c1.1 1.1 2.1 1.7 3.3 1.7.2 0 .4 0 .6-.1.6-.2 1.1-.7 1.2-1.3.1-.6.1-1.1 0-1.2-.1-.1-.3-.2-.5-.3z" /></svg>;
const ScissorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.293 5.293a1 1 0 011.414 1.414l-10 10a1 1 0 01-1.414-1.414l10-10zM5.707 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414L7.121 6.707a1 1 0 01-1.414 0zM9 12a1 1 0 10-2 0 1 1 0 002 0zm-1-5.414l-3-3a1 1 0 10-1.414 1.414L6.586 8H5a1 1 0 000 2h2.586l4 4H10a1 1 0 100 2h1a1 1 0 001-1v-1.586l-4-4V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2h2v2H6V6zm4 0h2v2h-2V6zM6 9h2v2H6V9zm4 0h2v2h-2V9z" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>;

// === COMPONENTES ===

// Loading Spinner
const LoadingSpinner = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="flex h-screen items-center justify-center bg-gray-900">
    <div className="flex flex-col items-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-red-600"></div>
      <p className="text-white mt-4">{message}</p>
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
            target.src = 'https://via.placeholder.com/200x80.png?text=LOGO';
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
                target.src = 'https://via.placeholder.com/400x300/6b7280/ffffff?text=Imagem';
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
              <ScissorsIcon /> Serviço
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
              <CalendarIcon /> Data
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
                <ClockIcon /> Horário
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
              <CreditCardIcon /> Forma de Pagamento
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
        <MapPinIcon /> {location}
      </p>
      <p className="text-sm">
        &copy; {new Date().getFullYear()} {shopName}. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

// Modal de Login
const LoginModal: React.FC<{
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  error: string;
}> = ({ onClose, onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-md m-4">
        <h2 className="text-3xl font-bold text-center mb-6">Acesso do Barbeiro</h2>
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
            placeholder="Senha"
            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300 disabled:bg-gray-500"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
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
      </div>
    </div>
  );
};

// Painel Administrativo Simplificado (pode ser expandido depois)
const AdminPanel: React.FC<{
  barberData: BarberData;
  onLogout: () => void;
  onDataUpdate: () => void;
}> = ({ barberData, onLogout, onDataUpdate }) => (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      <button 
        onClick={onLogout}
        className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
      >
        <LogoutIcon /> Sair
      </button>
    </header>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Agendamentos Recentes</h2>
      {barberData.appointments.length > 0 ? (
        <div className="space-y-4">
          {barberData.appointments.slice(0, 10).map(appointment => (
            <div key={appointment.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold">{appointment.clientName}</p>
                <p className="text-sm text-gray-300">
                  {appointment.serviceName} - {new Date(appointment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {appointment.time}
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

// COMPONENTE PRINCIPAL
const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [barberData, setBarberData] = useState<BarberData | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [useMockData, setUseMockData] = useState(false);

  // Carregar dados do barbeiro
  const loadBarberData = useCallback(async (barberId: string) => {
    try {
      const data = await FirestoreService.loadBarberData(barberId);
      if (data) {
        setBarberData(data);
        setUseMockData(false);
      } else {
        // Fallback para dados mock em desenvolvimento
        console.log('Usando dados mock para desenvolvimento');
        setBarberData(createMockData());
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Fallback para dados mock
      setBarberData(createMockData());
      setUseMockData(true);
    }
  }, []);

  // Inicialização
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Observar estado de autenticação
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
          setUser(currentUser);
          
          if (currentUser) {
            // Usuário logado - carregar dados do barbeiro
            await loadBarberData(currentUser.uid);
            setView('admin');
          } else {
            // Usuário não logado - carregar por slug público
            setView('client');
            const slug = getBarberSlugFromUrl();
            
            if (slug) {
              try {
                const barberId = await FirestoreService.findBarberBySlug(slug);
                if (barberId) {
                  await loadBarberData(barberId);
                } else {
                  // Slug não encontrado, usar dados mock
                  setBarberData(createMockData());
                  setUseMockData(true);
                }
              } catch (error) {
                // Erro ao buscar slug, usar dados mock
                setBarberData(createMockData());
                setUseMockData(true);
              }
            } else {
              // Sem slug, usar dados mock
              setBarberData(createMockData());
              setUseMockData(true);
            }
          }
          
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setBarberData(createMockData());
        setUseMockData(true);
        setLoading(false);
      }
    };

    initializeApp();
  }, [loadBarberData]);

  // Handlers
  const handleAdminAreaClick = () => {
    if (user) {
      setView('admin');
    } else {
      setLoginError('');
      setShowLoginModal(true);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      setShowLoginModal(false);
      setView('admin');
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Email ou senha inválidos. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setView('client');
  };

  const handleBookingSuccess = () => {
    // Recarregar dados após agendamento bem-sucedido
    if (barberData && !useMockData) {
      loadBarberData(barberData.id);
    }
  };

  // Renderização
  if (loading) {
    return <LoadingSpinner message="Carregando barbearia..." />;
  }

  if (!barberData) {
    return <NotFound />;
  }

  // Vista administrativa
  if (view === 'admin' && user) {
    return (
      <AdminPanel 
        barberData={barberData} 
        onLogout={handleLogout}
        onDataUpdate={() => loadBarberData(user.uid)}
      />
    );
  }

  // Vista do cliente
  return (
    <div className="bg-white">
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          error={loginError}
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
      
      {useMockData && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold">
          Modo de Desenvolvimento (Dados Mock)
        </div>
      )}
    </div>
  );
};

export default App;