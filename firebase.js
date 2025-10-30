// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Configuration Firebase - REMPLACEZ PAR VOS VRAIES CLÉS
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "votre-app-id"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy };
