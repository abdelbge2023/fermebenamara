// app.js - Version complète avec export Excel
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
        
        // Pour éviter les boucles de synchronisation
        this.suppressionsEnCours = new Set();
        this.ajoutsEnCours = new Set();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.chargerDonneesAvecSynchro();
        this.setupFirebaseRealtimeListeners();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée');
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

        const operationId = document.getElementById('editId').value;
        const operateur = document.getElementById('editOperateur').value;
        const groupe = document.getElementById('editGroupe').value;
        const typeOperation = document.getElementById('editTypeOperation').value;
        const typeTransaction = document.getElementById('editTypeTransaction').value;
        const caisse = document.getElementById('editCaisse').value;
        const montantSaisi = parseFloat(document.getElementById('editMontant').value);
        const descriptionValue = document.getElementById('editDescription').value.trim();

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
            montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi
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

        let tableHTML = `
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
                            ${!this.editMode ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

        operationsFiltrees.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            const estSelectionnee = this.selectedOperations.has(op.id);
            
            tableHTML += `
                <tr class="${estSelectionnee ? 'selected' : ''}">
                    ${this.editMode ? 
                        `<td><input type="checkbox" ${estSelectionnee ? 'checked' : ''} onchange="app.toggleOperationSelection('${op.id}')"></td>` 
                        : ''}
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="${estNegatif ? 'type-frais' : 'type-revenu'}">${this.formaterTypeTransaction(op.typeTransaction)}</td>
                    <td>${this.formaterCaisse(op.caisse)}</td>
                    <td>${op.description}</td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                    ${!this.editMode ? `
                    <td>
                        <div class="operation-actions">
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">🗑️</button>
                        </div>
                    </td>
                    ` : ''}
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div>';
        
        container.innerHTML = tableHTML;
        
        // Gestion du selectAll en JavaScript pur après l'insertion du HTML
        if (this.editMode) {
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
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

    mettreAJourOngletsCaisse(caisse) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => btn.classList.remove('active'));
    }

    // RÉINITIALISER COMPLÈTEMENT FIREBASE
    async reinitialiserFirebase() {
        if (!confirm('🚨 ATTENTION ! Cette action va supprimer TOUTES les données Firebase définitivement.\n\nCette action ne peut pas être annulée. Continuer ?')) {
            return;
        }

        if (!confirm('Êtes-vous ABSOLUMENT SÛR ? Toutes les opérations seront perdues sur tous les appareils !')) {
            return;
        }

        console.log('🗑️ Début de la réinitialisation Firebase...');
        this.afficherMessageSucces('Réinitialisation en cours...');

        try {
            // 1. Vider Firebase
            if (window.firebaseSync) {
                // Récupérer toutes les opérations de Firebase
                const operationsFirebase = await firebaseSync.getCollection('operations');
                console.log(`🗑️ Suppression de ${operationsFirebase.length} opérations de Firebase...`);
                
                // Supprimer chaque opération
                for (const op of operationsFirebase) {
                    try {
                        await firebaseSync.deleteDocument('operations', op.id);
                        console.log(`✅ Supprimé: ${op.id}`);
                    } catch (error) {
                        console.error(`❌ Erreur suppression ${op.id}:`, error);
                    }
                }
            }

            // 2. Vider le localStorage
            localStorage.removeItem('gestion_ferme_data');
            console.log('✅ LocalStorage vidé');

            // 3. Réinitialiser les données locales
            this.operations = [];
            this.suppressionsEnCours.clear();
            this.ajoutsEnCours.clear();
            this.selectedOperations.clear();
            this.caisseSelectionnee = null;
            this.currentView = 'global';

            // 4. Recréer une sauvegarde vide
            this.sauvegarderLocalement();

            // 5. Mettre à jour l'affichage
            this.updateStats();
            this.afficherHistorique('global');

            console.log('✅ Réinitialisation complète terminée');
            this.afficherMessageSucces('✅ Données Firebase réinitialisées avec succès !');

            // Rafraîchir la page après 2 secondes
            setTimeout(() => {
                location.reload();
            }, 2000);

        } catch (error) {
            console.error('❌ Erreur réinitialisation:', error);
            this.afficherMessageSucces('❌ Erreur lors de la réinitialisation');
        }
    }

    // RÉINITIALISER UNIQUEMENT LES DONNÉES LOCALES
    reinitialiserLocal() {
        if (!confirm('Vider les données locales ? Les données Firebase resteront intactes.')) {
            return;
        }

        console.log('🗑️ Réinitialisation des données locales...');
        
        // Vider le localStorage
        localStorage.removeItem('gestion_ferme_data');
        
        // Réinitialiser les variables
        this.operations = [];
        this.suppressionsEnCours.clear();
        this.ajoutsEnCours.clear();
        this.selectedOperations.clear();
        this.caisseSelectionnee = null;
        
        // Sauvegarder l'état vide
        this.sauvegarderLocalement();
        
        // Mettre à jour l'affichage
        this.updateStats();
        this.afficherHistorique('global');
        
        this.afficherMessageSucces('✅ Données locales réinitialisées');
        
        // Resynchroniser avec Firebase
        setTimeout(() => {
            this.synchroniserAvecFirebase();
        }, 1000);
    }

    async chargerDonneesAvecSynchro() {
        console.log('📥 Chargement automatique des données...');
        
        this.chargerDepuisLocalStorage();
        await this.synchroniserAvecFirebase();
        
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
        if (!window.firebaseSync) {
            console.log('⏳ Attente de FirebaseSync...');
            setTimeout(() => this.synchroniserAvecFirebase(), 2000);
            return;
        }

        if (this.synchronisationEnCours) return;
        this.synchronisationEnCours = true;

        try {
            const operationsFirebase = await firebaseSync.getCollection('operations');
            
            if (operationsFirebase && operationsFirebase.length > 0) {
                console.log(`📡 ${operationsFirebase.length} opérations sur Firebase`);
                
                let nouvellesOperations = 0;

                // Réinitialiser les opérations avec celles de Firebase
                this.operations = [];

                operationsFirebase.forEach(opFirebase => {
                    // Utiliser directement les opérations de Firebase avec leurs IDs
                    this.operations.unshift(opFirebase);
                    nouvellesOperations++;
                    console.log(`➕ Opération ${opFirebase.id} synchronisée depuis Firebase`);
                });

                this.operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                this.sauvegarderLocalement();

                console.log(`✅ Synchronisation: ${nouvellesOperations} opérations chargées depuis Firebase`);
                
                if (nouvellesOperations > 0) {
                    this.afficherMessageSucces(`Synchronisée: ${nouvellesOperations} opérations`);
                    this.mettreAJourAffichage();
                }
            }
            
            this.firebaseInitialized = true;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        } finally {
            this.synchronisationEnCours = false;
        }
    }

    setupFirebaseRealtimeListeners() {
        if (!window.firebaseSync) {
            setTimeout(() => this.setupFirebaseRealtimeListeners(), 2000);
            return;
        }

        console.log('👂 Activation écoute temps réel avec anti-boucle');
        
        this.unsubscribeFirebase = firebaseSync.listenToCollection('operations', (changes, snapshot) => {
            if (changes.length > 0) {
                console.log(`🔄 Synchronisation temps réel: ${changes.length} changement(s)`);
                
                let modifications = 0;
                let modificationsIgnorees = 0;
                
                changes.forEach(change => {
                    const operationId = change.id;
                    
                    // Vérifier si c'est une opération que NOUS avons initiée
                    if (this.suppressionsEnCours.has(operationId)) {
                        console.log(`🚫 Suppression ${operationId} ignorée (initiée localement)`);
                        modificationsIgnorees++;
                        return;
                    }

                    if (change.type === 'added') {
                        this.ajouterOperationSynchro(change.data, operationId);
                        modifications++;
                    } else if (change.type === 'modified') {
                        this.mettreAJourOperationSynchro(operationId, change.data);
                        modifications++;
                    } else if (change.type === 'removed') {
                        // Accepter les suppressions venant d'autres appareils
                        this.supprimerOperationSynchro(operationId);
                        modifications++;
                    }
                });
                
                if (modifications > 0) {
                    this.sauvegarderLocalement();
                    this.mettreAJourAffichage();
                    console.log(`✅ ${modifications} opération(s) synchronisée(s) en temps réel, ${modificationsIgnorees} ignorées (initiées localement)`);
                }
            }
        });
    }

    ajouterOperationSynchro(data, operationId) {
        const operation = {
            id: operationId, // Utiliser l'ID de Firebase
            date: data.date,
            operateur: data.operateur,
            groupe: data.groupe,
            typeOperation: data.typeOperation,
            typeTransaction: data.typeTransaction,
            caisse: data.caisse,
            description: data.description,
            montant: data.montant,
            repartition: data.repartition,
            transfert: data.transfert,
            timestamp: data.timestamp || new Date().toISOString()
        };

        const existeDeja = this.operations.some(op => op.id === operation.id);
        if (!existeDeja) {
            this.operations.unshift(operation);
            console.log(`➕ Opération ${operation.id} ajoutée par synchronisation`);
        }
    }

    mettreAJourOperationSynchro(operationId, newData) {
        const index = this.operations.findIndex(op => op.id === operationId);
        if (index !== -1) {
            this.operations[index] = { ...this.operations[index], ...newData };
        }
    }

    supprimerOperationSynchro(operationId) {
        const ancienNombre = this.operations.length;
        this.operations = this.operations.filter(op => op.id !== operationId);
        if (this.operations.length < ancienNombre) {
            console.log(`🗑️ Opération ${operationId} supprimée par synchronisation (autre appareil)`);
        }
    }

    sauvegarderLocalement() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    async sauvegarderSurFirebase() {
        if (!window.firebaseSync) return;

        try {
            for (const operation of this.operations) {
                try {
                    // Vérifier si l'opération existe déjà sur Firebase
                    const operationsFirebase = await firebaseSync.getCollection('operations');
                    const existeSurFirebase = operationsFirebase.some(op => op.id === operation.id);
                    
                    if (!existeSurFirebase) {
                        // Si elle n'existe pas, l'ajouter
                        await firebaseSync.addDocument('operations', operation);
                    } else {
                        // Si elle existe, la mettre à jour
                        await firebaseSync.updateDocument('operations', operation.id, operation);
                    }
                    
                } catch (error) {
                    console.error(`❌ Erreur synchro ${operation.id}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
        }
    }

    async sauvegarderDonnees() {
        this.sauvegarderLocalement();
        await this.sauvegarderSurFirebase();
    }

    mettreAJourAffichage() {
        this.updateStats();
        if (this.caisseSelectionnee) {
            this.afficherDetailsCaisse(this.caisseSelectionnee);
        } else {
            this.afficherHistorique(this.currentView);
        }
    }

    async supprimerOperation(operationId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) return;

        const operationASupprimer = this.operations.find(op => op.id === operationId);
        if (!operationASupprimer) return;
        
        try {
            // Marquer cette suppression comme initiée localement
            this.suppressionsEnCours.add(operationId);
            
            // 1. D'ABORD supprimer de Firebase
            if (window.firebaseSync) {
                await firebaseSync.deleteDocument('operations', operationId);
                console.log(`✅ Opération ${operationId} supprimée de Firebase`);
            }
            
            // 2. PUIS supprimer localement
            this.operations = this.operations.filter(op => op.id !== operationId);
            
            this.sauvegarderLocalement();
            this.mettreAJourAffichage();
            this.afficherMessageSucces('Opération supprimée');
            
            // Retirer du set après un délai pour laisser la synchro se faire
            setTimeout(() => {
                this.suppressionsEnCours.delete(operationId);
                console.log(`🧹 Suppression ${operationId} retirée de la liste des suppressions en cours`);
            }, 5000);
            
        } catch (error) {
            console.error(`❌ Erreur suppression:`, error);
            // En cas d'erreur, retirer immédiatement
            this.suppressionsEnCours.delete(operationId);
            alert('Erreur lors de la suppression. Vérifiez votre connexion.');
        }
    }

    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) return;

        if (!confirm(`Supprimer ${this.selectedOperations.size} opération(s) ?`)) return;
        
        try {
            // Marquer toutes les suppressions comme initiées localement
            this.selectedOperations.forEach(opId => {
                this.suppressionsEnCours.add(opId);
            });
            
            // Supprimer de Firebase d'abord
            if (window.firebaseSync) {
                for (const opId of this.selectedOperations) {
                    try {
                        await firebaseSync.deleteDocument('operations', opId);
                        console.log(`✅ Opération ${opId} supprimée de Firebase`);
                    } catch (error) {
                        console.error(`❌ Erreur suppression ${opId}:`, error);
                    }
                }
            }
            
            // Puis supprimer localement
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            
            this.sauvegarderLocalement();
            
            // Retirer les suppressions de la liste après un délai
            setTimeout(() => {
                this.selectedOperations.forEach(opId => {
                    this.suppressionsEnCours.delete(opId);
                });
                console.log(`🧹 ${this.selectedOperations.size} suppressions retirées de la liste`);
            }, 5000);
            
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.mettreAJourAffichage();
            this.afficherMessageSucces('Opérations supprimées');
            
        } catch (error) {
            console.error('❌ Erreur suppression multiple:', error);
            // En cas d'erreur, retirer immédiatement
            this.selectedOperations.forEach(opId => {
                this.suppressionsEnCours.delete(opId);
            });
            alert('Erreur lors de la suppression. Vérifiez votre connexion.');
        }
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
        this.caisses = {
            'abdel_caisse': 0, 'omar_caisse': 0, 'hicham_caisse': 0, 
            'zaitoun_caisse': 0, '3commain_caisse': 0
        };

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
        </div>`;
    }

    afficherDetailsCaisse(caisse) {
        this.caisseSelectionnee = caisse;
        this.updateStats();
        
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const nomCaisse = this.formaterCaisse(caisse);
        
        let totalRevenus = 0;
        let totalFrais = 0;
        let soldeCaisse = 0;
        
        operationsCaisse.forEach(op => {
            if (op.montant > 0) totalRevenus += op.montant;
            else totalFrais += Math.abs(op.montant);
            soldeCaisse += op.montant;
        });

        const container = document.getElementById('dataDisplay');
        
        const detailsHTML = `
            <div class="fade-in">
                <div class="vue-header">
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
                    <h4>📋 Historique des opérations</h4>
                    <div>
                        <button class="btn-secondary" onclick="app.afficherHistorique('global')">
                            ↩️ Retour
                        </button>
                    </div>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>Aucune opération</p></div>' : 
                    this.creerTableauDetailsCaisse(operationsCaisse)
                }
            </div>
        `;
        
        container.innerHTML = detailsHTML;
        this.mettreAJourOngletsCaisse(caisse);
    }

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
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table></div>';
        return tableHTML;
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
                timestamp: new Date().toISOString()
            }];
        }

        try {
            // Sauvegarder d'abord sur Firebase pour obtenir les IDs
            for (const op of operationsACreer) {
                if (window.firebaseSync) {
                    // Firebase générera automatiquement l'ID
                    const result = await firebaseSync.addDocument('operations', op);
                    
                    // Récupérer l'ID généré par Firebase
                    const operationAvecId = {
                        id: result.id, // ID généré par Firebase
                        ...op
                    };
                    
                    this.operations.unshift(operationAvecId);
                    console.log(`➕ Nouvelle opération ${result.id} ajoutée avec ID Firebase`);
                } else {
                    // Fallback local si Firebase n'est pas disponible
                    const operationAvecId = {
                        id: 'local_' + Date.now(), // ID local temporaire
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

    // MÉTHODES D'EXPORT EXCEL
    async exporterVersExcel() {
        console.log('📊 Exportation vers Excel...');
        
        try {
            // Créer un workbook et une feuille
            const wb = XLSX.utils.book_new();
            
            // Données pour l'export
            const donneesExport = this.preparerDonneesPourExport();
            
            // Créer la feuille principale
            const ws = XLSX.utils.json_to_sheet(donneesExport.operations);
            XLSX.utils.book_append_sheet(wb, ws, "Operations");
            
            // Créer une feuille pour les soldes
            const wsSoldes = XLSX.utils.json_to_sheet(donneesExport.soldes);
            XLSX.utils.book_append_sheet(wb, wsSoldes, "Soldes");
            
            // Générer le fichier Excel
            const date = new Date().toISOString().split('T')[0];
            const nomFichier = `Gestion_Ferme_Ben_Amara_${date}.xlsx`;
            XLSX.writeFile(wb, nomFichier);
            
            this.afficherMessageSucces('Export Excel réussi !');
            console.log('✅ Export Excel terminé');
            
        } catch (error) {
            console.error('❌ Erreur export Excel:', error);
            this.afficherMessageSucces('❌ Erreur lors de l\'export');
        }
    }

    preparerDonneesPourExport() {
        // Préparer les données des opérations
        const operationsExport = this.operations.map(op => ({
            'Date': this.formaterDate(op.date),
            'Opérateur': this.formaterOperateur(op.operateur),
            'Groupe': this.formaterGroupe(op.groupe),
            'Type Opération': this.formaterTypeOperation(op.typeOperation),
            'Type Transaction': op.typeTransaction === 'revenu' ? 'Revenu' : 'Frais',
            'Caisse': this.formaterCaisse(op.caisse),
            'Description': op.description,
            'Montant (DH)': op.montant,
            'Montant Absolu (DH)': Math.abs(op.montant),
            'Timestamp': op.timestamp
        }));

        // Calculer les soldes actuels
        this.calculerSoldes();
        const soldesExport = Object.keys(this.caisses).map(cle => ({
            'Caisse': this.formaterCaisse(cle),
            'Solde (DH)': this.caisses[cle]
        }));

        return {
            operations: operationsExport,
            soldes: soldesExport
        };
    }

    // Méthode pour exporter par vue
    exporterVueVersExcel() {
        console.log(`📊 Export de la vue ${this.currentView} vers Excel...`);
        
        try {
            let operationsFiltrees = [];
            
            // Filtrer selon la vue actuelle
            switch(this.currentView) {
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

            const wb = XLSX.utils.book_new();
            const operationsExport = operationsFiltrees.map(op => ({
                'Date': this.formaterDate(op.date),
                'Opérateur': this.formaterOperateur(op.operateur),
                'Groupe': this.formaterGroupe(op.groupe),
                'Type Opération': this.formaterTypeOperation(op.typeOperation),
                'Type Transaction': op.typeTransaction === 'revenu' ? 'Revenu' : 'Frais',
                'Caisse': this.formaterCaisse(op.caisse),
                'Description': op.description,
                'Montant (DH)': op.montant,
                'Montant Absolu (DH)': Math.abs(op.montant)
            }));

            const ws = XLSX.utils.json_to_sheet(operationsExport);
            
            const nomsVues = {
                'global': 'Toutes_Operations',
                'zaitoun': 'Zaitoun',
                '3commain': '3_Commain',
                'abdel': 'Abdel',
                'omar': 'Omar',
                'hicham': 'Hicham',
                'transferts': 'Transferts'
            };
            
            XLSX.utils.book_append_sheet(wb, ws, nomsVues[this.currentView]);
            
            const date = new Date().toISOString().split('T')[0];
            const nomFichier = `Gestion_Ferme_${nomsVues[this.currentView]}_${date}.xlsx`;
            XLSX.writeFile(wb, nomFichier);
            
            this.afficherMessageSucces(`Export ${nomsVues[this.currentView]} réussi !`);
            
        } catch (error) {
            console.error('❌ Erreur export vue:', error);
            this.afficherMessageSucces('❌ Erreur lors de l\'export');
        }
    }

    // Méthode d'export détaillé avec statistiques
    async exporterDetailVersExcel() {
        console.log('📊 Export détaillé vers Excel...');
        
        try {
            const wb = XLSX.utils.book_new();
            const date = new Date().toISOString().split('T')[0];
            
            // 1. Feuille des opérations
            const operationsExport = this.operations.map(op => ({
                'Date': this.formaterDate(op.date),
                'Opérateur': this.formaterOperateur(op.operateur),
                'Groupe': this.formaterGroupe(op.groupe),
                'Type Opération': this.formaterTypeOperation(op.typeOperation),
                'Transaction': op.typeTransaction === 'revenu' ? 'Revenu' : 'Frais',
                'Caisse': this.formaterCaisse(op.caisse),
                'Description': op.description,
                'Montant (DH)': op.montant,
                'Signe': op.montant >= 0 ? 'Positif' : 'Négatif'
            }));
            
            const wsOps = XLSX.utils.json_to_sheet(operationsExport);
            XLSX.utils.book_append_sheet(wb, wsOps, "Operations");
            
            // 2. Feuille des soldes
            this.calculerSoldes();
            const soldesExport = Object.keys(this.caisses).map(cle => ({
                'Caisse': this.formaterCaisse(cle),
                'Solde Actuel (DH)': this.caisses[cle],
                'Statut': this.caisses[cle] >= 0 ? 'Excédent' : 'Déficit'
            }));
            
            const wsSoldes = XLSX.utils.json_to_sheet(soldesExport);
            XLSX.utils.book_append_sheet(wb, wsSoldes, "Soldes");
            
            // 3. Feuille des statistiques
            const stats = this.calculerStatistiques();
            const statsExport = [
                { 'Statistique': 'Total des opérations', 'Valeur': stats.totalOperations },
                { 'Statistique': 'Total revenus (DH)', 'Valeur': stats.totalRevenus },
                { 'Statistique': 'Total frais (DH)', 'Valeur': stats.totalFrais },
                { 'Statistique': 'Solde global (DH)', 'Valeur': stats.soldeGlobal },
                { 'Statistique': 'Opérations ce mois', 'Valeur': stats.operationsCeMois },
                { 'Statistique': 'Date export', 'Valeur': date }
            ];
            
            const wsStats = XLSX.utils.json_to_sheet(statsExport);
            XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");
            
            // Générer le fichier
            const nomFichier = `Rapport_Complet_Ferme_${date}.xlsx`;
            XLSX.writeFile(wb, nomFichier);
            
            this.afficherMessageSucces('Rapport Excel généré !');
            
        } catch (error) {
            console.error('❌ Erreur export détaillé:', error);
            this.afficherMessageSucces('❌ Erreur lors de la génération du rapport');
        }
    }

    calculerStatistiques() {
        const totalOperations = this.operations.length;
        let totalRevenus = 0;
        let totalFrais = 0;
        
        this.operations.forEach(op => {
            if (op.montant > 0) {
                totalRevenus += op.montant;
            } else {
                totalFrais += Math.abs(op.montant);
            }
        });
        
        const soldeGlobal = totalRevenus - totalFrais;
        
        // Opérations du mois en cours
        const maintenant = new Date();
        const moisEnCours = maintenant.getMonth();
        const anneeEnCours = maintenant.getFullYear();
        
        const operationsCeMois = this.operations.filter(op => {
            const dateOp = new Date(op.date);
            return dateOp.getMonth() === moisEnCours && dateOp.getFullYear() === anneeEnCours;
        }).length;
        
        return {
            totalOperations,
            totalRevenus,
            totalFrais,
            soldeGlobal,
            operationsCeMois
        };
    }

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
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 4000);
        }
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
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
