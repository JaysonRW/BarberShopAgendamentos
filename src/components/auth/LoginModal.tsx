import * as React from 'react';
import type { SignUpData } from '../../types';

export const LoginModal: React.FC<{
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignUp: (data: SignUpData) => Promise<void>;
  error: string;
  clearError: () => void;
}> = ({ onClose, onLogin, onSignUp, error, clearError }) => {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  
  // State for both forms
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [shopName, setShopName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (mode === 'login') {
      await onLogin(email, password);
    } else {
      await onSignUp({ email, pass: password, shopName, location, whatsappNumber: whatsapp });
    }
    setIsLoading(false);
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    clearError();
    setEmail('');
    setPassword('');
    setShopName('');
    setLocation('');
    setWhatsapp('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-md m-4">
        <h2 className="text-3xl font-bold text-center mb-6">
          {mode === 'login' ? 'Acesso do Barbeiro' : 'Crie sua Conta'}
        </h2>
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
            placeholder="Senha (mínimo 6 caracteres)"
            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />

          {mode === 'signup' && (
            <>
              <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Nome da Barbearia" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (Ex: 55419...)" required className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            </>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 font-bold py-3 px-6 rounded-lg uppercase hover:bg-red-700 transition duration-300 disabled:bg-gray-500"
            >
              {isLoading ? (mode === 'login' ? 'Entrando...' : 'Cadastrando...') : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
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
        <div className="text-center mt-6">
          <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-cyan-400 hover:text-cyan-300">
            {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
