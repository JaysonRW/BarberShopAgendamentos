
import React, { useState, useCallback, useMemo, ChangeEvent } from 'react';
import type { Promotion, GalleryImage, Service, Appointment } from './types';
import { BARBER_WHATSAPP_NUMBER, PROMOTIONS_DATA, GALLERY_IMAGES_DATA, TIME_SLOTS, SERVICES_DATA } from './constants';

// --- Helper para rolagem suave ---
const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// --- Ícones SVG ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const WhatsAppIcon = ({className = "h-5 w-5 mr-2"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.3 2.2C5.7 2.2 2 5.9 2 10.5c0 1.6.4 3.1 1.3 4.4L2 20l5.2-1.3c1.3.8 2.8 1.2 4.4 1.2 4.6 0 8.3-3.7 8.3-8.3S14.9 2.2 10.3 2.2zM10.3 18.1c-1.4 0-2.8-.4-4-1.2l-.3-.2-3  .8.8-2.9-.2-.3c-.8-1.2-1.3-2.7-1.3-4.2 0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5zm3.2-4.9c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1s-.5.6-.6.7c-.1.1-.2.2-.4.1-.2 0-.8-.3-1.5-.9s-1.1-1.3-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1 0-.3-.1-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3s-.7.7-.7 1.6.7 1.9 1.4 2.6c1.1 1.1 2.1 1.7 3.3 1.7.2 0 .4 0 .6-.1.6-.2 1.1-.7 1.2-1.3.1-.6.1-1.1 0-1.2-.1-.1-.3-.2-.5-.3z" /></svg>;
const ScissorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.293 5.293a1 1 0 011.414 1.414l-10 10a1 1 0 01-1.414-1.414l10-10zM5.707 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414L7.121 6.707a1 1 0 01-1.414 0zM9 12a1 1 0 10-2 0 1 1 0 002 0zm-1-5.414l-3-3a1 1 0 10-1.414 1.414L6.586 8H5a1 1 0 000 2h2.586l4 4H10a1 1 0 100 2h1a1 1 0 001-1v-1.586l-4-4V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2h2v2H6V6zm4 0h2v2h-2V6zM6 9h2v2H6V9zm4 0h2v2h-2V9z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const UploadIcon = () => <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4 4-4-4h3v-4h2v4z" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

// --- Ícones para 'Como Funciona' ---
const CalendarDaysIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PencilSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const WhatsAppConfirmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;


// --- Componente Header ---
const Header: React.FC<{ onAdminClick: () => void; logoUrl: string }> = ({ onAdminClick, logoUrl }) => {
    return (
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50" style={{backgroundColor: '#111827'}}>
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
             <img src={logoUrl} alt="Logo da Barbearia" className="h-12 w-auto" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <button onClick={() => scrollToSection('promocoes')} className="bg-transparent border-none p-0 cursor-pointer hover:text-red-500 transition duration-300">Promoções</button>
            <button onClick={() => scrollToSection('galeria')} className="bg-transparent border-none p-0 cursor-pointer hover:text-red-500 transition duration-300">Galeria</button>
            <button onClick={() => scrollToSection('como-funciona')} className="bg-transparent border-none p-0 cursor-pointer hover:text-red-500 transition duration-300">Como Funciona</button>
            <button onClick={() => scrollToSection('localizacao')} className="bg-transparent border-none p-0 cursor-pointer hover:text-red-500 transition duration-300">Localização</button>
            <button onClick={() => scrollToSection('agendamento')} className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 text-center">AGENDAR<br/>AGORA</button>
          </nav>
          <button onClick={onAdminClick} className="text-sm border border-red-600 px-3 py-2 rounded-md hover:bg-red-600 transition duration-300 text-center">
            Área do<br/>Barbeiro
          </button>
        </div>
      </header>
    );
};

// --- Componente Hero ---
const Hero = () => (
  <section className="bg-gray-800 text-white bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://i.ibb.co/pBBb2bKJ/Image-fx.png')" }}>
    <div className="container mx-auto px-6 py-32 text-center">
      <h2 className="text-5xl md:text-7xl font-anton uppercase tracking-widest">Estilo & Precisão</h2>
      <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">Sua aparência é nosso cartão de visita. Agende seu horário e experimente o melhor serviço da cidade.</p>
      <button onClick={() => scrollToSection('agendamento')} className="mt-8 inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transform hover:scale-105 transition duration-300">
        Agendar Horário
      </button>
    </div>
  </section>
);

// --- Componente Promoções ---
const Promotions: React.FC<{ promotions: Promotion[] }> = ({ promotions }) => (
  <section id="promocoes" className="py-20 bg-gray-100">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-anton text-center mb-12 uppercase text-gray-800">Nossas <span className="text-red-600">Promoções</span></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-xl p-8 transform hover:-translate-y-2 transition duration-300 border-l-4 border-red-600">
            <h3 className="text-2xl font-bold font-anton text-gray-900">{promo.title}</h3>
            <p className="mt-4 text-gray-600">{promo.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Componente Galeria ---
const Gallery: React.FC<{ images: GalleryImage[] }> = ({ images }) => (
  <section id="galeria" className="py-20 bg-gray-900">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-anton text-center mb-12 uppercase text-white">Nossos <span className="text-red-600">Trabalhos</span></h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.id} className="overflow-hidden rounded-lg shadow-lg">
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover transform hover:scale-110 transition duration-500 cursor-pointer" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Componente Como Funciona ---
const HowItWorks = () => (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-anton text-center mb-16 uppercase text-gray-800">Como <span className="text-red-600">Funciona</span></h2>
        <div className="relative">
          {/* Linha pontilhada para desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0 z-0 transform -translate-y-1/2">
             <div className="border-t-2 border-dashed border-gray-300 w-2/3 mx-auto"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-8 z-10">
            
            <div className="w-full md:w-1/3 text-center bg-white p-8 rounded-lg shadow-xl flex flex-col items-center border-t-4 border-red-600 transform hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center justify-center mb-4">
                 <CalendarDaysIcon />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 font-anton">1. ESCOLHA O HORÁRIO</h3>
              <p className="text-gray-600">Selecione o melhor dia e horário para você em nossa agenda online.</p>
            </div>
            
            <div className="w-full md:w-1/3 text-center bg-white p-8 rounded-lg shadow-xl flex flex-col items-center border-t-4 border-red-600 transform hover:-translate-y-2 transition-transform duration-300">
               <div className="flex items-center justify-center mb-4">
                 <PencilSquareIcon />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 font-anton">2. PREENCHA SEUS DADOS</h3>
              <p className="text-gray-600">Informe seu nome e WhatsApp para entrarmos em contato.</p>
            </div>
            
            <div className="w-full md:w-1/3 text-center bg-white p-8 rounded-lg shadow-xl flex flex-col items-center border-t-4 border-red-600 transform hover:-translate-y-2 transition-transform duration-300">
               <div className="flex items-center justify-center mb-4">
                  <WhatsAppConfirmIcon />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 font-anton">3. RECEBA A CONFIRMAÇÃO</h3>
              <p className="text-gray-600">A solicitação vai direto para o barbeiro e você recebe a confirmação!</p>
            </div>
  
          </div>
        </div>
      </div>
    </section>
  );

// --- Componente Agendamento ---
const BookingForm: React.FC<{ 
    services: Service[]; 
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    availability: Record<string, string[]>;
}> = ({ services, setAppointments, availability }) => {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [whatsapp, setWhatsapp] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [clientConfirmUrl, setClientConfirmUrl] = useState<string>('');

    const PAYMENT_METHODS = ['Débito', 'Crédito', 'PIX', 'Dinheiro'];
    const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
  
    const availableDates = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];
        
        return Object.keys(availability)
            .filter(date => date >= todayString && availability[date] && availability[date].length > 0)
            .sort();
    }, [availability]);

    const availableTimesForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return availability[selectedDate] || [];
    }, [selectedDate, availability]);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setSelectedTime(''); // Reset time when date changes
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime || !name || !whatsapp || !selectedService || !selectedPayment) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const formattedDate = new Date(selectedDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const servicePriceFormatted = `R$ ${selectedService.price.toFixed(2).replace('.', ',')}`;

        const barberMessage = `*Novo Agendamento*\n\n*Cliente:* ${name}\n*Serviço:* ${selectedService.name} (${servicePriceFormatted})\n*Data:* ${formattedDate}\n*Hora:* ${selectedTime}\n*Pagamento:* ${selectedPayment}\n*WhatsApp:* ${whatsapp}`;
        const barberUrl = `https://wa.me/${BARBER_WHATSAPP_NUMBER}?text=${encodeURIComponent(barberMessage)}`;

        const clientMessage = `Olá, ${name}! Sua solicitação de agendamento para *${selectedService.name}* no valor de *${servicePriceFormatted}* no dia *${formattedDate}* às *${selectedTime}* foi enviada com sucesso.\n\nForma de pagamento escolhida: *${selectedPayment}*.\n\nEm breve o barbeiro entrará em contato para confirmar. Obrigado!`;
        const clientUrl = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(clientMessage)}`;
        
        const newAppointment: Appointment = {
            id: Date.now(),
            clientName: name,
            clientWhatsapp: whatsapp,
            service: selectedService,
            date: selectedDate,
            time: selectedTime,
            paymentMethod: selectedPayment,
            status: 'Pendente',
        };
        setAppointments(prev => [newAppointment, ...prev]);

        setClientConfirmUrl(clientUrl);
        setShowSuccess(true);
        window.open(barberUrl, '_blank');

        setSelectedDate('');
        setSelectedTime('');
        setSelectedServiceId(null);
        setSelectedPayment('');
        setName('');
        setWhatsapp('');
    };
    
    return (
        <section id="agendamento" className="py-20 bg-gray-100">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-anton text-center mb-12 uppercase text-gray-800">Agende seu <span className="text-red-600">Horário</span></h2>
                
                {showSuccess ? (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold mb-2">Solicitação Enviada!</h3>
                        <p className="mb-4">Sua solicitação foi enviada para o barbeiro. Clique no botão abaixo para receber sua confirmação no WhatsApp.</p>
                        <a 
                            href={clientConfirmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition duration-300"
                        >
                            <WhatsAppIcon /> Confirmar no Meu WhatsApp
                        </a>
                        <button onClick={() => setShowSuccess(false)} className="mt-4 block mx-auto text-sm text-gray-600 hover:text-gray-800">Fazer novo agendamento</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-6">
                        
                        <div>
                            <label className="block text-gray-800 font-bold mb-3 flex items-center"><ScissorsIcon /> Serviço</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {services.map(service => (
                                    <button key={service.id} type="button" onClick={() => setSelectedServiceId(service.id)} className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${selectedServiceId === service.id ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-red-200'}`}>
                                        {service.name}
                                        <span className="block text-xs opacity-80">R$ {service.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-800 font-bold mb-3 flex items-center"><CalendarIcon /> Data</label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {availableDates.map(date => (
                                    <button key={date} type="button" onClick={() => handleDateSelect(date)} className={`p-3 border rounded-lg text-center transition duration-300 ${selectedDate === date ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-red-200'}`}>
                                        {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC'})}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDate && (
                             <div>
                                <label className="block text-gray-800 font-bold mb-3 flex items-center"><ClockIcon /> Horário</label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {TIME_SLOTS.map(time => {
                                        const isAvailable = availableTimesForSelectedDate.includes(time);
                                        return (
                                            <button key={time} type="button" onClick={() => isAvailable && setSelectedTime(time)} disabled={!isAvailable} className={`p-3 border rounded-lg transition duration-300 ${selectedTime === time ? 'bg-red-600 text-white shadow-md' : isAvailable ? 'bg-gray-100 text-gray-700 hover:bg-red-200' : 'bg-gray-200 text-gray-400 line-through cursor-not-allowed'}`}>
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                                {availableTimesForSelectedDate.length === 0 && <p className="text-center text-gray-500 mt-2">Nenhum horário disponível para esta data.</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div>
                                <label className="block text-gray-800 font-bold mb-2" htmlFor="name">Nome Completo</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900" required/>
                            </div>
                            <div>
                                <label className="block text-gray-800 font-bold mb-2" htmlFor="whatsapp">Nº de WhatsApp</label>
                                <input id="whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ex: 5511999998888" className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900" required/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-800 font-bold mb-3 flex items-center"><CreditCardIcon /> Forma de Pagamento</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {PAYMENT_METHODS.map(method => (
                                    <button key={method} type="button" onClick={() => setSelectedPayment(method)} className={`p-3 border rounded-lg text-center transition duration-300 text-sm font-medium ${selectedPayment === method ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-red-200'}`}>
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-lg text-lg uppercase hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          disabled={!selectedDate || !selectedTime || !name || !whatsapp || !selectedServiceId || !selectedPayment}>
                            Solicitar Agendamento
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

// --- Componente Localização ---
const Location: React.FC<{ address: string }> = ({ address }) => {
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    return (
        <section id="localizacao" className="py-20 bg-gray-900">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-anton uppercase mb-4 text-white">Nossa <span className="text-red-600">Localização</span></h2>
                <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-300">{address}</p>
                <a 
                    href={gmapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transform hover:scale-105 transition duration-300"
                >
                    <MapPinIcon />
                    Ver no Google Maps
                </a>
            </div>
        </section>
    );
};


// --- Componente Footer ---
const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-8">
    <div className="container mx-auto px-6 text-center">
      <p>&copy; {new Date().getFullYear()} Barber Shop uma plataforma criada por Propagounegocios. Todos os direitos reservados.</p>
      <p className="text-sm mt-2">Feito com estilo para barbeiros de estilo.</p>
    </div>
  </footer>
);

// --- Componente Admin ---
const AdminPanel: React.FC<{
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  images: GalleryImage[];
  setImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  availability: Record<string, string[]>;
  setAvailability: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  onClientClick: () => void;
}> = ({ promotions, setPromotions, images, setImages, services, setServices, logoUrl, setLogoUrl, location, setLocation, appointments, setAppointments, availability, setAvailability, onClientClick }) => {
    
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [logoPreview, setLogoPreview] = useState(logoUrl);
  const [currentLocation, setCurrentLocation] = useState(location);

  const availabilityDates = useMemo(() => Object.keys(availability).sort(), [availability]);

  const handleToggleAvailability = (date: string, time: string) => {
    setAvailability(prev => {
        const newAvailability = { ...prev };
        const daySlots = newAvailability[date] || [];
        if (daySlots.includes(time)) {
            newAvailability[date] = daySlots.filter(t => t !== time);
        } else {
            newAvailability[date] = [...daySlots, time].sort((a, b) => a.localeCompare(b));
        }
        return newAvailability;
    });
  };

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione um arquivo de imagem JPG ou PNG.');
    }
  };

  const handleUpdateLogo = (e: React.FormEvent) => {
    e.preventDefault();
    setLogoUrl(logoPreview);
    alert('Logo atualizado com sucesso!');
  };
  
  const handleUpdateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(currentLocation);
    alert('Endereço atualizado com sucesso!');
  };

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: Promotion = { id: Date.now(), title: promoTitle, description: promoDesc };
    setPromotions([...promotions, newPromo]);
    setPromoTitle('');
    setPromoDesc('');
  };
  
  const handleRemovePromotion = (id: number) => {
    setPromotions(promotions.filter(p => p.id !== id));
  };
  
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    const newImage: GalleryImage = { id: Date.now(), src: imageUrl, alt: imageAlt || 'Imagem da galeria' };
    setImages([...images, newImage]);
    setImageUrl('');
    setImageAlt('');
  };
  
  const handleRemoveImage = (id: number) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(servicePrice);
    if (!serviceName || isNaN(price) || price <= 0) {
      alert('Por favor, preencha o nome do serviço e um preço válido.');
      return;
    }
    const newService: Service = { id: Date.now(), name: serviceName, price: price };
    setServices([...services, newService]);
    setServiceName('');
    setServicePrice('');
  };
  
  const handleRemoveService = (id: number) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleConfirmAppointment = (id: number) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const clientMessage = `Olá, ${appointment.clientName}! Seu agendamento para *${appointment.service.name}* no dia *${formattedDate}* às *${appointment.time}* está *CONFIRMADO*! Esperamos por você.`;
    const clientUrl = `https://wa.me/${appointment.clientWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(clientMessage)}`;
    
    window.open(clientUrl, '_blank');

    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'Confirmado' } : app));
  };

  const handleCancelAppointment = (id: number) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const clientMessage = `Olá, ${appointment.clientName}. Informamos que seu agendamento para *${appointment.service.name}* no dia *${formattedDate}* às *${appointment.time}* foi *CANCELADO*. Por favor, entre em contato para mais detalhes ou para reagendar.`;
    const clientUrl = `https://wa.me/${appointment.clientWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(clientMessage)}`;

    window.open(clientUrl, '_blank');
    setAppointments(prev => prev.filter(app => app.id !== id));
  };
  
  const inputStyles = "w-full px-4 py-3 bg-gray-200 text-gray-900 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition";
  const buttonStyles = "w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300 shadow-lg transform hover:-translate-y-1";

  return (
    <div className="bg-gray-200 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-anton text-gray-800">Painel <span className="text-red-600">Administrativo</span></h2>
            <button onClick={onClientClick} className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 text-sm sm:text-base">
                Voltar ao Site
            </button>
        </header>
        
        <div className="space-y-10">

          {/* Acompanhamento de Agendamentos */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
             <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Acompanhamento de Agendamentos</h3>
             {appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {appointments.map(app => (
                        <div key={app.id} className="bg-gray-50 rounded-lg p-5 shadow-md border-l-4 border-red-600 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-lg text-gray-900">{app.clientName}</p>
                                        <p className="text-sm text-gray-600 flex items-center"><WhatsAppIcon className="h-4 w-4 mr-1"/> {app.clientWhatsapp}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${app.status === 'Pendente' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                        {app.status}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 text-sm text-gray-700 space-y-1">
                                    <p><strong>Serviço:</strong> {app.service.name} (R$ {app.service.price.toFixed(2)})</p>
                                    <p><strong>Data:</strong> {new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                                    <p><strong>Pagamento:</strong> {app.paymentMethod}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                {app.status === 'Pendente' && (
                                    <button 
                                        onClick={() => handleConfirmAppointment(app.id)}
                                        className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 text-sm">
                                        <WhatsAppIcon className="h-4 w-4 mr-2"/> Confirmar Agendamento
                                    </button>
                                )}
                                 <button 
                                    onClick={() => handleCancelAppointment(app.id)}
                                    className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300 text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                <p className="text-center text-gray-500 py-4">Nenhum agendamento recebido ainda.</p>
             )}
          </div>
          
          {/* Gerenciar Disponibilidade */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Disponibilidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {availabilityDates.map(date => (
                    <div key={date} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                        <h4 className="font-bold text-center text-gray-800 mb-3 pb-2 border-b">
                            {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' })}
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map(time => {
                                const isAvailable = availability[date]?.includes(time);
                                return (
                                    <button 
                                        key={time}
                                        onClick={() => handleToggleAvailability(date, time)}
                                        className={`px-2 py-2 text-sm rounded-md transition-colors duration-200 font-semibold ${
                                            isAvailable 
                                            ? 'bg-green-200 text-green-800 hover:bg-green-300' 
                                            : 'bg-red-200 text-red-800 hover:bg-red-300'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </div>


          {/* Gerenciar Logo */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Logo</h3>
            <form onSubmit={handleUpdateLogo} className="space-y-6">
                <div>
                    <label htmlFor="logoUpload" className="block text-gray-700 font-bold mb-2">
                        Fazer Upload do Logo (JPG, PNG)
                    </label>
                    <label htmlFor="logoUpload" className="w-full flex justify-center items-center px-4 py-6 bg-gray-100 text-red-600 rounded-lg shadow-inner tracking-wide uppercase border-2 border-dashed border-gray-300 cursor-pointer hover:bg-red-50 hover:border-red-500 transition-colors">
                        <UploadIcon />
                        <span className="ml-4 text-base leading-normal">Selecione um arquivo</span>
                    </label>
                    <input
                        id="logoUpload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoFileChange}
                    />
                </div>
                {logoPreview && <img src={logoPreview} alt="Pré-visualização do Logo" className="mt-4 border p-2 rounded-lg bg-gray-100 max-h-24 w-auto mx-auto" />}
                <button type="submit" className={buttonStyles}>Atualizar Logo</button>
            </form>
          </div>
          
          {/* Gerenciar Localização */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Localização</h3>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
                <div>
                    <label htmlFor="location" className="block text-gray-700 font-bold mb-2">Endereço Completo</label>
                    <input id="location" type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} placeholder="Av. Principal, 123, Cidade - Estado" className={inputStyles} required/>
                </div>
                <button type="submit" className={buttonStyles}>Salvar Endereço</button>
            </form>
          </div>

          {/* Gerenciar Serviços */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Serviços</h3>
            <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="serviceName" className="block text-gray-700 font-bold mb-2">Nome do Serviço</label>
                    <input id="serviceName" type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Ex: Corte Moderno" className={inputStyles} required/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="servicePrice" className="block text-gray-700 font-bold mb-2">Preço</label>
                    <input id="servicePrice" type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="Ex: 50.00" step="0.01" min="0" className={inputStyles} required/>
                </div>
                <button type="submit" className={`${buttonStyles} md:col-span-1`}>Adicionar</button>
            </form>
            <div className="space-y-2">
              {services.map(service => (
                <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium text-gray-800">{service.name} - <span className="text-red-600 font-bold">R$ {service.price.toFixed(2)}</span></span>
                  <button onClick={() => handleRemoveService(service.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors duration-200"><TrashIcon /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Gerenciar Promoções */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Promoções</h3>
            <form onSubmit={handleAddPromotion} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="promoTitle" className="block text-gray-700 font-bold mb-2">Título da Promoção</label>
                    <input id="promoTitle" type="text" value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="Ex: Combo Barba e Cabelo" className={inputStyles} required/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="promoDesc" className="block text-gray-700 font-bold mb-2">Descrição</label>
                    <input id="promoDesc" type="text" value={promoDesc} onChange={e => setPromoDesc(e.target.value)} placeholder="Detalhes da promoção" className={inputStyles} required/>
                </div>
                <button type="submit" className={`${buttonStyles} md:col-span-1`}>Adicionar</button>
            </form>
            <div className="space-y-2">
              {promotions.map(promo => (
                <div key={promo.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="text-gray-800">
                    <strong className="block">{promo.title}:</strong>
                    <span>{promo.description}</span>
                  </div>
                  <button onClick={() => handleRemovePromotion(promo.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors duration-200"><TrashIcon /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Gerenciar Galeria */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-3xl font-anton text-gray-800 border-b-2 border-red-600 pb-4 mb-6">Gerenciar Galeria</h3>
            <form onSubmit={handleAddImage} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="imageUrl" className="block text-gray-700 font-bold mb-2">URL da Imagem</label>
                    <input id="imageUrl" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className={inputStyles} required/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="imageAlt" className="block text-gray-700 font-bold mb-2">Texto Alternativo (alt)</label>
                    <input id="imageAlt" type="text" value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Descrição da imagem" className={inputStyles} />
                </div>
                <button type="submit" className={`${buttonStyles} md:col-span-1`}>Adicionar</button>
            </form>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.src} alt={img.alt} className="w-full h-32 object-cover rounded-lg shadow-md"/>
                  <button onClick={() => handleRemoveImage(img.id)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110">&times;</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Componente App Principal ---
const App: React.FC = () => {
    const [view, setView] = useState<'client' | 'admin'>('client');
    const [promotions, setPromotions] = useState<Promotion[]>(PROMOTIONS_DATA);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(GALLERY_IMAGES_DATA);
    const [services, setServices] = useState<Service[]>(SERVICES_DATA);
    const [logoUrl, setLogoUrl] = useState<string>('https://via.placeholder.com/200x80.png?text=SUA+LOGO');
    const [location, setLocation] = useState<string>('Av. Principal, 123, Centro, Sua Cidade - SC, 88000-000');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [availability, setAvailability] = useState<Record<string, string[]>>(() => {
        const initial: Record<string, string[]> = {};
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            initial[dateString] = [...TIME_SLOTS];
        }
        return initial;
    });


    const toggleView = useCallback(() => {
        setView(prev => (prev === 'client' ? 'admin' : 'client'));
    }, []);

    if (view === 'admin') {
        return (
            <AdminPanel 
                promotions={promotions}
                setPromotions={setPromotions}
                images={galleryImages}
                setImages={setGalleryImages}
                services={services}
                setServices={setServices}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                location={location}
                setLocation={setLocation}
                appointments={appointments}
                setAppointments={setAppointments}
                availability={availability}
                setAvailability={setAvailability}
                onClientClick={toggleView}
            />
        );
    }

    return (
        <div className="bg-white">
            <Header onAdminClick={toggleView} logoUrl={logoUrl} />
            <main>
                <Hero />
                <Promotions promotions={promotions} />
                <Gallery images={galleryImages} />
                <HowItWorks />
                <BookingForm 
                    services={services} 
                    setAppointments={setAppointments} 
                    availability={availability} 
                />
                <Location address={location} />
            </main>
            <Footer />
        </div>
    );
}

export default App;
