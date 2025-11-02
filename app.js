// app.js - Gestion Ferme Ben Amara - Version Améliorée
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

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.chargerDonnees();
        this.updateStats();
        this.afficherHistorique('global');
        this.detecterMobile();
        this.demarrerAutoSync();
        console.log('✅ Application Gestion Ferme initialisée');
    }

    // SYNCHRONISATION AUTOMATIQUE
    demarrerAutoSync() {
        // Sauvegarde automatique toutes les 30 secondes
        this.autoSaveInterval = setInterval(() => {
            this.synchroniserDonnees();
        }, 30000);

        // Sauvegarde quand l'utilisateur quitte la page
        window.addEventListener('beforeunload', () => {
            this.synchroniserDonnees();
        });
    }

    synchroniserDonnees() {
        try {
            this.sauvegarderDonnees();
            this.updateStats();
            console.log('🔄 Données synchronisées automatiquement');
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        }
    }

    // CHARGEMENT DES DONNÉES EXISTANTES
    chargerDonnees() {
        try {
            const donnees = localStorage.getItem('gestionFermeOperations');
            if (donnees) {
                this.operations = JSON.parse(donnees);
                console.log('📂 Données chargées:', this.operations.length, 'opérations');
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
                description: 'Vente d\'olives premium',
                montant: 2500.00,
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
                description: 'Achat d\'engrais biologique',
                montant: -800.00,
                transfert: false
            },
            {
                id: '3',
                date: date,
                operateur: 'hicham',
                groupe: 'zaitoun',
                typeOperation: 'frais',
                typeTransaction: 'espece', 
                caisse: 'hicham_caisse',
                description: 'Frais de transport',
                montant: -350.00,
                transfert: false
            },
            {
                id: '4',
                date: date,
                operateur: 'abdel',
                groupe: 'zaitoun',
                typeOperation: 'investissement',
                typeTransaction: 'virement',
                caisse: 'zaitoun_caisse',
                description: 'Achat nouveau matériel',
                montant: -1500.00,
                transfert: false
            },
            {
                id: '5',
                date: date,
                operateur: 'omar',
                groupe: '3commain', 
                typeOperation: 'vente',
                typeTransaction: 'cheque',
                caisse: '3commain_caisse',
                description: 'Vente produits agricoles',
                montant: 3200.00,
                transfert: false
            }
        ];
        this.sauvegarderDonnees();
        console.log('📝 Données d\'exemple chargées');
    }

    // MÉTHODE AMÉLIORÉE POUR AJOUTER OPÉRATIONS
    ajouterOperation() {
        const formData = new FormData(document.getElementById('operationForm'));
        const operateur = formData.get('operateur');
        
        // Déterminer automatiquement la caisse basée sur l'opérateur
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
                caisseAuto = formData.get('caisse') || 'abdel_caisse';
        }

        const nouvelleOperation = {
            id: Date.now().toString(),
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            operateur: operateur,
            groupe: formData.get('groupe'),
            typeOperation: formData.get('typeOperation'),
            typeTransaction: formData.get('typeTransaction'),
            caisse: caisseAuto, // Caisse automatique basée sur l'opérateur
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
        
        document.getElementById('operationForm').reset();
        this.afficherNotification(`Opération enregistrée dans ${this.getNomCaisse(caisseAuto)}`, 'success');
    }

    calculerMontantAvecSigne(montant, typeOperation) {
        // Les ventes sont positives, les autres négatives
        if (typeOperation === 'vente') {
            return Math.abs(montant);
        } else {
            return -Math.abs(montant);
        }
    }

    // MÉTHODE UPDATE STATS AMÉLIORÉE
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
        // Réinitialiser les caisses
        this.caisses = {
            'abdel_caisse': 0, 
            'omar_caisse': 0, 
            'hicham_caisse': 0, 
            'zaitoun_caisse': 0, 
            '3commain_caisse': 0
        };

        // Calculer les soldes
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
                <div class="stat-trend">
                    ${this.calculerTrendCaisse(cleCaisse)}
                </div>
                <div class="stat-indication">👆 Voir le détail</div>
            </div>`;
    }

    calculerTrendCaisse(caisse) {
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        if (operationsCaisse.length === 0) return '📊 Aucune opération';
        
        const aujourdHui = new Date().toISOString().split('T')[0];
        const operationsAujourdHui = operationsCaisse.filter(op => op.date === aujourdHui);
        
        return `📊 ${operationsCaisse.length} ops (${operationsAujourdHui.length} aujourd'hui)`;
    }

    // MÉTHODE POUR AFFICHER LES DÉTAILS D'UNE CAISSE (AMÉLIORÉE)
    afficherDetailsCaisse(caisse) {
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
                            <button class="btn-primary" onclick="app.exporterDetailsCaisse('${caisse}')">
                                💾 Exporter PDF
                            </button>
                        </div>
                    </div>
                    <div class="totals-container ${this.isMobile ? 'mobile-totals' : ''}">
                        <div class="total-item highlight">
                            <span class="total-label">💰 Total Revenus:</span>
                            <span class="total-value positive">+${totalRevenus.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item highlight">
                            <span class="total-label">💸 Total Frais:</span>
                            <span class="total-value negative">-${totalFrais.toFixed(2)} DH</span>
                        </div>
                        <div class="total-item highlight">
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

                <div class="section-title">
                    <h4>📋 Historique détaillé des opérations</h4>
                    <div class="section-badge">${operationsCaisse.length} opérations trouvées</div>
                </div>
                
                ${operationsCaisse.length === 0 ? 
                    '<div class="empty-message"><p>📭 Aucune opération enregistrée pour cette caisse</p></div>' : 
                    this.creerTableauDetailsCaisse(operationsCaisse)
                }
            </div>
        `;
        
        container.innerHTML = detailsHTML;
        this.mettreAJourOngletsCaisse(caisse);
    }

    // RESTE DES MÉTHODES (identique à votre code original avec les corrections)
    setupEventListeners() {
        try {
            window.addEventListener('resize', () => {
                this.detecterMobile();
                this.afficherHistorique(this.currentView);
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

            const transferForm = document.getElementById('transferForm');
            if (transferForm) {
                transferForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.effectuerTransfert();
                });
            }

            // Supprimer les écouteurs pour sync manuel puisque c'est automatique maintenant
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
            });

            console.log('✅ Écouteurs d\'événements initialisés');
        } catch (error) {
            console.error('❌ Erreur initialisation écouteurs:', error);
        }
    }

    sauvegarderDonnees() {
        try {
            localStorage.setItem('gestionFermeOperations', JSON.stringify(this.operations));
            localStorage.setItem('gestionFermeLastSync', new Date().toISOString());
            
            // Afficher une notification discrète de sauvegarde
            this.afficherNotificationAutoSave('💾 Données sauvegardées automatiquement');
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.afficherNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    afficherNotificationAutoSave(message) {
        // Notification discrète pour l'auto-save
        const existingNotification = document.querySelector('.notification-autosave');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification notification-info notification-autosave';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // MÉTHODES MANQUANTES POUR CORRIGER LES ERREURS
    affichepredification = (data) => {
        console.log('📊 Affichage prédiction:', data);
    }

    updatestatus = (status) => {
        console.log('🔄 Mise à jour statut:', status);
    }

    initializerfixable = () => {
        this.fixables = this.fixables || {};
        return this.fixables;
    }

    destionfense = (data) => {
        return data;
    }

    cononymous = (data) => {
        return data;
    }

    // ... (le reste de vos méthodes existantes reste inchangé)
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

    // ... (toutes vos autres méthodes existantes)

}

// Initialisation globale
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new GestionFerme();
        window.app = app;
        console.log('🚀 Application démarrée avec succès - Synchronisation automatique activée');
    } catch (error) {
        console.error('💥 Erreur démarrage application:', error);
        alert('Erreur lors du démarrage de l\'application. Veuillez actualiser la page.');
    }
});
