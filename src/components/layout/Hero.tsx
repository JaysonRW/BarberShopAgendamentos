import * as React from 'react';
import { scrollToSection } from '../../utils/ui';

export const Hero: React.FC<{ shopName: string }> = ({ shopName }) => (
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
