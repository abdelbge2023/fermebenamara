// firebase-config.js - Configuration Firebase pour GitHub Pages
console.log('🔥 Configuration Firebase chargée');

// Configuration Firebase - À PERSONNALISER AVEC VOS CLÉS
const firebaseConfig = {
  apiKey: "AIzaSyDkqudvQPUv_Lh2V2d2PUSEcxcHDExw6PE",
  authDomain: "gestion-fermebenamara.firebaseapp.com",
  projectId: "gestion-fermebenamara",
  storageBucket: "gestion-fermebenamara.firebasestorage.app",
  messagingSenderId: "668129137491",
  appId: "1:668129137491:web:b56522302ea789044507a6"
};
// Variables globales - UNIQUEMENT si elles n'existent pas
if (typeof window.firebaseApp === 'undefined') {
    window.firebaseApp = null;
}
if (typeof window.db === 'undefined') {
    window.db = null;
}
if (typeof window.firebaseDisponible === 'undefined') {
    window.firebaseDisponible = false;
}

// Initialiser Firebase
function initialiserFirebase() {
    try {
        // Vérifier si Firebase est chargé
        if (typeof firebase === 'undefined') {
            console.log('❌ Firebase non chargé');
            return;
        }

        // Éviter la réinitialisation multiple
        if (window.firebaseApp) {
            console.log('✅ Firebase déjà initialisé');
            return;
        }

        // Initialiser l'application Firebase
        window.firebaseApp = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.firebaseDisponible = true;
        
        console.log('✅ Firebase initialisé avec succès');
        mettreAJourStatutFirebase();

    } catch (error) {
        console.log('🔧 Mode hors ligne - Firebase non disponible:', error.message);
        window.firebaseDisponible = false;
        mettreAJourStatutFirebase();
    }
}

// Fonction pour mettre à jour l'affichage du statut
function mettreAJourStatutFirebase() {
    setTimeout(() => {
        const header = document.querySelector('header');
        if (!header) return;

        // Supprimer l'ancien statut s'il existe
        const ancienStatut = document.getElementById('statutFirebase');
        if (ancienStatut) {
            ancienStatut.remove();
        }

        const statutDiv = document.createElement('div');
        statutDiv.id = 'statutFirebase';
        statutDiv.style.marginTop = '10px';
        statutDiv.style.padding = '8px 16px';
        statutDiv.style.borderRadius = '20px';
        statutDiv.style.fontSize = '14px';
        statutDiv.style.fontWeight = 'bold';
        statutDiv.style.textAlign = 'center';
        statutDiv.style.display = 'inline-block';
        
        if (window.firebaseDisponible) {
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
async function migrerVersFirebase() {
    if (!window.firebaseDisponible || !window.db) {
        alert('❌ Firebase non disponible pour la migration');
        return;
    }

    console.log('🚀 Début de la migration vers Firebase...');
    
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
        
        for (const operation of operations) {
            try {
                await window.db.collection("operations").add({
                    ...operation,
                    migre: true,
                    dateMigration: new Date().toISOString()
                });
                count++;
            } catch (error) {
                console.error('Erreur migration:', error);
            }
        }
        
        alert(`✅ ${count} opérations migrées vers Firebase !`);
        console.log(`✅ ${count} opérations migrées`);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur lors de la migration');
    }
}

// Initialiser Firebase quand la page est chargée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserFirebase);
} else {
    initialiserFirebase();
}

// Ajouter les boutons après un délai
setTimeout(() => {
    const header = document.querySelector('header');
    if (!header || document.getElementById('boutonsMigration')) return;

    const divBoutons = document.createElement('div');
    divBoutons.id = 'boutonsMigration';
    divBoutons.style.marginTop = '15px';
    divBoutons.style.display = 'flex';
    divBoutons.style.gap = '10px';
    divBoutons.style.justifyContent = 'center';
    divBoutons.style.flexWrap = 'wrap';
    
    const btnMigrer = document.createElement('button');
    btnMigrer.textContent = '🔄 Migrer vers Firebase';
    btnMigrer.className = 'btn-warning';
    btnMigrer.onclick = migrerVersFirebase;
    
    divBoutons.appendChild(btnMigrer);
    header.appendChild(divBoutons);
    
    console.log('✅ Boutons de migration ajoutés');
}, 2000);

