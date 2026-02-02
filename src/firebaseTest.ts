// Arquivo de teste para verificar conectividade com Firebase
import { db, auth } from './firebaseConfig';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testando conexão com Firebase...');
    
    // Teste 1: Verificar se o Firestore está acessível
    console.log('📊 Testando Firestore...');
    const testDocRef = doc(db, 'test', 'connection');
    const testDoc = await getDoc(testDocRef);
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
    const docRef = doc(db, 'test', 'write-test');
    await setDoc(docRef, {
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
    const docRef = doc(db, 'test', 'write-test');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('✅ Leitura do Firestore funcionando:', docSnap.data());
    } else {
      console.log('⚠️ Documento de teste não encontrado');
    }
    return true;
  } catch (error) {
    console.error('❌ Erro na leitura do Firestore:', error);
    return false;
  }
};
