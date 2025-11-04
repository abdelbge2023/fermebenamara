// firebase-simple.js - Configuration Firebase avec Authentification
console.log('🔧 Chargement de Firebase Simple - Authentification activée');

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
    authDomain: "gestion-fermebenamara.firebaseapp.com",
    projectId: "gestion-fermebenamara",
    storageBucket: "gestion-fermebenamara.firebasestorage.app",
    messagingSenderId: "668129137491",
    appId: "1:668129137491:web:b56522302ea789044507a6"
};

// Variables globales
let db;
let auth;
let firebaseInitialized = false;
let firebaseSync;
let currentUser = null;

// Fonction d'initialisation Firebase
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            auth = firebase.auth();
            
            // Configuration Firestore
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                merge: true
            });
            
            // Activer la persistance
            db.enablePersistence()
                .then(() => {
                    console.log('✅ Persistance Firestore activée');
                })
                .catch((err) => {
                    console.warn('⚠️ Persistance non disponible:', err.code, err.message);
                });
            
            firebaseInitialized = true;
            console.log('✅ Firebase initialisé avec succès');
            
            // Initialiser firebaseSync
            firebaseSync = new FirebaseSync();
            window.firebaseSync = firebaseSync;
            window.firebaseDb = db;
            window.firebaseAuth = auth;
            
            // Écouter les changements d'authentification
            setupAuthListener();
            
        } else if (firebase.apps.length > 0) {
            db = firebase.firestore();
            auth = firebase.auth();
            firebaseInitialized = true;
            console.log('ℹ️ Firebase déjà initialisé');
            firebaseSync = new FirebaseSync();
            window.firebaseSync = firebaseSync;
            window.firebaseDb = db;
            window.firebaseAuth = auth;
            
            // Écouter les changements d'authentification
            setupAuthListener();
        }
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error.code, error.message);
        gestionErreurFirebase(error);
    }
}

// Écouteur d'authentification
function setupAuthListener() {
    auth.onAuthStateChanged((user) => {
        console.log('🔐 État authentification changé:', user ? 'Connecté' : 'Déconnecté');
        currentUser = user;
        
        if (user) {
            // Utilisateur connecté
            console.log('👤 Utilisateur connecté:', user.email);
            window.dispatchEvent(new CustomEvent('userAuthenticated', { 
                detail: { user: user } 
            }));
        } else {
            // Utilisateur déconnecté
            console.log('👤 Utilisateur déconnecté');
            window.dispatchEvent(new CustomEvent('userSignedOut'));
        }
    }, (error) => {
        console.error('❌ Erreur écouteur auth:', error);
    });
}

// Fonctions d'authentification
window.firebaseAuthFunctions = {
    // Connexion email/mot de passe
    async signInWithEmail(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Connexion réussie:', userCredential.user.email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Erreur connexion:', error.code, error.message);
            return { success: false, error: error.message, code: error.code };
        }
    },

    // Déconnexion
    async signOut() {
        try {
            await auth.signOut();
            console.log('✅ Déconnexion réussie');
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            return { success: false, error: error.message };
        }
    },

    // Récupérer l'utilisateur actuel
    getCurrentUser() {
        return auth.currentUser;
    },

    // Vérifier si connecté
    isUserLoggedIn() {
        return !!auth.currentUser;
    }
};

// Gestion des erreurs Firebase
function gestionErreurFirebase(error) {
    console.error('🔥 Erreur Firebase:', {
        code: error.code,
        message: error.message,
        stack: error.stack
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 4px solid #dc3545;
        font-family: Arial, sans-serif;
    `;
    
    let message = '';
    switch(error.code) {
        case 'permission-denied':
            message = '❌ Erreur de permissions Firebase. Vérifiez les règles de sécurité.';
            break;
        case 'unavailable':
            message = '🌐 Firebase temporairement indisponible. Mode hors ligne activé.';
            break;
        default:
            message = `❌ Erreur Firebase: ${error.message}`;
    }
    
    messageDiv.innerHTML = `
        <strong>Erreur de connexion</strong><br>
        ${message}<br>
        <small>Les données seront sauvegardées localement et synchronisées plus tard.</small>
    `;
    
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 10000);
    }
}

// Classe de synchronisation Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.suppressionsEnCours = new Set();
        this.erreursConsecutives = 0;
        this.maxErreursConsecutives = 3;
        
        console.log('🔄 FirebaseSync créé - Mode:', this.isOnline ? 'En ligne' : 'Hors ligne');
        
        if (db) {
            this.initEventListeners();
        } else {
            console.warn('⚠️ Firestore non disponible, réessai dans 2s...');
            setTimeout(() => {
                if (db) this.initEventListeners();
            }, 2000);
        }
    }

    initEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        this.isOnline = true;
        this.erreursConsecutives = 0;
        console.log('🌐 Connexion rétablie - Synchronisation automatique');
        this.syncPendingOperations();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('🔌 Hors ligne - Mode cache activé');
    }

    async syncPendingOperations() {
        if (this.pendingOperations.length === 0) return;
        console.log(`🔄 Synchronisation automatique de ${this.pendingOperations.length} opérations...`);
        
        const operationsReussies = [];
        const operationsEchouees = [];
        
        for (const operation of this.pendingOperations) {
            try {
                await this.executeOperation(operation);
                operationsReussies.push(operation);
            } catch (error) {
                console.error('❌ Erreur synchronisation:', error);
                operationsEchouees.push(operation);
                
                if (error.code === 'permission-denied') {
                    console.error('🚨 Arrêt de la synchronisation - Permissions insuffisantes');
                    break;
                }
            }
        }
        
        this.pendingOperations = operationsEchouees;
        console.log(`✅ Synchronisation: ${operationsReussies.length} réussies, ${operationsEchouees.length} en attente`);
        
        if (operationsReussies.length > 0) {
            this.afficherMessageSync(`${operationsReussies.length} opérations synchronisées`);
        }
    }

    async executeOperation(operation) {
        if (!db) {
            throw new Error('Firestore non initialisé');
        }

        if (this.erreursConsecutives >= this.maxErreursConsecutives) {
            throw new Error('Trop d\'erreurs consécutives - Synchronisation suspendue');
        }

        const { type, collection, data, id } = operation;

        try {
            let result;
            switch (type) {
                case 'add':
                    result = await db.collection(collection).add(data);
                    break;
                case 'set':
                    result = await db.collection(collection).doc(id.toString()).set(data);
                    break;
                case 'update':
                    result = await db.collection(collection).doc(id.toString()).update(data);
                    break;
                case 'delete':
                    this.suppressionsEnCours.add(id);
                    try {
                        result = await db.collection(collection).doc(id.toString()).delete();
                        console.log(`✅ Suppression Firebase réussie: ${id}`);
                    } finally {
                        setTimeout(() => {
                            this.suppressionsEnCours.delete(id);
                        }, 3000);
                    }
                    break;
                default:
                    throw new Error(`Type inconnu: ${type}`);
            }
            
            this.erreursConsecutives = 0;
            return result;
            
        } catch (error) {
            this.erreursConsecutives++;
            console.error(`❌ Erreur ${type} opération:`, error.code, error.message);
            
            if (error.code === 'permission-denied') {
                console.error('🚨 Permissions Firebase insuffisantes');
                this.afficherMessageSync('Erreur de permissions - Vérifiez les règles de sécurité');
            } else if (error.code === 'unavailable') {
                console.warn('🌐 Firebase indisponible - Mode hors ligne');
            }
            
            throw error;
        }
    }

    afficherMessageSync(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            background: #d1ecf1;
            color: #0c5460;
            padding: 10px 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #17a2b8;
            font-size: 14px;
        `;
        messageDiv.textContent = `🔄 ${message}`;
        
        const appContent = document.getElementById('appContent');
        if (appContent) {
            const header = appContent.querySelector('header');
            if (header) {
                const anciensMessages = header.querySelectorAll('[style*="border-left: 4px solid #17a2b8"]');
                anciensMessages.forEach(msg => msg.remove());
                header.appendChild(messageDiv);
                setTimeout(() => messageDiv.remove(), 5000);
            }
        }
    }

    addOperation(operation) {
        if (this.isOnline && db && this.erreursConsecutives < this.maxErreursConsecutives) {
            return this.executeOperation(operation);
        } else {
            this.pendingOperations.push(operation);
            console.log('💾 Opération sauvegardée localement pour synchronisation ultérieure');
            return Promise.resolve();
        }
    }

    async getCollection(collectionName) {
        if (!db) {
            console.error('❌ Firestore non initialisé');
            return [];
        }

        if (this.erreursConsecutives >= this.maxErreursConsecutives) {
            console.warn('🚨 Synchronisation suspendue - Trop d\'erreurs');
            return [];
        }

        try {
            // MODIFICATION IMPORTANTE : Ne pas filtrer par utilisateur pour permettre la lecture
            const snapshot = await db.collection(collectionName).get();
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${data.length} documents synchronisés depuis ${collectionName}`);
            
            this.erreursConsecutives = 0;
            return data;
            
        } catch (error) {
            this.erreursConsecutives++;
            console.error(`❌ Erreur lecture ${collectionName}:`, error.code, error.message);
            
            if (error.code === 'permission-denied') {
                this.afficherMessageSync('Impossible de charger les données - Vérifiez les permissions');
            }
            
            return [];
        }
    }

    listenToCollection(collectionName, callback) {
        if (!db) {
            console.error('❌ Firestore non initialisé');
            return () => {};
        }

        console.log(`👂 Début de l'écoute en temps réel sur ${collectionName}`);
        
        try {
            return db.collection(collectionName)
                .onSnapshot((snapshot) => {
                    const changes = snapshot.docChanges().map(change => ({
                        type: change.type,
                        id: change.doc.id,
                        data: change.doc.data()
                    }));
                    
                    if (changes.length > 0) {
                        console.log(`🔄 ${changes.length} changement(s) détecté(s) en temps réel`);
                    }
                    
                    callback(changes, snapshot);
                }, (error) => {
                    console.error(`❌ Erreur écoute ${collectionName}:`, error.code, error.message);
                    
                    if (error.code === 'permission-denied') {
                        console.error('🚨 Écoute en temps réel bloquée - Permissions insuffisantes');
                        this.afficherMessageSync('Connexion temps réel impossible - Vérifiez les règles de sécurité');
                    }
                });
        } catch (error) {
            console.error('❌ Erreur création écoute:', error);
            return () => {};
        }
    }

    async addDocument(collectionName, data) {
        console.log(`📤 Synchronisation automatique: ajout à ${collectionName}`);
        
        if (this.isOnline && db && this.erreursConsecutives < this.maxErreursConsecutives) {
            try {
                const docRef = await db.collection(collectionName).add(data);
                console.log(`✅ Document ajouté avec ID: ${docRef.id}`);
                return docRef;
            } catch (error) {
                console.error('❌ Erreur ajout document:', error);
                throw error;
            }
        } else {
            this.pendingOperations.push({
                type: 'add',
                collection: collectionName,
                data: data
            });
            console.log('💾 Opération sauvegardée localement pour synchronisation ultérieure');
            return Promise.resolve({ id: 'pending_' + Date.now() });
        }
    }

    async updateDocument(collectionName, id, data) {
        console.log(`📤 Synchronisation automatique: mise à jour ${collectionName}/${id}`);
        return this.addOperation({
            type: 'update',
            collection: collectionName,
            id: id,
            data: data
        });
    }

    async deleteDocument(collectionName, id) {
        if (this.suppressionsEnCours.has(id)) {
            console.log(`⏳ Suppression ${id} déjà en cours, ignorée`);
            return Promise.resolve();
        }
        
        console.log(`📤 Synchronisation automatique: suppression ${collectionName}/${id}`);
        return this.addOperation({
            type: 'delete',
            collection: collectionName,
            id: id,
            data: {}
        });
    }

    isSuppressionEnCours(id) {
        return this.suppressionsEnCours.has(id);
    }
}

// Initialiser Firebase quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation Firebase...');
    initializeFirebase();
});
