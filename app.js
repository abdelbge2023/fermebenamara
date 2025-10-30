// app.js - Version corrigée avec gestion d'erreurs
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
        this.firebaseDisponible = false;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée avec succès');
    }

    async chargerDonnees() {
        // Essayer Firebase d'abord
        try {
            await this.chargerDepuisFirebase();
            this.firebaseDisponible = true;
            console.log('✅ Données chargées depuis Firebase');
        } catch (error) {
            console.log('❌ Firebase non disponible, utilisation du localStorage');
            this.chargerDepuisLocalStorage();
            this.firebaseDisponible = false;
        }
    }

    async chargerDepuisFirebase() {
        try {
            const { db, collection, getDocs, query, orderBy } = await import('./firebase.js');
            
            if (!db) {
                throw new Error('Firebase non configuré');
            }

            const querySnapshot = await getDocs(query(collection(db, 'operations'), orderBy('timestamp', 'desc')));
            
            this.operations = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.operations.push({
                    firebaseId: doc.id,
                    ...data
                });
            });
            
            console.log(`📡 ${this.operations.length} opérations chargées depuis Firebase`);
            
        } catch (error) {
            console.error('Erreur chargement Firebase:', error);
            throw error; // Propager l'erreur
        }
    }

    chargerDepuisLocalStorage() {
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

    async sauvegarderDonnees() {
        // Sauvegarder dans localStorage en premier
        this.sauvegarderLocal();
        
        // Sauvegarder dans Firebase si disponible
        if (this.firebaseDisponible) {
            await this.sauvegarderFirebase();
        }
    }

    async sauvegarderFirebase() {
        if (!this.firebaseDisponible) return;
        
        try {
            const { db, collection, addDoc, updateDoc, doc } = await import('./firebase.js');
            
            for (const operation of this.operations) {
                if (!operation.firebaseId) {
                    // Nouvelle opération
                    const docRef = await addDoc(collection(db, 'operations'), operation);
                    operation.firebaseId = docRef.id;
                    console.log('➕ Opération ajoutée à Firebase:', docRef.id);
                } else {
                    // Mettre à jour l'opération existante
                    await updateDoc(doc(db, 'operations', operation.firebaseId), operation);
                }
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
            this.firebaseDisponible = false;
        }
    }

    sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    // MÉTHODES PRINCIPALES (garder votre code existant)
    async ajouterOperation(e) {
        e.preventDefault();

        // VOTRE CODE EXISTANT POUR RÉCUPÉRER LES DONNÉES DU FORMULAIRE
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
        await this.sauvegarderDonnees();

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
            
            // Supprimer de Firebase si disponible
            if (operation && operation.firebaseId && this.firebaseDisponible) {
                try {
                    const { db, doc, deleteDoc } = await import('./firebase.js');
                    await deleteDoc(doc(db, 'operations', operation.firebaseId));
                } catch (error) {
                    console.error('Erreur suppression Firebase:', error);
                }
            }
            
            // Supprimer localement
            this.operations = this.operations.filter(op => op.id !== operationId);
            await this.sauvegarderDonnees();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            this.afficherMessageSucces('Opération supprimée avec succès');
        }
    }

    // AJOUTER L'AFFICHAGE DU STATUT FIREBASE
    setupEventListeners() {
        // VOTRE CODE EXISTANT...
        
        // Ajouter l'affichage du statut
        this.afficherStatutFirebase();
    }

    afficherStatutFirebase() {
        const header = document.querySelector('header');
        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutFirebase';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '8px 16px';
        statutDiv.style.borderRadius = '20px';
        statutDiv.style.fontSize = '14px';
        statutDiv.style.fontWeight = 'bold';
        
        if (this.firebaseDisponible) {
            statutDiv.textContent = '✅ Synchronisé avec le cloud';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
            statutDiv.style.border = '2px solid #c3e6cb';
        } else {
            statutDiv.textContent = '⚠️ Mode hors ligne (local)';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
            statutDiv.style.border = '2px solid #ffeaa7';
        }
        
        header.appendChild(statutDiv);
    }

    // GARDER TOUTES VOS AUTRES MÉTHODES EXISTANTES
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

    afficherHistorique(vue = 'global') {
        // Votre code existant
    }

    // ... (toutes vos autres méthodes)
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
