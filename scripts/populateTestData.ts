// Script para popular dados de teste no Firebase
import { db } from '../src/firebaseConfig';
import { ServiceService, PromotionService, GalleryService, BarberService } from '../src/firestoreService';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';

export const populateTestData = async (barberId: string): Promise<boolean> => {
  try {
    console.log('🚀 Populando dados de teste para o barbeiro:', barberId);
    
    // 1. Adicionar serviços
    console.log('📋 Adicionando serviços...');
    const services = [
      { name: 'Corte de Cabelo', price: 50.00, duration: 30 },
      { name: 'Barba', price: 30.00, duration: 20 },
      { name: 'Cabelo + Barba', price: 75.00, duration: 50 },
      { name: 'Sobrancelha', price: 20.00, duration: 15 },
      { name: 'Corte + Barba + Sobrancelha', price: 90.00, duration: 60 }
    ];
    
    for (const service of services) {
      await ServiceService.create(barberId, service);
    }
    
    // 2. Adicionar promoções
    console.log('🎯 Adicionando promoções...');
    const promotions = [
      { title: 'Corte & Barba', description: 'Combo com 10% de desconto', discount: 10, validUntil: new Date('2025-12-31') },
      { title: 'Dia do Amigo', description: 'Traga um amigo e ganhe 15% off', discount: 15, validUntil: new Date('2025-12-31') },
      { title: 'Primeira Visita', description: '20% de desconto na primeira visita', discount: 20, validUntil: new Date('2025-12-31') }
    ];
    
    for (const promotion of promotions) {
      await PromotionService.create(barberId, promotion);
    }
    
    // 3. Adicionar imagens da galeria
    console.log('🖼️ Adicionando imagens da galeria...');
    const galleryImages = [
      { src: 'https://picsum.photos/seed/barber1/600/400', alt: 'Corte moderno', url: 'https://picsum.photos/seed/barber1/600/400' },
      { src: 'https://picsum.photos/seed/barber2/600/400', alt: 'Barba estilizada', url: 'https://picsum.photos/seed/barber2/600/400' },
      { src: 'https://picsum.photos/seed/barber3/600/400', alt: 'Estilo clássico', url: 'https://picsum.photos/seed/barber3/600/400' },
      { src: 'https://picsum.photos/seed/barber4/600/400', alt: 'Corte degradê', url: 'https://picsum.photos/seed/barber4/600/400' }
    ];
    
    for (const image of galleryImages) {
      await GalleryService.add(barberId, image);
    }
    
    // 4. Atualizar disponibilidade
    console.log('📅 Atualizando disponibilidade...');
    const availability = BarberService.generateInitialAvailability();
    await updateDoc(doc(db, 'barbers', barberId), {
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
      slug: 'barbearia-teste',
      email: 'teste@barbearia.com'
    };
    
    // Criar um ID temporário para teste
    const testBarberId = 'test-barber-' + Date.now();
    
    // Criar perfil do barbeiro
    await setDoc(doc(db, 'barbers', testBarberId), {
      profile: {
        ...testBarberData,
        logoUrl: 'https://via.placeholder.com/200x80.png?text=BARBEARIA+TESTE',
        isActive: true,
        createdAt: new Date(),
        userID: testBarberId
      },
      userID: testBarberId,
      availability: BarberService.generateInitialAvailability()
    });
    
    // Criar registro em public-slugs (MANTIDO POR COMPATIBILIDADE SE NECESSÁRIO, MAS NÃO É MAIS CRÍTICO)
    /*
    await setDoc(doc(db, 'public-slugs', testBarberData.slug), {
      barberId: testBarberId,
      isActive: true,
      lastUpdated: new Date()
    });
    */
    
    // Popular com dados de teste
    await populateTestData(testBarberId);
    
    console.log('✅ Barbeiro de teste criado com ID:', testBarberId);
    return testBarberId;
    
  } catch (error) {
    console.error('❌ Erro ao criar barbeiro de teste:', error);
    return null;
  }
};
