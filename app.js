// app.js - VERSION ULTRA SIMPLIFIÉE SANS ERREURS
class GestionFerme {
    constructor() {
        this.operations = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.updateStats();
        this.afficherHistorique('global');
        console.log('✅ Application initialisée');
    }

    setupEventListeners() {
        // Formulaire principal
        const saisieForm = document.getElementById('saisieForm');
        if (saisieForm) {
            saisieForm.addEventListener('submit', (e) => this.ajouterOperation(e));
        }

        // Bouton reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetForm());
        }

        // Onglets
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vue = e.target.getAttribute('data-sheet');
                this.afficherHistorique(vue);
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    ajouterOperation(e) {
        e.preventDefault();
        console.log('✅ Formulaire soumis');

        // Récupérer les valeurs du formulaire
        const operateur = document.getElementById('operateur').value;
        const groupe = document.getElementById('groupe').value;
        const typeOperation = document.getElementById('typeOperation').value;
        const typeTransaction = document.getElementById('typeTransaction').value;
        const caisse = document.getElementById('caisse').value;
        const montant = parseFloat(document.getElementById('montant').value);
        const description = document.getElementById('description').value;

        // Validation simple
        if (montant <= 0 || isNaN(montant)) {
            alert('Le montant doit être supérieur à 0');
            return;
        }

        if (!description) {
            alert('Veuillez saisir une description');
            return;
        }

        // Créer l'opération
        const nouvelleOperation = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            operateur: operateur,
            groupe: groupe,
            typeOperation: typeOperation,
            typeTransaction: typeTransaction,
            caisse: caisse,
            description: description,
            montant: typeTransaction === 'frais' ? -montant : montant,
            timestamp: new Date().toISOString()
        };

        // Ajouter aux opérations
        this.operations.unshift(nouvelleOperation);

        // Sauvegarder
        this.sauvegarderLocal();

        // Mettre à jour l'interface
        this.afficherMessageSucces('Opération enregistrée avec succès !');
        this.resetForm();
        this.updateStats();
        this.afficherHistorique('global');
    }

    resetForm() {
        document.getElementById('saisieForm').reset();
    }

    afficherMessageSucces(message) {
        alert(message); // Version simple pour tester
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('gestion_ferme_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                console.log('📁 ' + this.operations.length + ' opérations chargées');
            } catch (error) {
                console.error('Erreur chargement:', error);
                this.operations = [];
            }
        }
    }

    sauvegarderLocal() {
        const data = {
            operations: this.operations,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('gestion_ferme_data', JSON.stringify(data));
    }

    updateStats() {
        console.log('📊 Mise à jour des statistiques');
        // Version simplifiée pour tester
    }

    afficherHistorique(vue) {
        const dataDisplay = document.getElementById('dataDisplay');
        if (!dataDisplay) return;

        let operationsFiltrees = this.operations;

        if (vue !== 'global') {
            operationsFiltrees = this.operations.filter(op => 
                op.groupe === vue || op.operateur === vue
            );
        }

        if (operationsFiltrees.length === 0) {
            dataDisplay.innerHTML = '<div class="empty-message">Aucune opération trouvée</div>';
            return;
        }

        let html = '<table class="data-table"><thead><tr>';
        html += '<th>Date</th><th>Opérateur</th><th>Groupe</th><th>Type</th>';
        html += '<th>Transaction</th><th>Caisse</th><th>Montant</th><th>Description</th>';
        html += '</tr></thead><tbody>';

        operationsFiltrees.forEach(op => {
            html += '<tr>';
            html += '<td>' + this.formaterDate(op.date) + '</td>';
            html += '<td>' + this.formaterOperateur(op.operateur) + '</td>';
            html += '<td>' + this.formaterGroupe(op.groupe) + '</td>';
            html += '<td>' + this.formaterTypeOperation(op.typeOperation) + '</td>';
            html += '<td class="type-' + op.typeTransaction + '">' + this.formaterTypeTransaction(op.typeTransaction) + '</td>';
            html += '<td>' + this.formaterCaisse(op.caisse) + '</td>';
            html += '<td class="' + (op.montant >= 0 ? 'type-revenu' : 'type-frais') + '">';
            html += op.montant.toFixed(2) + ' DH</td>';
            html += '<td>' + op.description + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        dataDisplay.innerHTML = html;
    }

    formaterDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    formaterOperateur(operateur) {
        const operateurs = {
            'abdel': '👨‍💼 Abdel',
            'omar': '👨‍💻 Omar', 
            'hicham': '👨‍🔧 Hicham'
        };
        return operateurs[operateur] || operateur;
    }

    formaterGroupe(groupe) {
        const groupes = {
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain'
        };
        return groupes[groupe] || groupe;
    }

    formaterTypeOperation(type) {
        const types = {
            'travailleur_global': '🌍 Travailleur global',
            'zaitoun': '🫒 Zaitoun',
            '3commain': '🔧 3 Commain',
            'autre': '📝 Autre'
        };
        return types[type] || type;
    }

    formaterTypeTransaction(type) {
        return type === 'revenu' ? '💰 Revenu' : '💸 Frais';
    }

    formaterCaisse(caisse) {
        const caisses = {
            'abdel_caisse': '👨‍💼 Caisse Abdel',
            'omar_caisse': '👨‍💻 Caisse Omar',
            'hicham_caisse': '👨‍🔧 Caisse Hicham',
            'zaitoun_caisse': '🫒 Caisse Zaitoun', 
            '3commain_caisse': '🔧 Caisse 3 Commain'
        };
        return caisses[caisse] || caisse;
    }
}

// Initialisation
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new GestionFerme();
});
