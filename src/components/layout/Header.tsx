import * as React from 'react';
import { Icon } from '../common/Icons';
import { scrollToSection } from '../../utils/ui';

export const Header: React.FC<{ onAdminClick: () => void; logoUrl?: string; shopName: string }> = ({ 
  onAdminClick, 
  logoUrl, 
  shopName 
}) => (
  <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
      <div className="flex items-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`Logo ${shopName}`} 
            className="h-12 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/200x80/111827/FFFFFF/png?text=LOGO';
            }}
          />
        ) : (
          <span className="text-xl font-bold">{shopName}</span>
        )}
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
