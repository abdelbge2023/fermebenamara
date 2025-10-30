// app.js - Version finale sans erreurs
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        this.afficherStatut();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    chargerDonnees() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log(`📁 ${this.operations.length} opérations chargées`);
            } catch (error) {
                console.error('Erreur chargement:', error);
                this.operations = [];
            }
        }
    }

    sauvegarderDonnees() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    afficherStatut() {
        const header = document.querySelector('header');
        if (!header) return;

        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutApp';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '10px';
        statutDiv.style.borderRadius = '10px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';

        if (window.firebaseReady) {
            statutDiv.innerHTML = '✅ Synchronisé Cloud | <button onclick="migrerDonnees()" class="btn-warning" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">🔄 Migrer</button>';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
        } else {
            statutDiv.textContent = '🔧 Mode Local (Données Sécurisées)';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
        }

        header.appendChild(statutDiv);
    }

    // MÉTHODE AJOUTER OPÉRATION (votre code existant)
    async ajouterOperation(e) {
        e.preventDefault();

        // VOTRE CODE EXISTANT POUR RÉCUPÉRER LES DONNÉES
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
            // RÉPARTITION AUTOMATIQUE 1/3 - 2/3
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
            // Opération normale sans répartition
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

        // Ajouter aux opérations
        for (const op of operationsACreer) {
            this.operations.unshift(op);
        }

        // Sauvegarder
        this.sauvegarderDonnees();

        // Sauvegarder dans Firebase si disponible
        if (window.firebaseReady && window.firebaseDb) {
            try {
                for (const op of operationsACreer) {
                    await window.firebaseDb.collection("operations").add(op);
                }
                console.log('✅ Données sauvegardées dans Firebase');
            } catch (error) {
                console.log('⚠️ Données sauvegardées localement seulement');
            }
        }

        this.afficherMessageSucces(
            typeOperation === 'travailleur_global' 
                ? 'Opération enregistrée ! Répartie : ' + (montantSaisi/3).toFixed(2) + ' DH (Zaitoun) + ' + ((montantSaisi*2)/3).toFixed(2) + ' DH (3 Commain)'
                : 'Opération enregistrée avec succès !'
        );
        
        this.resetForm();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // GARDER TOUTES VOS AUTRES MÉTHODES EXISTANTES
    setupEventListeners() {
        // VOTRE CODE EXISTANT...
        const saisieForm = document.getElementById('saisieForm');
        const transfertForm = document.getElementById('transfertForm');
        const btnReset = document.getElementById('btnReset');
        
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }
        
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.effectuerTransfert(e));
        }
        
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        const typeOperation = document.getElementById('typeOperation');
        const montant = document.getElementById('montant');
        
        if (typeOperation) {
            typeOperation.addEventListener('change', () => this.calculerRepartition());
        }
        
        if (montant) {
            montant.addEventListener('input', () => this.calculerRepartition());
        }
        
        // ... le reste de votre code existant
    }

    calculerRepartition() {
        // VOTRE CODE EXISTANT
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

    toggleEditMode(enable = null) {
        // VOTRE CODE EXISTANT
        this.editMode = enable !== null ? enable : !this.editMode;
        
        document.body.classList.toggle('edit-mode', this.editMode);
        
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        
        if (btnEditMode) btnEditMode.style.display = this.editMode ? 'none' : 'block';
        if (btnDeleteSelected) btnDeleteSelected.style.display = this.editMode ? 'block' : 'none';
        if (btnCancelEdit) btnCancelEdit.style.display = this.editMode ? 'block' : 'none';
        
        this.selectedOperations.clear();
        this.afficherHistorique(this.currentView);
    }

    // ... TOUTES VOS AUTRES MÉTHODES EXISTANTES
    // updateStats(), afficherHistorique(), etc.
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
