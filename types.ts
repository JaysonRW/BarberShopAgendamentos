
export interface Promotion {
  id: number;
  title: string;
  description: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
}

export interface Appointment {
  id: number;
  clientName: string;
  clientWhatsapp: string;
  service: Service;
  date: string;
  time: string;
  paymentMethod: string;
  status: 'Pendente' | 'Confirmado';
}
