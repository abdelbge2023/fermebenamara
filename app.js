// app.js - Application complète avec synchronisation automatique corrigée
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
        this.suppressionsLocales = new Set(); // Pour suivre les suppressions locales

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.chargerDonneesAvecSynchro();
        this.setupFirebaseRealtimeListeners();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée avec synchronisation automatique');
    }

    // CHARGEMENT AVEC SYNCHRONISATION AUTOMATIQUE
    async chargerDonneesAvecSynchro() {
        console.log('📥 Chargement automatique des données...');
        
        // 1. Charger depuis le localStorage (instantané)
        this.chargerDepuisLocalStorage();
        
        // 2. Synchroniser avec Firebase en arrière-plan
        await this.synchroniserAvecFirebase();
        
        console.log(`📁 ${this.operations.length} opérations chargées`);
    }

    // CHARGEMENT LOCAL (RAPIDE)
    chargerDepuisLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                this.suppressionsLocales = new Set(data.suppressionsLocales || []);
                console.log(`💾 ${this.operations.length} opérations chargées du stockage local`);
                console.log(`🗑️ ${this.suppressionsLocales.size} suppressions locales mémorisées`);
            } catch (error) {
                console.error('❌ Erreur chargement localStorage:', error);
                this.operations = [];
                this.suppressionsLocales = new Set();
            }
        }
    }

    // SYNCHRONISATION AUTOMATIQUE AVEC FIREBASE
    async synchroniserAvecFirebase() {
        if (!window.firebaseSync) {
            console.log('⏳ Attente de FirebaseSync pour synchronisation automatique...');
            setTimeout(() => this.synchroniserAvecFirebase(), 2000);
            return;
        }

        if (this.synchronisationEnCours) {
            console.log('⏳ Synchronisation déjà en cours...');
            return;
        }

        this.synchronisationEnCours = true;
        console.log('🔄 Début de la synchronisation automatique...');

        try {
            // 1. Récupérer les données de Firebase
            const operationsFirebase = await firebaseSync.getCollection('operations');
            
            if (operationsFirebase && operationsFirebase.length > 0) {
                console.log(`📡 ${operationsFirebase.length} opérations disponibles sur Firebase`);
                
                let nouvellesOperations = 0;
                let operationsMiseAJour = 0;
                let operationsIgnorees = 0;

                // 2. Fusionner les données en ignorant les suppressions locales
                operationsFirebase.forEach(opFirebase => {
                    // Vérifier si cette opération a été supprimée localement
                    if (this.suppressionsLocales.has(opFirebase.id)) {
                        operationsIgnorees++;
                        console.log(`🚫 Opération ${opFirebase.id} ignorée (supprimée localement)`);
                        return;
                    }

                    const indexLocal = this.operations.findIndex(op => op.id === opFirebase.id);
                    
                    if (indexLocal === -1) {
                        // Nouvelle opération depuis Firebase
                        this.operations.unshift(opFirebase);
                        nouvellesOperations++;
                    } else {
                        // Vérifier si l'opération Firebase est plus récente
                        const dateLocale = new Date(this.operations[indexLocal].timestamp || 0);
                        const dateFirebase = new Date(opFirebase.timestamp || 0);
                        
                        if (dateFirebase > dateLocale) {
                            // Mettre à jour avec la version Firebase
                            this.operations[indexLocal] = opFirebase;
                            operationsMiseAJour++;
                        }
                    }
                });

                // 3. Trier par date
                this.operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                // 4. Sauvegarder localement
                this.sauvegarderLocalement();

                console.log(`✅ Synchronisation: ${nouvellesOperations} nouvelles, ${operationsMiseAJour} mises à jour, ${operationsIgnorees} ignorées`);
                
                if (nouvellesOperations > 0 || operationsMiseAJour > 0) {
                    this.afficherMessageSucces(`Synchronisée: ${nouvellesOperations} nouvelles opérations`);
                    this.mettreAJourAffichage();
                }
                
            } else {
                console.log('ℹ️ Aucune donnée sur Firebase');
            }
            
            this.firebaseInitialized = true;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation automatique:', error);
        } finally {
            this.synchronisationEnCours = false;
        }
    }

    // ÉCOUTEURS TEMPS RÉEL POUR SYNCHRO AUTOMATIQUE
    setupFirebaseRealtimeListeners() {
        if (!window.firebaseSync) {
            console.log('⏳ Attente de FirebaseSync pour écoute temps réel...');
            setTimeout(() => this.setupFirebaseRealtimeListeners(), 2000);
            return;
        }

        console.log('👂 Activation de l écoute temps réel pour synchronisation automatique');
        
        // Écouter les changements en temps réel sur Firebase
        this.unsubscribeFirebase = firebaseSync.listenToCollection('operations', (changes, snapshot) => {
            if (changes.length > 0) {
                console.log(`🔄 Synchronisation temps réel: ${changes.length} changement(s)`);
                
                let modifications = 0;
                let suppressionsBloquees = 0;
                
                changes.forEach(change => {
                    // Vérifier si c'est une suppression que NOUS avons initiée
                    if (change.type === 'removed' && firebaseSync.isSuppressionEnCours(change.id)) {
                        console.log(`🔕 Suppression ${change.id} ignorée (initiée localement)`);
                        suppressionsBloquees++;
                        return;
                    }

                    // Vérifier si l'opération a été supprimée localement
                    if (this.suppressionsLocales.has(change.id)) {
                        console.log(`🚫 Changement ${change.type} sur ${change.id} ignoré (supprimé localement)`);
                        suppressionsBloquees++;
                        return;
                    }

                    if (change.type === 'added') {
                        this.ajouterOperationSynchro(change.data);
                        modifications++;
                    } else if (change.type === 'modified') {
                        this.mettreAJourOperationSynchro(change.id, change.data);
                        modifications++;
                    } else if (change.type === 'removed') {
                        console.log(`🗑️ Suppression ${change.id} détectée depuis Firebase`);
                        this.supprimerOperationSynchro(change.id);
                        modifications++;
                    }
                });
                
                if (modifications > 0) {
                    this.sauvegarderLocalement();
                    this.mettreAJourAffichage();
                    console.log(`✅ ${modifications} opération(s) synchronisée(s) en temps réel`);
                }
                
                if (suppressionsBloquees > 0) {
                    console.log(`🔕 ${suppressionsBloquees} changement(s) bloqué(s) (suppressions locales)`);
                }
            }
        });
    }

    // AJOUT AUTOMATIQUE DEPUIS LA SYNCHRO
    ajouterOperationSynchro(data) {
        // Vérifier si l'opération n'a pas été supprimée localement
        if (this.suppressionsLocales.has(data.id)) {
            console.log(`🚫 Opération ${data.id} ignorée (supprimée localement)`);
            return;
        }

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

        // Vérifier si l'opération n'existe pas déjà
        const existeDeja = this.operations.some(op => op.id === operation.id);
        if (!existeDeja) {
            this.operations.unshift(operation);
            console.log(`➕ Opération ${operation.id} ajoutée par synchronisation automatique`);
        }
    }

    // MISE À JOUR AUTOMATIQUE DEPUIS LA SYNCHRO
    mettreAJourOperationSynchro(operationId, newData) {
        // Vérifier si l'opération n'a pas été supprimée localement
        if (this.suppressionsLocales.has(operationId)) {
            console.log(`🚫 Mise à jour ${operationId} ignorée (supprimée localement)`);
            return;
        }

        const index = this.operations.findIndex(op => op.id === operationId);
        if (index !== -1) {
            this.operations[index] = {
                ...this.operations[index],
                ...newData
            };
            console.log(`✏️ Opération ${operationId} mise à jour par synchronisation automatique`);
        }
    }

    // SUPPRESSION AUTOMATIQUE DEPUIS LA SYNCHRO
    supprimerOperationSynchro(operationId) {
        // Vérifier si la suppression n'a pas été initiée localement
        if (firebaseSync.isSuppressionEnCours(operationId)) {
            console.log(`🔕 Suppression ${operationId} ignorée (initiée localement)`);
            return;
        }

        const ancienNombre = this.operations.length;
        this.operations = this.operations.filter(op => op.id !== operationId);
        if (this.operations.length < ancienNombre) {
            console.log(`🗑️ Opération ${operationId} supprimée par synchronisation automatique`);
        }
    }

    // SAUVEGARDE AVEC SYNCHRO AUTOMATIQUE
    async sauvegarderDonnees() {
        // Sauvegarder localement immédiatement
        this.sauvegarderLocalement();
        
        // Synchroniser avec Firebase en arrière-plan
        this.sauvegarderSurFirebase();
    }

    // SAUVEGARDE LOCALE
    sauvegarderLocalement() {
        const data = {
            operations: this.operations,
            suppressionsLocales: Array.from(this.suppressionsLocales),
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
        console.log('💾 Données sauvegardées localement');
    }

    // SAUVEGARDE AUTOMATIQUE SUR FIREBASE
    async sauvegarderSurFirebase() {
        if (!window.firebaseSync) {
            console.log('⚠️ Firebase non disponible, synchronisation différée');
            return;
        }

        try {
            console.log('📤 Synchronisation automatique vers Firebase...');
            
            // Synchroniser chaque opération
            for (const operation of this.operations) {
                try {
                    // Vérifier si l'opération existe déjà sur Firebase
                    const operationsFirebase = await firebaseSync.getCollection('operations');
                    const existeSurFirebase = operationsFirebase.some(op => op.id === operation.id);
                    
                    if (!existeSurFirebase) {
                        // Ajouter l'opération à Firebase
                        await firebaseSync.addDocument('operations', operation);
                        console.log(`✅ Opération ${operation.id} ajoutée à Firebase`);
                    } else {
                        // Mettre à jour l'opération sur Firebase
                        await firebaseSync.updateDocument('operations', operation.id, operation);
                        console.log(`✅ Opération ${operation.id} mise à jour sur Firebase`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur synchro opération ${operation.id}:`, error);
                }
            }
            
            console.log('✅ Synchronisation automatique vers Firebase terminée');
        } catch (error) {
            console.error('❌ Erreur sauvegarde automatique Firebase:', error);
        }
    }

    // MISE À JOUR AFFICHAGE AUTOMATIQUE
    mettreAJourAffichage() {
        this.updateStats();
        if (this.caisseSelectionnee) {
            this.afficherDetailsCaisse(this.caisseSelectionnee);
        } else {
            this.afficherHistorique(this.currentView);
        }
    }

    // MÉTHODE SUPPRIMER OPÉRATION CORRIGÉE (suppression permanente)
    async supprimerOperation(operationId) {
        console.log('🔧 Supprimer opération:', operationId);
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ? Cette action est définitive.')) {
            const operationASupprimer = this.operations.find(op => op.id === operationId);
            
            if (!operationASupprimer) {
                alert('❌ Opération non trouvée');
                return;
            }
            
            // 1. Ajouter à la liste des suppressions locales (EMPÊCHE LA RÉSURRECTION)
            this.suppressionsLocales.add(operationId);
            console.log(`📝 Opération ${operationId} marquée comme supprimée localement`);
            
            // 2. Supprimer localement
            this.operations = this.operations.filter(op => op.id !== operationId);
            
            // 3. Sauvegarder localement (inclut la liste des suppressions)
            this.sauvegarderLocalement();
            
            // 4. Supprimer de Firebase
            if (window.firebaseSync) {
                try {
                    await firebaseSync.deleteDocument('operations', operationId);
                    console.log(`✅ Opération ${operationId} supprimée de Firebase`);
                } catch (error) {
                    console.error(`❌ Erreur suppression Firebase ${operationId}:`, error);
                }
            }
            
            this.mettreAJourAffichage();
            this.afficherMessageSucces('Opération supprimée définitivement');
        }
    }

    // MÉTHODE SUPPRIMER OPÉRATIONS SÉLECTIONNÉES CORRIGÉE
    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('❌ Aucune opération sélectionnée');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) définitivement ?`)) {
            // 1. Marquer toutes les opérations comme supprimées localement
            this.selectedOperations.forEach(opId => {
                this.suppressionsLocales.add(opId);
            });
            
            console.log(`📝 ${this.selectedOperations.size} opérations marquées comme supprimées localement`);
            
            // 2. Supprimer localement
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            
            // 3. Sauvegarder localement
            this.sauvegarderLocalement();
            
            // 4. Supprimer de Firebase
            if (window.firebaseSync) {
                for (const opId of this.selectedOperations) {
                    try {
                        await firebaseSync.deleteDocument('operations', opId);
                    } catch (error) {
                        console.error(`❌ Erreur suppression Firebase ${opId}:`, error);
                    }
                }
            }
            
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.mettreAJourAffichage();
            
            this.afficherMessageSucces(`${this.selectedOperations.size} opération(s) supprimée(s) définitivement`);
        }
    }

    // MÉTHODE POUR VIDER LES SUPPRESSIONS LOCALES (en cas de besoin)
    viderSuppressionsLocales() {
        if (confirm('Vider l historique des suppressions locales ? Les opérations supprimées pourront réapparaître.')) {
            this.suppressionsLocales.clear();
            this.sauvegarderLocalement();
            this.afficherMessageSucces('Historique des suppressions vidé');
            this.synchroniserAvecFirebase(); // Resynchroniser
        }
    }

    // ... (TOUTES LES AUTRES MÉTHODES RESTENT IDENTIQUES)
    // [Les méthodes updateStats, afficherHistorique, etc. restent les mêmes]

    // MÉTHODE AJOUTER OPÉRATION AVEC SYNCHRO AUTO
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

        // Ajouter aux opérations locales
        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        // Sauvegarder automatiquement (local + Firebase)
        await this.sauvegarderDonnees();
        this.afficherMessageSucces('Opération enregistrée et synchronisée !');
        this.resetForm();
        this.mettreAJourAffichage();
    }

    // MÉTHODE MODIFIER OPÉRATION AVEC SYNCHRO AUTO
    async modifierOperation(e) {
        e.preventDefault();
        console.log('🔧 Modification opération');

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
        this.fermerModal();

        // Sauvegarder et synchroniser automatiquement
        await this.sauvegarderDonnees();
        this.mettreAJourAffichage();
        this.afficherMessageSucces('✅ Opération modifiée et synchronisée !');
    }

    // MÉTHODE EFFECTUER TRANSFERT AVEC SYNCHRO AUTO
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
        }

        // Sauvegarder et synchroniser automatiquement
        await this.sauvegarderDonnees();
        this.afficherMessageSucces('Transfert effectué et synchronisé !');
        document.getElementById('transfertForm').reset();
        this.mettreAJourAffichage();
    }

    // ... (TOUTES LES AUTRES MÉTHODES RESTENT IDENTIQUES)
    // [updateStats, afficherDetailsCaisse, creerTableauDetailsCaisse, etc.]

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
