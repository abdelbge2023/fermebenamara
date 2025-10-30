// firebase-config.js - Configuration Firebase pour GitHub Pages
console.log('🔧 Chargement de Firebase Simple');

// Configuration Firebase - À PERSONNALISER AVEC VOS CLÉS
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};

// Initialisation simple
try {
    if (typeof firebase !== 'undefined') {
        // Vérifier si déjà initialisé
        if (!firebase.apps.length) {
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
            window.firebaseDb = firebase.firestore();
            window.firebaseReady = true;
            console.log('✅ Firebase initialisé avec succès');
        } else {
            window.firebaseApp = firebase.apps[0];
            window.firebaseDb = firebase.firestore();
            window.firebaseReady = true;
            console.log('✅ Firebase déjà initialisé');
        }
    } else {
        throw new Error('Firebase non chargé');
    }
} catch (error) {
    console.log('🔧 Mode hors ligne:', error.message);
    window.firebaseReady = false;
    window.firebaseDb = null;
}

// Fonction de migration simple
window.migrerDonnees = async function() {
    if (!window.firebaseReady || !window.firebaseDb) {
        alert('❌ Firebase non disponible');
        return;
    }

    const saved = localStorage.getItem('gestion_ferme_data');
    if (!saved) {
        alert('❌ Aucune donnée à migrer');
        return;
    }

    try {
        const data = JSON.parse(saved);
        const operations = data.operations || [];
        let count = 0;

        for (const op of operations) {
            await window.firebaseDb.collection("operations").add({
                ...op,
                migre: true,
                dateMigration: new Date()
            });
            count++;
        }

        alert(`✅ ${count} opérations migrées !`);
    } catch (error) {
        alert('❌ Erreur migration: ' + error.message);
    }
};
