// firebase-simple.js - Synchronisation automatique sans boutons
console.log('🔧 Chargement de Firebase Simple - Synchronisation automatique');

// ⚠️ REMPLACEZ AVEC VOS VRAIES CLÉS FIREBASE ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};

let db;
let firebaseReady = false;

// Initialiser Firebase
async function initialiserFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.log('❌ Firebase non chargé');
            return;
        }

        console.log('🚀 Initialisation Firebase...');
        
        // Initialiser Firebase
        const firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Paramètres optimisés
        const settings = {
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        };
        db.settings(settings);
        
        // Activer la persistance
        try {
            await db.enablePersistence();
            console.log('✅ Persistance activée');
        } catch (err) {
            console.log('⚠️ Persistance non disponible:', err);
        }

        // Test de connexion
        console.log('🔍 Test de connexion Firebase...');
        firebaseReady = true;
        window.firebaseReady = true;
        window.firebaseDb = db;
        
        // Synchroniser automatiquement
        synchroniserAutomatiquement();
        
        // Écouter les changements en temps réel
        ecouterChangementsTempsReel();
        
    } catch (error) {
        console.log('❌ Erreur initialisation Firebase:', error);
        firebaseReady = false;
        window.firebaseReady = false;
    }
}

// FONCTION DE FUSION AVEC GESTION DES SUPPRESSIONS
function fusionnerOperationsAvecSuppressions(cloudOps, localOps) {
    const operationsFusionnees = [];
    const idsTraites = new Set();
    
    // Créer un Set des IDs locaux pour détection des suppressions
    const idsLocaux = new Set(localOps.map(op => op.id));
    
    // Priorité au cloud MAIS filtrer les suppressions
    cloudOps.forEach(op => {
        if (op.id && !idsTraites.has(op.id) && !op.supprime) {
            if (idsLocaux.has(op.id)) {
                operationsFusionnees.push(op);
                idsTraites.add(op.id);
            } else {
                // Opération potentiellement supprimée - vérifier l'ancienneté
                const dateOp = new Date(op.timestamp || op.date);
                const maintenant = new Date();
                const diffJours = (maintenant - dateOp) / (1000 * 60 * 60 * 24);
                
                // Si l'opération a moins de 2 jours, on la garde
                if (diffJours < 2) {
                    operationsFusionnees.push(op);
                    idsTraites.add(op.id);
                    console.log('🔄 Opération restaurée:', op.id);
                }
            }
        }
    });
    
    // Ajouter toutes les locales
    localOps.forEach(op => {
        if (op.id && !idsTraites.has(op.id)) {
            operationsFusionnees.push(op);
            idsTraites.add(op.id);
        }
    });
    
    // Trier par date (plus récent en premier)
    return operationsFusionnees.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date || 0);
        const dateB = new Date(b.timestamp || b.date || 0);
        return dateB - dateA;
    });
}

// SYNCHRONISATION AUTOMATIQUE
async function synchroniserAutomatiquement() {
    if (!firebaseReady || !db) {
        console.log('❌ Firebase non prêt pour synchronisation');
        return;
    }
    
    console.log('🔄 Synchronisation automatique...');
    
    try {
        // 1. Charger depuis Firebase
        const querySnapshot = await db.collection("operations")
            .orderBy("timestamp", "desc")
            .get();
        
        let operationsCloud = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            operationsCloud.push({
                ...data,
                firebaseId: doc.id
            });
        });
        
        console.log(`📥 ${operationsCloud.length} opérations depuis Firebase`);
        
        // 2. Charger les données locales
        const saved = localStorage.getItem('gestion_ferme_data');
        let operationsLocales = [];
        
        if (saved) {
            try {
                const dataLocal = JSON.parse(saved);
                operationsLocales = dataLocal.operations || [];
                console.log(`💾 ${operationsLocales.length} opérations locales`);
            } catch (e) {
                console.error('❌ Erreur lecture données locales:', e);
            }
        }
        
        // 3. Fusionner avec gestion des suppressions
        const operationsFusionnees = fusionnerOperationsAvecSuppressions(operationsCloud, operationsLocales);
        
        // 4. Sauvegarder la fusion
        const dataFusion = {
            operations: operationsFusionnees,
            lastSync: new Date().toISOString(),
            totalOperations: operationsFusionnees.length
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(dataFusion));
        
        console.log(`✅ Sync: ${operationsFusionnees.length} opérations`);
        
        // 5. Mettre à jour l'interface
        if (window.app && typeof window.app.afficherHistorique === 'function') {
            window.app.operations = operationsFusionnees;
            window.app.updateStats();
            window.app.afficherHistorique(window.app.currentView);
        }
        
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// ÉCOUTER LES CHANGEMENTS EN TEMPS RÉEL
function ecouterChangementsTempsReel() {
    if (!firebaseReady || !db) return;
    
    db.collection("operations")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            console.log('🔄 Mise à jour temps réel détectée');
            synchroniserAutomatiquement();
        }, (error) => {
            console.error('❌ Erreur écoute temps réel:', error);
        });
}

// SAUVEGARDER DANS FIREBASE (automatique)
window.sauvegarderDansFirebase = async function(operation) {
    if (!firebaseReady || !db) {
        console.log('❌ Firebase non disponible pour sauvegarde');
        return false;
    }
    
    try {
        // Vérifier si l'opération existe déjà
        const querySnapshot = await db.collection("operations")
            .where("id", "==", operation.id)
            .limit(1)
            .get();
        
        if (querySnapshot.empty) {
            // Ajouter la nouvelle opération
            await db.collection("operations").add({
                ...operation,
                synchronise: true,
                dateSynchronisation: new Date().toISOString(),
                timestamp: operation.timestamp || new Date().toISOString()
            });
            console.log('✅ Opération sauvegardée dans Firebase:', operation.id);
            return true;
        } else {
            console.log('⚠️ Opération déjà dans Firebase:', operation.id);
            return true;
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde Firebase:', error);
        return false;
    }
}

// MARQUER COMME SUPPRIMÉ DANS FIREBASE
window.marquerCommeSupprime = async function(operationId) {
    if (!firebaseReady || !db) return false;
    
    try {
        // Trouver le document
        const querySnapshot = await db.collection("operations")
            .where("id", "==", operationId)
            .get();
        
        // Marquer comme supprimé
        const updatePromises = [];
        querySnapshot.forEach(doc => {
            updatePromises.push(
                doc.ref.update({
                    supprime: true,
                    dateSuppression: new Date().toISOString()
                })
            );
        });
        
        await Promise.all(updatePromises);
        console.log('✅ Opération marquée comme supprimée:', operationId);
        return true;
    } catch (error) {
        console.error('❌ Erreur marquage suppression:', error);
        return false;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation Firebase...');
    initialiserFirebase();
});

console.log('🔧 firebase-simple.js chargé - Synchronisation automatique activée');
