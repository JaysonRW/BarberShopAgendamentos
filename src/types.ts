// Centraliza todas as definições de tipo da aplicação

export interface Promotion {
  id: string;
  title: string;
  description: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientWhatsapp: string;
  service: Service;
  date: string;
  time: string;
  paymentMethod: string;
  status: 'Pendente' | 'Confirmado';
}
