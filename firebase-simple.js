// firebase-simple.js - Version complète avec synchronisation des suppressions
console.log('🔧 Chargement de Firebase Simple - Synchronisation complète');

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

// FONCTION DE FUSION AVEC GESTION DES SUPPRESSIONS
function fusionnerOperationsAvecSuppressions(cloudOps, localOps) {
    const operationsFusionnees = [];
    const idsTraites = new Set();
    
    // Créer un Set des IDs locaux pour détection des suppressions
    const idsLocaux = new Set(localOps.map(op => op.id));
    
    // Priorité au cloud MAIS filtrer les suppressions
    cloudOps.forEach(op => {
        if (op.id && !idsTraites.has(op.id) && !op.supprime) {
            // Si l'opération cloud existe localement, on la garde
            // Si elle n'existe pas localement mais a été supprimée, on vérifie la date
            if (idsLocaux.has(op.id)) {
                operationsFusionnees.push(op);
                idsTraites.add(op.id);
            } else {
                // Opération potentiellement supprimée - vérifier l'ancienneté
                const dateOp = new Date(op.timestamp || op.date);
                const maintenant = new Date();
                const diffJours = (maintenant - dateOp) / (1000 * 60 * 60 * 24);
                
                // Si l'opération a moins de 2 jours, on la garde (évite resync de vieilles données)
                if (diffJours < 2) {
                    operationsFusionnees.push(op);
                    idsTraites.add(op.id);
                    console.log('🔄 Opération restaurée:', op.id);
                } else {
                    console.log('🚫 Opération ancienne ignorée:', op.id);
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
    
    console.log('🔄 Début synchronisation automatique...');
    
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
        
        console.log(`📥 ${operationsCloud.length} opérations chargées depuis Firebase`);
        
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
        
        console.log(`✅ Synchronisation: ${operationsFusionnees.length} opérations total`);
        
        // 5. Mettre à jour l'interface
        if (window.app && typeof window.app.afficherHistorique === 'function') {
            window.app.operations = operationsFusionnees;
            window.app.updateStats();
            window.app.afficherHistorique(window.app.currentView);
        }
        
    } catch (error) {
        console.error('❌ Erreur synchronisation automatique:', error);
    }
}

// SYNCHRONISATION MANUELLE
window.synchroniserDonnees = async function() {
    if (!firebaseReady || !db) {
        alert('❌ Firebase non disponible');
        return;
    }
    
    const btnSync = document.querySelector('[onclick="synchroniserDonnees()"]');
    const texteOriginal = btnSync ? btnSync.innerHTML : '';
    
    if (btnSync) {
        btnSync.innerHTML = '⏳ Synchronisation...';
        btnSync.disabled = true;
    }
    
    try {
        await synchroniserAutomatiquement();
        alert('✅ Synchronisation réussie !');
    } catch (error) {
        console.error('❌ Erreur synchronisation manuelle:', error);
        alert('⚠️ Synchronisation partielle: ' + error.message);
    } finally {
        if (btnSync) {
            btnSync.innerHTML = texteOriginal;
            btnSync.disabled = false;
        }
    }
}

// SAUVEGARDER DANS FIREBASE
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
        
        // Marquer comme supprimé au lieu de supprimer
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

        // Sauvegarder localement
        const data = {
            operations: operations,
            lastSync: new Date().toISOString(),
            source: 'firebase'
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
        
        alert(`✅ ${operations.length} opérations chargées depuis Firebase`);
        
        // Recharger l'application
        location.reload();
        
    } catch (error) {
        console.error('❌ Erreur chargement Firebase:', error);
        alert('❌ Erreur chargement: ' + error.message);
    }
}

// MIGRER VERS FIREBASE
window.migrerVersFirebase = async function() {
    if (!firebaseReady || !db) {
        alert('❌ Firebase non disponible');
        return;
    }

    console.log('🚀 Début migration vers Firebase...');
    
    // Charger les données existantes du localStorage
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
        
        // Migrer chaque opération
        for (const operation of operations) {
            try {
                await window.sauvegarderDansFirebase(operation);
                count++;
                
                // Afficher la progression
                if (count % 10 === 0) {
                    console.log(`📦 ${count} opérations migrées...`);
                }
            } catch (error) {
                console.error('Erreur migration opération:', operation.id, error);
                erreurs++;
            }
        }
        
        const message = `✅ Migration terminée !\n${count} opérations migrées\n${erreurs} erreurs`;
        console.log(message);
        alert(message);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur lors de la migration: ' + error.message);
    }
}

// VÉRIFIER DONNÉES FIREBASE
window.verifierDonneesFirebase = async function() {
    if (!firebaseReady || !db) {
        alert('❌ Firebase non disponible');
        return 0;
    }

    try {
        const querySnapshot = await db.collection("operations").get();
        const count = querySnapshot.size;
        alert(`📊 Firebase contient ${count} opérations`);
        return count;
    } catch (error) {
        console.error('Erreur vérification:', error);
        alert('❌ Erreur vérification Firebase');
        return 0;
    }
}

// MISE À JOUR DU STATUT
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

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation Firebase...');
    initialiserFirebase();
});

console.log('🔧 firebase-simple.js chargé - Synchronisation complète activée');