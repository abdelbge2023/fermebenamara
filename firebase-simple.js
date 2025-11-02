// firebase-simple.js - Configuration Firebase avec synchronisation automatique
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

// Classe de synchronisation Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
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
                return await db.collection(collection).doc(id.toString()).delete();
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
        return this.addOperation({
            type: 'add',
            collection: collectionName,
            data: data
        });
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
        console.log(`📤 Synchronisation automatique: suppression ${collectionName}/${id}`);
        return this.addOperation({
            type: 'delete',
            collection: collectionName,
            id: id,
            data: {}
        });
    }
}

// Initialiser Firebase quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation Firebase...');
    initializeFirebase();
});
