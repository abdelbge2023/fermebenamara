const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialisé avec succès');
        }
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
    }
} else {
    console.warn('❌ Firebase SDK non chargé');
}
