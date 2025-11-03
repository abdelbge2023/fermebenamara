// Configuration Firebase
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "votre-sender-id",
    appId: "votre-app-id"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

class GestionFerme {
    constructor() {
        this.utilisateur = null;
        this.estAdmin = false;
        this.initialiser();
    }

    initialiser() {
        this.initialiserAuth();
        this.initialiserEcouteurs();
    }

    initialiserAuth() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.utilisateur = user;
                this.verifierAdmin();
                this.afficherInterface();
            } else {
                this.cacherInterface();
            }
        });
    }

    // Vérification simple si c'est un admin
    verifierAdmin() {
        // Liste des admins - à adapter avec vos emails
        const admins = ['admin@ferme.com', 'administrateur@ferme.com'];
        this.estAdmin = admins.includes(this.utilisateur.email);
        this.afficherPanelAdmin();
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
    }

    async connexion() {
        const identifiant = document.getElementById('identifiant').value;
        const motdepasse = document.getElementById('motdepasse').value;

        // Format email pour Firebase Auth
        const email = this.formatEmail(identifiant);

        try {
            await auth.signInWithEmailAndPassword(email, motdepasse);
            this.afficherMessage('Connexion réussie');
        } catch (error) {
            this.afficherMessage('Erreur: ' + error.message, 'error');
        }
    }

    formatEmail(identifiant) {
        // Si ce n'est pas déjà un email, ajoutez votre domaine
        if (!identifiant.includes('@')) {
            return identifiant + '@ferme.com';
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
        
        const info = document.getElementById('info-utilisateur');
        info.innerHTML = `Connecté en tant que: <strong>${this.utilisateur.email}</strong> (${this.estAdmin ? 'Administrateur' : 'Opérateur'})`;
        
        // Charger les opérations appropriées
        if (this.estAdmin) {
            this.chargerToutesOperations();
        } else {
            this.chargerMesOperations();
        }
    }

    cacherInterface() {
        document.getElementById('ecran-connexion').style.display = 'block';
        document.getElementById('interface-principale').style.display = 'none';
        document.getElementById('form-connexion').reset();
    }

    afficherPanelAdmin() {
        const panel = document.getElementById('panel-admin');
        panel.style.display = this.estAdmin ? 'block' : 'none';
    }

    ouvrirModalCreation(operation = null) {
        const modal = document.getElementById('modal-operation');
        const titre = document.getElementById('titre-modal');
        const form = document.getElementById('form-operation');

        if (operation) {
            titre.textContent = 'Modifier une opération';
            document.getElementById('input-nom').value = operation.nom;
            document.getElementById('input-description').value = operation.description;
            form.dataset.operationId = operation.id;
        } else {
            titre.textContent = 'Créer une opération';
            document.getElementById('input-nom').value = '';
            document.getElementById('input-description').value = '';
            delete form.dataset.operationId;
        }

        modal.style.display = 'block';
    }

    async enregistrerOperation() {
        const nom = document.getElementById('input-nom').value;
        const description = document.getElementById('input-description').value;
        const form = document.getElementById('form-operation');
        const operationId = form.dataset.operationId;

        if (!nom || !description) {
            this.afficherMessage('Veuillez remplir tous les champs', 'error');
            return;
        }

        try {
            if (operationId) {
                // Modification
                await db.collection('operations').doc(operationId).update({
                    nom: nom,
                    description: description,
                    dateModification: new Date()
                });
                this.afficherMessage('Opération modifiée avec succès');
            } else {
                // Création
                await db.collection('operations').add({
                    nom: nom,
                    description: description,
                    createurId: this.utilisateur.uid,
                    createurEmail: this.utilisateur.email,
                    dateCreation: new Date(),
                    dateModification: new Date()
                });
                this.afficherMessage('Opération créée avec succès');
            }

            fermerModal();
            this.chargerOperations(); // Recharger la liste
        } catch (error) {
            this.afficherMessage('Erreur: ' + error.message, 'error');
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
            console.error('Erreur chargement:', error);
        }
    }

    async chargerToutesOperations() {
        try {
            const snapshot = await db.collection('operations')
                .orderBy('dateCreation', 'desc')
                .get();
            
            this.afficherOperations(snapshot);
        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    }

    afficherOperations(snapshot) {
        const container = document.getElementById('liste-operations');
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p>Aucune opération trouvée</p>';
            return;
        }

        snapshot.forEach(doc => {
            const operation = doc.data();
            const element = this.creerElementOperation(operation, doc.id);
            container.appendChild(element);
        });
    }

    creerElementOperation(operation, operationId) {
        const div = document.createElement('div');
        div.className = 'operation';
        div.innerHTML = `
            <h4>${operation.nom}</h4>
            <p>${operation.description}</p>
            <small>
                Créé par: ${operation.createurEmail} • 
                ${operation.dateCreation?.toDate().toLocaleDateString()}
            </small>
            <div>
                <button class="btn btn-editer" data-id="${operationId}">Éditer</button>
                <button class="btn btn-supprimer" data-id="${operationId}">Supprimer</button>
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
            this.afficherMessage('Erreur: ' + error.message, 'error');
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
                    this.afficherMessage('Opération supprimée');
                    this.chargerOperations();
                }
            }
        } catch (error) {
            this.afficherMessage('Erreur: ' + error.message, 'error');
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
        // Message simple en alert pour l'exemple
        if (type === 'error') {
            alert('❌ ' + message);
        } else {
            alert('✅ ' + message);
        }
    }
}

// Fonction globale pour fermer le modal
function fermerModal() {
    document.getElementById('modal-operation').style.display = 'none';
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GestionFerme();
});
