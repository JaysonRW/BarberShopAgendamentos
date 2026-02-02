import * as React from 'react';
import { ScissorsIcon, ClockIcon } from '../common/Icons';
import type { Service } from '../../types';

interface ServicesListProps {
  services: Service[];
  onSelectService?: (serviceId: string) => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({ services, onSelectService }) => {
  if (!services || services.length === 0) {
    return null;
  }

  // Filter active services
  const activeServices = services.filter(s => s.isActive !== false);

  if (activeServices.length === 0) {
    return null;
  }

  return (
    <section id="servicos" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
          <ScissorsIcon className="w-8 h-8 text-primary-600" />
          Nossos Serviços
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {activeServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4 border-primary-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                <span className="bg-primary-100 text-primary-800 text-sm font-bold px-3 py-1 rounded-full">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
              
              {service.description && (
                <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                  {service.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-sm">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{service.duration} min</span>
                </div>
                
                {onSelectService && (
                  <button
                    onClick={() => onSelectService(service.id)}
                    className="text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors"
                  >
                    Agendar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
