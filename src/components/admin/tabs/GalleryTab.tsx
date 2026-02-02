import React from 'react';
import { GalleryImage } from '../../../types';
import { GalleryService } from '../../../firestoreService';
import { TrashIcon, UploadIcon } from '../../common/Icons';

interface GalleryTabProps {
  images: GalleryImage[];
  barberId: string;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  isUploading: boolean;
  onUpload: (folder: 'logos' | 'gallery') => Promise<void>;
  onDataUpdate: () => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ 
  images, barberId, uploadFile, setUploadFile, isUploading, onUpload, onDataUpdate 
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDelete = async (image: GalleryImage) => {
    if (confirm('Tem certeza que deseja deletar esta imagem?')) {
      await GalleryService.delete(barberId, image.id, image.src);
      onDataUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Galeria</h2>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-300"
          >
            {uploadFile ? uploadFile.name : 'Selecionar Foto'}
          </button>
          {uploadFile && (
            <button
              onClick={() => onUpload('gallery')}
              disabled={isUploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500 flex items-center"
            >
              <UploadIcon className="mr-2 h-5 w-5" />
              {isUploading ? 'Enviando...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden">
            <img 
              src={image.src} 
              alt="Galeria" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => handleDelete(image)}
                className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition"
              >
                <TrashIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhuma imagem na galeria.
          </div>
        )}
      </div>
    </div>
  );
};
