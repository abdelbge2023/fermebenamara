// app.js - Application principale Gestion Ferme Ben Amara - VERSION COMPLÈTE AVEC TRADUCTION
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
        this.currentLanguage = 'fr'; // 'fr' ou 'ar'
        
        // S'assurer que l'écran de connexion est visible au démarrage
        this.forceLoginScreenDisplay();
        
        this.initEventListeners();
        this.setupAuthHandlers();
        this.initLanguage();
    }

    // Initialiser la langue
    initLanguage() {
        const savedLang = localStorage.getItem('gestion_ferme_lang');
        if (savedLang) {
            this.currentLanguage = savedLang;
        }
        this.updateLanguage();
    }

    // Mettre à jour toute l'interface selon la langue
    updateLanguage() {
        const translations = this.getTranslations();
        
        // Mettre à jour tous les éléments avec data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                if (element.tagName === 'INPUT' && element.type !== 'submit' && element.type !== 'button') {
                    element.placeholder = translations[key];
                } else if (element.tagName === 'BUTTON' || element.type === 'submit') {
                    element.textContent = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });

        // Mettre à jour le bouton de langue
        const btnLang = document.getElementById('btnLang');
        if (btnLang) {
            btnLang.textContent = this.currentLanguage === 'fr' ? '🇸🇦 العربية' : '🇫🇷 Français';
            btnLang.title = this.currentLanguage === 'fr' ? 'Passer en arabe' : 'Switch to French';
        }

        // Mettre à jour la direction du texte
        document.body.style.direction = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
        document.body.style.textAlign = this.currentLanguage === 'ar' ? 'right' : 'left';

        // Sauvegarder la préférence
        localStorage.setItem('gestion_ferme_lang', this.currentLanguage);
        
        console.log(`🌐 Langue mise à jour: ${this.currentLanguage}`);
    }

    // Traductions
    getTranslations() {
        return {
            // Titres principaux
            'app_title': this.currentLanguage === 'fr' ? 'Gestion Ferme Ben Amara' : 'إدارة مزرعة بن عمرة',
            'login_title': this.currentLanguage === 'fr' ? 'Connexion' : 'تسجيل الدخول',
            'saisie_title': this.currentLanguage === 'fr' ? 'Nouvelle Opération' : 'عملية جديدة',
            'transfert_title': this.currentLanguage === 'fr' ? 'Transfert entre Caisses' : 'تحويل بين الصناديق',
            'stats_title': this.currentLanguage === 'fr' ? 'Statistiques et Soldes' : 'الإحصائيات والأرصدة',
            'operations_title': this.currentLanguage === 'fr' ? 'Opérations et Transferts' : 'العمليات والتحويلات',

            // Formulaire de connexion
            'login_email': this.currentLanguage === 'fr' ? 'Adresse Email' : 'البريد الإلكتروني',
            'login_password': this.currentLanguage === 'fr' ? 'Mot de Passe' : 'كلمة المرور',
            'login_button': this.currentLanguage === 'fr' ? 'Se Connecter' : 'تسجيل الدخول',
            'logout_button': this.currentLanguage === 'fr' ? 'Déconnexion' : 'تسجيل الخروج',

            // Formulaire opération
            'operateur_label': this.currentLanguage === 'fr' ? 'Opérateur' : 'المشغل',
            'type_operation_label': this.currentLanguage === 'fr' ? 'Type d\'Opération' : 'نوع العملية',
            'groupe_label': this.currentLanguage === 'fr' ? 'Groupe' : 'المجموعة',
            'type_transaction_label': this.currentLanguage === 'fr' ? 'Type de Transaction' : 'نوع المعاملة',
            'caisse_label': this.currentLanguage === 'fr' ? 'Caisse' : 'الصندوق',
            'montant_label': this.currentLanguage === 'fr' ? 'Montant (DH)' : 'المبلغ (درهم)',
            'description_label': this.currentLanguage === 'fr' ? 'Description' : 'الوصف',
            'submit_operation': this.currentLanguage === 'fr' ? 'Enregistrer l\'Opération' : 'تسجيل العملية',
            'reset_form': this.currentLanguage === 'fr' ? 'Réinitialiser' : 'إعادة تعيين',

            // Formulaire transfert
            'caisse_source': this.currentLanguage === 'fr' ? 'Caisse Source' : 'الصندوق المصدر',
            'caisse_destination': this.currentLanguage === 'fr' ? 'Caisse Destination' : 'الصندوق الوجهة',
            'montant_transfert': this.currentLanguage === 'fr' ? 'Montant du Transfert' : 'مبلغ التحويل',
            'description_transfert': this.currentLanguage === 'fr' ? 'Description du Transfert' : 'وصف التحويل',
            'submit_transfert': this.currentLanguage === 'fr' ? 'Effectuer le Transfert' : 'تنفيذ التحويل',

            // Navigation
            'tab_global': this.currentLanguage === 'fr' ? '🌍 Global' : '🌍 الكل',
            'tab_zaitoun': this.currentLanguage === 'fr' ? '🫒 Zaitoun' : '🫒 زيتون',
            'tab_3commain': this.currentLanguage === 'fr' ? '🔧 3 Commain' : '🔧 3 كومان',
            'tab_abdel': this.currentLanguage === 'fr' ? '👨‍💼 Abdel' : '👨‍💼 عبدال',
            'tab_omar': this.currentLanguage === 'fr' ? '👨‍💻 Omar' : '👨‍💻 عمر',
            'tab_hicham': this.currentLanguage === 'fr' ? '👨‍🔧 Hicham' : '👨‍🔧 هشام',
            'tab_transferts': this.currentLanguage === 'fr' ? '🔄 Transferts' : '🔄 التحويلات',
            'tab_les_deux_groupes': this.currentLanguage === 'fr' ? '👥 Les Deux Groupes' : '👥 المجموعتان',

            // Boutons d'action
            'btn_edit_mode': this.currentLanguage === 'fr' ? '✏️ Mode Édition' : '✏️ وضع التعديل',
            'btn_delete_selected': this.currentLanguage === 'fr' ? '🗑️ Supprimer' : '🗑️ حذف',
            'btn_cancel_edit': this.currentLanguage === 'fr' ? '❌ Annuler' : '❌ إلغاء',
            'btn_export_complet': this.currentLanguage === 'fr' ? '📊 Export Complet' : '📊 تصدير كامل',
            'btn_export_vue': this.currentLanguage === 'fr' ? '📈 Export Vue' : '📈 تصدير العرض',
            'btn_export_detail': this.currentLanguage === 'fr' ? '📋 Rapport Complet' : '📋 تقرير مفصل',
            'btn_reset_local': this.currentLanguage === 'fr' ? '🗑️ Reset Local' : '🗑️ مسح المحلي',
            'btn_reset_firebase': this.currentLanguage === 'fr' ? '🔥 Reset Firebase' : '🔥 مسح Firebase',
            'btn_manual': this.currentLanguage === 'fr' ? '📖 Manuel' : '📖 الدليل',

            // En-têtes de tableau
            'header_date': this.currentLanguage === 'fr' ? 'Date' : 'التاريخ',
            'header_operateur': this.currentLanguage === 'fr' ? 'Opérateur' : 'المشغل',
            'header_type': this.currentLanguage === 'fr' ? 'Type' : 'النوع',
            'header_groupe': this.currentLanguage === 'fr' ? 'Groupe' : 'المجموعة',
            'header_transaction': this.currentLanguage === 'fr' ? 'Transaction' : 'المعاملة',
            'header_caisse': this.currentLanguage === 'fr' ? 'Caisse' : 'الصندوق',
            'header_montant': this.currentLanguage === 'fr' ? 'Montant' : 'المبلغ',
            'header_description': this.currentLanguage === 'fr' ? 'Description' : 'الوصف',
            'header_actions': this.currentLanguage === 'fr' ? 'Actions' : 'الإجراءات',

            // Types d'opération
            'type_travailleur_global': this.currentLanguage === 'fr' ? 'Travailleur Global' : 'عامل عام',
            'type_zaitoun': this.currentLanguage === 'fr' ? 'Zaitoun' : 'زيتون',
            'type_3commain': this.currentLanguage === 'fr' ? '3 Commain' : '3 كومان',

            // Groupes
            'groupe_les_deux': this.currentLanguage === 'fr' ? 'Les Deux Groupes' : 'المجموعتان',
            'groupe_zaitoun': this.currentLanguage === 'fr' ? 'Zaitoun' : 'زيتون',
            'groupe_3commain': this.currentLanguage === 'fr' ? '3 Commain' : '3 كومان',

            // Types de transaction
            'transaction_revenu': this.currentLanguage === 'fr' ? 'Revenu' : 'دخل',
            'transaction_frais': this.currentLanguage === 'fr' ? 'Frais' : 'مصاريف',

            // Caisses
            'caisse_abdel': this.currentLanguage === 'fr' ? 'Caisse Abdel' : 'صندوق عبدال',
            'caisse_omar': this.currentLanguage === 'fr' ? 'Caisse Omar' : 'صندوق عمر',
            'caisse_hicham': this.currentLanguage === 'fr' ? 'Caisse Hicham' : 'صندوق هشام',
            'caisse_zaitoun': this.currentLanguage === 'fr' ? 'Caisse Zaitoun' : 'صندوق زيتون',
            'caisse_3commain': this.currentLanguage === 'fr' ? 'Caisse 3 Commain' : 'صندوق 3 كومان',

            // Messages
            'message_no_data': this.currentLanguage === 'fr' ? 'Aucune donnée à afficher' : 'لا توجد بيانات للعرض',
            'message_loading': this.currentLanguage === 'fr' ? 'Chargement...' : 'جاري التحميل...',
            'message_connected': this.currentLanguage === 'fr' ? 'Connecté en tant que' : 'متصل باسم',
            'select_all': this.currentLanguage === 'fr' ? 'Tout sélectionner' : 'تحديد الكل',
            'read_only': this.currentLanguage === 'fr' ? 'Lecture seule' : 'للقراءة فقط',

            // Totaux
            'total_revenus': this.currentLanguage === 'fr' ? 'Revenus' : 'الإيرادات',
            'total_depenses': this.currentLanguage === 'fr' ? 'Dépenses' : 'المصاريف',
            'total_transferts': this.currentLanguage === 'fr' ? 'Transferts' : 'التحويلات',
            'total_solde': this.currentLanguage === 'fr' ? 'Solde Net' : 'الرصيد الصافي'
        };
    }

    // Changer la langue
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'fr' ? 'ar' : 'fr';
        this.updateLanguage();
        this.updateAffichage();
    }

    // Forcer l'affichage de l'écran de connexion
    forceLoginScreenDisplay() {
        const loginScreen = document.getElementById('loginScreen');
        const appContent = document.getElementById('appContent');
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            console.log('✅ Écran de connexion affiché');
        } else {
            console.error('❌ Élément loginScreen non trouvé');
        }
        
        if (appContent) {
            appContent.style.display = 'none';
            console.log('✅ Application masquée');
        } else {
            console.error('❌ Élément appContent non trouvé');
        }
    }

    initEventListeners() {
        console.log('🔧 Initialisation des écouteurs d\'événements...');
        
        // Bouton de changement de langue
        const btnLang = document.getElementById('btnLang');
        if (btnLang) {
            btnLang.addEventListener('click', () => this.toggleLanguage());
            console.log('✅ Écouteur btnLang ajouté');
        }

        // Écouteurs d'authentification
        window.addEventListener('userAuthenticated', (e) => this.handleUserAuthenticated(e.detail.user));
        window.addEventListener('userSignedOut', () => this.handleUserSignedOut());

        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Écouteur loginForm ajouté');
        } else {
            console.error('❌ Formulaire de connexion non trouvé');
        }
        
        // Déconnexion
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.handleLogout());
            console.log('✅ Écouteur btnLogout ajouté');
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

        console.log('✅ Tous les écouteurs d\'événements initialisés');
    }

    setupAuthHandlers() {
        console.log('🔐 Configuration des gestionnaires d\'authentification...');
        
        // Vérifier l'état d'authentification au démarrage
        setTimeout(() => {
            if (window.firebaseAuthFunctions) {
                const currentUser = window.firebaseAuthFunctions.getCurrentUser();
                if (currentUser) {
                    console.log('👤 Utilisateur déjà connecté:', currentUser.email);
                    this.handleUserAuthenticated(currentUser);
                } else {
                    console.log('👤 Aucun utilisateur connecté - Affichage écran connexion');
                    this.forceLoginScreenDisplay();
                }
            }
        }, 1000);
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('🔐 Tentative de connexion...');
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ Veuillez saisir email et mot de passe' 
                    : '❌ يرجى إدخال البريد الإلكتروني وكلمة المرور', 
                'error'
            );
            return;
        }
        
        // Afficher message de chargement
        const authMessage = document.createElement('div');
        authMessage.className = 'auth-message auth-loading';
        authMessage.textContent = this.currentLanguage === 'fr' ? '🔐 Connexion en cours...' : '🔐 جاري التسجيل...';
        authMessage.style.cssText = `
            padding: 10px;
            margin: 10px 0;
            background: #3498db;
            color: white;
            border-radius: 5px;
            text-align: center;
        `;
        
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
                authMessage.textContent = this.currentLanguage === 'fr' ? '✅ Connexion réussie! Redirection...' : '✅ تم التسجيل بنجاح! جاري التوجيه...';
                authMessage.style.background = '#27ae60';
                console.log('✅ Utilisateur connecté:', result.user.email);
                
                // Petit délai pour voir le message de succès
                setTimeout(() => {
                    this.handleUserAuthenticated(result.user);
                }, 1000);
                
            } else {
                authMessage.className = 'auth-message auth-error';
                authMessage.style.background = '#e74c3c';
                console.error('❌ Erreur connexion:', result.error);
                
                if (result.code === 'auth/user-not-found') {
                    authMessage.textContent = this.currentLanguage === 'fr' ? '❌ Utilisateur non trouvé' : '❌ المستخدم غير موجود';
                } else if (result.code === 'auth/wrong-password') {
                    authMessage.textContent = this.currentLanguage === 'fr' ? '❌ Mot de passe incorrect' : '❌ كلمة المرور خاطئة';
                } else if (result.code === 'auth/invalid-email') {
                    authMessage.textContent = this.currentLanguage === 'fr' ? '❌ Email invalide' : '❌ بريد إلكتروني غير صالح';
                } else {
                    authMessage.textContent = this.currentLanguage === 'fr' ? `❌ Erreur: ${result.error}` : `❌ خطأ: ${result.error}`;
                }
            }
        } catch (error) {
            authMessage.className = 'auth-message auth-error';
            authMessage.textContent = this.currentLanguage === 'fr' ? '❌ Erreur de connexion inattendue' : '❌ خطأ غير متوقع في التسجيل';
            authMessage.style.background = '#e74c3c';
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
        
        this.currentUser = user;
        this.userPermissions = window.firebaseAuthFunctions.getViewPermissions(user);
        
        console.log('🔐 Permissions calculées:', this.userPermissions);
        
        // Masquer écran connexion, afficher application
        const loginScreen = document.getElementById('loginScreen');
        const appContent = document.getElementById('appContent');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
        
        console.log('✅ Interface mise à jour - Application affichée');
        
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
        const loginScreen = document.getElementById('loginScreen');
        const appContent = document.getElementById('appContent');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appContent) appContent.style.display = 'none';
        
        console.log('✅ Interface mise à jour - Écran connexion affiché');
        
        // Réinitialiser formulaire connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
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
                console.warn('⚠️ Impossible de définir l\'opérateur');
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
                this.showMessage(
                    this.currentLanguage === 'fr' 
                        ? '⚠️ Synchronisation temporairement indisponible' 
                        : '⚠️ المزامنة غير متاحة مؤقتًا', 
                    'warning'
                );
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ Erreur de chargement des données' 
                    : '❌ خطأ في تحميل البيانات', 
                'error'
            );
        }
    }

    debugData() {
        console.log('🐛 Données de débogage:');
        console.log('- Opérations:', this.operations.length);
        console.log('- Transferts:', this.transferts.length);
        console.log('- Mode édition:', this.editMode);
        console.log('- Permissions:', this.userPermissions);
        
        if (this.operations.length > 0) {
            console.log('- Exemple ID opération:', this.operations[0].id);
        }
        if (this.transferts.length > 0) {
            console.log('- Exemple ID transfert:', this.transferts[0].id);
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
            const noDataMessage = this.currentLanguage === 'fr' ? 'Aucune donnée à afficher' : 'لا توجد بيانات للعرض';
            container.innerHTML = `<div class="empty-message">${noDataMessage}</div>`;
            return;
        }
        
        const translations = this.getTranslations();
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${this.editMode ? `<th><input type="checkbox" id="selectAll" title="${translations['select_all']}"></th>` : ''}
                        <th>${translations['header_date']}</th>
                        <th>${translations['header_operateur']}</th>
                        <th>${translations['header_type']}</th>
                        <th>${translations['header_groupe']}</th>
                        <th>${translations['header_transaction']}</th>
                        <th>${translations['header_caisse']}</th>
                        <th>${translations['header_montant']}</th>
                        <th>${translations['header_description']}</th>
                        ${!this.editMode ? `<th>${translations['header_actions']}</th>` : ''}
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            const isOperation = item.hasOwnProperty('typeOperation');
            const canEdit = this.currentUser && window.firebaseAuthFunctions.canModifyOperation(item, this.currentUser);
            
            const itemId = item.id;
            
            html += `
                <tr class="${!canEdit ? 'operation-readonly' : ''}" data-id="${itemId}">
                    ${this.editMode ? `
                        <td style="text-align: center; vertical-align: middle;">
                            ${canEdit ? 
                                `<input type="checkbox" class="operation-checkbox" value="${itemId}" title="${translations['select_all']}">` : 
                                `<span style="color: #999; font-size: 12px;">🔒</span>`
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
                                <button onclick="gestionFermeApp.editOperation('${itemId}')" class="btn-small btn-warning" title="${this.currentLanguage === 'fr' ? 'Modifier' : 'تعديل'}">✏️</button>
                                <button onclick="gestionFermeApp.deleteOperation('${itemId}')" class="btn-small btn-danger" title="${this.currentLanguage === 'fr' ? 'Supprimer' : 'حذف'}">🗑️</button>
                            ` : `<span style="color: #999; font-size: 11px; font-style: italic;">${translations['read_only']}</span>`}
                        </td>
                    ` : ''}
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        if (this.editMode) {
            this.setupCheckboxListeners();
        }
    }

    afficherTotauxVue(data) {
        const dataDisplay = document.getElementById('dataDisplay');
        if (!dataDisplay || data.length === 0) return;
        
        let totalRevenus = 0;
        let totalDepenses = 0;
        let totalTransferts = 0;
        
        data.forEach(item => {
            if (item.hasOwnProperty('typeOperation')) {
                const montant = parseFloat(item.montant) || 0;
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
        const translations = this.getTranslations();
        
        const htmlTotaux = `
            <div class="vue-header">
                <h3>📊 ${this.currentLanguage === 'fr' ? 'Totaux pour la vue' : 'المجموع للعرض'} "${this.getNomVue(this.currentView)}"</h3>
                <div class="totals-container">
                    <div class="total-item">
                        <span class="total-label">💰 ${translations['total_revenus']}</span>
                        <span class="total-value positive">${totalRevenus.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">💸 ${translations['total_depenses']}</span>
                        <span class="total-value negative">${totalDepenses.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">🔄 ${translations['total_transferts']}</span>
                        <span class="total-value">${totalTransferts.toFixed(2)} DH</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">⚖️ ${translations['total_solde']}</span>
                        <span class="total-value ${soldeNet >= 0 ? 'positive' : 'negative'}">${soldeNet.toFixed(2)} DH</span>
                    </div>
                </div>
            </div>
        `;
        
        dataDisplay.innerHTML = htmlTotaux + dataDisplay.innerHTML;
    }

    getNomVue(vue) {
        const nomsFr = {
            'global': 'Toutes les opérations',
            'zaitoun': 'Zaitoun',
            '3commain': '3 Commain', 
            'abdel': 'Abdel',
            'omar': 'Omar',
            'hicham': 'Hicham',
            'transferts': 'Transferts',
            'les_deux_groupes': 'Les Deux Groupes'
        };
        
        const nomsAr = {
            'global': 'جميع العمليات',
            'zaitoun': 'زيتون',
            '3commain': '3 كومان', 
            'abdel': 'عبدال',
            'omar': 'عمر',
            'hicham': 'هشام',
            'transferts': 'التحويلات',
            'les_deux_groupes': 'المجموعتان'
        };
        
        return this.currentLanguage === 'fr' ? nomsFr[vue] || vue : nomsAr[vue] || vue;
    }

    setupCheckboxListeners() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
        
        document.querySelectorAll('.operation-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const operationId = e.target.value;
                if (e.target.checked) {
                    this.selectedOperations.add(operationId);
                } else {
                    this.selectedOperations.delete(operationId);
                }
                this.updateSelectedCount();
                
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
        
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected && this.editMode) {
            const translations = this.getTranslations();
            btnDeleteSelected.textContent = `🗑️ ${translations['btn_delete_selected']} (${this.selectedOperations.size})`;
        }
    }

    updateStats() {
        console.log('📊 Calcul des soldes des caisses...');
        
        const soldes = {
            'abdel_caisse': 0,
            'omar_caisse': 0, 
            'hicham_caisse': 0,
            'zaitoun_caisse': 0,
            '3commain_caisse': 0
        };

        this.operations.forEach(operation => {
            const montant = parseFloat(operation.montant) || 0;
            const caisse = operation.caisse;
            
            if (caisse && soldes[caisse] !== undefined) {
                soldes[caisse] += montant;
            }
        });

        this.transferts.forEach(transfert => {
            const montant = parseFloat(transfert.montantTransfert) || 0;
            
            if (transfert.caisseSource && soldes[transfert.caisseSource] !== undefined) {
                soldes[transfert.caisseSource] -= montant;
            }
            
            if (transfert.caisseDestination && soldes[transfert.caisseDestination] !== undefined) {
                soldes[transfert.caisseDestination] += montant;
            }
        });

        this.renderStats(soldes);
    }

    renderStats(soldes) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const nomsCaissesFr = {
            'abdel_caisse': '👨‍💼 Caisse Abdel',
            'omar_caisse': '👨‍💻 Caisse Omar', 
            'hicham_caisse': '👨‍🔧 Caisse Hicham',
            'zaitoun_caisse': '🫒 Caisse Zaitoun',
            '3commain_caisse': '🔧 Caisse 3 Commain'
        };

        const nomsCaissesAr = {
            'abdel_caisse': '👨‍💼 صندوق عبدال',
            'omar_caisse': '👨‍💻 صندوق عمر', 
            'hicham_caisse': '👨‍🔧 صندوق هشام',
            'zaitoun_caisse': '🫒 صندوق زيتون',
            '3commain_caisse': '🔧 صندوق 3 كومان'
        };

        const nomsCaisses = this.currentLanguage === 'fr' ? nomsCaissesFr : nomsCaissesAr;

        let html = '';
        
        Object.keys(soldes).forEach(caisse => {
            const solde = soldes[caisse];
            const classeSolde = solde >= 0 ? 'solde-positif' : 'solde-negatif';
            const icone = solde >= 0 ? '📈' : '📉';
            const trendText = this.currentLanguage === 'fr' 
                ? (solde >= 0 ? 'Positif' : 'Négatif')
                : (solde >= 0 ? 'إيجابي' : 'سلبي');
            
            html += `
                <div class="stat-card ${classeSolde}" onclick="gestionFermeApp.showDetailsCaisse('${caisse}')">
                    <div class="stat-label">${nomsCaisses[caisse] || caisse}</div>
                    <div class="stat-value">${solde.toFixed(2)} DH</div>
                    <div class="stat-trend">${icone} ${trendText}</div>
                </div>
            `;
        });

        statsContainer.innerHTML = html;
    }

    showDetailsCaisse(caisse) {
        console.log('📊 Détails de la caisse:', caisse);
        
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
        
        const translations = this.getTranslations();
        const caisseName = this.getNomCaisse(caisse);
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); ${this.currentLanguage === 'ar' ? 'text-align: right;' : 'text-align: left;'}">
                <h3 style="margin-top: 0; color: #2c3e50;">📊 ${this.currentLanguage === 'fr' ? 'Détails de' : 'تفاصيل'} ${caisseName}</h3>
                <div style="margin: 15px 0;">
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '📝 Opérations:' : '📝 العمليات:'}</strong> ${details.operations}</div>
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '💰 Revenus:' : '💰 الإيرادات:'}</strong> <span style="color: green">${details.revenus.toFixed(2)} DH</span></div>
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '💸 Dépenses:' : '💸 المصاريف:'}</strong> <span style="color: red">${details.depenses.toFixed(2)} DH</span></div>
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '🔄 Transferts sortants:' : '🔄 التحويلات الصادرة:'}</strong> ${details.transfertsSortants.toFixed(2)} DH</div>
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '🔄 Transferts entrants:' : '🔄 التحويلات الواردة:'}</strong> ${details.transfertsEntrants.toFixed(2)} DH</div>
                </div>
                <div style="border-top: 1px solid #ccc; padding-top: 10px;">
                    <div style="margin-bottom: 8px;"><strong>${this.currentLanguage === 'fr' ? '⚖️ Solde calculé:' : '⚖️ الرصيد المحسوب:'}</strong> <span style="color: ${details.solde >= 0 ? 'green' : 'red'}; font-weight: bold">${details.solde.toFixed(2)} DH</span></div>
                    <div><strong>${this.currentLanguage === 'fr' ? '📋 Total mouvements:' : '📋 إجمالي الحركات:'}</strong> ${details.totalMouvements}</div>
                </div>
                <button onclick="gestionFermeApp.closeCaisseDetailsModal()" style="margin-top: 15px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                    ${this.currentLanguage === 'fr' ? 'Fermer' : 'إغلاق'}
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
        const nomsFr = {
            'abdel_caisse': 'Caisse Abdel',
            'omar_caisse': 'Caisse Omar',
            'hicham_caisse': 'Caisse Hicham',
            'zaitoun_caisse': 'Caisse Zaitoun',
            '3commain_caisse': 'Caisse 3 Commain'
        };
        
        const nomsAr = {
            'abdel_caisse': 'صندوق عبدال',
            'omar_caisse': 'صندوق عمر',
            'hicham_caisse': 'صندوق هشام',
            'zaitoun_caisse': 'صندوق زيتون',
            '3commain_caisse': 'صندوق 3 كومان'
        };
        
        return this.currentLanguage === 'fr' ? nomsFr[caisse] || caisse : nomsAr[caisse] || caisse;
    }

    updateRepartition() {
        const typeOperation = document.getElementById('typeOperation').value;
        const groupe = document.getElementById('groupe').value;
        const montant = parseFloat(document.getElementById('montant').value) || 0;
        
        const repartitionInfo = document.getElementById('repartitionInfo');
        const repartitionDetails = document.getElementById('repartitionDetails');
        
        if (typeOperation === 'travailleur_global' && groupe === 'les_deux_groupes' && montant > 0) {
            let zaitounPart = 0;
            let commainPart = 0;
            
            zaitounPart = parseFloat((montant * (1/3)).toFixed(2));
            commainPart = parseFloat((montant * (2/3)).toFixed(2));
            
            const infoText = this.currentLanguage === 'fr' 
                ? '<strong>ℹ️ Information :</strong> Le montant total sera payé par la caisse sélectionnée et réparti entre les deux groupes'
                : '<strong>ℹ️ معلومة :</strong> سيتم دفع المبلغ الإجمالي من الصندوق المحدد وتوزيعه بين المجموعتين';
            
            repartitionDetails.innerHTML = `
                <div class="repartition-details">
                    <div class="repartition-item zaitoun">
                        <strong>🫒 ${this.currentLanguage === 'fr' ? 'Zaitoun' : 'زيتون'}</strong><br>
                        ${this.currentLanguage === 'fr' ? 'Part: 1/3' : 'الحصة: 1/3'}<br>
                        ${zaitounPart.toFixed(2)} DH<br>
                        <small>33.3%</small>
                    </div>
                    <div class="repartition-item commain">
                        <strong>🔧 ${this.currentLanguage === 'fr' ? '3 Commain' : '3 كومان'}</strong><br>
                        ${this.currentLanguage === 'fr' ? 'Part: 2/3' : 'الحصة: 2/3'}<br>
                        ${commainPart.toFixed(2)} DH<br>
                        <small>66.7%</small>
                    </div>
                    <div class="repartition-total">
                        <strong>💰 ${this.currentLanguage === 'fr' ? 'Total payé' : 'المبلغ الإجمالي'}</strong><br>
                        ${montant.toFixed(2)} DH
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    ${infoText}
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
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Vous devez être connecté' : '❌ يجب أن تكون مسجلاً', 
                'error'
            );
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
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Le montant doit être supérieur à 0' : '❌ يجب أن يكون المبلغ أكبر من 0', 
                'error'
            );
            return;
        }
        
        if (!description) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Veuillez saisir une description' : '❌ يرجى إدخال وصف', 
                'error'
            );
            return;
        }
        
        try {
            if (window.firebaseSync) {
                let operationsACreer = [];

                // CAS SPÉCIAL : TRAVAILLEUR GLOBAL + LES DEUX GROUPES
                if (typeOperation === 'travailleur_global' && groupe === 'les_deux_groupes') {
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
                            description: `${description} (${this.currentLanguage === 'fr' ? 'Part Zaitoun' : 'حصة زيتون'} - 1/3 = ${montantZaitoun} DH)`,
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
                            description: `${description} (${this.currentLanguage === 'fr' ? 'Part 3 Commain' : 'حصة 3 كومان'} - 2/3 = ${montantCommain} DH)`,
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
                    const successMsg = this.currentLanguage === 'fr' 
                        ? `✅ OPÉRATION RÉPARTIE! ${caisse} → Zaitoun: ${(montantTotal/3).toFixed(2)} DH + 3 Commain: ${((montantTotal*2)/3).toFixed(2)} DH`
                        : `✅ تم توزيع العملية! ${this.getNomCaisse(caisse)} → زيتون: ${(montantTotal/3).toFixed(2)} درهم + 3 كومان: ${((montantTotal*2)/3).toFixed(2)} درهم`;
                    this.showMessage(successMsg, 'success');
                } else {
                    const successMsg = this.currentLanguage === 'fr' 
                        ? `✅ OPÉRATION ENREGISTRÉE! ${montantTotal} DH sur ${caisse}`
                        : `✅ تم تسجيل العملية! ${montantTotal} درهم على ${this.getNomCaisse(caisse)}`;
                    this.showMessage(successMsg, 'success');
                }

                // Réinitialisation du formulaire
                this.resetForm();
                
                // Rechargement des données
                this.loadInitialData();
                
            } else {
                this.showMessage(
                    this.currentLanguage === 'fr' ? '❌ Erreur de synchronisation' : '❌ خطأ في المزامنة', 
                    'error'
                );
            }
        } catch (error) {
            console.error('❌ Erreur enregistrement opération:', error);
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ Erreur lors de l\'enregistrement: ' + error.message 
                    : '❌ خطأ أثناء التسجيل: ' + error.message, 
                'error'
            );
        }
    }

    async handleTransfert(e) {
        e.preventDefault();
        console.log('🔄 Transfert en cours...');
        
        if (!this.currentUser) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Vous devez être connecté' : '❌ يجب أن تكون مسجلاً', 
                'error'
            );
            return;
        }
        
        const caisseSource = document.getElementById('caisseSource').value;
        const caisseDestination = document.getElementById('caisseDestination').value;
        
        if (caisseSource === caisseDestination) {
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ La caisse source et destination doivent être différentes' 
                    : '❌ يجب أن يكون الصندوق المصدر والوجهة مختلفين', 
                'error'
            );
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
                this.showMessage(
                    this.currentLanguage === 'fr' ? '✅ Transfert effectué avec succès' : '✅ تم التحويل بنجاح', 
                    'success'
                );
                e.target.reset();
                this.loadInitialData();
            }
        } catch (error) {
            console.error('❌ Erreur enregistrement transfert:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors du transfert' : '❌ خطأ أثناء التحويل', 
                'error'
            );
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
        
        if (btnEditMode) {
            const translations = this.getTranslations();
            if (this.editMode) {
                btnEditMode.textContent = this.currentLanguage === 'fr' ? '💾 Quitter Édition' : '💾 خروج من التعديل';
                btnEditMode.className = 'btn btn-success';
            } else {
                btnEditMode.textContent = translations['btn_edit_mode'];
                btnEditMode.className = 'btn btn-warning';
            }
        }
        
        if (btnDeleteSelected) {
            btnDeleteSelected.style.display = this.editMode ? 'inline-block' : 'none';
            if (this.editMode) {
                this.updateSelectedCount();
            }
        }
        
        if (btnCancelEdit) {
            btnCancelEdit.style.display = this.editMode ? 'inline-block' : 'none';
        }
        
        this.updateAffichage();
        
        if (this.editMode) {
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '✏️ Mode édition activé - Sélectionnez les opérations à modifier' 
                    : '✏️ تم تفعيل وضع التعديل - حدد العمليات للتعديل', 
                'info'
            );
        } else {
            this.showMessage(
                this.currentLanguage === 'fr' ? '✅ Mode édition désactivé' : '✅ تم تعطيل وضع التعديل', 
                'success'
            );
        }
    }

    async deleteOperation(operationId) {
        console.log('🗑️ Suppression opération:', operationId);
        
        if (!this.currentUser) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Vous devez être connecté' : '❌ يجب أن تكون مسجلاً', 
                'error'
            );
            return;
        }
        
        // Trouver l'opération
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Opération non trouvée' : '❌ العملية غير موجودة', 
                'error'
            );
            return;
        }
        
        // Vérifier les permissions
        const canDelete = window.firebaseAuthFunctions.canModifyOperation(operation, this.currentUser);
        if (!canDelete) {
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ Vous n\'avez pas la permission de supprimer cette opération' 
                    : '❌ ليس لديك إذن لحذف هذه العملية', 
                'error'
            );
            return;
        }
        
        // Confirmation
        const confirmMsg = this.currentLanguage === 'fr' 
            ? 'Êtes-vous sûr de vouloir supprimer cette opération ?'
            : 'هل أنت متأكد من أنك تريد حذف هذه العملية؟';
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            await window.firebaseSync.deleteDocument('operations', operationId);
            this.showMessage(
                this.currentLanguage === 'fr' ? '✅ Opération supprimée avec succès' : '✅ تم حذف العملية بنجاح', 
                'success'
            );
            this.loadInitialData();
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors de la suppression' : '❌ خطأ أثناء الحذف', 
                'error'
            );
        }
    }

    async editOperation(operationId) {
        console.log('✏️ Modification opération:', operationId);
        
        if (!this.currentUser) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Vous devez être connecté' : '❌ يجب أن تكون مسجلاً', 
                'error'
            );
            return;
        }
        
        // Trouver l'opération
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Opération non trouvée' : '❌ العملية غير موجودة', 
                'error'
            );
            return;
        }
        
        // Vérifier les permissions
        const canEdit = window.firebaseAuthFunctions.canModifyOperation(operation, this.currentUser);
        if (!canEdit) {
            this.showMessage(
                this.currentLanguage === 'fr' 
                    ? '❌ Vous n\'avez pas la permission de modifier cette opération' 
                    : '❌ ليس لديك إذن لتعديل هذه العملية', 
                'error'
            );
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
        
        const translations = this.getTranslations();
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; ${this.currentLanguage === 'ar' ? 'text-align: right;' : 'text-align: left;'}">
                <h3 style="margin-top: 0;">✏️ ${this.currentLanguage === 'fr' ? 'Modifier l\'opération' : 'تعديل العملية'}</h3>
                <form id="editForm">
                    <input type="hidden" id="editId" value="${operation.id}">
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['operateur_label']}:</label>
                        <input type="text" id="editOperateur" value="${operation.operateur || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" readonly>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['type_operation_label']}:</label>
                        <select id="editTypeOperation" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="travailleur_global" ${operation.typeOperation === 'travailleur_global' ? 'selected' : ''}>${translations['type_travailleur_global']}</option>
                            <option value="zaitoun" ${operation.typeOperation === 'zaitoun' ? 'selected' : ''}>${translations['type_zaitoun']}</option>
                            <option value="3commain" ${operation.typeOperation === '3commain' ? 'selected' : ''}>${translations['type_3commain']}</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['groupe_label']}:</label>
                        <select id="editGroupe" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="les_deux_groupes" ${operation.groupe === 'les_deux_groupes' ? 'selected' : ''}>${translations['groupe_les_deux']}</option>
                            <option value="zaitoun" ${operation.groupe === 'zaitoun' ? 'selected' : ''}>${translations['groupe_zaitoun']}</option>
                            <option value="3commain" ${operation.groupe === '3commain' ? 'selected' : ''}>${translations['groupe_3commain']}</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['type_transaction_label']}:</label>
                        <select id="editTypeTransaction" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="revenu" ${operation.typeTransaction === 'revenu' ? 'selected' : ''}>${translations['transaction_revenu']}</option>
                            <option value="frais" ${operation.typeTransaction === 'frais' ? 'selected' : ''}>${translations['transaction_frais']}</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['caisse_label']}:</label>
                        <select id="editCaisse" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="abdel_caisse" ${operation.caisse === 'abdel_caisse' ? 'selected' : ''}>${translations['caisse_abdel']}</option>
                            <option value="omar_caisse" ${operation.caisse === 'omar_caisse' ? 'selected' : ''}>${translations['caisse_omar']}</option>
                            <option value="hicham_caisse" ${operation.caisse === 'hicham_caisse' ? 'selected' : ''}>${translations['caisse_hicham']}</option>
                            <option value="zaitoun_caisse" ${operation.caisse === 'zaitoun_caisse' ? 'selected' : ''}>${translations['caisse_zaitoun']}</option>
                            <option value="3commain_caisse" ${operation.caisse === '3commain_caisse' ? 'selected' : ''}>${translations['caisse_3commain']}</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label>${translations['montant_label']}:</label>
                        <input type="number" id="editMontant" value="${Math.abs(operation.montant)}" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>${translations['description_label']}:</label>
                        <textarea id="editDescription" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 80px;" required>${operation.description || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            💾 ${this.currentLanguage === 'fr' ? 'Enregistrer' : 'حفظ'}
                        </button>
                        <button type="button" onclick="gestionFermeApp.closeEditModal()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ❌ ${this.currentLanguage === 'fr' ? 'Annuler' : 'إلغاء'}
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
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Le montant doit être supérieur à 0' : '❌ يجب أن يكون المبلغ أكبر من 0', 
                'error'
            );
            return;
        }
        
        if (!description) {
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Veuillez saisir une description' : '❌ يرجى إدخال وصف', 
                'error'
            );
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
            this.showMessage(
                this.currentLanguage === 'fr' ? '✅ Opération modifiée avec succès' : '✅ تم تعديل العملية بنجاح', 
                'success'
            );
            this.closeEditModal();
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Erreur modification:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors de la modification' : '❌ خطأ أثناء التعديل', 
                'error'
            );
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
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Aucune opération sélectionnée' : '❌ لم يتم اختيار أي عمليات', 
                'error'
            );
            return;
        }
        
        const confirmMsg = this.currentLanguage === 'fr' 
            ? `Êtes-vous sûr de vouloir supprimer ${this.selectedOperations.size} opération(s) ?`
            : `هل أنت متأكد من أنك تريد حذف ${this.selectedOperations.size} عملية؟`;
        
        if (!confirm(confirmMsg)) {
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
            
            const successMsg = this.currentLanguage === 'fr' 
                ? `✅ ${successCount} opération(s) supprimée(s), ${errorCount} erreur(s)`
                : `✅ تم حذف ${successCount} عملية، ${errorCount} خطأ`;
            
            this.showMessage(successMsg, 'success');
            this.selectedOperations.clear();
            this.cancelEditMode();
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Erreur suppression multiple:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors de la suppression multiple' : '❌ خطأ أثناء الحذف المتعدد', 
                'error'
            );
        }
    }

    async resetLocalData() {
        const confirmMsg = this.currentLanguage === 'fr' 
            ? 'Êtes-vous sûr de vouloir vider les données locales ? Les données Firebase resteront intactes.'
            : 'هل أنت متأكد من أنك تريد مسح البيانات المحلية؟ بيانات Firebase ستبقى سليمة.';
        
        if (!confirm(confirmMsg)) {
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
            
            this.showMessage(
                this.currentLanguage === 'fr' ? '✅ Données locales réinitialisées avec succès' : '✅ تمت إعادة تعيين البيانات المحلية بنجاح', 
                'success'
            );
            
        } catch (error) {
            console.error('❌ Erreur réinitialisation locale:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors de la réinitialisation locale' : '❌ خطأ أثناء إعادة تعيين البيانات المحلية', 
                'error'
            );
        }
    }

    async resetFirebaseData() {
        const confirmMsg1 = this.currentLanguage === 'fr' 
            ? '🚨 ATTENTION ! Cette action va supprimer TOUTES les données Firebase définitivement.\n\nCette action ne peut pas être annulée. Continuer ?'
            : '🚨 انتبه! هذا الإجراء سيمسح جميع بيانات Firebase نهائياً.\n\nلا يمكن التراجع عن هذا الإجراء. متابعة؟';
        
        const confirmMsg2 = this.currentLanguage === 'fr' 
            ? 'Êtes-vous ABSOLUMENT SÛR ? Toutes les opérations seront perdues sur tous les appareils !'
            : 'هل أنت متأكد تماماً؟ جميع العمليات ستفقد على جميع الأجهزة!';
        
        if (!confirm(confirmMsg1)) {
            return;
        }

        if (!confirm(confirmMsg2)) {
            return;
        }

        console.log('🗑️ Début de la réinitialisation Firebase...');
        this.showMessage(
            this.currentLanguage === 'fr' ? 'Réinitialisation en cours...' : 'جاري إعادة التعيين...', 
            'info'
        );

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
            this.showMessage(
                this.currentLanguage === 'fr' ? '✅ Données Firebase réinitialisées avec succès !' : '✅ تمت إعادة تعيين بيانات Firebase بنجاح!', 
                'success'
            );

        } catch (error) {
            console.error('❌ Erreur réinitialisation Firebase:', error);
            this.showMessage(
                this.currentLanguage === 'fr' ? '❌ Erreur lors de la réinitialisation Firebase' : '❌ خطأ أثناء إعادة تعيين Firebase', 
                'error'
            );
        }
    }

    cancelEditMode() {
        this.editMode = false;
        this.selectedOperations.clear();
        this.toggleEditMode();
        this.showMessage(
            this.currentLanguage === 'fr' ? '❌ Mode édition annulé' : '❌ تم إلغاء وضع التعديل', 
            'info'
        );
    }

    showMessage(message, type = 'info') {
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
            ${this.currentLanguage === 'ar' ? 'text-align: right;' : 'text-align: left;'}
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

    exportExcelComplet() {
        console.log('📊 Export Excel complet...');
        this.showMessage(
            this.currentLanguage === 'fr' ? '🔄 Export Excel en cours de développement...' : '🔄 جاري تطوير تصدير Excel...', 
            'info'
        );
    }

    exportVueActuelle() {
        console.log('📊 Export vue actuelle...');
        this.showMessage(
            this.currentLanguage === 'fr' ? '🔄 Export vue actuelle en cours de développement...' : '🔄 جاري تطوير تصدير العرض الحالي...', 
            'info'
        );
    }

    exportRapportComplet() {
        console.log('📊 Export rapport complet...');
        this.showMessage(
            this.currentLanguage === 'fr' ? '🔄 Export rapport complet en cours de développement...' : '🔄 جاري تطوير تصدير التقرير الكامل...', 
            'info'
        );
    }

    showManual() {
        console.log('📖 Affichage manuel...');
        this.showMessage(
            this.currentLanguage === 'fr' ? '📖 Manuel utilisateur en cours de développement...' : '📖 جاري تطوير دليل المستخدم...', 
            'info'
        );
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
