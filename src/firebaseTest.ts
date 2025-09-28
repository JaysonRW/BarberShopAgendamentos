// Arquivo de teste para verificar conectividade com Firebase
import { db, auth } from './firebaseConfig';

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testando conexão com Firebase...');
    
    // Teste 1: Verificar se o Firestore está acessível
    console.log('📊 Testando Firestore...');
    const testDoc = await db.collection('test').doc('connection').get();
    console.log('✅ Firestore conectado com sucesso');
    
    // Teste 2: Verificar se a autenticação está funcionando
    console.log('🔐 Testando autenticação...');
    const currentUser = auth.currentUser;
    console.log('✅ Autenticação funcionando, usuário atual:', currentUser ? 'Logado' : 'Não logado');
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Firebase:', error);
    return false;
  }
};

export const testFirestoreWrite = async (): Promise<boolean> => {
  try {
    console.log('✍️ Testando escrita no Firestore...');
    await db.collection('test').doc('write-test').set({
      timestamp: new Date(),
      message: 'Teste de escrita funcionando'
    });
    console.log('✅ Escrita no Firestore funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro na escrita no Firestore:', error);
    return false;
  }
};

export const testFirestoreRead = async (): Promise<boolean> => {
  try {
    console.log('📖 Testando leitura do Firestore...');
    const doc = await db.collection('test').doc('write-test').get();
    if (doc.exists) {
      console.log('✅ Leitura do Firestore funcionando:', doc.data());
    } else {
      console.log('⚠️ Documento de teste não encontrado');
    }
    return true;
  } catch (error) {
    console.error('❌ Erro na leitura do Firestore:', error);
    return false;
  }
};
