// app.js - VERSION COMPLÈTE ET CORRIGÉE
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
        this.setupEventListeners();
        await this.initialiserFirebase();
        this.updateStats();
        this.afficherHistorique('global');
    }

    async initialiserFirebase() {
        try {
            console.log('🔧 Mode localStorage activé');
            this.loadFromLocalStorage();
            this.initialisationFirebase = false;
        } catch (error) {
            console.error('Erreur:', error);
            this.loadFromLocalStorage();
        }
    }

    setupEventListeners() {
        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
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
    }

    async ajouterOperation(e) {
        e.preventDefault();
        console.log('✅ Formulaire soumis');

        const operateur = document.getElementById('operateur');
        const groupe = document.getElementById('groupe');
        const typeOperation = document.getElementById('typeOperation');
        const typeTransaction = document.getElementById('typeTransaction');
        const caisse = document.getElementById('caisse');
        const montant = document.getElementById('montant');
        const description = document.getElementById('description');

        if (!operateur || !groupe || !typeOperation || !typeTransaction || !caisse || !montant || !description) {
            alert('Erreur: Formulaire non trouvé');
            return;
        }

        const operateurValue = operateur.value;
        const groupeValue = groupe.value;
        const typeOperationValue = typeOperation.value;
        const typeTransactionValue = typeTransaction.value;
        const caisseValue = caisse.value;
        const montantSaisi = parseFloat(montant.value);
        const descriptionValue = description.value.trim();

        // Validation
        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!descriptionValue) {
            alert('Veuillez saisir une description');
            return;
        }

        let operationsACreer = [];

        if (typeOperationValue === 'travailleur_global') {
            // RÉPARTITION AUTOMATIQUE 1/3 - 2/3
            const montantZaitoun = montantSaisi / 3;
            const montant3Commain = (montantSaisi * 2) / 3;

            operationsACreer = [
                {
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateurValue,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    typeTransaction: typeTransactionValue,
                    caisse: caisseValue,
                    description: descriptionValue + ' (Part Zaitoun - 1/3)',
                    montant: typeTransactionValue === 'frais' ? -montantZaitoun : montantZaitoun,
                    repartition: true,
                    timestamp: new Date().toISOString()
                },
                {
                    id: Date.now() + 1,
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateurValue,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    typeTransaction: typeTransactionValue,
                    caisse: caisseValue,
                    description: descriptionValue + ' (Part 3 Commain - 2/3)',
                    montant: typeTransactionValue === 'frais' ? -montant3Commain : montant3Commain,
                    repartition: true,
                    timestamp: new Date().toISOString()
                }
            ];
        } else {
            // Opération normale sans répartition
            operationsACreer = [{
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                operateur: operateurValue,
                groupe: groupeValue,
                typeOperation: typeOperationValue,
                typeTransaction: typeTransactionValue,
                caisse: caisseValue,
                description: descriptionValue,
                montant: typeTransactionValue === 'frais' ? -montantSaisi : montantSaisi,
                repartition: false,
                timestamp: new Date().toISOString()
            }];
        }

        // Ajouter aux opérations
        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        // Sauvegarder
        await this.sauvegarderFirebase();

        this.afficherMessageSucces(
            typeOperationValue === 'travailleur_global' 
                ? 'Opération enregistrée ! Répartie : ' + (montantSaisi/3).toFixed(2) + ' DH (Zaitoun) + ' + ((montantSaisi*2)/3).toFixed(2) + ' DH (3 Commain)'
                : 'Opération enregistrée avec succès !'
        );
        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    async sauvegarderFirebase() {
        if (!this.initialisationFirebase) {
            this.sauvegarderLocal();
            return;
        }
        // Ici vous pourrez ajouter Firebase plus tard
        this.sauvegarderLocal();
    }

    async supprimerOperation(operationId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            this.operations = this.operations.filter(op => op.id !== operationId);
            await this.sauvegarderFirebase();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            this.afficherMessageSucces('Opération supprimée avec succès');
        }
    }

    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('Aucune opération sélectionnée');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir supprimer ' + this.selectedOperations.size + ' opération(s) ?')) {
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            await this.sauvegarderFirebase();
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.updateStats();
            this.afficherHistorique(this.currentView);
            this.afficherMessageSucces(this.selectedOperations.size + ' opération(s) supprimée(s) avec succès');
        }
    }

    async effectuerTransfert(e) {
        e.preventDefault();

        const caisseSource = document.getElementById('caisseSource');
        const caisseDestination = document.getElementById('caisseDestination');
        const montantTransfert = document.getElementById('montantTransfert');
        const descriptionTransfert = document.getElementById('descriptionTransfert');

        if (!caisseSource || !caisseDestination || !montantTransfert || !descriptionTransfert) {
            alert('Erreur: Formulaire de transfert non trouvé');
            return;
        }

        const caisseSourceValue = caisseSource.value;
        const caisseDestinationValue = caisseDestination.value;
        const montantTransfertValue = parseFloat(montantTransfert.value);
        const descriptionValue = descriptionTransfert.value.trim();

        // Validation
        if (caisseSourceValue === caisseDestinationValue) {
            alert('Vous ne pouvez pas transférer vers la même caisse');
            return;
        }

        if (montantTransfertValue <= 0 || isNaN(montantTransfertValue)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!descriptionValue) {
            alert('Veuillez saisir une description');
            return;
        }

        // Vérifier si la caisse source a suffisamment de fonds
        const soldeSource = this.caisses[caisseSourceValue];
        if (soldeSource < montantTransfertValue) {
            alert('Solde insuffisant dans la caisse source ! Solde disponible : ' + soldeSource.toFixed(2) + ' DH');
            return;
        }

        // Créer les opérations de transfert
        const operationsTransfert = [
            {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'transfert_sortie',
                operateur: 'system',
                groupe: 'system',
                typeOperation: 'transfert',
                typeTransaction: 'frais',
                caisse: caisseSourceValue,
                caisseDestination: caisseDestinationValue,
                description: 'Transfert vers ' + this.formaterCaisse(caisseDestinationValue) + ': ' + descriptionValue,
                montant: -montantTransfertValue,
                transfert: true,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                date: new Date().toISOString().split('T')[0],
                type: 'transfert_entree',
                operateur: 'system',
                groupe: 'system',
                typeOperation: 'transfert',
                typeTransaction: 'revenu',
                caisse: caisseDestinationValue,
                caisseDestination: caisseSourceValue,
                description: 'Transfert de ' + this.formaterCaisse(caisseSourceValue) + ': ' + descriptionValue,
                montant: montantTransfertValue,
                transfert: true,
                timestamp: new Date().toISOString()
            }
        ];

        // Ajouter aux opérations
        operationsTransfert.forEach(op => {
            this.operations.unshift(op);
        });

        // Sauvegarder
        await this.sauvegarderFirebase();

        this.afficherMessageSucces('Transfert effectué avec succès !');
        document.getElementById('transfertForm').reset();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    async modifierOperation(e) {
        e.preventDefault();

        const operationId = parseInt(document.getElementById('editId').value);
        const operationIndex = this.operations.findIndex(op => op.id === operationId);

        if (operationIndex === -1) {
            alert('Opération non trouvée');
            return;
        }

        const montantSaisi = parseFloat(document.getElementById('editMontant').value);
        const typeTransaction = document.getElementById('editTypeTransaction').value;

        // Validation
        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        this.operations[operationIndex] = {
            ...this.operations[operationIndex],
            operateur: document.getElementById('editOperateur').value,
            groupe: document.getElementById('editGroupe').value,
            typeOperation: document.getElementById('editTypeOperation').value,
            typeTransaction: typeTransaction,
            caisse: document.getElementById('editCaisse').value,
            montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
            description: document.getElementById('editDescription').value,
            timestamp: new Date().toISOString()
        };

        await this.sauvegarderFirebase();
        this.fermerModal();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        this.afficherMessageSucces('Opération modifiée avec succès !');
    }

    // Méthodes de sauvegarde locale
    sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('📁 ' + this.operations.length + ' opérations chargées du localStorage');
            } catch (error) {
                console.error('Erreur chargement localStorage:', error);
                this.operations = [];
            }
        }
    }

    calculerRepartition() {
        const typeOperation = document.getElementById('typeOperation');
        const montant = document.getElementById('montant');
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');

        if (!typeOperation || !montant || !repartitionInfo || !repartitionDetails) return;

        if (typeOperation.value === 'travailleur_global' && montant.value) {
            const montantSaisi = parseFloat(montant.value);
            if (montantSaisi > 0) {
                const montantZaitoun = montantSaisi / 3;
                const montant3Commain = (montantSaisi * 2) / 3;

                repartitionDetails.innerHTML = `
                    <div class="repartition-details">
                        <div class="repartition-item zaitoun">
                            <strong>🫒 Zaitoun (1/3)</strong><br>
                            ${montantZaitoun.toFixed(2)} DH
                        </div>
                        <div class="repartition-item commain">
                            <strong>🔧 3 Commain (2/3)</strong><br>
                            ${montant3Commain.toFixed(2)} DH
                        </div>
                    </div>
                `;
                repartitionInfo.style.display = 'block';
            }
        } else {
            repartitionInfo.style.display = 'none';
        }
    }

    toggleEditMode(enable = null) {
        this.editMode = enable !== null ? enable : !this.editMode;
        
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        const dataDisplay = document.getElementById('dataDisplay');

        if (this.editMode) {
            btnEditMode.textContent = '✅ Mode Normal';
            btnEditMode.classList.remove('btn-warning');
            btnEditMode.classList.add('btn-success');
            btnDeleteSelected.style.display = 'flex';
            btnCancelEdit.style.display = 'flex';
            if (dataDisplay) dataDisplay.classList.add('edit-mode');
        } else {
            btnEditMode.textContent = '✏️ Mode Édition';
            btnEditMode.classList.remove('btn-success');
            btnEditMode.classList.add('btn-warning');
            btnDeleteSelected.style.display = 'none';
            btnCancelEdit.style.display = 'none';
            if (dataDisplay) dataDisplay.classList.remove('edit-mode');
            this.selectedOperations.clear();
        }

        this.afficherHistorique(this.currentView);
    }

    selectionnerOperation(operationId, checked) {
        if (checked) {
            this.selectedOperations.add(operationId);
        } else {
            this.selectedOperations.delete(operationId);
        }
    }

    calculerSoldes() {
        // Réinitialiser les caisses
        Object.keys(this.caisses).forEach(key => {
            this.caisses[key] = 0;
        });

        // Calculer les soldes
        this.operations.forEach(op => {
            if (op.caisse && this.caisses.hasOwnProperty(op.caisse)) {
                this.caisses[op.caisse] += op.montant;
            }
        });
    }

    updateStats() {
        this.calculerSoldes();
        const statsContainer = document.getElementById('statsContainer');
        
        if (!statsContainer) return;

        statsContainer.innerHTML = '';

        const caisses = [
            { key: 'abdel_caisse', nom: '👨‍💼 Abdel', emoji: '👨‍💼' },
            { key: 'omar_caisse', nom: '👨‍💻 Omar', emoji: '👨‍💻' },
            { key: 'hicham_caisse', nom: '👨‍🔧 Hicham', emoji: '👨‍🔧' },
            { key: 'zaitoun_caisse', nom: '🫒 Zaitoun', emoji: '🫒' },
            { key: '3commain_caisse', nom: '🔧 3 Commain', emoji: '🔧' }
        ];

        caisses.forEach(caisse => {
            const solde = this.caisses[caisse.key];
            const carte = document.createElement('div');
            carte.className = 'stat-card ' + (solde >= 0 ? 'solde-positif' : 'solde-negatif');
            
            carte.innerHTML = `
                <div class="stat-label">${caisse.nom}</div>
                <div class="stat-value">${solde.toFixed(2)} DH</div>
                <div class="stat-emoji">${caisse.emoji}</div>
            `;
            
            statsContainer.appendChild(carte);
        });
    }

    afficherHistorique(vue = 'global') {
        this.currentView = vue;
        const dataDisplay = document.getElementById('dataDisplay');
        
        if (!dataDisplay) return;

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

        if (operationsFiltrees.length === 0) {
            dataDisplay.innerHTML = '<div class="empty-message">Aucune opération trouvée</div>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${this.editMode ? '<th><input type="checkbox" id="selectAll"></th>' : ''}
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

        operationsFiltrees.forEach(op => {
            const estSelectionnee = this.selectedOperations.has(op.id);
            html += `
                <tr class="${estSelectionnee ? 'selected' : ''}">
                    ${this.editMode ? `
                        <td>
                            <input type="checkbox" class="operation-checkbox" 
                                   ${estSelectionnee ? 'checked' : ''}
                                   onchange="app.selectionnerOperation(${op.id}, this.checked)">
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
                                <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})">
                                    ✏️
                                </button>
                                <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})">
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

    ouvrirModalModification(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        document.getElementById('editId').value = operation.id;
        document.getElementById('editOperateur').value = operation.operateur;
        document.getElementById('editGroupe').value = operation.groupe;
        document.getElementById('editTypeOperation').value = operation.typeOperation;
        document.getElementById('editTypeTransaction').value = operation.typeTransaction;
        document.getElementById('editCaisse').value = operation.caisse;
        document.getElementById('editMontant').value = Math.abs(operation.montant);
        document.getElementById('editDescription').value = operation.description;

        document.getElementById('editModal').style.display = 'flex';
    }

    fermerModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    getTitreVue(vue) {
        const titres = {
            'global': '🌍 Toutes les opérations',
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar',
            'hicham': '👨‍🔧 Hicham',
            'transferts': '🔄 Transferts'
        };
        return titres[vue] || 'Historique';
    }

    formaterDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar',
            'hicham': '👨‍🔧 Hicham'
        };
        return operateurs[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain'
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

    resetForm() {
        document.getElementById('saisieForm').reset();
        document.getElementById('repartitionInfo').style.display = 'none';
    }

    afficherMessageSucces(message) {
        // Créer ou mettre à jour un élément de message
        let messageDiv = document.getElementById('successMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'successMessage';
            document.querySelector('.container').prepend(messageDiv);
        }
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        
        // Disparaître après 5 secondes
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    console.log('🚀 Application Gestion Ferme initialisée !');
});
