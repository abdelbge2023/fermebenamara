class SamarcheApp {
    constructor() {
        // ==================== CONFIGURATION FIREBASE ====================
        // ⚠️ REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET FIREBASE ⚠️
        const firebaseConfig = {
          apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
          authDomain: "gestion-fermebenamara.firebaseapp.com",
          projectId: "gestion-fermebenamara",
          storageBucket: "gestion-fermebenamara.firebasestorage.app",
          messagingSenderId: "668129137491",
          appId: "1:668129137491:web:b56522302ea789044507a6"
        };


        // Variables de synchronisation
        this.db = null;
        this.syncEnabled = false;
        this.lastSyncTime = null;

        // Votre code existant reste inchangé ci-dessous
        this.workbook = null;
        this.currentView = 'global';
        this.operations = [];
        this.editMode = false;
        this.selectedOperations = new Set();
        
        this.sheetsConfig = {
            'zaitoun': { name: 'Zaitoun', filter: (op) => op.groupe === 'zaitoun' },
            '3commain': { name: '3Commain', filter: (op) => op.groupe === '3commain' },
            'abdel': { name: 'Abdel', filter: (op) => op.operateur === 'abdel' },
            'omar': { name: 'Omar', filter: (op) => op.operateur === 'omar' },
            'hicham': { name: 'Hicham', filter: (op) => op.operateur === 'hicham' }
        };

        this.init();
    }

    // ==================== MÉTHODES FIREBASE ====================
    
    initializeFirebase() {
        try {
            // Vérifier si Firebase est disponible
            if (typeof firebase === 'undefined') {
                console.warn('Firebase non chargé');
                return;
            }
            
            // Initialiser Firebase
            firebase.initializeApp(this.firebaseConfig);
            this.db = firebase.firestore();
            this.syncEnabled = true;
            
            console.log('✅ Firebase initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation Firebase:', error);
            this.syncEnabled = false;
        }
    }

    init() {
        this.setupEventListeners();
        this.initializeFirebase();
        this.loadFromLocalStorage().then(() => {
            // Démarrer la synchro temps réel après le chargement
            if (this.syncEnabled) {
                this.setupRealtimeSync();
            }
            this.showView('global');
            this.updateStats();
        });
    }

    setupEventListeners() {
        // VOTRE CODE EXISTANT - NE PAS MODIFIER
        // Formulaire de saisie
        document.getElementById('saisieForm').addEventListener('submit', (e) => this.ajouterOperation(e));
        document.getElementById('btnReset').addEventListener('click', () => this.resetForm());
        
        // Gestion de la répartition
        document.getElementById('typeOperation').addEventListener('change', () => this.calculerRepartition());
        document.getElementById('montant').addEventListener('input', () => this.calculerRepartition());

        // Import/Export
        document.getElementById('btnImport').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importerExcel(e.target.files[0]);
        });
        document.getElementById('btnExport').addEventListener('click', () => {
            this.exporterVersExcel();
        });
        document.getElementById('btnNewFile').addEventListener('click', () => {
            this.creerNouveauFichier();
        });

        // Navigation par onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.sheet;
                this.showView(view);
            });
        });

        // Gestion des opérations
        document.getElementById('btnEditMode').addEventListener('click', () => this.toggleEditMode());
        document.getElementById('btnDeleteSelected').addEventListener('click', () => this.supprimerOperationsSelectionnees());
        document.getElementById('btnCancelEdit').addEventListener('click', () => this.toggleEditMode(false));

        // Modal de modification
        document.getElementById('editForm').addEventListener('submit', (e) => this.modifierOperation(e));
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.fermerModal());
        });

        // Fermer le modal en cliquant à l'extérieur
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.fermerModal();
        });
    }

    // ==================== MODIFICATIONS MINIMALES POUR FIREBASE ====================

    async sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        
        // 1. Sauvegarde locale (ORIGINAL)
        localStorage.setItem('samarche_data', JSON.stringify(data));
        
        // 2. Synchronisation Firebase (NOUVEAU - optionnel)
        if (this.syncEnabled && this.db) {
            try {
                await this.db.collection('sauvegardes').doc('donnees_principales').set({
                    data: data,
                    lastSync: new Date().toISOString(),
                    totalOperations: this.operations.length
                });
                console.log('✅ Données synchronisées avec Firebase');
            } catch (error) {
                console.error('❌ Erreur synchronisation Firebase:', error);
            }
        }
    }

    async loadFromLocalStorage() {
        // Essayer Firebase d'abord
        if (this.syncEnabled && this.db) {
            try {
                const doc = await this.db.collection('sauvegardes').doc('donnees_principales').get();
                
                if (doc.exists) {
                    const firebaseData = doc.data();
                    this.operations = firebaseData.data.operations || [];
                    
                    // Sauvegarder localement aussi
                    localStorage.setItem('samarche_data', JSON.stringify(firebaseData.data));
                    
                    document.getElementById('fileInfo').innerHTML = `
                        <div class="file-info" style="background: #d4edda;">
                            ☁️ Données chargées depuis Firebase (${this.operations.length} opérations)
                        </div>
                    `;
                    return;
                }
            } catch (error) {
                console.warn('Firebase non disponible, utilisation du stockage local');
            }
        }
           setupRealtimeSync() {
        if (!this.syncEnabled || !this.db) {
            console.log('Synchronisation temps réel désactivée');
            return;
        }
        
        console.log('🔄 Activation synchronisation temps réel...');
        
        // Écouter les changements en temps réel
        this.unsubscribe = this.db.collection('sauvegardes').doc('donnees_principales')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const firebaseData = doc.data();
                    const remoteOperations = firebaseData.data.operations || [];
                    const remoteTime = new Date(firebaseData.lastSync);
                    
                    console.log('📡 Données reçues de Firebase:', remoteOperations.length, 'opérations');
                    
                    // Vérifier si les données distantes sont plus récentes
                    const localData = localStorage.getItem('samarche_data');
                    let shouldUpdate = false;
                    
                    if (!localData) {
                        shouldUpdate = true;
                        console.log('🆕 Première synchronisation depuis Firebase');
                    } else {
                        const localParsed = JSON.parse(localData);
                        const localTime = new Date(localParsed.lastUpdate);
                        shouldUpdate = remoteTime > localTime;
                        
                        if (shouldUpdate) {
                            console.log('🔄 Données Firebase plus récentes, mise à jour...');
                        }
                    }
                    
                    // Mettre à jour si nécessaire
                    if (shouldUpdate) {
                        this.operations = remoteOperations;
                        this.lastSyncTime = remoteTime;
                        
                        // Sauvegarder localement
                        localStorage.setItem('samarche_data', JSON.stringify({
                            operations: remoteOperations,
                            lastUpdate: remoteTime.toISOString()
                        }));
                        
                        // Mettre à jour l'interface
                        this.showView(this.currentView);
                        this.updateStats();
                        
                        this.afficherMessageSucces('🔄 Données mises à jour depuis le cloud');
                        console.log('✅ Synchronisation terminée');
                    }
                }
            }, (error) => {
                console.error('❌ Erreur synchronisation temps réel:', error);
            });
    } 
        // Fallback sur le stockage local (ORIGINAL)
        const saved = localStorage.getItem('samarche_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.operations = data.operations || [];
            
            document.getElementById('fileInfo').innerHTML = `
                <div class="file-info">
                    💾 Données chargées depuis le stockage local 
                    (${this.operations.length} opérations, dernière mise à jour: ${new Date(data.lastUpdate).toLocaleDateString('fr-FR')})
                </div>
            `;
        }
    }

    // ==================== VOTRE CODE EXISTANT - NE RIEN CHANGER CI-DESSOUS ====================
    
    calculerRepartition() {
        // VOTRE CODE EXISTANT
        const typeOperation = document.getElementById('typeOperation').value;
        const montant = parseFloat(document.getElementById('montant').value) || 0;
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');

        if (typeOperation === 'travailleur_global' && montant > 0) {
            const montantZaitoun = (montant / 3).toFixed(2);
            const montant3Commain = ((montant * 2) / 3).toFixed(2);

            repartitionDetails.innerHTML = `
                <div class="repartition-details">
                    <div class="repartition-item zaitoun">
                        <strong>Zaitoun</strong><br>
                        <span style="color: #ff9800; font-weight: bold;">${montantZaitoun} DH</span><br>
                        <small>(1/3 du montant)</small>
                    </div>
                    <div class="repartition-item commain">
                        <strong>3 Commain</strong><br>
                        <span style="color: #2196f3; font-weight: bold;">${montant3Commain} DH</span><br>
                        <small>(2/3 du montant)</small>
                    </div>
                </div>
            `;
            repartitionInfo.style.display = 'block';
        } else {
            repartitionInfo.style.display = 'none';
        }
    }

    ajouterOperation(e) {
        e.preventDefault();

        const typeOperation = document.getElementById('typeOperation').value;
        const montantSaisi = parseFloat(document.getElementById('montant').value);
        
        let operationsACreer = [];

        if (typeOperation === 'travailleur_global') {
            // Créer deux opérations : une pour Zaitoun et une pour 3 Commain
            const montantZaitoun = montantSaisi / 3;
            const montant3Commain = (montantSaisi * 2) / 3;

            operationsACreer = [
                {
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    operateur: document.getElementById('operateur').value,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    description: document.getElementById('description').value + ' (Part Zaitoun - 1/3)',
                    montant: montantZaitoun,
                    operationParent: true
                },
                {
                    id: Date.now() + 1,
                    date: new Date().toISOString().split('T')[0],
                    operateur: document.getElementById('operateur').value,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    description: document.getElementById('description').value + ' (Part 3 Commain - 2/3)',
                    montant: montant3Commain,
                    operationParent: true
                }
            ];
        } else {
            // Opération normale
            operationsACreer = [{
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                operateur: document.getElementById('operateur').value,
                groupe: document.getElementById('groupe').value,
                typeOperation: typeOperation,
                description: document.getElementById('description').value,
                montant: montantSaisi,
                operationParent: false
            }];
        }

        // Validation
        if (!this.validerOperation(operationsACreer[0])) {
            return;
        }

        // Ajouter les opérations
        operationsACreer.forEach(op => {
            this.operations.unshift(op);
        });

        this.sauvegarderLocal();
        this.afficherMessageSucces(
            typeOperation === 'travailleur_global' 
                ? `Opération enregistrée ! Répartie : ${(montantSaisi/3).toFixed(2)} DH (Zaitoun) + ${((montantSaisi*2)/3).toFixed(2)} DH (3 Commain)`
                : 'Opération enregistrée avec succès !'
        );
        
        this.resetForm();
        this.showView(this.currentView);
        this.updateStats();

        console.log('Nouvelles opérations:', operationsACreer);
    }

    validerOperation(operation) {
        if (operation.montant <= 0) {
            alert('Le montant doit être supérieur à 0');
            return false;
        }
        if (!operation.description.trim()) {
            alert('Veuillez saisir une description');
            return false;
        }
        return true;
    }

    resetForm() {
        document.getElementById('saisieForm').reset();
        document.getElementById('repartitionInfo').style.display = 'none';
        document.getElementById('operateur').focus();
    }

    toggleEditMode(enable = null) {
        this.editMode = enable !== null ? enable : !this.editMode;
        
        document.body.classList.toggle('edit-mode', this.editMode);
        document.getElementById('btnEditMode').style.display = this.editMode ? 'none' : 'block';
        document.getElementById('btnDeleteSelected').style.display = this.editMode ? 'block' : 'none';
        document.getElementById('btnCancelEdit').style.display = this.editMode ? 'block' : 'none';
        
        this.selectedOperations.clear();
        this.showView(this.currentView);
    }

    selectionnerOperation(operationId, checked) {
        if (checked) {
            this.selectedOperations.add(operationId);
        } else {
            this.selectedOperations.delete(operationId);
        }
        
        document.getElementById('btnDeleteSelected').textContent = 
            `🗑️ Supprimer (${this.selectedOperations.size})`;
    }

    supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('Aucune opération sélectionnée');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            this.sauvegarderLocal();
            this.selectedOperations.clear();
            this.toggleEditMode(false);
            this.showView(this.currentView);
            this.updateStats();
            this.afficherMessageSucces(`${this.selectedOperations.size} opération(s) supprimée(s) avec succès`);
        }
    }

    ouvrirModalModification(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        // Remplir le formulaire
        document.getElementById('editId').value = operation.id;
        document.getElementById('editOperateur').value = operation.operateur;
        document.getElementById('editGroupe').value = operation.groupe;
        document.getElementById('editTypeOperation').value = operation.typeOperation;
        document.getElementById('editMontant').value = operation.montant;
        document.getElementById('editDescription').value = operation.description;

        // Afficher le modal
        document.getElementById('editModal').style.display = 'flex';
    }

    fermerModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }

    modifierOperation(e) {
        e.preventDefault();

        const operationId = parseInt(document.getElementById('editId').value);
        const operationIndex = this.operations.findIndex(op => op.id === operationId);

        if (operationIndex === -1) {
            alert('Opération non trouvée');
            return;
        }

        // Mettre à jour l'opération
        this.operations[operationIndex] = {
            ...this.operations[operationIndex],
            operateur: document.getElementById('editOperateur').value,
            groupe: document.getElementById('editGroupe').value,
            typeOperation: document.getElementById('editTypeOperation').value,
            montant: parseFloat(document.getElementById('editMontant').value),
            description: document.getElementById('editDescription').value
        };

        this.sauvegarderLocal();
        this.fermerModal();
        this.showView(this.currentView);
        this.updateStats();
        this.afficherMessageSucces('Opération modifiée avec succès !');
    }

    supprimerOperation(operationId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            this.operations = this.operations.filter(op => op.id !== operationId);
            this.sauvegarderLocal();
            this.showView(this.currentView);
            this.updateStats();
            this.afficherMessageSucces('Opération supprimée avec succès');
        }
    }

    afficherMessageSucces(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        
        const saisieSection = document.querySelector('.saisie-section');
        saisieSection.insertBefore(messageDiv, saisieSection.querySelector('h2').nextSibling);
        
        setTimeout(() => messageDiv.remove(), 4000);
    }

    showView(viewName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sheet === viewName);
        });

        this.currentView = viewName;
        this.afficherDonnees(viewName);
    }

    afficherDonnees(viewName) {
        const container = document.getElementById('dataDisplay');
        let operationsFiltrees = [];

        if (viewName === 'global') {
            operationsFiltrees = this.operations;
        } else {
            const filter = this.sheetsConfig[viewName].filter;
            operationsFiltrees = this.operations.filter(filter);
        }

        if (operationsFiltrees.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <h3>📭 Aucune donnée</h3>
                    <p>Aucune opération trouvée pour cette vue</p>
                </div>
            `;
            return;
        }

        const total = operationsFiltrees.reduce((sum, op) => sum + op.montant, 0);

        container.innerHTML = `
            <div class="fade-in">
                <h3>${viewName === 'global' ? '🌍 Toutes les opérations' : this.sheetsConfig[viewName].name}</h3>
                <p><strong>Total: ${total.toFixed(2)} DH</strong> (${operationsFiltrees.length} opérations)</p>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            ${this.editMode ? '<th></th>' : ''}
                            <th>Date</th>
                            <th>Opérateur</th>
                            <th>Groupe</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Montant (DH)</th>
                            ${!this.editMode ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${operationsFiltrees.map(op => `
                            <tr class="${this.selectedOperations.has(op.id) ? 'selected' : ''}">
                                ${this.editMode ? `
                                    <td>
                                        <input type="checkbox" class="operation-checkbox" 
                                               ${this.selectedOperations.has(op.id) ? 'checked' : ''}
                                               onchange="app.selectionnerOperation(${op.id}, this.checked)">
                                    </td>
                                ` : ''}
                                <td>${this.formaterDate(op.date)}</td>
                                <td>${this.formaterOperateur(op.operateur)}</td>
                                <td>${this.formaterGroupe(op.groupe)}</td>
                                <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                                <td>${op.description}</td>
                                <td style="font-weight: bold; color: #27ae60;">${op.montant.toFixed(2)}</td>
                                ${!this.editMode ? `
                                    <td>
                                        <div class="operation-actions">
                                            <button class="btn-small btn-warning" 
                                                    onclick="app.ouvrirModalModification(${op.id})">
                                                ✏️
                                            </button>
                                            <button class="btn-small btn-danger" 
                                                    onclick="app.supprimerOperation(${op.id})">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    formaterDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const noms = { 'abdel': 'Abdel', 'omar': 'Omar', 'hicham': 'Hicham' };
        return noms[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const noms = { 'zaitoun': 'Zaitoun', '3commain': '3 Commain' };
        return noms[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': 'Travailleur Global',
            'zaitoun': 'Zaitoun',
            '3commain': '3 Commain',
            'autre': 'Autre'
        };
        return types[type] || type;
    }

    updateStats() {
        const container = document.getElementById('statsContainer');
        
        const totalGeneral = this.operations.reduce((sum, op) => sum + op.montant, 0);
        const totalZaitoun = this.operations.filter(op => op.groupe === 'zaitoun').reduce((sum, op) => sum + op.montant, 0);
        const total3Commain = this.operations.filter(op => op.groupe === '3commain').reduce((sum, op) => sum + op.montant, 0);
        
        const totalAbdel = this.operations.filter(op => op.operateur === 'abdel').reduce((sum, op) => sum + op.montant, 0);
        const totalOmar = this.operations.filter(op => op.operateur === 'omar').reduce((sum, op) => sum + op.montant, 0);
        const totalHicham = this.operations.filter(op => op.operateur === 'hicham').reduce((sum, op) => sum + op.montant, 0);

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Général</div>
                    <div class="stat-value">${totalGeneral.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Zaitoun</div>
                    <div class="stat-value">${totalZaitoun.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">3 Commain</div>
                    <div class="stat-value">${total3Commain.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Abdel</div>
                    <div class="stat-value">${totalAbdel.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Omar</div>
                    <div class="stat-value">${totalOmar.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Hicham</div>
                    <div class="stat-value">${totalHicham.toFixed(2)}</div>
                    <div class="stat-label">DH</div>
                </div>
            </div>
        `;
    }

    async importerExcel(file) {
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            this.workbook = XLSX.read(data, { type: 'array' });
            this.chargerDonneesDepuisExcel();
            this.afficherMessageSucces(`Fichier importé: ${file.name}`);
        } catch (error) {
            alert('Erreur lors de l\'importation: ' + error.message);
        }
    }

    chargerDonneesDepuisExcel() {
        this.operations = [];
        
        Object.keys(this.sheetsConfig).forEach(sheetKey => {
            const sheetName = this.sheetsConfig[sheetKey].name;
            if (this.workbook.Sheets[sheetName]) {
                const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetName]);
                
                data.forEach(row => {
                    const operation = this.normaliserLigneExcel(row, sheetKey);
                    if (operation) {
                        this.operations.push(operation);
                    }
                });
            }
        });

        this.sauvegarderLocal();
        this.showView(this.currentView);
        this.updateStats();
    }

    normaliserLigneExcel(row, sourceSheet) {
        return {
            id: Date.now() + Math.random(),
            date: row.Date || new Date().toISOString().split('T')[0],
            operateur: this.trouverOperateurDepuisSource(sourceSheet),
            groupe: row.Groupe || this.trouverGroupeDepuisSource(sourceSheet),
            typeOperation: row.Type || 'autre',
            description: row.Description || '',
            montant: parseFloat(row.Montant) || 0,
            operationParent: false
        };
    }

    trouverOperateurDepuisSource(sheetKey) {
        const operateurs = ['abdel', 'omar', 'hicham'];
        return operateurs.includes(sheetKey) ? sheetKey : 'abdel';
    }

    trouverGroupeDepuisSource(sheetKey) {
        const groupes = ['zaitoun', '3commain'];
        return groupes.includes(sheetKey) ? sheetKey : 'zaitoun';
    }

    exporterVersExcel() {
        if (this.operations.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        const wb = XLSX.utils.book_new();

        // Feuille principale
        const mainData = this.operations.map(op => ({
            'Date': op.date,
            'Opérateur': this.formaterOperateur(op.operateur),
            'Groupe': this.formaterGroupe(op.groupe),
            'Type Opération': this.formaterTypeOperation(op.typeOperation),
            'Description': op.description,
            'Montant (DH)': op.montant
        }));

        const mainSheet = XLSX.utils.json_to_sheet(mainData);
        XLSX.utils.book_append_sheet(wb, mainSheet, 'Toutes les opérations');

        // Feuilles spécifiques
        Object.keys(this.sheetsConfig).forEach(sheetKey => {
            const config = this.sheetsConfig[sheetKey];
            const filteredData = this.operations.filter(config.filter)
                .map(op => ({
                    'Date': op.date,
                    'Opérateur': this.formaterOperateur(op.operateur),
                    'Groupe': this.formaterGroupe(op.groupe),
                    'Type Opération': this.formaterTypeOperation(op.typeOperation),
                    'Description': op.description,
                    'Montant (DH)': op.montant
                }));

            if (filteredData.length > 0) {
                const sheet = XLSX.utils.json_to_sheet(filteredData);
                XLSX.utils.book_append_sheet(wb, sheet, config.name);
            }
        });

        XLSX.writeFile(wb, `samarche_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.afficherMessageSucces('Fichier Excel exporté avec succès !');
    }

    creerNouveauFichier() {
        if (confirm('Créer un nouveau fichier ? Les données actuelles seront conservées localement.')) {
            this.workbook = null;
            document.getElementById('fileInfo').innerHTML = 
                '<div class="file-info">Nouveau fichier créé - Données enregistrées localement</div>';
        }
    }
}

// Initialiser l'application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SamarcheApp();
});

