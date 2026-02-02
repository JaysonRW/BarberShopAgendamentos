import React from 'react';
import { BarberData } from '../../../types';
import { BarberService } from '../../../firestoreService';

interface VisualsTabProps {
  barberData: BarberData;
  onDataUpdate: () => void;
}

export const VisualsTab: React.FC<VisualsTabProps> = ({ barberData, onDataUpdate }) => {
  const defaultTheme = { primaryColor: '#4F46E5', secondaryColor: '#7C3AED' };
  const [colors, setColors] = React.useState(barberData.profile.theme || defaultTheme);
  const [isSaving, setIsSaving] = React.useState(false);

  const palettes = [
      { name: 'Índigo/Violeta', primary: '#4F46E5', secondary: '#7C3AED' },
      { name: 'Azul/Ciano', primary: '#0EA5E9', secondary: '#14B8A6' },
      { name: 'Verde Esmeralda', primary: '#10B981', secondary: '#34D399' },
      { name: 'Âmbar/Vermelho', primary: '#F59E0B', secondary: '#EF4444' },
      { name: 'Rosa/Roxo', primary: '#EC4899', secondary: '#8B5CF6' },
      { name: 'Índigo/Púrpura', primary: '#6366F1', secondary: '#A855F7' },
  ];

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', value: string) => {
      setColors(prev => ({ ...prev, [colorType]: value }));
  };

  const handleSaveTheme = async () => {
      setIsSaving(true);
      try {
          const updatedProfile = {
              ...barberData.profile,
              theme: colors,
          };
          const success = await BarberService.updateProfile(barberData.id, updatedProfile);
          if (success) {
              alert('Tema salvo com sucesso!');
              onDataUpdate();
          } else {
              throw new Error('Falha ao salvar o tema.');
          }
      } catch (error) {
          console.error("Erro ao salvar tema:", error);
          alert("Não foi possível salvar o tema.");
      } finally {
          setIsSaving(false);
      }
  };
  
  return (
      <div className="space-y-8">
          <h2 className="text-3xl font-bold">Personalização Visual</h2>

          <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Cores do Tema</h3>
              <p className="text-gray-400 mb-6">Personalize as cores da sua página de agendamentos.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {palettes.map(palette => (
                      <button key={palette.name} onClick={() => setColors({ primaryColor: palette.primary, secondaryColor: palette.secondary })} className="bg-gray-700 p-3 rounded-lg text-center hover:bg-gray-600 transition-all">
                          <div className="h-10 rounded-md mb-2" style={{ background: `linear-gradient(to right, ${palette.primary}, ${palette.secondary})` }}></div>
                          <span className="text-sm">{palette.name}</span>
                      </button>
                  ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cor Primária</label>
                      <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                          <input type="color" value={colors.primaryColor} onChange={e => handleColorChange('primaryColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                          <input type="text" value={colors.primaryColor} onChange={e => handleColorChange('primaryColor', e.target.value)} className="w-full bg-transparent text-white focus:outline-none" />
                      </div>
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cor Secundária</label>
                       <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                          <input type="color" value={colors.secondaryColor} onChange={e => handleColorChange('secondaryColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                          <input type="text" value={colors.secondaryColor} onChange={e => handleColorChange('secondaryColor', e.target.value)} className="w-full bg-transparent text-white focus:outline-none" />
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prévia</label>
                  <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg">
                      <div className="h-12 rounded-lg" style={{ background: `linear-gradient(to right, ${colors.primaryColor}, ${colors.secondaryColor})` }}></div>
                  </div>
              </div>
          </div>

          <button onClick={handleSaveTheme} disabled={isSaving} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase hover:bg-green-700 disabled:bg-gray-500 transition duration-300">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
      </div>
  );
};
