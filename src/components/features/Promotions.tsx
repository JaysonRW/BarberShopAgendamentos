import * as React from 'react';
import type { Promotion } from '../../types';

export const Promotions: React.FC<{ promotions: Promotion[] }> = ({ promotions }) => (
  <section id="promocoes" className="py-20 bg-gray-100">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 uppercase text-gray-800">
        Nossas <span className="text-primary">Promoções</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions && promotions.length > 0 ? promotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-xl p-8 transform hover:-translate-y-2 transition duration-300 border-l-4 border-primary">
            <h3 className="text-2xl font-bold text-gray-900">{promo.title}</h3>
            <p className="mt-4 text-gray-600">{promo.description}</p>
          </div>
        )) : (
          <p className="col-span-full text-center text-gray-600">Nenhuma promoção ativa no momento.</p>
        )}
      </div>
    </div>
  </section>
);
