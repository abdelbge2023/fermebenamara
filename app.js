// app.js - Version corrigée avec authentification
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
        
        console.log('🚀 Application Gestion Ferme créée');
        
        // Attendre que l'authentification soit prête
        this.waitForAuth();
    }

    async waitForAuth() {
        if (!window.authManager) {
            console.log('⏳ En attente du gestionnaire d\'authentification...');
            setTimeout(() => this.waitForAuth(), 1000);
            return;
        }
        
        if (window.authManager.isAuthenticated()) {
            console.log('✅ Utilisateur déjà authentifié, initialisation...');
            this.init();
        } else {
            console.log('⏳ En attente de l\'authentification...');
            // Vérifier périodiquement si l'utilisateur se connecte
            setTimeout(() => this.waitForAuth(), 2000);
        }
    }

    async init() {
        console.log('🎯 Initialisation de l\'application...');
        this.setupEventListeners();
        await this.chargerDonnees();
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
                this.showAuthMessage('✅ Connexion réussie ! Redirection...', 'success');
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

    // ... (toutes les autres méthodes restent identiques)
    // ajouterOperation, ajouterTransfert, afficherHistorique, etc.

    // Méthodes d'authentification
    getCurrentUserEmail() {
        return window.authManager ? window.authManager.getCurrentUser().email : 'Utilisateur';
    }

    // Méthodes de formatage (identiques à avant)
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

    afficherDetailsCaisse(caisse) {
        this.caisseSelectionnee = caisse;
        this.updateStats();
        
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const nomCaisse = this.formaterCaisse(caisse);
        
        const container = document.getElementById('dataDisplay');
        if (!container) return;
        
        if (operationsCaisse.length === 0) {
            container.innerHTML = '<div class="empty-message"><p>Aucune opération pour cette caisse</p></div>';
            return;
        }
        
        // Afficher le tableau des opérations de la caisse
        let tableHTML = `
            <div class="fade-in">
                <h3>📊 Détails de la ${nomCaisse}</h3>
                <button class="btn-secondary" onclick="app.afficherHistorique('global')" style="margin-bottom: 20px;">
                    ↩️ Retour à l'historique
                </button>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Opérateur</th>
                                <th>Description</th>
                                <th>Montant (DH)</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        operationsCaisse.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            tableHTML += `
                <tr>
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${op.description}</td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table></div></div>';
        container.innerHTML = tableHTML;
    }

    afficherHistorique(vue) {
        this.currentView = vue;
        this.caisseSelectionnee = null;
        
        let operationsFiltrees = [];
        
        switch(vue) {
            case 'global':
                operationsFiltrees = this.operations;
                break;
            case 'zaitoun':
                operationsFiltrees = this.operations.filter(op => op.groupe === 'zaitoun');
                break;
            case '3commain':
                operationsFiltrees = this.operations.filter(op => op.groupe === '3commain');
                break;
            case 'abdel':
                operationsFiltrees = this.operations.filter(op => op.operateur === 'abdel');
                break;
            case 'omar':
                operationsFiltrees = this.operations.filter(op => op.operateur === 'omar');
                break;
            case 'hicham':
                operationsFiltrees = this.operations.filter(op => op.operateur === 'hicham');
                break;
            case 'transferts':
                operationsFiltrees = this.operations.filter(op => op.transfert === true);
                break;
        }

        const container = document.getElementById('dataDisplay');
        if (!container) return;
        
        if (operationsFiltrees.length === 0) {
            container.innerHTML = '<div class="empty-message"><p>Aucune opération trouvée</p></div>';
            return;
        }

        let tableHTML = `
            <div class="fade-in">
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Opérateur</th>
                                <th>Groupe</th>
                                <th>Type</th>
                                <th>Caisse</th>
                                <th>Description</th>
                                <th>Montant (DH)</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        operationsFiltrees.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            tableHTML += `
                <tr>
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td>${this.formaterCaisse(op.caisse)}</td>
                    <td>${op.description}</td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div></div>';
        container.innerHTML = tableHTML;
    }

    async ajouterOperation(e) {
        e.preventDefault();

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
            } else {
                nouvelleOperation.id = 'local_' + Date.now();
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

    afficherMessageSucces(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 4000);
        }
    }

    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) saisieForm.reset();
    }

    mettreAJourAffichage() {
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    window.app = app;
    console.log('🎉 Application chargée et prête pour l\'authentification');
});
