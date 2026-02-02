import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  updateDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyU1nm3zsW4RVtnYiw_dZ4-RSrUUlRsRM",
  authDomain: "barbershop-agendamentos.firebaseapp.com",
  projectId: "barbershop-agendamentos",
  storageBucket: "barbershop-agendamentos.firebasestorage.app",
  messagingSenderId: "578529360983",
  appId: "1:578529360983:web:1bcc2ff38459b53e043712"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateAllBarbers() {
  console.log("🚀 Iniciando migração de todos os barbeiros...");
  
  try {
    const barbersSnapshot = await getDocs(collection(db, "barbers"));
    console.log(`📊 Total de barbeiros encontrados: ${barbersSnapshot.size}`);

    for (const barberDoc of barbersSnapshot.docs) {
      const barberId = barberDoc.id;
      const data = barberDoc.data();
      
      console.log(`\n🔄 Migrando barbeiro: ${barberId}`);
      
      const batch = writeBatch(db);
      let operationCount = 0;

      // 1. Migrar Appointments
      if (Array.isArray(data.appointments) && data.appointments.length > 0) {
        console.log(`    📅 Migrando ${data.appointments.length} agendamentos...`);
        const appointmentsRef = collection(db, `barbers/${barberId}/appointments`);
        
        for (const appt of data.appointments) {
          const newDocRef = doc(appointmentsRef, appt.id || undefined); // Use ID if exists, or auto-id
          batch.set(newDocRef, {
            ...appt,
            createdAt: appt.createdAt ? new Date(appt.createdAt) : new Date(),
            updatedAt: new Date()
          });
          operationCount++;
        }
      }

      // 2. Migrar Services
      if (Array.isArray(data.services) && data.services.length > 0) {
        console.log(`    💈 Migrando ${data.services.length} serviços...`);
        const servicesRef = collection(db, `barbers/${barberId}/services`);
        
        for (const service of data.services) {
          const newDocRef = doc(servicesRef, service.id || undefined);
          batch.set(newDocRef, {
            ...service,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          });
          operationCount++;
        }
      }

      // 3. Migrar Gallery
      if (Array.isArray(data.galleryImages) && data.galleryImages.length > 0) {
        console.log(`    🖼️  Migrando ${data.galleryImages.length} imagens da galeria...`);
        const galleryRef = collection(db, `barbers/${barberId}/gallery`);
        
        for (const img of data.galleryImages) {
          const newDocRef = doc(galleryRef, img.id || undefined);
          batch.set(newDocRef, {
            url: img.src || img.url, // Handle different field names
            description: img.alt || img.description || '',
            createdAt: new Date(),
            order: Date.now()
          });
          operationCount++;
        }
      }

      // 4. Migrar Promotions
      if (Array.isArray(data.promotions) && data.promotions.length > 0) {
        console.log(`    🎉 Migrando ${data.promotions.length} promoções...`);
        const promotionsRef = collection(db, `barbers/${barberId}/promotions`);
        
        for (const promo of data.promotions) {
          const newDocRef = doc(promotionsRef, promo.id || undefined);
          batch.set(newDocRef, {
            ...promo,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          });
          operationCount++;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
        console.log(`    ✅ Batch commitado (${operationCount} ops)`);
        
        // Limpar arrays antigos
        console.log("    🧹 Limpando arrays antigos do documento principal...");
        await updateDoc(doc(db, "barbers", barberId), {
            appointments: [],
            services: [],
            galleryImages: [],
            promotions: []
        });
      } else {
        console.log("    ⚠️ Nenhuma subcoleção para migrar ou dados já migrados.");
      }
      
      console.log(`✅ Migração do barbeiro ${barberId} concluída!`);
    }
    
    console.log("\n✨ MIGRAÇÃO COMPLETA! ✨");
    
  } catch (error) {
    console.error("❌ Erro fatal na migração:", error);
  }
}

migrateAllBarbers();
