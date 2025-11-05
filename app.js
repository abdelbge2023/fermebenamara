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

// MÉTHODE showManual COMPLÈTEMENT CORRIGÉE
showManual() {
    console.log('📖 Affichage du manuel complet');
    
    // Supprimer toute modale existante
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const manualModal = document.createElement('div');
    manualModal.className = 'manual-modal';
    manualModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        z-index: 10000;
        overflow-y: auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    `;
    
    manualModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 1200px; width: 95%; max-height: 95vh; overflow-y: auto; box-shadow: 0 10px 50px rgba(0,0,0,0.5); position: relative;">
            <!-- BOUTON FERMETURE -->
            <button onclick="this.closest('.manual-modal').remove()" style="position: absolute; top: 15px; right: 15px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10001;">×</button>
            
            <!-- EN-TÊTE -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3498db;">
                <h1 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 28px;">📚 MANUEL COMPLET</h1>
                <h2 style="margin: 0; color: #3498db; font-size: 22px;">Gestion Ferme Ben Amara</h2>
                <p style="color: #7f8c8d; margin: 10px 0 0 0;">Guide d'utilisation et système de calcul</p>
            </div>

            <!-- MENU DE NAVIGATION -->
            <div style="display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center;">
                <button class="nav-btn" data-section="utilisation" style="padding: 12px 20px; background: #3498db; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s;">🚀 Utilisation du Site</button>
                <button class="nav-btn" data-section="calculs" style="padding: 12px 20px; background: #27ae60; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s;">🧮 Calculs des Caisses</button>
                <button class="nav-btn" data-section="fonctions" style="padding: 12px 20px; background: #9b59b6; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s;">⚙️ Fonctions Avancées</button>
            </div>

            <!-- INDICATEUR DE SECTION ACTIVE -->
            <div id="section-indicator" style="text-align: center; margin-bottom: 20px; font-weight: bold; color: #3498db; font-size: 18px;">
                🚀 Utilisation du Site
            </div>

            <!-- PARTIE 1 : UTILISATION DU SITE -->
            <div id="section-utilisation" class="manual-section" style="display: block;">
                <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                    <h3 style="margin: 0; font-size: 24px;">🚀 GUIDE D'UTILISATION DU SITE</h3>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Apprenez à utiliser toutes les fonctionnalités principales</p>
                </div>

                <!-- CONNEXION -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #2980b9; padding-left: 10px;">🔐 CONNEXION AU SYSTÈME</h4>
                    <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border: 2px solid #3498db;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">📝 Étapes de connexion :</h5>
                                <ol style="margin: 0; padding-left: 20px;">
                                    <li><strong>Renseignez votre email</strong> professionnel</li>
                                    <li><strong>Entrez votre mot de passe</strong></li>
                                    <li><strong>Cliquez sur "Se connecter"</strong></li>
                                    <li><strong>Attendez la redirection</strong> automatique</li>
                                </ol>
                            </div>
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">✅ Ce qui se passe :</h5>
                                <ul style="margin: 0; padding-left: 20px;">
                                    <li>Vérification des identifiants</li>
                                    <li>Configuration automatique du profil</li>
                                    <li>Chargement des données en temps réel</li>
                                    <li>Affichage du tableau de bord</li>
                                </ul>
                            </div>
                        </div>
                        <div style="background: #d6eaf8; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                            <strong>💡 Astuce importante :</strong> Votre opérateur (Abdel, Omar, Hicham) est automatiquement détecté selon votre email. Vous n'avez pas à le sélectionner manuellement !
                        </div>
                    </div>
                </div>

                <!-- SAISIE OPÉRATION -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #2980b9; padding-left: 10px;">➕ SAISIE D'UNE NOUVELLE OPÉRATION</h4>
                    <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border: 2px solid #3498db;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">📋 Champs obligatoires :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>👤 Opérateur :</strong> Automatique selon connexion</p>
                                    <p><strong>📋 Type d'opération :</strong> Travailleur Global, Zaitoun, 3 Commain</p>
                                    <p><strong>🏷️ Groupe :</strong> Zaitoun, 3 Commain, Les Deux Groupes</p>
                                    <p><strong>💰 Transaction :</strong> Revenu ou Frais</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">🎯 Suite des champs :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🏦 Caisse :</strong> Caisse impactée par l'opération</p>
                                    <p><strong>💵 Montant :</strong> Montant en DH (obligatoire)</p>
                                    <p><strong>📝 Description :</strong> Explication de l'opération</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #d6eaf8; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <strong>⚠️ Cas spécial - Répartition automatique :</strong> Quand vous sélectionnez "Travailleur Global" + "Les Deux Groupes", le système calcule et crée AUTOMATIQUEMENT 2 opérations avec répartition 1/3 pour Zaitoun et 2/3 pour 3 Commain.
                        </div>
                    </div>
                </div>

                <!-- TRANSFERTS -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #2980b9; padding-left: 10px;">🔄 EFFECTUER UN TRANSFERT</h4>
                    <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border: 2px solid #3498db;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">📝 Procédure complète :</h5>
                                <ol style="margin: 0; padding-left: 20px;">
                                    <li><strong>Allez dans l'onglet "Transfert"</strong></li>
                                    <li><strong>Sélectionnez la caisse source</strong> (qui envoie l'argent)</li>
                                    <li><strong>Sélectionnez la caisse destination</strong> (qui reçoit l'argent)</li>
                                    <li><strong>Entrez le montant</strong> du transfert</li>
                                    <li><strong>Ajoutez une description</strong> explicative</li>
                                    <li><strong>Cliquez sur "Effectuer le transfert"</strong></li>
                                </ol>
                            </div>
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">🔒 Sécurité intégrée :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>✅ Vérification des fonds :</strong> Le système vérifie que la caisse source a suffisamment d'argent</p>
                                    <p><strong>✅ Validation :</strong> Impossible de transférer vers la même caisse</p>
                                    <p><strong>✅ Traçabilité :</strong> Tous les transferts sont enregistrés et traçables</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- NAVIGATION -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #2980b9; padding-left: 10px;">📊 NAVIGATION ENTRE LES VUES</h4>
                    <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border: 2px solid #3498db;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">🌍 Vues disponibles :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🌍 Toutes les opérations :</strong> Vue complète de tout</p>
                                    <p><strong>🫒 Zaitoun :</strong> Opérations du groupe Zaitoun</p>
                                    <p><strong>🔧 3 Commain :</strong> Opérations du groupe 3 Commain</p>
                                    <p><strong>👨‍💼 Abdel :</strong> Opérations d'Abdel</p>
                                    <p><strong>👨‍💻 Omar :</strong> Opérations d'Omar</p>
                                    <p><strong>👨‍🔧 Hicham :</strong> Opérations d'Hicham</p>
                                    <p><strong>🔄 Transferts :</strong> Tous les transferts entre caisses</p>
                                    <p><strong>👥 Les Deux Groupes :</strong> Opérations pour les deux groupes</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">📈 Fonctionnalités des vues :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>💰 Totaux spécifiques :</strong> Chaque vue montre ses propres totaux</p>
                                    <p><strong>📊 Statistiques :</strong> Revenus, dépenses, solde net</p>
                                    <p><strong>🔍 Filtrage automatique :</strong> Données filtrées selon la vue</p>
                                    <p><strong>📱 Interface adaptative :</strong> Affichage optimisé pour chaque vue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GESTION OPÉRATIONS -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2980b9; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #2980b9; padding-left: 10px;">✏️ GESTION DES OPÉRATIONS</h4>
                    <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border: 2px solid #3498db;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">🛠️ Édition simple :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>1. Repérez l'opération</strong> à modifier dans le tableau</p>
                                    <p><strong>2. Cliquez sur le bouton</strong> <span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px;">✏️</span></p>
                                    <p><strong>3. Modifiez les champs</strong> dans la fenêtre qui s'ouvre</p>
                                    <p><strong>4. Cliquez sur "Enregistrer"</strong> pour valider</p>
                                    <p><strong>5. Les données sont mises à jour</strong> automatiquement</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #2980b9; margin-top: 0;">⚡ Mode édition avancé :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>1. Activez le</strong> <span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px;">✏️ Mode Édition</span></p>
                                    <p><strong>2. Cochez les cases</strong> des opérations à modifier</p>
                                    <p><strong>3. Utilisez "Tout sélectionner"</strong> pour sélectionner toutes</p>
                                    <p><strong>4. Cliquez sur</strong> <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px;">🗑️ Supprimer (X)</span></p>
                                    <p><strong>5. Confirmez la suppression</strong> groupée</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PARTIE 2 : CALCULS DES CAISSES -->
            <div id="section-calculs" class="manual-section" style="display: none;">
                <div style="background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                    <h3 style="margin: 0; font-size: 24px;">🧮 SYSTÈME DE CALCUL DES CAISSES</h3>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Comprenez comment les soldes sont calculés automatiquement</p>
                </div>

                <!-- ARCHITECTURE CAISSES -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #229954; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #229954; padding-left: 10px;">🏦 ARCHITECTURE DES CAISSES</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; border: 2px solid #27ae60;">
                            <h5 style="color: #229954; margin-top: 0; text-align: center;">👨‍💼 CAISSES PERSONNELLES</h5>
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                                <p><strong>👨‍💼 Caisse Abdel</strong><br><small>Code : abdel_caisse</small></p>
                                <p><strong>👨‍💻 Caisse Omar</strong><br><small>Code : omar_caisse</small></p>
                                <p><strong>👨‍🔧 Caisse Hicham</strong><br><small>Code : hicham_caisse</small></p>
                            </div>
                        </div>
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; border: 2px solid #27ae60;">
                            <h5 style="color: #229954; margin-top: 0; text-align: center;">🏢 CAISSES DE GROUPES</h5>
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                                <p><strong>🫒 Caisse Zaitoun</strong><br><small>Code : zaitoun_caisse</small></p>
                                <p><strong>🔧 Caisse 3 Commain</strong><br><small>Code : 3commain_caisse</small></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FORMULE CALCUL -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #229954; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #229954; padding-left: 10px;">🧮 FORMULE DE CALCUL PRINCIPALE</h4>
                    <div style="background: #d4efdf; padding: 30px; border-radius: 10px; text-align: center; border: 2px solid #27ae60;">
                        <p style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold; color: #196f3d; margin: 0;">
                            SOLDE = Σ(REVENUS) - Σ(FRAIS) - Σ(TRANSFERTS SORTANTS) + Σ(TRANSFERTS ENTRANTS)
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-top: 20px;">
                            <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px;">
                                <strong>Σ(REVENUS)</strong><br>Somme revenus
                            </div>
                            <div style="background: #e74c3c; color: white; padding: 10px; border-radius: 5px;">
                                <strong>Σ(FRAIS)</strong><br>Somme frais
                            </div>
                            <div style="background: #e67e22; color: white; padding: 10px; border-radius: 5px;">
                                <strong>Σ(TRANSFERTS SORTANTS)</strong><br>Argent envoyé
                            </div>
                            <div style="background: #3498db; color: white; padding: 10px; border-radius: 5px;">
                                <strong>Σ(TRANSFERTS ENTRANTS)</strong><br>Argent reçu
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RÉPARTITION -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #229954; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #229954; padding-left: 10px;">🔀 SYSTÈME DE RÉPARTITION AUTOMATIQUE</h4>
                    <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; border: 2px solid #27ae60;">
                        <p><strong>Cas spécial : Travailleur Global + Les Deux Groupes</strong></p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #27ae60;">
                            <h5 style="color: #229954; margin-top: 0;">📊 Exemple : Frais de 900 DH pour les deux groupes</h5>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                                <div style="text-align: center; padding: 15px; background: #d4efdf; border-radius: 8px;">
                                    <div style="font-size: 24px;">🫒</div>
                                    <strong>ZAITOUN (1/3)</strong><br>
                                    900 × 1/3 = <span style="color: #e74c3c; font-weight: bold;">300 DH</span>
                                </div>
                                <div style="text-align: center; padding: 15px; background: #d4efdf; border-radius: 8px;">
                                    <div style="font-size: 24px;">🔧</div>
                                    <strong>3 COMMAIN (2/3)</strong><br>
                                    900 × 2/3 = <span style="color: #e74c3c; font-weight: bold;">600 DH</span>
                                </div>
                            </div>
                            
                            <div style="background: #f9ebea; padding: 15px; border-radius: 5px; margin-top: 15px;">
                                <strong>🎯 Résultat : 2 opérations créées automatiquement</strong>
                                <p style="margin: 10px 0 0 0; font-size: 14px;">
                                    • Caisse Zaitoun : -300 DH (Part Zaitoun - 1/3)<br>
                                    • Caisse 3 Commain : -600 DH (Part 3 Commain - 2/3)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- EXEMPLE COMPLET -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #229954; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #229954; padding-left: 10px;">📈 EXEMPLE COMPLET DE CALCUL</h4>
                    <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; border: 2px solid #27ae60;">
                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <h5 style="color: #229954; margin-top: 0;">Scénario avec 3 opérations pour Caisse Abdel :</h5>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0;">
                                <div style="text-align: center; padding: 15px; background: #d4efdf; border-radius: 5px;">
                                    <strong>💰 Revenu</strong><br>
                                    +2000 DH
                                </div>
                                <div style="text-align: center; padding: 15px; background: #fadbd8; border-radius: 5px;">
                                    <strong>💸 Frais</strong><br>
                                    -500 DH
                                </div>
                                <div style="text-align: center; padding: 15px; background: #d6eaf8; border-radius: 5px;">
                                    <strong>🔄 Transfert</strong><br>
                                    -300 DH
                                </div>
                            </div>
                            
                            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #2c3e50; color: white; border-radius: 8px;">
                                <strong style="font-size: 20px;">CALCUL FINAL :</strong><br>
                                <span style="font-size: 24px; font-weight: bold;">2000 - 500 - 300 = 1200 DH</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PARTIE 3 : FONCTIONS AVANCÉES -->
            <div id="section-fonctions" class="manual-section" style="display: none;">
                <div style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                    <h3 style="margin: 0; font-size: 24px;">⚙️ FONCTIONS AVANCÉES</h3>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Découvrez les fonctionnalités expertes du système</p>
                </div>

                <!-- TABLEAU DE BORD -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #8e44ad; padding-left: 10px;">📊 TABLEAU DE BORD EN TEMPS RÉEL</h4>
                    <div style="background: #f4ecf7; padding: 25px; border-radius: 10px; border: 2px solid #9b59b6;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">🚀 Fonctionnalités temps réel :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>✅ Mise à jour instantanée :</strong> Les soldes se mettent à jour immédiatement après chaque opération</p>
                                    <p><strong>✅ Synchronisation multi-appareils :</strong> Les données sont synchronisées entre tous les appareils connectés</p>
                                    <p><strong>✅ Historique complet :</strong> Accès à tout l'historique des opérations</p>
                                    <p><strong>✅ Filtrage avancé :</strong> Filtrage par date, type, opérateur, groupe</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">🎯 Indicateurs visuels :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><span style="color: #27ae60; font-weight: bold;">📈 Solde positif :</span> Affiché en vert avec indicateur de croissance</p>
                                    <p><span style="color: #e74c3c; font-weight: bold;">📉 Solde négatif :</span> Affiché en rouge avec indicateur de baisse</p>
                                    <p><strong>📊 Compteurs :</strong> Nombre d'opérations, montants totaux</p>
                                    <p><strong>💰 Résumés :</strong> Totaux détaillés pour chaque vue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- EXPORT -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #8e44ad; padding-left: 10px;">📤 EXPORT DE DONNÉES</h4>
                    <div style="background: #f4ecf7; padding: 25px; border-radius: 10px; border: 2px solid #9b59b6;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; border: 2px solid #3498db;">
                                <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
                                <strong style="color: #3498db;">Export Complet</strong>
                                <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">Toutes les données système dans un fichier Excel structuré</p>
                            </div>
                            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; border: 2px solid #27ae60;">
                                <div style="font-size: 32px; margin-bottom: 10px;">👁️</div>
                                <strong style="color: #27ae60;">Export Vue Actuelle</strong>
                                <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">Seulement les données de la vue affichée actuellement</p>
                            </div>
                            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; border: 2px solid #9b59b6;">
                                <div style="font-size: 32px; margin-bottom: 10px;">📈</div>
                                <strong style="color: #9b59b6;">Rapport Détaillé</strong>
                                <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">Avec statistiques avancées et analyses</p>
                            </div>
                        </div>
                        <div style="background: #e8daef; padding: 15px; border-radius: 8px; text-align: center;">
                            <strong>💡 Utilisation recommandée :</strong> Exportez régulièrement vos données pour sauvegarde et analyse externe
                        </div>
                    </div>
                </div>

                <!-- ADMINISTRATION -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #8e44ad; padding-left: 10px;">🛠️ OUTILS D'ADMINISTRATION</h4>
                    <div style="background: #f4ecf7; padding: 25px; border-radius: 10px; border: 2px solid #9b59b6;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">🧹 Nettoyage et maintenance :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🗑️ Vider données locales :</strong> Supprime les données du navigateur uniquement</p>
                                    <p><strong>🔥 Réinitialiser Firebase :</strong> Supprime TOUTES les données définitivement</p>
                                    <p><strong>🔄 Resynchroniser :</strong> Force une resynchronisation avec le cloud</p>
                                    <p><strong>📊 Recalculer :</strong> Recalcule tous les soldes manuellement</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">🔐 Sécurité et accès :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🔐 Authentification sécurisée :</strong> Connexion par email/mot de passe</p>
                                    <p><strong>👥 Gestion des permissions :</strong> Chaque utilisateur a ses droits</p>
                                    <p><strong>📱 Accès multi-appareils :</strong> Utilisation sur mobile, tablette, ordinateur</p>
                                    <p><strong>🌐 Synchronisation cloud :</strong> Données accessibles partout</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RACCOURCIS -->
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #8e44ad; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #8e44ad; padding-left: 10px;">🎯 RACCOURCIS ET ASTUCES</h4>
                    <div style="background: #f4ecf7; padding: 25px; border-radius: 10px; border: 2px solid #9b59b6;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">⚡ Navigation rapide :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🖱️ Cliquez sur une caisse :</strong> Pour voir son détail complet</p>
                                    <p><strong>📱 Utilisez les onglets :</strong> Pour filtrer rapidement les données</p>
                                    <p><strong>🔍 Mode édition :</strong> Pour actions groupées sur plusieurs opérations</p>
                                    <p><strong>📊 Vues spécifiques :</strong> Pour analyser par groupe ou opérateur</p>
                                </div>
                            </div>
                            <div>
                                <h5 style="color: #8e44ad; margin-top: 0;">🚀 Productivité :</h5>
                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <p><strong>🔄 Reset formulaire :</strong> Après chaque saisie pour gagner du temps</p>
                                    <p><strong>🔍 Recherche :</strong> Utilisez la recherche dans l'historique</p>
                                    <p><strong>💾 Export régulier :</strong> Pour backup et analyse externe</p>
                                    <p><strong>📱 Mobile first :</strong> Interface optimisée pour mobile</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RÉSUMÉ VISUEL -->
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 30px; border-radius: 10px; margin-top: 40px;">
                <h4 style="margin: 0 0 25px 0; text-align: center; font-size: 24px;">🎯 SYNTHÈSE DES FONCTIONNALITÉS</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">➕</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Saisie Opérations</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Simple, rapide, intuitive</p>
                    </div>
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">🔄</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Transferts</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Entre caisses sécurisés</p>
                    </div>
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">📊</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Tableau de Bord</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Temps réel complet</p>
                    </div>
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">✏️</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Édition</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Simple et multiple</p>
                    </div>
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">📤</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Export Excel</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Complet et détaillé</p>
                    </div>
                    <div>
                        <div style="font-size: 40px; margin-bottom: 10px;">🔐</div>
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">Sécurité</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Authentification</p>
                    </div>
                </div>
            </div>

            <!-- PIED DE PAGE -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
                <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    <strong>📞 Support :</strong> Contactez l'administrateur système | 
                    <strong>🕐 Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-FR')} |
                    <strong>🔄 Version :</strong> 2.0 Complète
                </p>
                <p style="color: #bdc3c7; font-size: 12px; margin: 10px 0 0 0;">
                    © 2024 Gestion Ferme Ben Amara - Tous droits réservés
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(manualModal);
    
    // GESTION DE LA NAVIGATION
    const navButtons = manualModal.querySelectorAll('.nav-btn');
    const sections = manualModal.querySelectorAll('.manual-section');
    const indicator = manualModal.querySelector('#section-indicator');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Mettre à jour les boutons
            navButtons.forEach(btn => {
                btn.style.opacity = '0.7';
                btn.style.transform = 'scale(0.95)';
            });
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
            
            // Mettre à jour les sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            const activeSection = manualModal.querySelector(`#section-${targetSection}`);
            if (activeSection) {
                activeSection.style.display = 'block';
                
                // Mettre à jour l'indicateur
                const sectionNames = {
                    'utilisation': '🚀 Utilisation du Site',
                    'calculs': '🧮 Calculs des Caisses', 
                    'fonctions': '⚙️ Fonctions Avancées'
                };
                indicator.textContent = sectionNames[targetSection];
                
                // Animation d'apparition
                activeSection.style.animation = 'fadeIn 0.5s ease-in';
            }
        });
    });
    
    // Activer la première section par défaut
    if (navButtons[0]) {
        navButtons[0].style.opacity = '1';
        navButtons[0].style.transform = 'scale(1)';
    }
    
    // FERMETURE
    manualModal.addEventListener('click', (e) => {
        if (e.target === manualModal) {
            manualModal.remove();
        }
    });
    
    // Touche Échap
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            manualModal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    // Ajouter le CSS pour l'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .manual-section {
            animation: fadeIn 0.5s ease-in;
        }
        .nav-btn:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
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




