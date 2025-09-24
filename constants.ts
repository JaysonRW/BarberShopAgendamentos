
import type { Promotion, GalleryImage, Service } from './types';

export const BARBER_WHATSAPP_NUMBER = '5541995343245'; // Substitua pelo número do barbeiro

export const PROMOTIONS_DATA: Promotion[] = [
  { id: 1, title: 'Corte & Barba', description: 'Faça o combo de corte de cabelo e barba e ganhe 10% de desconto. Estilo completo!' },
  { id: 2, title: 'Dia do Amigo', description: 'Traga um amigo e ambos ganham 15% de desconto no serviço. Válido às quartas-feiras.' },
  { id: 3, title: 'Plano Mensal', description: 'Garanta 4 cortes por mês com um preço especial. Mantenha o visual sempre em dia!' },
];

export const GALLERY_IMAGES_DATA: GalleryImage[] = [
  { id: 1, src: 'https://picsum.photos/seed/barber1/600/400', alt: 'Corte de cabelo moderno' },
  { id: 2, src: 'https://picsum.photos/seed/barber2/600/400', alt: 'Barba estilizada' },
  { id: 3, src: 'https://picsum.photos/seed/barber3/600/400', alt: 'Cliente satisfeito' },
  { id: 4, src: 'https://picsum.photos/seed/barber4/600/400', alt: 'Ambiente da barbearia' },
  { id: 5, src: 'https://picsum.photos/seed/barber5/600/400', alt: 'Ferramentas de barbeiro' },
  { id: 6, src: 'https://picsum.photos/seed/barber6/600/400', alt: 'Detalhe do corte' },
];

export const SERVICES_DATA: Service[] = [
    { id: 1, name: 'Corte Cabelo', price: 50.00 },
    { id: 2, name: 'Barba', price: 30.00 },
    { id: 3, name: 'Cabelo + Barba', price: 75.00 },
    { id: 4, name: 'Sobrancelha', price: 20.00 },
];

export const TIME_SLOTS: string[] = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];
