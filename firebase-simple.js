// firebase-simple.js - Synchronisation automatique uniquement
console.log('🔧 Chargement de Firebase Simple - Mode local avec sync automatique');

// Configuration Firebase - À PERSONNALISER AVEC VOS CLÉS
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};

console.log('Firebase apps count:', firebase.apps.length);
if (firebase.apps.length > 0) {
  console.log('Firebase déjà initialisé');
} else {
  console.log('Initialisation Firebase...');
  firebase.initializeApp(firebaseConfig);
}
