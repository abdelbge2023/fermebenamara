// firebase-simple.js - Configuration Firebase avec authentification
console.log('🔧 Chargement de Firebase Simple - Synchronisation automatique');

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
let firebaseInitialized = false;
let firebaseSync;

// Fonction d'initialisation Firebase
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            
            // Configuration avec merge: true pour éviter l'erreur
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
            
        } else if (firebase.apps.length > 0) {
            db = firebase.firestore();
            firebaseInitialized = true;
            console.log('ℹ️ Firebase déjà initialisé');
            firebaseSync = new FirebaseSync();
            window.firebaseSync = firebaseSync;
            window.firebaseDb = db;
        }
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
    }
}

// Classe de synchronisation Firebase avec authentification
class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.suppressionsEnCours = new Set();
        this.user = null;
        console.log('🔄 FirebaseSync créé');
        
        if (db) {
            this.initAuth();
        } else {
            console.warn('⚠️ Firestore non disponible, réessai dans 1s...');
            setTimeout(() => {
                if (db) this.initAuth();
            }, 1000);
        }
    }

    async initAuth() {
        try {
            // Écouter les changements d'état d'authentification
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.user = user;
                    console.log('✅ Utilisateur authentifié:', user.uid);
                    this.initEventListeners();
                    this.syncPendingOperations();
                    
                    // Notifier l'application que Firebase est prêt
                    if (window.app && window.app.onFirebaseReady) {
                        window.app.onFirebaseReady();
                    }
                } else {
                    console.log('🔐 Aucun utilisateur connecté - Connexion anonyme...');
                    // Se connecter anonymement
                    this.signInAnonymously();
                }
            });
        } catch (error) {
            console.error('❌ Erreur initialisation auth:', error);
        }
    }

    async signInAnonymously() {
        try {
            const result = await firebase.auth().signInAnonymously();
            this.user = result.user;
            console.log('✅ Connexion anonyme réussie:', result.user.uid);
        } catch (error) {
            console.error('❌ Erreur connexion anonyme:', error);
            // Réessayer après 2 secondes
            setTimeout(() => this.signInAnonymously(), 2000);
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

        // Attendre que l'utilisateur soit authentifié
        if (!this.user) {
            console.log('⏳ En attente de l\'authentification...');
            await new Promise(resolve => {
                const checkAuth = setInterval(() => {
                    if (this.user) {
                        clearInterval(checkAuth);
                        resolve();
                    }
                }, 100);
            });
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
                // Marquer la suppression comme en cours pour éviter les boucles
                this.suppressionsEnCours.add(id);
                try {
                    const result = await db.collection(collection).doc(id.toString()).delete();
                    console.log(`✅ Suppression Firebase réussie: ${id}`);
                    return result;
                } catch (error) {
                    console.error(`❌ Erreur suppression Firebase ${id}:`, error);
                    throw error;
                } finally {
                    // Retirer après un délai
                    setTimeout(() => {
                        this.suppressionsEnCours.delete(id);
                    }, 3000);
                }
            default:
                throw new Error(`Type inconnu: ${type}`);
        }
    }

    addOperation(operation) {
        if (this.isOnline && db && this.user) {
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

        // Attendre que l'utilisateur soit authentifié
        if (!this.user) {
            console.log('⏳ En attente de l\'authentification pour la lecture...');
            await new Promise(resolve => {
                const checkAuth = setInterval(() => {
                    if (this.user) {
                        clearInterval(checkAuth);
                        resolve();
                    }
                }, 100);
            });
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
        
        // Attendre que l'utilisateur soit authentifié avant de démarrer l'écoute
        const startListening = () => {
            if (!this.user) {
                console.log('⏳ En attente de l\'authentification pour l\'écoute...');
                setTimeout(startListening, 100);
                return () => {};
            }

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
                    // En cas d'erreur de permission, réessayer l'authentification
                    if (error.code === 'permission-denied') {
                        console.log('🔐 Erreur de permission - Reconnexion...');
                        this.signInAnonymously();
                    }
                });
        };

        return startListening();
    }

    async addDocument(collectionName, data) {
        console.log(`📤 Synchronisation automatique: ajout à ${collectionName}`);
        
        if (this.isOnline && db && this.user) {
            try {
                // Firebase génère automatiquement l'ID
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
        // Vérifier si la suppression n'est pas déjà en cours (éviter les boucles)
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

    // Méthode pour vérifier si une suppression est en cours
    isSuppressionEnCours(id) {
        return this.suppressionsEnCours.has(id);
    }

    // Méthode pour vérifier si Firebase est prêt
    isReady() {
        return db !== null && this.user !== null;
    }
}

// Initialiser Firebase quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation Firebase...');
    initializeFirebase();
});
