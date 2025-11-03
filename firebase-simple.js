// firebase-simple.js - Configuration Firebase avec Authentification
console.log('🔧 Chargement de Firebase Simple - Authentification + Synchronisation');

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
                    console.warn('⚠️ Persistance non disponible:', err);
                });
            
            firebaseInitialized = true;
            console.log('✅ Firebase initialisé avec succès');
            
            // Initialiser firebaseSync
            firebaseSync = new FirebaseSync();
            window.firebaseSync = firebaseSync;
            window.firebaseDb = db;
            window.firebaseAuth = auth;
            
        } else if (firebase.apps.length > 0) {
            db = firebase.firestore();
            auth = firebase.auth();
            firebaseInitialized = true;
            console.log('ℹ️ Firebase déjà initialisé');
            firebaseSync = new FirebaseSync();
            window.firebaseSync = firebaseSync;
            window.firebaseDb = db;
            window.firebaseAuth = auth;
        }
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
    }
}

// Classe de synchronisation Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.suppressionsEnCours = new Set();
        console.log('🔄 FirebaseSync créé');
        
        if (db) {
            this.initEventListeners();
        } else {
            console.warn('⚠️ Firestore non disponible, réessai dans 1s...');
            setTimeout(() => {
                if (db) this.initEventListeners();
            }, 1000);
        }
    }

    initEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        this.isOnline = true;
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
        
        for (const operation of this.pendingOperations) {
            try {
                await this.executeOperation(operation);
            } catch (error) {
                console.error('❌ Erreur synchronisation:', error);
            }
        }
        this.pendingOperations = [];
        console.log('✅ Synchronisation automatique terminée');
    }

    async executeOperation(operation) {
        if (!db) {
            throw new Error('Firestore non initialisé');
        }

        const { type, collection, data, id } = operation;

        switch (type) {
            case 'add':
                return await db.collection(collection).add(data);
            case 'set':
                return await db.collection(collection).doc(id.toString()).set(data);
            case 'update':
                return await db.collection(collection).doc(id.toString()).update(data);
            case 'delete':
                this.suppressionsEnCours.add(id);
                try {
                    const result = await db.collection(collection).doc(id.toString()).delete();
                    console.log(`✅ Suppression Firebase réussie: ${id}`);
                    return result;
                } catch (error) {
                    console.error(`❌ Erreur suppression Firebase ${id}:`, error);
                    throw error;
                } finally {
                    setTimeout(() => {
                        this.suppressionsEnCours.delete(id);
                    }, 3000);
                }
            default:
                throw new Error(`Type inconnu: ${type}`);
        }
    }

    addOperation(operation) {
        if (this.isOnline && db) {
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

        try {
            const snapshot = await db.collection(collectionName).get();
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${data.length} documents synchronisés depuis ${collectionName}`);
            return data;
        } catch (error) {
            console.error(`❌ Erreur lecture ${collectionName}:`, error);
            return [];
        }
    }

    listenToCollection(collectionName, callback) {
        if (!db) {
            console.error('❌ Firestore non initialisé');
            return () => {};
        }

        console.log(`👂 Début de l'écoute en temps réel sur ${collectionName}`);
        
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
                console.error(`❌ Erreur écoute ${collectionName}:`, error);
            });
    }

    async addDocument(collectionName, data) {
        console.log(`📤 Synchronisation automatique: ajout à ${collectionName}`);
        
        if (this.isOnline && db) {
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

// Gestion de l'authentification
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Écouter les changements d'état d'authentification
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    handleAuthStateChange(user) {
        const authSection = document.getElementById('authSection');
        const appSection = document.getElementById('appSection');
        const userEmail = document.getElementById('userEmail');

        if (user) {
            // Utilisateur connecté
            console.log('✅ Utilisateur connecté:', user.email);
            currentUser = user;
            
            if (authSection) authSection.style.display = 'none';
            if (appSection) appSection.style.display = 'block';
            if (userEmail) userEmail.textContent = user.email;
            
            // Initialiser l'application
            if (window.app) {
                window.app.init();
            }
        } else {
            // Utilisateur déconnecté
            console.log('🚪 Utilisateur déconnecté');
            currentUser = null;
            
            if (authSection) authSection.style.display = 'block';
            if (appSection) appSection.style.display = 'none';
        }
    }

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Connexion réussie:', userCredential.user.email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await auth.signOut();
            console.log('✅ Déconnexion réussie');
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialiser Firebase quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation Firebase...');
    initializeFirebase();
    
    // Initialiser le gestionnaire d'authentification
    window.authManager = new AuthManager();
});
