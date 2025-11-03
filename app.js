// app.js - Version complète avec chargement Firebase corrigé
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
        this.suppressionsLocales = new Set();
        this.suppressionsEnAttente = new Set();
        this.attenteFirebase = 0;

        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de l\'application...');
        this.setupEventListeners();
        
        // Attendre que Firebase soit prêt
        await this.attendreFirebase();
        
        await this.chargerDonneesAvecSynchro();
        this.setupFirebaseRealtimeListeners();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée');
    }

    // Méthode pour attendre que Firebase soit disponible
    // Méthode pour attendre que Firebase soit disponible
    async attendreFirebase() {
        return new Promise((resolve) => {
            const verifierFirebase = () => {
                // Vérification plus simple et robuste
                if (window.firebaseSync) {
                    console.log('✅ FirebaseSync est disponible');
                    this.firebaseInitialized = true;
                    resolve();
                } else {
                    this.attenteFirebase++;
                    console.log(`⏳ Attente de FirebaseSync... (${this.attenteFirebase})`);
                    if (this.attenteFirebase < 10) {
                        setTimeout(verifierFirebase, 1000);
                    } else {
                        console.error('❌ FirebaseSync non disponible après 10 tentatives');
                        this.afficherMessageSucces('⚠️ Mode hors ligne activé');
                        resolve();
                    }
                }
            };
            verifierFirebase();
        });
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

        // Créer les deux opérations de transfert
        const operationsTransfert = [
            {
                id: Date.now(),
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
                id: Date.now() + 1,
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

        for (const op of operationsTransfert) {
            this.operations.unshift(op);
        }

        await this.sauvegarderDonnees();
        this.afficherMessageSucces('Transfert effectué !');
        
        // Réinitialiser le formulaire
        document.getElementById('transfertForm').reset();
        this.mettreAJourAffichage();
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

        const operationId = parseInt(document.getElementById('editId').value);
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

        this.operations[index] = {
            ...this.operations[index],
            operateur: operateur,
            groupe: groupe,
            typeOperation: typeOperation,
            typeTransaction: typeTransaction,
            caisse: caisse,
            description: descriptionValue,
            montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi
        };

        await this.sauvegarderDonnees();
        this.afficherMessageSucces('Opération modifiée !');
        document.getElementById('editModal').style.display = 'none';
        this.mettreAJourAffichage();
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
                        `<td><input type="checkbox" ${estSelectionnee ? 'checked' : ''} data-opid="${op.id}"></td>` 
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
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})">🗑️</button>
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
                        const opId = parseInt(checkbox.getAttribute('data-opid'));
                        if (e.target.checked) {
                            this.selectedOperations.add(opId);
                        } else {
                            this.selectedOperations.delete(opId);
                        }
                    });
                });
            }

            // Ajouter les écouteurs d'événements pour les cases à cocher individuelles
            const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const opId = parseInt(e.target.getAttribute('data-opid'));
                    this.toggleOperationSelection(opId);
                });
            });
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
                        await firebaseSync.deleteDocument('operations', op.id.toString());
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
            this.suppressionsLocales.clear();
            this.suppressionsEnAttente.clear();
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
        this.suppressionsLocales.clear();
        this.suppressionsEnAttente.clear();
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
        
        if (this.firebaseInitialized) {
            await this.synchroniserAvecFirebase();
        } else {
            console.log('⚠️ Firebase non disponible, utilisation des données locales uniquement');
        }
        
        console.log(`📁 ${this.operations.length} opérations chargées`);
    }

    chargerDepuisLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                this.suppressionsLocales = new Set(data.suppressionsLocales || []);
                this.suppressionsEnAttente = new Set(data.suppressionsEnAttente || []);
                console.log(`💾 ${this.operations.length} opérations chargées du stockage local`);
                console.log(`🚫 ${this.suppressionsLocales.size} suppressions locales chargées`);
                console.log(`⏳ ${this.suppressionsEnAttente.size} suppressions en attente chargées`);
            } catch (error) {
                console.error('❌ Erreur chargement localStorage:', error);
                this.operations = [];
                this.suppressionsLocales = new Set();
                this.suppressionsEnAttente = new Set();
            }
        } else {
            console.log('💾 Aucune donnée locale trouvée');
        }
    }

    async synchroniserAvecFirebase() {
        if (!window.firebaseSync || !this.firebaseInitialized) {
            console.log('⏳ Firebase non disponible pour la synchronisation');
            return;
        }

        if (this.synchronisationEnCours) return;
        this.synchronisationEnCours = true;

        try {
            console.log('🔄 Début de la synchronisation avec Firebase...');
            const operationsFirebase = await firebaseSync.getCollection('operations');
            
            if (operationsFirebase && operationsFirebase.length > 0) {
                console.log(`📡 ${operationsFirebase.length} opérations trouvées sur Firebase`);
                
                let nouvellesOperations = 0;
                let operationsIgnorees = 0;
                let operationsDejaExistantes = 0;

                // PHASE 1: Ajouter les nouvelles opérations de Firebase
                operationsFirebase.forEach(opFirebase => {
                    // Vérifier si l'opération a été supprimée localement
                    if (this.suppressionsLocales.has(opFirebase.id)) {
                        console.log(`🚫 Opération ${opFirebase.id} ignorée (supprimée localement)`);
                        operationsIgnorees++;
                        return;
                    }

                    const indexLocal = this.operations.findIndex(op => op.id === opFirebase.id);
                    
                    if (indexLocal === -1) {
                        // Nouvelle opération à ajouter
                        this.operations.unshift(opFirebase);
                        nouvellesOperations++;
                        console.log(`➕ Nouvelle opération ${opFirebase.id} ajoutée depuis Firebase`);
                    } else {
                        operationsDejaExistantes++;
                    }
                });

                // PHASE 2: Vérifier et confirmer les suppressions en attente
                await this.confirmerSuppressionsEnAttente();

                // Trier par date (plus récent en premier)
                this.operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                this.sauvegarderLocalement();

                console.log(`✅ Synchronisation terminée: ${nouvellesOperations} nouvelles, ${operationsDejaExistantes} existantes, ${operationsIgnorees} ignorées (supprimées)`);
                
                if (nouvellesOperations > 0) {
                    this.afficherMessageSucces(`Synchronisée: ${nouvellesOperations} nouvelles opérations`);
                    this.mettreAJourAffichage();
                }
            } else {
                console.log('ℹ️ Aucune opération trouvée sur Firebase');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation:', error);
            this.afficherMessageSucces('❌ Erreur de synchronisation');
        } finally {
            this.synchronisationEnCours = false;
        }
    }

    // NOUVELLE MÉTHODE: Confirmer les suppressions en attente
    async confirmerSuppressionsEnAttente() {
        if (this.suppressionsEnAttente.size === 0 || !window.firebaseSync) return;

        console.log(`🔍 Vérification de ${this.suppressionsEnAttente.size} suppression(s) en attente...`);
        
        const operationsFirebase = await firebaseSync.getCollection('operations');
        const suppressionsConfirmees = new Set();
        let suppressionsEffectuees = 0;

        for (const opId of this.suppressionsEnAttente) {
            const existeSurFirebase = operationsFirebase.some(op => op.id === opId);
            
            if (!existeSurFirebase) {
                // La suppression est confirmée - l'opération n'existe plus sur Firebase
                suppressionsConfirmees.add(opId);
                console.log(`✅ Suppression confirmée pour l'opération ${opId}`);
            } else {
                // L'opération existe encore sur Firebase - tentative de suppression
                try {
                    await firebaseSync.deleteDocument('operations', opId.toString());
                    suppressionsConfirmees.add(opId);
                    suppressionsEffectuees++;
                    console.log(`🗑️ Opération ${opId} supprimée de Firebase (en attente)`);
                } catch (error) {
                    console.error(`❌ Échec suppression ${opId} (en attente):`, error);
                }
            }
        }

        // Mettre à jour les ensembles de suppression
        suppressionsConfirmees.forEach(opId => {
            this.suppressionsEnAttente.delete(opId);
            this.suppressionsLocales.add(opId); // Marquer comme définitivement supprimée
        });

        console.log(`📊 Suppressions en attente: ${suppressionsEffectuees} effectuées, ${suppressionsConfirmees.size} confirmées`);
    }

    setupFirebaseRealtimeListeners() {
        if (!window.firebaseSync || !this.firebaseInitialized) {
            console.log('⏳ Firebase non disponible pour l\'écoute en temps réel');
            return;
        }

        console.log('👂 Activation écoute temps réel');
        
        this.unsubscribeFirebase = firebaseSync.listenToCollection('operations', (changes, snapshot) => {
            if (changes.length > 0) {
                console.log(`🔄 Synchronisation temps réel: ${changes.length} changement(s)`);
                
                let modifications = 0;
                let suppressionsIgnorees = 0;
                
                changes.forEach(change => {
                    if (this.suppressionsLocales.has(change.id)) {
                        console.log(`🚫 Changement ${change.type} pour ${change.id} ignoré (supprimé localement)`);
                        suppressionsIgnorees++;
                        return;
                    }

                    if (change.type === 'added') {
                        this.ajouterOperationSynchro(change.data);
                        modifications++;
                    } else if (change.type === 'modified') {
                        this.mettreAJourOperationSynchro(change.id, change.data);
                        modifications++;
                    } else if (change.type === 'removed') {
                        // Si Firebase nous signale une suppression, on la confirme
                        this.suppressionsLocales.add(change.id);
                        this.suppressionsEnAttente.delete(change.id);
                        this.supprimerOperationSynchro(change.id);
                        modifications++;
                        console.log(`✅ Suppression confirmée par Firebase: ${change.id}`);
                    }
                });
                
                if (modifications > 0) {
                    this.sauvegarderLocalement();
                    this.mettreAJourAffichage();
                    console.log(`✅ ${modifications} opération(s) synchronisée(s) en temps réel, ${suppressionsIgnorees} ignorées`);
                }
            }
        });
    }

    ajouterOperationSynchro(data) {
        if (this.suppressionsLocales.has(data.id)) return;

        const operation = {
            id: data.id,
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
        if (this.suppressionsLocales.has(operationId)) return;

        const index = this.operations.findIndex(op => op.id === operationId);
        if (index !== -1) {
            this.operations[index] = { ...this.operations[index], ...newData };
        }
    }

    supprimerOperationSynchro(operationId) {
        const ancienNombre = this.operations.length;
        this.operations = this.operations.filter(op => op.id !== operationId);
        if (this.operations.length < ancienNombre) {
            console.log(`🗑️ Opération ${operationId} supprimée par synchronisation`);
        }
    }

    sauvegarderLocalement() {
        const data = {
            operations: this.operations,
            suppressionsLocales: Array.from(this.suppressionsLocales),
            suppressionsEnAttente: Array.from(this.suppressionsEnAttente),
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    async sauvegarderSurFirebase() {
        if (!window.firebaseSync || !this.firebaseInitialized) {
            console.log('⏳ Firebase non disponible pour la sauvegarde');
            return;
        }

        try {
            for (const operation of this.operations) {
                try {
                    const operationsFirebase = await firebaseSync.getCollection('operations');
                    const existeSurFirebase = operationsFirebase.some(op => op.id === operation.id);
                    
                    if (!existeSurFirebase) {
                        await firebaseSync.addDocument('operations', operation);
                        console.log(`💾 Opération ${operation.id} sauvegardée sur Firebase`);
                    } else {
                        await firebaseSync.updateDocument('operations', operation.id.toString(), operation);
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
            // Marquer comme en attente de suppression
            this.suppressionsEnAttente.add(operationId);
            
            // Supprimer localement
            this.operations = this.operations.filter(op => op.id !== operationId);
            this.sauvegarderLocalement();
            
            // Tenter la suppression sur Firebase (mais ne pas bloquer si ça échoue)
            if (window.firebaseSync && this.firebaseInitialized) {
                console.log(`🗑️ Tentative de suppression de l'opération ${operationId} de Firebase...`);
                firebaseSync.deleteDocument('operations', operationId.toString())
                    .then(() => {
                        console.log(`✅ Opération ${operationId} supprimée de Firebase avec succès`);
                        // Confirmer la suppression
                        this.suppressionsEnAttente.delete(operationId);
                        this.suppressionsLocales.add(operationId);
                        this.sauvegarderLocalement();
                    })
                    .catch(error => {
                        console.error(`❌ Erreur suppression Firebase ${operationId}:`, error);
                        // La suppression restera en attente et sera retentée à la prochaine synchronisation
                    });
            }
            
            this.mettreAJourAffichage();
            this.afficherMessageSucces('Opération supprimée');
            
        } catch (error) {
            console.error(`❌ Erreur lors de la suppression de l'opération ${operationId}:`, error);
            this.afficherMessageSucces('❌ Erreur lors de la suppression');
        }
    }

    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) return;

        if (!confirm(`Supprimer ${this.selectedOperations.size} opération(s) ?`)) return;
        
        try {
            // Marquer toutes les opérations sélectionnées comme en attente de suppression
            this.selectedOperations.forEach(opId => {
                this.suppressionsEnAttente.add(opId);
            });
            
            // Supprimer localement
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            this.sauvegarderLocalement();
            
            // Tenter les suppressions sur Firebase (en arrière-plan)
            if (window.firebaseSync && this.firebaseInitialized) {
                console.log(`🗑️ Tentative de suppression de ${this.selectedOperations.size} opérations de Firebase...`);
                
                this.selectedOperations.forEach(opId => {
                    firebaseSync.deleteDocument('operations', opId.toString())
                        .then(() => {
                            console.log(`✅ Opération ${opId} supprimée de Firebase`);
                            this.suppressionsEnAttente.delete(opId);
                            this.suppressionsLocales.add(opId);
                            this.sauvegarderLocalement();
                        })
                        .catch(error => {
                            console.error(`❌ Erreur suppression ${opId}:`, error);
                        });
                });
            }
            
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.mettreAJourAffichage();
            this.afficherMessageSucces(`${this.selectedOperations.size} opération(s) supprimée(s)`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la suppression multiple:', error);
            this.afficherMessageSucces('❌ Erreur lors de la suppression');
        }
    }

    // MÉTHODE POUR FORCER LA SYNCHRONISATION MANUELLE
    async forcerSynchronisation() {
        console.log('🔄 Forçage de la synchronisation manuelle...');
        this.afficherMessageSucces('Synchronisation en cours...');
        
        await this.synchroniserAvecFirebase();
        await this.sauvegarderSurFirebase();
        
        this.afficherMessageSucces('✅ Synchronisation terminée');
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
            if (this.caisses[op.caisse] !== undefined) {
                this.caisses[op.caisse] += op.montant;
            }
        });
    }

    creerCarteCaisse(cleCaisse, nomCaisse) {
        const solde = this.caisses[cleCaisse] || 0;
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
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})">🗑️</button>
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

        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        await this.sauvegarderDonnees();
        this.afficherMessageSucces('Opération enregistrée !');
        this.resetForm();
        this.mettreAJourAffichage();
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

