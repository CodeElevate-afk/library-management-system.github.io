import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js';

// Your Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Request permission to send notifications
async function requestPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get registration token. Initially this makes a network call, once retrieved
            // subsequent calls to getToken will return from cache.
            const currentToken = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' });
            if (currentToken) {
                console.log('FCM registration token:', currentToken);
                // Send the token to your server and update the UI if necessary
                // ...
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while requesting permission:', error);
    }
}

requestPermission();

// Handle incoming messages
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // Customize notification here
    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon
    });
});

// DOM Elements
const booksTable = document.querySelector('#books-table tbody');
const usersTable = document.querySelector('#users-table tbody');
const borrowedBooksUl = document.querySelector('#borrowed-books-list');

// Event Listeners
document.getElementById('add-book-form').addEventListener('submit', addBook);
document.getElementById('add-user-form').addEventListener('submit', handleUserFormSubmit);
document.getElementById('lend-book-form').addEventListener('submit', lendBook);
document.getElementById('logout-btn').addEventListener('click', logoutUser); // Logout event listener

// Logout User Function
function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log('User logged out successfully');
            // Redirect to the login page or perform other post-logout actions
            window.location.href = '/login.html'; // Update with your login page path
        })
        .catch((error) => {
            console.error('Error logging out:', error);
        });
}



// Add Book
async function addBook(event) {
    event.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const year = document.getElementById('book-year').value;

    // Check if the book title already exists
    const titleQuery = query(collection(db, 'books'), where('title', '==', title));
    const titleSnapshot = await getDocs(titleQuery);

    if (!titleSnapshot.empty) {
        console.log("Book with this title already exists.");
        alert("A book with this title already exists. Please enter a different title.");
        return;
    }

    try {
        await addDoc(collection(db, 'books'), { title, author, year });
        console.log("Book added successfully");
        updateBookTable();
    } catch (error) {
        console.error("Error adding book: ", error);
    }
}

// Fetch Borrowed Books
async function fetchBorrowedBooks() {
    const borrowedBooks = [];
    try {
        const querySnapshot = await getDocs(collection(db, 'borrowedBooks'));
        querySnapshot.forEach(doc => {
            borrowedBooks.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Error fetching borrowed books: ", error);
    }
    return borrowedBooks;
}

// Update Book Table
async function updateBookTable() {
    booksTable.innerHTML = '';
    const borrowedBooks = await fetchBorrowedBooks();

    try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        if (querySnapshot.empty) {
            booksTable.innerHTML = '<tr><td colspan="5">No books available.</td></tr>';
            return;
        }

        querySnapshot.forEach(doc => {
            const book = doc.data();
            const row = booksTable.insertRow();
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.year}</td>
                <td>${borrowedBooks.some(b => b.bookTitle === book.title) ? '🔴 Borrowed' : '🟢 Available'}</td>
                <td>
                    <button class="edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                </td>
            `;
        });
    } catch (error) {
        console.error("Error fetching books: ", error);
    }
}

booksTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        deleteBook(id);
    } else if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        populateBookForm(id);
    }
});

document.getElementById('update-book-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('update-book-id').value;
    updateBook(id);
});

// Populate Book Form for Editing
async function populateBookForm(id) {
    try {
        const bookRef = doc(db, 'books', id);
        const bookSnap = await getDoc(bookRef);
        const book = bookSnap.data();
        if (book) {
            document.getElementById('update-book-id').value = id;
            document.getElementById('update-book-title').value = book.title;
            document.getElementById('update-book-author').value = book.author;
            document.getElementById('update-book-year').value = book.year;
            document.getElementById('update-book-form').style.display = 'block';
        }
    } catch (error) {
        console.error("Error populating book form: ", error);
    }
}

// Delete Book
async function deleteBook(id) {
    if (confirm("Are you sure you want to delete this book?")) {
        try {
            await deleteDoc(doc(db, 'books', id));
            console.log("Book deleted successfully");
            updateBookTable();
        } catch (error) {
            console.error("Error deleting book: ", error);
        }
    }
}

// Handle User Form Submission
async function handleUserFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('add-user-form').dataset.updateId;

    if (id) {
        // Update existing user
        await updateUser(id);
    } else {
        // Add new user
        await addUser();
    }
}

// Add User
async function addUser() {
    const studentUid = document.getElementById('student-uid').value;
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const email = document.getElementById('user-email').value;

    // Check for duplicate user based on UID, Name, Phone, or Email
    const uidQuery = query(collection(db, 'users'), where('studentUid', '==', studentUid));
    const nameQuery = query(collection(db, 'users'), where('name', '==', name));
    const phoneQuery = query(collection(db, 'users'), where('phone', '==', phone));
    const emailQuery = query(collection(db, 'users'), where('email', '==', email));

    const [uidSnapshot, nameSnapshot, phoneSnapshot, emailSnapshot] = await Promise.all([
        getDocs(uidQuery),
        getDocs(nameQuery),
        getDocs(phoneQuery),
        getDocs(emailQuery)
    ]);

    if (!uidSnapshot.empty || !nameSnapshot.empty || !phoneSnapshot.empty || !emailSnapshot.empty) {
        console.log("User with similar details already exists");
        alert("User with similar details already exists.");
        return;
    }

    try {
        await addDoc(collection(db, 'users'), { studentUid, name, phone, email });
        console.log("User added successfully");
        resetUserForm();
        updateUserList();
    } catch (error) {
        console.error("Error adding user: ", error);
    }
}

// Reset User Form
function resetUserForm() {
    document.getElementById('add-user-form').reset();
    document.getElementById('add-user-form').removeAttribute('data-update-id');
    document.getElementById('add-user-form').querySelector('button[type="submit"]').textContent = 'Add User';
}

// Update User
async function updateUser(id) {
    if (confirm("Are you sure you want to update this user's details?")) {
        const studentUid = document.getElementById('update-student-uid').value;
        const name = document.getElementById('update-user-name').value;
        const phone = document.getElementById('update-user-phone').value;
        const email = document.getElementById('update-user-email').value;

        if (studentUid && name && phone && email) {
            try {
                const userRef = doc(db, 'users', id);
                await updateDoc(userRef, { studentUid, name, phone, email });
                console.log("User updated successfully");
                document.getElementById('update-user-form').style.display = 'none';
                updateUserList();
            } catch (error) {
                console.error("Error updating user: ", error);
            }
        } else {
            alert("All fields are required.");
        }
    }
}

document.getElementById('update-user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('update-user-id').value;
    updateUser(id);
});

// Delete User
async function deleteUser(id) {
    try {
        await deleteDoc(doc(db, 'users', id));
        console.log("User deleted successfully");
        updateUserList();
    } catch (error) {
        console.error("Error deleting user: ", error);
    }
}

async function lendBook(event) {
    event.preventDefault();
    const bookTitle = document.getElementById("lend-book-title").value;
    const studentUid = document.getElementById("lend-user-name").value;

    try {
      // Check if the book exists in the database
      const bookQuery = query(collection(db, "books"), where("title", "==", bookTitle));
      const bookSnapshot = await getDocs(bookQuery);
      if (bookSnapshot.empty) {
        console.log("Book not found in the database.");
        alert("Book not found in the database.");
        return;
      }

      // Check if the student exists
      const userQuery = query(collection(db, "users"), where("studentUid", "==", studentUid));
      const userSnapshot = await getDocs(userQuery);
      if (userSnapshot.empty) {
        console.log("Invalid student ID.");
        alert("Invalid student ID.");
        return;
      }

      // Check if the book is already borrowed
      const borrowedBooks = await fetchBorrowedBooks();
      const bookAlreadyBorrowed = borrowedBooks.some(
        (book) => book.bookTitle === bookTitle
      );
      if (bookAlreadyBorrowed) {
        console.log("Book already borrowed.");
        alert("Book already borrowed.");
        return;
      }

      // Check if the student has already borrowed a book
      const booksBorrowedByStudent = borrowedBooks.filter(
        (book) => book.userName === studentUid
      );
      if (booksBorrowedByStudent.length >= 1) {
        console.log("Student has already borrowed a book.");
        alert("Student has already borrowed a book.");
        return;
      }

      // Lend the book
      const timestamp = new Date().toISOString();
      await addDoc(collection(db, "borrowedBooks"), {
        bookTitle,
        userName: userSnapshot.docs[0].data().name,
        timestamp,
      });
      console.log("Book lent successfully");
      updateBorrowedBooks();
    } catch (error) {
      console.error("Error lending book: ", error);
    }
}
// Return Book
async function returnBook(id) {
    try {
      await deleteDoc(doc(db, 'borrowedBooks', id));
      console.log("Book returned successfully");
  
      // Update book status to "Available"
      const bookTitle = await getBookTitleFromBorrowedBookId(id);
      const bookRef = doc(db, 'books', await getBookIdFromTitle(bookTitle));
      await updateDoc(bookRef, { status: 'Available' });
  
      updateBorrowedBooks();
    } catch (error) {
      console.error("Error returning book: ", error);
    }
  }
  
  // Helper function to get book title from borrowed book ID
  async function getBookTitleFromBorrowedBookId(id) {
    const borrowedBookRef = doc(db, 'borrowedBooks', id);
    const borrowedBookSnap = await getDoc(borrowedBookRef);
    return borrowedBookSnap.data().bookTitle;
  }
  
  // Helper function to get book ID from title
  async function getBookIdFromTitle(title) {
    const bookQuery = query(collection(db, 'books'), where('title', '==', title));
    const bookSnapshot = await getDocs(bookQuery);
    return bookSnapshot.docs[0].id;
  }

  async function updateBorrowedBooks() {
    const borrowedBooksTable = document.querySelector('#borrowed-books-table tbody');
    borrowedBooksTable.innerHTML = ''; // Clear existing table rows
  
    try {
        const querySnapshot = await getDocs(collection(db, 'borrowedBooks'));
        if (querySnapshot.empty) {
            borrowedBooksTable.innerHTML = '<tr><td colspan="6">No borrowed books.</td></tr>';
            return;
        }

        // Collect promises to resolve user data concurrently
        const borrowedBooks = querySnapshot.docs.map(doc => {
            const borrowedBook = doc.data();
            const borrowDate = new Date(borrowedBook.timestamp);
            const currentDate = new Date();
            const daysKept = Math.ceil((currentDate - borrowDate) / (1000 * 60 * 60 * 24));
            let penalty = '';
            let penaltyIcon = '';

            if (daysKept > 30) {
                penalty = '500';
                penaltyIcon = '🔴';  // Red icon indicating penalty
            } else {
                penalty = '0';
                penaltyIcon = '🟢';  // No icon
            }

            // Display the student ID from the borrowedBook data
            const studentUid = borrowedBook.userName;

            // Construct row data
            return {
                id: doc.id,
                bookTitle: borrowedBook.bookTitle,
                studentUid,
                borrowDate: borrowDate.toLocaleDateString(),
                daysKept,
                penalty,
                penaltyIcon
            };
        });

        // Wait for all promises to resolve
        const borrowedBooksData = await Promise.all(borrowedBooks);

        borrowedBooksData.forEach(bookData => {
            const row = borrowedBooksTable.insertRow();
            row.innerHTML = `
                <td>${bookData.bookTitle}</td>
                <td>${bookData.studentUid}</td>
                <td>${bookData.borrowDate}</td>
                <td>${bookData.daysKept}</td>
                <td>${bookData.penaltyIcon} ${bookData.penalty}</td>
                <td>
                    <button class="return-btn" data-id="${bookData.id}">Return</button>
                </td>
            `;
        });
    } catch (error) {
        console.error("Error fetching borrowed books: ", error);
    }
}


// Handle Return Button Click
document.querySelector('#borrowed-books-table').addEventListener('click', async (e) => {
    if (e.target.classList.contains('return-btn')) {
        const id = e.target.dataset.id;
        await returnBook(id);
    }
});



// Update User List
async function updateUserList() {
    usersTable.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        if (querySnapshot.empty) {
            usersTable.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
            return;
        }

        querySnapshot.forEach(doc => {
            const user = doc.data();
            const row = usersTable.insertRow();
            row.innerHTML = `
                <td>${user.studentUid}</td>
                <td>${user.name}</td>
                <td>${user.phone}</td>
                <td>${user.email}</td>
                <td>
                    <button class="edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                </td>
            `;
        });
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
}

usersTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        deleteUser(id);
    } else if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        populateUserForm(id);
    }
});

// Update Book
async function updateBook(id) {
    console.log(`Update book called with ID: ${id}`);
    if (confirm("Are you sure you want to update this book's details?")) {
        const title = document.getElementById('update-book-title').value;
        const author = document.getElementById('update-book-author').value;
        const year = document.getElementById('update-book-year').value;

        console.log(`Form values: title=${title}, author=${author}, year=${year}`);

        if (title && author && year) {
            try {
                const bookRef = doc(db, 'books', id);
                console.log(`Book ref: ${bookRef}`);
                console.log(`Updating book with data: { title: ${title}, author: ${author}, year: ${year} }`);
                await updateDoc(bookRef, { title, author, year });
                console.log("Book updated successfully");
                document.getElementById('update-book-form').style.display = 'none';
                updateBookTable();
            } catch (error) {
                console.error("Error updating book: ", error);
            }
        } else {
            alert("All fields are required.");
        }
    }
}
// Populate User Form for Editing
async function populateUserForm(id) {
    try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        const user = userSnap.data();
        if (user) {
            document.getElementById('update-user-id').value = id;
            document.getElementById('update-student-uid').value = user.studentUid;
            document.getElementById('update-user-name').value = user.name;
            document.getElementById('update-user-phone').value = user.phone;
            document.getElementById('update-user-email').value = user.email;
            document.getElementById('update-user-form').style.display = 'block';
        }
    } catch (error) {
        console.error("Error populating user form: ", error);
    }
}

// Initial Data Load
updateBookTable();
updateUserList();
updateBorrowedBooks();

async function getCurrentUser(uid) {
    try {
      const userRef = doc(db, 'employees', uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      console.log('Current user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }

async function updateUserInfo(uid) {
    try {
      const userData = await getCurrentUser(uid);
      if (userData) {
        document.getElementById('user-id').textContent = `Employee ID: ${userData.employeeId}`;
        document.getElementById('user-name').textContent = `Name: ${userData.name}`;
        document.getElementById('last-login-date').textContent = `Last Login: ${userData.lastLoginDate}`;
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  }
  
onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      const uid = user.uid;
      console.log('User is signed in:', uid);
      updateUserInfo(uid);
    } else {
      // User is signed out
      console.log('User is signed out');
    }
  });


 // Logout function
async function logout() {
    try {
      await signOut(auth);
      window.location.href = 'welcome.html'; // Redirect to welcome page
    } catch (error) {
      console.error('Error logging out:', error);
    }
}

  // Add event listener to logout button
document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Update user info section on page load
  updateUserInfo();

// Update last login date when user logs in
const userRef = doc(db, 'employees', uid);
await updateDoc(userRef, { lastLoginDate: new Date().toISOString() });

// Check for authentication token on page load
const authToken = localStorage.getItem('authToken');

if (!authToken) {
  window.location.href = 'welcome.html'; // Redirect to welcome page if no token
}

// Verify the authentication token
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'welcome.html'; // Redirect to welcome page if token is invalid
  }
});

// Session Timer: Redirect after 1 minute of inactivity
let timer;
const redirectTime = 60000; // 1 minute in milliseconds

function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(() => {
        alert('You have been inactive for 1 minute. Redirecting...');
        window.location.href = 'welcome.html'; // Redirect to logout or another page
    }, redirectTime);
}

// Events that reset the timer
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeypress = resetTimer;
document.onscroll = resetTimer;
document.ontouchstart = resetTimer;
