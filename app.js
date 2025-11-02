// app.js - Gestion Ferme Ben Amara - Version Firebase
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
        this.caisseSelectionnee = null;
        this.isMobile = window.innerWidth < 768;
        this.db = null; // Référence Firebase

        this.init();
    }

    async init() {
        await this.initialiserFirebase();
        this.setupEventListeners();
        await this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        this.detecterMobile();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    async initialiserFirebase() {
        try {
            // Configuration Firebase - À ADAPTER AVEC VOS CLÉS
            const firebaseConfig = {
                apiKey: "votre_api_key",
                authDomain: "votre_projet.firebaseapp.com",
                projectId: "votre_projet_id",
                storageBucket: "votre_projet.appspot.com",
                messagingSenderId: "votre_sender_id",
                appId: "votre_app_id"
            };

            // Initialiser Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            console.log('🔥 Firebase initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation Firebase:', error);
            this.afficherNotification('Mode hors ligne activé - Firebase non disponible', 'warning');
        }
    }

    async chargerDonnees() {
        try {
            // Essayer Firebase d'abord
            if (this.db) {
                const snapshot = await this.db.collection('operations').get();
                this.operations = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('📂 Données Firebase chargées:', this.operations.length, 'opérations');
            } else {
                // Fallback localStorage
                const donnees = localStorage.getItem('gestionFermeOperations');
                if (donnees) {
                    this.operations = JSON.parse(donnees);
                    console.log('📂 Données locales chargées:', this.operations.length, 'opérations');
                }
            }
            
            if (this.operations.length === 0) {
                await this.chargerDonneesExemple();
            }
            
            this.afficherNotification(`Données chargées: ${this.operations.length} opérations`, 'success');
            
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.chargerDonneesLocale();
        }
    }

    async sauvegarderDonnees() {
        try {
            // Sauvegarder dans Firebase si disponible
            if (this.db) {
                const batch = this.db.batch();
                
                // Supprimer toutes les opérations existantes
                const snapshot = await this.db.collection('operations').get();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Ajouter les nouvelles opérations
                this.operations.forEach(op => {
                    const docRef = this.db.collection('operations').doc(op.id.toString());
                    batch.set(docRef, op);
                });
                
                await batch.commit();
                console.log('💾 Données sauvegardées sur Firebase');
            }
            
            // Sauvegarder localement aussi
            localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
            localStorage.setItem('gestionFermeLastSync', new Date().toISOString());
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            // Fallback localStorage
            localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
            this.afficherNotification('Sauvegarde locale (Firebase indisponible)', 'warning');
        }
    }

    async ajouterOperation() {
        const formData = new FormData(document.getElementById('operationForm'));
        
        const nouvelleOperation = {
            id: Date.now().toString(), // String pour Firebase
            date: formData.get('date'),
            operateur: formData.get('operateur'),
            groupe: formData.get('groupe'),
            typeOperation: formData.get('typeOperation'),
            typeTransaction: formData.get('typeTransaction'),
            caisse: formData.get('caisse'),
            description: formData.get('description'),
            montant: parseFloat(formData.get('montant')),
            transfert: formData.get('transfert') === 'true',
            createdAt: new Date().toISOString()
        };

        this.operations.push(nouvelleOperation);
        await this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        document.getElementById('operationForm').reset();
        this.afficherNotification('Opération ajoutée avec succès', 'success');
    }

    // CORRECTION DES BOUTONS ÉDITION/SUPPRESSION
    ouvrirModalModification(id) {
        console.log('🔧 Ouverture modification ID:', id);
        const operation = this.operations.find(op => op.id.toString() === id.toString());
        
        if (!operation) {
            console.error('❌ Opération non trouvée:', id);
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('date').value = operation.date;
        document.getElementById('operateur').value = operation.operateur;
        document.getElementById('groupe').value = operation.groupe;
        document.getElementById('typeOperation').value = operation.typeOperation;
        document.getElementById('typeTransaction').value = operation.typeTransaction;
        document.getElementById('caisse').value = operation.caisse;
        document.getElementById('description').value = operation.description;
        document.getElementById('montant').value = Math.abs(operation.montant);
        document.getElementById('transfert').checked = operation.transfert;

        // Stocker l'ID en cours de modification
        document.getElementById('operationForm').dataset.editingId = id;

        // Changer le texte du bouton
        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '💾 Modifier l\'opération';
        submitBtn.classList.add('btn-warning');

        // Faire défiler vers le formulaire
        document.getElementById('operationForm').scrollIntoView({ behavior: 'smooth' });

        console.log('✏️ Formulaire prêt pour modification:', operation);
    }

    async modifierOperation() {
        const id = document.getElementById('operationForm').dataset.editingId;
        console.log('🔄 Modification opération ID:', id);
        
        if (!id) {
            this.afficherNotification('Aucune opération en cours de modification', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('operationForm'));
        const operationIndex = this.operations.findIndex(op => op.id.toString() === id.toString());

        if (operationIndex === -1) {
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        this.operations[operationIndex] = {
            ...this.operations[operationIndex],
            date: formData.get('date'),
            operateur: formData.get('operateur'),
            groupe: formData.get('groupe'),
            typeOperation: formData.get('typeOperation'),
            typeTransaction: formData.get('typeTransaction'),
            caisse: formData.get('caisse'),
            description: formData.get('description'),
            montant: parseFloat(formData.get('montant')),
            transfert: formData.get('transfert') === 'true',
            updatedAt: new Date().toISOString()
        };

        await this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        // Réinitialiser le formulaire
        this.reinitialiserFormulaire();
        
        this.afficherNotification('Opération modifiée avec succès', 'success');
        console.log('✅ Opération modifiée:', this.operations[operationIndex]);
    }

    async supprimerOperation(id) {
        console.log('🗑️ Suppression opération ID:', id);
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            return;
        }

        const operationIndex = this.operations.findIndex(op => op.id.toString() === id.toString());
        
        if (operationIndex === -1) {
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        const operationSupprimee = this.operations[operationIndex];
        this.operations.splice(operationIndex, 1);
        
        await this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.afficherNotification('Opération supprimée avec succès', 'success');
        console.log('🗑️ Opération supprimée:', operationSupprimee);
    }

    reinitialiserFormulaire() {
        document.getElementById('operationForm').reset();
        delete document.getElementById('operationForm').dataset.editingId;
        
        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '✅ Enregistrer l\'opération';
        submitBtn.classList.remove('btn-warning');
    }

    // MÉTHODE POUR LES TRANSFERTS (corrigée)
    async effectuerTransfert() {
        const formData = new FormData(document.getElementById('transferForm'));
        
        const sourceCaisse = formData.get('sourceCaisse');
        const destinationCaisse = formData.get('destinationCaisse');
        const montant = parseFloat(formData.get('transfertMontant'));
        const description = formData.get('transfertDescription');

        // Validation
        if (!sourceCaisse || !destinationCaisse || !montant || !description) {
            this.afficherNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (sourceCaisse === destinationCaisse) {
            this.afficherNotification('La source et la destination doivent être différentes', 'error');
            return;
        }

        if (montant <= 0) {
            this.afficherNotification('Le montant doit être positif', 'error');
            return;
        }

        // Vérifier le solde
        const soldeSource = this.caisses[sourceCaisse] || 0;
        if (soldeSource < montant) {
            this.afficherNotification(`Solde insuffisant: ${soldeSource.toFixed(2)} DH`, 'error');
            return;
        }

        // Créer les opérations de transfert
        const date = new Date().toISOString().split('T')[0];
        const idBase = Date.now();

        const operationRetrait = {
            id: idBase.toString(),
            date: date,
            operateur: 'system',
            groupe: 'transfert',
            typeOperation: 'frais',
            typeTransaction: 'virement',
            caisse: sourceCaisse,
            description: `Transfert vers ${this.getNomCaisse(destinationCaisse)} - ${description}`,
            montant: -montant,
            transfert: true,
            createdAt: new Date().toISOString()
        };

        const operationDepot = {
            id: (idBase + 1).toString(),
            date: date,
            operateur: 'system',
            groupe: 'transfert',
            typeOperation: 'vente',
            typeTransaction: 'virement',
            caisse: destinationCaisse,
            description: `Transfert de ${this.getNomCaisse(sourceCaisse)} - ${description}`,
            montant: montant,
            transfert: true,
            createdAt: new Date().toISOString()
        };

        this.operations.push(operationRetrait, operationDepot);
        await this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);

        document.getElementById('transferForm').reset();
        this.afficherNotification(`Transfert de ${montant.toFixed(2)} DH effectué !`, 'success');
    }

    // MÉTHODE POUR LA SÉLECTION MULTIPLE (corrigée)
    selectionnerOperation(id, estSelectionne) {
        if (estSelectionne) {
            this.selectedOperations.add(id.toString());
        } else {
            this.selectedOperations.delete(id.toString());
        }
        this.afficherHistorique(this.currentView);
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        this.selectedOperations.clear();
        
        const deleteBtn = document.getElementById('deleteSelected');
        if (deleteBtn) {
            deleteBtn.style.display = this.editMode ? 'block' : 'none';
        }
        
        this.afficherHistorique(this.currentView);
        console.log('🔧 Mode édition:', this.editMode ? 'activé' : 'désactivé');
    }

    async supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            this.afficherNotification('Aucune opération sélectionnée', 'warning');
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            return;
        }

        this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id.toString()));
        this.selectedOperations.clear();
        
        await this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.afficherNotification(`${this.selectedOperations.size} opérations supprimées`, 'success');
    }

    // MÉTHODE POUR LA CRÉATION DES BOUTONS (corrigée)
    creerBoutonsActions(id) {
        return `
            <div class="operation-actions">
                <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${id}')">
                    ${this.isMobile ? '✏️' : '✏️ Modifier'}
                </button>
                <button class="btn-small btn-danger" onclick="app.supprimerOperation('${id}')">
                    ${this.isMobile ? '🗑️' : '🗑️ Supprimer'}
                </button>
            </div>
        `;
    }

    // Mettre à jour la méthode de création du tableau
    creerTableauDesktop(operations) {
        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${this.editMode ? '<th></th>' : ''}
                            <th>Date</th>
                            <th>Opérateur</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Montant</th>
                            ${!this.editMode ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        operations.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            const estSelectionne = this.selectedOperations.has(op.id.toString());
            
            tableHTML += `
                <tr class="${estSelectionne ? 'selected' : ''}">
                    ${this.editMode ? `
                        <td>
                            <input type="checkbox" class="operation-checkbox" 
                                ${estSelectionne ? 'checked' : ''} 
                                onchange="app.selectionnerOperation('${op.id}', this.checked)">
                        </td>
                    ` : ''}
                    <td>${this.formaterDate(op.date)}</td>
                    <td>${this.formaterOperateur(op.operateur)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="description-cell">${op.description}</td>
                    <td class="montant-cell ${estNegatif ? 'negatif' : 'positif'}">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)} DH
                    </td>
                    ${!this.editMode ? `<td>${this.creerBoutonsActions(op.id)}</td>` : ''}
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

    // ... (le reste des méthodes reste inchangé)
}

// Initialisation globale
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new GestionFerme();
        window.app = app;
        
        // Gestionnaire pour le formulaire
        document.getElementById('operationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (this.dataset.editingId) {
                await app.modifierOperation();
            } else {
                await app.ajouterOperation();
            }
        });
        
        console.log('🚀 Application démarrée avec succès');
    } catch (error) {
        console.error('💥 Erreur démarrage application:', error);
    }
});
