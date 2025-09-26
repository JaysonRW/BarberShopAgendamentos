import { db } from './firebaseConfig';
import type { Promotion, GalleryImage, Service, Appointment } from './types';

// Interface para dados completos do barbeiro
export interface BarberData {
  id: string;
  profile: {
    shopName: string;
    location: string;
    logoUrl: string;
    whatsappNumber: string;
    slug: string;
    isActive: boolean;
    createdAt: any;
  };
  promotions: Promotion[];
  galleryImages: GalleryImage[];
  services: Service[];
  appointments: Appointment[];
  availability: Record<string, string[]>;
}

// Classe para gerenciar todas as operações do Firestore
export class FirestoreService {
  
  // Carregar todos os dados de um barbeiro (multi-tenant)
  static async loadBarberData(barberId: string): Promise<BarberData | null> {
    try {
      console.log(`Carregando dados do barbeiro: ${barberId}`);
      
      // Buscar documento principal do barbeiro
      const barberDoc = await db.collection('barbers').doc(barberId).get();
      
      if (!barberDoc.exists) {
        console.log('Barbeiro não encontrado no banco');
        return null;
      }
      
      const barberData = barberDoc.data();
      
      // Buscar todas as subcoleções em paralelo
      const [promotionsSnapshot, servicesSnapshot, gallerySnapshot, appointmentsSnapshot] = await Promise.all([
        db.collection('barbers').doc(barberId).collection('promotions')
          .where('isActive', '==', true)
          .orderBy('createdAt', 'desc')
          .get(),
        db.collection('barbers').doc(barberId).collection('services')
          .where('isActive', '==', true)
          .orderBy('createdAt', 'desc')
          .get(),
        db.collection('barbers').doc(barberId).collection('gallery')
          .orderBy('order', 'asc')
          .get(),
        db.collection('barbers').doc(barberId).collection('appointments')
          .orderBy('date', 'desc')
          .orderBy('time', 'desc')
          .limit(50)
          .get()
      ]);
      
      // Converter documentos para arrays
      const promotions: Promotion[] = promotionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Promotion));
      
      const services: Service[] = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
      
      const galleryImages: GalleryImage[] = gallerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GalleryImage));
      
      const appointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      
      return {
        id: barberId,
        profile: barberData?.profile || {},
        availability: barberData?.availability || {},
        promotions,
        services,
        galleryImages,
        appointments
      };
      
    } catch (error) {
      console.error('Erro ao carregar dados do barbeiro:', error);
      return null;
    }
  }
  
  // Criar perfil inicial para novo barbeiro
  static async createBarberProfile(barberId: string, initialData: {
    shopName: string;
    location: string;
    whatsappNumber: string;
    slug: string;
  }): Promise<boolean> {
    try {
      const now = new Date();
      
      // Criar documento principal
      await db.collection('barbers').doc(barberId).set({
        profile: {
          ...initialData,
          logoUrl: 'https://via.placeholder.com/200x80.png?text=SUA+LOGO',
          isActive: true,
          createdAt: now
        },
        availability: this.generateInitialAvailability()
      });
      
      // Criar slug público
      await db.collection('public-slugs').doc(initialData.slug).set({
        barberId: barberId,
        isActive: true,
        lastUpdated: now
      });
      
      console.log('Perfil do barbeiro criado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar perfil do barbeiro:', error);
      return false;
    }
  }
  
  // Atualizar perfil do barbeiro
  static async updateBarberProfile(barberId: string, profileData: any): Promise<boolean> {
    try {
      await db.collection('barbers').doc(barberId).update({
        'profile': {
          ...profileData,
          updatedAt: new Date()
        }
      });
      
      // Se mudou o slug, atualizar na coleção pública
      if (profileData.slug) {
        await db.collection('public-slugs').doc(profileData.slug).set({
          barberId: barberId,
          isActive: true,
          lastUpdated: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }
  
  // PROMOÇÕES
  static async addPromotion(barberId: string, promotion: Omit<Promotion, 'id'>): Promise<string | null> {
    try {
      const docRef = await db.collection('barbers').doc(barberId).collection('promotions').add({
        ...promotion,
        isActive: true,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar promoção:', error);
      return null;
    }
  }
  
  static async deletePromotion(barberId: string, promotionId: string): Promise<boolean> {
    try {
      // Soft delete - marcar como inativo
      await db.collection('barbers').doc(barberId).collection('promotions').doc(promotionId).update({
        isActive: false,
        deletedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      return false;
    }
  }
  
  // SERVIÇOS
  static async addService(barberId: string, service: Omit<Service, 'id'>): Promise<string | null> {
    try {
      const docRef = await db.collection('barbers').doc(barberId).collection('services').add({
        ...service,
        isActive: true,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      return null;
    }
  }
  
  static async deleteService(barberId: string, serviceId: string): Promise<boolean> {
    try {
      await db.collection('barbers').doc(barberId).collection('services').doc(serviceId).update({
        isActive: false,
        deletedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      return false;
    }
  }
  
  // GALERIA
  static async addGalleryImage(barberId: string, image: Omit<GalleryImage, 'id'>, order?: number): Promise<string | null> {
    try {
      const docRef = await db.collection('barbers').doc(barberId).collection('gallery').add({
        ...image,
        order: order || Date.now(),
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
      return null;
    }
  }
  
  static async deleteGalleryImage(barberId: string, imageId: string): Promise<boolean> {
    try {
      await db.collection('barbers').doc(barberId).collection('gallery').doc(imageId).delete();
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
  }
  
  // AGENDAMENTOS
  static async createAppointment(barberId: string, appointmentData: Omit<Appointment, 'id'>): Promise<string | null> {
    try {
      // Verificar se o horário ainda está disponível
      const barberDoc = await db.collection('barbers').doc(barberId).get();
      const availability = barberDoc.data()?.availability || {};
      const availableSlots = availability[appointmentData.date] || [];
      
      if (!availableSlots.includes(appointmentData.time)) {
        console.log('Horário não disponível');
        return null;
      }
      
      // Criar agendamento
      const docRef = await db.collection('barbers').doc(barberId).collection('appointments').add({
        ...appointmentData,
        status: 'Pendente',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Atualizar disponibilidade (remover horário)
      const updatedSlots = availableSlots.filter(slot => slot !== appointmentData.time);
      await db.collection('barbers').doc(barberId).update({
        [`availability.${appointmentData.date}`]: updatedSlots
      });
      
      console.log('Agendamento criado com sucesso');
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return null;
    }
  }
  
  static async updateAppointmentStatus(barberId: string, appointmentId: string, status: 'Pendente' | 'Confirmado'): Promise<boolean> {
    try {
      await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).update({
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      return false;
    }
  }
  
  static async cancelAppointment(barberId: string, appointmentId: string): Promise<boolean> {
    try {
      // Buscar dados do agendamento para restaurar disponibilidade
      const appointmentDoc = await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).get();
      
      if (appointmentDoc.exists) {
        const appointment = appointmentDoc.data() as Appointment;
        
        // Restaurar horário na disponibilidade
        const barberDoc = await db.collection('barbers').doc(barberId).get();
        const availability = barberDoc.data()?.availability || {};
        const currentSlots = availability[appointment.date] || [];
        
        // Adicionar horário de volta se não estiver lá
        if (!currentSlots.includes(appointment.time)) {
          const updatedSlots = [...currentSlots, appointment.time].sort();
          await db.collection('barbers').doc(barberId).update({
            [`availability.${appointment.date}`]: updatedSlots
          });
        }
        
        // Deletar agendamento
        await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).delete();
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return false;
    }
  }
  
  // BUSCA POR SLUG PÚBLICO
  static async findBarberBySlug(slug: string): Promise<string | null> {
    try {
      const slugDoc = await db.collection('public-slugs').doc(slug).get();
      
      if (slugDoc.exists && slugDoc.data()?.isActive) {
        return slugDoc.data()?.barberId || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar por slug:', error);
      return null;
    }
  }
  
  // DISPONIBILIDADE
  static generateInitialAvailability(): Record<string, string[]> {
    const availability: Record<string, string[]> = {};
    const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Gerar disponibilidade para próximos 30 dias
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Não trabalhar aos domingos (pode ser customizado)
      if (date.getDay() !== 0) {
        availability[dateString] = [...timeSlots];
      }
    }
    
    return availability;
  }
  
  static async updateAvailability(barberId: string, date: string, availableSlots: string[]): Promise<boolean> {
    try {
      await db.collection('barbers').doc(barberId).update({
        [`availability.${date}`]: availableSlots
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return false;
    }
  }
}