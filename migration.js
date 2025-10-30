// migration.js - Script de migration des données
import { db, collection, addDoc, getDocs } from './firebase.js';

export async function migrerVersFirebase() {
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
                await addDoc(collection(db, 'operations'), {
                    ...operation,
                    migre: true,
                    dateMigration: new Date().toISOString(),
                    timestamp: operation.timestamp || new Date().toISOString()
                });
                count++;
            } catch (error) {
                console.error('Erreur migration opération:', operation.id, error);
                erreurs++;
            }
        }
        
        const message = `✅ Migration terminée !\n${count} opérations migrées\n${erreurs} erreurs`;
        console.log(message);
        alert(message);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur lors de la migration: ' + error.message);
    }
}

// Fonction pour vérifier les données Firebase
export async function verifierDonneesFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, 'operations'));
        const count = querySnapshot.size;
        alert(`📊 Firebase contient ${count} opérations`);
        return count;
    } catch (error) {
        console.error('Erreur vérification:', error);
        alert('❌ Erreur vérification Firebase');
        return 0;
    }
}
