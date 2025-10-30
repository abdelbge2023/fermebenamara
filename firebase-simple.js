// firebase-simple.js - Version complète et fonctionnelle
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
// Initialisation simple et sécurisée
try {
    if (typeof firebase !== 'undefined') {
        // Vérifier si Firebase est déjà initialisé
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
        
        // Tester la connexion
        window.firebaseDb.collection("test").limit(1).get().then(() => {
            console.log('✅ Connexion Firebase établie');
        }).catch(error => {
            console.log('⚠️ Firebase connecté mais permissions limitées');
        });
        
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
        alert('❌ Firebase non disponible pour la migration');
        return;
    }

    const saved = localStorage.getItem('gestion_ferme_data');
    if (!saved) {
        alert('❌ Aucune donnée trouvée dans le localStorage');
        return;
    }

    try {
        const data = JSON.parse(saved);
        const operations = data.operations || [];
        
        if (operations.length === 0) {
            alert('❌ Aucune opération à migrer');
            return;
        }
        
        let count = 0;
        let erreurs = 0;

        for (const op of operations) {
            try {
                await window.firebaseDb.collection("operations").add({
                    ...op,
                    migre: true,
                    dateMigration: new Date().toISOString()
                });
                count++;
            } catch (error) {
                console.error('Erreur migration opération:', op.id, error);
                erreurs++;
            }
        }

        const message = `✅ Migration terminée !\n${count} opérations migrées${erreurs > 0 ? '\n' + erreurs + ' erreurs' : ''}`;
        alert(message);
        console.log(message);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur lors de la migration: ' + error.message);
    }
};

// Fonction pour vérifier Firebase
window.verifierFirebase = async function() {
    if (!window.firebaseReady || !window.firebaseDb) {
        alert('❌ Firebase non disponible');
        return;
    }

    try {
        const snapshot = await window.firebaseDb.collection("operations").get();
        alert(`📊 Firebase contient ${snapshot.size} opérations`);
    } catch (error) {
        alert('❌ Erreur vérification: ' + error.message);
    }
};

console.log('✅ firebase-simple.js chargé avec succès');
