/**
 * Firestore Service - Versão Refatorada com Subcoleções
 * Substitui a versão antiga que usava arrays
 * Mantém compatibilidade com tipos e lógicas de negócio
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db, auth, storage } from './firebaseConfig';
import type { 
  Promotion, 
  GalleryImage, 
  Service, 
  Appointment, 
  Client, 
  ClientFormData, 
  Transaction,
  LoyaltyClient
} from './types';

// Tipos auxiliares locais
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
  createdAt: any;
  updatedAt: any;
}

export interface Availability {
  [key: string]: string[];
}

// ========================================
// UTILS & SECURITY
// ========================================
export class SecurityService {
  static async withAuthentication<T>(
    barberId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const user = auth.currentUser;
    // Permite operações de leitura pública se não houver verificação estrita necessária aqui,
    // mas para escritas críticas, deve validar.
    
    if (user && user.uid !== barberId) {
      console.warn(`SECURITY WARNING: User ${user.uid} operating on barber ${barberId}`);
    }

    return operation();
  }
}

// ========================================
// BARBER PROFILE & PUBLIC
// ========================================
export class BarberService {
  static async getBySlug(slug: string): Promise<{ id: string; profile: BarberProfile; availability: Availability } | null> {
    try {
      const barbersRef = collection(db, 'barbers');
      const q = query(barbersRef, where('profile.slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      if (!data.profile?.isActive) return null;

      return {
        id: doc.id,
        profile: data.profile as BarberProfile,
        availability: data.availability as Availability
      };
    } catch (error) {
      console.error('Erro ao buscar barbeiro por slug:', error);
      throw error;
    }
  }

  static async getById(barberId: string): Promise<BarberProfile | null> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docSnap.data().profile as BarberProfile;
    } catch (error) {
      console.error('Erro ao buscar barbeiro por ID:', error);
      throw error;
    }
  }

  static async updateProfile(barberId: string, profile: Partial<BarberProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      await updateDoc(docRef, {
        'profile': {
          ...profile,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  static async getAvailability(barberId: string): Promise<Availability | null> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docSnap.data().availability as Availability;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      throw error;
    }
  }

  static async updateAvailability(barberId: string, date: string, slots: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'barbers', barberId);
      await updateDoc(docRef, {
        [`availability.${date}`]: slots
      });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      throw error;
    }
  }

  static generateInitialAvailability(): Availability {
    const availability: Availability = {};
    const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      if (date.getDay() !== 0) { // Não trabalha aos domingos
        availability[dateString] = [...timeSlots];
      }
    }
    return availability;
  }
  
  static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let counter = 1;
    let finalSlug = slug;
    while (true) {
      const barbersRef = collection(db, 'barbers');
      const q = query(barbersRef, where('profile.slug', '==', finalSlug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    return finalSlug;
  }

  static async create(data: { id: string; profile: BarberProfile; promotions: any[]; galleryImages: any[]; services: any[]; appointments: any[]; availability: any }) {
    try {
      await setDoc(doc(db, 'barbers', data.id), {
        profile: data.profile,
        availability: data.availability,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao criar barbearia:', error);
      throw error;
    }
  }

  static async createNew(userId: string, barberData: { shopName: string; location: string; whatsappNumber: string; email: string; }): Promise<string | null> {
    try {
      const baseSlug = barberData.shopName;
      const uniqueSlug = await this.generateUniqueSlug(baseSlug);
      
      await setDoc(doc(db, 'barbers', userId), {
        profile: {
          ...barberData,
          slug: uniqueSlug,
          logoUrl: 'https://placehold.co/200x80/111827/FFFFFF/png?text=SUA+LOGO',
          isActive: true,
          createdAt: new Date(),
          userID: userId,
        },
        userID: userId,
        availability: this.generateInitialAvailability()
      });
      
      return userId;
    } catch (error) {
      console.error('Erro ao criar novo barbeiro:', error);
      return null;
    }
  }
}

// ========================================
// SERVICES
// ========================================
export class ServiceService {
  static async getAll(barberId: string): Promise<Service[]> {
    try {
      const servicesRef = collection(db, `barbers/${barberId}/services`);
      const q = query(servicesRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
      throw error;
    }
  }

  static async create(barberId: string, service: Omit<Service, 'id'>): Promise<string> {
    try {
      const servicesRef = collection(db, `barbers/${barberId}/services`);
      const docRef = await addDoc(servicesRef, {
        ...service,
        isActive: true,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
  }

  static async update(barberId: string, serviceId: string, updates: Partial<Service>): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/services`, serviceId);
      await updateDoc(docRef, { ...updates, updatedAt: new Date() });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  }

  static async delete(barberId: string, serviceId: string): Promise<void> {
    try {
      const docRef = doc(db, `barbers/${barberId}/services`, serviceId);
      // Soft delete
      await updateDoc(docRef, { isActive: false, deletedAt: new Date() });
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
  }
}

// ========================================
// APPOINTMENTS & BUSINESS LOGIC
// ========================================
export class AppointmentService {
  static async getAll(barberId: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const q = query(appointmentsRef, orderBy('date', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      throw error;
    }
  }

  static async create(barberId: string, appointmentData: Omit<Appointment, 'id'>): Promise<string | null> {
    try {
      // 1. Verificar disponibilidade
      const barberDocRef = doc(db, 'barbers', barberId);
      const barberDoc = await getDoc(barberDocRef);
      
      if (!barberDoc.exists()) throw new Error("Barbearia não encontrada.");
      
      const availability = barberDoc.data()?.availability || {};
      const availableSlots = availability[appointmentData.date] || [];

      if (!availableSlots.includes(appointmentData.time)) {
        alert('Horário indisponível.');
        return null;
      }

      // 2. Criar agendamento
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const docRef = await addDoc(appointmentsRef, {
        ...appointmentData,
        status: 'Pendente',
        createdAt: new Date(),
        updatedAt: new Date(),
        lembrete24henviado: false
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return null;
    }
  }

  static async updateStatus(barberId: string, appointmentId: string, status: 'Pendente' | 'Confirmado'): Promise<boolean> {
    try {
      await runTransaction(db, async (transaction) => {
        const barberRef = doc(db, 'barbers', barberId);
        const appointmentRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
        
        const appointmentDoc = await transaction.get(appointmentRef);
        const barberDoc = await transaction.get(barberRef);
        
        if (!appointmentDoc.exists() || !barberDoc.exists()) throw new Error("Documento não encontrado");

        const appointmentData = appointmentDoc.data() as Appointment;
        const currentStatus = appointmentData.status;

        // Se confirmando...
        if (currentStatus === 'Pendente' && status === 'Confirmado') {
          // 1. Atualizar disponibilidade
          const availability = barberDoc.data()?.availability || {};
          const daySlots = availability[appointmentData.date] || [];
          if (daySlots.includes(appointmentData.time)) {
            const updatedSlots = daySlots.filter((s: string) => s !== appointmentData.time);
            transaction.update(barberRef, { [`availability.${appointmentData.date}`]: updatedSlots });
          }

          // 2. Fidelidade e Clientes
          const normalizedWhatsapp = appointmentData.clientWhatsapp.replace(/\D/g, '');
          if (normalizedWhatsapp) {
            // Cliente
            const clientRef = doc(db, `barbers/${barberId}/clients`, normalizedWhatsapp);
            const clientDoc = await transaction.get(clientRef);
            
            const servicePrice = appointmentData.service?.price || 0;
            const serviceName = appointmentData.service?.name || 'Serviço';

            if (!clientDoc.exists()) {
               const newClient: Omit<Client, 'id'> = {
                  barberId,
                  name: appointmentData.clientName,
                  whatsapp: normalizedWhatsapp,
                  birthdate: appointmentData.birthdate,
                  tags: ['novo-cliente'],
                  notes: 'Criado via agendamento',
                  totalVisits: 1,
                  totalSpent: servicePrice,
                  lastVisit: appointmentData.date,
                  preferredServices: { [serviceName]: 1 },
                  createdAt: new Date(),
                  updatedAt: new Date()
               };
               transaction.set(clientRef, newClient);
            } else {
               const cData = clientDoc.data() as Client;
               const prefs = cData.preferredServices || {};
               prefs[serviceName] = (prefs[serviceName] || 0) + 1;
               
               transaction.update(clientRef, {
                 totalVisits: (cData.totalVisits || 0) + 1,
                 totalSpent: (cData.totalSpent || 0) + servicePrice,
                 lastVisit: appointmentData.date,
                 preferredServices: prefs,
                 updatedAt: new Date()
               });
            }

            // Fidelidade
            const loyaltyId = `${barberId}_${normalizedWhatsapp}`;
            const loyaltyRef = doc(db, 'loyaltyClients', loyaltyId);
            const loyaltyDoc = await transaction.get(loyaltyRef);
            
            if (loyaltyDoc.exists()) {
              const lData = loyaltyDoc.data();
              if (lData.stars < (lData.goal || 5)) {
                transaction.update(loyaltyRef, { 
                  stars: lData.stars + 1,
                  lifetimeAppointments: (lData.lifetimeAppointments || 0) + 1,
                  updatedAt: new Date()
                });
              }
            } else {
              transaction.set(loyaltyRef, {
                barberId,
                clientWhatsapp: normalizedWhatsapp,
                clientName: appointmentData.clientName,
                stars: 1,
                goal: 5,
                lifetimeAppointments: 1,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
            
            // Financeiro (Transação)
            if (servicePrice > 0) {
              const transRef = doc(collection(db, `barbers/${barberId}/transactions`));
              transaction.set(transRef, {
                barberId,
                type: 'receita',
                amount: servicePrice,
                description: `Serviço: ${serviceName}`,
                category: 'Serviços',
                paymentMethod: appointmentData.paymentMethod,
                date: appointmentData.date,
                clientId: normalizedWhatsapp,
                appointmentId: appointmentId,
                createdAt: new Date()
              });
            }
          }
        }

        transaction.update(appointmentRef, { 
          status, 
          updatedAt: new Date(),
          lembrete24henviado: status === 'Confirmado' ? false : appointmentData.lembrete24henviado 
        });
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  }

  static async cancel(barberId: string, appointmentId: string): Promise<boolean> {
    try {
      const appointmentDocRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
      const appointmentSnap = await getDoc(appointmentDocRef);
      
      if (appointmentSnap.exists()) {
        const appointment = appointmentSnap.data() as Appointment;
        
        // Devolver horário
        const barberRef = doc(db, 'barbers', barberId);
        const barberSnap = await getDoc(barberRef);
        const availability = barberSnap.data()?.availability || {};
        const slots = availability[appointment.date] || [];
        
        if (!slots.includes(appointment.time)) {
          const newSlots = [...slots, appointment.time].sort();
          await updateDoc(barberRef, { [`availability.${appointment.date}`]: newSlots });
        }
        
        await deleteDoc(appointmentDocRef);
      }
      return true;
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      return false;
    }
  }

  static async markReminderAsSent(barberId: string, appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(db, `barbers/${barberId}/appointments`, appointmentId);
      await updateDoc(appointmentRef, { lembrete24henviado: true });
    } catch (error) {
      console.error('Erro ao marcar lembrete como enviado:', error);
    }
  }
}

// ========================================
// PROMOTIONS
// ========================================
export class PromotionService {
  static async getAll(barberId: string): Promise<Promotion[]> {
    try {
      const ref = collection(db, `barbers/${barberId}/promotions`);
      const q = query(ref, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
    } catch (error) {
      console.error('Erro promoções:', error);
      return [];
    }
  }

  static async create(barberId: string, promo: Omit<Promotion, 'id'>): Promise<string> {
    const ref = collection(db, `barbers/${barberId}/promotions`);
    const doc = await addDoc(ref, { ...promo, isActive: true, createdAt: new Date() });
    return doc.id;
  }
  
  static async update(barberId: string, id: string, updates: Partial<Promotion>): Promise<void> {
    const ref = doc(db, `barbers/${barberId}/promotions`, id);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }
  
  static async delete(barberId: string, id: string): Promise<void> {
    await updateDoc(doc(db, `barbers/${barberId}/promotions`, id), { isActive: false });
  }
}

// ========================================
// GALLERY & STORAGE
// ========================================
export class GalleryService {
  static async getAll(barberId: string): Promise<GalleryImage[]> {
    const ref = collection(db, `barbers/${barberId}/gallery`);
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
  }

  static async add(barberId: string, img: Omit<GalleryImage, 'id'>): Promise<string> {
    const ref = collection(db, `barbers/${barberId}/gallery`);
    const d = await addDoc(ref, { ...img, createdAt: new Date() });
    return d.id;
  }

  static async update(barberId: string, id: string, updates: Partial<GalleryImage>): Promise<void> {
    const ref = doc(db, `barbers/${barberId}/gallery`, id);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }

  static async delete(barberId: string, id: string, url: string): Promise<void> {
    if (url.includes('firebasestorage')) {
       try {
         const storageRef = storage.refFromURL(url);
         await storageRef.delete();
       } catch (e) { console.warn('Erro deletar storage', e); }
    }
    await deleteDoc(doc(db, `barbers/${barberId}/gallery`, id));
  }

  static async uploadImage(barberId: string, file: File, folder: 'logos' | 'gallery'): Promise<string> {
     // Implementação simplificada de upload
     const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
     const path = `barbers/${barberId}/${folder}/${fileName}`;
     const ref = storage.ref(path);
     await ref.put(file);
     return await ref.getDownloadURL();
  }
}

// ========================================
// CLIENTS & LOYALTY
// ========================================
export class ClientService {
  static async getAll(barberId: string): Promise<Client[]> {
    const ref = collection(db, `barbers/${barberId}/clients`);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
  }
  
  static async create(barberId: string, data: ClientFormData): Promise<string> {
    const normalized = data.whatsapp.replace(/\D/g, '');
    const ref = doc(db, `barbers/${barberId}/clients`, normalized);
    const snap = await getDoc(ref);
    if (snap.exists()) throw new Error("Cliente já existe");
    
    await setDoc(ref, {
       barberId,
       ...data,
       whatsapp: normalized,
       totalVisits: 0,
       totalSpent: 0,
       createdAt: new Date(),
       updatedAt: new Date()
    });
    return normalized;
  }

  static async update(barberId: string, clientId: string, updates: Partial<Client>): Promise<void> {
    const ref = doc(db, `barbers/${barberId}/clients`, clientId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }

  static async delete(barberId: string, clientId: string): Promise<void> {
    const ref = doc(db, `barbers/${barberId}/clients`, clientId);
    await deleteDoc(ref);
  }
}

export class LoyaltyService {
  static async getClients(barberId: string): Promise<LoyaltyClient[]> {
    const ref = collection(db, 'loyaltyClients');
    const q = query(ref, where('barberId', '==', barberId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyClient));
  }

  static async addStar(barberId: string, clientId: string): Promise<void> {
    const ref = doc(db, 'loyaltyClients', clientId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.stars < (data.goal || 5)) {
        await updateDoc(ref, { 
          stars: data.stars + 1,
          lifetimeAppointments: (data.lifetimeAppointments || 0) + 1,
          updatedAt: new Date()
        });
      }
    }
  }

  static async redeemStars(barberId: string, clientId: string): Promise<void> {
    const ref = doc(db, 'loyaltyClients', clientId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
       await updateDoc(ref, { 
         stars: 0, 
         rewardsRedeemed: (snap.data().rewardsRedeemed || 0) + 1,
         updatedAt: new Date()
       });
    }
  }

  static async updateGoal(barberId: string, clientId: string, newGoal: number): Promise<void> {
    const ref = doc(db, 'loyaltyClients', clientId);
    await updateDoc(ref, { goal: newGoal });
  }
}

// ========================================
// FINANCIALS
// ========================================
export class FinancialService {
  static async getTransactions(barberId: string, start: Date, end: Date): Promise<Transaction[]> {
    const ref = collection(db, `barbers/${barberId}/transactions`);
    const q = query(ref, 
      where('date', '>=', start.toISOString().split('T')[0]),
      where('date', '<=', end.toISOString().split('T')[0]),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
  }

  static async addTransaction(barberId: string, transaction: Omit<Transaction, 'id'>): Promise<string> {
    const ref = collection(db, `barbers/${barberId}/transactions`);
    const doc = await addDoc(ref, { ...transaction, createdAt: new Date() });
    return doc.id;
  }

  static async deleteTransaction(barberId: string, transactionId: string): Promise<void> {
    const ref = doc(db, `barbers/${barberId}/transactions`, transactionId);
    await deleteDoc(ref);
  }

  static async syncFromAppointments(barberId: string, start: Date, end: Date): Promise<number> {
    try {
      // 1. Get confirmed appointments
      const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
      const qApp = query(appointmentsRef, 
        where('status', '==', 'Confirmado'),
        where('date', '>=', start.toISOString().split('T')[0]),
        where('date', '<=', end.toISOString().split('T')[0])
      );
      const appSnaps = await getDocs(qApp);
      
      // 2. Get existing transactions
      const transRef = collection(db, `barbers/${barberId}/transactions`);
      const qTrans = query(transRef, 
         where('date', '>=', start.toISOString().split('T')[0]),
         where('date', '<=', end.toISOString().split('T')[0])
      );
      const transSnaps = await getDocs(qTrans);
      const existingAppIds = new Set(transSnaps.docs.map(d => d.data().appointmentId).filter(Boolean));

      let count = 0;
      const batch = writeBatch(db);

      appSnaps.docs.forEach(appDoc => {
        if (!existingAppIds.has(appDoc.id)) {
           const app = appDoc.data();
           const newTransRef = doc(transRef);
           batch.set(newTransRef, {
              barberId,
              type: 'receita',
              amount: app.service?.price || app.totalPrice || 0,
              description: `Agendamento: ${app.service?.name || 'Serviço'}`,
              category: 'Serviços',
              paymentMethod: app.paymentMethod,
              date: app.date,
              clientId: app.clientWhatsapp?.replace(/\D/g, ''),
              appointmentId: appDoc.id,
              createdAt: new Date()
           });
           count++;
        }
      });

      if (count > 0) await batch.commit();
      return count;
    } catch (error) {
      console.error("Erro sync:", error);
      throw error;
    }
  }
}
