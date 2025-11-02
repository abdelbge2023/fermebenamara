// app.js - Gestion Ferme Ben Amara - Version COMPLÈTE
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
        this.autoSaveInterval = null;
        this.db = null;
        this.firebaseInitialized = false;

        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.chargerDonnees();
            this.updateStats();
            this.afficherHistorique('global');
            this.detecterMobile();
            this.demarrerAutoSync();
            
            setTimeout(async () => {
                await this.initialiserFirebase();
            }, 1000);
            
            console.log('✅ Application Gestion Ferme initialisée');
        } catch (error) {
            console.error('❌ Erreur dans init:', error);
        }
    }

    // ==================== FIREBASE ====================
    initialiserFirebase = async () => {
        try {
            if (typeof firebase === 'undefined') {
                return false;
            }

       const firebaseConfig = {
          apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
          authDomain: "gestion-fermebenamara.firebaseapp.com",
          projectId: "gestion-fermebenamara",
          storageBucket: "gestion-fermebenamara.firebasestorage.app",
          messagingSenderId: "668129137491",
          appId: "1:668129137491:web:b56522302ea789044507a6"
        };

            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            
            try {
                await this.db.enablePersistence();
                console.log('✅ Persistance Firebase activée');
            } catch (err) {
                console.warn('⚠️ Persistance non disponible');
            }

            this.firebaseInitialized = true;
            this.ecouterChangementsFirebase();
            await this.chargerDepuisFirebase();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur initialisation Firebase:', error);
            return false;
        }
    }

    ecouterChangementsFirebase = () => {
        if (!this.db) return;

        this.db.collection('operations')
            .onSnapshot((snapshot) => {
                const changes = snapshot.docChanges();
                console.log('🔄 Mise à jour depuis Firebase:', changes.length, 'changements');
                
                changes.forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.traiterOperationFirebase(change.doc.data());
                    }
                });
            }, (error) => {
                console.error('❌ Erreur écoute Firebase:', error);
            });
    }

    traiterOperationFirebase = (data) => {
        const index = this.operations.findIndex(op => op.id === data.id);
        
        if (index === -1) {
            this.operations.push(data);
        } else {
            this.operations[index] = data;
        }
        
        this.sauvegarderDonneesLocale();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    synchroniserAvecFirebase = async () => {
        if (!this.db || !this.firebaseInitialized) return;

        try {
            const promises = this.operations.map(async (operation) => {
                await this.db.collection('operations').doc(operation.id).set(operation, { merge: true });
            });
            
            await Promise.all(promises);
            console.log('✅ Synchronisation Firebase terminée');
            
        } catch (error) {
            console.error('❌ Erreur synchronisation Firebase:', error);
        }
    }

    chargerDepuisFirebase = async () => {
        if (!this.db || !this.firebaseInitialized) return;

        try {
            const snapshot = await this.db.collection('operations').get();
            const operationsFirebase = [];
            
            snapshot.forEach(doc => {
                operationsFirebase.push(doc.data());
            });
            
            this.fusionnerDonnees(operationsFirebase);
            
        } catch (error) {
            console.error('❌ Erreur chargement Firebase:', error);
        }
    }

    fusionnerDonnees = (operationsFirebase) => {
        const operationsMap = new Map();
        
        this.operations.forEach(op => {
            operationsMap.set(op.id, op);
        });
        
        operationsFirebase.forEach(op => {
            operationsMap.set(op.id, op);
        });
        
        this.operations = Array.from(operationsMap.values());
        this.operations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.sauvegarderDonneesLocale();
        this.updateStats();
        this.afficherHistorique(this.currentView);
    }

    // ==================== GESTION DES DONNÉES ====================
    chargerDonnees = () => {
        try {
            const donnees = localStorage.getItem('gestionFermeOperations');
            if (donnees) {
                this.operations = JSON.parse(donnees);
                console.log('📂 Données locales chargées:', this.operations.length, 'opérations');
            } else {
                this.chargerDonneesExemple();
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.operations = [];
            this.chargerDonneesExemple();
        }
    }

    chargerDonneesExemple = () => {
        const date = new Date().toISOString().split('T')[0];
        this.operations = [
            {
                id: '1',
                date: date,
                operateur: 'abdel',
                groupe: 'zaitoun',
                typeOperation: 'vente',
                typeTransaction: 'espece',
                caisse: 'abdel_caisse',
                description: 'Vente d\'olives premium',
                montant: 2500.00,
                transfert: false,
                timestamp: new Date().toISOString()
            },
            {
                id: '2', 
                date: date,
                operateur: 'omar',
                groupe: '3commain',
                typeOperation: 'achat',
                typeTransaction: 'espece',
                caisse: 'omar_caisse',
                description: 'Achat d\'engrais biologique',
                montant: -800.00,
                transfert: false,
                timestamp: new Date().toISOString()
            }
        ];
        this.sauvegarderDonneesLocale();
    }

    sauvegarderDonnees = () => {
        try {
            this.sauvegarderDonneesLocale();
            
            if (this.firebaseInitialized) {
                this.synchroniserAvecFirebase().catch(error => {
                    console.warn('⚠️ Sync Firebase échouée:', error);
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    sauvegarderDonneesLocale = () => {
        localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
        localStorage.setItem('gestionFermeLastSync', new Date().toISOString());
    }

    demarrerAutoSync = () => {
        this.autoSaveInterval = setInterval(() => {
            this.synchroniserDonnees();
        }, 30000);

        window.addEventListener('beforeunload', () => {
            this.synchroniserDonnees();
        });
    }

    synchroniserDonnees = () => {
        try {
            this.sauvegarderDonnees();
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        }
    }

    // ==================== AFFICHAGE ====================
    updateStats = () => {
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

    calculerSoldes = () => {
        this.caisses = {
            'abdel_caisse': 0, 
            'omar_caisse': 0, 
            'hicham_caisse': 0, 
            'zaitoun_caisse': 0, 
            '3commain_caisse': 0
        };

        this.operations.forEach(op => {
            if (this.caisses[op.caisse] !== undefined) {
                this.caisses[op.caisse] += op.montant;
            }
        });
    }

    creerCarteCaisse = (cleCaisse, nomCaisse) => {
        const solde = this.caisses[cleCaisse] || 0;
        const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
        const estSelectionnee = this.caisseSelectionnee === cleCaisse ? 'caisse-selectionnee' : '';
        const icone = solde >= 0 ? '💰' : '💸';
        
        return `
            <div class="stat-card ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${cleCaisse}')">
                <div class="stat-header">
                    <div class="stat-label">${nomCaisse}</div>
                    <div class="stat-icone">${icone}</div>
                </div>
                <div class="stat-value">${solde.toFixed(2)} DH</div>
                <div class="stat-indication">👆 Voir le détail</div>
            </div>`;
    }

    afficherDetailsCaisse = (caisse) => {
        this.caisseSelectionnee = caisse;
        this.currentView = 'caisse';
        this.updateStats();
        
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const nomCaisse = this.getNomCaisse(caisse);
        
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
                    <div class="vue-header-top">
                        <h3>📊 Détails de la ${nomCaisse}</h3>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="app.afficherHistorique('global')">
                                ↩️ Retour au global
                            </button>
                            <button class="btn-danger" onclick="app.effacerCaisse('${caisse}')">
                                🗑️ Effacer cette caisse
                            </button>
                        </div>
                    </div>
                    <div class="totals-container ${this.isMobile ? 'mobile-totals' : ''}">
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
                    </div>
                </div>

                <div class="section-title">
                    <h4>📋 Historique des opérations</h4>
                    <div class="section-badge">${operationsCaisse.length} opérations</div>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>📭 Aucune opération pour cette caisse</p></div>' : 
                    this.creerTableauDetailsCaisse(operationsCaisse)
                }
            </div>
        `;
        
        container.innerHTML = detailsHTML;
    }

    afficherHistorique = (vue = 'global') => {
        this.currentView = vue;
        this.caisseSelectionnee = null;
        this.updateStats();
        
        const container = document.getElementById('dataDisplay');
        if (!container) return;

        let operationsFiltrees = [];
        let totalRevenus = 0;
        let totalFrais = 0;
        let soldeTotal = 0;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sheet === vue);
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

        let contentHTML = '<div class="fade-in">';
        
        contentHTML += '<div class="vue-header">';
        contentHTML += '<div class="vue-header-top">';
        contentHTML += '<h3>' + this.getTitreVue(vue) + '</h3>';
        contentHTML += '<div class="header-badge">' + operationsFiltrees.length + ' opérations</div>';
        contentHTML += '</div>';
        contentHTML += '<div class="totals-container ' + (this.isMobile ? 'mobile-totals' : '') + '">';
        contentHTML += '<div class="total-item">';
        contentHTML += '<span class="total-label">💰 Revenus:</span>';
        contentHTML += '<span class="total-value positive">+' + totalRevenus.toFixed(2) + ' DH</span>';
        contentHTML += '</div>';
        contentHTML += '<div class="total-item">';
        contentHTML += '<span class="total-label">💸 Frais:</span>';
        contentHTML += '<span class="total-value negative">-' + totalFrais.toFixed(2) + ' DH</span>';
        contentHTML += '</div>';
        contentHTML += '<div class="total-item">';
        contentHTML += '<span class="total-label">⚖️ Solde:</span>';
        contentHTML += '<span class="total-value ' + (soldeTotal >= 0 ? 'positive' : 'negative') + '">' + 
                     (soldeTotal >= 0 ? '+' : '') + soldeTotal.toFixed(2) + ' DH</span>';
        contentHTML += '</div>';
        contentHTML += '</div>';
        contentHTML += '</div>';
        
        if (vue === 'global') {
            contentHTML += this.afficherResumeCaisses();
        }
        
        contentHTML += this.creerTableauOperations(operationsFiltrees);
        contentHTML += '</div>';
        container.innerHTML = contentHTML;
    }

    // ==================== BOUTONS ÉDITION ET SUPPRESSION ====================
    creerTableauOperations = (operations) => {
        if (this.isMobile) {
            return this.creerListeMobile(operations);
        } else {
            return this.creerTableauDesktop(operations);
        }
    }

    creerTableauDesktop = (operations) => {
        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Opérateur</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Montant</th>
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
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="description-cell">${op.description}</td>
                    <td class="montant-cell ${estNegatif ? 'negatif' : 'positif'}">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)} DH
                    </td>
                    <td>
                        <div class="operation-actions">
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">
                                ✏️ Modifier
                            </button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">
                                🗑️ Supprimer
                            </button>
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

    creerListeMobile = (operations) => {
        let listeHTML = '<div class="mobile-operations-list">';
        
        operations.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            listeHTML += `
                <div class="operation-card ${estNegatif ? 'frais' : 'revenu'}">
                    <div class="operation-header">
                        <div class="operation-date">${this.formaterDate(op.date)}</div>
                        <div class="operation-montant ${estNegatif ? 'negatif' : 'positif'}">
                            ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)} DH
                        </div>
                    </div>
                    <div class="operation-details">
                        <div class="operation-type">${this.formaterTypeOperation(op.typeOperation)}</div>
                        <div class="operation-description">${op.description}</div>
                        <div class="operation-operateur">${this.formaterOperateur(op.operateur)}</div>
                    </div>
                    <div class="operation-actions">
                        <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            `;
        });
        
        listeHTML += '</div>';
        return listeHTML;
    }

    // ==================== MÉTHODES ÉDITION/SUPPRESSION ====================
    ouvrirModalModification = (id) => {
        console.log('🔧 Ouverture modification ID:', id);
        const operation = this.operations.find(op => op.id === id);
        
        if (!operation) {
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        // Remplir le formulaire avec les données de l'opération
        document.getElementById('date').value = operation.date;
        document.getElementById('operateur').value = operation.operateur;
        document.getElementById('groupe').value = operation.groupe;
        document.getElementById('typeOperation').value = operation.typeOperation;
        document.getElementById('typeTransaction').value = operation.typeTransaction;
        document.getElementById('caisse').value = operation.caisse;
        document.getElementById('description').value = operation.description;
        document.getElementById('montant').value = Math.abs(operation.montant);

        // Marquer comme en mode édition
        document.getElementById('operationForm').dataset.editingId = id;

        // Changer le bouton
        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '💾 Modifier l\'opération';
        submitBtn.className = 'btn-primary btn-warning';

        // Scroll vers le formulaire
        document.getElementById('operationForm').scrollIntoView({ behavior: 'smooth' });

        this.afficherNotification('Mode modification activé', 'info');
    }

    modifierOperation = () => {
        const id = document.getElementById('operationForm').dataset.editingId;
        
        if (!id) {
            this.afficherNotification('Aucune opération en cours de modification', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('operationForm'));
        const operationIndex = this.operations.findIndex(op => op.id === id);

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
            montant: this.calculerMontantAvecSigne(
                parseFloat(formData.get('montant')), 
                formData.get('typeOperation')
            ),
            timestamp: new Date().toISOString()
        };

        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.reinitialiserFormulaire();
        this.afficherNotification('✅ Opération modifiée avec succès', 'success');
    }

    supprimerOperation = (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            return;
        }

        const operationIndex = this.operations.findIndex(op => op.id === id);
        
        if (operationIndex === -1) {
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        this.operations.splice(operationIndex, 1);
        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.afficherNotification('✅ Opération supprimée avec succès', 'success');
    }

    reinitialiserFormulaire = () => {
        document.getElementById('operationForm').reset();
        delete document.getElementById('operationForm').dataset.editingId;
        
        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '✅ Ajouter l\'opération';
        submitBtn.className = 'btn-primary';
    }

    // ==================== EFFACEMENT ====================
    effacerToutesDonnees = () => {
        if (!confirm('⚠️ ATTENTION ! Cette action va supprimer TOUTES les opérations. Continuer ?')) {
            return;
        }

        if (!confirm('❌ Êtes-vous ABSOLUMENT SÛR ? Toutes vos données seront perdues !')) {
            return;
        }

        try {
            this.operations = [];
            localStorage.removeItem('gestionFermeOperations');
            localStorage.removeItem('gestionFermeLastSync');
            
            if (this.firebaseInitialized) {
                this.effacerDonneesFirebase();
            }
            
            this.chargerDonneesExemple();
            this.updateStats();
            this.afficherHistorique('global');
            
            this.afficherNotification('✅ Toutes les données ont été effacées', 'success');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'effacement:', error);
            this.afficherNotification('❌ Erreur lors de l\'effacement', 'error');
        }
    }

    effacerDonneesFirebase = async () => {
        if (!this.db || !this.firebaseInitialized) return;

        try {
            const snapshot = await this.db.collection('operations').get();
            const deletePromises = [];
            snapshot.forEach(doc => {
                deletePromises.push(this.db.collection('operations').doc(doc.id).delete());
            });
            
            await Promise.all(deletePromises);
            console.log('✅ Données Firebase effacées');
            
        } catch (error) {
            console.error('❌ Erreur effacement Firebase:', error);
        }
    }

    effacerCaisse = (caisse) => {
        if (!confirm(`Êtes-vous sûr de vouloir effacer toutes les opérations de la ${this.getNomCaisse(caisse)} ?`)) {
            return;
        }

        try {
            const operationsAvant = this.operations.length;
            this.operations = this.operations.filter(op => op.caisse !== caisse);
            const operationsSupprimees = operationsAvant - this.operations.length;
            
            this.sauvegarderDonnees();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            
            this.afficherNotification(`✅ ${operationsSupprimees} opérations effacées de ${this.getNomCaisse(caisse)}`, 'success');
            
        } catch (error) {
            console.error('❌ Erreur effacement caisse:', error);
            this.afficherNotification('❌ Erreur lors de l\'effacement', 'error');
        }
    }

    // ==================== ÉVÉNEMENTS ====================
    setupEventListeners = () => {
        try {
            window.addEventListener('resize', () => {
                this.detecterMobile();
            });

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vue = e.target.dataset.sheet;
                    this.afficherHistorique(vue);
                });
            });

            const form = document.getElementById('operationForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (form.dataset.editingId) {
                        this.modifierOperation();
                    } else {
                        this.ajouterOperation();
                    }
                });
            }

            // Boutons d'administration
            document.addEventListener('click', (e) => {
                if (e.target.id === 'effacerDonnees') {
                    this.effacerToutesDonnees();
                }
                if (e.target.id === 'exportData') {
                    this.exporterDonnees();
                }
                if (e.target.id === 'importData') {
                    this.importerDonnees();
                }
            });

            console.log('✅ Écouteurs d\'événements initialisés');

        } catch (error) {
            console.error('❌ Erreur initialisation écouteurs:', error);
        }
    }

    // ==================== OPÉRATIONS ====================
    ajouterOperation = () => {
        const formData = new FormData(document.getElementById('operationForm'));
        const operateur = formData.get('operateur');
        
        let caisseAuto = '';
        switch(operateur) {
            case 'abdel':
                caisseAuto = 'abdel_caisse';
                break;
            case 'omar':
                caisseAuto = 'omar_caisse';
                break;
            case 'hicham':
                caisseAuto = 'hicham_caisse';
                break;
            default:
                caisseAuto = 'abdel_caisse';
        }

        const nouvelleOperation = {
            id: Date.now().toString(),
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            operateur: operateur,
            groupe: formData.get('groupe'),
            typeOperation: formData.get('typeOperation'),
            typeTransaction: formData.get('typeTransaction'),
            caisse: caisseAuto,
            description: formData.get('description'),
            montant: this.calculerMontantAvecSigne(
                parseFloat(formData.get('montant')), 
                formData.get('typeOperation')
            ),
            transfert: false,
            timestamp: new Date().toISOString()
        };

        this.operations.push(nouvelleOperation);
        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.reinitialiserFormulaire();
        this.afficherNotification(`✅ Opération enregistrée dans ${this.getNomCaisse(caisseAuto)}`, 'success');
    }

    calculerMontantAvecSigne = (montant, typeOperation) => {
        if (typeOperation === 'vente') {
            return Math.abs(montant);
        } else {
            return -Math.abs(montant);
        }
    }

    // ==================== UTILITAIRES ====================
    afficherResumeCaisses = () => {
        let resumeHTML = '<div class="resume-caisses">';
        resumeHTML += '<h4>📋 Résumé par Caisse</h4>';
        resumeHTML += '<div class="caisses-grid">';
        
        const totauxCaisses = {
            'abdel_caisse': 0,
            'omar_caisse': 0, 
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };
        
        this.operations.forEach(op => {
            if (totauxCaisses[op.caisse] !== undefined) {
                totauxCaisses[op.caisse] += op.montant;
            }
        });
        
        for (const [caisse, solde] of Object.entries(totauxCaisses)) {
            const nomCaisse = this.getNomCaisse(caisse);
            const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
            
            resumeHTML += `
                <div class="resume-caisse ${classeCouleur}" onclick="app.afficherDetailsCaisse('${caisse}')">
                    <div class="resume-caisse-header">
                        <div class="resume-caisse-nom">${nomCaisse}</div>
                    </div>
                    <div class="resume-caisse-solde">${solde.toFixed(2)} DH</div>
                </div>`;
        }
        
        resumeHTML += '</div></div>';
        return resumeHTML;
    }

    detecterMobile = () => {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    afficherNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // ==================== FORMATAGE ====================
    formaterDate = (dateStr) => {
        const date = new Date(dateStr);
        return this.isMobile ? 
            date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) :
            date.toLocaleDateString('fr-FR');
    }

    formaterOperateur = (operateur) => {
        const operateurs = {
            'abdel': this.isMobile ? 'A' : '👨‍💼 Abdel',
            'omar': this.isMobile ? 'O' : '👨‍💼 Omar', 
            'hicham': this.isMobile ? 'H' : '👨‍💼 Hicham'
        };
        return operateurs[operateur] || operateur;
    }

    formaterTypeOperation = (type) => {
        const types = {
            'vente': this.isMobile ? 'Vente' : '💰 Vente',
            'achat': this.isMobile ? 'Achat' : '🛒 Achat',
            'frais': this.isMobile ? 'Frais' : '💸 Frais'
        };
        return types[type] || type;
    }

    getNomCaisse = (caisse) => {
        const caisses = {
            'abdel_caisse': this.isMobile ? 'Abdel' : 'Caisse Abdel',
            'omar_caisse': this.isMobile ? 'Omar' : 'Caisse Omar',
            'hicham_caisse': this.isMobile ? 'Hicham' : 'Caisse Hicham',
            'zaitoun_caisse': this.isMobile ? 'Zaitoun' : 'Caisse Zaitoun',
            '3commain_caisse': this.isMobile ? '3 Commain' : 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    getTitreVue = (vue) => {
        const titres = {
            'global': this.isMobile ? '🌍 Globale' : '🌍 Vue Globale',
            'zaitoun': this.isMobile ? '🫒 Zaitoun' : '🫒 Groupe Zaitoun',
            '3commain': this.isMobile ? '👥 3C' : '👥 Groupe 3 Commain',
            'abdel': this.isMobile ? '👨‍💼 Abdel' : '👨‍💼 Opérations Abdel',
            'omar': this.isMobile ? '👨‍💼 Omar' : '👨‍💼 Opérations Omar',
            'hicham': this.isMobile ? '👨‍💼 Hicham' : '👨‍💼 Opérations Hicham'
        };
        return titres[vue] || 'Vue';
    }

    // ==================== EXPORT/IMPORT ====================
    exporterDonnees = () => {
        try {
            const donneesJSON = JSON.stringify(this.operations, null, 2);
            const blob = new Blob([donneesJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `gestion-ferme-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.afficherNotification('✅ Données exportées avec succès', 'success');
            
        } catch (error) {
            console.error('❌ Erreur export:', error);
            this.afficherNotification('❌ Erreur lors de l\'export', 'error');
        }
    }

    importerDonnees = () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const donnees = JSON.parse(event.target.result);
                        if (Array.isArray(donnees)) {
                            this.operations = donnees;
                            this.sauvegarderDonnees();
                            this.updateStats();
                            this.afficherHistorique(this.currentView);
                            this.afficherNotification('✅ Données importées avec succès', 'success');
                        } else {
                            throw new Error('Format invalide');
                        }
                    } catch (error) {
                        console.error('❌ Erreur import:', error);
                        this.afficherNotification('❌ Fichier invalide', 'error');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
            
        } catch (error) {
            console.error('❌ Erreur import:', error);
            this.afficherNotification('❌ Erreur lors de l\'import', 'error');
        }
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new GestionFerme();
        window.app = app;
        console.log('🚀 Application démarrée avec succès');
    } catch (error) {
        console.error('💥 Erreur démarrage application:', error);
        alert('Erreur lors du démarrage. Veuillez actualiser la page.');
    }
});

