// app.js - VERSION AVEC SYNCHRONISATION FIREBASE
class GestionFerme {
    constructor() {
        this.operations = [];
        this.modeEdition = false;
        this.operationsSelectionnees = new Set();
        this.db = null;
        this.isOnline = false;
        this.syncStatus = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de l\'application...');
        this.setupEventListeners();
        await this.initFirebase();
        await this.loadData();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application initialisée avec succès !');
    }

    async initFirebase() {
        try {
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                this.updateSyncStatus('❌ Firebase non disponible', 'error');
                this.isOnline = false;
                return;
            }
            
            this.db = firebase.firestore();
            this.isOnline = true;
            this.updateSyncStatus('✅ Connecté au cloud', 'success');
            
            // Démarrer l'écoute en temps réel
            this.setupRealtimeListener();
            
        } catch (error) {
            console.warn('❌ Firebase non disponible, mode hors ligne activé:', error);
            this.isOnline = false;
            this.updateSyncStatus('🔴 Mode hors ligne', 'warning');
        }
    }

    updateSyncStatus(message, type = 'info') {
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.background = 
                type === 'success' ? '#d4edda' : 
                type === 'error' ? '#f8d7da' : 
                type === 'warning' ? '#fff3cd' : '#d1ecf1';
            statusElement.style.color = 
                type === 'success' ? '#155724' : 
                type === 'error' ? '#721c24' : 
                type === 'warning' ? '#856404' : '#0c5460';
        }
    }

    // MÉTHODE UNIFIÉE POUR CHARGER LES DONNÉES
    async loadData() {
        try {
            if (this.isOnline) {
                await this.loadFromFirebase();
            } else {
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            this.loadFromLocalStorage();
        }
    }

    // MÉTHODE UNIFIÉE POUR SAUVEGARDER
    async sauvegarder() {
        try {
            // Sauvegarder localement d'abord
            this.sauvegarderLocal();
            
            // Puis synchroniser avec Firebase si en ligne
            if (this.isOnline) {
                await this.sauvegarderFirebase();
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }

    // CHARGEMENT DEPUIS FIREBASE
    async loadFromFirebase() {
        try {
            this.updateSyncStatus('🔄 Chargement depuis le cloud...', 'info');
            const doc = await this.db.collection('fermeData').doc('operations').get();
            
            if (doc.exists) {
                const data = doc.data();
                this.operations = data.operations || [];
                console.log('☁️ ' + this.operations.length + ' opérations chargées depuis Firebase');
                
                // Synchroniser le localStorage
                this.sauvegarderLocal();
                this.updateSyncStatus('✅ Données synchronisées', 'success');
            } else {
                // Si pas de données sur Firebase, charger du localStorage
                this.loadFromLocalStorage();
                // Et sauvegarder sur Firebase
                await this.sauvegarderFirebase();
            }
        } catch (error) {
            console.error('Erreur Firebase load:', error);
            this.updateSyncStatus('❌ Erreur synchronisation', 'error');
            throw error;
        }
    }

    // SAUVEGARDE SUR FIREBASE
    async sauvegarderFirebase() {
        try {
            const data = {
                operations: this.operations,
                lastUpdate: new Date().toISOString(),
                totalOperations: this.operations.length,
                device: navigator.userAgent,
                syncTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('fermeData').doc('operations').set(data);
            console.log('💾 Données sauvegardées sur Firebase');
            this.updateSyncStatus('✅ Données sauvegardées', 'success');
        } catch (error) {
            console.error('Erreur Firebase save:', error);
            this.updateSyncStatus('❌ Erreur sauvegarde cloud', 'error');
            throw error;
        }
    }

    // ÉCOUTE DES CHANGEMENTS EN TEMPS RÉEL
    setupRealtimeListener() {
        if (!this.isOnline) return;
        
        this.db.collection('fermeData').doc('operations')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const remoteUpdate = new Date(data.lastUpdate).getTime();
                    const localData = JSON.parse(localStorage.getItem('gestion_ferme_data') || '{}');
                    const localUpdate = new Date(localData.lastUpdate || 0).getTime();
                    
                    // Si les données distantes sont plus récentes
                    if (remoteUpdate > localUpdate) {
                        console.log('🔄 Synchronisation depuis Firebase...');
                        this.operations = data.operations || [];
                        this.sauvegarderLocal();
                        this.updateStats();
                        this.afficherHistorique('global');
                        this.afficherMessageSucces('Données synchronisées !');
                    }
                }
            }, (error) => {
                console.error('Erreur écoute temps réel:', error);
            });
    }

    // SYNCHRONISATION MANUELLE
    async synchroniserManuellement() {
        try {
            this.updateSyncStatus('🔄 Synchronisation en cours...', 'info');
            await this.loadFromFirebase();
            this.updateStats();
            this.afficherHistorique('global');
            this.afficherMessageSucces('Synchronisation réussie !');
        } catch (error) {
            this.afficherMessageErreur('Erreur de synchronisation');
        }
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

        // Bouton synchronisation
        const btnSync = document.getElementById('btnSync');
        if (btnSync) {
            btnSync.addEventListener('click', () => this.synchroniserManuellement());
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

        // BOUTONS EXPORT/IMPORT
        setTimeout(() => {
            this.setupExportImportButtons();
        }, 100);

        console.log('✅ Tous les événements configurés');
    }

    // MÉTHODES EXISTANTES (conservées mais modifiées pour utiliser sauvegarder())
    async ajouterOperation(e) {
        e.preventDefault();
        console.log('✅ Formulaire soumis');

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

        // Sauvegarder (local + cloud)
        await this.sauvegarder();

        // Mettre à jour l'interface
        this.afficherMessageSucces('Opération enregistrée avec succès !');
        this.resetForm();
        this.updateStats();
        this.afficherHistorique('global');
    }

    async effectuerTransfert(e) {
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

        // Sauvegarder (local + cloud)
        await this.sauvegarder();

        // Mettre à jour l'interface
        this.afficherMessageSucces('Transfert effectué avec succès !');
        document.getElementById('transfertForm').reset();
        this.updateStats();
        this.afficherHistorique('global');
    }

    async supprimerOperation(id) {
        try {
            if (confirm('Voulez-vous vraiment supprimer cette opération ?')) {
                this.operations = this.operations.filter(op => op.id !== id);
                await this.sauvegarder();
                this.afficherMessageSucces('Opération supprimée !');
                this.updateStats();
                this.afficherHistorique('global');
            }
        } catch (error) {
            console.error('Erreur supprimerOperation:', error);
        }
    }

    async supprimerOperationsSelectionnees() {
        try {
            if (this.operationsSelectionnees.size === 0) {
                this.afficherMessageErreur('Aucune opération sélectionnée');
                return;
            }

            if (confirm(`Voulez-vous vraiment supprimer ${this.operationsSelectionnees.size} opération(s) ?`)) {
                this.operations = this.operations.filter(op => !this.operationsSelectionnees.has(op.id));
                await this.sauvegarder();
                this.afficherMessageSucces(`${this.operationsSelectionnees.size} opération(s) supprimée(s) !`);
                this.updateStats();
                this.operationsSelectionnees.clear();
                this.toggleEditMode(false);
            }
        } catch (error) {
            console.error('Erreur supprimerOperationsSelectionnees:', error);
        }
    }

    async modifierOperation(e) {
        e.preventDefault();
        
        try {
            const id = parseInt(document.getElementById('editId').value);
            const operateur = document.getElementById('editOperateur').value;
            const groupe = document.getElementById('editGroupe').value;
            const typeOperation = document.getElementById('editTypeOperation').value;
            const typeTransaction = document.getElementById('editTypeTransaction').value;
            const caisse = document.getElementById('editCaisse').value;
            const montant = parseFloat(document.getElementById('editMontant').value);
            const description = document.getElementById('editDescription').value;

            const operationIndex = this.operations.findIndex(op => op.id === id);
            if (operationIndex !== -1) {
                this.operations[operationIndex] = {
                    ...this.operations[operationIndex],
                    operateur,
                    groupe,
                    typeOperation,
                    typeTransaction,
                    caisse,
                    description,
                    montant: typeTransaction === 'frais' ? -montant : montant
                };

                await this.sauvegarder();
                this.afficherMessageSucces('Opération modifiée !');
                this.fermerModal();
                this.updateStats();
                this.afficherHistorique('global');
            }
        } catch (error) {
            console.error('Erreur modifierOperation:', error);
        }
    }

    // MÉTHODES EXISTANTES (inchangées)
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gestion_ferme_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('📁 ' + this.operations.length + ' opérations chargées du localStorage');
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
        } catch (error) {
            console.error('Erreur sauvegarde localStorage:', error);
        }
    }

    // ... (toutes les autres méthodes restent inchangées)
    // calculerSoldeCaisse, calculerRepartition, resetForm, afficherMessageSucces, 
    // afficherMessageErreur, afficherNotification, updateStats, afficherHistorique,
    // setupCheckboxListeners, updateBoutonsSuppression, toggleEditMode, editerOperation,
    // fermerModal, formaterDate, formaterOperateur, formaterGroupe, formaterTypeOperation,
    // formaterTypeTransaction, formaterCaisse, setupExportImportButtons, exporterDonnees, importerDonnees

    // CONFIGURATION SPÉCIALE POUR LES BOUTONS EXPORT/IMPORT
    setupExportImportButtons() {
        console.log('🔧 Configuration des boutons export/import...');
        
        const btnExport = document.getElementById('btnExport');
        if (btnExport) {
            btnExport.addEventListener('click', (e) => {
                e.preventDefault();
                this.exporterDonnees();
            });
            console.log('✅ Bouton export configuré');
        } else {
            console.log('❌ Bouton export non trouvé - vérifiez l\'HTML');
        }

        const inputImport = document.getElementById('inputImport');
        if (inputImport) {
            inputImport.addEventListener('change', (e) => this.importerDonnees(e));
            console.log('✅ Input import configuré');
        } else {
            console.log('❌ Input import non trouvé - vérifiez l\'HTML');
        }
    }

    // MÉTHODE EXPORT
    exporterDonnees() {
        console.log('📤 Début de l\'export des données...');
        
        if (this.operations.length === 0) {
            this.afficherMessageErreur('Aucune donnée à exporter');
            return;
        }

        try {
            const data = {
                operations: this.operations,
                lastUpdate: new Date().toISOString(),
                totalOperations: this.operations.length,
                totalMontant: this.operations.reduce((sum, op) => sum + op.montant, 0),
                exportDate: new Date().toLocaleString('fr-FR'),
                version: '1.0'
            };
            
            // Créer le contenu JSON
            const dataStr = JSON.stringify(data, null, 2);
            
            // Créer un blob
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Créer et cliquer sur le lien de téléchargement
            const a = document.createElement('a');
            a.href = url;
            a.download = `gestion_ferme_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Nettoyer l'URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            this.afficherMessageSucces(`✅ Données exportées (${this.operations.length} opérations) !`);
            console.log('📤 Export réussi');
            
        } catch (error) {
            console.error('❌ Erreur export:', error);
            this.afficherMessageErreur('Erreur lors de l\'export');
        }
    }

    // MÉTHODE IMPORT
    importerDonnees(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.operations && Array.isArray(data.operations)) {
                    const nbOperations = data.operations.length;
                    
                    if (confirm(`Voulez-vous importer ${nbOperations} opérations ?\n\nCela remplacera les ${this.operations.length} opérations actuelles.`)) {
                        this.operations = data.operations;
                        await this.sauvegarder();
                        this.updateStats();
                        this.afficherHistorique('global');
                        this.afficherMessageSucces(`${nbOperations} opérations importées avec succès !`);
                    }
                } else {
                    this.afficherMessageErreur('Format de fichier invalide');
                }
            } catch (error) {
                console.error('Erreur import:', error);
                this.afficherMessageErreur('Fichier JSON invalide');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}

// Initialisation
let app;
if (!window.appInitialized) {
    document.addEventListener('DOMContentLoaded', function() {
        if (!app) {
            try {
                app = new GestionFerme();
                window.appInitialized = true;
                window.gestionFermeApp = app;
                window.app = app;
                console.log('🚀 Application Gestion Ferme avec synchronisation démarrée !');
            } catch (error) {
                console.error('❌ Erreur démarrage:', error);
            }
        }
    });
}
