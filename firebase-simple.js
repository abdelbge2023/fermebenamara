// firebase-simple.js - Configuration Firebase pour GitHub Pages
console.log('🔧 Chargement de Firebase Simple - Mode Auto Sync');

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
let isOnline = true;

// Initialiser Firebase avec synchro automatique
async function initialiserFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.log('❌ Firebase non chargé');
            return;
        }

        // Initialiser Firebase
        const firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Activer la persistance pour le mode hors ligne
        await db.enablePersistence().catch(err => {
            console.log('⚠️ Persistance non disponible:', err);
        });

        // Écouter les changements de connexion
        firebase.firestore().enableNetwork();
        
        // Vérifier la connexion
        await db.collection("test").doc("connection").set({
            test: true,
            timestamp: new Date().toISOString()
        }).then(() => {
            console.log('✅ Firebase connecté et opérationnel');
            firebaseReady = true;
            isOnline = true;
        }).catch(error => {
            console.log('🔧 Mode dégradé - Firebase accessible mais erreur:', error);
            firebaseReady = true;
            isOnline = false;
        });

        // Configurer les variables globales
        window.firebaseReady = firebaseReady;
        window.firebaseDb = db;
        window.firebaseApp = firebaseApp;
        
        // Synchroniser automatiquement au chargement
        synchroniserAutomatiquement();
        mettreAJourStatutFirebase();
        
    } catch (error) {
        console.log('❌ Erreur initialisation Firebase:', error);
        firebaseReady = false;
        window.firebaseReady = false;
        mettreAJourStatutFirebase();
    }
}

// SYNCHRONISATION AUTOMATIQUE
async function synchroniserAutomatiquement() {
    if (!firebaseReady || !db) return;
    
    console.log('🔄 Début synchronisation automatique...');
    
    try {
        // 1. Charger les données Firebase (priorité cloud)
        const querySnapshot = await db.collection("operations")
            .orderBy("timestamp", "desc")
            .get();
        
        let operationsCloud = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            operationsCloud.push({
                ...data,
                firebaseId: doc.id  // Garder l'ID Firebase
            });
        });
        
        // 2. Charger les données locales
        const saved = localStorage.getItem('gestion_ferme_data');
        let operationsLocales = [];
        
        if (saved) {
            const dataLocal = JSON.parse(saved);
            operationsLocales = dataLocal.operations || [];
        }
        
        // 3. Fusion intelligente (éviter les doublons)
        const operationsFusionnees = fusionnerOperations(operationsCloud, operationsLocales);
        
        // 4. Sauvegarder la fusion localement
        const dataFusion = {
            operations: operationsFusionnees,
            lastSync: new Date().toISOString(),
            syncCount: operationsFusionnees.length
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(dataFusion));
        
        console.log(`✅ Synchronisation réussie: ${operationsFusionnees.length} opérations`);
        
        // 5. Forcer le rechargement de l'interface
        if (window.app && window.app.afficherHistorique) {
            window.app.operations = operationsFusionnees;
            window.app.updateStats();
            window.app.afficherHistorique(window.app.currentView);
        }
        
    } catch (error) {
        console.error('❌ Erreur synchronisation automatique:', error);
    }
}

// Fusionner les opérations cloud et locales
function fusionnerOperations(cloudOps, localOps) {
    const operationsUniques = [];
    const idsTraites = new Set();
    
    // Priorité au cloud
    cloudOps.forEach(op => {
        if (!idsTraites.has(op.id)) {
            operationsUniques.push(op);
            idsTraites.add(op.id);
        }
    });
    
    // Ajouter les locales manquantes
    localOps.forEach(op => {
        if (!idsTraites.has(op.id)) {
            operationsUniques.push(op);
            idsTraites.add(op.id);
        }
    });
    
    // Trier par date
    return operationsUniques.sort((a, b) => 
        new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
    );
}

// SYNCHRONISATION MANUELLE (bouton sync)
window.synchroniserDonnees = async function() {
    if (!firebaseReady || !db) {
        alert('❌ Firebase non disponible');
        return;
    }
    
    const btnSync = document.querySelector('[onclick="synchroniserDonnees()"]');
    if (btnSync) {
        btnSync.innerHTML = '⏳ Synchronisation...';
        btnSync.disabled = true;
    }
    
    try {
        await synchroniserAutomatiquement();
        alert('✅ Synchronisation manuelle réussie !');
    } catch (error) {
        alert('❌ Erreur synchronisation: ' + error.message);
    } finally {
        if (btnSync) {
            btnSync.innerHTML = '🔄 Sync';
            btnSync.disabled = false;
        }
    }
}

// CHARGER DEPUIS FIREBASE
window.chargerDonneesFirebase = async function() {
    if (!firebaseReady || !db) {
        alert('❌ Firebase non disponible');
        return;
    }
    
    try {
        const querySnapshot = await db.collection("operations")
            .orderBy("timestamp", "desc")
            .get();
        
        const operations = [];
        querySnapshot.forEach(doc => {
            operations.push(doc.data());
        });

        // Remplacer les données locales
        const data = {
            operations: operations,
            lastSync: new Date().toISOString(),
            source: 'firebase'
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
        
        alert(`✅ ${operations.length} opérations chargées depuis Firebase`);
        
        // Recharger l'application
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erreur chargement Firebase:', error);
        alert('❌ Erreur lors du chargement: ' + error.message);
    }
}

// SAUVEGARDER AUTOMATIQUEMENT DANS FIREBASE
window.sauvegarderDansFirebase = async function(operation) {
    if (!firebaseReady || !db) return false;
    
    try {
        // Vérifier si l'opération existe déjà
        const querySnapshot = await db.collection("operations")
            .where("id", "==", operation.id)
            .get();
        
        if (querySnapshot.empty) {
            // Ajouter la nouvelle opération
            await db.collection("operations").add({
                ...operation,
                synchronise: true,
                dateSynchronisation: new Date().toISOString()
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

// Mettre à jour l'interface
function mettreAJourStatutFirebase() {
    setTimeout(() => {
        const header = document.querySelector('header');
        if (!header) return;

        // Supprimer l'ancien statut
        const ancienStatut = document.getElementById('statutFirebase');
        if (ancienStatut) ancienStatut.remove();

        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutFirebase';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '12px';
        statutDiv.style.borderRadius = '10px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';
        statutDiv.style.fontSize = '16px';

        if (firebaseReady) {
            statutDiv.innerHTML = 
                '✅ <strong>Synchronisé Cloud</strong> | ' +
                '<button onclick="synchroniserDonnees()" class="btn-success" style="margin: 0 8px; padding: 8px 16px; font-size: 14px;">🔄 Synchroniser</button>' +
                '<button onclick="chargerDonneesFirebase()" class="btn-info" style="margin: 0 8px; padding: 8px 16px; font-size: 14px;">📥 Charger Cloud</button>';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
            statutDiv.style.border = '2px solid #28a745';
        } else {
            statutDiv.innerHTML = 
                '🔧 <strong>Mode Local</strong> | ' +
                '<button onclick="initialiserFirebase()" class="btn-warning" style="margin: 0 8px; padding: 8px 16px; font-size: 14px;">🔄 Réessayer Firebase</button>';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
            statutDiv.style.border = '2px solid #ffc107';
        }

        header.appendChild(statutDiv);
    }, 1000);
}

// Écouter les changements en temps réel
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

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation Firebase...');
    initialiserFirebase();
    
    // Écouter les changements après un délai
    setTimeout(ecouterChangementsTempsReel, 3000);
});

console.log('🔧 firebase-simple.js chargé - Synchronisation automatique activée');
