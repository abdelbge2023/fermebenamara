// firebase-simple.js - Configuration Firebase avec Authentification et Permissions
console.log('🔧 Chargement de Firebase Simple - Authentification et Permissions activées');

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
            const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(user.email);
            console.log(`👤 Opérateur détecté: ${operateur}`);
            
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

// Fonctions d'authentification et permissions
window.firebaseAuthFunctions = {
    // Connexion email/mot de passe
    async signInWithEmail(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Connexion réussie:', userCredential.user.email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Erreur connexion:', error.code, error.message);
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') {
                message = 'Utilisateur non trouvé';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Mot de passe incorrect';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email invalide';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Trop de tentatives. Réessayez plus tard.';
            }
            return { success: false, error: message, code: error.code };
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
    },

    // Obtenir le profil opérateur basé sur l'email
    getOperateurFromEmail(email) {
        const operateurs = {
            'abdelbge2022@gmal': 'abdel',
            'elazharamra@homail.com': 'omar', 
            'xx12@hotmail.com': 'hicham',
            'test@test.com': 'abdel' // Compte de test
            // Ajoutez ici les emails réels de vos opérateurs
            // Format: 'email@domaine.com': 'operateur'
        };
        return operateurs[email] || null;
    },

    // Vérifier si l'utilisateur peut modifier une opération
    canModifyOperation(operation, currentUser) {
        if (!currentUser) return false;
        
        const operateur = this.getOperateurFromEmail(currentUser.email);
        if (!operateur) return false;

        // Abdel (admin) peut tout modifier
        if (operateur === 'abdel') return true;
        
        // Les autres opérateurs ne peuvent modifier que leurs propres opérations
        // Vérifier par userId ou par nom d'opérateur
        return operation.userId === currentUser.uid || 
               operation.operateur === operateur ||
               operation.userEmail === currentUser.email;
    },

    // Vérifier les permissions de visualisation
    getViewPermissions(currentUser) {
        if (!currentUser) {
            return { canViewAll: false, canEditAll: false, operateur: null };
        }
        
        const operateur = this.getOperateurFromEmail(currentUser.email);
        
        // Tous les opérateurs peuvent voir toutes les opérations
        return {
            canViewAll: true,
            canEditAll: operateur === 'abdel', // Seul Abdel peut tout éditer
            operateur: operateur
        };
    },

    // Vérifier si l'utilisateur peut réinitialiser Firebase
    canResetFirebase(currentUser) {
        if (!currentUser) return false;
        const operateur = this.getOperateurFromEmail(currentUser.email);
        return operateur === 'abdel'; // Seul Abdel peut réinitialiser
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
        case 'failed-precondition':
            message = '⚠️ Firebase non configuré correctement. Vérifiez la configuration.';
            break;
        case 'not-found':
            message = '🔍 Firebase non trouvé. Vérifiez les paramètres du projet.';
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
        this.maxErreursConsecutives = 5;
        this.syncInterval = null;
        
        console.log('🔄 FirebaseSync créé - Mode:', this.isOnline ? 'En ligne' : 'Hors ligne');
        
        if (db) {
            this.initEventListeners();
            this.startSyncInterval();
        } else {
            console.warn('⚠️ Firestore non disponible, réessai dans 2s...');
            setTimeout(() => {
                if (db) {
                    this.initEventListeners();
                    this.startSyncInterval();
                }
            }, 2000);
        }
    }

    initEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Écouter les erreurs de connexion
        window.addEventListener('firebaseError', (e) => {
            this.handleFirebaseError(e.detail.error);
        });
    }

    startSyncInterval() {
        // Synchroniser automatiquement toutes les 30 secondes si en ligne
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.pendingOperations.length > 0) {
                this.syncPendingOperations();
            }
        }, 30000);
    }

    handleOnline() {
        this.isOnline = true;
        this.erreursConsecutives = 0;
        console.log('🌐 Connexion rétablie - Synchronisation automatique');
        this.afficherMessageSync('Connexion rétablie - Synchronisation en cours...');
        this.syncPendingOperations();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('🔌 Hors ligne - Mode cache activé');
        this.afficherMessageSync('Mode hors ligne - Les données seront synchronisées plus tard');
    }

    handleFirebaseError(error) {
        console.error('🔥 Erreur Firebase interceptée:', error);
        this.erreursConsecutives++;
        
        if (this.erreursConsecutives >= this.maxErreursConsecutives) {
            console.warn('🚨 Trop d\'erreurs consécutives - Mode hors ligne forcé');
            this.afficherMessageSync('Mode hors ligne - Trop d\'erreurs de connexion');
        }
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
                
                // Petit délai entre les opérations pour éviter les limitations
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error('❌ Erreur synchronisation:', error);
                operationsEchouees.push(operation);
                
                if (error.code === 'permission-denied') {
                    console.error('🚨 Arrêt de la synchronisation - Permissions insuffisantes');
                    this.afficherMessageSync('Erreur de permissions - Contactez l\'administrateur');
                    break;
                }
            }
        }
        
        this.pendingOperations = operationsEchouees;
        console.log(`✅ Synchronisation: ${operationsReussies.length} réussies, ${operationsEchouees.length} en attente`);
        
        if (operationsReussies.length > 0) {
            this.afficherMessageSync(`${operationsReussies.length} opérations synchronisées`);
        }
        
        if (operationsEchouees.length > 0 && this.erreursConsecutives < this.maxErreursConsecutives) {
            // Réessayer après un délai en cas d'erreurs temporaires
            setTimeout(() => this.syncPendingOperations(), 10000);
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
            const docRef = db.collection(collection).doc(id ? id.toString() : undefined);
            
            switch (type) {
                case 'add':
                    result = await db.collection(collection).add(data);
                    break;
                case 'set':
                    result = await docRef.set(data);
                    break;
                case 'update':
                    result = await docRef.update(data);
                    break;
                case 'delete':
                    this.suppressionsEnCours.add(id);
                    try {
                        result = await docRef.delete();
                        console.log(`✅ Suppression Firebase réussie: ${id}`);
                    } finally {
                        setTimeout(() => {
                            this.suppressionsEnCours.delete(id);
                        }, 5000);
                    }
                    break;
                default:
                    throw new Error(`Type d'opération inconnu: ${type}`);
            }
            
            this.erreursConsecutives = 0; // Réinitialiser le compteur d'erreurs en cas de succès
            return result;
            
        } catch (error) {
            this.erreursConsecutives++;
            console.error(`❌ Erreur ${type} opération:`, error.code, error.message);
            
            // Diffuser l'erreur pour une gestion globale
            window.dispatchEvent(new CustomEvent('firebaseError', {
                detail: { error: error }
            }));
            
            if (error.code === 'permission-denied') {
                console.error('🚨 Permissions Firebase insuffisantes');
                this.afficherMessageSync('Erreur de permissions - Vérifiez les règles de sécurité');
            } else if (error.code === 'unavailable') {
                console.warn('🌐 Firebase indisponible - Mode hors ligne');
                this.afficherMessageSync('Service indisponible - Mode hors ligne activé');
            } else if (error.code === 'not-found') {
                console.error('🔍 Document non trouvé - Peut-être déjà supprimé');
            }
            
            throw error;
        }
    }

    afficherMessageSync(message) {
        // Créer ou mettre à jour un message de statut global
        let messageDiv = document.getElementById('firebaseSyncMessage');
        
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'firebaseSyncMessage';
            messageDiv.style.cssText = `
                background: #d1ecf1;
                color: #0c5460;
                padding: 10px 15px;
                border-radius: 5px;
                margin: 10px 0;
                border-left: 4px solid #17a2b8;
                font-size: 14px;
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(messageDiv);
        }
        
        messageDiv.textContent = `🔄 ${message}`;
        messageDiv.style.display = 'block';
        
        // Masquer après 5 secondes pour les messages non critiques
        if (!message.includes('erreur') && !message.includes('Erreur')) {
            setTimeout(() => {
                if (messageDiv) {
                    messageDiv.style.display = 'none';
                }
            }, 5000);
        }
    }

    addOperation(operation) {
        if (this.isOnline && db && this.erreursConsecutives < this.maxErreursConsecutives) {
            return this.executeOperation(operation).catch(error => {
                // En cas d'erreur, sauvegarder localement pour resynchronisation
                console.log('💾 Opération sauvegardée localement après erreur');
                this.pendingOperations.push(operation);
                throw error;
            });
        } else {
            this.pendingOperations.push(operation);
            console.log('💾 Opération sauvegardée localement pour synchronisation ultérieure');
            return Promise.resolve({ id: 'pending_' + Date.now() });
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
            console.log(`📥 Chargement de la collection ${collectionName}...`);
            
            const snapshot = await db.collection(collectionName)
                .orderBy('timestamp', 'desc')
                .limit(1000) // Limite pour éviter de charger trop de données
                .get();
                
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`✅ ${data.length} documents chargés depuis ${collectionName}`);
            
            this.erreursConsecutives = 0; // Réinitialiser en cas de succès
            return data;
            
        } catch (error) {
            this.erreursConsecutives++;
            console.error(`❌ Erreur lecture ${collectionName}:`, error.code, error.message);
            
            window.dispatchEvent(new CustomEvent('firebaseError', {
                detail: { error: error }
            }));
            
            if (error.code === 'permission-denied') {
                this.afficherMessageSync('Impossible de charger les données - Vérifiez les permissions');
            } else if (error.code === 'unavailable') {
                this.afficherMessageSync('Service indisponible - Données locales utilisées');
            }
            
            return [];
        }
    }

    listenToCollection(collectionName, callback) {
        if (!db) {
            console.error('❌ Firestore non initialisé');
            return () => {};
        }

        if (this.erreursConsecutives >= this.maxErreursConsecutives) {
            console.warn('🚨 Écoute désactivée - Trop d\'erreurs');
            return () => {};
        }

        console.log(`👂 Début de l'écoute en temps réel sur ${collectionName}`);
        
        try {
            const unsubscribe = db.collection(collectionName)
                .orderBy('timestamp', 'desc')
                .limit(500) // Limite pour les performances
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
                    
                    window.dispatchEvent(new CustomEvent('firebaseError', {
                        detail: { error: error }
                    }));
                    
                    if (error.code === 'permission-denied') {
                        console.error('🚨 Écoute en temps réel bloquée - Permissions insuffisantes');
                        this.afficherMessageSync('Connexion temps réel impossible - Vérifiez les règles de sécurité');
                    } else if (error.code === 'resource-exhausted') {
                        console.error('🚨 Quota dépassé - Écoute désactivée temporairement');
                        this.afficherMessageSync('Quota dépassé - Reconnexion automatique dans 30s');
                        
                        // Réessayer après 30 secondes
                        setTimeout(() => {
                            if (this.erreursConsecutives < this.maxErreursConsecutives) {
                                this.listenToCollection(collectionName, callback);
                            }
                        }, 30000);
                    }
                });
                
            return unsubscribe;
            
        } catch (error) {
            console.error('❌ Erreur création écoute:', error);
            return () => {};
        }
    }

    async addDocument(collectionName, data) {
        console.log(`📤 Synchronisation automatique: ajout à ${collectionName}`);
        
        // Ajouter un timestamp si non présent
        if (!data.timestamp) {
            data.timestamp = new Date().toISOString();
        }
        
        if (this.isOnline && db && this.erreursConsecutives < this.maxErreursConsecutives) {
            try {
                const docRef = await db.collection(collectionName).add(data);
                console.log(`✅ Document ajouté avec ID: ${docRef.id}`);
                return docRef;
            } catch (error) {
                console.error('❌ Erreur ajout document:', error);
                
                // Sauvegarder localement en cas d'erreur
                this.pendingOperations.push({
                    type: 'add',
                    collection: collectionName,
                    data: data
                });
                
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
        
        // Mettre à jour le timestamp
        data.timestamp = new Date().toISOString();
        
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

    // Obtenir le statut de synchronisation
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            pendingOperations: this.pendingOperations.length,
            consecutiveErrors: this.erreursConsecutives,
            maxErrors: this.maxErreursConsecutives
        };
    }

    // Vider les opérations en attente (pour les tests)
    clearPendingOperations() {
        this.pendingOperations = [];
        console.log('🧹 Opérations en attente vidées');
    }

    // Nettoyer à la destruction
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// Gestion des erreurs non capturées
window.addEventListener('error', function(e) {
    console.error('💥 Erreur non capturée:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Promise rejetée non gérée:', e.reason);
});

// Initialiser Firebase quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation Firebase...');
    
    // Vérifier que Firebase est disponible
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase non chargé - Vérifiez la connexion internet');
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 8px;
            margin: 20px;
            border-left: 4px solid #dc3545;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>❌ Erreur de chargement</h3>
            <p>Firebase n'a pas pu être chargé. Vérifiez votre connexion internet.</p>
            <button onclick="window.location.reload()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">🔄 Recharger la page</button>
        `;
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.appendChild(errorDiv);
        } else {
            document.body.appendChild(errorDiv);
        }
        return;
    }
    
    initializeFirebase();
});

// Export pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FirebaseSync,
        firebaseConfig,
        initializeFirebase
    };
}
