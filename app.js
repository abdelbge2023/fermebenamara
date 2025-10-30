// app.js - Version modifiée pour Firebase
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
        const { db, collection, getDocs, query, orderBy } = await import('./firebase.js');
        
        console.log('📡 Connexion à Firebase...');
        
        // Test de connexion avec timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout Firebase')), 10000)
        );
        
        const firestorePromise = getDocs(query(collection(db, 'operations'), orderBy('timestamp', 'desc')));
        
        const querySnapshot = await Promise.race([firestorePromise, timeoutPromise]);
        
        this.operations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            this.operations.push({
                firebaseId: doc.id,
                ...data
            });
        });
        
        console.log(`✅ ${this.operations.length} opérations chargées depuis Firebase`);
        this.initialisationFirebase = true;
        
    } catch (error) {
        console.error('❌ Erreur Firebase, utilisation du localStorage:', error);
        this.loadFromLocalStorage();
        this.initialisationFirebase = false;
        
        // Afficher un message à l'utilisateur
        this.afficherMessageSucces('Mode hors ligne activé - Données locales');
    }
}
        
        console.log(`✅ ${this.operations.length} opérations chargées depuis Firebase`);
        this.initialisationFirebase = true;
        
    } catch (error) {
        console.error('❌ Erreur Firebase, utilisation du localStorage:', error);
        this.loadFromLocalStorage();
        this.initialisationFirebase = false;
    }
}

    async sauvegarderFirebase() {
        if (!this.initialisationFirebase) return;
        
        try {
            const { collection, addDoc, updateDoc, doc } = await import('./firebase.js');
            
            for (const operation of this.operations) {
                if (!operation.firebaseId) {
                    // Nouvelle opération
                    const { db: firebaseDb, collection, addDoc } = await import('./firebase.js');
                    const docRef = await addDoc(collection(firebaseDb, 'operations'), operation);
                    operation.firebaseId = docRef.id;
                } else {
                    // Mettre à jour l'opération existante
                    await updateDoc(doc(db, 'operations', operation.firebaseId), operation);
                }
            }
        } catch (error) {
            console.error('Erreur sauvegarde Firebase:', error);
            // Fallback vers localStorage
            this.sauvegarderLocal();
        }
    }
async ajouterOperation(e) {
    e.preventDefault();
    console.log('Bouton Enregistrer cliqué !');

    const operateur = document.getElementById('operateur');
    const groupe = document.getElementById('groupe');
    const typeOperation = document.getElementById('typeOperation');
    const typeTransaction = document.getElementById('typeTransaction');
    const caisse = document.getElementById('caisse');
    const montant = document.getElementById('montant');
    const description = document.getElementById('description');

    // Vérification que tous les éléments existent
    if (!operateur || !groupe || !typeOperation || !typeTransaction || !caisse || !montant || !description) {
        alert('Erreur: Éléments du formulaire non trouvés');
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
    

    async supprimerOperation(operationId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            const operation = this.operations.find(op => op.id === operationId);
            
            // Supprimer de Firebase si l'opération y existe
            if (operation && operation.firebaseId && this.initialisationFirebase) {
                try {
                    const { doc, deleteDoc } = await import('./firebase.js');
                    await deleteDoc(doc(db, 'operations', operation.firebaseId));
                } catch (error) {
                    console.error('Erreur suppression Firebase:', error);
                }
            }
            
            // Supprimer localement
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
            
            // Supprimer de Firebase
            if (this.initialisationFirebase) {
                const { doc, deleteDoc } = await import('./firebase.js');
                for (const opId of this.selectedOperations) {
                    const operation = this.operations.find(op => op.id === opId);
                    if (operation && operation.firebaseId) {
                        try {
                            await deleteDoc(doc(db, 'operations', operation.firebaseId));
                        } catch (error) {
                            console.error('Erreur suppression Firebase:', error);
                        }
                    }
                }
            }
            
            // Supprimer localement
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
                description: `Transfert vers ${this.formaterCaisse(caisseDestinationValue)}: ${descriptionValue}`,
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
                description: `Transfert de ${this.formaterCaisse(caisseSourceValue)}: ${descriptionValue}`,
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

    // Méthodes de sauvegarde locale (fallback)
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
                console.log(`📁 ${this.operations.length} opérations chargées du localStorage`);
            } catch (error) {
                console.error('Erreur chargement localStorage:', error);
                this.operations = [];
            }
        }
    }

    // AJOUTER: Méthodes pour les boutons de migration
    setupEventListeners() {
        // ... (votre code existant)

        // Ajouter les boutons Firebase
        this.ajouterBoutonsFirebase();
    }

    ajouterBoutonsFirebase() {
        const header = document.querySelector('header');
        
        const divBoutons = document.createElement('div');
        divBoutons.style.marginTop = '15px';
        divBoutons.style.display = 'flex';
        divBoutons.style.gap = '10px';
        divBoutons.style.justifyContent = 'center';
        divBoutons.style.flexWrap = 'wrap';
        
        const btnMigrer = document.createElement('button');
        btnMigrer.textContent = '🔄 Migrer vers Firebase';
        btnMigrer.className = 'btn-warning';
        btnMigrer.onclick = async () => {
            const { migrerVersFirebase } = await import('./migration.js');
            await migrerVersFirebase();
            // Recharger les données après migration
            await this.initialiserFirebase();
            this.updateStats();
            this.afficherHistorique(this.currentView);
        };
        
        const btnVerifier = document.createElement('button');
        btnVerifier.textContent = '📊 Vérifier Firebase';
        btnVerifier.className = 'btn-info';
        btnVerifier.onclick = async () => {
            const { verifierDonneesFirebase } = await import('./migration.js');
            await verifierDonneesFirebase();
        };
        
        divBoutons.appendChild(btnMigrer);
        divBoutons.appendChild(btnVerifier);
        header.appendChild(divBoutons);
    }

    // ... (LE RESTE DE VOTRE CODE EXISTANT RESTE IDENTIQUE)
    // calculerSoldes(), updateStats(), afficherHistorique(), etc.

    calculerRepartition() {
        // Votre code existant
    }

    toggleEditMode(enable = null) {
        // Votre code existant
    }

    selectionnerOperation(operationId, checked) {
        // Votre code existant
    }

    calculerSoldes() {
        // Votre code existant
    }

    updateStats() {
        // Votre code existant
    }

    creerCarteCaisse(cleCaisse, nomCaisse) {
        // Votre code existant
    }

    afficherHistorique(vue = 'global') {
        // Votre code existant
    }

    ouvrirModalModification(operationId) {
        // Votre code existant
    }

    fermerModal() {
        // Votre code existant
    }

    getTitreVue(vue) {
        // Votre code existant
    }

    formaterDate(dateStr) {
        // Votre code existant
    }

    formaterOperateur(operateur) {
        // Votre code existant
    }

    formaterGroupe(groupe) {
        // Votre code existant
    }

    formaterTypeOperation(type) {
        // Votre code existant
    }

    formaterTypeTransaction(type) {
        // Votre code existant
    }

    formaterCaisse(caisse) {
        // Votre code existant
    }

    resetForm() {
        // Votre code existant
    }

    afficherMessageSucces(message) {
        // Votre code existant
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    console.log('Application Gestion Ferme avec Firebase initialisée !');
});


