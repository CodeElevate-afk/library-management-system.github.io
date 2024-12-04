import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyAQqE7ubbZF86JqL6QrNZwLV6PlQdRmawM',
    authDomain: 'ggrow-ae379.firebaseapp.com',
    projectId: 'ggrow-ae379',
    storageBucket: 'ggrow-ae379.appspot.com',
    messagingSenderId: '855280671020',
    appId: '1:855280671020:web:90ca99f28025a2b5097489'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Password obfuscation
const obfuscatedPassword = btoa('m$wp*Wjv>$!:RJq&'); // Base64 encode the password

// Function to decode the password
function decodePassword(encodedPassword) {
    return atob(encodedPassword); // Base64 decode the password
}

// Password protection on page load
document.addEventListener('DOMContentLoaded', () => {
    const userInput = prompt('Enter the password to access this page:');
    const correctPassword = decodePassword(obfuscatedPassword);

    if (userInput !== correctPassword) {
        alert('Incorrect password.');
        window.location.href = 'redirect.html'; // Redirect to a different page if password is incorrect
    } else {
        loadEmployees(); // Load employees if password is correct
    }
});

async function loadEmployees() {
    const employeeTableBody = document.querySelector('#employee-table tbody');
    employeeTableBody.innerHTML = ''; // Clear existing rows

    try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        querySnapshot.forEach((docSnapshot) => {
            const employee = docSnapshot.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.employeeId}</td>
                <td>${employee.email}</td>
                <td>
                    <button class="edit-button" data-id="${docSnapshot.id}">Edit</button>
                    <button class="delete-button" data-id="${docSnapshot.id}">Delete</button>
                </td>
            `;
            employeeTableBody.appendChild(row);
        });

        // Add event listeners to the buttons
        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach((button) => {
            button.addEventListener('click', () => {
                openEditModal(button.getAttribute('data-id'));
            });
        });

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach((button) => {
            button.addEventListener('click', () => {
                deleteEmployee(button.getAttribute('data-id'));
            });
        });
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Function to open the edit modal
async function openEditModal(id) {
    const employeeRef = doc(db, 'employees', id);

    // Fetch employee details
    try {
        const docSnapshot = await getDoc(employeeRef);
        const employee = docSnapshot.data();
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-name').value = employee.name;
        document.getElementById('edit-employee-id').value = employee.employeeId;
        document.getElementById('edit-email').value = employee.email;

        // Show the modal
        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching employee details:', error);
    }
}

// Function to close the edit modal
document.getElementById('closeModal').onclick = () => {
    document.getElementById('editModal').style.display = 'none';
};

// Function to delete an employee
async function deleteEmployee(id) {
    try {
        await deleteDoc(doc(db, 'employees', id));
        alert('Employee deleted successfully!');
        loadEmployees(); // Refresh employee list
    } catch (error) {
        console.error('Error deleting employee:', error);
    }
}

// Function to handle edit form submission
document.getElementById('edit-employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const employeeId = document.getElementById('edit-employee-id').value;
    const email = document.getElementById('edit-email').value;

    try {
        await updateDoc(doc(db, 'employees', id), {
            name,
            employeeId,
            email
        });
        alert('Employee updated successfully!');
        document.getElementById('editModal').style.display = 'none';
        loadEmployees(); // Refresh employee list
    } catch (error) {
        console.error('Error updating employee:', error);
        alert('Error updating employee: ' + error.message);
    }
});

// Handle form submission for registration
document.getElementById('register-employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('employee-name').value;
    const employeeId = document.getElementById('employee-id').value;
    const email = document.getElementById('employee-email').value;
    const password = document.getElementById('employee-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'employees'), {
            uid: userCredential.user.uid,
            name,
            employeeId,
            email
        });
        alert('Employee registered successfully!');
        loadEmployees(); // Refresh employee list
    } catch (error) {
        console.error('Error registering employee:', error);
        alert('Error registering employee: ' + error.message);
    }
});

let inactivityTime = 60000; // 1 minute
let inactivityTimer;

// Reset the timer when user interacts with the page
function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, inactivityTime);
}

// Log the user out by redirecting
function logout() {
    alert("You have been inactive for 1 minute. Redirecting...");
    window.location.href = "welcome.html"; // Change this to your desired URL
}

// Detect user activity
window.onload = resetTimer;
window.onmousemove = resetTimer;
window.onmousedown = resetTimer; // Detects mouse clicks
window.ontouchstart = resetTimer; // Detects touch screen taps
window.onclick = resetTimer; // Detects clicks
window.onkeypress = resetTimer; // Detects keyboard actions
window.onscroll = resetTimer; // Detects scrolling

// Start the timer
resetTimer();
