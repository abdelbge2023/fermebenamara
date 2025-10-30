class GestionFerme {
    constructor() {
        // Configuration Firebase
        this.firebaseConfig = {
            apiKey: "AIzaSyDKqudvQPUV_Lh2V2d2PUSEcxchDExw6PE",
            authDomain: "gestion-fermebenamara.firebaseapp.com",
            projectId: "gestion-fermebenamara",
            storageBucket: "gestion-fermebenamara.firebasestorage.app",
            messagingSenderId: "668129137491",
            appId: "1:668129137491:web:b56522302ea789844587a6"
        };

        this.db = null;
        this.syncEnabled = false;
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

        console.log('🔧 Initialisation Gestion Ferme avec Firebase...');
        this.init();
    }

    async init() {
        await this.initializeFirebase();
        this.setupEventListeners();
        await this.loadData();
        this.updateStats();
        this.afficherHistorique('global');
    }

    async initializeFirebase() {
        try {
            console.log('🚀 Initialisation Firebase...');
            
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK non chargé');
                this.syncEnabled = false;
                return;
            }

            // Initialiser Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
                console.log('✅ Firebase initialisé');
            }
            
            this.db = firebase.firestore();
            this.syncEnabled = true;
            
            console.log('✅ Firestore disponible');
            this.startRealtimeSync();

        } catch (error) {
            console.error('❌ Erreur Firebase:', error);
            this.syncEnabled = false;
        }
    }

    startRealtimeSync() {
        if (!this.syncEnabled || !this.db) return;

        this.db.collection('ferme_operations').orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Sync Firestore:', snapshot.docs.length, 'opérations');
                
                const remoteOperations = [];
                snapshot.forEach(doc => {
                    remoteOperations.push({ id: doc.id, ...doc.data() });
                });

                this.operations = remoteOperations;
                this.updateStats();
                this.afficherHistorique(this.currentView);
                
                // Sauvegarder aussi en local comme backup
                this.sauvegarderLocal();
                
            }, (error) => {
                console.error('❌ Erreur synchro Firestore:', error);
                this.syncEnabled = false;
            });
    }

    async saveToFirebase(operations) {
        if (!this.syncEnabled || !this.db) {
            console.log('📱 Mode hors ligne - sauvegarde locale seulement');
            return false;
        }

        try {
            const batch = this.db.batch();
            
            operations.forEach(op => {
                const opRef = this.db.collection('ferme_operations').doc(op.id.toString());
                batch.set(opRef, {
                    ...op,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
            console.log('✅ Données sauvegardées sur Firebase');
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
            return false;
        }
    }

    async ajouterOperation(e) {
        e.preventDefault();

        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montantSaisi = parseFloat(document.getElementById('montant').value);
        const description = document.getElementById('description').value.trim();

        // Validation
        if (montantSaisi <= 0 || isNaN(montantSaisi)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!description) {
            alert('Veuillez saisir une description');
            return;
        }

        let operationsACreer = [];
        const timestamp = new Date().toISOString();

        if (typeOperation === 'travailleur_global') {
            const montantZaitoun = montantSaisi / 3;
            const montant3Commain = (montantSaisi * 2) / 3;

            operationsACreer = [
                {
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: description + ' (Part Zaitoun - 1/3)',
                    montant: typeTransaction === 'frais' ? -montantZaitoun : montantZaitoun,
                    repartition: true,
                    timestamp: timestamp
                },
                {
                    id: (Date.now() + 1).toString(),
                    date: new Date().toISOString().split('T')[0],
                    operateur: operateur,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    description: description + ' (Part 3 Commain - 2/3)',
                    montant: typeTransaction === 'frais' ? -montant3Commain : montant3Commain,
                    repartition: true,
                    timestamp: timestamp
                }
            ];
        } else {
            operationsACreer = [{
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                operateur: operateur,
                groupe: groupe,
                typeOperation: typeOperation,
                typeTransaction: typeTransaction,
                caisse: caisse,
                description: description,
                montant: typeTransaction === 'frais' ? -montantSaisi : montantSaisi,
                repartition: false,
                timestamp: timestamp
            }];
        }

        // Sauvegarde immédiate en local
        operationsACreer.forEach(op => {
            this.operations.unshift(op);
        });

        // Tentative de sauvegarde Firebase
        const firebaseSuccess = await this.saveToFirebase(operationsACreer);
        
        if (!firebaseSuccess) {
            // Si Firebase échoue, sauvegarder en local
            this.sauvegarderLocal();
        }

        const message = typeOperation === 'travailleur_global' 
            ? `Opération enregistrée ! Répartie : ${(montantSaisi/3).toFixed(2)} DH (Zaitoun) + ${((montantSaisi*2)/3).toFixed(2)} DH (3 Commain)`
            : 'Opération enregistrée avec succès !';

        if (!firebaseSuccess) {
            this.afficherMessageSucces(message + ' (Mode hors ligne)');
        } else {
            this.afficherMessageSucces(message);
        }

        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    async effectuerTransfert(e) {
        e.preventDefault();

        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        const montantTransfert = parseFloat(document.getElementById('montantTransfert').value);
        const description = document.getElementById('descriptionTransfert').value.trim();

        // Validation
        if (caisseSource === caisseDestination) {
            alert('Vous ne pouvez pas transférer vers la même caisse');
            return;
        }

        if (montantTransfert <= 0 || isNaN(montantTransfert)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!description) {
            alert('Veuillez saisir une description');
            return;
        }

        // Vérifier solde
        const soldeSource = this.caisses[caisseSource];
        if (soldeSource < montantTransfert) {
            alert(`Solde insuffisant dans ${this.formaterCaisse(caisseSource)} ! Solde disponible : ${soldeSource.toFixed(2)} DH`);
            return;
        }

        const timestamp = new Date().toISOString();
        const operationsTransfert = [
            {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                type: 'transfert_sortie',
                operateur: 'system',
                groupe: 'system',
                typeOperation: 'transfert',
                typeTransaction: 'frais',
                caisse: caisseSource,
                caisseDestination: caisseDestination,
                description: `Transfert vers ${this.formaterCaisse(caisseDestination)}: ${description}`,
                montant: -montantTransfert,
                transfert: true,
                timestamp: timestamp
            },
            {
                id: (Date.now() + 1).toString(),
                date: new Date().toISOString().split('T')[0],
                type: 'transfert_entree',
                operateur: 'system',
                groupe: 'system',
                typeOperation: 'transfert',
                typeTransaction: 'revenu',
                caisse: caisseDestination,
                caisseDestination: caisseSource,
                description: `Transfert de ${this.formaterCaisse(caisseSource)}: ${description}`,
                montant: montantTransfert,
                transfert: true,
                timestamp: timestamp
            }
        ];

        // Sauvegarde immédiate en local
        operationsTransfert.forEach(op => {
            this.operations.unshift(op);
        });

        // Tentative Firebase
        const firebaseSuccess = await this.saveToFirebase(operationsTransfert);
        
        if (!firebaseSuccess) {
            this.sauvegarderLocal();
        }

        if (!firebaseSuccess) {
            this.afficherMessageSucces('Transfert effectué ! (Mode hors ligne)');
        } else {
            this.afficherMessageSucces('Transfert effectué avec succès !');
        }

        document.getElementById('transfertForm').reset();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    async loadData() {
        console.log('📂 Chargement des données...');
        
        // D'abord essayer Firebase
        if (this.syncEnabled) {
            try {
                const snapshot = await this.db.collection('ferme_operations')
                    .orderBy('timestamp', 'desc')
                    .limit(1000)
                    .get();
                
                const remoteOperations = [];
                snapshot.forEach(doc => {
                    remoteOperations.push({ id: doc.id, ...doc.data() });
                });

                if (remoteOperations.length > 0) {
                    this.operations = remoteOperations;
                    console.log('✅ Données chargées depuis Firebase:', this.operations.length, 'opérations');
                    this.sauvegarderLocal(); // Synchroniser local
                    return;
                }
            } catch (error) {
                console.error('❌ Erreur chargement Firebase:', error);
            }
        }

        // Fallback: charger depuis localStorage
        this.loadFromLocalStorage();
    }

    // ... (les autres méthodes restent similaires)

    sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString(),
            totalOperations: this.operations.length,
            version: '2.0-firebase'
        };
        
        try {
            localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
            console.log('💾 Backup local:', this.operations.length, 'opérations');
        } catch (error) {
            console.error('❌ Erreur sauvegarde locale:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gestion_ferme_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('✅ Données chargées depuis localStorage:', this.operations.length, 'opérations');
            } else {
                console.log('ℹ️ Aucune donnée sauvegardée trouvée');
                this.operations = [];
            }
        } catch (error) {
            console.error('❌ Erreur chargement local:', error);
            this.operations = [];
        }
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
