// app.js - Application principale Gestion Ferme Ben Amara - VERSION COMPLÈTE CORRIGÉE
console.log('🚀 Chargement de l\'application principale...');

class GestionFermeApp {
    constructor() {
        this.operations = [];
        this.transferts = [];
        this.currentView = 'global';
        this.editMode = false;
        this.selectedOperations = new Set();
        this.currentUser = null;
        this.userPermissions = {};
        
        this.initEventListeners();
        this.setupAuthHandlers();
    }

    initEventListeners() {
        // Écouteurs d'authentification
        window.addEventListener('userAuthenticated', (e) => this.handleUserAuthenticated(e.detail.user));
        window.addEventListener('userSignedOut', () => this.handleUserSignedOut());

        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Déconnexion
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.handleLogout());
        }
        
        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.handleNouvelleOperation(e));
        }
        
        const transfertForm = document.getElementById('transfertForm');
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.handleTransfert(e));
        }
        
        // Navigation par onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.sheet));
        });

        // Gestion édition
        const btnEditMode = document.getElementById('btnEditMode');
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode());
        }

        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => this.deleteSelectedOperations());
        }

        const btnCancelEdit = document.getElementById('btnCancelEdit');
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => this.cancelEditMode());
        }

        // Export
        const btnExportComplet = document.getElementById('btnExportComplet');
        if (btnExportComplet) {
            btnExportComplet.addEventListener('click', () => this.exportExcelComplet());
        }

        const btnExportVue = document.getElementById('btnExportVue');
        if (btnExportVue) {
            btnExportVue.addEventListener('click', () => this.exportVueActuelle());
        }

        const btnExportDetail = document.getElementById('btnExportDetail');
        if (btnExportDetail) {
            btnExportDetail.addEventListener('click', () => this.exportRapportComplet());
        }

        // Réinitialisation
        const btnResetLocal = document.getElementById('btnResetLocal');
        if (btnResetLocal) {
            btnResetLocal.addEventListener('click', () => this.resetLocalData());
        }

        const btnResetFirebase = document.getElementById('btnResetFirebase');
        if (btnResetFirebase) {
            btnResetFirebase.addEventListener('click', () => this.resetFirebaseData());
        }

        // Manuel
        const btnManual = document.getElementById('btnManual');
        if (btnManual) {
            btnManual.addEventListener('click', () => this.showManual());
        }

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Reset formulaire
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        // Gestion répartition
        const typeOperation = document.getElementById('typeOperation');
        if (typeOperation) {
            typeOperation.addEventListener('change', () => this.updateRepartition());
        }

        const groupe = document.getElementById('groupe');
        if (groupe) {
            groupe.addEventListener('change', () => this.updateRepartition());
        }

        const montant = document.getElementById('montant');
        if (montant) {
            montant.addEventListener('input', () => this.updateRepartition());
        }
    }

    setupAuthHandlers() {
        console.log('🔐 Configuration des gestionnaires d\'authentification...');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Afficher message de chargement
        const authMessage = document.createElement('div');
        authMessage.className = 'auth-message auth-loading';
        authMessage.textContent = '🔐 Connexion en cours...';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm.nextSibling) {
            loginForm.parentNode.insertBefore(authMessage, loginForm.nextSibling);
        } else {
            loginForm.parentNode.appendChild(authMessage);
        }

        try {
            console.log('📧 Tentative de connexion avec:', email);
            const result = await window.firebaseAuthFunctions.signInWithEmail(email, password);
            
            if (result.success) {
                authMessage.className = 'auth-message auth-info';
                authMessage.textContent = '✅ Connexion réussie! Redirection...';
                console.log('✅ Utilisateur connecté:', result.user.email);
            } else {
                authMessage.className = 'auth-message auth-error';
                authMessage.textContent = `❌ Erreur: ${result.error}`;
                console.error('❌ Erreur connexion:', result.error);
                
                if (result.code === 'auth/user-not-found') {
                    authMessage.textContent = '❌ Utilisateur non trouvé';
                } else if (result.code === 'auth/wrong-password') {
                    authMessage.textContent = '❌ Mot de passe incorrect';
                } else if (result.code === 'auth/invalid-email') {
                    authMessage.textContent = '❌ Email invalide';
                }
            }
        } catch (error) {
            authMessage.className = 'auth-message auth-error';
            authMessage.textContent = '❌ Erreur de connexion inattendue';
            console.error('❌ Erreur connexion:', error);
        }

        setTimeout(() => {
            if (authMessage.parentNode) {
                authMessage.remove();
            }
        }, 5000);
    }

    handleUserAuthenticated(user) {
        console.log('👤 Utilisateur authentifié dans l\'app:', user);
        console.log('📧 Email:', user.email);
        console.log('🔑 UID:', user.uid);
        
        this.currentUser = user;
        this.userPermissions = window.firebaseAuthFunctions.getViewPermissions(user);
        
        console.log('🔐 Permissions calculées:', this.userPermissions);
        
        // Masquer écran connexion, afficher application
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContent').style.display = 'block';
        
        // Mettre à jour l'interface utilisateur
        this.updateUserInterface();
        
        // Configurer l'opérateur automatiquement
        this.setupOperateurAuto();
        
        // Charger les données
        this.loadInitialData();
    }

    handleUserSignedOut() {
        console.log('👤 Utilisateur déconnecté de l\'app');
        this.currentUser = null;
        this.userPermissions = {};
        
        // Masquer application, afficher écran connexion
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Réinitialiser formulaire connexion
        document.getElementById('loginForm').reset();
    }

    async handleLogout() {
        try {
            console.log('🚪 Déconnexion en cours...');
            await window.firebaseAuthFunctions.signOut();
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            const userEmailElement = document.getElementById('userEmail');
            const userOperateurElement = document.getElementById('userOperateur');
            
            if (userEmailElement) {
                userEmailElement.textContent = this.currentUser.email;
            }
            
            const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email);
            if (operateur && userOperateurElement) {
                userOperateurElement.textContent = operateur.toUpperCase();
            }
            
            console.log('👤 Interface utilisateur mise à jour pour:', this.currentUser.email);
        }
    }

    setupOperateurAuto() {
        if (this.currentUser) {
            const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email);
            const selectOperateur = document.getElementById('operateur');
            
            if (operateur && selectOperateur) {
                selectOperateur.value = operateur;
                selectOperateur.disabled = true;
                console.log(`👤 Opérateur automatiquement défini: ${operateur}`);
            }
        }
    }

    async loadInitialData() {
        console.log('📥 Chargement des données initiales...');
        
        try {
            if (window.firebaseSync && window.firebaseSync.getCollection) {
                // Charger les opérations
                const operations = await window.firebaseSync.getCollection('operations');
                this.operations = operations || [];
                console.log(`✅ ${this.operations.length} opérations chargées`);
                
                // Charger les transferts
                const transferts = await window.firebaseSync.getCollection('transferts');
                this.transferts = transferts || [];
                console.log(`✅ ${this.transferts.length} transferts chargés`);
                
                // Debug des données
                this.debugData();
                
                // Mettre à jour l'affichage
                this.updateAffichage();
                this.updateStats();
                
            } else {
                console.error('❌ FirebaseSync non disponible');
                this.showMessage('⚠️ Synchronisation temporairement indisponible', 'warning');
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.showMessage('❌ Erreur de chargement des données', 'error');
        }
    }

    debugData() {
        console.log('🐛 Données de débogage:');
        console.log('- Opérations:', this.operations.length);
        console.log('- Transferts:', this.transferts.length);
        console.log('- Mode édition:', this.editMode);
        console.log('- Permissions:', this.userPermissions);
        
        // Afficher les IDs des premières opérations
        if (this.operations.length > 0) {
            console.log('- Exemple ID opération:', this.operations[0].id);
            console.log('- Données opération:', this.operations[0]);
        }
        if (this.transferts.length > 0) {
            console.log('- Exemple ID transfert:', this.transferts[0].id);
            console.log('- Données transfert:', this.transferts[0]);
        }
    }

    updateAffichage() {
    console.log('🔄 Mise à jour affichage pour la vue:', this.currentView);
    
    const dataDisplay = document.getElementById('dataDisplay');
    if (!dataDisplay) return;
    
    // Filtrer les données selon la vue actuelle
    let dataToShow = [];
    
    switch (this.currentView) {
        case 'global':
            dataToShow = [...this.operations, ...this.transferts];
            break;
        case 'zaitoun':
            // Toutes les opérations de la caisse zaitoun + opérations du groupe zaitoun + opérations des deux groupes
            dataToShow = this.operations.filter(op => 
                op.caisse === 'zaitoun_caisse' || 
                op.groupe === 'zaitoun' || 
                op.groupe === 'les_deux_groupes'
            );
            break;
        case '3commain':
            // Toutes les opérations de la caisse 3commain + opérations du groupe 3commain + opérations des deux groupes
            dataToShow = this.operations.filter(op => 
                op.caisse === '3commain_caisse' || 
                op.groupe === '3commain' || 
                op.groupe === 'les_deux_groupes'
            );
            break;
        case 'abdel':
            dataToShow = this.operations.filter(op => 
                op.caisse === 'abdel_caisse' || op.operateur === 'abdel'
            );
            break;
        case 'omar':
            dataToShow = this.operations.filter(op => 
                op.caisse === 'omar_caisse' || op.operateur === 'omar'
            );
            break;
        case 'hicham':
            dataToShow = this.operations.filter(op => 
                op.caisse === 'hicham_caisse' || op.operateur === 'hicham'
            );
            break;
        case 'transferts':
            dataToShow = this.transferts;
            break;
        case 'les_deux_groupes':
            // Vue spéciale pour les opérations des deux groupes
            dataToShow = this.operations.filter(op => op.groupe === 'les_deux_groupes');
            break;
    }
    
    console.log(`📊 Données à afficher pour ${this.currentView}:`, dataToShow.length);
    
    // Trier par date (plus récent en premier)
    dataToShow.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Afficher les données
    this.renderDataTable(dataToShow, dataDisplay);
    
    // Afficher aussi les totaux pour cette vue
    this.afficherTotauxVue(dataToShow);
}

    renderDataTable(data, container) {
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-message">Aucune donnée à afficher</div>';
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${this.editMode ? '<th><input type="checkbox" id="selectAll" title="Tout sélectionner"></th>' : ''}
                        <th>Date</th>
                        <th>Opérateur</th>
                        <th>Type</th>
                        <th>Groupe</th>
                        <th>Transaction</th>
                        <th>Caisse</th>
                        <th>Montant</th>
                        <th>Description</th>
                        ${!this.editMode ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            const isOperation = item.hasOwnProperty('typeOperation');
            const canEdit = this.currentUser && window.firebaseAuthFunctions.canModifyOperation(item, this.currentUser);
            
            // Utiliser l'ID Firebase comme identifiant
            const itemId = item.id;
            
            console.log('🔐 Permission pour item:', {
                id: itemId,
                operateur: item.operateur,
                canEdit: canEdit,
                currentUser: this.currentUser ? this.currentUser.email : 'null',
                operateurConnecte: window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser?.email)
            });
            
            html += `
                <tr class="${!canEdit ? 'operation-readonly' : ''}" data-id="${itemId}">
                    ${this.editMode ? `
                        <td style="text-align: center; vertical-align: middle;">
                            ${canEdit ? 
                                `<input type="checkbox" class="operation-checkbox" value="${itemId}" title="Sélectionner cette opération">` : 
                                '<span style="color: #999; font-size: 12px;">🔒</span>'
                            }
                        </td>
                    ` : ''}
                    <td>${new Date(item.timestamp).toLocaleDateString('fr-FR')}</td>
                    <td>${item.operateur || 'N/A'}</td>
                    <td>${item.typeOperation || 'Transfert'}</td>
                    <td>${item.groupe || 'N/A'}</td>
                    <td class="type-${item.typeTransaction || 'transfert'}">
                        ${isOperation ? (item.typeTransaction === 'revenu' ? '💰 Revenu' : '💸 Frais') : '🔄 Transfert'}
                    </td>
                    <td>${item.caisse || `${item.caisseSource} → ${item.caisseDestination}`}</td>
                    <td style="font-weight: bold; color: ${(item.typeTransaction === 'revenu' || !isOperation) ? '#27ae60' : '#e74c3c'}">
                        ${item.montant ? `${parseFloat(item.montant).toFixed(2)} DH` : (item.montantTransfert ? `${parseFloat(item.montantTransfert).toFixed(2)} DH` : 'N/A')}
                    </td>
                    <td>${item.description || item.descriptionTransfert || ''}</td>
                    ${!this.editMode ? `
                        <td class="operation-actions">
                            ${canEdit ? `
                                <button onclick="gestionFermeApp.editOperation('${itemId}')" class="btn-small btn-warning" title="Modifier">✏️</button>
                                <button onclick="gestionFermeApp.deleteOperation('${itemId}')" class="btn-small btn-danger" title="Supprimer">🗑️</button>
                            ` : '<span style="color: #999; font-size: 11px; font-style: italic;">Lecture seule</span>'}
                        </td>
                    ` : ''}
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Ajouter les écouteurs d'événements pour les cases à cocher
        if (this.editMode) {
            this.setupCheckboxListeners();
        }
    }

    afficherTotauxVue(data) {
        const dataDisplay = document.getElementById('dataDisplay');
        if (!dataDisplay || data.length === 0) return;
        
        // Calculer les totaux
        let totalRevenus = 0;
        let totalDepenses = 0;
        let totalTransferts = 0;
        
        data.forEach(item => {
            if (item.hasOwnProperty('typeOperation')) {
                // C'est une opération
                const montant = parseFloat(item.montant) || 0;
                if (item.typeTransaction === 'revenu') {
                    totalRevenus += montant;
                } else {
                    totalDepenses += montant;
                }
            } else {
                // C'est un transfert
                totalTransferts += parseFloat(item.montantTransfert) || 0;
            }
        });
        
        const soldeNet = totalRevenus - totalDepenses;
        
        const htmlTotaux = `
            <div class="vue-header">
                <h3>📊 Totaux pour la vue "${this.getNomVue(this.currentView)}"</h3>
                <div class="totals-container">
                    <div class="total-item">
                        <span class="total-label">💰 Revenus</span>
                        <span class="total-value positive">${totalRevenus.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">💸 Dépenses</span>
                        <span class="total-value negative">${totalDepenses.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">🔄 Transferts</span>
                        <span class="total-value">${totalTransferts.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">⚖️ Solde Net</span>
                        <span class="total-value ${soldeNet >= 0 ? 'positive' : 'negative'}">${soldeNet.toFixed(2)} DH</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insérer les totaux avant le tableau
        dataDisplay.innerHTML = htmlTotaux + dataDisplay.innerHTML;
    }

    getNomVue(vue) {
        const noms = {
            'global': 'Toutes les opérations',
            'zaitoun': 'Zaitoun',
            '3commain': '3 Commain', 
            'abdel': 'Abdel',
            'omar': 'Omar',
            'hicham': 'Hicham',
            'transferts': 'Transferts'
        };
        return noms[vue] || vue;
    }

    setupCheckboxListeners() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
        
        // Ajouter les écouteurs pour les cases à cocher individuelles
        document.querySelectorAll('.operation-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const operationId = e.target.value;
                if (e.target.checked) {
                    this.selectedOperations.add(operationId);
                } else {
                    this.selectedOperations.delete(operationId);
                }
                console.log('📋 Opérations sélectionnées:', this.selectedOperations.size);
                this.updateSelectedCount();
                
                // Désélectionner "Tout sélectionner" si une case est décochée
                if (selectAll && !e.target.checked) {
                    selectAll.checked = false;
                }
            });
        });
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.operation-checkbox');
        let selectedCount = 0;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedOperations.add(checkbox.value);
                selectedCount++;
            } else {
                this.selectedOperations.delete(checkbox.value);
            }
        });
        
        // Mettre à jour le bouton de suppression
        this.updateSelectedCount();
        
        console.log('☑️ Opérations sélectionnées:', this.selectedOperations.size);
    }

    updateSelectedCount() {
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected && this.editMode) {
            btnDeleteSelected.textContent = `🗑️ Supprimer (${this.selectedOperations.size})`;
        }
    }

   updateStats() {
    console.log('📊 Calcul des soldes des caisses...');
    
    // Réinitialiser les soldes à 0 pour chaque caisse
    const soldes = {
        'abdel_caisse': 0,
        'omar_caisse': 0, 
        'hicham_caisse': 0,
        'zaitoun_caisse': 0,
        '3commain_caisse': 0
    };

    console.log('💰 Calcul basé sur:', {
        operations: this.operations.length,
        transferts: this.transferts.length
    });

    // 1. Calculer les soldes basés sur les opérations
    this.operations.forEach(operation => {
        const montant = parseFloat(operation.montant) || 0;
        const caisse = operation.caisse;
        
        console.log('📝 Opération:', {
            caisse: caisse,
            type: operation.typeTransaction,
            montant: montant,
            description: operation.description,
            hasRepartition: !!operation.repartition
        });
        
        if (caisse && soldes[caisse] !== undefined) {
            if (operation.typeTransaction === 'revenu') {
                // Revenu : ajouter au solde
                soldes[caisse] += montant;
                console.log(`➕ ${caisse}: +${montant} = ${soldes[caisse]}`);
            } else if (operation.typeTransaction === 'frais') {
                // Frais : soustraire du solde
                
                // CORRECTION : Si c'est un travailleur_global, répartir le coût
                if (operation.typeOperation === 'travailleur_global' && operation.repartition) {
                    const repartition = operation.repartition;
                    console.log('🔀 Répartition détectée:', repartition);
                    
                    // La caisse qui paie perd le montant total
                    soldes[caisse] -= montant;
                    console.log(`➖ ${caisse} (paie total): -${montant} = ${soldes[caisse]}`);
                    
                    // Mais on répartit le coût entre Zaitoun et 3 Commain
                    // Pour l'affichage des soldes, on considère que chaque caisse supporte sa part
                    // Note: Ceci est pour l'information comptable, l'argent réel reste sur la caisse qui a payé
                    
                } else {
                    // Frais normal : soustraire du solde
                    soldes[caisse] -= montant;
                    console.log(`➖ ${caisse}: -${montant} = ${soldes[caisse]}`);
                }
            }
        }
    });

    // 2. Gérer les transferts entre caisses
    this.transferts.forEach(transfert => {
        const montant = parseFloat(transfert.montantTransfert) || 0;
        
        console.log('🔄 Transfert:', {
            source: transfert.caisseSource,
            destination: transfert.caisseDestination,
            montant: montant
        });
        
        // Soustraire de la caisse source
        if (transfert.caisseSource && soldes[transfert.caisseSource] !== undefined) {
            soldes[transfert.caisseSource] -= montant;
            console.log(`➖ ${transfert.caisseSource}: -${montant} = ${soldes[transfert.caisseSource]}`);
        }
        
        // Ajouter à la caisse destination
        if (transfert.caisseDestination && soldes[transfert.caisseDestination] !== undefined) {
            soldes[transfert.caisseDestination] += montant;
            console.log(`➕ ${transfert.caisseDestination}: +${montant} = ${soldes[transfert.caisseDestination]}`);
        }
    });

    console.log('📊 Soldes finaux:', soldes);
    
    // Afficher les soldes
    this.renderStats(soldes);
}

    renderStats(soldes) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const nomsCaisses = {
            'abdel_caisse': '👨‍💼 Caisse Abdel',
            'omar_caisse': '👨‍💻 Caisse Omar', 
            'hicham_caisse': '👨‍🔧 Caisse Hicham',
            'zaitoun_caisse': '🫒 Caisse Zaitoun',
            '3commain_caisse': '🔧 Caisse 3 Commain'
        };

        let html = '';
        
        Object.keys(soldes).forEach(caisse => {
            const solde = soldes[caisse];
            const classeSolde = solde >= 0 ? 'solde-positif' : 'solde-negatif';
            const icone = solde >= 0 ? '📈' : '📉';
            
            html += `
                <div class="stat-card ${classeSolde}" onclick="gestionFermeApp.showDetailsCaisse('${caisse}')">
                    <div class="stat-label">${nomsCaisses[caisse] || caisse}</div>
                    <div class="stat-value">${solde.toFixed(2)} DH</div>
                    <div class="stat-trend">${icone} ${solde >= 0 ? 'Positif' : 'Négatif'}</div>
                </div>
            `;
        });

        statsContainer.innerHTML = html;
    }

    showDetailsCaisse(caisse) {
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const transfertsSource = this.transferts.filter(t => t.caisseSource === caisse);
        const transfertsDestination = this.transferts.filter(t => t.caisseDestination === caisse);
        
        let totalRevenus = operationsCaisse
            .filter(op => op.typeTransaction === 'revenu')
            .reduce((sum, op) => sum + (parseFloat(op.montant) || 0), 0);
            
        let totalDepenses = operationsCaisse
            .filter(op => op.typeTransaction === 'frais')
            .reduce((sum, op) => sum + (parseFloat(op.montant) || 0), 0);
        
        let totalSortants = transfertsSource
            .reduce((sum, t) => sum + (parseFloat(t.montantTransfert) || 0), 0);
            
        let totalEntrants = transfertsDestination
            .reduce((sum, t) => sum + (parseFloat(t.montantTransfert) || 0), 0);
        
        const solde = totalRevenus - totalDepenses - totalSortants + totalEntrants;
        
        let message = `📊 Détails de ${this.getNomCaisse(caisse)}:\n\n`;
        message += `📝 Opérations: ${operationsCaisse.length}\n`;
        message += `💰 Revenus: ${totalRevenus.toFixed(2)} DH\n`;
        message += `💸 Dépenses: ${totalDepenses.toFixed(2)} DH\n`;
        message += `🔄 Transferts sortants: ${transfertsSource.length} (${totalSortants.toFixed(2)} DH)\n`;
        message += `🔄 Transferts entrants: ${transfertsDestination.length} (${totalEntrants.toFixed(2)} DH)\n\n`;
        message += `⚖️ Solde calculé: ${solde.toFixed(2)} DH\n`;
        message += `📋 Total mouvements: ${operationsCaisse.length + transfertsSource.length + transfertsDestination.length}`;
        
        alert(message);
    }

    getNomCaisse(caisse) {
        const noms = {
            'abdel_caisse': 'Caisse Abdel',
            'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham',
            'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        return noms[caisse] || caisse;
    }

   updateRepartition() {
    const typeOperation = document.getElementById('typeOperation').value;
    const groupe = document.getElementById('groupe').value;
    const montant = parseFloat(document.getElementById('montant').value) || 0;
    
    const repartitionInfo = document.getElementById('repartitionInfo');
    const repartitionDetails = document.getElementById('repartitionDetails');
    
    // Afficher la répartition seulement pour "travailleur_global" et "les_deux_groupes"
    if (typeOperation === 'travailleur_global' && groupe === 'les_deux_groupes' && montant > 0) {
        let zaitounPart = 0;
        let commainPart = 0;
        
        // Calcul des parts
        zaitounPart = parseFloat((montant * (1/3)).toFixed(2));
        commainPart = parseFloat((montant * (2/3)).toFixed(2));
        
        repartitionDetails.innerHTML = `
            <div class="repartition-details">
                <div class="repartition-item zaitoun">
                    <strong>🫒 Zaitoun</strong><br>
                    Part: 1/3<br>
                    ${zaitounPart.toFixed(2)} DH<br>
                    <small>33.3%</small>
                </div>
                <div class="repartition-item commain">
                    <strong>🔧 3 Commain</strong><br>
                    Part: 2/3<br>
                    ${commainPart.toFixed(2)} DH<br>
                    <small>66.7%</small>
                </div>
                <div class="repartition-total">
                    <strong>💰 Total payé</strong><br>
                    ${montant.toFixed(2)} DH
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                <strong>ℹ️ Information :</strong> Le montant total sera payé par la caisse sélectionnée et réparti entre les deux groupes
            </div>
        `;
        repartitionInfo.style.display = 'block';
    } else {
        repartitionInfo.style.display = 'none';
    }
}

   async handleNouvelleOperation(e) {
    e.preventDefault();
    console.log('➕ Nouvelle opération en cours...');
    
    if (!this.currentUser) {
        this.showMessage('❌ Vous devez être connecté', 'error');
        return;
    }
    
    const operateur = document.getElementById('operateur').value;
    const typeOperation = document.getElementById('typeOperation').value;
    const groupe = document.getElementById('groupe').value;
    const typeTransaction = document.getElementById('typeTransaction').value;
    const caisse = document.getElementById('caisse').value;
    const montantTotal = parseFloat(document.getElementById('montant').value);
    const description = document.getElementById('description').value.trim();
    
    // Validation
    if (!montantTotal || montantTotal <= 0) {
        this.showMessage('❌ Le montant doit être supérieur à 0', 'error');
        return;
    }
    
    if (!description) {
        this.showMessage('❌ Veuillez saisir une description', 'error');
        return;
    }
    
    try {
        if (window.firebaseSync) {
            // CAS TRAVAILLEUR GLOBAL + LES DEUX GROUPES
            if (typeOperation === 'travailleur_global' && groupe === 'les_deux_groupes') {
                // Calcul des parts 1/3 et 2/3
                const montantZaitoun = parseFloat((montantTotal * (1/3)).toFixed(2));
                const montantCommain = parseFloat((montantTotal * (2/3)).toFixed(2));
                
                console.log('💰 RÉPARTITION 1/3 - 2/3:', {
                    total: montantTotal,
                    zaitoun: montantZaitoun,
                    commain: montantCommain
                });

                // CRÉATION DE DEUX OPÉRATIONS DISTINCTES

                // 1. OPÉRATION POUR ZAITOUN (1/3)
                const operationZaitoun = {
                    operateur: operateur,
                    groupe: 'zaitoun',
                    typeOperation: 'zaitoun',
                    typeTransaction: typeTransaction,
                    caisse: 'zaitoun_caisse', // CAISSE SPÉCIFIQUE ZAITOUN
                    montant: typeTransaction === 'frais' ? -montantZaitoun : montantZaitoun,
                    description: `${description} - Part Zaitoun (1/3 = ${montantZaitoun} DH)`,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser.uid,
                    userEmail: this.currentUser.email,
                    repartition: {
                        type: 'travailleur_global',
                        part: 'zaitoun',
                        montant_original: montantTotal,
                        pourcentage: '33.3%'
                    }
                };

                // 2. OPÉRATION POUR 3 COMMAIN (2/3)
                const operationCommain = {
                    operateur: operateur,
                    groupe: '3commain',
                    typeOperation: '3commain',
                    typeTransaction: typeTransaction,
                    caisse: '3commain_caisse', // CAISSE SPÉCIFIQUE 3 COMMAIN
                    montant: typeTransaction === 'frais' ? -montantCommain : montantCommain,
                    description: `${description} - Part 3 Commain (2/3 = ${montantCommain} DH)`,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser.uid,
                    userEmail: this.currentUser.email,
                    repartition: {
                        type: 'travailleur_global',
                        part: '3commain',
                        montant_original: montantTotal,
                        pourcentage: '66.7%'
                    }
                };

                console.log('📝 ENREGISTREMENT DES DEUX OPÉRATIONS:', {
                    zaitoun: operationZaitoun,
                    commain: operationCommain
                });

                // ENREGISTREMENT DES DEUX OPÉRATIONS
                await window.firebaseSync.addDocument('operations', operationZaitoun);
                await window.firebaseSync.addDocument('operations', operationCommain);
                
                this.showMessage(`✅ RÉPARTITION EFFECTUÉE! Zaitoun: ${montantZaitoun} DH (1/3) + 3 Commain: ${montantCommain} DH (2/3)`, 'success');

            } 
            // CAS OPÉRATION NORMALE (UN SEUL GROUPE)
            else {
                const operation = {
                    operateur: operateur,
                    groupe: groupe,
                    typeOperation: typeOperation,
                    typeTransaction: typeTransaction,
                    caisse: caisse,
                    montant: typeTransaction === 'frais' ? -montantTotal : montantTotal,
                    description: description,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser.uid,
                    userEmail: this.currentUser.email
                };
                
                console.log('📝 ENREGISTREMENT OPÉRATION NORMALE:', operation);
                
                await window.firebaseSync.addDocument('operations', operation);
                this.showMessage('✅ Opération enregistrée avec succès', 'success');
            }
            
            // Réinitialisation du formulaire
            e.target.reset();
            document.getElementById('repartitionInfo').style.display = 'none';
            
            // Rechargement des données
            this.loadInitialData();
            
        } else {
            this.showMessage('❌ Erreur de synchronisation', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur enregistrement opération:', error);
        this.showMessage('❌ Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}
    async handleTransfert(e) {
        e.preventDefault();
        console.log('🔄 Transfert en cours...');
        
        if (!this.currentUser) {
            this.showMessage('❌ Vous devez être connecté', 'error');
            return;
        }
        
        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        
        if (caisseSource === caisseDestination) {
            this.showMessage('❌ La caisse source et destination doivent être différentes', 'error');
            return;
        }
        
        const transfert = {
            caisseSource: caisseSource,
            caisseDestination: caisseDestination,
            montantTransfert: parseFloat(document.getElementById('montantTransfert').value),
            descriptionTransfert: document.getElementById('descriptionTransfert').value,
            operateur: window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email),
            timestamp: new Date().toISOString(),
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email
        };
        
        try {
            if (window.firebaseSync) {
                await window.firebaseSync.addDocument('transferts', transfert);
                this.showMessage('✅ Transfert effectué avec succès', 'success');
                e.target.reset();
                this.loadInitialData();
            }
        } catch (error) {
            console.error('❌ Erreur enregistrement transfert:', error);
            this.showMessage('❌ Erreur lors du transfert', 'error');
        }
    }

    switchView(view) {
        console.log('🔀 Changement de vue:', view);
        this.currentView = view;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sheet === view);
        });
        
        this.updateAffichage();
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        const appContent = document.getElementById('appContent');
        
        if (btnEditMode) {
            if (this.editMode) {
                btnEditMode.textContent = '💾 Quitter Édition';
                btnEditMode.className = 'btn-success';
                // Ajouter un indicateur visuel
                if (appContent) {
                    appContent.classList.add('edit-mode-active');
                }
            } else {
                btnEditMode.textContent = '✏️ Mode Édition';
                btnEditMode.className = 'btn-warning';
                // Retirer l'indicateur visuel
                if (appContent) {
                    appContent.classList.remove('edit-mode-active');
                }
                this.selectedOperations.clear();
            }
        }
        
        if (btnDeleteSelected) {
            btnDeleteSelected.style.display = this.editMode ? 'inline-block' : 'none';
            if (this.editMode) {
                btnDeleteSelected.textContent = `🗑️ Supprimer (${this.selectedOperations.size})`;
            }
        }
        
        if (btnCancelEdit) {
            btnCancelEdit.style.display = this.editMode ? 'inline-block' : 'none';
        }
        
        // Mettre à jour l'affichage
        this.updateAffichage();
        
        // Afficher un message
        if (this.editMode) {
            this.showMessage('✏️ Mode édition activé - Sélectionnez les opérations à modifier', 'info');
        } else {
            this.showMessage('✅ Mode édition désactivé', 'success');
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-${type}`;
        messageDiv.textContent = message;
        
        const appContent = document.getElementById('appContent');
        if (appContent) {
            const header = appContent.querySelector('header');
            if (header) {
                header.appendChild(messageDiv);
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 5000);
            }
        }
    }

    resetForm() {
        document.getElementById('saisieForm').reset();
        document.getElementById('repartitionInfo').style.display = 'none';
        this.showMessage('📝 Formulaire réinitialisé', 'info');
    }

    showManual() {
        document.getElementById('manualModal').style.display = 'flex';
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // FONCTIONS D'EXPORT
    exportExcelComplet() {
        console.log('📊 Export Excel complet...');
        try {
            if (!window.XLSX) {
                this.showMessage('❌ Bibliothèque Excel non chargée', 'error');
                return;
            }

            // Créer un classeur
            const wb = XLSX.utils.book_new();
            
            // Préparer les données pour les opérations
            const operationsData = this.operations.map(op => ({
                'Date': new Date(op.timestamp).toLocaleDateString('fr-FR'),
                'Heure': new Date(op.timestamp).toLocaleTimeString('fr-FR'),
                'Opérateur': op.operateur,
                'Type Opération': op.typeOperation,
                'Groupe': op.groupe,
                'Transaction': op.typeTransaction === 'revenu' ? 'Revenu' : 'Frais',
                'Caisse': op.caisse,
                'Montant (DH)': parseFloat(op.montant),
                'Description': op.description,
                'Email Utilisateur': op.userEmail
            }));
            
            // Préparer les données pour les transferts
            const transfertsData = this.transferts.map(tr => ({
                'Date': new Date(tr.timestamp).toLocaleDateString('fr-FR'),
                'Heure': new Date(tr.timestamp).toLocaleTimeString('fr-FR'),
                'Opérateur': tr.operateur,
                'Type': 'Transfert',
                'Caisse Source': tr.caisseSource,
                'Caisse Destination': tr.caisseDestination,
                'Montant (DH)': parseFloat(tr.montantTransfert),
                'Description': tr.descriptionTransfert,
                'Email Utilisateur': tr.userEmail
            }));
            
            // Créer les feuilles
            const wsOperations = XLSX.utils.json_to_sheet(operationsData);
            const wsTransferts = XLSX.utils.json_to_sheet(transfertsData);
            
            // Ajouter les feuilles au classeur
            XLSX.utils.book_append_sheet(wb, wsOperations, 'Opérations');
            XLSX.utils.book_append_sheet(wb, wsTransferts, 'Transferts');
            
            // Générer le fichier et le télécharger
            const fileName = `gestion_ferme_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showMessage('✅ Export Excel réussi!', 'success');
            
        } catch (error) {
            console.error('❌ Erreur export Excel:', error);
            this.showMessage('❌ Erreur lors de l\'export Excel', 'error');
        }
    }

    exportVueActuelle() {
        console.log('📋 Export vue actuelle...');
        try {
            if (!window.XLSX) {
                this.showMessage('❌ Bibliothèque Excel non chargée', 'error');
                return;
            }

            // Obtenir les données de la vue actuelle
            let dataToExport = [];
            let sheetName = '';
            
            switch (this.currentView) {
                case 'global':
                    dataToExport = [...this.operations, ...this.transferts];
                    sheetName = 'Toutes_les_donnees';
                    break;
                case 'zaitoun':
                    dataToExport = this.operations.filter(op => 
                        op.caisse === 'zaitoun_caisse' || op.groupe === 'zaitoun'
                    );
                    sheetName = 'Zaitoun';
                    break;
                case '3commain':
                    dataToExport = this.operations.filter(op => 
                        op.caisse === '3commain_caisse' || op.groupe === '3commain'
                    );
                    sheetName = '3_Commain';
                    break;
                case 'abdel':
                    dataToExport = this.operations.filter(op => 
                        op.caisse === 'abdel_caisse' || op.operateur === 'abdel'
                    );
                    sheetName = 'Abdel';
                    break;
                case 'omar':
                    dataToExport = this.operations.filter(op => 
                        op.caisse === 'omar_caisse' || op.operateur === 'omar'
                    );
                    sheetName = 'Omar';
                    break;
                case 'hicham':
                    dataToExport = this.operations.filter(op => 
                        op.caisse === 'hicham_caisse' || op.operateur === 'hicham'
                    );
                    sheetName = 'Hicham';
                    break;
                case 'transferts':
                    dataToExport = this.transferts;
                    sheetName = 'Transferts';
                    break;
            }
            
            // Préparer les données
            const exportData = dataToExport.map(item => {
                if (item.hasOwnProperty('typeOperation')) {
                    // C'est une opération
                    return {
                        'Date': new Date(item.timestamp).toLocaleDateString('fr-FR'),
                        'Heure': new Date(item.timestamp).toLocaleTimeString('fr-FR'),
                        'Opérateur': item.operateur,
                        'Type': item.typeOperation,
                        'Groupe': item.groupe,
                        'Transaction': item.typeTransaction === 'revenu' ? 'Revenu' : 'Frais',
                        'Caisse': item.caisse,
                        'Montant (DH)': parseFloat(item.montant),
                        'Description': item.description
                    };
                } else {
                    // C'est un transfert
                    return {
                        'Date': new Date(item.timestamp).toLocaleDateString('fr-FR'),
                        'Heure': new Date(item.timestamp).toLocaleTimeString('fr-FR'),
                        'Opérateur': item.operateur,
                        'Type': 'Transfert',
                        'Caisse Source': item.caisseSource,
                        'Caisse Destination': item.caisseDestination,
                        'Montant (DH)': parseFloat(item.montantTransfert),
                        'Description': item.descriptionTransfert
                    };
                }
            });
            
            if (exportData.length === 0) {
                this.showMessage('❌ Aucune donnée à exporter pour cette vue', 'warning');
                return;
            }
            
            // Créer et télécharger le fichier
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            const fileName = `gestion_ferme_${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showMessage(`✅ Export ${sheetName} réussi!`, 'success');
            
        } catch (error) {
            console.error('❌ Erreur export vue:', error);
            this.showMessage('❌ Erreur lors de l\'export', 'error');
        }
    }

    exportRapportComplet() {
        console.log('📈 Rapport complet...');
        try {
            if (!window.XLSX) {
                this.showMessage('❌ Bibliothèque Excel non chargée', 'error');
                return;
            }

            const wb = XLSX.utils.book_new();
            
            // 1. Feuille de synthèse
            const soldes = this.calculerSoldes();
            const syntheseData = Object.keys(soldes).map(caisse => ({
                'Caisse': this.getNomCaisse(caisse),
                'Solde (DH)': soldes[caisse],
                'Statut': soldes[caisse] >= 0 ? 'Positif' : 'Négatif'
            }));
            
            const wsSynthese = XLSX.utils.json_to_sheet(syntheseData);
            XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse');
            
            // 2. Statistiques détaillées
            const statsData = this.calculerStatistiquesDetaillees();
            const wsStats = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
            
            // 3. Toutes les opérations
            const allOperations = [...this.operations, ...this.transferts]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
            const operationsData = allOperations.map(item => {
                const base = {
                    'Date': new Date(item.timestamp).toLocaleDateString('fr-FR'),
                    'Heure': new Date(item.timestamp).toLocaleTimeString('fr-FR'),
                    'Opérateur': item.operateur
                };
                
                if (item.hasOwnProperty('typeOperation')) {
                    return {
                        ...base,
                        'Type': 'Opération',
                        'Sous-type': item.typeOperation,
                        'Groupe': item.groupe,
                        'Transaction': item.typeTransaction,
                        'Caisse': item.caisse,
                        'Montant (DH)': parseFloat(item.montant),
                        'Description': item.description
                    };
                } else {
                    return {
                        ...base,
                        'Type': 'Transfert',
                        'Caisse Source': item.caisseSource,
                        'Caisse Destination': item.caisseDestination,
                        'Montant (DH)': parseFloat(item.montantTransfert),
                        'Description': item.descriptionTransfert
                    };
                }
            });
            
            const wsOperations = XLSX.utils.json_to_sheet(operationsData);
            XLSX.utils.book_append_sheet(wb, wsOperations, 'Toutes_Operations');
            
            // Télécharger le fichier
            const fileName = `rapport_complet_ferme_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showMessage('✅ Rapport complet généré avec succès!', 'success');
            
        } catch (error) {
            console.error('❌ Erreur rapport complet:', error);
            this.showMessage('❌ Erreur lors de la génération du rapport', 'error');
        }
    }

    calculerSoldes() {
        const soldes = {
            'abdel_caisse': 0,
            'omar_caisse': 0,
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };

        // Opérations
        this.operations.forEach(op => {
            const montant = parseFloat(op.montant) || 0;
            if (op.caisse && soldes[op.caisse] !== undefined) {
                if (op.typeTransaction === 'revenu') {
                    soldes[op.caisse] += montant;
                } else {
                    soldes[op.caisse] -= montant;
                }
            }
        });

        // Transferts
        this.transferts.forEach(tr => {
            const montant = parseFloat(tr.montantTransfert) || 0;
            if (tr.caisseSource && soldes[tr.caisseSource] !== undefined) {
                soldes[tr.caisseSource] -= montant;
            }
            if (tr.caisseDestination && soldes[tr.caisseDestination] !== undefined) {
                soldes[tr.caisseDestination] += montant;
            }
        });

        return soldes;
    }

    calculerStatistiquesDetaillees() {
        const stats = [];
        
        // Par caisse
        const caisses = ['abdel_caisse', 'omar_caisse', 'hicham_caisse', 'zaitoun_caisse', '3commain_caisse'];
        
        caisses.forEach(caisse => {
            const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
            const revenus = operationsCaisse.filter(op => op.typeTransaction === 'revenu')
                .reduce((sum, op) => sum + (parseFloat(op.montant) || 0), 0);
            const depenses = operationsCaisse.filter(op => op.typeTransaction === 'frais')
                .reduce((sum, op) => sum + (parseFloat(op.montant) || 0), 0);
                
            stats.push({
                'Catégorie': 'Par Caisse',
                'Détail': this.getNomCaisse(caisse),
                'Nombre Opérations': operationsCaisse.length,
                'Total Revenus (DH)': revenus,
                'Total Dépenses (DH)': depenses,
                'Solde (DH)': revenus - depenses
            });
        });
        
        // Par opérateur
        const operateurs = ['abdel', 'omar', 'hicham'];
        operateurs.forEach(operateur => {
            const operationsOperateur = this.operations.filter(op => op.operateur === operateur);
            const count = operationsOperateur.length;
            const total = operationsOperateur.reduce((sum, op) => {
                const montant = parseFloat(op.montant) || 0;
                return op.typeTransaction === 'revenu' ? sum + montant : sum - montant;
            }, 0);
            
            stats.push({
                'Catégorie': 'Par Opérateur',
                'Détail': operateur.charAt(0).toUpperCase() + operateur.slice(1),
                'Nombre Opérations': count,
                'Impact Total (DH)': total
            });
        });
        
        return stats;
    }

    // FONCTIONS DE RÉINITIALISATION
    resetLocalData() {
        if (confirm('Êtes-vous sûr de vouloir vider les données locales? Les données Firebase ne seront pas affectées.')) {
            console.log('🗑️ Reset données locales...');
            
            // Vider les données locales
            this.operations = [];
            this.transferts = [];
            this.selectedOperations.clear();
            
            // Mettre à jour l'affichage
            this.updateAffichage();
            this.updateStats();
            
            this.showMessage('✅ Données locales vidées avec succès', 'success');
        }
    }

    async resetFirebaseData() {
        if (!this.currentUser) {
            this.showMessage('❌ Vous devez être connecté', 'error');
            return;
        }
        
        if (!window.firebaseAuthFunctions.canResetFirebase(this.currentUser)) {
            this.showMessage('❌ Seul l\'administrateur peut réinitialiser Firebase', 'error');
            return;
        }
        
        if (confirm('🚨 ATTENTION! Cette action supprimera TOUTES les données Firebase. Cette action est irréversible. Êtes-vous ABSOLUMENT sûr?')) {
            try {
                console.log('🚨 Reset Firebase en cours...');
                this.showMessage('🔄 Suppression des données Firebase...', 'info');
                
                // Supprimer toutes les opérations
                const operationsSnapshot = await window.firebaseDb.collection('operations').get();
                const deleteOperations = operationsSnapshot.docs.map(doc => 
                    window.firebaseSync.deleteDocument('operations', doc.id)
                );
                
                // Supprimer tous les transferts
                const transfertsSnapshot = await window.firebaseDb.collection('transferts').get();
                const deleteTransferts = transfertsSnapshot.docs.map(doc => 
                    window.firebaseSync.deleteDocument('transferts', doc.id)
                );
                
                // Attendre que toutes les suppressions soient terminées
                await Promise.all([...deleteOperations, ...deleteTransferts]);
                
                // Vider aussi les données locales
                this.operations = [];
                this.transferts = [];
                this.selectedOperations.clear();
                
                // Mettre à jour l'affichage
                this.updateAffichage();
                this.updateStats();
                
                this.showMessage('✅ Toutes les données ont été réinitialisées avec succès', 'success');
                
            } catch (error) {
                console.error('❌ Erreur réinitialisation Firebase:', error);
                this.showMessage('❌ Erreur lors de la réinitialisation', 'error');
            }
        }
    }

    // FONCTIONS D'ÉDITION
    editOperation(id) {
        console.log('✏️ Édition opération:', id);
        
        // Trouver l'opération
        const operation = this.operations.find(op => op.id === id);
        const transfert = this.transferts.find(tr => tr.id === id);
        
        if (!operation && !transfert) {
            this.showMessage('❌ Opération non trouvée', 'error');
            return;
        }
        
        if (operation) {
            this.showEditOperationModal(operation);
        } else if (transfert) {
            this.showEditTransfertModal(transfert);
        }
    }

    showEditOperationModal(operation) {
        const modal = document.getElementById('editModal');
        const form = document.getElementById('editForm');
        
        if (!modal || !form) {
            this.showMessage('❌ Modal d\'édition non trouvé', 'error');
            return;
        }
        
        // Remplir le formulaire avec les données de l'opération
        document.getElementById('editId').value = operation.id;
        document.getElementById('editOperateur').value = operation.operateur;
        document.getElementById('editGroupe').value = operation.groupe;
        document.getElementById('editTypeOperation').value = operation.typeOperation;
        document.getElementById('editTypeTransaction').value = operation.typeTransaction;
        document.getElementById('editCaisse').value = operation.caisse;
        document.getElementById('editMontant').value = operation.montant;
        document.getElementById('editDescription').value = operation.description;
        
        // Afficher le modal
        modal.style.display = 'flex';
        
        // Gérer la soumission du formulaire
        form.onsubmit = (e) => this.handleEditOperation(e, operation.id);
    }

    async handleEditOperation(e, id) {
        e.preventDefault();
        
        const updatedOperation = {
            operateur: document.getElementById('editOperateur').value,
            groupe: document.getElementById('editGroupe').value,
            typeOperation: document.getElementById('editTypeOperation').value,
            typeTransaction: document.getElementById('editTypeTransaction').value,
            caisse: document.getElementById('editCaisse').value,
            montant: parseFloat(document.getElementById('editMontant').value),
            description: document.getElementById('editDescription').value,
            timestamp: new Date().toISOString(), // Mettre à jour le timestamp
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email
        };
        
        try {
            await window.firebaseSync.updateDocument('operations', id, updatedOperation);
            this.showMessage('✅ Opération modifiée avec succès', 'success');
            this.closeModal(document.getElementById('editModal'));
            this.loadInitialData();
        } catch (error) {
            console.error('❌ Erreur modification opération:', error);
            this.showMessage('❌ Erreur lors de la modification', 'error');
        }
    }

    showEditTransfertModal(transfert) {
        // Pour l'instant, on utilise une alerte simple
        alert(`Édition des transferts sera implémentée dans une prochaine version.\n\nTransfert: ${transfert.montantTransfert} DH de ${transfert.caisseSource} vers ${transfert.caisseDestination}`);
    }

    deleteOperation(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération?')) {
            return;
        }
        
        console.log('🗑️ Suppression opération:', id);
        
        const operation = this.operations.find(op => op.id === id);
        const transfert = this.transferts.find(tr => tr.id === id);
        
        if (operation) {
            window.firebaseSync.deleteDocument('operations', id)
                .then(() => {
                    this.showMessage('✅ Opération supprimée', 'success');
                    this.loadInitialData();
                })
                .catch(error => {
                    console.error('❌ Erreur suppression:', error);
                    this.showMessage('❌ Erreur lors de la suppression', 'error');
                });
        } else if (transfert) {
            window.firebaseSync.deleteDocument('transferts', id)
                .then(() => {
                    this.showMessage('✅ Transfert supprimé', 'success');
                    this.loadInitialData();
                })
                .catch(error => {
                    console.error('❌ Erreur suppression:', error);
                    this.showMessage('❌ Erreur lors de la suppression', 'error');
                });
        }
    }

    deleteSelectedOperations() {
        if (this.selectedOperations.size === 0) {
            this.showMessage('❌ Aucune opération sélectionnée', 'error');
            return;
        }
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s)?`)) {
            return;
        }
        
        console.log('🗑️ Suppression de', this.selectedOperations.size, 'opérations...');
        
        const promises = [];
        this.selectedOperations.forEach(id => {
            const operation = this.operations.find(op => op.id === id);
            const transfert = this.transferts.find(tr => tr.id === id);
            
            if (operation) {
                promises.push(window.firebaseSync.deleteDocument('operations', id));
            } else if (transfert) {
                promises.push(window.firebaseSync.deleteDocument('transferts', id));
            }
        });
        
        Promise.all(promises)
            .then(() => {
                this.showMessage(`✅ ${this.selectedOperations.size} opération(s) supprimée(s)`, 'success');
                this.selectedOperations.clear();
                this.loadInitialData();
                this.toggleEditMode();
            })
            .catch(error => {
                console.error('❌ Erreur suppression multiple:', error);
                this.showMessage('❌ Erreur lors de la suppression', 'error');
            });
    }

    cancelEditMode() {
        this.editMode = false;
        this.selectedOperations.clear();
        this.toggleEditMode();
        this.showMessage('❌ Mode édition annulé', 'info');
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation application...');
    window.gestionFermeApp = new GestionFermeApp();
});

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('💥 Erreur globale:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Promise rejetée non gérée:', e.reason);
});






