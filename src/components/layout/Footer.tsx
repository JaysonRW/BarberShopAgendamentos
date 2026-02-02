import * as React from 'react';
import { MapPinIcon } from '../common/Icons';

export const Footer: React.FC<{ shopName: string; location: string }> = ({ shopName, location }) => (
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
