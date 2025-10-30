// app.js - VERSION FINALE COMPLÈTEMENT DÉBOGUÉE
class GestionFerme {
    constructor() {
        this.operations = [];
        this.modeEdition = false;
        this.operationsSelectionnees = new Set();
        this.init();
    }

    init() {
        console.log('🚀 Initialisation de l\'application...');
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application initialisée avec succès !');
    }

    setupEventListeners() {
        console.log('🔧 Configuration des événements...');

        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
            console.log('✅ Formulaire principal configuré');
        }

        // Formulaire transfert
        const transfertForm = document.getElementById('transfertForm');
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.effectuerTransfert(e));
            console.log('✅ Formulaire transfert configuré');
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

        // Écouteurs pour la répartition automatique
        const typeOperationSelect = document.getElementById('typeOperation');
        const montantInput = document.getElementById('montant');
        if (typeOperationSelect && montantInput) {
            typeOperationSelect.addEventListener('change', () => this.calculerRepartition());
            montantInput.addEventListener('input', () => this.calculerRepartition());
        }

        console.log('✅ Tous les événements configurés');
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
        const montantInput = document.getElementById('montant').value;
        const description = document.getElementById('description').value;

        // Validation
        if (!operateur || !groupe || !typeOperation || !typeTransaction || !caisse) {
            this.afficherMessageErreur('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const montant = parseFloat(montantInput);
        if (montant <= 0 || isNaN(montant)) {
            this.afficherMessageErreur('Le montant doit être supérieur à 0');
            return;
        }

        if (!description.trim()) {
            this.afficherMessageErreur('Veuillez saisir une description');
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
            description: description.trim(),
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
        const montantInput = document.getElementById('montantTransfert').value;
        const description = document.getElementById('descriptionTransfert').value;

        // Validation
        if (!caisseSource || !caisseDestination) {
            this.afficherMessageErreur('Veuillez sélectionner les caisses source et destination');
            return;
        }

        if (caisseSource === caisseDestination) {
            this.afficherMessageErreur('Les caisses source et destination doivent être différentes');
            return;
        }

        const montant = parseFloat(montantInput);
        if (montant <= 0 || isNaN(montant)) {
            this.afficherMessageErreur('Le montant doit être supérieur à 0');
            return;
        }

        if (!description.trim()) {
            this.afficherMessageErreur('Veuillez saisir une description pour le transfert');
            return;
        }

        // Vérifier que la caisse source a suffisamment de fonds
        const soldeSource = this.calculerSoldeCaisse(caisseSource);
        if (soldeSource < montant) {
            this.afficherMessageErreur(`Solde insuffisant dans ${this.formaterCaisse(caisseSource)} (${soldeSource.toFixed(2)} DH)`);
            return;
        }

        // Créer les opérations de transfert
        const timestamp = Date.now();
        const transfertSource = {
            id: timestamp + 1,
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
            id: timestamp + 2,
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

    calculerSoldeCaisse(caisse) {
        return this.operations
            .filter(op => op.caisse === caisse)
            .reduce((total, op) => total + op.montant, 0);
    }

    calculerRepartition() {
        try {
            const typeOperation = document.getElementById('typeOperation').value;
            const montantInput = document.getElementById('montant').value;
            const repartitionInfo = document.getElementById('repartitionInfo');
            const repartitionDetails = document.getElementById('repartitionDetails');

            if (!repartitionInfo || !repartitionDetails) return;

            const montant = parseFloat(montantInput);
            
            if (typeOperation === 'travailleur_global' && montant > 0) {
                const unTiers = (montant / 3).toFixed(2);
                const deuxTiers = ((montant * 2) / 3).toFixed(2);

                repartitionDetails.innerHTML = `
                    <div class="repartition-details">
                        <div class="repartition-item zaitoun">
                            <strong>🫒 Zaitoun</strong><br>
                            ${deuxTiers} DH (2/3)
                        </div>
                        <div class="repartition-item commain">
                            <strong>🔧 3 Commain</strong><br>
                            ${unTiers} DH (1/3)
                        </div>
                    </div>
                `;
                repartitionInfo.style.display = 'block';
            } else {
                repartitionInfo.style.display = 'none';
            }
        } catch (error) {
            console.error('Erreur dans calculerRepartition:', error);
        }
    }

    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.reset();
        }
        const repartitionInfo = document.getElementById('repartitionInfo');
        if (repartitionInfo) {
            repartitionInfo.style.display = 'none';
        }
    }

    afficherMessageSucces(message) {
        this.afficherNotification(message, 'success');
    }

    afficherMessageErreur(message) {
        this.afficherNotification(message, 'error');
    }

    afficherNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const isSuccess = type === 'success';
        
        notification.className = 'fade-in';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${isSuccess ? '#d4edda' : '#f8d7da'};
            color: ${isSuccess ? '#155724' : '#721c24'};
            border: 1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 500;
            max-width: 400px;
        `;
        
        // Retirer les notifications existantes
        const existingNotifications = document.querySelectorAll('[style*="position: fixed"][style*="top: 20px"]');
        existingNotifications.forEach(notif => notif.remove());
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gestion_ferme_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('📁 ' + this.operations.length + ' opérations chargées');
            } else {
                console.log('📁 Aucune donnée sauvegardée trouvée');
            }
        } catch (error) {
            console.error('Erreur chargement localStorage:', error);
            this.operations = [];
        }
    }

    sauvegarderLocal() {
        try {
            const data = {
                operations: this.operations,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
            console.log('💾 Données sauvegardées (' + this.operations.length + ' opérations)');
        } catch (error) {
            console.error('Erreur sauvegarde localStorage:', error);
            this.afficherMessageErreur('Erreur de sauvegarde des données');
        }
    }

    updateStats() {
        console.log('📊 Mise à jour des statistiques');
        
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        try {
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
            const caisses = ['abdel_caisse', 'omar_caisse', 'hicham_caisse', 'zaitoun_caisse', '3commain_caisse'];
            caisses.forEach(caisse => {
                const solde = soldes[caisse] || 0;
                const soldeFormate = solde.toFixed(2);
                const isPositif = solde >= 0;
                
                html += `
                    <div class="stat-card ${isPositif ? 'solde-positif' : 'solde-negatif'}">
                        <div class="stat-label">${this.formaterCaisse(caisse)}</div>
                        <div class="stat-value">${soldeFormate} DH</div>
                        <div class="stat-trend">${isPositif ? '📈' : '📉'}</div>
                    </div>
                `;
            });

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
        } catch (error) {
            console.error('Erreur updateStats:', error);
            statsContainer.innerHTML = '<div class="empty-message">Erreur de calcul des statistiques</div>';
        }
    }

    afficherHistorique(vue) {
        const dataDisplay = document.getElementById('dataDisplay');
        if (!dataDisplay) return;

        try {
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
            
            if (this.modeEdition) {
                html += '<th><input type="checkbox" id="selectAll"></th>';
            }
            
            html += '<th>Date</th><th>Opérateur</th><th>Groupe</th><th>Type</th>';
            html += '<th>Transaction</th><th>Caisse</th><th>Montant</th><th>Description</th>';
            
            if (this.modeEdition) {
                html += '<th>Actions</th>';
            }
            
            html += '</tr></thead><tbody>';

            operationsFiltrees.forEach(op => {
                if (!op || typeof op !== 'object') return;

                html += '<tr>';
                
                if (this.modeEdition) {
                    const isChecked = this.operationsSelectionnees.has(op.id) ? 'checked' : '';
                    html += `<td><input type="checkbox" class="operation-checkbox" data-id="${op.id}" ${isChecked}></td>`;
                }
                
                html += '<td>' + (op.date ? this.formaterDate(op.date) : 'N/A') + '</td>';
                html += '<td>' + this.formaterOperateur(op.operateur || 'inconnu') + '</td>';
                html += '<td>' + this.formaterGroupe(op.groupe || 'inconnu') + '</td>';
                html += '<td>' + this.formaterTypeOperation(op.typeOperation || 'inconnu') + '</td>';
                html += '<td class="type-' + (op.typeTransaction || 'inconnu') + '">' + this.formaterTypeTransaction(op.typeTransaction) + '</td>';
                html += '<td>' + this.formaterCaisse(op.caisse || 'inconnu') + '</td>';
                html += '<td class="' + ((op.montant || 0) >= 0 ? 'type-revenu' : 'type-frais') + '">';
                html += (op.montant || 0).toFixed(2) + ' DH</td>';
                html += '<td>' + (op.description || '') + '</td>';
                
                if (this.modeEdition) {
                    html += `<td class="operation-actions">
                        <button class="btn-small btn-info" data-id="${op.id}" onclick="window.gestionFermeApp.editerOperation(${op.id})">✏️</button>
                        <button class="btn-small btn-danger" data-id="${op.id}" onclick="window.gestionFermeApp.supprimerOperation(${op.id})">🗑️</button>
                    </td>`;
                }
                
                html += '</tr>';
            });

            html += '</tbody></table>';
            dataDisplay.innerHTML = html;

            // Ajouter les écouteurs pour les cases à cocher en mode édition
            if (this.modeEdition) {
                this.setupCheckboxListeners();
            }
        } catch (error) {
            console.error('Erreur afficherHistorique:', error);
            dataDisplay.innerHTML = '<div class="empty-message">Erreur d\'affichage de l\'historique</div>';
        }
    }

    setupCheckboxListeners() {
        try {
            // Case à cocher "Tout sélectionner"
            const selectAll = document.getElementById('selectAll');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('.operation-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = e.target.checked;
                        const operationId = parseInt(checkbox.dataset.id);
                        if (!isNaN(operationId)) {
                            if (e.target.checked) {
                                this.operationsSelectionnees.add(operationId);
                            } else {
                                this.operationsSelectionnees.delete(operationId);
                            }
                        }
                    });
                    this.updateBoutonsSuppression();
                });
            }

            // Cases à cocher individuelles
            const checkboxes = document.querySelectorAll('.operation-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const operationId = parseInt(e.target.dataset.id);
                    if (!isNaN(operationId)) {
                        if (e.target.checked) {
                            this.operationsSelectionnees.add(operationId);
                        } else {
                            this.operationsSelectionnees.delete(operationId);
                        }
                        this.updateBoutonsSuppression();
                    }
                });
            });
        } catch (error) {
            console.error('Erreur setupCheckboxListeners:', error);
        }
    }

    updateBoutonsSuppression() {
        try {
            const btnDeleteSelected = document.getElementById('btnDeleteSelected');
            if (btnDeleteSelected) {
                if (this.operationsSelectionnees.size > 0) {
                    btnDeleteSelected.textContent = `🗑️ Supprimer (${this.operationsSelectionnees.size})`;
                    btnDeleteSelected.style.display = 'inline-block';
                } else {
                    btnDeleteSelected.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erreur updateBoutonsSuppression:', error);
        }
    }

    // MÉTHODES DU MODE ÉDITION
    toggleEditMode(activer = null) {
        try {
            this.modeEdition = activer !== null ? activer : !this.modeEdition;
            
            const btnEditMode = document.getElementById('btnEditMode');
            const btnDeleteSelected = document.getElementById('btnDeleteSelected');
            const btnCancelEdit = document.getElementById('btnCancelEdit');
            
            if (btnEditMode) {
                if (this.modeEdition) {
                    btnEditMode.textContent = '✅ Mode Normal';
                    btnEditMode.classList.remove('btn-warning');
                    btnEditMode.classList.add('btn-success');
                } else {
                    btnEditMode.textContent = '✏️ Mode Édition';
                    btnEditMode.classList.remove('btn-success');
                    btnEditMode.classList.add('btn-warning');
                }
            }
            
            if (btnCancelEdit) {
                btnCancelEdit.style.display = this.modeEdition ? 'inline-block' : 'none';
            }
            
            if (btnDeleteSelected && !this.modeEdition) {
                btnDeleteSelected.style.display = 'none';
            }
            
            if (this.modeEdition) {
                document.body.classList.add('edit-mode');
            } else {
                document.body.classList.remove('edit-mode');
                this.operationsSelectionnees.clear();
            }
            
            // Re-afficher l'historique avec le nouveau mode
            const tabActif = document.querySelector('.tab-btn.active');
            this.afficherHistorique(tabActif ? tabActif.getAttribute('data-sheet') : 'global');
        } catch (error) {
            console.error('Erreur toggleEditMode:', error);
        }
    }

    supprimerOperationsSelectionnees() {
        try {
            if (this.operationsSelectionnees.size === 0) {
                this.afficherMessageErreur('Aucune opération sélectionnée');
                return;
            }

            if (confirm(`Voulez-vous vraiment supprimer ${this.operationsSelectionnees.size} opération(s) ?`)) {
                const ancienneTaille = this.operations.length;
                this.operations = this.operations.filter(op => !this.operationsSelectionnees.has(op.id));
                
                if (this.operations.length < ancienneTaille) {
                    this.sauvegarderLocal();
                    this.afficherMessageSucces(`${ancienneTaille - this.operations.length} opération(s) supprimée(s) !`);
                    this.updateStats();
                    
                    const tabActif = document.querySelector('.tab-btn.active');
                    this.afficherHistorique(tabActif ? tabActif.getAttribute('data-sheet') : 'global');
                }
                
                this.operationsSelectionnees.clear();
                this.toggleEditMode(false);
            }
        } catch (error) {
            console.error('Erreur supprimerOperationsSelectionnees:', error);
            this.afficherMessageErreur('Erreur lors de la suppression');
        }
    }

    supprimerOperation(id) {
        try {
            if (confirm('Voulez-vous vraiment supprimer cette opération ?')) {
                const ancienneTaille = this.operations.length;
                this.operations = this.operations.filter(op => op.id !== id);
                
                if (this.operations.length < ancienneTaille) {
                    this.sauvegarderLocal();
                    this.afficherMessageSucces('Opération supprimée !');
                    this.updateStats();
                    
                    const tabActif = document.querySelector('.tab-btn.active');
                    this.afficherHistorique(tabActif ? tabActif.getAttribute('data-sheet') : 'global');
                }
            }
        } catch (error) {
            console.error('Erreur supprimerOperation:', error);
            this.afficherMessageErreur('Erreur lors de la suppression');
        }
    }

    editerOperation(id) {
        try {
            const operation = this.operations.find(op => op.id === id);
            if (!operation) {
                this.afficherMessageErreur('Opération non trouvée');
                return;
            }

            // Remplir le formulaire modal
            document.getElementById('editId').value = operation.id;
            document.getElementById('editOperateur').value = operation.operateur || '';
            document.getElementById('editGroupe').value = operation.groupe || '';
            document.getElementById('editTypeOperation').value = operation.typeOperation || '';
            document.getElementById('editTypeTransaction').value = operation.typeTransaction || '';
            document.getElementById('editCaisse').value = operation.caisse || '';
            document.getElementById('editMontant').value = Math.abs(operation.montant || 0);
            document.getElementById('editDescription').value = operation.description || '';

            // Afficher le modal
            document.getElementById('editModal').style.display = 'flex';
        } catch (error) {
            console.error('Erreur editerOperation:', error);
            this.afficherMessageErreur('Erreur lors de l\'édition');
        }
    }

    modifierOperation(e) {
        e.preventDefault();
        
        try {
            const id = parseInt(document.getElementById('editId').value);
            const operateur = document.getElementById('editOperateur').value;
            const groupe = document.getElementById('editGroupe').value;
            const typeOperation = document.getElementById('editTypeOperation').value;
            const typeTransaction = document.getElementById('editTypeTransaction').value;
            const caisse = document.getElementById('editCaisse').value;
            const montantInput = document.getElementById('editMontant').value;
            const description = document.getElementById('editDescription').value;

            // Validation
            if (!operateur || !groupe || !typeOperation || !typeTransaction || !caisse) {
                this.afficherMessageErreur('Veuillez remplir tous les champs obligatoires');
                return;
            }

            const montant = parseFloat(montantInput);
            if (montant <= 0 || isNaN(montant)) {
                this.afficherMessageErreur('Le montant doit être supérieur à 0');
                return;
            }

            if (!description.trim()) {
                this.afficherMessageErreur('Veuillez saisir une description');
                return;
            }

            // Trouver et mettre à jour l'opération
            const operationIndex = this.operations.findIndex(op => op.id === id);
            if (operationIndex !== -1) {
                this.operations[operationIndex] = {
                    ...this.operations[operationIndex],
                    operateur,
                    groupe,
                    typeOperation,
                    typeTransaction,
                    caisse,
                    description: description.trim(),
                    montant: typeTransaction === 'frais' ? -montant : montant,
                    timestamp: new Date().toISOString() // Mettre à jour le timestamp
                };

                this.sauvegarderLocal();
                this.afficherMessageSucces('Opération modifiée !');
                this.fermerModal();
                this.updateStats();
                
                const tabActif = document.querySelector('.tab-btn.active');
                this.afficherHistorique(tabActif ? tabActif.getAttribute('data-sheet') : 'global');
            } else {
                this.afficherMessageErreur('Opération non trouvée');
            }
        } catch (error) {
            console.error('Erreur modifierOperation:', error);
            this.afficherMessageErreur('Erreur lors de la modification');
        }
    }

    fermerModal() {
        try {
            document.getElementById('editModal').style.display = 'none';
        } catch (error) {
            console.error('Erreur fermerModal:', error);
        }
    }

    // MÉTHODES DE FORMATAGE
    formaterDate(dateStr) {
        try {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString('fr-FR');
        } catch (error) {
            return 'Date invalide';
        }
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar', 
            'hicham': '👨‍🔧 Hicham',
            'system': '🤖 Système'
        };
        return operateurs[operateur] || operateur || 'Inconnu';
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'transfert': '🔄 Transfert'
        };
        return groupes[groupe] || groupe || 'Inconnu';
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': '🌍 Travailleur global',
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'autre': '📝 Autre',
            'transfert': '🔄 Transfert'
        };
        return types[type] || type || 'Inconnu';
    }

    formaterTypeTransaction(type) {
        return type === 'revenu' ? '💰 Revenu' : (type === 'frais' ? '💸 Frais' : 'Inconnu');
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': '👨‍💼 Caisse Abdel',
            'omar_caisse': '👨‍💻 Caisse Omar',
            'hicham_caisse': '👨‍🔧 Caisse Hicham',
            'zaitoun_caisse': '🫒 Caisse Zaitoun', 
            '3commain_caisse': '🔧 Caisse 3 Commain'
        };
        return caisses[caisse] || caisse || 'Caisse inconnue';
    }
}

// Initialisation avec protection contre la redéclaration et accès global
let app;
if (!window.appInitialized) {
    document.addEventListener('DOMContentLoaded', function() {
        if (!app) {
            try {
                app = new GestionFerme();
                window.appInitialized = true;
                window.gestionFermeApp = app; // Rendre l'app accessible globalement
                window.app = app; // Double accès pour compatibilité
                console.log('🚀 Application Gestion Ferme démarrée avec succès !');
                console.log('🔧 App accessible via: window.gestionFermeApp');
            } catch (error) {
                console.error('❌ Erreur critique lors du démarrage:', error);
            }
        }
    });
}

// Fonctions globales pour les onclick (sécurité)
if (typeof window !== 'undefined') {
    window.supprimerOperationGlobale = function(id) {
        if (window.gestionFermeApp) {
            window.gestionFermeApp.supprimerOperation(id);
        } else if (window.app) {
            window.app.supprimerOperation(id);
        }
    };
    
    window.editerOperationGlobale = function(id) {
        if (window.gestionFermeApp) {
            window.gestionFermeApp.editerOperation(id);
        } else if (window.app) {
            window.app.editerOperation(id);
        }
    };
}
