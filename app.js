/* Styles d'authentification */
.user-info {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 10px 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border: 2px solid #3498db;
}

.user-info span {
    font-weight: 600;
    color: #2c3e50;
}

.operation-readonly .operation-actions {
    display: none !important;
}

.operation-readonly {
    background-color: #f8f9fa;
}

.operation-readonly:hover {
    background-color: #e9ecef;
}

.admin-badge {
    background: #e74c3c;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    margin-left: 5px;
}

/* Responsive pour l'info utilisateur */
@media (max-width: 768px) {
    .user-info {
        position: static;
        margin: 10px 0;
        justify-content: center;
    }
    
    header {
        text-align: center;
    }
}
