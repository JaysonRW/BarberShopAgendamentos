// FIX: Switched to Firebase compat imports to resolve module export errors.
// The error "Module 'firebase/auth' has no exported member 'getAuth'" suggests
// an environment mismatch, likely using an older Firebase version or a setup
// that requires the v8 compatibility layer.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// ATENÇÃO: Substitua o objeto abaixo pela configuração do seu projeto no Firebase.
// Você pode encontrar essa configuração no console do Firebase, nas configurações do seu projeto web.
// Siga o passo a passo:
// 1. Acesse o console do Firebase (https://console.firebase.google.com/)
// 2. Selecione seu projeto.
// 3. Clique no ícone de engrenagem (Configurações do projeto) ao lado de "Visão geral do projeto".
// 4. Role para baixo até "Seus apps".
// 5. Selecione seu aplicativo da web.
// 6. Em "Configuração do SDK", escolha a opção "Config" e copie o objeto.

const firebaseConfig = {
    apiKey: "AIzaSyAyU1nm3zsW4RVtnYiw_dZ4-RSrUUlRsRM",
    authDomain: "barbershop-agendamentos.firebaseapp.com",
    projectId: "barbershop-agendamentos",
    storageBucket: "barbershop-agendamentos.firebasestorage.app",
    messagingSenderId: "578529360983",
    appId: "1:578529360983:web:1bcc2ff38459b53e043712"
  };

// Inicializa o Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exporta a instância de autenticação para ser usada em outras partes do aplicativo
export const auth = firebase.auth();
