// Configuration Firebase - REMPLACEZ AVEC VOS CLÉS
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};
// Initialisation Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialisé avec succès');
} catch (error) {
    console.error('Erreur initialisation Firebase:', error);
}

const auth = firebase.auth();
const db = firebase.firestore();

class GestionFerme {
    constructor() {
        this.utilisateur = null;
        this.estAdmin = false;
        this.operationEditId = null;
        this.initialiser();
    }

    initialiser() {
        this.initialiserAuth();
        this.initialiserEcouteurs();
    }

    initialiserAuth() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Utilisateur connecté:', user.email);
                this.utilisateur = user;
                this.verifierAdmin();
                this.afficherInterface();
            } else {
                console.log('Aucun utilisateur connecté');
                this.cacherInterface();
            }
        });
    }

    verifierAdmin() {
        // Liste des administrateurs
        const admins = ['admin@fermebenamara.com', 'admin@ferme.com', 'administrateur@fermebenamara.com'];
        this.estAdmin = admins.includes(this.utilisateur.email);
        console.log('Statut admin:', this.estAdmin);
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

        // Création opération
        document.getElementById('btn-creer-operation').addEventListener('click', () => {
            this.ouvrirModalCreation();
        });

        // Voir toutes les opérations (admin)
        document.getElementById('btn-voir-tout').addEventListener('click', () => {
            this.chargerToutesOperations();
        });

        // Formulaire opération
        document.getElementById('form-operation').addEventListener('submit', (e) => {
            e.preventDefault();
            this.enregistrerOperation();
        });

        // Fermer modal en cliquant à l'extérieur
        document.getElementById('modal-operation').addEventListener('click', (e) => {
            if (e.target.id === 'modal-operation') {
                this.fermerModal();
            }
        });
    }

    async connexion() {
        const identifiant = document.getElementById('identifiant').value.trim();
        const motdepasse = document.getElementById('motdepasse').value;

        if (!identifiant || !motdepasse) {
            this.afficherMessage('Veuillez remplir tous les champs', 'error');
            return;
        }

        // Format email pour Firebase Auth
        const email = this.formatEmail(identifiant);

        try {
            const result = await auth.signInWithEmailAndPassword(email, motdepasse);
            this.afficherMessage('Connexion réussie !');
        } catch (error) {
            console.error('Erreur connexion:', error);
            let message = 'Erreur de connexion';
            
            if (error.code === 'auth/user-not-found') {
                message = 'Utilisateur non trouvé';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Mot de passe incorrect';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email invalide';
            }
            
            this.afficherMessage(message, 'error');
        }
    }

    formatEmail(identifiant) {
        // Si ce n'est pas déjà un email, ajoute le domaine
        if (!identifiant.includes('@')) {
            return identifiant + '@fermebenamara.com';
        }
        return identifiant;
    }

    deconnexion() {
        auth.signOut();
        this.afficherMessage('Déconnexion réussie');
    }

    afficherInterface() {
        document.getElementById('ecran-connexion').style.display = 'none';
        document.getElementById('interface-principale').style.display = 'block';
        
        // Mettre à jour les informations utilisateur
        const info = document.getElementById('info-utilisateur');
        const role = this.estAdmin ? 'Administrateur' : 'Opérateur';
        info.innerHTML = `Connecté en tant que: <strong>${this.utilisateur.email}</strong> | Rôle: <strong>${role}</strong>`;
        
        // Afficher le panel admin si nécessaire
        document.getElementById('panel-admin').style.display = this.estAdmin ? 'block' : 'none';
        
        // Charger les opérations appropriées
        this.chargerOperations();
    }

    cacherInterface() {
        document.getElementById('ecran-connexion').style.display = 'block';
        document.getElementById('interface-principale').style.display = 'none';
        document.getElementById('form-connexion').reset();
    }

    ouvrirModalCreation(operation = null) {
        const modal = document.getElementById('modal-operation');
        const titre = document.getElementById('titre-modal');

        if (operation) {
            titre.textContent = 'Modifier l\'opération';
            document.getElementById('input-nom').value = operation.nom;
            document.getElementById('input-description').value = operation.description;
            this.operationEditId = operation.id;
        } else {
            titre.textContent = 'Créer une opération';
            document.getElementById('input-nom').value = '';
            document.getElementById('input-description').value = '';
            this.operationEditId = null;
        }

        modal.style.display = 'block';
    }

    fermerModal() {
        document.getElementById('modal-operation').style.display = 'none';
        this.operationEditId = null;
    }

    async enregistrerOperation() {
        const nom = document.getElementById('input-nom').value.trim();
        const description = document.getElementById('input-description').value.trim();

        if (!nom || !description) {
            this.afficherMessage('Veuillez remplir tous les champs', 'error');
            return;
        }

        try {
            if (this.operationEditId) {
                // Modification d'opération existante
                await db.collection('operations').doc(this.operationEditId).update({
                    nom: nom,
                    description: description,
                    dateModification: new Date()
                });
                this.afficherMessage('Opération modifiée avec succès !');
            } else {
                // Création d'une nouvelle opération
                await db.collection('operations').add({
                    nom: nom,
                    description: description,
                    createurId: this.utilisateur.uid,
                    createurEmail: this.utilisateur.email,
                    dateCreation: new Date(),
                    dateModification: new Date()
                });
                this.afficherMessage('Opération créée avec succès !');
            }

            this.fermerModal();
            this.chargerOperations(); // Recharger la liste
        } catch (error) {
            console.error('Erreur enregistrement:', error);
            this.afficherMessage('Erreur lors de l\'enregistrement', 'error');
        }
    }

    async chargerMesOperations() {
        try {
            const snapshot = await db.collection('operations')
                .where('createurId', '==', this.utilisateur.uid)
                .orderBy('dateCreation', 'desc')
                .get();
            
            this.afficherOperations(snapshot);
        } catch (error) {
            console.error('Erreur chargement opérations:', error);
            this.afficherMessage('Erreur lors du chargement des opérations', 'error');
        }
    }

    async chargerToutesOperations() {
        try {
            const snapshot = await db.collection('operations')
                .orderBy('dateCreation', 'desc')
                .get();
            
            this.afficherOperations(snapshot);
        } catch (error) {
            console.error('Erreur chargement opérations:', error);
            this.afficherMessage('Erreur lors du chargement des opérations', 'error');
        }
    }

    afficherOperations(snapshot) {
        const container = document.getElementById('liste-operations');
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="operation"><p>Aucune opération trouvée</p></div>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const operation = doc.data();
            const element = this.creerElementOperation(operation, doc.id);
            container.appendChild(element);
        });
    }

    creerElementOperation(operation, operationId) {
        const div = document.createElement('div');
        div.className = 'operation';
        
        const dateCreation = operation.dateCreation ? 
            operation.dateCreation.toDate().toLocaleDateString('fr-FR') : 'Date inconnue';
        
        div.innerHTML = `
            <h4>${operation.nom}</h4>
            <p>${operation.description}</p>
            <small style="color: #666;">
                Créé par: ${operation.createurEmail} • 
                Date: ${dateCreation}
                ${this.estAdmin ? '• ID: ' + operationId.substring(0, 8) + '...' : ''}
            </small>
            <div style="margin-top: 10px;">
                <button class="btn btn-editer" data-id="${operationId}">✏️ Éditer</button>
                <button class="btn btn-supprimer" data-id="${operationId}">🗑️ Supprimer</button>
            </div>
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

    async editerOperation(operationId) {
        try {
            const doc = await db.collection('operations').doc(operationId).get();
            if (doc.exists) {
                const operation = doc.data();
                
                // Vérifier les permissions
                if (!this.estAdmin && operation.createurId !== this.utilisateur.uid) {
                    this.afficherMessage('Vous ne pouvez éditer que vos propres opérations', 'error');
                    return;
                }

                this.ouvrirModalCreation({...operation, id: operationId});
            }
        } catch (error) {
            console.error('Erreur édition:', error);
            this.afficherMessage('Erreur lors de l\'édition', 'error');
        }
    }

    async supprimerOperation(operationId) {
        try {
            const doc = await db.collection('operations').doc(operationId).get();
            if (doc.exists) {
                const operation = doc.data();
                
                // Vérifier les permissions
                if (!this.estAdmin && operation.createurId !== this.utilisateur.uid) {
                    this.afficherMessage('Vous ne pouvez supprimer que vos propres opérations', 'error');
                    return;
                }

                if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
                    await db.collection('operations').doc(operationId).delete();
                    this.afficherMessage('Opération supprimée avec succès');
                    this.chargerOperations();
                }
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.afficherMessage('Erreur lors de la suppression', 'error');
        }
    }

    chargerOperations() {
        if (this.estAdmin) {
            this.chargerToutesOperations();
        } else {
            this.chargerMesOperations();
        }
    }

    afficherMessage(message, type = 'success') {
        // Créer un élément de message temporaire
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            background-color: ${type === 'error' ? '#f44336' : '#4CAF50'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (document.body.contains(messageEl)) {
                document.body.removeChild(messageEl);
            }
        }, 4000);
    }
}

// Fonction globale pour fermer le modal
function fermerModal() {
    if (app) {
        app.fermerModal();
    }
}

// Initialisation de l'application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
    console.log('Application Ferme Ben Amara initialisée');
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
});

