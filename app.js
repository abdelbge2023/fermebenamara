// app.js - Version corrigée avec toutes les méthodes
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats(); // ✅ MAINTENANT DÉFINIE
        this.afficherHistorique('global');
        this.afficherStatut();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    // AJOUTEZ CETTE MÉTHODE MANQUANTE
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

    // AJOUTEZ CETTE MÉTHODE AUSSI
    calculerSoldes() {
        // Réinitialiser les soldes
        this.caisses = {
            'abdel_caisse': 0,
            'omar_caisse': 0,
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };

        // Calculer les soldes actuels
        this.operations.forEach(op => {
            this.caisses[op.caisse] += op.montant;
        });
    }

    // AJOUTEZ CETTE MÉTHODE
    creerCarteCaisse(cleCaisse, nomCaisse) {
        const solde = this.caisses[cleCaisse];
        const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
        
        return '<div class="stat-card ' + classeCouleur + '">' +
            '<div class="stat-label">' + nomCaisse + '</div>' +
            '<div class="stat-value">' + solde.toFixed(2) + '</div>' +
            '<div class="stat-label">DH</div>' +
        '</div>';
    }

    // AJOUTEZ CETTE MÉTHODE
    afficherHistorique(vue = 'global') {
        const container = document.getElementById('dataDisplay');
        if (!container) return;

        let operationsFiltrees = [];

        // Mettre à jour les onglets actifs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sheet === vue);
        });

        switch(vue) {
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
            container.innerHTML = '<div class="empty-message"><h3>📭 Aucune opération</h3><p>Aucune opération trouvée pour cette vue</p></div>';
            return;
        }

        let tableHTML = '<div class="fade-in">';
        tableHTML += '<h3>' + this.getTitreVue(vue) + '</h3>';
        tableHTML += '<table class="data-table"><thead><tr>';
        
        if (this.editMode) tableHTML += '<th></th>';
        tableHTML += '<th>Date</th><th>Opérateur</th><th>Groupe</th><th>Type Op.</th><th>Transaction</th><th>Caisse</th><th>Description</th><th>Montant (DH)</th>';
        if (!this.editMode) tableHTML += '<th>Actions</th>';
        tableHTML += '</tr></thead><tbody>';

        operationsFiltrees.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            tableHTML += '<tr class="' + (this.selectedOperations.has(op.id) ? 'selected' : '') + '">';
            
            if (this.editMode) {
                tableHTML += '<td><input type="checkbox" class="operation-checkbox" ' + 
                    (this.selectedOperations.has(op.id) ? 'checked' : '') + 
                    ' onchange="app.selectionnerOperation(' + op.id + ', this.checked)"></td>';
            }
            
            tableHTML += '<td>' + this.formaterDate(op.date) + '</td>';
            tableHTML += '<td>' + this.formaterOperateur(op.operateur) + '</td>';
            tableHTML += '<td>' + this.formaterGroupe(op.groupe) + '</td>';
            tableHTML += '<td>' + this.formaterTypeOperation(op.typeOperation) + '</td>';
            tableHTML += '<td class="' + (estNegatif ? 'type-frais' : 'type-revenu') + '">' + this.formaterTypeTransaction(op.typeTransaction) + '</td>';
            tableHTML += '<td>' + this.formaterCaisse(op.caisse) + '</td>';
            tableHTML += '<td>' + op.description + '</td>';
            tableHTML += '<td style="font-weight: bold; color: ' + (estNegatif ? '#e74c3c' : '#27ae60') + ';">' + 
                        (estNegatif ? '-' : '') + montantAbsolu.toFixed(2) + '</td>';
            
            if (!this.editMode) {
                tableHTML += '<td><div class="operation-actions">';
                tableHTML += '<button class="btn-small btn-warning" onclick="app.ouvrirModalModification(' + op.id + ')">✏️</button>';
                tableHTML += '<button class="btn-small btn-danger" onclick="app.supprimerOperation(' + op.id + ')">🗑️</button>';
                tableHTML += '</div></td>';
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table></div>';
        container.innerHTML = tableHTML;
    }

    // AJOUTEZ CES MÉTHODES DE FORMATAGE
    formaterDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
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
            'zaitoun': 'Zaitoun',
            '3commain': '3 Commain',
            'autre': 'Autre',
            'transfert': 'Transfert'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        const types = {
            'revenu': '💰 Revenu',
            'frais': '💸 Frais'
        };
        return types[type] || type;
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': 'Caisse Abdel',
            'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham',
            'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    getTitreVue(vue) {
        const titres = {
            'global': '🌍 Toutes les opérations',
            'zaitoun': '🫒 Opérations Zaitoun',
            '3commain': '🔧 Opérations 3 Commain',
            'abdel': '👨‍💼 Opérations Abdel',
            'omar': '👨‍💻 Opérations Omar',
            'hicham': '👨‍🔧 Opérations Hicham',
            'transferts': '🔄 Transferts entre caisses'
        };
        return titres[vue] || 'Vue';
    }

    // AJOUTEZ LES AUTRES MÉTHODES MANQUANTES
    chargerDonnees() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log(`📁 ${this.operations.length} opérations chargées`);
            } catch (error) {
                console.error('Erreur chargement:', error);
                this.operations = [];
            }
        }
    }

    sauvegarderDonnees() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    afficherStatut() {
        const header = document.querySelector('header');
        if (!header) return;

        // Supprimer l'ancien statut s'il existe
        const ancienStatut = document.getElementById('statutApp');
        if (ancienStatut) ancienStatut.remove();

        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutApp';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '10px';
        statutDiv.style.borderRadius = '10px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';

        if (window.firebaseReady) {
            statutDiv.innerHTML = '✅ Synchronisé Cloud | <button onclick="migrerDonnees()" class="btn-warning" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">🔄 Migrer</button>';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
        } else {
            statutDiv.textContent = '🔧 Mode Local (Données Sécurisées)';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
        }

        header.appendChild(statutDiv);
    }

    // MÉTHODE AJOUTER OPÉRATION
    async ajouterOperation(e) {
        e.preventDefault();

        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montantSaisi = parseFloat(document.getElementById('montant').value);
        const descriptionValue = document.getElementById('description').value.trim();

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

        if (typeOperation === 'travailleur_global') {
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
                    description: descriptionValue + ' (Part Zaitoun - 1/3)',
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
                    description: descriptionValue + ' (Part 3 Commain - 2/3)',
                    montant: typeTransaction === 'frais' ? -montant3Commain : montant3Commain,
                    repartition: true,
                    timestamp: new Date().toISOString()
                }
            ];
        } else {
            operationsACreer = [{
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                operateur: operateur,
                groupe: groupe,
                typeOperation: typeOperation,
                typeTransaction: typeTransaction,
                caisse: caisse,
                description: descriptionValue,
                montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
                repartition: false,
                timestamp: new Date().toISOString()
            }];
        }

        // Ajouter aux opérations
        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        // Sauvegarder
        this.sauvegarderDonnees();

        // Firebase si disponible
        if (window.firebaseReady && window.firebaseDb) {
            try {
                for (const op of operationsACreer) {
                    await window.firebaseDb.collection("operations").add(op);
                }
            } catch (error) {
                console.log('⚠️ Sauvegarde Firebase échouée');
            }
        }

        this.afficherMessageSucces(
            typeOperation === 'travailleur_global' 
                ? 'Opération enregistrée ! Répartie : ' + (montantSaisi/3).toFixed(2) + ' DH (Zaitoun) + ' + ((montantSaisi*2)/3).toFixed(2) + ' DH (3 Commain)'
                : 'Opération enregistrée avec succès !'
        );
        
        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // AJOUTEZ CES MÉTHODES UTILITAIRES
    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        const repartitionInfo = document.getElementById('repartitionInfo');
        
        if (saisieForm) saisieForm.reset();
        if (repartitionInfo) repartitionInfo.style.display = 'none';
    }

    afficherMessageSucces(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        
        const saisieSection = document.querySelector('.saisie-section');
        if (saisieSection) {
            saisieSection.insertBefore(messageDiv, saisieSection.querySelector('h2').nextSibling);
        }
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 4000);
    }

    // AJOUTEZ LES MÉTHODES MANQUANTES POUR LES ACTIONS
    selectionnerOperation(operationId, checked) {
        if (checked) {
            this.selectedOperations.add(operationId);
        } else {
            this.selectedOperations.delete(operationId);
        }
        
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.textContent = 'Supprimer (' + this.selectedOperations.size + ')';
        }
    }

    supprimerOperation(operationId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            this.operations = this.operations.filter(op => op.id !== operationId);
            this.sauvegarderDonnees();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            this.afficherMessageSucces('Opération supprimée avec succès');
        }
    }

    ouvrirModalModification(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        // Remplir le formulaire modal
        document.getElementById('editId').value = operation.id;
        document.getElementById('editOperateur').value = operation.operateur;
        document.getElementById('editGroupe').value = operation.groupe;
        document.getElementById('editTypeOperation').value = operation.typeOperation;
        document.getElementById('editTypeTransaction').value = operation.typeTransaction;
        document.getElementById('editCaisse').value = operation.caisse;
        document.getElementById('editMontant').value = Math.abs(operation.montant);
        document.getElementById('editDescription').value = operation.description;

        // Afficher le modal
        document.getElementById('editModal').style.display = 'flex';
    }

    // SETUP EVENT LISTENERS
    setupEventListeners() {
        const saisieForm = document.getElementById('saisieForm');
        const transfertForm = document.getElementById('transfertForm');
        const btnReset = document.getElementById('btnReset');
        
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }
        
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.effectuerTransfert(e));
        }
        
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        const typeOperation = document.getElementById('typeOperation');
        const montant = document.getElementById('montant');
        
        if (typeOperation) {
            typeOperation.addEventListener('change', () => this.calculerRepartition());
        }
        
        if (montant) {
            montant.addEventListener('input', () => this.calculerRepartition());
        }
        
        // Navigation par onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.sheet;
                this.currentView = view;
                this.afficherHistorique(view);
            });
        });

        // Mode édition
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode());
        }
        
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => this.supprimerOperationsSelectionnees());
        }
        
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => this.toggleEditMode(false));
        }

        // Modal
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
    }

    // AJOUTEZ LA MÉTHODE calculerRepartition
    calculerRepartition() {
        const typeOperation = document.getElementById('typeOperation');
        const montant = document.getElementById('montant');
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');

        if (!typeOperation || !montant || !repartitionInfo || !repartitionDetails) return;

        const typeOpValue = typeOperation.value;
        const montantValue = parseFloat(montant.value) || 0;

        if (typeOpValue === 'travailleur_global' && montantValue > 0) {
            const montantZaitoun = (montantValue / 3).toFixed(2);
            const montant3Commain = ((montantValue * 2) / 3).toFixed(2);

            repartitionDetails.innerHTML = 
                '<div class="repartition-details">' +
                    '<div class="repartition-item zaitoun">' +
                        '<strong>Zaitoun</strong><br>' +
                        '<span style="color: #ff9800; font-weight: bold;">' + montantZaitoun + ' DH</span><br>' +
                        '<small>(1/3 du montant)</small>' +
                    '</div>' +
                    '<div class="repartition-item commain">' +
                        '<strong>3 Commain</strong><br>' +
                        '<span style="color: #2196f3; font-weight: bold;">' + montant3Commain + ' DH</span><br>' +
                        '<small>(2/3 du montant)</small>' +
                    '</div>' +
                '</div>';
            repartitionInfo.style.display = 'block';
        } else {
            repartitionInfo.style.display = 'none';
        }
    }

    toggleEditMode(enable = null) {
        this.editMode = enable !== null ? enable : !this.editMode;
        
        document.body.classList.toggle('edit-mode', this.editMode);
        
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        
        if (btnEditMode) btnEditMode.style.display = this.editMode ? 'none' : 'block';
        if (btnDeleteSelected) btnDeleteSelected.style.display = this.editMode ? 'block' : 'none';
        if (btnCancelEdit) btnCancelEdit.style.display = this.editMode ? 'block' : 'none';
        
        this.selectedOperations.clear();
        this.afficherHistorique(this.currentView);
    }

    // AJOUTEZ LES AUTRES MÉTHODES MANQUANTES (simplifiées)
    effectuerTransfert(e) {
        e.preventDefault();
        alert('Fonction transfert à implémenter');
        // Votre code existant pour les transferts
    }

    supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('Aucune opération sélectionnée');
            return;
        }

        if (confirm('Supprimer ' + this.selectedOperations.size + ' opération(s) ?')) {
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            this.sauvegarderDonnees();
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.updateStats();
            this.afficherHistorique(this.currentView);
        }
    }

    modifierOperation(e) {
        e.preventDefault();
        alert('Fonction modification à implémenter');
        // Votre code existant pour la modification
    }

    fermerModal() {
        document.getElementById('editModal').style.display = 'none';
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
