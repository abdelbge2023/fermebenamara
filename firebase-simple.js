// firebase-simple.js - Version finale avec gestion d'erreurs
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

        // Test de connexion simple
        console.log('🔍 Test de connexion Firebase...');
        firebaseReady = true;
        window.firebaseReady = true;
        window.firebaseDb = db;
        
        // Synchroniser après un court délai
        setTimeout(() => {
            synchroniserAutomatiquement();
        }, 2000);
        
        mettreAJourStatutFirebase();
        
    } catch (error) {
        console.log('❌ Erreur initialisation Firebase:', error);
        firebaseReady = false;
        window.firebaseReady = false;
        mettreAJourStatutFirebase();
    }
}

// Synchronisation automatique
async function synchroniserAutomatiquement() {
    if (!firebaseReady || !db) {
        console.log('❌ Firebase non prêt');
        return;
    }
    
    console.log('🔄 Synchronisation automatique...');
    
    try {
        // 1. Charger depuis Firebase
        const querySnapshot = await db.collection("operations").get();
        let operationsCloud = [];
        
        querySnapshot.forEach(doc => {
            operationsCloud.push(doc.data());
        });
        
        console.log(`📥 ${operationsCloud.length} opérations depuis Firebase`);
        
        // 2. Charger données locales
        const saved = localStorage.getItem('gestion_ferme_data');
        let operationsLocales = [];
        
        if (saved) {
            try {
                const dataLocal = JSON.parse(saved);
                operationsLocales = dataLocal.operations || [];
            } catch (e) {
                console.error('❌ Erreur données locales:', e);
            }
        }
        
        // 3. Fusionner (priorité cloud)
        const allIds = new Set();
        const operationsFusionnees = [];
        
        // Ajouter cloud d'abord
        operationsCloud.forEach(op => {
            if (op.id && !allIds.has(op.id)) {
                operationsFusionnees.push(op);
                allIds.add(op.id);
            }
        });
        
        // Ajouter locales manquantes
        operationsLocales.forEach(op => {
            if (op.id && !allIds.has(op.id)) {
                operationsFusionnees.push(op);
                allIds.add(op.id);
            }
        });
        
        // 4. Sauvegarder
        const dataFusion = {
            operations: operationsFusionnees,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(dataFusion));
        
        console.log(`✅ Sync réussie: ${operationsFusionnees.length} opérations`);
        
        // 5. Mettre à jour l'interface
        if (window.app && window.app.operations) {
            window.app.operations = operationsFusionnees;
            window.app.updateStats();
            window.app.afficherHistorique(window.app.currentView);
        }
        
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
        // Continuer avec données locales en cas d'erreur
    }
}

// Synchronisation manuelle
window.synchroniserDonnees = async function() {
    if (!firebaseReady) {
        alert('❌ Firebase non disponible');
        return;
    }
    
    const btn = document.querySelector('[onclick="synchroniserDonnees()"]');
    if (btn) {
        btn.innerHTML = '⏳ Sync...';
        btn.disabled = true;
    }
    
    try {
        await synchroniserAutomatiquement();
        alert('✅ Synchronisation réussie !');
    } catch (error) {
        alert('❌ Erreur: ' + error.message);
    } finally {
        if (btn) {
            btn.innerHTML = '🔄 Sync';
            btn.disabled = false;
        }
    }
}

// Sauvegarder une opération
window.sauvegarderDansFirebase = async function(operation) {
    if (!firebaseReady || !db) return false;
    
    try {
        // Vérifier si existe déjà
        const querySnapshot = await db.collection("operations")
            .where("id", "==", operation.id)
            .get();
        
        if (querySnapshot.empty) {
            await db.collection("operations").add(operation);
            console.log('✅ Opération sauvegardée:', operation.id);
            return true;
        }
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        return false;
    }
}

// Mise à jour statut
function mettreAJourStatutFirebase() {
    setTimeout(() => {
        const header = document.querySelector('header');
        if (!header) return;

        const ancienStatut = document.getElementById('statutFirebase');
        if (ancienStatut) ancienStatut.remove();

        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutFirebase';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '12px';
        statutDiv.style.borderRadius = '10px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';

        if (firebaseReady) {
            statutDiv.innerHTML = 
                '✅ <strong>Synchronisé Cloud</strong> | ' +
                '<button onclick="synchroniserDonnees()" class="btn-success" style="margin: 0 8px; padding: 8px 16px;">🔄 Sync</button>';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
        } else {
            statutDiv.innerHTML = '🔧 Mode Local';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
        }

        header.appendChild(statutDiv);
    }, 1000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation Firebase...');
    initialiserFirebase();
});
