// app.js - Application principale
console.log('🚀 Chargement de l\'application principale...');

class GestionFermeApp {
    constructor() {
        this.operations = [];
        this.currentView = 'global';
        this.editMode = false;
        this.selectedOperations = new Set();
        this.currentUser = null;
        this.userPermissions = {};
        
        this.initEventListeners();
        this.setupAuthHandlers();
    }

    initEventListeners() {
        // Écouteurs d'authentification
        window.addEventListener('userAuthenticated', (e) => this.handleUserAuthenticated(e.detail.user));
        window.addEventListener('userSignedOut', () => this.handleUserSignedOut());

        // Formulaire de connexion
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Déconnexion
        document.getElementById('btnLogout').addEventListener('click', () => this.handleLogout());
        
        // Formulaire principal
        document.getElementById('saisieForm').addEventListener('submit', (e) => this.handleNouvelleOperation(e));
        document.getElementById('transfertForm').addEventListener('submit', (e) => this.handleTransfert(e));
        
        // Navigation par onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.sheet));
        });

        // Gestion édition
        document.getElementById('btnEditMode').addEventListener('click', () => this.toggleEditMode());
        document.getElementById('btnDeleteSelected').addEventListener('click', () => this.deleteSelectedOperations());
        document.getElementById('btnCancelEdit').addEventListener('click', () => this.cancelEditMode());

        // Export
        document.getElementById('btnExportComplet').addEventListener('click', () => this.exportExcelComplet());
        document.getElementById('btnExportVue').addEventListener('click', () => this.exportVueActuelle());
        document.getElementById('btnExportDetail').addEventListener('click', () => this.exportRapportComplet());

        // Réinitialisation
        document.getElementById('btnResetLocal').addEventListener('click', () => this.resetLocalData());
        document.getElementById('btnResetFirebase').addEventListener('click', () => this.resetFirebaseData());

        // Manuel
        document.getElementById('btnManual').addEventListener('click', () => this.showManual());
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Reset formulaire
        document.getElementById('btnReset').addEventListener('click', () => this.resetForm());

        // Gestion répartition
        document.getElementById('typeOperation').addEventListener('change', () => this.updateRepartition());
        document.getElementById('groupe').addEventListener('change', () => this.updateRepartition());
        document.getElementById('montant').addEventListener('input', () => this.updateRepartition());
    }

    setupAuthHandlers() {
        console.log('🔐 Configuration des gestionnaires d\'authentification...');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const authMessage = document.createElement('div');
        authMessage.className = 'auth-message auth-loading';
        authMessage.textContent = 'Connexion en cours...';
        
        const loginForm = document.getElementById('loginForm');
        loginForm.parentNode.insertBefore(authMessage, loginForm.nextSibling);

        try {
            const result = await window.firebaseAuthFunctions.signInWithEmail(email, password);
            
            if (result.success) {
                authMessage.className = 'auth-message auth-info';
                authMessage.textContent = 'Connexion réussie!';
                console.log('✅ Utilisateur connecté:', result.user.email);
            } else {
                authMessage.className = 'auth-message auth-error';
                authMessage.textContent = `Erreur: ${result.error}`;
                console.error('❌ Erreur connexion:', result.error);
            }
        } catch (error) {
            authMessage.className = 'auth-message auth-error';
            authMessage.textContent = 'Erreur de connexion';
            console.error('❌ Erreur connexion:', error);
        }

        setTimeout(() => authMessage.remove(), 3000);
    }

    handleUserAuthenticated(user) {
        console.log('👤 Utilisateur authentifié:', user.email);
        this.currentUser = user;
        this.userPermissions = window.firebaseAuthFunctions.getViewPermissions(user);
        
        // Masquer écran connexion, afficher application
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContent').style.display = 'block';
        
        // Mettre à jour l'interface utilisateur
        this.updateUserInterface();
        
        // Charger les données
        this.loadOperations();
        
        // Configurer l'opérateur automatiquement
        this.setupOperateurAuto();
    }

    handleUserSignedOut() {
        console.log('👤 Utilisateur déconnecté');
        this.currentUser = null;
        this.userPermissions = {};
        
        // Masquer application, afficher écran connexion
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Réinitialiser formulaire connexion
        document.getElementById('loginForm').reset();
    }

    async handleLogout() {
        try {
            await window.firebaseAuthFunctions.signOut();
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('userEmail').textContent = this.currentUser.email;
            
            const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email);
            if (operateur) {
                document.getElementById('userOperateur').textContent = operateur.toUpperCase();
                document.getElementById('operateur').value = operateur;
            }
        }
    }

    setupOperateurAuto() {
        if (this.currentUser) {
            const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email);
            const selectOperateur = document.getElementById('operateur');
            
            if (operateur && selectOperateur) {
                selectOperateur.value = operateur;
                console.log(`👤 Opérateur automatiquement défini: ${operateur}`);
            }
        }
    }

    async loadOperations() {
        console.log('📥 Chargement des opérations...');
        
        try {
            if (window.firebaseSync) {
                const operations = await window.firebaseSync.getCollection('operations');
                this.operations = operations;
                this.updateAffichage();
                this.updateStats();
            } else {
                console.error('❌ FirebaseSync non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur chargement opérations:', error);
        }
    }

    updateAffichage() {
        console.log('🔄 Mise à jour affichage...');
        // Implémentez la logique d'affichage ici
    }

    updateStats() {
        console.log('📊 Mise à jour statistiques...');
        // Implémentez la logique des statistiques ici
    }

    async handleNouvelleOperation(e) {
        e.preventDefault();
        console.log('➕ Nouvelle opération...');
        // Implémentez la logique d'ajout d'opération ici
    }

    async handleTransfert(e) {
        e.preventDefault();
        console.log('🔄 Transfert...');
        // Implémentez la logique de transfert ici
    }

    switchView(view) {
        console.log('🔀 Changement vue:', view);
        this.currentView = view;
        this.updateAffichage();
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        // Implémentez la logique du mode édition ici
    }

    updateRepartition() {
        // Implémentez la logique de répartition ici
    }

    // ... autres méthodes à implémenter ...

    resetForm() {
        document.getElementById('saisieForm').reset();
        document.getElementById('repartitionInfo').style.display = 'none';
    }

    showManual() {
        document.getElementById('manualModal').style.display = 'flex';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    exportExcelComplet() {
        console.log('📊 Export Excel complet...');
    }

    exportVueActuelle() {
        console.log('📋 Export vue actuelle...');
    }

    exportRapportComplet() {
        console.log('📈 Rapport complet...');
    }

    resetLocalData() {
        console.log('🗑️ Reset données locales...');
    }

    resetFirebaseData() {
        console.log('🚨 Reset Firebase...');
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation application...');
    window.gestionFermeApp = new GestionFermeApp();
});

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('💥 Erreur globale:', e.error);
});
