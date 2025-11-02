// app.js - Application complète de gestion de ferme
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée');
    }

    // MÉTHODE UPDATE STATS
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
        // Réinitialiser les soldes
        this.caisses = {
            'abdel_caisse': 0, 'omar_caisse': 0, 'hicham_caisse': 0, 
            'zaitoun_caisse': 0, '3commain_caisse': 0
        };

        // Calculer les soldes actuels
        this.operations.forEach(op => {
            this.caisses[op.caisse] += op.montant;
        });
    }

    creerCarteCaisse(cleCaisse, nomCaisse) {
        const solde = this.caisses[cleCaisse];
        const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
        const estSelectionnee = this.caisseSelectionnee === cleCaisse ? 'caisse-selectionnee' : '';
        
        return `<div class="stat-card ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${cleCaisse}')" style="cursor: pointer;">
            <div class="stat-label">${nomCaisse}</div>
            <div class="stat-value">${solde.toFixed(2)}</div>
            <div class="stat-label">DH</div>
            <div class="stat-indication" style="margin-top: 8px; font-size: 11px; opacity: 0.8;">📊 Cliquer pour voir le détail</div>
        </div>`;
    }

    // MÉTHODE POUR AFFICHER LES DÉTAILS D'UNE CAISSE
    afficherDetailsCaisse(caisse) {
        this.caisseSelectionnee = caisse;
        this.updateStats();
        
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const nomCaisse = this.formaterCaisse(caisse);
        
        let totalRevenus = 0;
        let totalFrais = 0;
        let soldeCaisse = 0;
        
        operationsCaisse.forEach(op => {
            if (op.montant > 0) {
                totalRevenus += op.montant;
            } else {
                totalFrais += Math.abs(op.montant);
            }
            soldeCaisse += op.montant;
        });

        const container = document.getElementById('dataDisplay');
        
        const detailsHTML = `
            <div class="fade-in">
                <div class="vue-header" style="border-left-color: #3498db;">
                    <h3>📊 Détails de la ${nomCaisse}</h3>
                    <div class="totals-container">
                        <div class="total-item">
                            <span class="total-label">💰 Total Revenus:</span>
                            <span class="total-value positive">+${totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">💸 Total Frais:</span>
                            <span class="total-value negative">-${totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">⚖️ Solde Actuel:</span>
                            <span class="total-value ${soldeCaisse >= 0 ? 'positive' : 'negative'}">
                                ${soldeCaisse >= 0 ? '+' : ''}${soldeCaisse.toFixed(2)} DH
                            </span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">📊 Nombre d'opérations:</span>
                            <span class="total-value">${operationsCaisse.length}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
                    <h4 style="margin: 0; color: #2c3e50;">📋 Historique des opérations</h4>
                    <div>
                        <button class="btn-secondary" onclick="app.afficherHistorique('global')" style="margin-right: 10px;">
                            ↩️ Retour à la vue globale
                        </button>
                        <button class="btn-primary" onclick="app.exporterDetailsCaisse('${caisse}')">
                            💾 Exporter PDF
                        </button>
                    </div>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>Aucune opération pour cette caisse</p></div>' : 
                    this.creerTableauDetailsCaisse(operationsCaisse)
                }
            </div>
        `;
        
        container.innerHTML = detailsHTML;
        this.mettreAJourOngletsCaisse(caisse);
    }

    // CRÉER LE TABLEAU DES DÉTAILS DE CAISSE
    creerTableauDetailsCaisse(operations) {
        let tableHTML = `
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Opérateur</th>
                            <th>Groupe</th>
                            <th>Type Opération</th>
                            <th>Transaction</th>
                            <th>Description</th>
                            <th>Montant (DH)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        operations.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            tableHTML += `
                <tr>
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="${estNegatif ? 'type-frais' : 'type-revenu'}">${this.formaterTypeTransaction(op.typeTransaction)}</td>
                    <td>${op.description}</td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                    <td>
                        <div class="operation-actions">
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        return tableHTML;
    }

    // MÉTHODE SUPPRIMER OPÉRATION
    async supprimerOperation(operationId) {
        console.log('🔧 Supprimer opération appelée avec ID:', operationId);
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            const operationASupprimer = this.operations.find(op => op.id === operationId);
            
            if (!operationASupprimer) {
                alert('❌ Opération non trouvée');
                return;
            }
            
            // Supprimer localement
            this.operations = this.operations.filter(op => op.id !== operationId);
            this.sauvegarderDonnees();
            
            // Mettre à jour l'affichage
            if (this.caisseSelectionnee) {
                this.afficherDetailsCaisse(this.caisseSelectionnee);
            } else {
                this.afficherHistorique(this.currentView);
            }
            
            this.updateStats();
            this.afficherMessageSucces('Opération supprimée avec succès');
            
            // Synchroniser avec Firebase si disponible
            if (window.firebaseSync) {
                try {
                    await firebaseSync.deleteDocument('operations', operationId);
                    console.log('✅ Opération supprimée de Firebase');
                } catch (error) {
                    console.error('❌ Erreur suppression Firebase:', error);
                }
            }
        }
    }

    // MÉTHODE OUVRIRE MODAL MODIFICATION
    ouvrirModalModification(operationId) {
        console.log('🔧 Ouvrir modal modification avec ID:', operationId);
        
        const operation = this.operations.find(op => op.id === operationId);
        
        if (!operation) {
            alert('❌ Opération non trouvée');
            return;
        }

        // Remplir le formulaire de modification
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

    // MÉTHODE MODIFIER OPÉRATION
    async modifierOperation(e) {
        e.preventDefault();
        console.log('🔧 Modification opération démarrée');

        const operationId = parseInt(document.getElementById('editId').value);
        const operationIndex = this.operations.findIndex(op => op.id === operationId);

        if (operationIndex === -1) {
            alert('❌ Opération non trouvée');
            return;
        }

        const montantSaisi = parseFloat(document.getElementById('editMontant').value);
        const typeTransaction = document.getElementById('editTypeTransaction').value;

        // Validation
        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('❌ Le montant doit être supérieur à 0');
            return;
        }

        // Mettre à jour l'opération
        const operationModifiee = {
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

        this.operations[operationIndex] = operationModifiee;
        this.sauvegarderDonnees();
        this.fermerModal();

        // Mettre à jour l'affichage
        if (this.caisseSelectionnee) {
            this.afficherDetailsCaisse(this.caisseSelectionnee);
        } else {
            this.afficherHistorique(this.currentView);
        }
        
        this.updateStats();
        this.afficherMessageSucces('✅ Opération modifiée avec succès !');
        
        // Synchroniser avec Firebase si disponible
        if (window.firebaseSync) {
            try {
                await firebaseSync.updateDocument('operations', operationId, operationModifiee);
                console.log('✅ Opération modifiée dans Firebase');
            } catch (error) {
                console.error('❌ Erreur modification Firebase:', error);
            }
        }
    }

    // MÉTHODE SUPPRIMER OPÉRATIONS SÉLECTIONNÉES
    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('❌ Aucune opération sélectionnée');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            // Supprimer localement
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            this.sauvegarderDonnees();
            
            // Synchroniser avec Firebase si disponible
            if (window.firebaseSync) {
                for (const opId of this.selectedOperations) {
                    try {
                        await firebaseSync.deleteDocument('operations', opId);
                    } catch (error) {
                        console.error('❌ Erreur suppression Firebase:', error);
                    }
                }
            }
            
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.updateStats();
            
            // Mettre à jour l'affichage
            if (this.caisseSelectionnee) {
                this.afficherDetailsCaisse(this.caisseSelectionnee);
            } else {
                this.afficherHistorique(this.currentView);
            }
            
            this.afficherMessageSucces(`${this.selectedOperations.size} opération(s) supprimée(s) avec succès`);
        }
    }

    // MÉTHODE TOGGLE EDIT MODE
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
        
        // Mettre à jour l'affichage
        if (this.caisseSelectionnee) {
            this.afficherDetailsCaisse(this.caisseSelectionnee);
        } else {
            this.afficherHistorique(this.currentView);
        }
    }

    // MÉTHODE SELECTIONNER OPÉRATION
    selectionnerOperation(operationId, checked) {
        console.log('🔧 Sélection opération:', operationId, checked);
        
        if (checked) {
            this.selectedOperations.add(operationId);
        } else {
            this.selectedOperations.delete(operationId);
        }
        
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.textContent = `🗑️ Supprimer (${this.selectedOperations.size})`;
        }
    }

    // MÉTHODE AFFICHER HISTORIQUE
    afficherHistorique(vue = 'global') {
        this.caisseSelectionnee = null;
        this.updateStats();
        
        const container = document.getElementById('dataDisplay');
        if (!container) return;

        let operationsFiltrees = [];
        let totalRevenus = 0;
        let totalFrais = 0;
        let soldeTotal = 0;

        // Mettre à jour les onglets actifs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sheet === vue);
            if (btn.classList.contains('caisse-tab')) {
                btn.remove();
            }
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

        // Calculer les totaux
        operationsFiltrees.forEach(op => {
            if (op.montant > 0) {
                totalRevenus += op.montant;
            } else {
                totalFrais += Math.abs(op.montant);
            }
            soldeTotal += op.montant;
        });

        if (operationsFiltrees.length === 0) {
            container.innerHTML = '<div class="empty-message"><h3>📭 Aucune opération</h3><p>Aucune opération trouvée pour cette vue</p></div>';
            return;
        }

        let tableHTML = '<div class="fade-in">';
        
        // EN-TÊTE AVEC TOTAUX
        tableHTML += '<div class="vue-header">';
        tableHTML += '<h3>' + this.getTitreVue(vue) + '</h3>';
        tableHTML += '<div class="totals-container">';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">📊 Total Opérations:</span>';
        tableHTML += '<span class="total-value">' + operationsFiltrees.length + '</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">💰 Total Revenus:</span>';
        tableHTML += '<span class="total-value positive">+' + totalRevenus.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">💸 Total Frais:</span>';
        tableHTML += '<span class="total-value negative">-' + totalFrais.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">⚖️ Solde Total:</span>';
        tableHTML += '<span class="total-value ' + (soldeTotal >= 0 ? 'positive' : 'negative') + '">' + 
                     (soldeTotal >= 0 ? '+' : '') + soldeTotal.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '</div>';
        tableHTML += '</div>';
        
        // RÉSUMÉ DES CAISSES POUR LA VUE GLOBALE
        if (vue === 'global') {
            tableHTML += this.afficherResumeCaisses();
        }
        
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

    // MÉTHODE AJOUTER OPÉRATION (SAISIE)
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
            
            // Synchroniser avec Firebase si disponible
            if (window.firebaseSync) {
                try {
                    await firebaseSync.addDocument('operations', op);
                    console.log('✅ Opération ajoutée à Firebase');
                } catch (error) {
                    console.error('❌ Erreur ajout Firebase:', error);
                }
            }
        }

        this.sauvegarderDonnees();
        this.afficherMessageSucces('Opération enregistrée avec succès !');
        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // MÉTHODE EFFECTUER TRANSFERT
    async effectuerTransfert(e) {
        e.preventDefault();

        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        const montantTransfertValue = parseFloat(document.getElementById('montantTransfert').value);
        const descriptionValue = document.getElementById('descriptionTransfert').value.trim();

        // Validation
        if (caisseSource === caisseDestination) {
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
        const soldeSource = this.caisses[caisseSource];
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
                caisse: caisseSource,
                caisseDestination: caisseDestination,
                description: `Transfert vers ${this.formaterCaisse(caisseDestination)}: ${descriptionValue}`,
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
                caisse: caisseDestination,
                caisseDestination: caisseSource,
                description: `Transfert de ${this.formaterCaisse(caisseSource)}: ${descriptionValue}`,
                montant: montantTransfertValue,
                transfert: true,
                timestamp: new Date().toISOString()
            }
        ];

        // Ajouter aux opérations
        for (const op of operationsTransfert) {
            this.operations.unshift(op);
            
            // Synchroniser avec Firebase si disponible
            if (window.firebaseSync) {
                try {
                    await firebaseSync.addDocument('operations', op);
                    console.log('✅ Transfert ajouté à Firebase');
                } catch (error) {
                    console.error('❌ Erreur ajout Firebase:', error);
                }
            }
        }

        this.sauvegarderDonnees();
        this.afficherMessageSucces('Transfert effectué avec succès !');
        document.getElementById('transfertForm').reset();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // MÉTHODES AUXILIAIRES
    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        const repartitionInfo = document.getElementById('repartitionInfo');
        
        if (saisieForm) saisieForm.reset();
        if (repartitionInfo) repartitionInfo.style.display = 'none';
    }

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
        console.log('💾 Données sauvegardées');
    }

    fermerModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    afficherMessageSucces(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(messageDiv);
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 4000);
        }
    }

    // Méthodes de formatage
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

    mettreAJourOngletsCaisse(caisse) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const navTabs = document.querySelector('.nav-tabs');
        const existingCaisseTab = document.querySelector('.tab-btn.caisse-tab');
        if (existingCaisseTab) {
            existingCaisseTab.remove();
        }
        
        const nomCaisse = this.formaterCaisse(caisse);
        const caisseTab = document.createElement('button');
        caisseTab.className = 'tab-btn active caisse-tab';
        caisseTab.innerHTML = `🏦 ${nomCaisse}`;
        caisseTab.onclick = () => this.afficherDetailsCaisse(caisse);
        
        navTabs.appendChild(caisseTab);
    }

    afficherResumeCaisses() {
        let resumeHTML = '<div class="resume-caisses">';
        resumeHTML += '<h4>📋 Résumé par Caisse - Cliquez sur une caisse pour voir le détail</h4>';
        resumeHTML += '<div class="caisses-grid">';
        
        const totauxCaisses = {
            'abdel_caisse': 0,
            'omar_caisse': 0, 
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };
        
        this.operations.forEach(op => {
            totauxCaisses[op.caisse] += op.montant;
        });
        
        for (const [caisse, solde] of Object.entries(totauxCaisses)) {
            const nomCaisse = this.formaterCaisse(caisse);
            const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
            const estSelectionnee = this.caisseSelectionnee === caisse ? 'caisse-selectionnee' : '';
            
            resumeHTML += `<div class="resume-caisse ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${caisse}')" style="cursor: pointer;">
                <div class="resume-caisse-nom">${nomCaisse}</div>
                <div class="resume-caisse-solde">${solde.toFixed(2)} DH</div>
                <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">Cliquer pour détails</div>
            </div>`;
        }
        
        resumeHTML += '</div></div>';
        return resumeHTML;
    }

    setupEventListeners() {
        // Écouteurs pour les formulaires
        const saisieForm = document.getElementById('saisieForm');
        const transfertForm = document.getElementById('transfertForm');
        const editForm = document.getElementById('editForm');
        const btnReset = document.getElementById('btnReset');
        
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }
        
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.effectuerTransfert(e));
        }
        
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
        
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        // Écouteurs pour les changements de formulaire
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
            if (!btn.classList.contains('caisse-tab')) {
                btn.addEventListener('click', (e) => {
                    const view = e.target.dataset.sheet;
                    this.currentView = view;
                    this.afficherHistorique(view);
                });
            }
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
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.fermerModal());
        });
        
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target.id === 'editModal') this.fermerModal();
            });
        }
    }

    exporterDetailsCaisse(caisse) {
        alert('Fonction d\'export PDF pour ' + this.formaterCaisse(caisse));
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
