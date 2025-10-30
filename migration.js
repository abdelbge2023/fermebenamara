// migration.js - Version simplifiée
export async function migrerVersFirebase() {
    console.log('🚀 Début de la migration vers Firebase...');
    
    // Charger les données existantes du localStorage
    const saved = localStorage.getItem('gestion_ferme_data');
    if (!saved) {
        alert('❌ Aucune donnée trouvée dans le localStorage');
        return;
    }
    
    try {
        const { db, collection, addDoc } = await import('./firebase.js');
        
        if (!db) {
            alert('❌ Firebase non configuré');
            return;
        }
        
        const data = JSON.parse(saved);
        const operations = data.operations || [];
        
        if (operations.length === 0) {
            alert('❌ Aucune opération à migrer');
            return;
        }
        
        let count = 0;
        
        for (const operation of operations) {
            await addDoc(collection(db, 'operations'), {
                ...operation,
                migre: true,
                dateMigration: new Date().toISOString()
            });
            count++;
        }
        
        alert(`✅ ${count} opérations migrées vers Firebase !`);
        console.log(`✅ ${count} opérations migrées`);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        alert('❌ Erreur migration: ' + error.message);
    }
}
