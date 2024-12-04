import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, query, where, getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyAQqE7ubbZF86JqL6QrNZwLV6PlQdRmawM',
    authDomain: 'ggrow-ae379.firebaseapp.com',
    projectId: 'ggrow-ae379',
    storageBucket: 'ggrow-ae379.appspot.com',
    messagingSenderId: '855280671020',
    appId: '1:855280671020:web:90ca99f28025a2b5097489'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById('employee-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const employeeId = document.getElementById('login-employee-id').value;

    try {
        // Authenticate user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Verify employee ID in Firestore
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('uid', '==', uid), where('employeeId', '==', employeeId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Store the authentication token in local storage
            localStorage.setItem('authToken', uid);
            // Redirect to welcome page upon successful login
            window.location.href = 'index.html';
        } else {
            alert('Invalid employee ID');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed: ' + error.message);
    }
});