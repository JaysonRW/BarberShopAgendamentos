// FIX: Import the 'firebase' module to resolve type errors for DocumentSnapshot and DocumentReference.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db, storage, auth } from './firebaseConfig';
import type { Promotion, GalleryImage, Service, Appointment, LoyaltyClient, Client, ClientFormData } from './types';

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
    createdAt?: any;
    userID?: string; // Garante que o userID esteja no perfil
    theme?: { primaryColor: string; secondaryColor: string; }; // Adicionado
  };
  promotions: Promotion[];
  galleryImages: GalleryImage[];
  services: Service[];
  appointments: Appointment[];
  availability: Record<string, string[]>;
}

// Classe para gerenciar todas as operações do Firestore
export class FirestoreService {
  
  // Wrapper de segurança para todas as operações de escrita
  private static async withAuthentication<T>(
    barberId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const user = auth.currentUser;
    if (!user) {
      console.error('Security Error: Operation attempted without authentication.');
      throw new Error('Usuário não autenticado.');
    }

    // A verificação principal é se o UID do usuário logado é o mesmo que o ID do documento do barbeiro.
    if (user.uid !== barberId) {
      console.error(`SECURITY ALERT: Unauthorized write attempt by user ${user.uid} on barber ${barberId}.`);
      // Força o logout como medida de segurança
      await auth.signOut();
      throw new Error('Tentativa de acesso não autorizada detectada. A sua sessão foi encerrada.');
    }

    // Se autorizado, prossegue com a operação.
    return operation();
  }
  
 static uploadImage(
  barberId: string,
  file: File, 
  folder: 'logos' | 'gallery', 
  onProgress: (progress: number) => void
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    return Promise.reject(new Error("Usuário não autenticado para fazer upload."));
  }

  // Validação de segurança
  if (user.uid !== barberId) {
    console.error(`SECURITY ALERT: User ${user.uid} attempting to upload to barber ${barberId}'s storage.`);
    return Promise.reject(new Error("Acesso não autorizado para upload."));
  }
  
  return new Promise((resolve, reject) => {
    const sanitizedFileName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    const timestamp = Date.now();
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const fullPath = `barbers/${barberId}/${folder}/${fileName}`;
    
    console.log(`🚀 Iniciando upload: ${fullPath}`);
    
    const storageRef = storage.ref(fullPath);
    const uploadTask = storageRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload: ${progress.toFixed(0)}% concluído`);
        onProgress(progress);
      }, 
      (error) => {
        console.error('❌ Erro no upload:', error);
        reject(error);
      }, 
      async () => {
        try {
          const downloadURL = await storageRef.getDownloadURL();
          console.log('✅ Upload concluído! URL:', downloadURL);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

  // DELETAR IMAGEM DO STORAGE
  static async deleteImageFromStorage(imageUrl: string): Promise<boolean> {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      console.log('URL de imagem inválida ou não é do Firebase Storage, pulando deleção.');
      return true;
    }
    try {
      const imageRef = storage.refFromURL(imageUrl);
      await imageRef.delete();
      console.log('✅ Imagem deletada do Storage com sucesso.');
      return true;
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn('⚠️ Imagem não encontrada no Storage, pode já ter sido deletada.');
        return true;
      }
      console.error('❌ Erro ao deletar imagem do Storage:', error);
      return false;
    }
  }

  // Carregar dados PÚBLICOS de um barbeiro (não inclui agendamentos)
  static async loadPublicBarberData(barberId: string): Promise<BarberData | null> {
    try {
      console.log(`📊 Carregando dados PÚBLICOS do barbeiro: ${barberId}`);
      
      const barberDoc = await db.collection('barbers').doc(barberId).get();
      
      if (!barberDoc.exists) {
        console.warn(`⚠️ Barbeiro com ID ${barberId} não encontrado.`);
        return null;
      }
      
      const barberData = barberDoc.data();

      if (!barberData || !barberData.profile || !barberData.profile.shopName) {
        console.error(`❌ Dados do perfil do barbeiro ${barberId} estão incompletos ou corrompidos.`);
        return null;
      }
      
      const [promotionsSnapshot, servicesSnapshot, gallerySnapshot] = await Promise.all([
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
      ]);
      
      const promotions: Promotion[] = promotionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
      const services: Service[] = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      const galleryImages: GalleryImage[] = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
      
      const finalData: BarberData = {
        id: barberId,
        profile: barberData.profile,
        availability: barberData.availability || {},
        promotions,
        services,
        galleryImages,
        appointments: [] // Importante: retorna vazio para a visualização pública
      };
      
      return finalData;
      
    } catch (error) {
      console.error('Erro grave ao carregar dados públicos do barbeiro:', error);
      throw error;
    }
  }

  // Novo método para buscar agendamentos de forma segura (apenas para admin)
  static async getAppointments(barberId: string): Promise<Appointment[]> {
    const user = auth.currentUser;
    // As regras do Firestore já protegem, mas esta é uma verificação extra no cliente.
    if (!user || user.uid !== barberId) {
        console.warn(`Tentativa não autorizada de ler agendamentos para ${barberId}`);
        return []; // Retorna vazio se não estiver logado como o dono
    }
    try {
        const appointmentsSnapshot = await db.collection('barbers').doc(barberId).collection('appointments')
            .orderBy('date', 'desc')
            .limit(100)
            .get();
        
        const appointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        return appointments;
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw error; // Propaga o erro para ser tratado na UI
    }
  }
  
  // Atualizar perfil do barbeiro
  static async updateBarberProfile(barberId: string, profileData: any): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).update({
          'profile': { ...profileData, updatedAt: new Date() }
        });
        if (profileData.slug) {
          await db.collection('public-slugs').doc(profileData.slug).set({
            barberId: barberId,
            isActive: true,
            lastUpdated: new Date()
          });
        }
        return true;
      } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        return false;
      }
    });
  }
  
  // PROMOÇÕES
  static async addPromotion(barberId: string, promotion: Omit<Promotion, 'id'>): Promise<string | null> {
    return this.withAuthentication(barberId, async () => {
      try {
        const docRef = await db.collection('barbers').doc(barberId).collection('promotions').add({
          ...promotion, isActive: true, createdAt: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Erro ao adicionar promoção:', error);
        return null;
      }
    });
  }
  
  static async updatePromotion(barberId: string, promotionId: string, promotionData: any): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('promotions').doc(promotionId).update({
          ...promotionData, updatedAt: new Date()
        });
        return true;
      } catch (error) {
        console.error('❌ Erro ao atualizar promoção:', error);
        return false;
      }
    });
  }
  
  static async deletePromotion(barberId: string, promotionId: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('promotions').doc(promotionId).update({
          isActive: false, deletedAt: new Date()
        });
        return true;
      } catch (error) {
        console.error('Erro ao deletar promoção:', error);
        return false;
      }
    });
  }
  
  // SERVIÇOS
  static async addService(barberId: string, service: Omit<Service, 'id'>): Promise<string | null> {
    return this.withAuthentication(barberId, async () => {
      try {
        const docRef = await db.collection('barbers').doc(barberId).collection('services').add({
          ...service, isActive: true, createdAt: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        return null;
      }
    });
  }
  
  static async updateService(barberId: string, serviceId: string, serviceData: any): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('services').doc(serviceId).update({
          ...serviceData, updatedAt: new Date()
        });
        return true;
      } catch (error) {
        console.error('❌ Erro ao atualizar serviço:', error);
        return false;
      }
    });
  }
  
  static async deleteService(barberId: string, serviceId: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('services').doc(serviceId).update({
          isActive: false, deletedAt: new Date()
        });
        return true;
      } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        return false;
      }
    });
  }
  
  // GALERIA
  static async addGalleryImage(barberId: string, image: Omit<GalleryImage, 'id'>, order?: number): Promise<string | null> {
    return this.withAuthentication(barberId, async () => {
      try {
        const docRef = await db.collection('barbers').doc(barberId).collection('gallery').add({
          ...image, order: order || Date.now(), createdAt: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Erro ao adicionar imagem:', error);
        return null;
      }
    });
  }
  
  static async updateGalleryImage(barberId: string, imageId: string, imageData: any): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('gallery').doc(imageId).update({
          ...imageData, updatedAt: new Date()
        });
        return true;
      } catch (error) {
        console.error('❌ Erro ao atualizar imagem da galeria:', error);
        return false;
      }
    });
  }
  
  static async deleteGalleryImage(barberId: string, imageId: string, imageUrl: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await this.deleteImageFromStorage(imageUrl);
        await db.collection('barbers').doc(barberId).collection('gallery').doc(imageId).delete();
        return true;
      } catch (error) {
        console.error('Erro ao deletar imagem da galeria:', error);
        return false;
      }
    });
  }
  
  // AGENDAMENTOS - LÓGICA REATORADA PARA SEGURANÇA
  static async createAppointment(barberId: string, appointmentData: Omit<Appointment, 'id'>): Promise<string | null> {
    try {
      // Passo 1: Verificar a disponibilidade (operação de leitura, permitida publicamente)
      const barberDocRef = db.collection('barbers').doc(barberId);
      const barberDoc = await barberDocRef.get();
      if (!barberDoc.exists) throw new Error("Barbearia não encontrada.");

      const availability = barberDoc.data()?.availability || {};
      const availableSlots = availability[appointmentData.date] || [];

      if (!availableSlots.includes(appointmentData.time)) {
        alert('Desculpe, este horário não está mais disponível. Por favor, escolha outro.');
        return null;
      }
      
      // Passo 2: Criar o agendamento como "Pendente" (operação de escrita na subcoleção)
      // Esta operação requer uma regra de segurança que permita a criação de documentos por qualquer usuário.
      const newAppointmentRef = db.collection('barbers').doc(barberId).collection('appointments').doc();
      await newAppointmentRef.set({
        ...appointmentData,
        status: 'Pendente',
        createdAt: new Date(),
        updatedAt: new Date(),
        lembrete24henviado: false
      });
      
      // A disponibilidade NÃO é atualizada aqui. Será atualizada pelo barbeiro ao confirmar.
      return newAppointmentRef.id;

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      const typedError = error as { message?: string };
      if (typedError.message && typedError.message.includes('permission-denied')) {
        alert('Ocorreu um erro de permissão. A configuração de segurança da barbearia pode estar impedindo novos agendamentos. Por favor, avise o proprietário.');
      } else {
        alert('Não foi possível registrar seu agendamento. Tente novamente.');
      }
      return null;
    }
  }

  private static async createOrUpdateClientFromAppointment(
    transaction: firebase.firestore.Transaction,
    barberRef: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>,
    appointmentData: Appointment
  ) {
      const normalizedWhatsapp = appointmentData.clientWhatsapp.replace(/\D/g, '');
      if (!normalizedWhatsapp) return;

      const clientRef = barberRef.collection('clients').doc(normalizedWhatsapp);
      const clientDoc = await transaction.get(clientRef);

      const servicePrice = appointmentData.service?.price || 0;
      const serviceName = appointmentData.service?.name || 'Serviço Desconhecido';

      if (!clientDoc.exists) {
          const newClientData: Omit<Client, 'id'> = {
              barberId: barberRef.id,
              name: appointmentData.clientName,
              whatsapp: normalizedWhatsapp,
              email: '',
              birthdate: '',
              tags: ['novo-cliente'],
              notes: `Cliente criado automaticamente do agendamento em ${new Date(appointmentData.date).toLocaleDateString('pt-BR')}.`,
              totalVisits: 1,
              totalSpent: servicePrice,
              lastVisit: appointmentData.date,
              preferredServices: { [serviceName]: 1 },
              createdAt: new Date(),
              updatedAt: new Date(),
          };
          transaction.set(clientRef, newClientData);
      } else {
          const clientData = clientDoc.data() as Client;
          const updatedPreferredServices = { ...clientData.preferredServices };
          updatedPreferredServices[serviceName] = (updatedPreferredServices[serviceName] || 0) + 1;

          const updateData: Partial<Client> = {
              totalVisits: (clientData.totalVisits || 0) + 1,
              totalSpent: (clientData.totalSpent || 0) + servicePrice,
              lastVisit: appointmentData.date,
              preferredServices: updatedPreferredServices,
              name: appointmentData.clientName, // Sempre atualiza o nome para o mais recente
              updatedAt: new Date(),
          };
          transaction.update(clientRef, updateData);
      }
  }
  
  static async updateAppointmentStatus(barberId: string, appointmentId: string, status: 'Pendente' | 'Confirmado'): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      const barberRef = db.collection('barbers').doc(barberId);
      const appointmentRef = barberRef.collection('appointments').doc(appointmentId);
      
      try {
        await db.runTransaction(async (transaction) => {
          const appointmentDoc = await transaction.get(appointmentRef);
          if (!appointmentDoc.exists) throw new Error("Agendamento não encontrado.");
          
          const barberDoc = await transaction.get(barberRef);
          if (!barberDoc.exists) throw new Error("Barbearia não encontrada.");

          const appointmentData = appointmentDoc.data() as Appointment;
          const normalizedWhatsapp = appointmentData.clientWhatsapp.replace(/\D/g, '');
          
          const currentStatus = appointmentData.status;
          
          if (currentStatus === 'Pendente' && status === 'Confirmado') {
            const availability = barberDoc.data()?.availability || {};
            const daySlots = availability[appointmentData.date] || [];
            if (daySlots.includes(appointmentData.time)) {
              const updatedSlots = daySlots.filter((slot: string) => slot !== appointmentData.time);
              transaction.update(barberRef, { [`availability.${appointmentData.date}`]: updatedSlots });
            }
            
            // Lógica de Fidelidade (existente)
            if (normalizedWhatsapp) {
              const loyaltyDocId = `${barberId}_${normalizedWhatsapp}`;
              const clientRef = db.collection('loyaltyClients').doc(loyaltyDocId);
              const clientDoc = await transaction.get(clientRef);
              const GOAL = 5;
              const data = clientDoc?.data() as LoyaltyClient | undefined;
              const currentStars = data?.stars || 0;
              const currentGoal = data?.goal || GOAL;
              if (currentStars < currentGoal) {
                  const newStars = currentStars + 1;
                  const clientData: Partial<LoyaltyClient> = {
                      barberId, clientWhatsapp: normalizedWhatsapp, clientName: appointmentData.clientName,
                      stars: newStars, goal: currentGoal,
                      lifetimeAppointments: (data?.lifetimeAppointments || 0) + 1,
                      updatedAt: new Date(),
                  };
                  if (!clientDoc?.exists) {
                    clientData.id = clientRef.id;
                    clientData.createdAt = new Date();
                  }
                  transaction.set(clientRef, clientData, { merge: true });
              }
            }
            // Nova Lógica de Gestão de Clientes
            await this.createOrUpdateClientFromAppointment(transaction, barberRef, appointmentData);
          }
          
          const updateData: any = { status, updatedAt: new Date() };
          if (status === 'Confirmado') {
            updateData.lembrete24henviado = false;
          }
          
          transaction.update(appointmentRef, updateData);
        });
        
        return true;
      } catch (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        return false;
      }
    });
  }

  static async markReminderAsSent(barberId: string, appointmentId: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).update({
          lembrete24henviado: true,
          updatedAt: new Date()
        });
        console.log(`✅ Lembrete para agendamento ${appointmentId} marcado como enviado.`);
        return true;
      } catch (error) {
        console.error('❌ Erro ao marcar lembrete como enviado:', error);
        return false;
      }
    });
  }
  
  static async cancelAppointment(barberId: string, appointmentId: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      try {
        const appointmentDoc = await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).get();
        if (appointmentDoc.exists) {
          const appointment = appointmentDoc.data() as Appointment;
          const barberDoc = await db.collection('barbers').doc(barberId).get();
          const availability = barberDoc.data()?.availability || {};
          const currentSlots = availability[appointment.date] || [];
          if (!currentSlots.includes(appointment.time)) {
            const updatedSlots = [...currentSlots, appointment.time].sort();
            await db.collection('barbers').doc(barberId).update({
              [`availability.${appointment.date}`]: updatedSlots
            });
          }
          await db.collection('barbers').doc(barberId).collection('appointments').doc(appointmentId).delete();
        }
        return true;
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        return false;
      }
    });
  }
  
  // BUSCA POR USER ID
  static async findBarberByUserId(userId: string): Promise<string | null> {
    try {
      const directDoc = await db.collection('barbers').doc(userId).get();
      if (directDoc.exists) {
        return userId;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar barbeiro por userID:', error);
      throw error;
    }
  }

  // BUSCA POR SLUG PÚBLICO
  static async findBarberBySlug(slug: string): Promise<string | null> {
    try {
      const barbersSnapshot = await db.collection('barbers')
        .where('profile.slug', '==', slug)
        .limit(1)
        .get();
      
      if (!barbersSnapshot.empty) {
        const barberDoc = barbersSnapshot.docs[0];
        if (barberDoc.data()?.profile?.isActive) {
          return barberDoc.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar por slug:', error);
      throw error;
    }
  }
  
  // DISPONIBILIDADE
  static generateInitialAvailability(): Record<string, string[]> {
    const availability: Record<string, string[]> = {};
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
  
  static async updateAvailability(barberId: string, date: string, availableSlots: string[]): Promise<boolean> {
     return this.withAuthentication(barberId, async () => {
      try {
        await db.collection('barbers').doc(barberId).update({
          [`availability.${date}`]: availableSlots
        });
        return true;
      } catch (error) {
        console.error('Erro ao atualizar disponibilidade:', error);
        return false;
      }
    });
  }
  
  // GERAR SLUG ÚNICO
  static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let counter = 1;
    let finalSlug = slug;
    while (true) {
      // Since we removed public-slugs, we query the main collection. This might be slow.
      const barbersSnapshot = await db.collection('barbers').where('profile.slug', '==', finalSlug).limit(1).get();
      if (barbersSnapshot.empty) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    return finalSlug;
  }
  
  // CRIAR NOVO BARBEIRO COMPLETO
  static async createNewBarber(userId: string, barberData: {
    shopName: string; location: string; whatsappNumber: string; email: string;
  }): Promise<string | null> {
    try {
      const baseSlug = barberData.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const uniqueSlug = await this.generateUniqueSlug(baseSlug);
      const barberId = userId;
      
      await db.collection('barbers').doc(barberId).set({
        profile: {
          ...barberData,
          slug: uniqueSlug,
          logoUrl: 'https://placehold.co/200x80/111827/FFFFFF/png?text=SUA+LOGO',
          isActive: true,
          createdAt: new Date(),
          userID: userId, // Campo explícito para validação
        },
        userID: userId, // Campo de nível superior para regras de segurança
        availability: this.generateInitialAvailability()
      });
      
      // No longer creating in public-slugs to avoid permission errors
      return barberId;
    } catch (error) {
      console.error('❌ Erro ao criar novo barbeiro:', error);
      return null;
    }
  }

  // --- MÉTODOS DE GESTÃO DE CLIENTES ---

  static async getClients(barberId: string): Promise<Client[]> {
    return this.withAuthentication(barberId, async () => {
      const snapshot = await db.collection('barbers').doc(barberId).collection('clients').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    });
  }

  static async addClient(barberId: string, clientData: ClientFormData): Promise<string> {
    return this.withAuthentication(barberId, async () => {
      const normalizedWhatsapp = clientData.whatsapp.replace(/\D/g, '');
      if (!normalizedWhatsapp) throw new Error("WhatsApp é obrigatório.");

      const clientRef = db.collection('barbers').doc(barberId).collection('clients').doc(normalizedWhatsapp);
      const doc = await clientRef.get();
      if (doc.exists) throw new Error("Um cliente com este WhatsApp já existe.");

      const newClient: Omit<Client, 'id'> = {
        barberId,
        ...clientData,
        whatsapp: normalizedWhatsapp,
        totalVisits: 0,
        totalSpent: 0,
        lastVisit: null,
        preferredServices: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await clientRef.set(newClient);
      return clientRef.id;
    });
  }

  static async updateClient(barberId: string, clientId: string, clientData: Partial<ClientFormData>): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      const clientRef = db.collection('barbers').doc(barberId).collection('clients').doc(clientId);
      await clientRef.update({ ...clientData, updatedAt: new Date() });
      return true;
    });
  }

  static async deleteClient(barberId: string, clientId: string): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      const clientRef = db.collection('barbers').doc(barberId).collection('clients').doc(clientId);
      await clientRef.delete();
      return true;
    });
  }


  // FIDELIDADE - NOVO SISTEMA DE ESTRELAS
  static async addStar(barberId: string, clientWhatsapp: string, clientName: string): Promise<{newStars: number, goal: number} | null> {
    return this.withAuthentication(barberId, async () => {
      const GOAL = 5;
      const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
      if (!normalizedWhatsapp) return null;
      const docId = `${barberId}_${normalizedWhatsapp}`;
      const clientRef = db.collection('loyaltyClients').doc(docId);

      try {
        const result = await db.runTransaction(async (transaction) => {
            const clientDoc = await transaction.get(clientRef);
            const data = clientDoc.data() as LoyaltyClient | undefined;
            const currentStars = data?.stars || 0;
            const currentGoal = data?.goal || GOAL;
            if (currentStars >= currentGoal) return { newStars: currentStars, goal: currentGoal }; 
            const newStars = currentStars + 1;
            const clientData: Partial<LoyaltyClient> = {
                barberId, clientWhatsapp: normalizedWhatsapp, clientName,
                stars: newStars, goal: currentGoal,
                lifetimeAppointments: (data?.lifetimeAppointments || 0) + 1,
                updatedAt: new Date(),
            };
            if (!clientDoc.exists) {
              clientData.id = docId;
              clientData.createdAt = new Date();
            }
            transaction.set(clientRef, clientData, { merge: true });
            return { newStars, goal: currentGoal };
        });
        return result;
      } catch (error) {
          console.error('❌ Erro ao adicionar estrela:', error);
          return null;
      }
    });
  }

  static async getLoyaltyClient(barberId: string, clientWhatsapp: string): Promise<LoyaltyClient | null> {
    const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
    const docId = `${barberId}_${normalizedWhatsapp}`;
    const doc = await db.collection('loyaltyClients').doc(docId).get();
    return doc.exists ? doc.data() as LoyaltyClient : null;
  }
  
  static async getLoyaltyClientsForBarber(barberId: string): Promise<LoyaltyClient[]> {
  try {
    const snapshot = await db.collection('loyaltyClients')
      .where('barberId', '==', barberId)  // FILTRO CRÍTICO
      .orderBy('clientName', 'asc') // MUDANÇA: Ordenar por nome para consistência
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LoyaltyClient));
  } catch (error) {
    console.error('Erro ao carregar clientes de fidelidade:', error);
    return [];
  }
}

  static async redeemStars(barberId: string, clientWhatsapp: string, goal: number): Promise<boolean> {
    return this.withAuthentication(barberId, async () => {
      const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
      const docId = `${barberId}_${normalizedWhatsapp}`;
      const clientRef = db.collection('loyaltyClients').doc(docId);
      try {
        await db.runTransaction(async (transaction) => {
          const clientDoc = await transaction.get(clientRef);
          if (!clientDoc.exists) throw new Error("Cliente não encontrado.");
          const currentStars = clientDoc.data()?.stars || 0;
          if (currentStars < goal) throw new Error("Estrelas insuficientes.");
          transaction.update(clientRef, { stars: currentStars - goal, updatedAt: new Date() });
        });
        return true;
      } catch (error) {
        console.error('❌ Erro ao resgatar estrelas:', error);
        const typedError = error as { message?: string };
        alert(typedError.message || 'Erro desconhecido');
        return false;
      }
    });
  }
}
