// firebase-simple.js - Synchronisation automatique uniquement
console.log('🔧 Chargement de Firebase Simple - Mode local avec sync automatique');

// Configuration Firebase - À PERSONNALISER AVEC VOS CLÉS
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};

// Exemple d'utilisation de la synchronisation Firebase

class FermeBenamaraApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🏭 Application Ferme Benamara initialisée');
        
        // Charger les données au démarrage
        await this.loadInitialData();
        
        // Écouter les changements en temps réel
        this.setupRealTimeListeners();
    }

    async loadInitialData() {
        // Charger les animaux
        const animaux = await firebaseSync.getCollection('animaux');
        this.displayAnimaux(animaux);

        // Charger les ventes
        const ventes = await firebaseSync.getCollection('ventes');
        this.displayVentes(ventes);
    }

    setupRealTimeListeners() {
        // Écouter les nouveaux animaux en temps réel
        firebaseSync.listenToCollection('animaux', (changes, snapshot) => {
            console.log('🔄 Mise à jour temps réel - Animaux:', changes);
            this.handleAnimauxUpdate(changes);
        });

        // Écouter les nouvelles ventes en temps réel
        firebaseSync.listenToCollection('ventes', (changes, snapshot) => {
            console.log('🔄 Mise à jour temps réel - Ventes:', changes);
            this.handleVentesUpdate(changes);
        });
    }

    // Exemple: Ajouter un animal
    async ajouterAnimal(animalData) {
        try {
            await firebaseSync.addDocument('animaux', animalData);
            console.log('✅ Animal ajouté avec succès');
        } catch (error) {
            console.error('❌ Erreur ajout animal:', error);
        }
    }

    // Exemple: Mettre à jour un animal
    async mettreAJourAnimal(animalId, nouvellesDonnees) {
        try {
            await firebaseSync.updateDocument('animaux', animalId, nouvellesDonnees);
            console.log('✅ Animal mis à jour avec succès');
        } catch (error) {
            console.error('❌ Erreur mise à jour animal:', error);
        }
    }

    displayAnimaux(animaux) {
        // Votre code d'affichage ici
        console.log('🐄 Animaux affichés:', animaux);
    }

    displayVentes(ventes) {
        // Votre code d'affichage ici
        console.log('💰 Ventes affichées:', ventes);
    }

    handleAnimauxUpdate(changes) {
        changes.forEach(change => {
            if (change.type === 'added') {
                console.log('➕ Nouvel animal:', change.data);
            } else if (change.type === 'modified') {
                console.log('✏️ Animal modifié:', change.data);
            } else if (change.type === 'removed') {
                console.log('🗑️ Animal supprimé:', change.id);
            }
        });
    }

    handleVentesUpdate(changes) {
        // Gérer les mises à jour des ventes
        changes.forEach(change => {
            console.log(`📊 Vente ${change.type}:`, change.data);
        });
    }
}

// Démarrer l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FermeBenamaraApp();
});

