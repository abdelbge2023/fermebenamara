// app.js - VERSION AVEC DEBUG
class GestionFerme {
    constructor() {
        this.operations = [];
        this.caisses = {
            'abdel_caisse': 0,
            'omar_caisse': 0,
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };
        this.editMode = false;
        this.selectedOperations = new Set();
        this.currentView = 'global';
        this.initialisationFirebase = false;

        this.init();
    }

    async init() {
        console.log('🚀 INITIALISATION DE L\'APPLICATION');
        this.setupEventListeners();
        await this.initialiserFirebase();
        this.updateStats();
        this.afficherHistorique('global');
        
        // DEBUG: Afficher le nombre d'opérations chargées
        console.log('📊 Opérations chargées:', this.operations.length);
    }

    async initialiserFirebase() {
        try {
            console.log('🔧 Chargement depuis localStorage');
            this.loadFromLocalStorage();
            this.initialisationFirebase = false;
        } catch (error) {
            console.error('Erreur:', error);
            this.loadFromLocalStorage();
        }
    }

    setupEventListeners() {
        console.log('🔧 Configuration des événements...');
        
        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
            console.log('✅ Formulaire principal configuré');
        } else {
            console.error('❌ Formulaire principal NON TROUVÉ');
        }

        // Formulaire de transfert
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

        // Formulaire de modification
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }

        // Calcul de répartition
        const typeOperation = document.getElementById('typeOperation');
        if (typeOperation) {
            typeOperation.addEventListener('change', () => this.calculerRepartition());
        }

        const montant = document.getElementById('montant');
        if (montant) {
            montant.addEventListener('input', () => this.calculerRepartition());
        }

        console.log('✅ Tous les événements configurés');
    }

    async ajouterOperation(e) {
        e.preventDefault();
        console.log('✅ DÉBUT - Ajout d\'opération');

        // Récupérer les valeurs du formulaire
        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montantSaisi = parseFloat(document.getElementById('montant').value);
        const description = document.getElementById('description').value;

        console.log('📝 Données du formulaire:', {
            operateur, groupe, typeOperation, typeTransaction, caisse, montantSaisi, description
        });

        // Validation simple
        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!description) {
            alert('Veuillez saisir une description');
            return;
        }

        let operationsACreer = [];

        if (typeOperation === 'travailleur_global') {
            console.log('🔀 Création d\'opération avec répartition');
            // RÉPARTITION AUTOMATIQUE 1/3 - 2/3
            const montantZaitoun = montantSaisi / 3;
            const montant3Commain = (montantSaisi * 2) / 3;

            operationsACreer = [
                {
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: description + ' (Part Zaitoun - 1/3)',
                    montant: typeTransaction === 'frais' ? -montantZaitoun : montantZaitoun,
                    repartition: true,
                    timestamp: new Date().toISOString()
                },
                {
                    id: Date.now() + 1,
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: description + ' (Part 3 Commain - 2/3)',
                    montant: typeTransaction === 'frais' ? -montant3Commain : montant3Commain,
                    repartition: true,
                    timestamp: new Date().toISOString()
                }
            ];
        } else {
            console.log('📝 Création d\'opération simple');
            // Opération normale sans répartition
            operationsACreer = [{
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                operateur: operateur,
                groupe: groupe,
                typeOperation: typeOperation,
                typeTransaction: typeTransaction,
                caisse: caisse,
                description: description,
                montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
                repartition: false,
                timestamp: new Date().toISOString()
            }];
        }

        console.log('➕ Opérations à créer:', operationsACreer);

        // Ajouter aux opérations
        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        console.log('📊 Opérations après ajout:', this.operations);

        // Sauvegarder
        this.sauvegarderLocal();

        // Message de succès
        const message = typeOperation === 'travailleur_global' 
            ? 'Opération enregistrée ! Répartie : ' + (montantSaisi/3).toFixed(2) + ' DH (Zaitoun) + ' + ((montantSaisi*2)/3).toFixed(2) + ' DH (3 Commain)'
            : 'Opération enregistrée avec succès !';

        this.afficherMessageSucces(message);
        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        console.log('✅ FIN - Opération ajoutée avec succès');
        console.log('📊 Total opérations:', this.operations.length);
    }

    // ... [LE RESTE DU CODE RESTE IDENTIQUE AU PRÉCÉDENT]
    // Gardez toutes les autres méthodes (effectuerTransfert, calculerRepartition, etc.)

    afficherHistorique(vue = 'global') {
        console.log('📋 Affichage historique - Vue:', vue);
        console.log('📊 Opérations à afficher:', this.operations.length);
        
        this.currentView = vue;
        const dataDisplay = document.getElementById('dataDisplay');
        
        if (!dataDisplay) {
            console.error('❌ dataDisplay NON TROUVÉ');
            return;
        }

        let operationsFiltrees = [];

        switch (vue) {
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
                operationsFiltrees = this.operations.filter(op => op.transfert);
                break;
            default:
                operationsFiltrees = this.operations;
        }

        console.log('🔍 Opérations filtrées:', operationsFiltrees.length);

        if (operationsFiltrees.length === 0) {
            dataDisplay.innerHTML = '<div class="empty-message">Aucune opération trouvée</div>';
            console.log('ℹ️ Aucune opération à afficher');
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${this.editMode ? '<th><input type="checkbox" id="selectAll" title="Tout sélectionner"></th>' : ''}
                        <th>Date</th>
                        <th>Opérateur</th>
                        <th>Groupe</th>
                        <th>Type</th>
                        <th>Transaction</th>
                        <th>Caisse</th>
                        <th>Montant</th>
                        <th>Description</th>
                        ${this.editMode ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        operationsFiltrees.forEach((op, index) => {
            const estSelectionnee = this.selectedOperations.has(op.id);
            console.log(`📝 Opération ${index}:`, op);
            
            html += `
                <tr class="${estSelectionnee ? 'selected' : ''}">
                    ${this.editMode ? `
                        <td>
                            <input type="checkbox" class="operation-checkbox" 
                                   ${estSelectionnee ? 'checked' : ''}
                                   onchange="app.selectionnerOperation(${op.id}, this.checked)"
                                   title="Sélectionner">
                        </td>
                    ` : ''}
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="type-${op.typeTransaction}">${this.formaterTypeTransaction(op.typeTransaction)}</td>
                    <td>${this.formaterCaisse(op.caisse)}</td>
                    <td class="${op.montant >= 0 ? 'type-revenu' : 'type-frais'}">
                        ${op.montant.toFixed(2)} DH
                    </td>
                    <td>${op.description}</td>
                    ${this.editMode ? `
                        <td>
                            <div class="operation-actions">
                                <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})" title="Modifier">
                                    ✏️ Édition
                                </button>
                                <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})" title="Supprimer">
                                    🗑️
                                </button>
                            </div>
                        </td>
                    ` : ''}
                </tr>
            `;
        });

        html += '</tbody></table>';
        dataDisplay.innerHTML = html;

        console.log('✅ Historique affiché avec succès');

        // Gestion de la sélection globale
        if (this.editMode) {
            const selectAll = document.getElementById('selectAll');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('.operation-checkbox');
                    checkboxes.forEach(cb => {
                        cb.checked = e.target.checked;
                        const opId = parseInt(cb.getAttribute('onchange').match(/\d+/)[0]);
                        this.selectionnerOperation(opId, e.target.checked);
                    });
                });
            }
        }
    }

    // ... [GARDEZ TOUTES LES AUTRES MÉTHODES IDENTIQUES]

    sauvegarderLocal() {
        console.log('💾 Sauvegarde des données...');
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
        console.log('✅ Données sauvegardées:', this.operations.length, 'opérations');
    }

    loadFromLocalStorage() {
        console.log('📂 Chargement depuis localStorage...');
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('✅ Données chargées:', this.operations.length, 'opérations');
            } catch (error) {
                console.error('❌ Erreur chargement localStorage:', error);
                this.operations = [];
            }
        } else {
            console.log('ℹ️ Aucune donnée sauvegardée trouvée');
            this.operations = [];
        }
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    console.log('🚀 Application Gestion Ferme initialisée !');
});
