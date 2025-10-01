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

export interface LoyaltyClient {
  id: string;
  barberId: string;
  clientWhatsapp: string;
  points: number; // Manter para possível uso futuro
  stars?: number; // Sistema de estrelas/selos
  goal?: number; // Meta de estrelas para recompensa
  lifetimeAppointments: number;
  clientName: string;
  createdAt?: any;
  updatedAt?: any;
}