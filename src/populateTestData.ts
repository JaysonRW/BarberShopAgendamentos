// Script para popular dados de teste no Firebase
import { db } from './firebaseConfig';
import { FirestoreService } from './firestoreService';

export const populateTestData = async (barberId: string): Promise<boolean> => {
  try {
    console.log('🚀 Populando dados de teste para o barbeiro:', barberId);
    
    // 1. Adicionar serviços
    console.log('📋 Adicionando serviços...');
    const services = [
      { name: 'Corte de Cabelo', price: 50.00 },
      { name: 'Barba', price: 30.00 },
      { name: 'Cabelo + Barba', price: 75.00 },
      { name: 'Sobrancelha', price: 20.00 },
      { name: 'Corte + Barba + Sobrancelha', price: 90.00 }
    ];
    
    for (const service of services) {
      await FirestoreService.addService(barberId, service);
    }
    
    // 2. Adicionar promoções
    console.log('🎯 Adicionando promoções...');
    const promotions = [
      { title: 'Corte & Barba', description: 'Combo com 10% de desconto' },
      { title: 'Dia do Amigo', description: 'Traga um amigo e ganhe 15% off' },
      { title: 'Primeira Visita', description: '20% de desconto na primeira visita' }
    ];
    
    for (const promotion of promotions) {
      await FirestoreService.addPromotion(barberId, promotion);
    }
    
    // 3. Adicionar imagens da galeria
    console.log('🖼️ Adicionando imagens da galeria...');
    const galleryImages = [
      { src: 'https://picsum.photos/seed/barber1/600/400', alt: 'Corte moderno' },
      { src: 'https://picsum.photos/seed/barber2/600/400', alt: 'Barba estilizada' },
      { src: 'https://picsum.photos/seed/barber3/600/400', alt: 'Estilo clássico' },
      { src: 'https://picsum.photos/seed/barber4/600/400', alt: 'Corte degradê' }
    ];
    
    for (const image of galleryImages) {
      await FirestoreService.addGalleryImage(barberId, image);
    }
    
    // 4. Atualizar disponibilidade
    console.log('📅 Atualizando disponibilidade...');
    const availability = FirestoreService.generateInitialAvailability();
    await db.collection('barbers').doc(barberId).update({
      availability: availability
    });
    
    console.log('✅ Dados de teste populados com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao popular dados de teste:', error);
    return false;
  }
};

// Função para criar um barbeiro de teste completo
export const createTestBarber = async (): Promise<string | null> => {
  try {
    console.log('👤 Criando barbeiro de teste...');
    
    const testBarberData = {
      shopName: 'Barbearia Teste',
      location: 'Rua das Flores, 123, Centro, São Paulo - SP',
      whatsappNumber: '5511999999999',
      slug: 'barbearia-teste'
    };
    
    // Criar um ID temporário para teste
    const testBarberId = 'test-barber-' + Date.now();
    
    // Criar perfil do barbeiro
    await db.collection('barbers').doc(testBarberId).set({
      profile: {
        ...testBarberData,
        logoUrl: 'https://via.placeholder.com/200x80.png?text=BARBEARIA+TESTE',
        isActive: true,
        createdAt: new Date()
      },
      availability: FirestoreService.generateInitialAvailability()
    });
    
    // Criar registro em public-slugs
    await db.collection('public-slugs').doc(testBarberData.slug).set({
      barberId: testBarberId,
      isActive: true,
      lastUpdated: new Date()
    });
    
    // Popular com dados de teste
    await populateTestData(testBarberId);
    
    console.log('✅ Barbeiro de teste criado com ID:', testBarberId);
    return testBarberId;
    
  } catch (error) {
    console.error('❌ Erro ao criar barbeiro de teste:', error);
    return null;
  }
};
