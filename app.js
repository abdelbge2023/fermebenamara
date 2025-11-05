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
        this.currentEditModal = null;
        
        this.initEventListeners();
        this.setupAuthHandlers();
    }
// CORRECTION DE LA MÉTHODE showManual - À AJOUTER DANS LA CLASSE GestionFermeApp

// MÉTHODE showManual COMPLÈTE AVEC MANUEL D'UTILISATION ET CALCULS
showManual() {
    console.log('📖 Affichage du manuel complet');
    
    const manualModal = document.createElement('div');
    manualModal.className = 'modal';
    manualModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
    `;
    
    manualModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 1000px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 15px;">
                <h2 style="margin: 0; color: #2c3e50;">📚 MANUEL COMPLET - GESTION FERME BEN AMARA</h2>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            </div>

            <!-- MENU DE NAVIGATION -->
            <div style="display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap;">
                <button onclick="this.scrollToSection('utilisation')" style="padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">🚀 Utilisation du Site</button>
                <button onclick="this.scrollToSection('calculs')" style="padding: 10px 15px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">🧮 Calculs des Caisses</button>
                <button onclick="this.scrollToSection('fonctions')" style="padding: 10px 15px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer;">⚙️ Fonctions Avancées</button>
            </div>

            <!-- PARTIE 1 : UTILISATION DU SITE -->
            <div id="section-utilisation" style="margin-bottom: 40px;">
                <h3 style="color: #3498db; border-left: 4px solid #3498db; padding-left: 10px; margin-bottom: 20px;">🚀 GUIDE D'UTILISATION DU SITE</h3>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px;">🔐 CONNEXION AU SYSTÈME</h4>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <p><strong>Étapes :</strong></p>
                        <ol>
                            <li>Renseignez votre email et mot de passe</li>
                            <li>Cliquez sur "Se connecter"</li>
                            <li>Le système configure automatiquement votre profil</li>
                            <li>Vous êtes redirigé vers le tableau de bord</li>
                        </ol>
                        <p><strong>💡 Astuce :</strong> Votre opérateur est automatiquement détecté selon votre email</p>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px;">➕ SAISIE D'UNE NOUVELLE OPÉRATION</h4>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <p><strong>Formulaire principal :</strong></p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div>
                                <p><strong>Champs obligatoires :</strong></p>
                                <ul>
                                    <li>👤 Opérateur (automatique)</li>
                                    <li>📋 Type d'opération</li>
                                    <li>🏷️ Groupe concerné</li>
                                    <li>💰 Type de transaction</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Suite :</strong></p>
                                <ul>
                                    <li>🏦 Caisse impactée</li>
                                    <li>💵 Montant (DH)</li>
                                    <li>📝 Description</li>
                                </ul>
                            </div>
                        </div>
                        <p><strong>⚠️ Important :</strong> Pour "Travailleur Global + Les Deux Groupes", la répartition 1/3-2/3 est automatique</p>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px;">🔄 EFFECTUER UN TRANSFERT</h4>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <p><strong>Onglet "Transfert" :</strong></p>
                        <ol>
                            <li>Sélectionnez la caisse source</li>
                            <li>Sélectionnez la caisse destination</li>
                            <li>Entrez le montant du transfert</li>
                            <li>Ajoutez une description</li>
                            <li>Cliquez sur "Effectuer le transfert"</li>
                        </ol>
                        <p><strong>✅ Validation :</strong> Le système vérifie automatiquement les fonds disponibles</p>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px;">📊 NAVIGATION ENTRE LES VUES</h4>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Onglets disponibles :</strong></p>
                                <ul>
                                    <li>🌍 Toutes les opérations</li>
                                    <li>🫒 Zaitoun</li>
                                    <li>🔧 3 Commain</li>
                                    <li>👨‍💼 Abdel</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Suite :</strong></p>
                                <ul>
                                    <li>👨‍💻 Omar</li>
                                    <li>👨‍🔧 Hicham</li>
                                    <li>🔄 Transferts</li>
                                    <li>👥 Les Deux Groupes</li>
                                </ul>
                            </div>
                        </div>
                        <p><strong>💡 Fonctionnalité :</strong> Chaque vue montre les totaux spécifiques</p>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px;">✏️ GESTION DES OPÉRATIONS</h4>
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Édition simple :</strong></p>
                                <ul>
                                    <li>Cliquez sur <strong>✏️</strong> pour modifier</li>
                                    <li>Modifiez les champs nécessaires</li>
                                    <li>Sauvegardez les changements</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Mode édition avancé :</strong></p>
                                <ul>
                                    <li>Activez le <strong>Mode Édition</strong></li>
                                    <li>Sélectionnez plusieurs opérations</li>
                                    <li>Supprimez en masse avec <strong>🗑️ Supprimer (X)</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PARTIE 2 : CALCULS DES CAISSES -->
            <div id="section-calculs" style="margin-bottom: 40px;">
                <h3 style="color: #27ae60; border-left: 4px solid #27ae60; padding-left: 10px; margin-bottom: 20px;">🧮 SYSTÈME DE CALCUL DES CAISSES</h3>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #229954; margin-bottom: 15px;">🏦 ARCHITECTURE DES CAISSES</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                            <h5 style="margin-top: 0; color: #27ae60;">👨‍💼 Caisses Personnelles</h5>
                            <ul style="margin: 0;">
                                <li><strong>Caisse Abdel</strong> (abdel_caisse)</li>
                                <li><strong>Caisse Omar</strong> (omar_caisse)</li>
                                <li><strong>Caisse Hicham</strong> (hicham_caisse)</li>
                            </ul>
                        </div>
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                            <h5 style="margin-top: 0; color: #27ae60;">🏢 Caisses de Groupes</h5>
                            <ul style="margin: 0;">
                                <li><strong>🫒 Caisse Zaitoun</strong> (zaitoun_caisse)</li>
                                <li><strong>🔧 Caisse 3 Commain</strong> (3commain_caisse)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #229954; margin-bottom: 15px;">🧮 FORMULE DE CALCUL</h4>
                    <div style="background: #d4efdf; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #196f3d;">
                            SOLDE = Σ(REVENUS) - Σ(FRAIS) - Σ(TRANSFERTS SORTANTS) + Σ(TRANSFERTS ENTRANTS)
                        </p>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #229954; margin-bottom: 15px;">🔀 RÉPARTITION AUTOMATIQUE</h4>
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px;">
                        <p><strong>Cas spécial : Travailleur Global + Les Deux Groupes</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            <p><strong>Exemple : Frais de 900 DH</strong></p>
                            <p>🫒 <strong>Zaitoun (1/3)</strong> = 900 × 1/3 = <strong>300 DH</strong></p>
                            <p>🔧 <strong>3 Commain (2/3)</strong> = 900 × 2/3 = <strong>600 DH</strong></p>
                            <p><strong>→ 2 opérations créées automatiquement</strong></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PARTIE 3 : FONCTIONS AVANCÉES -->
            <div id="section-fonctions" style="margin-bottom: 30px;">
                <h3 style="color: #9b59b6; border-left: 4px solid #9b59b6; padding-left: 10px; margin-bottom: 20px;">⚙️ FONCTIONS AVANCÉES</h3>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px;">📊 TABLEAU DE BORD EN TEMPS RÉEL</h4>
                    <div style="background: #f4ecf7; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Fonctionnalités :</strong></p>
                                <ul>
                                    <li>✅ Soldes mis à jour instantanément</li>
                                    <li>✅ Synchronisation multi-appareils</li>
                                    <li>✅ Historique complet des opérations</li>
                                    <li>✅ Filtrage par date et type</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Indicateurs :</strong></p>
                                <ul>
                                    <li>📈 Solde positif (vert)</li>
                                    <li>📉 Solde négatif (rouge)</li>
                                    <li>📊 Nombre d'opérations</li>
                                    <li>💰 Totaux par vue</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px;">📤 EXPORT DE DONNÉES</h4>
                    <div style="background: #f4ecf7; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                                <strong>📄 Export Complet</strong>
                                <p style="font-size: 12px; margin: 5px 0 0 0;">Toutes les données en Excel</p>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                                <strong>👁️ Export Vue</strong>
                                <p style="font-size: 12px; margin: 5px 0 0 0;">Données de la vue actuelle</p>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                                <strong>📈 Rapport Détaillé</strong>
                                <p style="font-size: 12px; margin: 5px 0 0 0;">Avec statistiques</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px;">🛠️ OUTILS D'ADMINISTRATION</h4>
                    <div style="background: #f4ecf7; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Nettoyage :</strong></p>
                                <ul>
                                    <li>🗑️ Vider données locales</li>
                                    <li>🔥 Réinitialiser Firebase</li>
                                    <li>🔄 Resynchroniser</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Sécurité :</strong></p>
                                <ul>
                                    <li>🔐 Authentification sécurisée</li>
                                    <li>👥 Gestion des permissions</li>
                                    <li>📱 Accès multi-appareils</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px;">🎯 RACCOURCS ET ASTUCES</h4>
                    <div style="background: #f4ecf7; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Navigation rapide :</strong></p>
                                <ul>
                                    <li>Cliquez sur une caisse pour voir son détail</li>
                                    <li>Utilisez les onglets pour filtrer</li>
                                    <li>Mode édition pour actions groupées</li>
                                </ul>
                            </div>
                            <div>
                                <p><strong>Productivité :</strong></p>
                                <ul>
                                    <li>Reset formulaire après saisie</li>
                                    <li>Recherche dans l'historique</li>
                                    <li>Export régulier pour backup</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RÉSUMÉ DES FONCTIONNALITÉS -->
            <div style="background: #2c3e50; color: white; padding: 25px; border-radius: 8px; margin-top: 30px;">
                <h4 style="margin: 0 0 20px 0; text-align: center; font-size: 20px;">🎯 RÉSUMÉ DES FONCTIONNALITÉS PRINCIPALES</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">➕</div>
                        <p style="margin: 0; font-weight: bold;">Saisie Opérations</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Simple et rapide</p>
                    </div>
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">🔄</div>
                        <p style="margin: 0; font-weight: bold;">Transferts</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Entre caisses</p>
                    </div>
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
                        <p style="margin: 0; font-weight: bold;">Tableau de Bord</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Temps réel</p>
                    </div>
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">✏️</div>
                        <p style="margin: 0; font-weight: bold;">Édition</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Simple et multiple</p>
                    </div>
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">📤</div>
                        <p style="margin: 0; font-weight: bold;">Export</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Excel complet</p>
                    </div>
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">🔐</div>
                        <p style="margin: 0; font-weight: bold;">Sécurité</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Authentification</p>
                    </div>
                </div>
            </div>

            <!-- PIED DE PAGE -->
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    📞 Support : Contactez l'administrateur système | 
                    🕐 Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')} |
                    🔄 Version : 2.0
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(manualModal);
    
    // Ajouter la fonction de navigation
    manualModal.querySelectorAll('button[onclick*="scrollToSection"]').forEach(btn => {
        btn.onclick = function() {
            const sectionId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            const section = document.getElementById(`section-${sectionId}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    });
    
    // Fermer la modale en cliquant à l'extérieur
    manualModal.addEventListener('click', (e) => {
        if (e.target === manualModal) {
            manualModal.remove();
        }
    });
    
    // Fermer avec la touche Échap
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            manualModal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}
    document.body.appendChild(manualModal);
    
    // Fermer la modale en cliquant à l'extérieur
    manualModal.addEventListener('click', (e) => {
        if (e.target === manualModal) {
            manualModal.remove();
        }
    });
    
    // Fermer avec la touche Échap
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            manualModal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
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

        // Gestion édition - CORRECTION DES BOUTONS
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

        // Réinitialisation - CORRECTION DES BOUTONS
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
            btnManual.addEventListener('click', (e) => {
                e.preventDefault();
                this.showManual();
            });
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
            } else {
                console.warn('⚠️ Impossible de définir l\'opérateur:', {
                    operateur: operateur,
                    selectOperateur: !!selectOperateur,
                    currentUser: !!this.currentUser
                });
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
                dataToShow = this.operations.filter(op => 
                    op.caisse === 'zaitoun_caisse' || 
                    op.groupe === 'zaitoun'
                );
                break;
            case '3commain':
                dataToShow = this.operations.filter(op => 
                    op.caisse === '3commain_caisse' || 
                    op.groupe === '3commain'
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
        
        // Calculer les totaux - CORRECTION : Éviter la double comptabilisation
        let totalRevenus = 0;
        let totalDepenses = 0;
        let totalTransferts = 0;
        
        data.forEach(item => {
            if (item.hasOwnProperty('typeOperation')) {
                const montant = parseFloat(item.montant) || 0;
                const description = item.description || '';
                
                // Identifier les opérations de répartition secondaires
                const isRepartitionSecondaire = item.repartition === true || 
                                              (description && description.includes('Part ')) ||
                                              (description && description.includes('part '));
                
                // Ignorer les répartitions secondaires pour éviter la double comptabilisation
                if (isRepartitionSecondaire && item.typeTransaction === 'frais') {
                    console.log('🔀 Opération de répartition ignorée:', description);
                    return;
                }
                
                if (item.typeTransaction === 'revenu') {
                    totalRevenus += Math.abs(montant);
                } else if (item.typeTransaction === 'frais') {
                    totalDepenses += Math.abs(montant);
                }
            } else {
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
            'transferts': 'Transferts',
            'les_deux_groupes': 'Les Deux Groupes'
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
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedOperations.add(checkbox.value);
            } else {
                this.selectedOperations.delete(checkbox.value);
            }
        });
        
        // Mettre à jour le bouton de suppression
        this.updateSelectedCount();
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

        // 1. Calculer les soldes basés sur les opérations
        this.operations.forEach(operation => {
            const montant = parseFloat(operation.montant) || 0;
            const caisse = operation.caisse;
            
            // CORRECTION : Ignorer les opérations de répartition secondaires
            const isRepartitionSecondaire = operation.repartition === true || 
                                          (operation.description && operation.description.includes('Part ')) ||
                                          (operation.description && operation.description.includes('part '));
            
            if (isRepartitionSecondaire) {
                return; // Ignorer cette opération
            }
            
            if (caisse && soldes[caisse] !== undefined) {
                soldes[caisse] += montant;
            }
        });

        // 2. Gérer les transferts entre caisses
        this.transferts.forEach(transfert => {
            const montant = parseFloat(transfert.montantTransfert) || 0;
            
            // Soustraire de la caisse source
            if (transfert.caisseSource && soldes[transfert.caisseSource] !== undefined) {
                soldes[transfert.caisseSource] -= montant;
            }
            
            // Ajouter à la caisse destination
            if (transfert.caisseDestination && soldes[transfert.caisseDestination] !== undefined) {
                soldes[transfert.caisseDestination] += montant;
            }
        });

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
        console.log('📊 Détails de la caisse:', caisse);
        
        // Filtrer les opérations pour cette caisse
        const operationsCaisse = this.operations.filter(op => op.caisse === caisse);
        const transfertsSource = this.transferts.filter(t => t.caisseSource === caisse);
        const transfertsDestination = this.transferts.filter(t => t.caisseDestination === caisse);
        
        let totalRevenus = operationsCaisse
            .filter(op => op.typeTransaction === 'revenu')
            .reduce((sum, op) => sum + (parseFloat(op.montant) || 0), 0);
            
        let totalDepenses = operationsCaisse
            .filter(op => op.typeTransaction === 'frais')
            .reduce((sum, op) => sum + Math.abs(parseFloat(op.montant) || 0), 0);
        
        let totalSortants = transfertsSource
            .reduce((sum, t) => sum + (parseFloat(t.montantTransfert) || 0), 0);
            
        let totalEntrants = transfertsDestination
            .reduce((sum, t) => sum + (parseFloat(t.montantTransfert) || 0), 0);
        
        const solde = totalRevenus - totalDepenses - totalSortants + totalEntrants;
        
        // Afficher dans une modal au lieu d'une alerte
        this.showCaisseDetailsModal(caisse, {
            operations: operationsCaisse.length,
            revenus: totalRevenus,
            depenses: totalDepenses,
            transfertsSortants: totalSortants,
            transfertsEntrants: totalEntrants,
            solde: solde,
            totalMouvements: operationsCaisse.length + transfertsSource.length + transfertsDestination.length
        });
    }

    showCaisseDetailsModal(caisse, details) {
        // Vérifier si une modale existe déjà et la supprimer
        const existingModal = document.querySelector('.caisse-details-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'caisse-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #2c3e50;">📊 Détails de ${this.getNomCaisse(caisse)}</h3>
                <div style="margin: 15px 0;">
                    <div style="margin-bottom: 8px;"><strong>📝 Opérations:</strong> ${details.operations}</div>
                    <div style="margin-bottom: 8px;"><strong>💰 Revenus:</strong> <span style="color: green">${details.revenus.toFixed(2)} DH</span></div>
                    <div style="margin-bottom: 8px;"><strong>💸 Dépenses:</strong> <span style="color: red">${details.depenses.toFixed(2)} DH</span></div>
                    <div style="margin-bottom: 8px;"><strong>🔄 Transferts sortants:</strong> ${details.transfertsSortants.toFixed(2)} DH</div>
                    <div style="margin-bottom: 8px;"><strong>🔄 Transferts entrants:</strong> ${details.transfertsEntrants.toFixed(2)} DH</div>
                </div>
                <div style="border-top: 1px solid #ccc; padding-top: 10px;">
                    <div style="margin-bottom: 8px;"><strong>⚖️ Solde calculé:</strong> <span style="color: ${details.solde >= 0 ? 'green' : 'red'}; font-weight: bold">${details.solde.toFixed(2)} DH</span></div>
                    <div><strong>📋 Total mouvements:</strong> ${details.totalMouvements}</div>
                </div>
                <button onclick="gestionFermeApp.closeCaisseDetailsModal()" style="margin-top: 15px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                    Fermer
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Empêcher le clic sur la modale de fermer le contenu
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCaisseDetailsModal();
            }
        });
    }

    closeCaisseDetailsModal() {
        const modal = document.querySelector('.caisse-details-modal');
        if (modal) {
            modal.remove();
        }
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
                let operationsACreer = [];

                // CAS SPÉCIAL : TRAVAILLEUR GLOBAL + LES DEUX GROUPES
                if (typeOperation === 'travailleur_global' && groupe === 'les_deux_groupes') {
                    // Calcul des parts 1/3 et 2/3
                    const montantZaitoun = parseFloat((montantTotal * (1/3)).toFixed(2));
                    const montantCommain = parseFloat((montantTotal * (2/3)).toFixed(2));
                    
                    operationsACreer = [
                        {
                            operateur: operateur,
                            groupe: 'zaitoun',
                            typeOperation: 'zaitoun',
                            typeTransaction: typeTransaction,
                            caisse: caisse,
                            montant: typeTransaction === 'frais' ? -montantZaitoun : montantZaitoun,
                            description: `${description} (Part Zaitoun - 1/3 = ${montantZaitoun} DH)`,
                            timestamp: new Date().toISOString(),
                            userId: this.currentUser.uid,
                            userEmail: this.currentUser.email,
                            repartition: true
                        },
                        {
                            operateur: operateur,
                            groupe: '3commain',
                            typeOperation: '3commain',
                            typeTransaction: typeTransaction,
                            caisse: caisse,
                            montant: typeTransaction === 'frais' ? -montantCommain : montantCommain,
                            description: `${description} (Part 3 Commain - 2/3 = ${montantCommain} DH)`,
                            timestamp: new Date().toISOString(),
                            userId: this.currentUser.uid,
                            userEmail: this.currentUser.email,
                            repartition: true
                        }
                    ];
                    
                } else {
                    // CAS NORMAL (un seul groupe)
                    operationsACreer = [{
                        operateur: operateur,
                        groupe: groupe,
                        typeOperation: typeOperation,
                        typeTransaction: typeTransaction,
                        caisse: caisse,
                        montant: typeTransaction === 'frais' ? -montantTotal : montantTotal,
                        description: description,
                        timestamp: new Date().toISOString(),
                        userId: this.currentUser.uid,
                        userEmail: this.currentUser.email,
                        repartition: false
                    }];
                }

                // ENREGISTREMENT DES OPÉRATIONS
                for (const operation of operationsACreer) {
                    await window.firebaseSync.addDocument('operations', operation);
                }
                
                if (operationsACreer.length === 2) {
                    this.showMessage(`✅ OPÉRATION RÉPARTIE! ${caisse} → Zaitoun: ${(montantTotal/3).toFixed(2)} DH + 3 Commain: ${((montantTotal*2)/3).toFixed(2)} DH`, 'success');
                } else {
                    this.showMessage(`✅ OPÉRATION ENREGISTRÉE! ${montantTotal} DH sur ${caisse}`, 'success');
                }

                // Réinitialisation du formulaire
                this.resetForm();
                
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

    // CORRECTION DE LA MÉTHODE toggleEditMode
    toggleEditMode() {
        this.editMode = !this.editMode;
        
        const btnEditMode = document.getElementById('btnEditMode');
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        
        if (btnEditMode) {
            if (this.editMode) {
                btnEditMode.textContent = '💾 Quitter Édition';
                btnEditMode.className = 'btn btn-success';
            } else {
                btnEditMode.textContent = '✏️ Mode Édition';
                btnEditMode.className = 'btn btn-warning';
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

    // MÉTHODES DE SUPPRESSION ET MODIFICATION CORRIGÉES
    async deleteOperation(operationId) {
        console.log('🗑️ Suppression opération:', operationId);
        
        if (!this.currentUser) {
            this.showMessage('❌ Vous devez être connecté', 'error');
            return;
        }
        
        // Trouver l'opération
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) {
            this.showMessage('❌ Opération non trouvée', 'error');
            return;
        }
        
        // Vérifier les permissions
        const canDelete = window.firebaseAuthFunctions.canModifyOperation(operation, this.currentUser);
        if (!canDelete) {
            this.showMessage('❌ Vous n\'avez pas la permission de supprimer cette opération', 'error');
            return;
        }
        
        // Confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            return;
        }
        
        try {
            await window.firebaseSync.deleteDocument('operations', operationId);
            this.showMessage('✅ Opération supprimée avec succès', 'success');
            this.loadInitialData();
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            this.showMessage('❌ Erreur lors de la suppression', 'error');
        }
    }

    async editOperation(operationId) {
        console.log('✏️ Modification opération:', operationId);
        
        if (!this.currentUser) {
            this.showMessage('❌ Vous devez être connecté', 'error');
            return;
        }
        
        // Trouver l'opération
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) {
            this.showMessage('❌ Opération non trouvée', 'error');
            return;
        }
        
        // Vérifier les permissions
        const canEdit = window.firebaseAuthFunctions.canModifyOperation(operation, this.currentUser);
        if (!canEdit) {
            this.showMessage('❌ Vous n\'avez pas la permission de modifier cette opération', 'error');
            return;
        }
        
        // Afficher le formulaire de modification
        this.showEditForm(operation);
    }

    showEditForm(operation) {
        // Créer une modale de modification
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">✏️ Modifier l'opération</h3>
                <form id="editForm">
                    <input type="hidden" id="editId" value="${operation.id}">
                    
                    <div style="margin-bottom: 10px;">
                        <label>Opérateur:</label>
                        <input type="text" id="editOperateur" value="${operation.operateur || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" readonly>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Type d'opération:</label>
                        <select id="editTypeOperation" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="travailleur_global" ${operation.typeOperation === 'travailleur_global' ? 'selected' : ''}>Travailleur Global</option>
                            <option value="zaitoun" ${operation.typeOperation === 'zaitoun' ? 'selected' : ''}>Zaitoun</option>
                            <option value="3commain" ${operation.typeOperation === '3commain' ? 'selected' : ''}>3 Commain</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Groupe:</label>
                        <select id="editGroupe" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="les_deux_groupes" ${operation.groupe === 'les_deux_groupes' ? 'selected' : ''}>Les Deux Groupes</option>
                            <option value="zaitoun" ${operation.groupe === 'zaitoun' ? 'selected' : ''}>Zaitoun</option>
                            <option value="3commain" ${operation.groupe === '3commain' ? 'selected' : ''}>3 Commain</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Type de transaction:</label>
                        <select id="editTypeTransaction" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="revenu" ${operation.typeTransaction === 'revenu' ? 'selected' : ''}>Revenu</option>
                            <option value="frais" ${operation.typeTransaction === 'frais' ? 'selected' : ''}>Frais</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Caisse:</label>
                        <select id="editCaisse" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="abdel_caisse" ${operation.caisse === 'abdel_caisse' ? 'selected' : ''}>Caisse Abdel</option>
                            <option value="omar_caisse" ${operation.caisse === 'omar_caisse' ? 'selected' : ''}>Caisse Omar</option>
                            <option value="hicham_caisse" ${operation.caisse === 'hicham_caisse' ? 'selected' : ''}>Caisse Hicham</option>
                            <option value="zaitoun_caisse" ${operation.caisse === 'zaitoun_caisse' ? 'selected' : ''}>Caisse Zaitoun</option>
                            <option value="3commain_caisse" ${operation.caisse === '3commain_caisse' ? 'selected' : ''}>Caisse 3 Commain</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Montant (DH):</label>
                        <input type="number" id="editMontant" value="${Math.abs(operation.montant)}" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Description:</label>
                        <textarea id="editDescription" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 80px;" required>${operation.description || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            💾 Enregistrer
                        </button>
                        <button type="button" onclick="gestionFermeApp.closeEditModal()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ❌ Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer la soumission du formulaire
        const editForm = document.getElementById('editForm');
        editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        
        this.currentEditModal = modal;
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        
        const operationId = document.getElementById('editId').value;
        const typeOperation = document.getElementById('editTypeOperation').value;
        const groupe = document.getElementById('editGroupe').value;
        const typeTransaction = document.getElementById('editTypeTransaction').value;
        const caisse = document.getElementById('editCaisse').value;
        const montant = parseFloat(document.getElementById('editMontant').value);
        const description = document.getElementById('editDescription').value.trim();
        
        if (!montant || montant <= 0) {
            this.showMessage('❌ Le montant doit être supérieur à 0', 'error');
            return;
        }
        
        if (!description) {
            this.showMessage('❌ Veuillez saisir une description', 'error');
            return;
        }
        
        try {
            const updatedOperation = {
                typeOperation: typeOperation,
                groupe: groupe,
                typeTransaction: typeTransaction,
                caisse: caisse,
                montant: typeTransaction === 'revenu' ? Math.abs(montant) : -Math.abs(montant),
                description: description,
                timestamp: new Date().toISOString(),
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email
            };
            
            await window.firebaseSync.updateDocument('operations', operationId, updatedOperation);
            this.showMessage('✅ Opération modifiée avec succès', 'success');
            this.closeEditModal();
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Erreur modification:', error);
            this.showMessage('❌ Erreur lors de la modification', 'error');
        }
    }

    closeEditModal() {
        if (this.currentEditModal) {
            this.currentEditModal.remove();
            this.currentEditModal = null;
        }
    }

    async deleteSelectedOperations() {
        console.log('🗑️ Suppression des opérations sélectionnées:', this.selectedOperations.size);
        
        if (this.selectedOperations.size === 0) {
            this.showMessage('❌ Aucune opération sélectionnée', 'error');
            return;
        }
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`)) {
            return;
        }
        
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const operationId of this.selectedOperations) {
                try {
                    const operation = this.operations.find(op => op.id === operationId);
                    if (operation && window.firebaseAuthFunctions.canModifyOperation(operation, this.currentUser)) {
                        await window.firebaseSync.deleteDocument('operations', operationId);
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`❌ Erreur suppression ${operationId}:`, error);
                    errorCount++;
                }
            }
            
            this.showMessage(`✅ ${successCount} opération(s) supprimée(s), ${errorCount} erreur(s)`, 'success');
            this.selectedOperations.clear();
            this.cancelEditMode();
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Erreur suppression multiple:', error);
            this.showMessage('❌ Erreur lors de la suppression multiple', 'error');
        }
    }

    // CORRECTION DES MÉTHODES DE RÉINITIALISATION
    async resetLocalData() {
        if (!confirm('Êtes-vous sûr de vouloir vider les données locales ? Les données Firebase resteront intactes.')) {
            return;
        }

        console.log('🗑️ Réinitialisation des données locales...');
        
        try {
            // Vider le localStorage
            localStorage.removeItem('gestion_ferme_data');
            
            // Réinitialiser les données locales
            this.operations = [];
            this.transferts = [];
            this.selectedOperations.clear();
            
            // Mettre à jour l'affichage
            this.updateAffichage();
            this.updateStats();
            
            this.showMessage('✅ Données locales réinitialisées avec succès', 'success');
            
        } catch (error) {
            console.error('❌ Erreur réinitialisation locale:', error);
            this.showMessage('❌ Erreur lors de la réinitialisation locale', 'error');
        }
    }

    async resetFirebaseData() {
        if (!confirm('🚨 ATTENTION ! Cette action va supprimer TOUTES les données Firebase définitivement.\n\nCette action ne peut pas être annulée. Continuer ?')) {
            return;
        }

        if (!confirm('Êtes-vous ABSOLUMENT SÛR ? Toutes les opérations seront perdues sur tous les appareils !')) {
            return;
        }

        console.log('🗑️ Début de la réinitialisation Firebase...');
        this.showMessage('Réinitialisation en cours...', 'info');

        try {
            // Supprimer toutes les opérations de Firebase
            if (window.firebaseSync) {
                const operations = await window.firebaseSync.getCollection('operations');
                for (const op of operations) {
                    await window.firebaseSync.deleteDocument('operations', op.id);
                }
                
                const transferts = await window.firebaseSync.getCollection('transferts');
                for (const tr of transferts) {
                    await window.firebaseSync.deleteDocument('transferts', tr.id);
                }
            }

            // Vider le localStorage
            localStorage.removeItem('gestion_ferme_data');

            // Réinitialiser les données locales
            this.operations = [];
            this.transferts = [];
            this.selectedOperations.clear();

            // Mettre à jour l'affichage
            this.updateAffichage();
            this.updateStats();

            console.log('✅ Réinitialisation complète terminée');
            this.showMessage('✅ Données Firebase réinitialisées avec succès !', 'success');

        } catch (error) {
            console.error('❌ Erreur réinitialisation Firebase:', error);
            this.showMessage('❌ Erreur lors de la réinitialisation Firebase', 'error');
        }
    }

    cancelEditMode() {
        this.editMode = false;
        this.selectedOperations.clear();
        this.toggleEditMode();
        this.showMessage('❌ Mode édition annulé', 'info');
    }

    showMessage(message, type = 'info') {
        // Créer un élément de message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        // Couleurs selon le type
        if (type === 'success') {
            messageDiv.style.background = '#27ae60';
        } else if (type === 'error') {
            messageDiv.style.background = '#e74c3c';
        } else if (type === 'warning') {
            messageDiv.style.background = '#f39c12';
        } else {
            messageDiv.style.background = '#3498db';
        }
        
        document.body.appendChild(messageDiv);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    resetForm() {
        const saisieForm = document.getElementById('saisieForm');
        const repartitionInfo = document.getElementById('repartitionInfo');
        
        if (saisieForm) {
            // Sauvegarder la valeur de l'opérateur actuel
            const selectOperateur = document.getElementById('operateur');
            const operateurActuel = selectOperateur ? selectOperateur.value : '';
            
            // Réinitialiser le formulaire
            saisieForm.reset();
            
            // Remettre l'opérateur automatiquement
            if (this.currentUser) {
                const operateur = window.firebaseAuthFunctions.getOperateurFromEmail(this.currentUser.email);
                if (operateur && selectOperateur) {
                    selectOperateur.value = operateur;
                    selectOperateur.disabled = true;
                }
            } else {
                // Si pas d'utilisateur connecté, remettre l'ancienne valeur
                if (selectOperateur && operateurActuel) {
                    selectOperateur.value = operateurActuel;
                }
            }
        }
        
        if (repartitionInfo) {
            repartitionInfo.style.display = 'none';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // ... (le reste des méthodes reste identique, y compris exportExcelComplet, showManual, etc.)
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



