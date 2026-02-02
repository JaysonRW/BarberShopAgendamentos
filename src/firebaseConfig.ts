import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAyU1nm3zsW4RVtnYiw_dZ4-RSrUUlRsRM",
  authDomain: "barbershop-agendamentos.firebaseapp.com",
  projectId: "barbershop-agendamentos",
  storageBucket: "barbershop-agendamentos.firebasestorage.app",
  messagingSenderId: "578529360983",
  appId: "1:578529360983:web:1bcc2ff38459b53e043712"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
