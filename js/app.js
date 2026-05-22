// 1. IMPORT NECESSARY FIREBASE SDK FUNCTIONS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfs1eku9vRCMhg508T1VvwRaTp0PWohKo",
  authDomain: "the-faithful-bride-assembly.firebaseapp.com",
  projectId: "the-faithful-bride-assembly",
  storageBucket: "the-faithful-bride-assembly.firebasestorage.app",
  messagingSenderId: "256606008575",
  appId: "1:256606008575:web:9dbe76f9d9e2b1832b88ca",
  measurementId: "G-7W30KEGHKV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

function showNotification(message) {
    const toast = document.getElementById('notification-toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
        toastMsg.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Admin Lock Logic
    const adminGateBtn = document.getElementById('admin-gate-toggle');
    onAuthStateChanged(auth, (user) => {
        if (user) document.body.classList.add('admin-mode');
        else document.body.classList.remove('admin-mode');
    });

    if (adminGateBtn) {
        adminGateBtn.addEventListener('click', () => {
            if (auth.currentUser) {
                signOut(auth).then(() => {
                    showNotification("Logged out.");
                    window.location.reload();
                });
            } else {
                window.location.href = "login.html";
            }
        });
    }

    // Dark Mode Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }
    // In app.js, inside your DOMContentLoaded listener:
    onAuthStateChanged(auth, (user) => {
        const adminGateBtn = document.getElementById('admin-gate-toggle');
        const icon = adminGateBtn ? adminGateBtn.querySelector('i') : null;

        if (user) {
            document.body.classList.add('admin-mode');
            if (icon) {
                icon.classList.remove('fa-lock');
                icon.classList.add('fa-lock-open'); // Change to unlocked icon
            }
        } else {
            document.body.classList.remove('admin-mode');
            if (icon) {
                icon.classList.remove('fa-lock-open');
                icon.classList.add('fa-lock'); // Revert to locked icon
            }
        }
    });
});

export { db, showNotification, auth, app };
// Hamburger Menu Logic
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});