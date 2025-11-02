// reset-app.js - Script de réinitialisation de l'application
function resetApplication() {
    console.log('🚀 Début de la réinitialisation...');
    
    // 1. Supprimer le localStorage
    localStorage.clear();
    console.log('✅ localStorage vidé');
    
    // 2. Supprimer le sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage vidé');
    
    // 3. Supprimer les cookies de l'application
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    console.log('✅ Cookies supprimés');
    
    // 4. Tentative de suppression IndexedDB (Firebase)
    if (window.indexedDB) {
        indexedDB.databases().then(databases => {
            databases.forEach(db => {
                if (db.name.includes('firebase') || db.name.includes('FermeBenamara')) {
                    indexedDB.deleteDatabase(db.name);
                    console.log('🗑️ Base de données supprimée:', db.name);
                }
            });
        }).catch(console.error);
    }
    
    // 5. Recharger la page
    console.log('🔄 Redémarrage de l\'application...');
    setTimeout(() => {
        window.location.reload(true); // Rechargement forcé
    }, 1000);
    
    return 'Réinitialisation terminée! La page va redémarrer.';
}

// Exécution automatique avec confirmation
if (confirm('⚠️ Voulez-vous réinitialiser complètement l\'application?\nCela supprimera toutes les données locales.')) {
    const result = resetApplication();
    alert(result);
} else {
    alert('Réinitialisation annulée.');
}
