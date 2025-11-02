// app.js - Gestion Ferme Ben Amara - Version Stable
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        this.detecterMobile();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    detecterMobile() {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    setupEventListeners() {
        try {
            // Redimensionnement pour responsive
            window.addEventListener('resize', () => {
                this.detecterMobile();
                this.afficherHistorique(this.currentView);
            });

            // Écouteurs pour les onglets
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vue = e.target.dataset.sheet;
                    this.afficherHistorique(vue);
                });
            });

            // Écouteur pour le formulaire d'ajout
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

            // Écouteur pour le formulaire de transfert
            const transferForm = document.getElementById('transferForm');
            if (transferForm) {
                transferForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.effectuerTransfert();
                });
            }

            // Écouteurs pour les boutons d'action
            document.addEventListener('click', (e) => {
                if (e.target.id === 'toggleEditMode') {
                    this.toggleEditMode();
                }
                if (e.target.id === 'deleteSelected') {
                    this.supprimerOperationsSelectionnees();
                }
                if (e.target.id === 'exportData') {
                    this.exporterDonnees();
                }
                if (e.target.id === 'importData') {
                    this.importerDonnees();
                }
                if (e.target.id === 'syncData') {
                    this.synchroniserDonnees();
                }
            });

            console.log('✅ Écouteurs d\'événements initialisés');
        } catch (error) {
            console.error('❌ Erreur initialisation écouteurs:', error);
        }
    }

    // MÉTHODES DE GESTION DES DONNÉES
    chargerDonnees() {
        try {
            const donnees = localStorage.getItem('gestionFermeOperations');
            if (donnees) {
                this.operations = JSON.parse(donnees);
                console.log('📂 Données chargées:', this.operations.length, 'opérations');
                this.afficherNotification(`Données chargées: ${this.operations.length} opérations`, 'success');
            } else {
                this.chargerDonneesExemple();
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.operations = [];
            this.chargerDonneesExemple();
        }
    }

    chargerDonneesExemple() {
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
                description: 'Vente d\'olives',
                montant: 1500.00,
                transfert: false
            },
            {
                id: '2',
                date: date,
                operateur: 'omar',
                groupe: '3commain',
                typeOperation: 'achat',
                typeTransaction: 'espece',
                caisse: 'omar_caisse',
                description: 'Achat d\'engrais',
                montant: -450.00,
                transfert: false
            }
        ];
        this.sauvegarderDonnees();
        console.log('📝 Données d\'exemple chargées');
    }

    sauvegarderDonnees() {
        try {
            localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
            localStorage.setItem('gestionFermeLastSync', new Date().toISOString());
            console.log('💾 Données sauvegardées');
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.afficherNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    synchroniserDonnees() {
        try {
            this.sauvegarderDonnees();
            this.afficherNotification('Données synchronisées avec succès', 'success');
            console.log('🔄 Données synchronisées');
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
            this.afficherNotification('Erreur lors de la synchronisation', 'error');
        }
    }

    // MÉTHODE UPDATE STATS
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

    creerCarteCaisse(cleCaisse, nomCaisse) {
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
                <div class="stat-indication">👆 Cliquer pour voir le détail</div>
            </div>`;
    }

    // MÉTHODE POUR AFFICHER LES DÉTAILS D'UNE CAISSE
    afficherDetailsCaisse(caisse) {
        this.caisseSelectionnee = caisse;
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
                                ↩️ Retour
                            </button>
                            <button class="btn-primary" onclick="app.exporterDetailsCaisse('${caisse}')">
                                💾 PDF
                            </button>
                        </div>
                    </div>
                    <div class="totals-container ${this.isMobile ? 'mobile-totals' : ''}">
                        <div class="total-item">
                            <span class="total-label">💰 Revenus:</span>
                            <span class="total-value positive">+${totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">💸 Frais:</span>
                            <span class="total-value negative">-${totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">⚖️ Solde:</span>
                            <span class="total-value ${soldeCaisse >= 0 ? 'positive' : 'negative'}">
                                ${soldeCaisse >= 0 ? '+' : ''}${soldeCaisse.toFixed(2)} DH
                            </span>
                        </div>
                        <div class="total-item">
                            <span class="total-label">📊 Opérations:</span>
                            <span class="total-value">${operationsCaisse.length}</span>
                        </div>
                    </div>
                </div>

                <div class="section-title">
                    <h4>📋 Historique des opérations</h4>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>📭 Aucune opération pour cette caisse</p></div>' : 
                    this.creerTableauDetailsCaisse(operationsCaisse)
                }
            </div>
        `;
        
        container.innerHTML = detailsHTML;
        this.mettreAJourOngletsCaisse(caisse);
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
        
        const nomCaisse = this.getNomCaisse(caisse);
        const caisseTab = document.createElement('button');
        caisseTab.className = 'tab-btn active caisse-tab';
        caisseTab.innerHTML = `🏦 ${nomCaisse}`;
        caisseTab.onclick = () => this.afficherDetailsCaisse(caisse);
        
        navTabs.appendChild(caisseTab);
    }

    creerTableauDetailsCaisse(operations) {
        if (this.isMobile) {
            return this.creerListeMobile(operations);
        } else {
            return this.creerTableauDesktop(operations);
        }
    }

    creerTableauDesktop(operations) {
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
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">🗑️</button>
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

    creerListeMobile(operations) {
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
                        <button class="btn-small btn-warning" onclick="app.ouvrirModalModification('${op.id}')">✏️</button>
                        <button class="btn-small btn-danger" onclick="app.supprimerOperation('${op.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        listeHTML += '</div>';
        return listeHTML;
    }

    // MÉTHODE AFFICHER HISTORIQUE
    afficherHistorique(vue = 'global') {
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
        
        if (this.isMobile) {
            contentHTML += this.creerListeMobile(operationsFiltrees);
        } else {
            contentHTML += this.creerTableauDesktop(operationsFiltrees);
        }

        contentHTML += '</div>';
        container.innerHTML = contentHTML;
    }

    afficherResumeCaisses() {
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
            const estSelectionnee = this.caisseSelectionnee === caisse ? 'caisse-selectionnee' : '';
            const icone = solde >= 0 ? '💰' : '💸';
            
            resumeHTML += `
                <div class="resume-caisse ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${caisse}')">
                    <div class="resume-caisse-header">
                        <div class="resume-caisse-nom">${nomCaisse}</div>
                        <div class="resume-caisse-icone">${icone}</div>
                    </div>
                    <div class="resume-caisse-solde">${solde.toFixed(2)} DH</div>
                    <div class="resume-caisse-indication">👆 Voir détails</div>
                </div>`;
        }
        
        resumeHTML += '</div></div>';
        return resumeHTML;
    }

    // MÉTHODES D'AJOUT ET MODIFICATION
    ajouterOperation() {
        const formData = new FormData(document.getElementById('operationForm'));
        
        const nouvelleOperation = {
            id: Date.now().toString(),
            date: formData.get('date'),
            operateur: formData.get('operateur'),
            groupe: formData.get('groupe'),
            typeOperation: formData.get('typeOperation'),
            typeTransaction: formData.get('typeTransaction'),
            caisse: formData.get('caisse'),
            description: formData.get('description'),
            montant: parseFloat(formData.get('montant')),
            transfert: formData.get('transfert') === 'true'
        };

        this.operations.push(nouvelleOperation);
        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        document.getElementById('operationForm').reset();
        this.afficherNotification('Opération ajoutée avec succès', 'success');
    }

    ouvrirModalModification(id) {
        console.log('🔧 Ouverture modification ID:', id);
        const operation = this.operations.find(op => op.id === id);
        
        if (!operation) {
            console.error('❌ Opération non trouvée:', id);
            this.afficherNotification('Opération non trouvée', 'error');
            return;
        }

        document.getElementById('date').value = operation.date;
        document.getElementById('operateur').value = operation.operateur;
        document.getElementById('groupe').value = operation.groupe;
        document.getElementById('typeOperation').value = operation.typeOperation;
        document.getElementById('typeTransaction').value = operation.typeTransaction;
        document.getElementById('caisse').value = operation.caisse;
        document.getElementById('description').value = operation.description;
        document.getElementById('montant').value = Math.abs(operation.montant);
        document.getElementById('transfert').checked = operation.transfert;

        document.getElementById('operationForm').dataset.editingId = id;

        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '💾 Modifier l\'opération';
        submitBtn.className = 'btn-primary btn-warning';

        document.getElementById('operationForm').scrollIntoView({ behavior: 'smooth' });
    }

    modifierOperation() {
        const id = document.getElementById('operationForm').dataset.editingId;
        console.log('🔄 Modification opération ID:', id);
        
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
            montant: parseFloat(formData.get('montant')),
            transfert: formData.get('transfert') === 'true'
        };

        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.reinitialiserFormulaire();
        this.afficherNotification('Opération modifiée avec succès', 'success');
    }

    supprimerOperation(id) {
        console.log('🗑️ Suppression opération ID:', id);
        
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
        
        this.afficherNotification('Opération supprimée avec succès', 'success');
    }

    reinitialiserFormulaire() {
        document.getElementById('operationForm').reset();
        delete document.getElementById('operationForm').dataset.editingId;
        
        const submitBtn = document.querySelector('#operationForm button[type="submit"]');
        submitBtn.textContent = '✅ Enregistrer l\'opération';
        submitBtn.className = 'btn-primary';
    }

    // MÉTHODE POUR LES TRANSFERTS
    effectuerTransfert() {
        const formData = new FormData(document.getElementById('transferForm'));
        
        const sourceCaisse = formData.get('sourceCaisse');
        const destinationCaisse = formData.get('destinationCaisse');
        const montant = parseFloat(formData.get('transfertMontant'));
        const description = formData.get('transfertDescription');

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

        const soldeSource = this.caisses[sourceCaisse] || 0;
        if (soldeSource < montant) {
            this.afficherNotification(`Solde insuffisant: ${soldeSource.toFixed(2)} DH`, 'error');
            return;
        }

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
            transfert: true
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
            transfert: true
        };

        this.operations.push(operationRetrait, operationDepot);
        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);

        document.getElementById('transferForm').reset();
        this.afficherNotification(`Transfert de ${montant.toFixed(2)} DH effectué !`, 'success');
    }

    // MÉTHODES DE SÉLECTION MULTIPLE
    selectionnerOperation(id, estSelectionne) {
        if (estSelectionne) {
            this.selectedOperations.add(id);
        } else {
            this.selectedOperations.delete(id);
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
    }

    supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            this.afficherNotification('Aucune opération sélectionnée', 'warning');
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            return;
        }

        this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
        this.selectedOperations.clear();
        this.sauvegarderDonnees();
        this.updateStats();
        this.afficherHistorique(this.currentView);
        
        this.afficherNotification('Opérations supprimées avec succès', 'success');
    }

    // MÉTHODES D'EXPORT
    exporterDetailsCaisse(caisse) {
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

        const contenuHTML = `
            <html>
                <head>
                    <title>Détails ${nomCaisse}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                        .summary-item { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
                        .positive { color: #27ae60; }
                        .negative { color: #e74c3c; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>💰 Détails de la ${nomCaisse}</h1>
                        <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    
                    <div class="summary">
                        <div class="summary-item">
                            <strong>Total Revenus:</strong><br>
                            <span class="positive">+${totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="summary-item">
                            <strong>Total Frais:</strong><br>
                            <span class="negative">-${totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="summary-item">
                            <strong>Solde Actuel:</strong><br>
                            <span class="${soldeCaisse >= 0 ? 'positive' : 'negative'}">
                                ${soldeCaisse >= 0 ? '+' : ''}${soldeCaisse.toFixed(2)} DH
                            </span>
                        </div>
                        <div class="summary-item">
                            <strong>Nombre d'opérations:</strong><br>
                            <span>${operationsCaisse.length}</span>
                        </div>
                    </div>
                    
                    <h3>Historique des opérations</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Opérateur</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Montant (DH)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${operationsCaisse.map(op => `
                                <tr>
                                    <td>${this.formaterDate(op.date)}</td>
                                    <td>${this.formaterOperateur(op.operateur)}</td>
                                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                                    <td>${op.description}</td>
                                    <td style="color: ${op.montant < 0 ? '#e74c3c' : '#27ae60'};">
                                        ${op.montant >= 0 ? '+' : ''}${op.montant.toFixed(2)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Rapport généré par Gestion Ferme Ben Amara</p>
                    </div>
                </body>
            </html>
        `;

        const fenetreImpression = window.open('', '_blank');
        fenetreImpression.document.write(contenuHTML);
        fenetreImpression.document.close();
        
        setTimeout(() => {
            fenetreImpression.print();
        }, 500);
    }

    exporterDonnees() {
        const donneesJSON = JSON.stringify(this.operations, null, 2);
        const blob = new Blob([donneesJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestion-ferme-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.afficherNotification('Données exportées avec succès', 'success');
    }

    importerDonnees() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const donnees = JSON.parse(event.target.result);
                    if (Array.isArray(donnees)) {
                        this.operations = donnees;
                        this.sauvegarderDonnees();
                        this.updateStats();
                        this.afficherHistorique(this.currentView);
                        this.afficherNotification('Données importées avec succès', 'success');
                    } else {
                        throw new Error('Format de fichier invalide');
                    }
                } catch (error) {
                    this.afficherNotification('Erreur lors de l\'importation', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // MÉTHODE POUR LES NOTIFICATIONS
    afficherNotification(message, type = 'info') {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Ajouter au body
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Suppression automatique
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // MÉTHODES DE FORMATAGE
    formaterDate(dateStr) {
        const date = new Date(dateStr);
        return this.isMobile ? 
            date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) :
            date.toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': this.isMobile ? 'A' : '👨‍💼 Abdel',
            'omar': this.isMobile ? 'O' : '👨‍💼 Omar', 
            'hicham': this.isMobile ? 'H' : '👨‍💼 Hicham'
        };
        return operateurs[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': this.isMobile ? 'Z' : '🫒 Zaitoun',
            '3commain': this.isMobile ? '3C' : '👥 3 Commain'
        };
        return groupes[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'vente': this.isMobile ? 'Vente' : '💰 Vente',
            'achat': this.isMobile ? 'Achat' : '🛒 Achat',
            'frais': this.isMobile ? 'Frais' : '💸 Frais',
            'investissement': this.isMobile ? 'Invest' : '🏗️ Investissement',
            'salaire': this.isMobile ? 'Salaire' : '👨‍💼 Salaire'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        const types = {
            'espece': this.isMobile ? 'Esp' : '💵 Espèce',
            'cheque': this.isMobile ? 'Chq' : '📋 Chèque',
            'virement': this.isMobile ? 'Vir' : '🏦 Virement'
        };
        return types[type] || type;
    }

    getNomCaisse(caisse) {
        const caisses = {
            'abdel_caisse': this.isMobile ? 'Abdel' : 'Caisse Abdel',
            'omar_caisse': this.isMobile ? 'Omar' : 'Caisse Omar',
            'hicham_caisse': this.isMobile ? 'Hicham' : 'Caisse Hicham',
            'zaitoun_caisse': this.isMobile ? 'Zaitoun' : 'Caisse Zaitoun',
            '3commain_caisse': this.isMobile ? '3 Commain' : 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    getTitreVue(vue) {
        const titres = {
            'global': this.isMobile ? '🌍 Globale' : '🌍 Vue Globale',
            'zaitoun': this.isMobile ? '🫒 Zaitoun' : '🫒 Groupe Zaitoun',
            '3commain': this.isMobile ? '👥 3C' : '👥 Groupe 3 Commain',
            'abdel': this.isMobile ? '👨‍💼 Abdel' : '👨‍💼 Opérations Abdel',
            'omar': this.isMobile ? '👨‍💼 Omar' : '👨‍💼 Opérations Omar',
            'hicham': this.isMobile ? '👨‍💼 Hicham' : '👨‍💼 Opérations Hicham',
            'transferts': this.isMobile ? '🔄 Transf' : '🔄 Opérations de Transfert'
        };
        return titres[vue] || 'Vue';
    }
}

// Initialisation globale
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new GestionFerme();
        window.app = app;
        console.log('🚀 Application démarrée avec succès');
    } catch (error) {
        console.error('💥 Erreur démarrage application:', error);
        // Afficher une erreur simple à l'utilisateur
        alert('Erreur lors du démarrage de l\'application. Veuillez actualiser la page.');
    }
});
