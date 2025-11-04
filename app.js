// app.js - Version avec authentification persistante
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
        this.initialized = false;
        
        console.log('🚀 Application Gestion Ferme créée');
        
        // Vérifier l'état d'authentification
        this.checkAuthState();
    }

    async checkAuthState() {
        console.log('🔍 Vérification de l\'état d\'authentification...');
        
        if (!window.authManager) {
            console.log('⏳ AuthManager pas encore disponible...');
            setTimeout(() => this.checkAuthState(), 1000);
            return;
        }
        
        // Attendre que l'état d'authentification soit vérifié
        if (!window.authManager.isAuthChecked()) {
            console.log('⏳ En attente de la vérification d\'authentification...');
            setTimeout(() => this.checkAuthState(), 500);
            return;
        }
        
        if (window.authManager.isAuthenticated()) {
            console.log('✅ Utilisateur authentifié, initialisation...');
            this.onUserAuthenticated();
        } else {
            console.log('🔐 En attente de la connexion utilisateur...');
            // L'application s'initialisera automatiquement quand l'utilisateur se connectera
        }
    }

    onUserAuthenticated() {
        if (this.initialized) {
            console.log('ℹ️ Application déjà initialisée');
            return;
        }
        
        console.log('🎯 Initialisation de l\'application...');
        this.initialized = true;
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée et prête');
    }

    setupEventListeners() {
        console.log('🔧 Configuration des écouteurs d\'événements...');
        
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
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
                tabButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Modal de modification
        const editModal = document.getElementById('editModal');
        const closeModalButtons = document.querySelectorAll('.close-modal');
        
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (editModal) editModal.style.display = 'none';
            });
        });
        
        // Formulaire de modification
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
        
        // Fermer modal en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            const editModal = document.getElementById('editModal');
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

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showAuthMessage('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        this.showAuthMessage('Connexion en cours...', 'info');
        
        try {
            const result = await authManager.login(email, password);
            
            if (result.success) {
                this.showAuthMessage('✅ Connexion réussie !', 'success');
                // L'application s'initialisera automatiquement via l'écouteur d'auth
            } else {
                this.showAuthMessage(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            this.showAuthMessage('❌ Erreur de connexion', 'error');
        }
    }

    async handleLogout() {
        await authManager.logout();
    }

    showAuthMessage(message, type) {
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = `auth-message ${type}`;
        }
    }

    async chargerDonnees() {
        console.log('📥 Chargement des données...');
        this.chargerDepuisLocalStorage();
        
        if (window.firebaseSync) {
            await this.synchroniserAvecFirebase();
        }
        
        console.log(`📁 ${this.operations.length} opérations chargées`);
    }

    chargerDepuisLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log(`💾 ${this.operations.length} opérations chargées du stockage local`);
            } catch (error) {
                console.error('❌ Erreur chargement localStorage:', error);
                this.operations = [];
            }
        }
    }

    async synchroniserAvecFirebase() {
        try {
            const operationsFirebase = await firebaseSync.getCollection('operations');
            
            if (operationsFirebase && operationsFirebase.length > 0) {
                console.log(`📡 ${operationsFirebase.length} opérations sur Firebase`);
                this.operations = operationsFirebase;
                this.sauvegarderLocalement();
            }
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        }
    }

    // ... (toutes les autres méthodes restent identiques à la version précédente)
    // ajouterOperation, ajouterTransfert, afficherHistorique, updateStats, etc.

    gestionAffichageRepartition(typeOperation) {
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');
        const montantInput = document.getElementById('montant');
        
        if (!repartitionInfo || !repartitionDetails) return;
        
        if (typeOperation === 'travailleur_global') {
            repartitionInfo.style.display = 'block';
            
            const updateRepartition = () => {
                const montant = parseFloat(montantInput.value) || 0;
                if (montant > 0) {
                    const partZaitoun = (montant / 3).toFixed(2);
                    const part3Commain = ((montant * 2) / 3).toFixed(2);
                    
                    repartitionDetails.innerHTML = `
                        <div class="repartition-details">
                            <div class="repartition-item zaitoun">
                                <span class="repartition-label">🫒 Zaitoun (1/3):</span>
                                <span class="repartition-value">${partZaitoun} DH</span>
                            </div>
                            <div class="repartition-item commain">
                                <span class="repartition-label">🔧 3 Commain (2/3):</span>
                                <span class="repartition-value">${part3Commain} DH</span>
                            </div>
                        </div>
                    `;
                } else {
                    repartitionDetails.innerHTML = '<p>Saisissez un montant pour voir la répartition</p>';
                }
            };
            
            montantInput.removeEventListener('input', updateRepartition);
            montantInput.addEventListener('input', updateRepartition);
            updateRepartition();
            
        } else {
            repartitionInfo.style.display = 'none';
        }
    }

    async ajouterOperation(e) {
        e.preventDefault();

        if (!this.isUserAuthenticated()) {
            alert('Vous devez être connecté pour ajouter une opération');
            return;
        }

        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montantSaisi = parseFloat(document.getElementById('montant').value);
        const descriptionValue = document.getElementById('description').value.trim();

        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!descriptionValue) {
            alert('Veuillez saisir une description');
            return;
        }

        const nouvelleOperation = {
            date: new Date().toISOString().split('T')[0],
            operateur: operateur,
            groupe: groupe,
            typeOperation: typeOperation,
            typeTransaction: typeTransaction,
            caisse: caisse,
            description: descriptionValue,
            montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
            timestamp: new Date().toISOString(),
            createdBy: this.getCurrentUserEmail()
        };

        try {
            if (window.firebaseSync) {
                const result = await firebaseSync.addDocument('operations', nouvelleOperation);
                nouvelleOperation.id = result.id;
                console.log('✅ Opération sauvegardée sur Firebase');
            } else {
                nouvelleOperation.id = 'local_' + Date.now();
                console.log('✅ Opération sauvegardée localement');
            }
            
            this.operations.unshift(nouvelleOperation);
            this.sauvegarderLocalement();
            this.afficherMessageSucces('Opération enregistrée !');
            this.resetForm();
            this.mettreAJourAffichage();
            
        } catch (error) {
            console.error('❌ Erreur ajout opération:', error);
            alert('Erreur lors de l\'enregistrement');
        }
    }

    isUserAuthenticated() {
        return window.authManager && window.authManager.isAuthenticated();
    }

    getCurrentUserEmail() {
        return window.authManager && window.authManager.getCurrentUser() ? 
               window.authManager.getCurrentUser().email : 'Utilisateur inconnu';
    }

    sauvegarderLocalement() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    updateStats() {
        this.calculerSoldes();
        const container = document.getElementById('statsContainer');
        if (!container) return;

        container.innerHTML = 
            '<div class="stats-grid">' +
            this.creerCarteCaisse('abdel_caisse', 'Caisse Abdel') +
            this.creerCarteCaisse('omar_caisse', 'Caisse Omar') +
            this.creerCarteCaisse('hicham_caisse', 'Caisse Hicham') +
            this.creerCarteCaisse('zaitoun_caisse', 'Caisse Zaitoun') +
            this.creerCarteCaisse('3commain_caisse', 'Caisse 3 Commain') +
            '</div>';
    }

    calculerSoldes() {
        // Réinitialiser les caisses
        this.caisses = {
            'abdel_caisse': 0, 'omar_caisse': 0, 'hicham_caisse': 0, 
            'zaitoun_caisse': 0, '3commain_caisse': 0
        };

        // Calculer les soldes
        this.operations.forEach(op => {
            this.caisses[op.caisse] += op.montant;
        });
    }

    creerCarteCaisse(cleCaisse, nomCaisse) {
        const solde = this.caisses[cleCaisse];
        const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
        
        return `<div class="stat-card ${classeCouleur}" onclick="app.afficherDetailsCaisse('${cleCaisse}')" style="cursor: pointer;">
            <div class="stat-label">${nomCaisse}</div>
            <div class="stat-value">${solde.toFixed(2)}</div>
            <div class="stat-label">DH</div>
        </div>`;
    }

    afficherMessageSucces(message) {
        // Créer un toast de notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        const repartitionInfo = document.getElementById('repartitionInfo');
        if (saisieForm) saisieForm.reset();
        if (repartitionInfo) repartitionInfo.style.display = 'none';
    }

    mettreAJourAffichage() {
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // Méthodes de formatage
    formaterDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const noms = { 'abdel': 'Abdel', 'omar': 'Omar', 'hicham': 'Hicham', 'system': 'Système' };
        return noms[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const noms = { 'zaitoun': 'Zaitoun', '3commain': '3 Commain', 'system': 'Système' };
        return noms[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': 'Travailleur Global',
            'zaitoun': 'Zaitoun', '3commain': '3 Commain',
            'autre': 'Autre', 'transfert': 'Transfert'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        return type === 'revenu' ? '💰 Revenu' : '💸 Frais';
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': 'Caisse Abdel', 'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham', 'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    // Les autres méthodes (afficherHistorique, afficherDetailsCaisse, etc.) restent identiques
    // ... (copiez-les depuis votre version précédente)
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    window.app = app;
    console.log('🎉 Application chargée et prête');
});
