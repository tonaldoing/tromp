// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB7sjv_-7FgL-1NgwAnfnbMPV51HHFcGjQ',
  authDomain: 'trompocostos-app.firebaseapp.com',
  projectId: 'trompocostos-app',
  storageBucket: 'trompocostos-app.firebasestorage.app',
  messagingSenderId: '1029611170284',
  appId: '1:1029611170284:web:980f8aa60097267e3738c9',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Exportamos la base de datos para usarla en toda la app
export const db = getFirestore(app)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
