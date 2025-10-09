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
  lembrete24henviado?: boolean; // Adicionado para rastrear o envio do lembrete de 24h
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

// --- NOVOS TIPOS PARA GESTÃO DE CLIENTES ---

export interface ClientFormData {
  name: string;
  whatsapp: string;
  email?: string;
  birthdate?: string;
  tags?: string[];
  notes?: string;
}

export interface Client extends ClientFormData {
  id: string; // Será o número de WhatsApp normalizado
  barberId: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null; // ISO date string
  preferredServices: Record<string, number>; // { serviceName: count }
  createdAt: any;
  updatedAt: any;
}

export interface ClientStats {
  totalClients: number;
  newThisMonth: number;
  activeClients: number;
  avgVisits: number;
}
