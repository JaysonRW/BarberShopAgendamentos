import * as React from 'react';
import type { GalleryImage } from '../../types';

export const Gallery: React.FC<{ images: GalleryImage[] }> = ({ images }) => (
  <section id="galeria" className="py-20 bg-gray-900">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 uppercase text-white">
        Nossos <span className="text-primary">Trabalhos</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images && images.length > 0 ? images.map(img => (
          <div key={img.id} className="overflow-hidden rounded-lg shadow-lg">
            <img 
              src={img.src} 
              alt={img.alt} 
              className="w-full h-full object-cover transform hover:scale-110 transition duration-500 cursor-pointer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x300/1f2937/FFFFFF/png?text=Imagem';
              }}
            />
          </div>
        )) : (
          <p className="col-span-full text-center text-white">Galeria em breve.</p>
        )}
      </div>
    </div>
  </section>
);
