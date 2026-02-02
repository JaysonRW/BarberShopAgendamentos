import React from 'react';
import { BarberData } from '../../../types';
import { UploadIcon } from '../../common/Icons';

interface ProfileTabProps {
  barberData: BarberData;
  onEdit: (section: string, data: any) => void;
  isEditing: boolean;
  editData: any;
  onSave: () => void;
  onCancel: () => void;
  onEditDataChange: (data: any) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  isUploading: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  barberData, 
  onEdit, 
  isEditing, 
  editData, 
  onSave, 
  onCancel, 
  onEditDataChange, 
  uploadFile, 
  setUploadFile, 
  isUploading 
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (uploadFile) {
      const url = URL.createObjectURL(uploadFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadFile]);

  const portalUrl = `${window.location.origin}/${barberData.profile.slug}`;

  const handleShare = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Perfil da Barbearia</h2>
        {!isEditing && (
          <button
            onClick={() => onEdit('profile', barberData.profile)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Editar Perfil
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-8">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <img 
                  src={previewUrl || editData.logoUrl || 'https://placehold.co/96x96/374151/FFFFFF/png?text=LOGO'}
                  alt="Pré-visualização do Logo"
                  className="w-24 h-24 rounded-lg object-cover bg-gray-700"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-300 flex items-center"
                >
                  <UploadIcon className="mr-2" /> Carregar Imagem
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Barbearia</label>
              <input
                type="text"
                value={editData.shopName || ''}
                onChange={(e) => onEditDataChange({...editData, shopName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
              <input
                type="text"
                value={editData.location || ''}
                onChange={(e) => onEditDataChange({...editData, location: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp</label>
              <input
                type="text"
                value={editData.whatsappNumber || ''}
                onChange={(e) => onEditDataChange({...editData, whatsappNumber: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Preencha somente com números.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Seu Endereço de Perfil	ex: nomedasuabarbearia</label>
              <input
                type="text"
                value={editData.slug || ''}
                onChange={(e) => onEditDataChange({...editData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-xs text-gray-400 mt-1">O final do link do seu portal. Use apenas letras, números e hifens.</p>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={onSave}
                disabled={isUploading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
              >
                {isUploading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={onCancel}
                disabled={isUploading}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start gap-8">
            <img 
              src={barberData.profile.logoUrl} 
              alt="Logo" 
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/96x96/1f2937/FFFFFF/png?text=LOGO';
              }}
            />
            <div className="flex-grow w-full">
              <h3 className="text-2xl font-bold">{barberData.profile.shopName}</h3>
              <p className="text-gray-400 mt-1">{barberData.profile.location}</p>

              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400">WhatsApp</label>
                  <p className="text-white mt-1">{barberData.profile.whatsappNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Link do Portal</label>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 break-all">
                      {barberData.profile.slug}
                    </a>
                    <button
                      onClick={handleShare}
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition duration-300"
                    >
                      {isCopied ? 'Copiado!' : 'Compartilhar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
