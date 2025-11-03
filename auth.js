// auth.js - Système d'authentification avec permissions
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.users = {
            'abdel': { password: 'abdel123', nom: 'Abdel', admin: true },
            'omar': { password: 'omar123', nom: 'Omar', admin: false },
            'hicham': { password: 'hicham123', nom: 'Hicham', admin: false },
            'admin': { password: 'admin123', nom: 'Administrateur', admin: true }
        };
        
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupAuthUI();
    }

    setupAuthUI() {
        // Créer le modal d'authentification
        this.createAuthModal();
        
        // Vérifier si l'utilisateur est déjà connecté
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAdmin = this.currentUser.admin;
            this.hideAuthModal();
            this.updateUIForUser();
        } else {
            this.showAuthModal();
        }
    }

    createAuthModal() {
        const modalHTML = `
            <div id="authModal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>🔐 Connexion</h3>
                    </div>
                    <form id="loginForm" class="modal-form">
                        <div class="form-group">
                            <label for="username">Opérateur :</label>
                            <select id="username" required>
                                <option value="">Choisir l'opérateur</option>
                                <option value="abdel">Abdel (Admin)</option>
                                <option value="omar">Omar</option>
                                <option value="hicham">Hicham</option>
                                <option value="admin">Administrateur</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="password">Mot de passe :</label>
                            <input type="password" id="password" required>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">🔐 Se connecter</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Événement de connexion
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Veuillez saisir tous les champs');
            return;
        }

        const user = this.users[username];
        if (user && user.password === password) {
            this.currentUser = {
                username: username,
                nom: user.nom,
                admin: user.admin
            };
            this.isAdmin = user.admin;
            
            // Sauvegarder la session
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.hideAuthModal();
            this.updateUIForUser();
            this.showWelcomeMessage();
            
            // Recharger l'application si elle existe
            if (window.app) {
                window.app.onUserChange();
            }
        } else {
            alert('Identifiants incorrects');
        }
    }

    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentUser');
        this.showAuthModal();
        this.updateUIForUser();
        
        if (window.app) {
            window.app.onUserChange();
        }
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAdmin = this.currentUser.admin;
        }
    }

    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }

    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'flex';
        }
    }

    updateUIForUser() {
        const header = document.querySelector('header');
        if (!header) return;

        const existingUserInfo = document.getElementById('userInfo');
        
        if (existingUserInfo) {
            existingUserInfo.remove();
        }

        if (this.currentUser) {
            const userInfoHTML = `
                <div id="userInfo" class="user-info">
                    <span>👤 ${this.currentUser.nom} ${this.isAdmin ? '👑' : ''}</span>
                    <button onclick="auth.logout()" class="btn-secondary btn-small">🚪 Déconnexion</button>
                </div>
            `;
            header.insertAdjacentHTML('beforeend', userInfoHTML);
        }
    }

    showWelcomeMessage() {
        const message = this.isAdmin ? 
            `Bienvenue ${this.currentUser.nom} (Administrateur)` :
            `Bienvenue ${this.currentUser.nom}`;
        
        if (window.app) {
            window.app.afficherMessageSucces(message);
        }
    }

    // Vérifier les permissions pour les opérations
    canEditOperation(operation) {
        if (!this.currentUser) return false;
        if (this.isAdmin) return true; // Admin peut tout modifier
        return operation.operateur === this.currentUser.username; // Utilisateur ne peut modifier que ses opérations
    }

    canDeleteOperation(operation) {
        return this.canEditOperation(operation);
    }

    // Filtrer les opérations selon les permissions
    filterOperations(operations) {
        if (!this.currentUser) return [];
        if (this.isAdmin) return operations; // Admin voit tout
        
        // Utilisateur normal voit toutes les opérations mais ne peut modifier/supprimer que les siennes
        return operations;
    }

    getCurrentUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }

    getCurrentUserDisplayName() {
        return this.currentUser ? this.currentUser.nom : 'Non connecté';
    }
}

// Initialisation globale
let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthSystem();
});
