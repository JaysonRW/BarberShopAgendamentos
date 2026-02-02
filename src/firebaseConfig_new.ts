/**
 * Firestore Service - Versão Refatorada com Subcoleções
 * Substitui a versão antiga que usava arrays
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// ========================================
// TYPES
// ========================================
export interface BarberProfile {
  shopName: string;
  slug: string;
  location: string;
  whatsappNumber: string;
  logoUrl?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  isActive: boolean;
  userID: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  barberId: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  serviceId: string;
  serviceName?: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';
  totalPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryImage {
  id: string;
  barberId: string;
  url: string;
  description?: string;
  createdAt: Date;
}

export interface Promotion {
  id: string;
  barberId: string;
  title: string;
  description: string;
  discount: number;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  [key: string]: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  };
}

// ========================================
// BARBER PROFILE
// ========================================
export class BarberService {
  /**
   * Busca perfil do barbeiro por slug
   */
  static async getBySlug(slug: string): Promise<{ id: string; profile: BarberProfile } | null> {
    try {
      const barbersRef = collection(db, 'barbers');
      const q = query(barbersRef, where('profile.slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        profile: doc.data().profile as BarberProfile
      };
    } catch (error) {
      console.error('Erro ao buscar barbeiro por slug:', error);
      throw error;
    }
  }

  /**
   * Busca perfil do barbeiro por ID
   */
  static async getById(barberId: string): Promise<BarberProfile | null> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data().profile as BarberProfile;
    } catch (error) {
      console.error('Erro ao buscar barbeiro por ID:', error);
      throw error;
    }
  }

  /**
   * Atualiza perfil do barbeiro
   */
  static async updateProfile(barberId: string, profile: Partial<BarberProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      await updateDoc(docRef, {
        profile: {
          ...profile,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Busca disponibilidade do barbeiro
   */
  static async getAvailability(barberId: string): Promise<Availability | null> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data().availability as Availability;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      throw error;
    }
  }

  /**
   * Atualiza disponibilidade
   */
  static async updateAvailability(barberId: string, availability: Availability): Promise<void> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      await updateDoc(docRef, { availability });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      throw error;
    }
  }
}

// ========================================
// SERVICES
// ========================================
export class ServiceService {
  /**
   * Lista todos os serviços de um barbeiro
   */
  static async getAll(barberId: string): Promise<Service[]> {
    try {
      const servicesRef = collection(db, `barbers/${barberId}/services`);
      const q = query(servicesRef, orderBy('name'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
      throw error;
    }
  }

  /**
   * Busca um serviço específico
   */
  static async getById(barberId: string, serviceId: string): Promise<Service | null> {
    try {
      const docRef = doc(db, `barbers/${barberId}/services`, serviceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return { id: docSnap.id, ...docSnap.data() } as Service;
    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      throw error;
    }
  }

  /**
   * Cria novo serviço
   */
  static async create(barberId: string, serviceData: Omit<Service, 'id' | 'barberId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const servicesRef = collection(db, `barbers/${barberId}/services`);
      const newServiceRef = doc(servicesRef);

      const service: Service = {
        id: newServiceRef.id,
        barberId,
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(newServiceRef, service);
      return newServiceRef.id;
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
  }

  /**
   * Atualiza serviço
   */
  static async update(barberId: string, serviceId: string, updates: Partial<Service>): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/services`, serviceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  }

  /**
   * Deleta serviço
   */
  static async delete(barberId: string, serviceId: string): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/services`, serviceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
  }
}

// ========================================
// APPOINTMENTS
// ========================================
export class AppointmentService {
  /**
   * Lista todos os agendamentos de um barbeiro
   */
  static async getAll(
    barberId: string,
    filters?: {
      status?: Appointment['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const constraints: QueryConstraint[] = [orderBy('date', 'desc')];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.startDate) {
        constraints.push(where('date', '>=', filters.startDate.toISOString().split('T')[0]));
      }

      if (filters?.endDate) {
        constraints.push(where('date', '<=', filters.endDate.toISOString().split('T')[0]));
      }

      const q = query(appointmentsRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      throw error;
    }
  }

  /**
   * Busca agendamentos de hoje
   */
  static async getToday(barberId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll(barberId, {
      startDate: new Date(today),
      endDate: new Date(today)
    });
  }

  /**
   * Busca agendamentos por data específica
   */
  static async getByDate(barberId: string, date: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const q = query(
        appointmentsRef,
        where('date', '==', date),
        orderBy('time')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Erro ao buscar agendamentos por data:', error);
      throw error;
    }
  }

  /**
   * Cria novo agendamento
   */
  static async create(
    barberId: string,
    appointmentData: Omit<Appointment, 'id' | 'barberId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const newAppointmentRef = doc(appointmentsRef);

      const appointment: Appointment = {
        id: newAppointmentRef.id,
        barberId,
        ...appointmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(newAppointmentRef, appointment);
      return newAppointmentRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do agendamento
   */
  static async updateStatus(
    barberId: string,
    appointmentId: string,
    status: Appointment['status']
  ): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Atualiza agendamento
   */
  static async update(
    barberId: string,
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  }

  /**
   * Deleta agendamento
   */
  static async delete(barberId: string, appointmentId: string): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  }
}

// ========================================
// GALLERY
// ========================================
export class GalleryService {
  /**
   * Lista todas as imagens da galeria
   */
  static async getAll(barberId: string): Promise<GalleryImage[]> {
    try {
      const galleryRef = collection(db, `barbers/${barberId}/gallery`);
      const q = query(galleryRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GalleryImage));
    } catch (error) {
      console.error('Erro ao listar galeria:', error);
      throw error;
    }
  }

  /**
   * Adiciona imagem à galeria
   */
  static async add(
    barberId: string,
    imageData: Omit<GalleryImage, 'id' | 'barberId' | 'createdAt'>
  ): Promise<string> {
    try {
      const galleryRef = collection(db, `barbers/${barberId}/gallery`);
      const newImageRef = doc(galleryRef);

      const image: GalleryImage = {
        id: newImageRef.id,
        barberId,
        ...imageData,
        createdAt: new Date()
      };

      await setDoc(newImageRef, image);
      return newImageRef.id;
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
      throw error;
    }
  }

  /**
   * Remove imagem da galeria
   */
  static async delete(barberId: string, imageId: string): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/gallery`, imageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }
}

// ========================================
// PROMOTIONS
// ========================================
export class PromotionService {
  /**
   * Lista todas as promoções
   */
  static async getAll(barberId: string, activeOnly: boolean = false): Promise<Promotion[]> {
    try {
      const promotionsRef = collection(db, `barbers/${barberId}/promotions`);
      let q = query(promotionsRef, orderBy('createdAt', 'desc'));

      if (activeOnly) {
        q = query(promotionsRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Promotion));
    } catch (error) {
      console.error('Erro ao listar promoções:', error);
      throw error;
    }
  }

  /**
   * Cria promoção
   */
  static async create(
    barberId: string,
    promotionData: Omit<Promotion, 'id' | 'barberId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const promotionsRef = collection(db, `barbers/${barberId}/promotions`);
      const newPromotionRef = doc(promotionsRef);

      const promotion: Promotion = {
        id: newPromotionRef.id,
        barberId,
        ...promotionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(newPromotionRef, promotion);
      return newPromotionRef.id;
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      throw error;
    }
  }

  /**
   * Atualiza promoção
   */
  static async update(
    barberId: string,
    promotionId: string,
    updates: Partial<Promotion>
  ): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/promotions`, promotionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error);
      throw error;
    }
  }

  /**
   * Deleta promoção
   */
  static async delete(barberId: string, promotionId: string): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/promotions`, promotionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      throw error;
    }
  }
}

// ========================================
// EXEMPLO DE USO
// ========================================

/*
// Buscar barbeiro
const barber = await BarberService.getBySlug('nobresdobairro');

// Listar serviços
const services = await ServiceService.getAll(barber.id);

// Criar agendamento
const appointmentId = await AppointmentService.create(barber.id, {
  clientName: 'João Silva',
  clientPhone: '11999999999',
  date: '2026-02-10',
  time: '14:00',
  serviceId: 'service123',
  serviceName: 'Corte + Barba',
  status: 'Pendente',
  totalPrice: 50
});

// Buscar agendamentos de hoje
const todayAppointments = await AppointmentService.getToday(barber.id);

// Atualizar status
await AppointmentService.updateStatus(barber.id, appointmentId, 'Confirmado');
*/