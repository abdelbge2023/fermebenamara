// app.js - VERSION CORRIGÉE SANS REDÉCLARATION
class GestionFerme {
    constructor() {
        this.operations = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application initialisée');
    }

    setupEventListeners() {
        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }

        // Formulaire transfert
        const transfertForm = document.getElementById('transfertForm');
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.effectuerTransfert(e));
        }

        // Bouton reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        // Onglets
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vue = e.target.getAttribute('data-sheet');
                this.afficherHistorique(vue);
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Mode édition
        const btnEditMode = document.getElementById('btnEditMode');
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode());
        }
        
        // Suppression multiple
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => this.supprimerOperationsSelectionnees());
        }
        
        // Annuler édition
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => this.toggleEditMode(false));
        }

        // Modal
        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.fermerModal());
        });

        // Formulaire édition
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
    }

    ajouterOperation(e) {
        e.preventDefault();
        console.log('✅ Formulaire soumis');

        // Récupérer les valeurs du formulaire
        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montant = parseFloat(document.getElementById('montant').value);
        const description = document.getElementById('description').value;

        // Validation simple
        if (montant <= 0 || isNaN(montant)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!description) {
            alert('Veuillez saisir une description');
            return;
        }

        // Créer l'opération
        const nouvelleOperation = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            operateur: operateur,
            groupe: groupe,
            typeOperation: typeOperation,
            typeTransaction: typeTransaction,
            caisse: caisse,
            description: description,
            montant: typeTransaction === 'frais' ? -montant : montant,
            timestamp: new Date().toISOString()
        };

        // Ajouter aux opérations
        this.operations.unshift(nouvelleOperation);

        // Sauvegarder
        this.sauvegarderLocal();

        // Mettre à jour l'interface
        this.afficherMessageSucces('Opération enregistrée avec succès !');
        this.resetForm();
        this.updateStats();
        this.afficherHistorique('global');
    }

    effectuerTransfert(e) {
        e.preventDefault();
        console.log('✅ Transfert en cours');

        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        const montant = parseFloat(document.getElementById('montantTransfert').value);
        const description = document.getElementById('descriptionTransfert').value;

        // Validation
        if (caisseSource === caisseDestination) {
            alert('Les caisses source et destination doivent être différentes');
            return;
        }

        if (montant <= 0 || isNaN(montant)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        // Créer les opérations de transfert
        const transfertSource = {
            id: Date.now() + 1,
            date: new Date().toISOString().split('T')[0],
            operateur: 'system',
            groupe: 'transfert',
            typeOperation: 'transfert',
            typeTransaction: 'frais',
            caisse: caisseSource,
            description: `Transfert vers ${this.formaterCaisse(caisseDestination)} - ${description}`,
            montant: -montant,
            timestamp: new Date().toISOString(),
            isTransfert: true
        };

        const transfertDestination = {
            id: Date.now() + 2,
            date: new Date().toISOString().split('T')[0],
            operateur: 'system',
            groupe: 'transfert',
            typeOperation: 'transfert',
            typeTransaction: 'revenu',
            caisse: caisseDestination,
            description: `Transfert depuis ${this.formaterCaisse(caisseSource)} - ${description}`,
            montant: montant,
            timestamp: new Date().toISOString(),
            isTransfert: true
        };

        // Ajouter les opérations
        this.operations.unshift(transfertDestination);
        this.operations.unshift(transfertSource);

        // Sauvegarder
        this.sauvegarderLocal();

        // Mettre à jour l'interface
        this.afficherMessageSucces('Transfert effectué avec succès !');
        document.getElementById('transfertForm').reset();
        this.updateStats();
        this.afficherHistorique('global');
    }

    resetForm() {
        document.getElementById('saisieForm').reset();
        document.getElementById('repartitionInfo').style.display = 'none';
    }

    afficherMessageSucces(message) {
        // Version améliorée avec notification temporaire
        const notification = document.createElement('div');
        notification.className = 'success-message fade-in';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 15px 20px;
            border-radius: 8px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('📁 ' + this.operations.length + ' opérations chargées');
            } catch (error) {
                console.error('Erreur chargement:', error);
                this.operations = [];
            }
        }
    }

    sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    updateStats() {
        console.log('📊 Mise à jour des statistiques');
        
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        // Calcul des soldes par caisse
        const soldes = {};
        this.operations.forEach(op => {
            if (!soldes[op.caisse]) {
                soldes[op.caisse] = 0;
            }
            soldes[op.caisse] += op.montant;
        });

        let html = '';
        
        // Cartes pour chaque caisse
        for (const [caisse, solde] of Object.entries(soldes)) {
            const soldeFormate = solde.toFixed(2);
            const isPositif = solde >= 0;
            
            html += `
                <div class="stat-card ${isPositif ? 'solde-positif' : 'solde-negatif'}">
                    <div class="stat-label">${this.formaterCaisse(caisse)}</div>
                    <div class="stat-value">${soldeFormate} DH</div>
                    <div class="stat-trend">${isPositif ? '📈' : '📉'}</div>
                </div>
            `;
        }

        // Carte pour le solde total
        const soldeTotal = Object.values(soldes).reduce((total, solde) => total + solde, 0);
        const totalFormate = soldeTotal.toFixed(2);
        const totalPositif = soldeTotal >= 0;
        
        html += `
            <div class="stat-card ${totalPositif ? 'solde-positif' : 'solde-negatif'}" style="grid-column: 1 / -1;">
                <div class="stat-label">💰 SOLDE TOTAL</div>
                <div class="stat-value">${totalFormate} DH</div>
                <div class="stat-trend">${totalPositif ? '🎉' : '⚠️'}</div>
            </div>
        `;

        statsContainer.innerHTML = html;
    }

    afficherHistorique(vue) {
        const dataDisplay = document.getElementById('dataDisplay');
        if (!dataDisplay) return;

        let operationsFiltrees = this.operations;

        if (vue === 'transferts') {
            operationsFiltrees = this.operations.filter(op => op.isTransfert);
        } else if (vue !== 'global') {
            operationsFiltrees = this.operations.filter(op => 
                op.groupe === vue || op.operateur === vue
            );
        }

        if (operationsFiltrees.length === 0) {
            dataDisplay.innerHTML = '<div class="empty-message">Aucune opération trouvée</div>';
            return;
        }

        let html = '<table class="data-table"><thead><tr>';
        html += '<th>Date</th><th>Opérateur</th><th>Groupe</th><th>Type</th>';
        html += '<th>Transaction</th><th>Caisse</th><th>Montant</th><th>Description</th>';
        html += '</tr></thead><tbody>';

        operationsFiltrees.forEach(op => {
            html += '<tr>';
            html += '<td>' + this.formaterDate(op.date) + '</td>';
            html += '<td>' + this.formaterOperateur(op.operateur) + '</td>';
            html += '<td>' + this.formaterGroupe(op.groupe) + '</td>';
            html += '<td>' + this.formaterTypeOperation(op.typeOperation) + '</td>';
            html += '<td class="type-' + op.typeTransaction + '">' + this.formaterTypeTransaction(op.typeTransaction) + '</td>';
            html += '<td>' + this.formaterCaisse(op.caisse) + '</td>';
            html += '<td class="' + (op.montant >= 0 ? 'type-revenu' : 'type-frais') + '">';
            html += op.montant.toFixed(2) + ' DH</td>';
            html += '<td>' + op.description + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        dataDisplay.innerHTML = html;
    }

    // Méthodes pour le mode édition (à implémenter)
    toggleEditMode(activer = true) {
        console.log('Mode édition:', activer ? 'activé' : 'désactivé');
        // Implémentation à venir
    }

    supprimerOperationsSelectionnees() {
        console.log('Suppression multiple');
        // Implémentation à venir
    }

    fermerModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    modifierOperation(e) {
        e.preventDefault();
        console.log('Modification opération');
        // Implémentation à venir
    }

    // Méthodes de formatage
    formaterDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar', 
            'hicham': '👨‍🔧 Hicham',
            'system': '🤖 Système'
        };
        return operateurs[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'transfert': '🔄 Transfert'
        };
        return groupes[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': '🌍 Travailleur global',
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'autre': '📝 Autre',
            'transfert': '🔄 Transfert'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        return type === 'revenu' ? '💰 Revenu' : '💸 Frais';
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': '👨‍💼 Caisse Abdel',
            'omar_caisse': '👨‍💻 Caisse Omar',
            'hicham_caisse': '👨‍🔧 Caisse Hicham',
            'zaitoun_caisse': '🫒 Caisse Zaitoun', 
            '3commain_caisse': '🔧 Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }
}

// Initialisation avec protection contre la redéclaration
let app;
if (!window.appInitialized) {
    document.addEventListener('DOMContentLoaded', function() {
        if (!app) {
            app = new GestionFerme();
            window.appInitialized = true;
            console.log('🚀 Application Gestion Ferme démarrée !');
        }
    });
}
