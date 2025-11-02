// app.js - Gestion Ferme Ben Amara
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée');
    }

    setupEventListeners() {
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
                this.ajouterOperation();
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
        });

        console.log('✅ Écouteurs d\'événements initialisés');
    }

    // MÉTHODES DE GESTION DES DONNÉES
    chargerDonnees() {
        try {
            const donnees = localStorage.getItem('gestionFermeOperations');
            if (donnees) {
                this.operations = JSON.parse(donnees);
                console.log('📂 Données chargées:', this.operations.length, 'opérations');
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.operations = [];
        }
    }

    sauvegarderDonnees() {
        try {
            localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
            console.log('💾 Données sauvegardées');
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    // MÉTHODE UPDATE STATS - CLICK DIRECT SUR LES CAISSES
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
        // Réinitialiser les soldes
        this.caisses = {
            'abdel_caisse': 0, 
            'omar_caisse': 0, 
            'hicham_caisse': 0, 
            'zaitoun_caisse': 0, 
            '3commain_caisse': 0
        };

        // Calculer les soldes actuels
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
        
        return `<div class="stat-card ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${cleCaisse}')" style="cursor: pointer;">
            <div class="stat-label">${nomCaisse}</div>
            <div class="stat-value">${solde.toFixed(2)}</div>
            <div class="stat-label">DH</div>
            <div class="stat-indication">📊 Cliquer pour voir le détail</div>
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
                    <h3>📊 Détails de la ${nomCaisse}</h3>
                    <div class="totals-container">
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
                        <div class="total-item">
                            <span class="total-label">📊 Nombre d'opérations:</span>
                            <span class="total-value">${operationsCaisse.length}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
                    <h4 style="margin: 0; color: #2c3e50;">📋 Historique des opérations</h4>
                    <div>
                        <button class="btn-secondary" onclick="app.afficherHistorique('global')" style="margin-right: 10px;">
                            ↩️ Retour à la vue globale
                        </button>
                        <button class="btn-primary" onclick="app.exporterDetailsCaisse('${caisse}')">
                            💾 Exporter PDF
                        </button>
                    </div>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>Aucune opération pour cette caisse</p></div>' : 
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
        let tableHTML = `
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Opérateur</th>
                            <th>Groupe</th>
                            <th>Type Opération</th>
                            <th>Transaction</th>
                            <th>Description</th>
                            <th>Montant (DH)</th>
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
                    <td>${this.formaterGroupe(op.groupe)}</td>
                    <td>${this.formaterTypeOperation(op.typeOperation)}</td>
                    <td class="${estNegatif ? 'type-frais' : 'type-revenu'}">${this.formaterTypeTransaction(op.typeTransaction)}</td>
                    <td>${op.description}</td>
                    <td style="font-weight: bold; color: ${estNegatif ? '#e74c3c' : '#27ae60'};">
                        ${estNegatif ? '-' : '+'}${montantAbsolu.toFixed(2)}
                    </td>
                    <td>
                        <div class="operation-actions">
                            <button class="btn-small btn-warning" onclick="app.ouvrirModalModification(${op.id})">✏️</button>
                            <button class="btn-small btn-danger" onclick="app.supprimerOperation(${op.id})">🗑️</button>
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

    // MÉTHODE AFFICHER HISTORIQUE
    afficherHistorique(vue = 'global') {
        this.caisseSelectionnee = null;
        this.updateStats();
        
        const container = document.getElementById('dataDisplay');
        if (!container) return;

        let operationsFiltrees = [];
        let totalRevenus = 0;
        let totalFrais = 0;
        let soldeTotal = 0;

        // Mettre à jour les onglets actifs
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

        // Calculer les totaux
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

        let tableHTML = '<div class="fade-in">';
        
        // EN-TÊTE AVEC TOTAUX
        tableHTML += '<div class="vue-header">';
        tableHTML += '<h3>' + this.getTitreVue(vue) + '</h3>';
        tableHTML += '<div class="totals-container">';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">📊 Total Opérations:</span>';
        tableHTML += '<span class="total-value">' + operationsFiltrees.length + '</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">💰 Total Revenus:</span>';
        tableHTML += '<span class="total-value positive">+' + totalRevenus.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">💸 Total Frais:</span>';
        tableHTML += '<span class="total-value negative">-' + totalFrais.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '<div class="total-item">';
        tableHTML += '<span class="total-label">⚖️ Solde Total:</span>';
        tableHTML += '<span class="total-value ' + (soldeTotal >= 0 ? 'positive' : 'negative') + '">' + 
                     (soldeTotal >= 0 ? '+' : '') + soldeTotal.toFixed(2) + ' DH</span>';
        tableHTML += '</div>';
        tableHTML += '</div>';
        tableHTML += '</div>';
        
        // RÉSUMÉ DES CAISSES POUR LA VUE GLOBALE
        if (vue === 'global') {
            tableHTML += this.afficherResumeCaisses();
        }
        
        tableHTML += '<table class="data-table"><thead><tr>';
        
        if (this.editMode) tableHTML += '<th></th>';
        tableHTML += '<th>Date</th><th>Opérateur</th><th>Groupe</th><th>Type Op.</th><th>Transaction</th><th>Caisse</th><th>Description</th><th>Montant (DH)</th>';
        if (!this.editMode) tableHTML += '<th>Actions</th>';
        tableHTML += '</tr></thead><tbody>';

        operationsFiltrees.forEach(op => {
            const montantAbsolu = Math.abs(op.montant);
            const estNegatif = op.montant < 0;
            
            tableHTML += '<tr class="' + (this.selectedOperations.has(op.id) ? 'selected' : '') + '">';
            
            if (this.editMode) {
                tableHTML += '<td><input type="checkbox" class="operation-checkbox" ' + 
                    (this.selectedOperations.has(op.id) ? 'checked' : '') + 
                    ' onchange="app.selectionnerOperation(' + op.id + ', this.checked)"></td>';
            }
            
            tableHTML += '<td>' + this.formaterDate(op.date) + '</td>';
            tableHTML += '<td>' + this.formaterOperateur(op.operateur) + '</td>';
            tableHTML += '<td>' + this.formaterGroupe(op.groupe) + '</td>';
            tableHTML += '<td>' + this.formaterTypeOperation(op.typeOperation) + '</td>';
            tableHTML += '<td class="' + (estNegatif ? 'type-frais' : 'type-revenu') + '">' + this.formaterTypeTransaction(op.typeTransaction) + '</td>';
            tableHTML += '<td>' + this.getNomCaisse(op.caisse) + '</td>';
            tableHTML += '<td>' + op.description + '</td>';
            tableHTML += '<td style="font-weight: bold; color: ' + (estNegatif ? '#e74c3c' : '#27ae60') + ';">' + 
                        (estNegatif ? '-' : '') + montantAbsolu.toFixed(2) + '</td>';
            
            if (!this.editMode) {
                tableHTML += '<td><div class="operation-actions">';
                tableHTML += '<button class="btn-small btn-warning" onclick="app.ouvrirModalModification(' + op.id + ')">✏️</button>';
                tableHTML += '<button class="btn-small btn-danger" onclick="app.supprimerOperation(' + op.id + ')">🗑️</button>';
                tableHTML += '</div></td>';
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table></div>';
        container.innerHTML = tableHTML;
    }

    // MÉTHODE POUR LE RÉSUMÉ DES CAISSES
    afficherResumeCaisses() {
        let resumeHTML = '<div class="resume-caisses">';
        resumeHTML += '<h4>📋 Résumé par Caisse - Cliquez sur une caisse pour voir le détail</h4>';
        resumeHTML += '<div class="caisses-grid">';
        
        // Calculer les totaux par caisse
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
        
        // Afficher chaque caisse
        for (const [caisse, solde] of Object.entries(totauxCaisses)) {
            const nomCaisse = this.getNomCaisse(caisse);
            const classeCouleur = solde >= 0 ? 'solde-positif' : 'solde-negatif';
            const estSelectionnee = this.caisseSelectionnee === caisse ? 'caisse-selectionnee' : '';
            
            resumeHTML += `<div class="resume-caisse ${classeCouleur} ${estSelectionnee}" onclick="app.afficherDetailsCaisse('${caisse}')" style="cursor: pointer;">
                <div class="resume-caisse-nom">${nomCaisse}</div>
                <div class="resume-caisse-solde">${solde.toFixed(2)} DH</div>
                <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">Cliquer pour détails</div>
            </div>`;
        }
        
        resumeHTML += '</div></div>';
        return resumeHTML;
    }

    // MÉTHODES D'AJOUT ET MODIFICATION
    ajouterOperation() {
        const formData = new FormData(document.getElementById('operationForm'));
        
        const nouvelleOperation = {
            id: Date.now(),
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
        
        // Réinitialiser le formulaire
        document.getElementById('operationForm').reset();
        
        console.log('✅ Opération ajoutée:', nouvelleOperation);
    }

    ouvrirModalModification(id) {
        const operation = this.operations.find(op => op.id === id);
        if (!operation) return;

        // Remplir le formulaire avec les données existantes
        document.getElementById('date').value = operation.date;
        document.getElementById('operateur').value = operation.operateur;
        document.getElementById('groupe').value = operation.groupe;
        document.getElementById('typeOperation').value = operation.typeOperation;
        document.getElementById('typeTransaction').value = operation.typeTransaction;
        document.getElementById('caisse').value = operation.caisse;
        document.getElementById('description').value = operation.description;
        document.getElementById('montant').value = Math.abs(operation.montant);
        document.getElementById('transfert').value = operation.transfert;

        // Changer le comportement du formulaire pour la modification
        const form = document.getElementById('operationForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.modifierOperation(id);
        };

        console.log('✏️ Modal modification ouvert pour:', operation);
    }

    modifierOperation(id) {
        const formData = new FormData(document.getElementById('operationForm'));
        const operationIndex = this.operations.findIndex(op => op.id === id);

        if (operationIndex === -1) return;

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
        
        // Réinitialiser le formulaire
        document.getElementById('operationForm').reset();
        document.getElementById('operationForm').onsubmit = (e) => {
            e.preventDefault();
            this.ajouterOperation();
        };

        console.log('✅ Opération modifiée:', this.operations[operationIndex]);
    }

    supprimerOperation(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            this.operations = this.operations.filter(op => op.id !== id);
            this.sauvegarderDonnees();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            console.log('🗑️ Opération supprimée:', id);
        }
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
        this.afficherHistorique(this.currentView);
        console.log('🔧 Mode édition:', this.editMode ? 'activé' : 'désactivé');
    }

    supprimerOperationsSelectionnees() {
        if (this.selectedOperations.size === 0) {
            alert('Aucune opération sélectionnée');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            this.operations = this.operations.filter(op => !this.selectedOperations.has(op.id));
            this.selectedOperations.clear();
            this.sauvegarderDonnees();
            this.updateStats();
            this.afficherHistorique(this.currentView);
            console.log('🗑️ Opérations supprimées:', this.selectedOperations.size);
        }
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
                        <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                    </div>
                    
                    <div class="summary">
                        <div class="summary-item">
                            <strong>Total Revenus:</strong><br>
                            <span class="positive" style="font-size: 18px; font-weight: bold;">+${totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="summary-item">
                            <strong>Total Frais:</strong><br>
                            <span class="negative" style="font-size: 18px; font-weight: bold;">-${totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="summary-item">
                            <strong>Solde Actuel:</strong><br>
                            <span class="${soldeCaisse >= 0 ? 'positive' : 'negative'}" style="font-size: 18px; font-weight: bold;">
                                ${soldeCaisse >= 0 ? '+' : ''}${soldeCaisse.toFixed(2)} DH
                            </span>
                        </div>
                        <div class="summary-item">
                            <strong>Nombre d'opérations:</strong><br>
                            <span style="font-size: 18px; font-weight: bold;">${operationsCaisse.length}</span>
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
                                    <td style="color: ${op.montant < 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
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
        console.log('💾 Données exportées');
    }

    // MÉTHODES DE FORMATAGE
    formaterDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💼 Omar', 
            'hicham': '👨‍💼 Hicham'
        };
        return operateurs[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': '🫒 Zaitoun',
            '3commain': '👥 3 Commain'
        };
        return groupes[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'vente': '💰 Vente',
            'achat': '🛒 Achat',
            'frais': '💸 Frais',
            'investissement': '🏗️ Investissement',
            'salaire': '👨‍💼 Salaire'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        const types = {
            'espece': '💵 Espèce',
            'cheque': '📋 Chèque',
            'virement': '🏦 Virement'
        };
        return types[type] || type;
    }

    getNomCaisse(caisse) {
        const caisses = {
            'abdel_caisse': 'Caisse Abdel',
            'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham',
            'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    getTitreVue(vue) {
        const titres = {
            'global': '🌍 Vue Globale - Toutes les opérations',
            'zaitoun': '🫒 Groupe Zaitoun',
            '3commain': '👥 Groupe 3 Commain',
            'abdel': '👨‍💼 Opérations Abdel',
            'omar': '👨‍💼 Opérations Omar',
            'hicham': '👨‍💼 Opérations Hicham',
            'transferts': '🔄 Opérations de Transfert'
        };
        return titres[vue] || 'Vue';
    }
}

// Initialisation globale
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
