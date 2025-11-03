// Configuration Firebase
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "votre-sender-id",
    appId: "votre-app-id"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

class GestionFerme {
    constructor() {
        this.utilisateurConnecte = null;
        this.estAdministrateur = false;
        this.gestionOperations = new GestionOperations(this);
        this.initialiserApp();
    }

    initialiserApp() {
        this.initialiserAuth();
        this.initialiserEcouteurs();
        this.initialiserModals();
    }

    initialiserAuth() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.utilisateurConnecte = user;
                await this.verifierRoleAdministrateur(user.uid);
                this.afficherInterfaceConnecte();
            } else {
                this.afficherInterfaceDeconnecte();
            }
        });
    }

    async verifierRoleAdministrateur(uid) {
        try {
            const doc = await db.collection('utilisateurs').doc(uid).get();
            if (doc.exists) {
                const data = doc.data();
                this.estAdministrateur = data.role === 'admin';
                this.appliquerPermissions();
            } else {
                // Créer l'utilisateur s'il n'existe pas
                await this.creerUtilisateur(uid);
                this.estAdministrateur = false;
                this.appliquerPermissions();
            }
        } catch (error) {
            console.error('Erreur vérification rôle:', error);
            this.estAdministrateur = false;
        }
    }

    async creerUtilisateur(uid) {
        const userData = {
            email: this.utilisateurConnecte.email,
            role: 'operateur',
            dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
            dernierAcces: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('utilisateurs').doc(uid).set(userData);
    }

    appliquerPermissions() {
        const elementsAdmin = document.querySelectorAll('.admin-only');
        const elementsOperateur = document.querySelectorAll('.operateur-only');

        elementsAdmin.forEach(el => {
            el.style.display = this.estAdministrateur ? 'block' : 'none';
        });

        elementsOperateur.forEach(el => {
            el.style.display = !this.estAdministrateur ? 'block' : 'none';
        });

        // Mettre à jour l'info utilisateur
        const infoUtilisateur = document.getElementById('info-utilisateur');
        if (infoUtilisateur) {
            const role = this.estAdministrateur ? 'Administrateur' : 'Opérateur';
            infoUtilisateur.textContent = `${this.utilisateurConnecte.email} (${role})`;
        }
    }

    afficherInterfaceConnecte() {
        document.getElementById('non-connecte').style.display = 'none';
        document.getElementById('connecte').style.display = 'block';
        
        if (this.estAdministrateur) {
            this.gestionOperations.afficherToutesOperations();
        } else {
            this.gestionOperations.afficherMesOperations();
        }
    }

    afficherInterfaceDeconnecte() {
        document.getElementById('non-connecte').style.display = 'block';
        document.getElementById('connecte').style.display = 'none';
        document.getElementById('liste-operations').innerHTML = '';
    }

    initialiserEcouteurs() {
        // Connexion
        document.getElementById('form-connexion').addEventListener('submit', (e) => {
            e.preventDefault();
            this.connexion();
        });

        // Déconnexion
        document.getElementById('btn-deconnexion').addEventListener('click', () => {
            this.deconnexion();
        });

        // Changement mot de passe
        document.getElementById('btn-changer-motdepasse').addEventListener('click', () => {
            this.afficherModalChangementMotDePasse();
        });

        document.getElementById('form-changement-motdepasse').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changerMotDePasse();
        });

        // Navigation
        document.getElementById('btn-gestion-utilisateurs').addEventListener('click', () => {
            this.gestionUtilisateurs();
        });

        document.getElementById('btn-voir-toutes-operations').addEventListener('click', () => {
            this.gestionOperations.afficherToutesOperations();
        });

        document.getElementById('btn-mes-operations').addEventListener('click', () => {
            this.gestionOperations.afficherMesOperations();
        });

        document.getElementById('btn-creer-operation').addEventListener('click', () => {
            this.gestionOperations.afficherModalCreation();
        });
    }

    initialiserModals() {
        // Fermer les modals en cliquant sur X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Fermer les modals en cliquant à l'extérieur
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    async connexion() {
        const email = document.getElementById('email-connexion').value;
        const motdepasse = document.getElementById('motdepasse-connexion').value;

        try {
            await auth.signInWithEmailAndPassword(email, motdepasse);
            this.afficherMessage('Connexion réussie');
        } catch (error) {
            console.error('Erreur connexion:', error);
            this.afficherMessage('Erreur de connexion: ' + error.message, 'error');
        }
    }

    async deconnexion() {
        try {
            await auth.signOut();
            this.afficherMessage('Déconnexion réussie');
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    }

    afficherModalChangementMotDePasse() {
        const modal = document.getElementById('modal-changement-motdepasse');
        if (!modal) {
            console.error('Modal changement mot de passe non trouvé');
            return;
        }
        
        // Réinitialiser le formulaire
        document.getElementById('form-changement-motdepasse').reset();
        modal.style.display = 'block';
    }

    async changerMotDePasse() {
        const ancienMotDePasse = document.getElementById('ancien-motdepasse').value;
        const nouveauMotDePasse = document.getElementById('nouveau-motdepasse').value;
        const confirmation = document.getElementById('confirmation-motdepasse').value;

        if (nouveauMotDePasse !== confirmation) {
            this.afficherMessage('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (nouveauMotDePasse.length < 6) {
            this.afficherMessage('Le mot de passe doit faire au moins 6 caractères', 'error');
            return;
        }

        try {
            // Recréer l'utilisateur avec email/mot de passe pour vérifier l'ancien mot de passe
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.utilisateurConnecte.email,
                ancienMotDePasse
            );
            
            await this.utilisateurConnecte.reauthenticateWithCredential(credential);
            await this.utilisateurConnecte.updatePassword(nouveauMotDePasse);
            
            this.afficherMessage('Mot de passe changé avec succès');
            document.getElementById('modal-changement-motdepasse').style.display = 'none';
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            this.afficherMessage('Erreur: ' + error.message, 'error');
        }
    }

    gestionUtilisateurs() {
        // Implémentation de la gestion des utilisateurs pour l'admin
        this.afficherMessage('Fonctionnalité gestion utilisateurs à implémenter');
    }

    afficherMessage(message, type = 'success') {
        // Créer un élément de message temporaire
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background-color: ${type === 'error' ? '#ff4444' : '#44ff44'};
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 3000);
    }
}

class GestionOperations {
    constructor(gestionFerme) {
        this.gestionFerme = gestionFerme;
        this.initialiserEcouteurs();
    }

    initialiserEcouteurs() {
        // Création d'opération
        document.getElementById('form-creation-operation').addEventListener('submit', (e) => {
            e.preventDefault();
            this.creerOperation();
        });

        // Édition d'opération
        document.getElementById('form-edition-operation').addEventListener('submit', (e) => {
            e.preventDefault();
            this.enregistrerModificationOperation();
        });
    }

    async afficherMesOperations() {
        try {
            const operations = await db.collection('operations')
                .where('createurId', '==', this.gestionFerme.utilisateurConnecte.uid)
                .orderBy('dateCreation', 'desc')
                .get();
            
            this.afficherOperations(operations);
        } catch (error) {
            console.error('Erreur chargement opérations:', error);
            this.gestionFerme.afficherMessage('Erreur chargement des opérations', 'error');
        }
    }

    async afficherToutesOperations() {
        try {
            const operations = await db.collection('operations')
                .orderBy('dateCreation', 'desc')
                .get();
            
            this.afficherOperations(operations);
        } catch (error) {
            console.error('Erreur chargement opérations:', error);
            this.gestionFerme.afficherMessage('Erreur chargement des opérations', 'error');
        }
    }

    afficherOperations(operationsSnapshot) {
        const container = document.getElementById('liste-operations');
        container.innerHTML = '';

        if (operationsSnapshot.empty) {
            container.innerHTML = '<p>Aucune opération trouvée</p>';
            return;
        }

        operationsSnapshot.forEach(doc => {
            const operation = doc.data();
            const operationEl = this.creerElementOperation(operation, doc.id);
            container.appendChild(operationEl);
        });
    }

    creerElementOperation(operation, operationId) {
        const div = document.createElement('div');
        div.className = 'operation-item';
        div.innerHTML = `
            <h4>${operation.nom}</h4>
            <p>${operation.description}</p>
            <small>Créé par: ${operation.createurEmail} - ${operation.dateCreation?.toDate().toLocaleDateString()}</small>
            <br>
            <small>Statut: ${operation.statut}</small>
            <br>
            <button class="btn-editer" data-id="${operationId}">Éditer</button>
            <button class="btn-supprimer" data-id="${operationId}">Supprimer</button>
        `;

        // Écouteurs pour les boutons
        div.querySelector('.btn-editer').addEventListener('click', () => {
            this.editerOperation(operationId);
        });

        div.querySelector('.btn-supprimer').addEventListener('click', () => {
            this.supprimerOperation(operationId);
        });

        return div;
    }

    async supprimerOperation(operationId) {
        if (!this.gestionFerme.estAdministrateur) {
            // Vérifier si l'opérateur est propriétaire
            const operation = await db.collection('operations').doc(operationId).get();
            if (operation.exists) {
                const data = operation.data();
                if (data.createurId !== this.gestionFerme.utilisateurConnecte.uid) {
                    this.gestionFerme.afficherMessage('Vous ne pouvez supprimer que vos propres opérations', 'error');
                    return;
                }
            }
        }

        if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            try {
                await db.collection('operations').doc(operationId).delete();
                this.gestionFerme.afficherMessage('Opération supprimée avec succès');
                
                // Recharger la liste
                if (this.gestionFerme.estAdministrateur) {
                    this.afficherToutesOperations();
                } else {
                    this.afficherMesOperations();
                }
            } catch (error) {
                console.error('Erreur suppression:', error);
                this.gestionFerme.afficherMessage('Erreur lors de la suppression', 'error');
            }
        }
    }

    async editerOperation(operationId) {
        try {
            const operationDoc = await db.collection('operations').doc(operationId).get();
            
            if (!operationDoc.exists) {
                this.gestionFerme.afficherMessage('Opération non trouvée', 'error');
                return;
            }

            const data = operationDoc.data();
            
            // Vérifier les permissions
            if (!this.gestionFerme.estAdministrateur && data.createurId !== this.gestionFerme.utilisateurConnecte.uid) {
                this.gestionFerme.afficherMessage('Vous ne pouvez éditer que vos propres opérations', 'error');
                return;
            }

            this.afficherModalEdition(data, operationId);
        } catch (error) {
            console.error('Erreur édition:', error);
            this.gestionFerme.afficherMessage('Erreur lors de l\'édition', 'error');
        }
    }

    afficherModalEdition(data, operationId) {
        const modal = document.getElementById('modal-edition-operation');
        if (!modal) {
            console.error('Modal édition non trouvé');
            return;
        }

        // Remplir le formulaire
        document.getElementById('edit-nom').value = data.nom || '';
        document.getElementById('edit-description').value = data.description || '';
        document.getElementById('edit-statut').value = data.statut || 'en-cours';

        modal.style.display = 'block';
        modal.dataset.operationId = operationId;
    }

    async enregistrerModificationOperation() {
        const modal = document.getElementById('modal-edition-operation');
        const operationId = modal.dataset.operationId;

        const nouvellesDonnees = {
            nom: document.getElementById('edit-nom').value,
            description: document.getElementById('edit-description').value,
            statut: document.getElementById('edit-statut').value,
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('operations').doc(operationId).update(nouvellesDonnees);
            this.gestionFerme.afficherMessage('Opération modifiée avec succès');
            modal.style.display = 'none';

            // Recharger la liste
            if (this.gestionFerme.estAdministrateur) {
                this.afficherToutesOperations();
            } else {
                this.afficherMesOperations();
            }
        } catch (error) {
            console.error('Erreur modification:', error);
            this.gestionFerme.afficherMessage('Erreur lors de la modification', 'error');
        }
    }

    afficherModalCreation() {
        const modal = document.getElementById('modal-creation-operation');
        if (!modal) {
            console.error('Modal création non trouvé');
            return;
        }

        document.getElementById('form-creation-operation').reset();
        modal.style.display = 'block';
    }

    async creerOperation() {
        const nom = document.getElementById('creer-nom').value;
        const description = document.getElementById('creer-description').value;

        const nouvelleOperation = {
            nom: nom,
            description: description,
            createurId: this.gestionFerme.utilisateurConnecte.uid,
            createurEmail: this.gestionFerme.utilisateurConnecte.email,
            dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
            dateModification: firebase.firestore.FieldValue.serverTimestamp(),
            statut: 'en-cours'
        };

        try {
            await db.collection('operations').add(nouvelleOperation);
            this.gestionFerme.afficherMessage('Opération créée avec succès');
            document.getElementById('modal-creation-operation').style.display = 'none';
            
            // Recharger la liste
            this.afficherMesOperations();
        } catch (error) {
            console.error('Erreur création:', error);
            this.gestionFerme.afficherMessage('Erreur lors de la création', 'error');
        }
    }
}

// Initialisation de l'application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
