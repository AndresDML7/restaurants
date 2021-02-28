import firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyB2O72ckg-wqLszrVqZo8RyZNwR1SiNR58",
    authDomain: "restaurants-7c22c.firebaseapp.com",
    projectId: "restaurants-7c22c",
    storageBucket: "restaurants-7c22c.appspot.com",
    messagingSenderId: "63819860747",
    appId: "1:63819860747:web:00547a0303e9cf6c77f00e"
  };

  export const firebaseApp = firebase.initializeApp(firebaseConfig);