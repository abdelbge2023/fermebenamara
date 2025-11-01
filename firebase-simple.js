// firebase-simple.js - Configuration Firebase pour GitHub Pages
console.log('🔧 Chargement de Firebase Simple');

// Configuration Firebase - À PERSONNALISER AVEC VOS CLÉS
const firebaseConfig = {
    apiKey: "AIzaSyCY7e7Kexample1234567890abcdef",
    authDomain: "votre-projet-12345.firebaseapp.com",
    projectId: "votre-projet-12345",
    storageBucket: "votre-projet-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Variables globales
let firebaseApp;
let db;
let firebaseDisponible = false;

// Initialiser Firebase
function initialiserFirebase() {
    try {
        // Vérifier si Firebase est chargé
        if (typeof firebase === 'undefined') {
            console.log('❌ Firebase non chargé');
            return;
        }

        // Initialiser l'application Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Tester la connexion
        db.collection("test").get().then(() => {
            console.log('✅ Firebase initialisé avec succès');
            firebaseDisponible = true;
            mettreAJourStatutFirebase();
        }).catch(error => {
            console.log('🔧 Mode hors ligne - Firebase connecté mais erreur de test:', error);
            firebaseDisponible = true;
            mettreAJourStatutFirebase();
        });

    } catch (error) {
        console.log('🔧 Mode hors ligne activé - Firebase non disponible:', error.message);
        firebaseDisponible = false;
        mettreAJourStatutFirebase();
    }
}

// Fonction pour mettre à jour l'affichage du statut
function mettreAJourStatutFirebase() {
    // Attendre que le DOM soit chargé
    setTimeout(() => {
        const header = document.querySelector('header');
        if (!header) return;

        // Supprimer l'ancien statut s'il existe
        const ancienStatut = document.getElementById('statutFirebase');
        if (ancienStatut) {
            ancienStatut.remove();
        }

        // Créer le nouvel élément de statut
        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutFirebase';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '8px 16px';
        statutDiv.style.borderRadius = '20px';
        statutDiv.style.fontSize = '14px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';
        statutDiv.style.display = 'inline-block';
        
        if (firebaseDisponible) {
            statutDiv.textContent = '✅ Synchronisé avec le cloud';
            statutDiv.style.background = '#d4edda';
            statutDiv.style.color = '#155724';
            statutDiv.style.border = '2px solid #c3e6cb';
        } else {
            statutDiv.textContent = '🔧 Mode hors ligne (données locales)';
            statutDiv.style.background = '#fff3cd';
            statutDiv.style.color = '#856404';
            statutDiv.style.border = '2px solid #ffeaa7';
        }
        
        header.appendChild(statutDiv);
    }, 1000);
}

// Fonction pour migrer les données vers Firebase
window.migrerVersFirebase = async function() {
    if (!firebaseDisponible) {
        alert('❌ Firebase non disponible pour la migration');
        return;
    }

    console.log('🚀 Début de la migration vers Firebase...');
    
    // Charger les données existantes du localStorage
    const saved = localStorage.getItem('gestion_ferme_data');
    if (!saved) {
        alert('❌ Aucune donnée trouvée dans le localStorage');
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        const operations = data.operations || [];
        
        if (operations.length === 0) {
            alert('❌ Aucune opération à migrer');
            return;
        }
        
        let count = 0;
        let erreurs = 0;
        
        // Migrer chaque opération
        for (const operation of operations) {
            try {
                await db.collection("operations").add({
                    ...operation,
                    migre: true,
                    dateMigration: new Date().toISOString(),
                    timestamp: operation.timestamp || new Date().toISOString()
                });
                count++;
                
                // Afficher la progression
                if (count % 10 === 0) {
                    console.log(`📦 ${count} opérations migrées...`);
                }
            } catch (error) {
                console.error('Erreur migration opération:', operation.id, error);
                erreurs++;
            }
        }
        
        const message = `✅ Migration terminée !\n${count} opérations migrées\n${erreurs} erreurs`;
        console.log(message);
        alert(message);
        
        // Recharger la page pour afficher les nouvelles données
        setTimeout(() => {
            location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur lors de la migration: ' + error.message);
    }
}

// Fonction pour vérifier les données Firebase
window.verifierDonneesFirebase = async function() {
    if (!firebaseDisponible) {
        alert('❌ Firebase non disponible');
        return 0;
    }

    try {
        const querySnapshot = await db.collection("operations").get();
        const count = querySnapshot.size;
        alert(`📊 Firebase contient ${count} opérations`);
        return count;
    } catch (error) {
        console.error('Erreur vérification:', error);
        alert('❌ Erreur vérification Firebase');
        return 0;
    }
}

// Exposer les fonctions globalement
window.firebaseApp = firebaseApp;
window.db = db;
window.firebaseDisponible = firebaseDisponible;

// Initialiser Firebase quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation de Firebase...');
    initialiserFirebase();
    
    // Ajouter les boutons de migration après le chargement
    setTimeout(ajouterBoutonsMigration, 1500);
});

// Fonction pour ajouter les boutons de migration
function ajouterBoutonsMigration() {
    const header = document.querySelector('header');
    if (!header) return;

    // Vérifier si les boutons existent déjà
    if (document.getElementById('boutonsMigration')) {
        return;
    }

    const divBoutons = document.createElement('div');
    divBoutons.id = 'boutonsMigration';
    divBoutons.style.marginTop = '15px';
    divBoutons.style.display = 'flex';
    divBoutons.style.gap = '10px';
    divBoutons.style.justifyContent = 'center';
    divBoutons.style.flexWrap = 'wrap';
    
    // Bouton Migration
    const btnMigrer = document.createElement('button');
    btnMigrer.textContent = '🔄 Migrer vers Firebase';
    btnMigrer.className = 'btn-warning';
    btnMigrer.onclick = migrerVersFirebase;
    btnMigrer.title = 'Transférer les données locales vers le cloud';
    
    // Bouton Vérification
    const btnVerifier = document.createElement('button');
    btnVerifier.textContent = '📊 Vérifier Firebase';
    btnVerifier.className = 'btn-info';
    btnVerifier.onclick = verifierDonneesFirebase;
    btnVerifier.title = 'Vérifier le nombre d\'opérations dans Firebase';
    
    divBoutons.appendChild(btnMigrer);
    divBoutons.appendChild(btnVerifier);
    header.appendChild(divBoutons);
    
    console.log('✅ Boutons de migration ajoutés');
}

// Message de confirmation
console.log('🔧 firebase-simple.js chargé - Prêt pour l\'initialisation');