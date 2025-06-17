// Firebase SDKs - imported from CDN in the HTML
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'chloeandnathan-67187' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
    apiKey: "AIzaSyCYKEmD6--PY0G_nvtY0zEmKJrTxbpd44k",
    authDomain: "chloeandnathan-67187.firebaseapp.com",
    projectId: "chloeandnathan-67187",
    storageBucket: "chloeandnathan-67187.firebasestorage.app",
    messagingSenderId: "45564750937",
    appId: "1:45564750937:web:42fd3ef0288ca85ad05548",
    measurementId: "G-KRC51N25VB"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


let db;
let auth;
let currentUserId = 'anonymous'; // Default for display until authenticated

// Function to show custom message box
function showMessageBox(message) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxOk = document.getElementById('messageBoxOk');

    messageBoxText.textContent = message;
    messageBox.style.display = 'block';

    messageBoxOk.onclick = () => {
        messageBox.style.display = 'none';
    };
}

// Initialize Firebase
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Handle authentication state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            document.getElementById('userIdDisplay').textContent = currentUserId;
            // Only set up the listener once authenticated
            setupShoppingListListener();
        } else {
            try {
                // Sign in with custom token if available, otherwise anonymously
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase Auth Error:", error);
                showMessageBox("Authentication failed: " + error.message);
            }
        }
    });

} catch (error) {
    console.error("Firebase Initialization Error:", error);
    showMessageBox("Firebase initialization failed: " + error.message);
}

// --- Shopping List Functions ---

// Real-time listener for shopping list changes from Firestore
function setupShoppingListListener() {
    // Reference to the public shopping list collection
    const shoppingListRef = collection(db, `artifacts/${appId}/public/data/shoppingList`);
    // Create a query to order items by timestamp (most recent first)
    const q = query(shoppingListRef, orderBy('timestamp', 'desc'));

    // Set up a real-time listener using onSnapshot
    onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
            // Map each document to an item object including its ID
            items.push({ id: doc.id, ...doc.data() });
        });
        // Render the fetched items to the UI
        renderShoppingList(items);
    }, (error) => {
        console.error("Error fetching shopping list:", error);
        showMessageBox("Error loading shopping list: " + error.message);
    });
}

// Render the shopping list items to the HTML UL element
function renderShoppingList(items) {
    const shoppingListUl = document.getElementById('shoppingList');
    shoppingListUl.innerHTML = ''; // Clear existing items before re-rendering

    if (items.length === 0) {
        shoppingListUl.innerHTML = '<p class="loading-message">No items in the list yet. Add one!</p>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.setAttribute('data-id', item.id); // Store Firestore document ID on the list item
        if (item.completed) {
            li.classList.add('completed'); // Add class for styling completed items
        }

        const itemText = document.createElement('span');
        itemText.classList.add('item-text');
        itemText.textContent = item.item; // Display the item name

        const itemDetails = document.createElement('span');
        itemDetails.classList.add('item-details');
        // Display who added the item (truncated UID) and when
        const addedByText = item.addedBy ? `(Added by: ${item.addedBy.substring(0, 8)}...)` : '';
        const timestampText = item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : '';
        itemDetails.textContent = `${addedByText} ${timestampText}`;

        const itemActions = document.createElement('div');
        itemActions.classList.add('item-actions');

        // Toggle complete/incomplete button
        if (!item.completed) {
            const completeButton = document.createElement('button');
            completeButton.innerHTML = '✅'; // Checkmark emoji
            completeButton.title = 'Mark as completed';
            completeButton.onclick = () => toggleItemCompleted(item.id, true);
            itemActions.appendChild(completeButton);
        } else {
            const uncompleteButton = document.createElement('button');
            uncompleteButton.innerHTML = '🔄'; // Refresh emoji for unmarking
            uncompleteButton.title = 'Mark as incomplete';
            uncompleteButton.onclick = () => toggleItemCompleted(item.id, false);
            itemActions.appendChild(uncompleteButton);
        }

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️'; // Trash can emoji
        deleteButton.title = 'Delete item';
        deleteButton.onclick = () => deleteShoppingItem(item.id);
        itemActions.appendChild(deleteButton);

        // Append all elements to the list item and then to the UL
        li.appendChild(itemText);
        li.appendChild(itemDetails);
        li.appendChild(itemActions);
        shoppingListUl.appendChild(li);
    });
}

// Event listener for adding a new shopping item
document.getElementById('addItemButton').addEventListener('click', async () => {
    const newItemInput = document.getElementById('newItemInput');
    const itemText = newItemInput.value.trim();

    // Ensure item text is not empty and Firebase is initialized/authenticated
    if (itemText && db && currentUserId) {
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/shoppingList`), {
                item: itemText,
                addedBy: currentUserId,
                timestamp: new Date(), // Store current timestamp for ordering
                completed: false // New items are not completed by default
            });
            newItemInput.value = ''; // Clear input field after adding
        } catch (e) {
            console.error("Error adding document: ", e);
            showMessageBox("Error adding item: " + e.message);
        }
    } else if (!itemText) {
        showMessageBox("Please enter an item name.");
    } else {
        showMessageBox("Firebase not ready. Please try again.");
    }
});

// Function to delete a shopping item by its Firestore document ID
async function deleteShoppingItem(id) {
    if (db) {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/shoppingList`, id));
        } catch (e) {
            console.error("Error deleting document: ", e);
            showMessageBox("Error deleting item: " + e.message);
        }
    } else {
        showMessageBox("Firebase not ready.");
    }
}

// Function to toggle the completion status of a shopping item
async function toggleItemCompleted(id, status) {
    if (db) {
        try {
            const itemRef = doc(db, `artifacts/${appId}/public/data/shoppingList`, id);
            await updateDoc(itemRef, {
                completed: status // Update the 'completed' field to the new status
            });
        } catch (e) {
            console.error("Error updating document: ", e);
            showMessageBox("Error updating item status: " + e.message);
        }
    } else {
        showMessageBox("Firebase not ready.");
    }
}
