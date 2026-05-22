import { db, showNotification } from './app.js';
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    increment, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const prayerForm = document.getElementById('prayer-form');
const prayerWall = document.getElementById('prayer-wall');
const privateInbox = document.getElementById('admin-private-inbox');

// Safe check if current browser session is an admin
// Change this line:
const isAdmin = () => document.body.classList.contains('admin-mode');

// ==========================================
// 1. FELLOWSHIP CHAT SYSTEM
// ==========================================
if (chatForm && chatBox) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('chat-username').value.trim() || 'Anonymous';
        const message = document.getElementById('chat-message').value;

        try {
            await addDoc(collection(db, "chats"), {
                user: username,
                text: message,
                timestamp: serverTimestamp()
            });
            document.getElementById('chat-message').value = '';
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    });

    const chatQuery = query(collection(db, "chats"), orderBy("timestamp", "asc"), limit(60));
    onSnapshot(chatQuery, (snapshot) => {
        chatBox.innerHTML = '';
        snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const chatId = docSnapshot.id;
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('chat-msg');
            
            msgDiv.innerHTML = `
                <div class="chat-msg-header">
                    <strong>${data.user || 'Anonymous'}</strong>
                    ${isAdmin() ? `<button class="btn-delete-moderation delete-chat-btn" data-id="${chatId}"><i class="fas fa-trash"></i></button>` : ''}
                </div>
                <span>${data.text}</span>
            `;
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;

        chatBox.querySelectorAll('.delete-chat-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm("Delete this chat message from the live board?")) {
                    try {
                        await deleteDoc(doc(db, "chats", id));
                        showNotification("Chat message removed.");
                    } catch (err) {
                        console.error("Failed to delete chat record: ", err);
                    }
                }
            });
        });
    });
}

// ==========================================
// 2. PRAYER WALL ENGINE
// ==========================================
if (prayerForm && prayerWall) {
    
    prayerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prayer-name').value.trim() || 'Anonymous';
        const text = document.getElementById('prayer-text').value;
        
        const visibilityEl = document.querySelector('input[name="prayer-visibility"]:checked');
        const visibility = visibilityEl ? visibilityEl.value : 'public';

        try {
            await addDoc(collection(db, "prayers"), {
                author: name,
                request: text,
                visibility: visibility, 
                prayerCount: 0,
                timestamp: serverTimestamp()
            });
            
            prayerForm.reset();
            if (visibility === 'private') {
                showNotification("Sent privately to leadership team.");
            } else {
                showNotification("Post published to community wall.");
            }
        } catch (error) {
            console.error("Error submitting prayer: ", error);
        }
    });

    // STREAM A: PUBLIC PRAYER REQUESTS FEED
    const publicQuery = query(collection(db, "prayers"), where("visibility", "==", "public"), orderBy("timestamp", "desc"));
    onSnapshot(publicQuery, (snapshot) => {
        renderPrayerCards(snapshot, prayerWall, false);
    });

    // STREAM B: PRIVATE INTERIOR INBOX
    if (privateInbox) {
        const privateQuery = query(collection(db, "prayers"), where("visibility", "==", "private"), orderBy("timestamp", "desc"));
        onSnapshot(privateQuery, (snapshot) => {
            renderPrayerCards(snapshot, privateInbox, true);
        });
    }
}

// Universal UI builder for generating prayer records
function renderPrayerCards(snapshot, containerElement, isPrivateFolder) {
    containerElement.innerHTML = '';
    
    if (snapshot.empty) {
        containerElement.innerHTML = `<p class="loading-text">No requests here at this time.</p>`;
        return;
    }

    snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const prayerId = docSnapshot.id;
        const card = document.createElement('div');
        card.classList.add('prayer-card');
        if (isPrivateFolder) card.style.borderColor = "var(--accent-color)";
        
        card.innerHTML = `
            <div class="prayer-meta">
                <strong><i class="fas fa-user-circle"></i> ${data.author}</strong>
                <span>
                    <i class="${isPrivateFolder ? 'fas fa-lock' : 'far fa-clock'}"></i> 
                    ${isPrivateFolder ? 'Confidential Counsel' : 'Community Request'}
                </span>
            </div>
            <p class="prayer-text">${data.request}</p>
            
            <div class="prayer-actions" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 15px;">
                <button type="button" 
                        class="btn-pray-counter action-pray-trigger" 
                        data-target-id="${prayerId}"
                        style="cursor: pointer;">
                    <i class="fas fa-heart" style="pointer-events: none;"></i> 
                    <span style="pointer-events: none;">I Prayed For This (<span>${data.prayerCount || 0}</span>)</span>
                </button>

                ${isAdmin() ? `<button type="button" class="btn-delete-moderation delete-prayer-btn" data-id="${prayerId}"><i class="fas fa-trash-alt"></i> Delete Request</button>` : ''}
            </div>
        `;

        // Administrative deletion connection handler
        const deleteBtn = card.querySelector('.delete-prayer-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("Permanently erase this prayer request? This operation cannot be undone.")) {
                    try {
                        await deleteDoc(doc(db, "prayers", prayerId));
                        showNotification("Prayer request removed.");
                    } catch (err) {
                        console.error("Purge failure: ", err);
                    }
                }
            });
        }

        containerElement.appendChild(card);
    });
}

// =======================================================================
// GLOBAL INTERCEPT MATRIX
// =======================================================================
document.body.addEventListener('click', async (event) => {
    const prayButton = event.target.closest('.action-pray-trigger');
    if (!prayButton) return;

    event.preventDefault();
    event.stopPropagation();

    const prayerId = prayButton.getAttribute('data-target-id');
    console.log("👉 Click Detected! Target Document ID:", prayerId);

    if (localStorage.getItem(`prayed_${prayerId}`)) {
        showNotification("You have already committed a prayer for this request.");
        return;
    }

    try {
        prayButton.disabled = true;

        const prayerDocRef = doc(db, "prayers", prayerId);
        await updateDoc(prayerDocRef, { 
            prayerCount: increment(1) 
        });
        
        localStorage.setItem(`prayed_${prayerId}`, 'true');
        showNotification("Prayer commitment logged.");
        console.log("✅ Database updated successfully!");
    } catch (err) {
        console.error("❌ Firestore update failed:", err);
        prayButton.disabled = false;
    }
});