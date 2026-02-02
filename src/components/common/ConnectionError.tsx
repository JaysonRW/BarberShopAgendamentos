import * as React from 'react';

export const ConnectionError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
    <h1 className="text-4xl font-bold mb-4">Erro de Conexão</h1>
    <p className="text-gray-300 max-w-md">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-red-700 transition duration-300"
    >
      Tentar Novamente
    </button>
  </div>
);
