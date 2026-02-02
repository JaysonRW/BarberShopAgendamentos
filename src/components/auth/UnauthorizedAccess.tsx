import * as React from 'react';

export const UnauthorizedAccess: React.FC<{
  userEmail: string;
  attemptedSlug: string;
  onLogout: () => void;
}> = ({ userEmail, attemptedSlug, onLogout }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white max-w-md w-full text-center border-l-4 border-red-600">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
      <p className="text-gray-300 mb-6">
        O usuário <strong>{userEmail}</strong> não tem permissão para administrar a barbearia <strong>{attemptedSlug}</strong>.
      </p>
      <div className="bg-gray-700 p-4 rounded-lg mb-6 text-sm text-left">
        <p className="mb-2 font-bold text-gray-400">Por que estou vendo isso?</p>
        <ul className="list-disc pl-5 text-gray-400 space-y-1">
          <li>Você está logado com uma conta que não é proprietária desta página.</li>
          <li>Cada barbearia só pode ser gerenciada pelo seu criador.</li>
        </ul>
      </div>
      <button
        onClick={onLogout}
        className="w-full bg-red-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300"
      >
        Sair e Tentar Outra Conta
      </button>
    </div>
  </div>
);
