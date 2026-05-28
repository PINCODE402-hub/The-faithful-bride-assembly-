// 1. IMPORT NECESSARY FIREBASE SDK FUNCTIONS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// Added doc and setDoc to handle clean subscription indexing
import { getFirestore, collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Added onMessage to intercept live notifications when the web tab is open
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

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
const messaging = getMessaging(app);

// Helper: Show Notification
function showNotification(message) {
    const toast = document.getElementById('notification-toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
        toastMsg.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }
}

// INTERCEPT FOREGROUND MESSAGES LIVE
// This fires when a user is actively browsing your site and a new event or announcement is pushed
onMessage(messaging, (payload) => {
    console.log('[app.js] Foreground push notification received: ', payload);
    if (payload.notification) {
        // Leverages your custom toast UI to display the push notification smoothly
        showNotification(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
    }
});

// FUNCTION: Load Announcements
async function loadAnnouncements() {
    const listElement = document.getElementById('announcements-list');
    if (!listElement) return;

    try {
        const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        listElement.innerHTML = ""; 
        
        if (querySnapshot.empty) {
            listElement.innerHTML = "<p>No recent announcements.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'announcement-card';
            
            const isAdmin = document.body.classList.contains('admin-mode');

            div.innerHTML = `
                <h3>${data.title}</h3>
                <p>${data.content}</p>
                ${isAdmin ? `<button class="delete-announce-btn" data-id="${doc.id}" data-collection="announcements">Delete</button>` : ''}
            `;
            listElement.appendChild(div);
        });
    } catch (err) {
        console.error("Error loading announcements:", err);
        listElement.innerHTML = "<p>Failed to load announcements.</p>";
    }
}

// MAIN INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    // 0. Load Announcements
    loadAnnouncements();

    // 1. Service Worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (err) { console.error('SW registration failed:', err); }
    }

    // 2. Admin/Auth & Visibility Logic
    const adminGateBtn = document.getElementById('admin-gate-toggle');
    const adminSection = document.getElementById('admin-announce-section');

    onAuthStateChanged(auth, (user) => {
        const icon = adminGateBtn ? adminGateBtn.querySelector('i') : null;
        
        if (user) {
            document.body.classList.add('admin-mode');
            if (adminSection) adminSection.style.display = "block"; 
            if (icon) { icon.classList.remove('fa-lock'); icon.classList.add('fa-lock-open'); }
        } else {
            document.body.classList.remove('admin-mode');
            if (adminSection) adminSection.style.display = "none";  
            if (icon) { icon.classList.remove('fa-lock-open'); icon.classList.add('fa-lock'); }
        }
    });

    if (adminGateBtn) {
        adminGateBtn.addEventListener('click', () => {
            if (auth.currentUser) {
                signOut(auth).then(() => { window.location.reload(); });
            } else {
                window.location.href = "login.html";
            }
        });
    }

    // 3. Hamburger & Theme Logic
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // 4. Notification Subscription Logic
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const swRegistration = await navigator.serviceWorker.ready;
                    const token = await getToken(messaging, { 
                        vapidKey: 'BJkz7-z6lrTedtaMYAfmX0et_TgIdPedXXiQS2ZDAzIJ4YM5P_74RFB8OhHAs4W2uuR71d1SR108f7AYOTtvIWo',
                        serviceWorkerRegistration: swRegistration
                    });
                    
                    // FIXED: Uses token as unique document reference to stop duplicate database pollution
                    await setDoc(doc(db, "subscribers", token), { 
                        token: token, 
                        timestamp: serverTimestamp() 
                    });
                    
                    alert("You are now subscribed to updates!");
                }
            } catch (err) {
                console.error("Subscription error:", err);
                alert("Subscription failed.");
            }
        });
    }

    // 5. Post Announcement Logic
    const postBtn = document.getElementById('post-announce-btn');
    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const title = document.getElementById('announce-title').value;
            const content = document.getElementById('announce-content').value;
            if (!title || !content) return alert("Please fill in both fields!");

            try {
                await addDoc(collection(db, "announcements"), { title, content, timestamp: serverTimestamp() });
                alert("Announcement Published!");
                document.getElementById('announce-title').value = "";
                document.getElementById('announce-content').value = "";
                loadAnnouncements(); 
            } catch (error) { console.error(error); alert("Failed to post."); }
        });
    }
    // 6. Delete Announcement Logic
    document.body.addEventListener('click', async (e) => {
        // Only trigger if the clicked element has the delete class
        if (e.target.classList.contains('delete-announce-btn')) {
            const announcementId = e.target.getAttribute('data-id');
            
            if (confirm("Are you sure you want to permanently delete this announcement?")) {
                try {
                    // Targets the specific document by its ID and deletes it
                    await deleteDoc(doc(db, "announcements", announcementId));
                    
                    alert("Announcement deleted successfully!");
                    
                    // Automatically reloads the list to clear the UI
                    if (typeof loadAnnouncements === 'function') {
                        loadAnnouncements();
                    }
                } catch (error) {
                    console.error("Error removing announcement:", error);
                    alert("Failed to delete the announcement. Check your permissions.");
                }
            }
        }
    });
});

export { db, showNotification, auth, app };
// Register the Service Worker for PWA compliance
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
