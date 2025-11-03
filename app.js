// app.js - Version avec authentification Firebase et permissions
class GestionFerme {
    constructor() {
        this.operations = [];
        this.caisses = {
            'abdel_caisse': 0, 'omar_caisse': 0, 'hicham_caisse': 0, 
            'zaitoun_caisse': 0, '3commain_caisse': 0
        };
        this.editMode = false;
        this.selectedOperations = new Set();
        this.currentView = 'global';
        this.caisseSelectionnee = null;
        this.firebaseInitialized = false;
        this.synchronisationEnCours = false;
        this.firebaseReady = false;
        
        // Pour éviter les boucles de synchronisation
        this.suppressionsEnCours = new Set();
        this.ajoutsEnCours = new Set();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.chargerDepuisLocalStorage(); // Charger d'abord depuis le localStorage
        
        // Attendre que Firebase soit prêt
        this.waitForFirebase().then(() => {
            this.setupFirebaseRealtimeListeners();
            this.synchroniserAvecFirebase();
        });
        
        this.updateStats();
        this.afficherHistorique('global');
        this.updateUIForCurrentUser();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    // Attendre que Firebase soit prêt
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = setInterval(() => {
                if (window.firebaseSync && window.firebaseSync.isReady && window.firebaseSync.isReady()) {
                    clearInterval(checkFirebase);
                    this.firebaseReady = true;
                    console.log('✅ Firebase prêt avec authentification');
                    resolve();
                }
            }, 100);
        });
    }

    // NOUVELLE MÉTHODE : Callback quand Firebase est prêt
    onFirebaseReady() {
        this.firebaseReady = true;
        console.log('✅ Firebase prêt - Synchronisation activée');
        this.synchroniserAvecFirebase();
    }

    // NOUVELLE MÉTHODE : Mise à jour de l'interface selon l'utilisateur
    onUserChange() {
        console.log('🔄 Mise à jour interface pour utilisateur:', auth ? auth.getCurrentUsername() : 'Non connecté');
        this.mettreAJourAffichage();
        this.updateUIForCurrentUser();
    }

    updateUIForCurrentUser() {
        const isLoggedIn = auth && auth.currentUser !== null;
        const isAdmin = auth && auth.isAdmin;
        
        // Afficher/masquer les sections selon la connexion
        const mainSections = document.querySelectorAll('.main-grid, .stats-section, .navigation-section');
        mainSections.forEach(section => {
            section.style.display = isLoggedIn ? 'block' : 'none';
        });
        
        // Mettre à jour le sélecteur d'opérateur dans le formulaire
        const operateurSelect = document.getElementById('operateur');
        if (operateurSelect && isLoggedIn && !isAdmin) {
            // Pour les non-admins, forcer la sélection de leur propre nom
            operateurSelect.value = auth.getCurrentUsername();
            operateurSelect.disabled = true;
        } else if (operateurSelect && isLoggedIn && isAdmin) {
            operateurSelect.disabled = false;
        }

        // Masquer les boutons d'administration pour les non-admins
        const adminButtons = document.querySelectorAll('button[onclick*="reinitialiserFirebase"]');
        adminButtons.forEach(btn => {
            btn.style.display = isAdmin ? 'inline-block' : 'none';
        });
    }

    setupEventListeners() {
        console.log('🔧 Configuration des écouteurs d\'événements...');
        
        // Formulaire de saisie
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }
        
        // Formulaire de transfert
        const transfertForm = document.getElementById('transfertForm');
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.ajouterTransfert(e));
        }
        
        // Bouton reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }
        
        // Mode édition
        const btnEditMode = document.getElementById('btnEditMode');
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode(true));
        }
        
        // Suppression sélectionnée
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => this.supprimerOperationsSelectionnees());
        }
        
        // Annuler édition
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => this.toggleEditMode(false));
        }
        
        // Gestion des onglets
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sheet = e.target.getAttribute('data-sheet');
                this.afficherHistorique(sheet);
                
                // Mettre à jour l'onglet actif
                tabButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Modal de modification
        const editModal = document.getElementById('editModal');
        const closeModalButtons = document.querySelectorAll('.close-modal');
        
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                editModal.style.display = 'none';
            });
        });
        
        // Formulaire de modification
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
        
        // Fermer modal en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        });
        
        // Gestion du type d'opération pour afficher la répartition
        const typeOperationSelect = document.getElementById('typeOperation');
        if (typeOperationSelect) {
            typeOperationSelect.addEventListener('change', (e) => {
                this.gestionAffichageRepartition(e.target.value);
            });
        }
        
        console.log('✅ Écouteurs d\'événements configurés');
    }

    // ... (toutes les autres méthodes restent identiques à la version précédente)
    // Seules les méthodes modifiées sont montrées ci-dessus pour économiser de l'espace

    // Les autres méthodes (gestionAffichageRepartition, ajouterTransfert, toggleEditMode, etc.)
    // restent exactement les mêmes que dans le code précédent
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});

// Exposer l'application globalement pour les callbacks
window.app = app;
