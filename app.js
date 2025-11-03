// app.js - Version corrigée avec authentification et changement de mot de passe
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
        
        // Authentification
        this.utilisateurConnecte = null;
        this.motsDePasse = JSON.parse(localStorage.getItem('mots_de_passe')) || {
            'abdel': 'abdel123',
            'omar': 'omar123', 
            'hicham': 'hicham123'
        };
        
        // Pour éviter les boucles de synchronisation
        this.suppressionsEnCours = new Set();
        this.ajoutsEnCours = new Set();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.verifierAuthentification();
    }

    setupEventListeners() {
        console.log('🔧 Configuration des écouteurs d\'événements...');
        
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.connexion(e));
        }
        
        // Formulaire de changement de mot de passe
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.changerMotDePasse(e));
        }
        
        // Formulaire de saisie
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }
        
        // Formulaire de transfert
        const transfertForm = document.getElementById('transfertForm');
        if (transfertForm) {
            transfertForm.addEventListener('submit', (e) => this.ajouterTransfert(e));
        }
        
        // Bouton reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }
        
        // Mode édition
        const btnEditMode = document.getElementById('btnEditMode');
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode(true));
        }
        
        // Suppression sélectionnée
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => this.supprimerOperationsSelectionnees());
        }
        
        // Annuler édition
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => this.toggleEditMode(false));
        }
        
        // Gestion des onglets
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sheet = e.target.getAttribute('data-sheet');
                this.afficherHistorique(sheet);
                
                // Mettre à jour l'onglet actif
                tabButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Modal de modification
        const editModal = document.getElementById('editModal');
        const closeModalButtons = document.querySelectorAll('.close-modal');
        
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                editModal.style.display = 'none';
            });
        });
        
        // Formulaire de modification
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.modifierOperation(e));
        }
        
        // Fermer modal en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
            if (e.target === document.getElementById('passwordModal')) {
                document.getElementById('passwordModal').style.display = 'none';
            }
        });
        
        // Gestion du type d'opération pour afficher la répartition
        const typeOperationSelect = document.getElementById('typeOperation');
        if (typeOperationSelect) {
            typeOperationSelect.addEventListener('change', (e) => {
                this.gestionAffichageRepartition(e.target.value);
            });
        }
        
        console.log('✅ Écouteurs d\'événements configurés');
    }

    // SYSTÈME D'AUTHENTIFICATION
    verifierAuthentification() {
        const utilisateurSauvegarde = localStorage.getItem('utilisateur_connecte');
        if (utilisateurSauvegarde) {
            this.utilisateurConnecte = JSON.parse(utilisateurSauvegarde);
            this.initialiserApplication();
        } else {
            this.afficherModalConnexion();
        }
    }

    afficherModalConnexion() {
        document.getElementById('loginModal').style.display = 'flex';
        document.querySelector('.container').style.display = 'none';
    }

    cacherModalConnexion() {
        document.getElementById('loginModal').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    }

    connexion(e) {
        e.preventDefault();
        
        const operateur = document.getElementById('loginOperateur').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!operateur || !password) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (this.motsDePasse[operateur] === password) {
            this.utilisateurConnecte = {
                id: operateur,
                nom: this.formaterOperateur(operateur),
                dateConnexion: new Date().toISOString(),
                premiereConnexion: !localStorage.getItem(`utilisateur_${operateur}_actif`)
            };
            
            localStorage.setItem('utilisateur_connecte', JSON.stringify(this.utilisateurConnecte));
            
            // Marquer l'utilisateur comme actif après première connexion
            if (this.utilisateurConnecte.premiereConnexion) {
                localStorage.setItem(`utilisateur_${operateur}_actif`, 'true');
                this.afficherModalChangementMotDePasse();
            } else {
                this.cacherModalConnexion();
                this.initialiserApplication();
                this.afficherMessageSucces(`Bienvenue ${this.utilisateurConnecte.nom} !`);
            }
        } else {
            alert('Mot de passe incorrect');
        }
    }

    afficherModalChangementMotDePasse() {
        document.getElementById('passwordModal').style.display = 'flex';
    }

    cacherModalChangementMotDePasse() {
        document.getElementById('passwordModal').style.display = 'none';
    }

    changerMotDePasse(e) {
        e.preventDefault();
        
        const nouveauPassword = document.getElementById('newPassword').value;
        const confirmerPassword = document.getElementById('confirmPassword').value;
        
        if (!nouveauPassword || !confirmerPassword) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (nouveauPassword !== confirmerPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (nouveauPassword.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        // Mettre à jour le mot de passe
        this.motsDePasse[this.utilisateurConnecte.id] = nouveauPassword;
        localStorage.setItem('mots_de_passe', JSON.stringify(this.motsDePasse));
        
        this.cacherModalChangementMotDePasse();
        this.cacherModalConnexion();
        this.initialiserApplication();
        this.afficherMessageSucces('Mot de passe changé avec succès ! Bienvenue !');
    }

    deconnexion() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            this.utilisateurConnecte = null;
            localStorage.removeItem('utilisateur_connecte');
            this.afficherModalConnexion();
        }
    }

    initialiserApplication() {
        this.afficherEnTeteUtilisateur();
        this.chargerDonneesAvecSynchro();
        this.setupFirebaseRealtimeListeners();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application Gestion Ferme initialisée pour', this.utilisateurConnecte.nom);
    }

    afficherEnTeteUtilisateur() {
        // Supprimer l'ancien en-tête s'il existe
        const ancienEnTete = document.querySelector('.user-header');
        if (ancienEnTete) {
            ancienEnTete.remove();
        }
        
        const header = document.querySelector('header');
        const userHeader = document.createElement('div');
        userHeader.className = 'user-header';
        userHeader.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${this.utilisateurConnecte.id === 'abdel' ? '👨‍💼' : 
                      this.utilisateurConnecte.id === 'omar' ? '👨‍💻' : '👨‍🔧'}
                </div>
                <div class="user-details">
                    <h3>${this.utilisateurConnecte.nom}</h3>
                    <p>Connecté depuis ${new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-info" onclick="app.changerMotDePasseUtilisateur()">🔐 Changer mot de passe</button>
                <button class="logout-btn">🚪 Déconnexion</button>
            </div>
        `;
        
        header.parentNode.insertBefore(userHeader, header.nextSibling);
        
        // Re-attacher l'événement de déconnexion
        userHeader.querySelector('.logout-btn').addEventListener('click', () => this.deconnexion());
    }

    changerMotDePasseUtilisateur() {
        this.afficherModalChangementMotDePasse();
    }

    // VÉRIFICATION DES PERMISSIONS
    peutModifierOperation(operation) {
        if (!this.utilisateurConnecte) return false;
        
        // L'utilisateur peut modifier ses propres opérations
        if (operation.createur === this.utilisateurConnecte.id) {
            return true;
        }
        
        // Les opérations système (transferts) peuvent être modifiées par tous
        if (operation.operateur === 'system') {
            return true;
        }
        
        return false;
    }

    peutSupprimerOperation(operation) {
        return this.peutModifierOperation(operation);
    }

    // MÉTHODES DE GESTION DES DONNÉES
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
                console.log(`💾 ${this.operations.length} opérations chargées du stockage local`);
            } catch (error) {
                console.error('❌ Erreur chargement localStorage:', error);
                this.operations = [];
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
            const operationsFirebase = await firebaseSync.getCollection('operations');
            
            if (operationsFirebase && operationsFirebase.length > 0) {
                console.log(`📡 ${operationsFirebase.length} opérations sur Firebase`);
                
                let nouvellesOperations = 0;

                // Réinitialiser les opérations avec celles de Firebase
                this.operations = [];

                operationsFirebase.forEach(opFirebase => {
                    // Utiliser directement les opérations de Firebase avec leurs IDs
                    this.operations.unshift(opFirebase);
                    nouvellesOperations++;
                    console.log(`➕ Opération ${opFirebase.id} synchronisée depuis Firebase`);
                });

                this.operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                this.sauvegarderLocalement();

                console.log(`✅ Synchronisation: ${nouvellesOperations} opérations chargées depuis Firebase`);
                
                if (nouvellesOperations > 0) {
                    this.afficherMessageSucces(`Synchronisée: ${nouvellesOperations} opérations`);
                    this.mettreAJourAffichage();
                }
            }
            
            this.firebaseInitialized = true;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        } finally {
            this.synchronisationEnCours = false;
        }
    }

    setupFirebaseRealtimeListeners() {
        if (!window.firebaseSync) {
            setTimeout(() => this.setupFirebaseRealtimeListeners(), 2000);
            return;
        }

        console.log('👂 Activation écoute temps réel avec anti-boucle');
        
        this.unsubscribeFirebase = firebaseSync.listenToCollection('operations', (changes, snapshot) => {
            if (changes.length > 0) {
                console.log(`🔄 Synchronisation temps réel: ${changes.length} changement(s)`);
                
                let modifications = 0;
                let modificationsIgnorees = 0;
                
                changes.forEach(change => {
                    const operationId = change.id;
                    
                    // Vérifier si c'est une opération que NOUS avons initiée
                    if (this.suppressionsEnCours.has(operationId)) {
                        console.log(`🚫 Suppression ${operationId} ignorée (initiée localement)`);
                        modificationsIgnorees++;
                        return;
                    }

                    if (change.type === 'added') {
                        this.ajouterOperationSynchro(change.data, operationId);
                        modifications++;
                    } else if (change.type === 'modified') {
                        this.mettreAJourOperationSynchro(operationId, change.data);
                        modifications++;
                    } else if (change.type === 'removed') {
                        // Accepter les suppressions venant d'autres appareils
                        this.supprimerOperationSynchro(operationId);
                        modifications++;
                    }
                });
                
                if (modifications > 0) {
                    this.sauvegarderLocalement();
                    this.mettreAJourAffichage();
                    console.log(`✅ ${modifications} opération(s) synchronisée(s) en temps réel, ${modificationsIgnorees} ignorées (initiées localement)`);
                }
            }
        });
    }

    ajouterOperationSynchro(data, operationId) {
        const operation = {
            id: operationId,
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
            createur: data.createur,
            createurNom: data.createurNom,
            modifiePar: data.modifiePar,
            modifieParNom: data.modifieParNom,
            dateModification: data.dateModification,
            timestamp: data.timestamp || new Date().toISOString()
        };

        const existeDeja = this.operations.some(op => op.id === operation.id);
        if (!existeDeja) {
            this.operations.unshift(operation);
            console.log(`➕ Opération ${operation.id} ajoutée par synchronisation`);
        }
    }

    mettreAJourOperationSynchro(operationId, newData) {
        const index = this.operations.findIndex(op => op.id === operationId);
        if (index !== -1) {
            this.operations[index] = { ...this.operations[index], ...newData };
        }
    }

    supprimerOperationSynchro(operationId) {
        const ancienNombre = this.operations.length;
        this.operations = this.operations.filter(op => op.id !== operationId);
        if (this.operations.length < ancienNombre) {
            console.log(`🗑️ Opération ${operationId} supprimée par synchronisation (autre appareil)`);
        }
    }

    sauvegarderLocalement() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    // ... (les autres méthodes restent identiques mais avec les noms corrigés)

    // MÉTHODES DE RÉINITIALISATION
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
                        await firebaseSync.deleteDocument('operations', op.id);
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
            this.suppressionsEnCours.clear();
            this.ajoutsEnCours.clear();
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

    reinitialiserLocal() {
        if (!confirm('Vider les données locales ? Les données Firebase resteront intactes.')) {
            return;
        }

        console.log('🗑️ Réinitialisation des données locales...');
        
        // Vider le localStorage
        localStorage.removeItem('gestion_ferme_data');
        
        // Réinitialiser les variables
        this.operations = [];
        this.suppressionsEnCours.clear();
        this.ajoutsEnCours.clear();
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

    // ... (le reste des méthodes reste identique)

    // Méthodes de formatage
    formaterDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const noms = { 'abdel': 'Abdel', 'omar': 'Omar', 'hicham': 'Hicham', 'system': 'Système' };
        return noms[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const noms = { 'zaitoun': 'Zaitoun', '3commain': '3 Commain', 'system': 'Système' };
        return noms[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': 'Travailleur Global',
            'zaitoun': 'Zaitoun', '3commain': '3 Commain',
            'autre': 'Autre', 'transfert': 'Transfert'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        return type === 'revenu' ? '💰 Revenu' : '💸 Frais';
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': 'Caisse Abdel', 'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham', 'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }

    afficherMessageSucces(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 4000);
        }
    }

    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        const repartitionInfo = document.getElementById('repartitionInfo');
        if (saisieForm) saisieForm.reset();
        if (repartitionInfo) repartitionInfo.style.display = 'none';
    }

    gestionAffichageRepartition(typeOperation) {
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');
        const montantInput = document.getElementById('montant');
        
        if (!repartitionInfo || !repartitionDetails) return;
        
        if (typeOperation === 'travailleur_global') {
            repartitionInfo.style.display = 'block';
            
            const updateRepartition = () => {
                const montant = parseFloat(montantInput.value) || 0;
                if (montant > 0) {
                    const partZaitoun = (montant / 3).toFixed(2);
                    const part3Commain = ((montant * 2) / 3).toFixed(2);
                    
                    repartitionDetails.innerHTML = `
                        <div class="repartition-details">
                            <div class="repartition-item zaitoun">
                                <span class="repartition-label">🫒 Zaitoun (1/3):</span>
                                <span class="repartition-value">${partZaitoun} DH</span>
                            </div>
                            <div class="repartition-item commain">
                                <span class="repartition-label">🔧 3 Commain (2/3):</span>
                                <span class="repartition-value">${part3Commain} DH</span>
                            </div>
                        </div>
                    `;
                } else {
                    repartitionDetails.innerHTML = '<p>Saisissez un montant pour voir la répartition</p>';
                }
            };
            
            montantInput.removeEventListener('input', updateRepartition);
            montantInput.addEventListener('input', updateRepartition);
            updateRepartition();
            
        } else {
            repartitionInfo.style.display = 'none';
        }
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    window.app = app; // Rendre app global pour les onclick
});
