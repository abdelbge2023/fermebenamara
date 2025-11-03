// app.js - Version avec synchronisation automatique renforcée
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
        this.suppressionsEnAttente = new Set(); // Nouvelles suppressions en attente de confirmation

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

    // ... (Les méthodes setupEventListeners, gestionAffichageRepartition, ajouterTransfert, 
    // toggleEditMode, toggleOperationSelection, ouvrirModalModification, modifierOperation, 
    // afficherHistorique, mettreAJourOngletsCaisse restent identiques) ...

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
        await this.synchroniserAvecFirebase();
        
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
            
            this.firebaseInitialized = true;
            
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
        if (!window.firebaseSync) {
            setTimeout(() => this.setupFirebaseRealtimeListeners(), 2000);
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
        if (!window.firebaseSync) return;

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
        this.sauvegarderSurFirebase();
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
            if (window.firebaseSync) {
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
            if (window.firebaseSync) {
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

    // ... (Les méthodes updateStats, calculerSoldes, creerCarteCaisse, afficherDetailsCaisse, 
    // creerTableauDetailsCaisse, ajouterOperation, resetForm, afficherMessageSucces, 
    // et les méthodes de formatage restent identiques) ...
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
