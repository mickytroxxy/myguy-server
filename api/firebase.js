const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = require('./creds.json')
const firebaseConfig = {
    apiKey: "AIzaSyADeaY6ODRICSJoK4ThUXedwMrFwc2ZP40",
    authDomain: "myguy-a78d0.firebaseapp.com",
    projectId: "myguy-a78d0",
    storageBucket: "myguy-a78d0.appspot.com",
    messagingSenderId: "743810339840",
    appId: "1:743810339840:web:e9a54dd0e53c8cd61074e5"
};
initializeApp({
    credential: cert(firebaseConfig)
})

const db = getFirestore()

module.exports = { db }