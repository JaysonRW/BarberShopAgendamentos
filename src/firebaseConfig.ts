// Versão Compatível - Use esta se você quer manter a sintaxe antiga
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// OU - Versão Moderna (descomente para usar a nova sintaxe)
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// ATENÇÃO: Substitua o objeto abaixo pela configuração do seu projeto no Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAyU1nm3zsW4RVtnYiw_dZ4-RSrUUlRsRM",
  authDomain: "barbershop-agendamentos.firebaseapp.com",
  projectId: "barbershop-agendamentos",
  storageBucket: "barbershop-agendamentos.firebasestorage.app",
  messagingSenderId: "578529360983",
  appId: "1:578529360983:web:1bcc2ff38459b53e043712"
};

// VERSÃO COMPATÍVEL (sintaxe antiga)
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase inicializado com sucesso');
} else {
  app = firebase.app();
  console.log('🔥 Firebase já estava inicializado');
}

export const auth = firebase.auth();
export const db = firebase.firestore();

// Configurações adicionais para melhor performance
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// VERSÃO MODERNA (descomente se quiser migrar)
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

