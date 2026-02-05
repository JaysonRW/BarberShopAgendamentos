import * as React from 'react';

interface LocationMapProps {
  address: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({ address }) => {
  // Se não houver endereço, não renderiza nada
  if (!address) return null;

  // Codifica o endereço para URL
  const encodedAddress = encodeURIComponent(address);
  // URL para embed do Google Maps (iframe simples)
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="localizacao" className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 uppercase text-gray-800">
          Onde <span className="text-primary">Estamos</span>
        </h2>
        
        <div className="max-w-5xl mx-auto w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-xl border border-gray-100">
          <iframe 
            title="Localização da Barbearia"
            width="100%" 
            height="100%" 
            id="gmap_canvas" 
            src={mapUrl} 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0}
            loading="lazy"
            className="w-full h-full"
          />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600 text-lg">{address}</p>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-primary font-medium hover:underline"
          >
            Abrir no Google Maps &rarr;
          </a>
        </div>
      </div>
    </section>
  );
};
