import * as React from 'react';

export const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <h1 className="text-4xl font-bold mb-4">Barbearia não encontrada</h1>
    <p className="text-gray-300">O link que você acessou não existe ou foi removido.</p>
  </div>
);
