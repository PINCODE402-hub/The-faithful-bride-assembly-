import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from './app.js'; // Ensure app.js exports your initialized app

const auth = getAuth(app);
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html"; // Redirect back home
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});