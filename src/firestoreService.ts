import { db } from './firebaseConfig';
import type { Promotion, GalleryImage, Service, Appointment, LoyaltyClient } from './types';

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
      console.log(`📊 Carregando dados do barbeiro: ${barberId}`);
      
      // Buscar documento principal do barbeiro
      console.log('🔍 Buscando documento principal do barbeiro...');
      const barberDoc = await db.collection('barbers').doc(barberId).get();
      
      // Validação: Checar se o documento existe
      if (!barberDoc.exists) {
        console.warn(`⚠️ Barbeiro com ID ${barberId} não encontrado.`);
        return null;
      }
      
      const barberData = barberDoc.data();
      console.log('📄 Dados do barbeiro encontrados:', barberData);

      // Validação: Checar se os dados essenciais do perfil existem
      if (!barberData || !barberData.profile || !barberData.profile.shopName) {
        console.error(`❌ Dados do perfil do barbeiro ${barberId} estão incompletos ou corrompidos.`);
        return null;
      }
      
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
      
      const finalData: BarberData = {
        id: barberId,
        profile: barberData.profile,
        availability: barberData.availability || {},
        promotions,
        services,
        galleryImages,
        appointments
      };
      
      console.log('DADOS FINAIS CARREGADOS:', finalData);
      return finalData;
      
    } catch (error) {
      console.error('Erro grave ao carregar dados do barbeiro:', error);
      throw error; // Propaga o erro para ser tratado na UI
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
      console.log('💾 Salvando perfil do barbeiro:', barberId, profileData);
      
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
        console.log('✅ Slug público atualizado:', profileData.slug);
      }
      
      console.log('✅ Perfil atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
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
  
  static async updatePromotion(barberId: string, promotionId: string, promotionData: any): Promise<boolean> {
    try {
      console.log('💾 Atualizando promoção:', promotionId, promotionData);
      await db.collection('barbers').doc(barberId).collection('promotions').doc(promotionId).update({
        ...promotionData,
        updatedAt: new Date()
      });
      console.log('✅ Promoção atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar promoção:', error);
      return false;
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
  
  static async updateService(barberId: string, serviceId: string, serviceData: any): Promise<boolean> {
    try {
      console.log('💾 Atualizando serviço:', serviceId, serviceData);
      await db.collection('barbers').doc(barberId).collection('services').doc(serviceId).update({
        ...serviceData,
        updatedAt: new Date()
      });
      console.log('✅ Serviço atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar serviço:', error);
      return false;
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
  
  static async updateGalleryImage(barberId: string, imageId: string, imageData: any): Promise<boolean> {
    try {
      console.log('💾 Atualizando imagem da galeria:', imageId, imageData);
      await db.collection('barbers').doc(barberId).collection('gallery').doc(imageId).update({
        ...imageData,
        updatedAt: new Date()
      });
      console.log('✅ Imagem da galeria atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar imagem da galeria:', error);
      return false;
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
  
  // BUSCA POR USER ID
  static async findBarberByUserId(userId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando barbeiro por userID: ${userId}`);
      
      // Buscar barbeiro pelo campo userID (tentar diferentes variações)
      let barbersSnapshot = await db.collection('barbers')
        .where('userID', '==', userId)
        .where('profile.isActive', '==', true)
        .limit(1)
        .get();
      
      // Se não encontrou, tentar sem filtro de isActive
      if (barbersSnapshot.empty) {
        console.log('⚠️ Tentando busca sem filtro isActive...');
        barbersSnapshot = await db.collection('barbers')
          .where('userID', '==', userId)
          .limit(1)
          .get();
      }
      
      // Se ainda não encontrou, tentar buscar pelo ID do documento
      if (barbersSnapshot.empty) {
        console.log('⚠️ Tentando busca pelo ID do documento...');
        const directDoc = await db.collection('barbers').doc(userId).get();
        if (directDoc.exists) {
          console.log('✅ Barbeiro encontrado pelo ID do documento');
          return userId;
        }
      }
      
      if (!barbersSnapshot.empty) {
        const barberId = barbersSnapshot.docs[0].id;
        const barberData = barbersSnapshot.docs[0].data();
        console.log(`✅ Barbeiro encontrado para userID ${userId}: ${barberId}`);
        console.log('📄 Dados do barbeiro encontrado:', barberData);
        return barberId;
      }
      
      console.log(`❌ Nenhum barbeiro encontrado para userID: ${userId}`);
      console.log('🔍 Vamos verificar todos os barbeiros disponíveis...');
      
      // Debug: listar todos os barbeiros para ver a estrutura
      const allBarbers = await db.collection('barbers').limit(5).get();
      console.log('📋 Barbeiros disponíveis:');
      allBarbers.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, userID: ${data.userID}, profile.userID: ${data.profile?.userID}`);
      });
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar barbeiro por userID:', error);
      throw error;
    }
  }

  // BUSCA POR SLUG PÚBLICO
  static async findBarberBySlug(slug: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando barbeiro por slug: ${slug}`);
      
      // Primeiro, tentar buscar na coleção public-slugs
      const slugDoc = await db.collection('public-slugs').doc(slug).get();
      
      if (slugDoc.exists && slugDoc.data()?.isActive) {
        const barberId = slugDoc.data()?.barberId || null;
        console.log(`✅ Barbeiro encontrado na public-slugs com ID: ${barberId}`);
        return barberId;
      }
      
      console.log(`⚠️ Slug não encontrado em public-slugs, buscando diretamente na coleção barbers...`);
      
      // Se não encontrou em public-slugs, buscar diretamente na coleção barbers
      const barbersSnapshot = await db.collection('barbers')
        .where('profile.slug', '==', slug)
        .where('profile.isActive', '==', true)
        .limit(1)
        .get();
      
      if (!barbersSnapshot.empty) {
        const barberDoc = barbersSnapshot.docs[0];
        const barberId = barberDoc.id;
        console.log(`✅ Barbeiro encontrado diretamente na coleção barbers com ID: ${barberId}`);
        
        // Criar automaticamente o registro em public-slugs para futuras consultas
        try {
          await db.collection('public-slugs').doc(slug).set({
            barberId: barberId,
            isActive: true,
            lastUpdated: new Date(),
            autoCreated: true
          });
          console.log(`✅ Registro criado automaticamente em public-slugs para slug: ${slug}`);
        } catch (createError) {
          console.warn(`⚠️ Não foi possível criar registro em public-slugs:`, createError);
        }
        
        return barberId;
      }
      
      console.log(`❌ Slug ${slug} não encontrado em nenhuma coleção`);
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar por slug:', error);
      throw error; // Propaga o erro para ser tratado na UI
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
  
  // GERAR SLUG ÚNICO
  static async generateUniqueSlug(baseSlug: string): Promise<string> {
    try {
      let slug = baseSlug.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      let counter = 1;
      let finalSlug = slug;
      
      // Verificar se o slug já existe
      while (true) {
        const slugDoc = await db.collection('public-slugs').doc(finalSlug).get();
        if (!slugDoc.exists) {
          break;
        }
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      console.log('✅ Slug único gerado:', finalSlug);
      return finalSlug;
    } catch (error) {
      console.error('❌ Erro ao gerar slug único:', error);
      return baseSlug + '-' + Date.now();
    }
  }
  
  // CRIAR NOVO BARBEIRO COMPLETO
  static async createNewBarber(userId: string, barberData: {
    shopName: string;
    location: string;
    whatsappNumber: string;
    email: string;
  }): Promise<string | null> {
    try {
      console.log('👤 Criando novo barbeiro:', barberData);
      
      // Gerar slug único baseado no nome da barbearia
      const baseSlug = barberData.shopName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const uniqueSlug = await this.generateUniqueSlug(baseSlug);
      
      // Criar documento do barbeiro
      const barberId = userId; // Usar o userId como barberId
      await db.collection('barbers').doc(barberId).set({
        profile: {
          ...barberData,
          slug: uniqueSlug,
          logoUrl: 'https://via.placeholder.com/200x80.png?text=SUA+LOGO',
          isActive: true,
          createdAt: new Date()
        },
        userID: userId,
        availability: this.generateInitialAvailability()
      });
      
      // Criar slug público
      await db.collection('public-slugs').doc(uniqueSlug).set({
        barberId: barberId,
        isActive: true,
        lastUpdated: new Date()
      });
      
      console.log('✅ Novo barbeiro criado com sucesso:', barberId, 'Slug:', uniqueSlug);
      return barberId;
      
    } catch (error) {
      console.error('❌ Erro ao criar novo barbeiro:', error);
      return null;
    }
  }

  // FIDELIDADE
  static async awardLoyaltyPoints(barberId: string, clientWhatsapp: string, clientName: string, amountSpent: number): Promise<LoyaltyClient | null> {
    const pointsToAdd = Math.floor(amountSpent / 10); // Regra: 1 ponto a cada R$10
    if (pointsToAdd <= 0) {
      // Se não houver pontos a adicionar, ainda retorna o cliente existente para mostrar o saldo
      return this.getLoyaltyClient(barberId, clientWhatsapp);
    }

    const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
    const docId = `${barberId}_${normalizedWhatsapp}`;
    const clientRef = db.collection('loyaltyClients').doc(docId);

    try {
      await db.runTransaction(async (transaction) => {
        const clientDoc = await transaction.get(clientRef);

        if (clientDoc.exists) {
            const data = clientDoc.data() as LoyaltyClient;
            const currentPoints = data.points || 0;
            const currentAppointments = data.lifetimeAppointments || 0;
            
            transaction.update(clientRef, {
                points: currentPoints + pointsToAdd,
                lifetimeAppointments: currentAppointments + 1,
                clientName: clientName, // Atualiza o nome mais recente
                updatedAt: new Date()
            });
        } else {
            transaction.set(clientRef, {
                id: docId,
                barberId: barberId,
                clientWhatsapp: normalizedWhatsapp,
                clientName: clientName,
                points: pointsToAdd,
                lifetimeAppointments: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
      });
      console.log(`✅ ${pointsToAdd} pontos concedidos a ${clientName}.`);
      return this.getLoyaltyClient(barberId, normalizedWhatsapp);
    } catch (error) {
      console.error('❌ Erro ao conceder pontos de fidelidade:', error);
      return null;
    }
  }

  static async getLoyaltyClient(barberId: string, clientWhatsapp: string): Promise<LoyaltyClient | null> {
    const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
    const docId = `${barberId}_${normalizedWhatsapp}`;
    const doc = await db.collection('loyaltyClients').doc(docId).get();
    if (doc.exists) {
      return doc.data() as LoyaltyClient;
    }
    return null;
  }
  
  static async getLoyaltyClientsForBarber(barberId: string): Promise<LoyaltyClient[]> {
    try {
      const snapshot = await db.collection('loyaltyClients')
        .where('barberId', '==', barberId)
        .get();
      
      const clients = snapshot.docs.map(doc => doc.data() as LoyaltyClient);
      
      // Ordenar no lado do cliente para evitar a necessidade de um índice composto
      clients.sort((a, b) => (b.points || 0) - (a.points || 0));

      return clients;
    } catch (error) {
      console.error('❌ Erro ao buscar clientes de fidelidade:', error);
      return [];
    }
  }

  static async redeemLoyaltyPoints(barberId: string, clientWhatsapp: string, pointsToRedeem: number): Promise<boolean> {
    const normalizedWhatsapp = clientWhatsapp.replace(/\D/g, '');
    const docId = `${barberId}_${normalizedWhatsapp}`;
    const clientRef = db.collection('loyaltyClients').doc(docId);

    try {
      await db.runTransaction(async (transaction) => {
        const clientDoc = await transaction.get(clientRef);

        if (!clientDoc.exists) {
          throw new Error("Cliente não encontrado no programa de fidelidade.");
        }

        const currentPoints = clientDoc.data()?.points || 0;
        if (currentPoints < pointsToRedeem) {
          throw new Error("Pontos insuficientes para resgate.");
        }

        transaction.update(clientRef, {
          points: currentPoints - pointsToRedeem,
          updatedAt: new Date()
        });
      });
      console.log(`✅ ${pointsToRedeem} pontos resgatados para ${normalizedWhatsapp}.`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao resgatar pontos:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    }
  }
}