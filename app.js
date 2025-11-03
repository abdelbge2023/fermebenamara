// app.js - Version avec authentification et suivi des modifications
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
        
        // Authentification
        this.utilisateurConnecte = null;
        this.motsDePasse = {
            'abdel': 'motdepasse',
            'omar': 'motdepasse', 
            'hicham': 'motdepasse'
        };
        
        // Pour éviter les boucles de synchronisation
        this.suppressionsEnCours = new Set();
        this.ajoutsEnCours = new Set();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.verifierAuthentification();
    }

    setupEventListeners() {
        console.log('🔧 Configuration des écouteurs d\'événements...');
        
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.connexion(e));
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
        
        // Bouton déconnexion
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.deconnexion());
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

    // SYSTÈME D'AUTHENTIFICATION
    verifierAuthentification() {
        const utilisateurSauvegarde = localStorage.getItem('utilisateur_connecte');
        if (utilisateurSauvegarde) {
            this.utilisateurConnecte = JSON.parse(utilisateurSauvegarde);
            this.initialiserApplication();
        } else {
            this.afficherModalConnexion();
        }
    }

    afficherModalConnexion() {
        document.getElementById('loginModal').style.display = 'flex';
        document.querySelector('.container').style.display = 'none';
    }

    cacherModalConnexion() {
        document.getElementById('loginModal').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    }

    connexion(e) {
        e.preventDefault();
        
        const operateur = document.getElementById('loginOperateur').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!operateur || !password) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (this.motsDePasse[operateur] === password) {
            this.utilisateurConnecte = {
                id: operateur,
                nom: this.formaterOperateur(operateur),
                dateConnexion: new Date().toISOString()
            };
            
            localStorage.setItem('utilisateur_connecte', JSON.stringify(this.utilisateurConnecte));
            this.cacherModalConnexion();
            this.initialiserApplication();
            this.afficherMessageSucces(`Bienvenue ${this.utilisateurConnecte.nom} !`);
        } else {
            alert('Mot de passe incorrect');
        }
    }

    deconnexion() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            this.utilisateurConnecte = null;
            localStorage.removeItem('utilisateur_connecte');
            this.afficherModalConnexion();
        }
    }

    initialiserApplication() {
        this.afficherEnTeteUtilisateur();
        this.chargerDonneesAvecSynchro();
        this.setupFirebaseRealtimeListeners();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée pour', this.utilisateurConnecte.nom);
    }

    afficherEnTeteUtilisateur() {
        const header = document.querySelector('header');
        const userHeader = document.createElement('div');
        userHeader.className = 'user-header';
        userHeader.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${this.utilisateurConnecte.id === 'abdel' ? '👨‍💼' : 
                      this.utilisateurConnecte.id === 'omar' ? '👨‍💻' : '👨‍🔧'}
                </div>
                <div class="user-details">
                    <h3>${this.utilisateurConnecte.nom}</h3>
                    <p>Connecté depuis ${new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
            </div>
            <button class="logout-btn">🚪 Déconnexion</button>
        `;
        
        header.parentNode.insertBefore(userHeader, header.nextSibling);
        
        // Re-attacher l'événement de déconnexion
        userHeader.querySelector('.logout-btn').addEventListener('click', () => this.deconnexion());
    }

    // VÉRIFICATION DES PERMISSIONS
    peutModifierOperation(operation) {
        if (!this.utilisateurConnecte) return false;
        
        // L'utilisateur peut modifier ses propres opérations
        if (operation.createur === this.utilisateurConnecte.id) {
            return true;
        }
        
        // Les opérations système (transferts) peuvent être modifiées par tous
        if (operation.operateur === 'system') {
            return true;
        }
        
        return false;
    }

    peutSupprimerOperation(operation) {
        return this.peutModifierOperation(operation);
    }

    gestionAffichageRepartition(typeOperation) {
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');
        const montantInput = document.getElementById('montant');
        
        if (!repartitionInfo || !repartitionDetails) return;
        
        if (typeOperation === 'travailleur_global') {
            repartitionInfo.style.display = 'block';
            
            // Mettre à jour en temps réel quand le montant change
            const updateRepartition = () => {
                const montant = parseFloat(montantInput.value) || 0;
                if (montant > 0) {
                    const partZaitoun = (montant / 3).toFixed(2);
                    const part3Commain = ((montant * 2) / 3).toFixed(2);
                    
                    repartitionDetails.innerHTML = `
                        <div class="repartition-grid">
                            <div class="repartition-item">
                                <span class="repartition-label">🫒 Zaitoun (1/3):</span>
                                <span class="repartition-value">${partZaitoun} DH</span>
                            </div>
                            <div class="repartition-item">
                                <span class="repartition-label">🔧 3 Commain (2/3):</span>
                                <span class="repartition-value">${part3Commain} DH</span>
                            </div>
                        </div>
                    `;
                } else {
                    repartitionDetails.innerHTML = '<p>Saisissez un montant pour voir la répartition</p>';
                }
            };
            
            // Écouter les changements de montant
            montantInput.removeEventListener('input', updateRepartition);
            montantInput.addEventListener('input', updateRepartition);
            updateRepartition();
            
        } else {
            repartitionInfo.style.display = 'none';
        }
    }

    async ajouterTransfert(e) {
        e.preventDefault();

        if (!this.utilisateurConnecte) {
            alert('Veuillez vous connecter pour effectuer un transfert');
            return;
        }

        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        const montantTransfert = parseFloat(document.getElementById('montantTransfert').value);
        const descriptionTransfert = document.getElementById('descriptionTransfert').value.trim();

        if (caisseSource === caisseDestination) {
            alert('Les caisses source et destination doivent être différentes');
            return;
        }

        if (montantTransfert <= 0 || isNaN(montantTransfert)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!descriptionTransfert) {
            alert('Veuillez saisir une description');
            return;
        }

        // Vérifier si la caisse source a suffisamment de fonds
        const soldeSource = this.caisses[caisseSource];
        if (soldeSource < montantTransfert) {
            alert(`Fonds insuffisants dans ${this.formaterCaisse(caisseSource)}. Solde disponible: ${soldeSource.toFixed(2)} DH`);
            return;
        }

        try {
            // Créer les deux opérations de transfert
            const operationsTransfert = [
                {
                    date: new Date().toISOString().split('T')[0],
                    operateur: 'system',
                    groupe: 'system',
                    typeOperation: 'transfert',
                    typeTransaction: 'frais',
                    caisse: caisseSource,
                    description: `Transfert vers ${this.formaterCaisse(caisseDestination)}: ${descriptionTransfert}`,
                    montant: -montantTransfert,
                    repartition: false,
                    transfert: true,
                    createur: this.utilisateurConnecte.id,
                    createurNom: this.utilisateurConnecte.nom,
                    timestamp: new Date().toISOString()
                },
                {
                    date: new Date().toISOString().split('T')[0],
                    operateur: 'system',
                    groupe: 'system',
                    typeOperation: 'transfert',
                    typeTransaction: 'revenu',
                    caisse: caisseDestination,
                    description: `Transfert de ${this.formaterCaisse(caisseSource)}: ${descriptionTransfert}`,
                    montant: montantTransfert,
                    repartition: false,
                    transfert: true,
                    createur: this.utilisateurConnecte.id,
                    createurNom: this.utilisateurConnecte.nom,
                    timestamp: new Date().toISOString()
                }
            ];

            // Sauvegarder sur Firebase pour obtenir les IDs
            for (const op of operationsTransfert) {
                if (window.firebaseSync) {
                    const result = await firebaseSync.addDocument('operations', op);
                    const operationAvecId = {
                        id: result.id,
                        ...op
                    };
                    this.operations.unshift(operationAvecId);
                    console.log(`➕ Transfert ${result.id} ajouté avec ID Firebase`);
                } else {
                    const operationAvecId = {
                        id: 'local_' + Date.now(),
                        ...op
                    };
                    this.operations.unshift(operationAvecId);
                    console.log(`➕ Transfert ${operationAvecId.id} ajouté en local`);
                }
            }

            this.sauvegarderLocalement();
            this.afficherMessageSucces('Transfert effectué !');
            
            // Réinitialiser le formulaire
            document.getElementById('transfertForm').reset();
            this.mettreAJourAffichage();
            
        } catch (error) {
            console.error('❌ Erreur transfert:', error);
            alert('Erreur lors du transfert. Vérifiez votre connexion.');
        }
    }

    toggleEditMode(activer) {
        if (!this.utilisateurConnecte) {
            alert('Veuillez vous connecter pour activer le mode édition');
            return;
        }

        this.editMode = activer;
        
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        
        if (activer) {
            btnEditMode.style.display = 'none';
            btnDeleteSelected.style.display = 'inline-block';
            btnCancelEdit.style.display = 'inline-block';
            this.selectedOperations.clear();
        } else {
            btnEditMode.style.display = 'inline-block';
            btnDeleteSelected.style.display = 'none';
            btnCancelEdit.style.display = 'none';
            this.selectedOperations.clear();
        }
        
        this.mettreAJourAffichage();
    }

    toggleOperationSelection(operationId) {
        if (this.selectedOperations.has(operationId)) {
            this.selectedOperations.delete(operationId);
        } else {
            this.selectedOperations.add(operationId);
        }
        this.mettreAJourAffichage();
    }

    ouvrirModalModification(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        // Vérifier les permissions
        if (!this.peutModifierOperation(operation)) {
            alert('Vous ne pouvez modifier que vos propres opérations');
            return;
        }

        document.getElementById('editId').value = operation.id;
        document.getElementById('editOperateur').value = operation.operateur;
        document.getElementById('editGroupe').value = operation.groupe;
        document.getElementById('editTypeOperation').value = operation.typeOperation;
        document.getElementById('editTypeTransaction').value = operation.typeTransaction;
        document.getElementById('editCaisse').value = operation.caisse;
        document.getElementById('editMontant').value = Math.abs(operation.montant);
        document.getElementById('editDescription').value = operation.description;

        document.getElementById('editModal').style.display = 'block';
    }

    async modifierOperation(e) {
        e.preventDefault();

        if (!this.utilisateurConnecte) {
            alert('Veuillez vous connecter pour modifier une opération');
            return;
        }

        const operationId = document.getElementById('editId').value;
        const operateur = document.getElementById('editOperateur').value;
        const groupe = document.getElementById('editGroupe').value;
        const typeOperation = document.getElementById('editTypeOperation').value;
        const typeTransaction = document.getElementById('editTypeTransaction').value;
        const caisse = document.getElementById('editCaisse').value;
        const montantSaisi = parseFloat(document.getElementById('editMontant').value);
        const descriptionValue = document.getElementById('editDescription').value.trim();

        // Vérifier les permissions
        const operationOriginale = this.operations.find(op => op.id === operationId);
        if (!this.peutModifierOperation(operationOriginale)) {
            alert('Vous ne pouvez modifier que vos propres opérations');
            return;
        }

        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!descriptionValue) {
            alert('Veuillez saisir une description');
            return;
        }

        const index = this.operations.findIndex(op => op.id === operationId);
        if (index === -1) return;

        const operationModifiee = {
            ...this.operations[index],
            operateur: operateur,
            groupe: groupe,
            typeOperation: typeOperation,
            typeTransaction: typeTransaction,
            caisse: caisse,
            description: descriptionValue,
            montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
            modifiePar: this.utilisateurConnecte.id,
            modifieParNom: this.utilisateurConnecte.nom,
            dateModification: new Date().toISOString()
        };

        try {
            // Mettre à jour dans Firebase
            if (window.firebaseSync) {
                await firebaseSync.updateDocument('operations', operationId, operationModifiee);
            }
            
            // Mettre à jour localement
            this.operations[index] = operationModifiee;
            this.sauvegarderLocalement();
            
            this.afficherMessageSucces('Opération modifiée !');
            document.getElementById('editModal').style.display = 'none';
            this.mettreAJourAffichage();
            
        } catch (error) {
            console.error('❌ Erreur modification:', error);
            alert('Erreur lors de la modification. Vérifiez votre connexion.');
        }
    }

    // NOUVELLE MÉTHODE : Calculer les totaux pour une vue
    calculerTotauxVue(operations) {
        let totalRevenus = 0;
        let totalFrais = 0;
        let solde = 0;

        operations.forEach(op => {
            if (op.montant > 0) {
                totalRevenus += op.montant;
            } else {
                totalFrais += Math.abs(op.montant);
            }
            solde += op.montant;
        });

        return {
            totalRevenus,
            totalFrais,
            solde,
            nombreOperations: operations.length
        };
    }

    // NOUVELLE MÉTHODE : Obtenir le nom de la vue
    getNomVue(vue) {
        const nomsVues = {
            'global': '🌍 Toutes les Opérations',
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar',
            'hicham': '👨‍🔧 Hicham',
            'transferts': '🔄 Transferts'
        };
        return nomsVues[vue] || vue;
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
        
        if (operationsFiltrees.length === 0) {
            container.innerHTML = '<div class="empty-message"><p>Aucune opération trouvée</p></div>';
            return;
        }

        // CALCUL DES TOTAUX POUR LA VUE
        const totaux = this.calculerTotauxVue(operationsFiltrees);
        const nomVue = this.getNomVue(vue);

        let tableHTML = `
            <div class="fade-in">
                <div class="vue-header">
                    <h3>📊 ${nomVue}</h3>
                    <div class="totals-container">
                        <div class="total-item">
                            <span class="total-label">💰 Total Revenus:</span>
                            <span class="total-value positive">+${totaux.totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">💸 Total Frais:</span>
                            <span class="total-value negative">-${totaux.totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">⚖️ Solde Net:</span>
                            <span class="total-value ${totaux.solde >= 0 ? 'positive' : 'negative'}">
                                ${totaux.solde >= 0 ? '+' : ''}${totaux.solde.toFixed(2)} DH
                            </span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">📊 Nombre d'opérations:</span>
                            <span class="total-value">${totaux.nombreOperations}</span>
                        </div>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4>📋 Détail des opérations</h4>
                </div>

                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${this.editMode ? '<th><input type="checkbox" id="selectAll"></th>' : ''}
                                <th>Date</th>
                                <th>Opérateur</th>
                                <th>Groupe</th>
                                <th>Type Opération</th>
                                <th>Transaction</th>
                                <th>Caisse</th>
                                <th>Description</th>
                                <th>Montant (DH)</th>
                                <th>Créateur</th>
                                ${!this.editMode ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
        `;

        operationsFiltrees.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            const estSelectionnee = this.selectedOperations.has(op.id);
            const estMonOperation = this.peutModifierOperation(op);
            const classeLigne = !estMonOperation ? 'other-user-operation' : '';
            
            tableHTML += `
                <tr class="${estSelectionnee ? 'selected' : ''} ${classeLigne}">
                    ${this.editMode ? 
                        `<td><input type="checkbox" ${estSelectionnee ? 'checked' : ''} 
                         onchange="app.toggleOperationSelection('${op.id}')"
                         ${!estMonOperation ? 'disabled' : ''}></td>` 
                        : ''}
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="${estNegatif ? 'type-frais' : 'type-revenu'}">${this.formaterTypeTransaction(op.typeTransaction)}</td>
                    <td>${this.formaterCaisse(op.caisse)}</td>
                    <td>
                        ${op.description}
                        ${op.modifiePar ? `<br><small class="operation-creator">🔄 Modifié par ${op.modifieParNom}</small>` : ''}
                    </td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                    <td>
                        <span class="creator-badge">${op.createurNom || this.formaterOperateur(op.createur || op.operateur)}</span>
                    </td>
                    ${!this.editMode ? `
                    <td>
                        <div class="operation-actions">
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')"
                                ${!estMonOperation ? 'disabled style="opacity:0.5"' : ''}>
                                ✏️
                            </button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')"
                                ${!estMonOperation ? 'disabled style="opacity:0.5"' : ''}>
                                🗑️
                            </button>
                        </div>
                    </td>
                    ` : ''}
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div></div>';
        
        container.innerHTML = tableHTML;
        
        // Gestion du selectAll en JavaScript pur après l'insertion du HTML
        if (this.editMode) {
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:not(:disabled)');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = e.target.checked;
                        const opId = checkbox.getAttribute('onchange').match(/'([^']+)'/)[1];
                        if (e.target.checked) {
                            this.selectedOperations.add(opId);
                        } else {
                            this.selectedOperations.delete(opId);
                        }
                    });
                });
            }
        }
        
        this.updateStats();
    }

    // ... (le reste des méthodes reste identique mais avec vérifications d'authentification ajoutées)

    async ajouterOperation(e) {
        e.preventDefault();

        if (!this.utilisateurConnecte) {
            alert('Veuillez vous connecter pour ajouter une opération');
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

        let operationsACreer = [];

        if (typeOperation === 'travailleur_global') {
            const montantZaitoun = montantSaisi / 3;
            const montant3Commain = (montantSaisi * 2) / 3;

            operationsACreer = [
                {
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: descriptionValue + ' (Part Zaitoun - 1/3)',
                    montant: typeTransaction === 'frais' ? -montantZaitoun : montantZaitoun,
                    repartition: true,
                    createur: this.utilisateurConnecte.id,
                    createurNom: this.utilisateurConnecte.nom,
                    timestamp: new Date().toISOString()
                },
                {
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: descriptionValue + ' (Part 3 Commain - 2/3)',
                    montant: typeTransaction === 'frais' ? -montant3Commain : montant3Commain,
                    repartition: true,
                    createur: this.utilisateurConnecte.id,
                    createurNom: this.utilisateurConnecte.nom,
                    timestamp: new Date().toISOString()
                }
            ];
        } else {
            operationsACreer = [{
                date: new Date().toISOString().split('T')[0],
                operateur: operateur,
                groupe: groupe,
                typeOperation: typeOperation,
                typeTransaction: typeTransaction,
                caisse: caisse,
                description: descriptionValue,
                montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
                repartition: false,
                createur: this.utilisateurConnecte.id,
                createurNom: this.utilisateurConnecte.nom,
                timestamp: new Date().toISOString()
            }];
        }

        try {
            // Sauvegarder d'abord sur Firebase pour obtenir les IDs
            for (const op of operationsACreer) {
                if (window.firebaseSync) {
                    const result = await firebaseSync.addDocument('operations', op);
                    
                    const operationAvecId = {
                        id: result.id,
                        ...op
                    };
                    
                    this.operations.unshift(operationAvecId);
                    console.log(`➕ Nouvelle opération ${result.id} ajoutée avec ID Firebase`);
                } else {
                    const operationAvecId = {
                        id: 'local_' + Date.now(),
                        ...op
                    };
                    this.operations.unshift(operationAvecId);
                    console.log(`➕ Nouvelle opération ${operationAvecId.id} ajoutée en local`);
                }
            }

            this.sauvegarderLocalement();
            this.afficherMessageSucces('Opération enregistrée !');
            this.resetForm();
            this.mettreAJourAffichage();
            
        } catch (error) {
            console.error('❌ Erreur ajout opération:', error);
            alert('Erreur lors de l\'enregistrement. Vérifiez votre connexion.');
        }
    }

    async supprimerOperation(operationId) {
        if (!this.utilisateurConnecte) {
            alert('Veuillez vous connecter pour supprimer une opération');
            return;
        }

        const operationASupprimer = this.operations.find(op => op.id === operationId);
        if (!operationASupprimer) return;

        // Vérifier les permissions
        if (!this.peutSupprimerOperation(operationASupprimer)) {
            alert('Vous ne pouvez supprimer que vos propres opérations');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) return;
        
        try {
            this.suppressionsEnCours.add(operationId);
            
            if (window.firebaseSync) {
                await firebaseSync.deleteDocument('operations', operationId);
                console.log(`✅ Opération ${operationId} supprimée de Firebase`);
            }
            
            this.operations = this.operations.filter(op => op.id !== operationId);
            
            this.sauvegarderLocalement();
            this.mettreAJourAffichage();
            this.afficherMessageSucces('Opération supprimée');
            
            setTimeout(() => {
                this.suppressionsEnCours.delete(operationId);
            }, 5000);
            
        } catch (error) {
            console.error(`❌ Erreur suppression:`, error);
            this.suppressionsEnCours.delete(operationId);
            alert('Erreur lors de la suppression. Vérifiez votre connexion.');
        }
    }

    // ... (les autres méthodes restent similaires avec les vérifications d'authentification)

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
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
