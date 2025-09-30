import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAyU1nm3zsW4RVtnYiw_dZ4-RSrUUlRsRM",
  authDomain: "barbershop-agendamentos.firebaseapp.com",
  projectId: "barbershop-agendamentos",
  storageBucket: "barbershop-agendamentos.firebasestorage.app", // ← MUDOU AQUI!
  messagingSenderId: "578529360983",
  appId: "1:578529360983:web:1bcc2ff38459b53e043712"
};

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
export const storage = firebase.storage();

// Configurações adicionais
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

export default app;