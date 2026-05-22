import { db, showNotification, auth } from './app.js';
import { 
    collection, addDoc, doc, setDoc, deleteDoc, 
    query, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const sermonsGrid = document.getElementById('sermons-grid');
const adminSermonForm = document.getElementById('admin-sermon-form');
const adminLiveForm = document.getElementById('admin-live-form');
const liveStreamSection = document.getElementById('live-stream-section');

// --- 1. URL CLEANING LOGIC ---
function cleanVideoEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    let videoId = '';
    const trimmed = rawUrl.trim();

    if (trimmed.includes('youtube.com/watch')) {
        try {
            const urlParams = new URLSearchParams(new URL(trimmed).search);
            videoId = urlParams.get('v');
        } catch(e) { console.error(e); }
    } else if (trimmed.includes('youtu.be/')) {
        videoId = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0];
    } else if (trimmed.includes('youtube.com/embed/')) {
        return trimmed;
    } else if (!trimmed.includes('/') && trimmed.length >= 10) {
        videoId = trimmed;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
}

// --- 2. DYNAMIC RENDERER ---
const renderSermons = (snapshot) => {
    if (!sermonsGrid) return;
    sermonsGrid.innerHTML = '';
    const isAdmin = auth.currentUser !== null;

    snapshot.forEach((docSnapshot) => {
        const sermon = docSnapshot.data();
        const card = document.createElement('div');
        card.innerHTML = `
            <div style="padding-top: 56.25%; position: relative; background: #000;">
                <iframe src="${cleanVideoEmbedUrl(sermon.videoUrl)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
            </div>
            <div style="padding: 15px;">
                <h3>${sermon.title}</h3>
                <p>${sermon.speaker} - ${sermon.date}</p>
                ${isAdmin ? `<button class="delete-sermon-trigger" data-sermon-id="${docSnapshot.id}">Delete</button>` : ''}
            </div>`;
        sermonsGrid.appendChild(card);
    });
};

// --- 3. LIVE SERVICE PIPELINE ---
if (liveStreamSection) {
    onSnapshot(doc(db, "liveBroadcast", "current"), (docSnapshot) => {
        liveStreamSection.innerHTML = '';
        const liveData = docSnapshot.exists() ? docSnapshot.data() : { isLive: false, videoUrl: '' };
        
        if(document.getElementById('live-is-active')) document.getElementById('live-is-active').checked = liveData.isLive;
        if(document.getElementById('live-video-url')) document.getElementById('live-video-url').value = liveData.videoUrl || '';

        if (liveData.isLive && liveData.videoUrl) {
            const rawUrl = liveData.videoUrl.trim();
            if (rawUrl.includes('tiktok.com')) {
                liveStreamSection.innerHTML = `
                    <div style="background: #010101; color: white; padding: 20px; text-align: center; border-radius: 8px;">
                        <i class="fab fa-tiktok" style="font-size: 3rem; color: #fe2c55; margin-bottom: 10px; display: block;"></i>
                        <h3>WE ARE LIVE ON TIKTOK!</h3>
                        <a href="${rawUrl}" target="_blank" class="btn-primary" style="background:#fe2c55; padding: 10px 20px; border-radius: 20px; text-decoration:none; color:white;">Watch Live on TikTok</a>
                    </div>`;
            } else {
                liveStreamSection.innerHTML = `
                    <div class="video-wrapper" style="position: relative; width: 100%; padding-top: 56.25%; background: #000;">
                        <iframe src="${cleanVideoEmbedUrl(rawUrl)}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
                    </div>`;
            }
        } else {
            liveStreamSection.innerHTML = `
                <div style="background: var(--card-background); border: 2px dashed #ccc; padding: 30px; text-align: center;">
                    <h3>Join Us Live Online</h3>
                    <p>We broadcast our services live weekly. Check back soon!</p>
                </div>`;
        }
    });
}

// --- 4. ADMIN LIVE CONTROLS & PROMOTION ---
if (adminLiveForm) {
    adminLiveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "liveBroadcast", "current"), {
                isLive: document.getElementById('live-is-active').checked,
                videoUrl: document.getElementById('live-video-url').value.trim(),
                updatedAt: serverTimestamp()
            });
            showNotification("Broadcast status updated.");
        } catch (error) { showNotification("Error updating status."); }
    });
}
// Add this inside the admin-live-form event listener or near your other admin logic
const stopLiveBtn = document.getElementById('stop-live-btn'); // Ensure this ID exists in sermons.html

if (stopLiveBtn) {
    stopLiveBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to stop the live broadcast?")) return;
        
        try {
            await setDoc(doc(db, "liveBroadcast", "current"), {
                isLive: false,
                videoUrl: ''
            });
            showNotification("Live broadcast stopped.");
        } catch (err) {
            console.error("Error stopping live: ", err);
        }
    });
}
const promoteBtn = document.getElementById('promote-to-archive-btn');
if (promoteBtn) {
    promoteBtn.addEventListener('click', async () => {
        const liveUrl = document.getElementById('live-video-url').value.trim();
        if (!liveUrl) { showNotification("No live URL found to promote."); return; }
        const title = prompt("Enter the title for this archived sermon:");
        const speaker = prompt("Enter the speaker's name:");
        const date = new Date().toISOString().split('T')[0];

        if (title && speaker) {
            try {
                await addDoc(collection(db, "sermons"), { title, speaker, videoUrl: liveUrl, date, createdTimestamp: serverTimestamp() });
                showNotification("Live video successfully promoted to archives!");
            } catch (error) { showNotification("Error promoting video."); }
        }
    });
}

// --- 5. ARCHIVE LISTENER (WITH REACTIVE AUTH) ---
if (sermonsGrid) {
    const q = query(collection(db, "sermons"), orderBy("date", "desc"));
    onSnapshot(q, (snapshot) => {
        renderSermons(snapshot);
    });
    // Re-render UI on login/logout state change
    onAuthStateChanged(auth, () => {
        const q = query(collection(db, "sermons"), orderBy("date", "desc"));
        onSnapshot(q, renderSermons);
    });
}

// --- 6. DELETION LOGIC ---
document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-sermon-trigger');
    if (!btn) return;
    if (confirm("Delete this sermon?")) {
        await deleteDoc(doc(db, "sermons", btn.dataset.sermonId));
        showNotification("Sermon deleted.");
    }
});

// --- 7. ARCHIVE UPLOAD ---
if (adminSermonForm) {
    adminSermonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "sermons"), {
            title: document.getElementById('sermon-title').value,
            speaker: document.getElementById('sermon-speaker').value,
            videoUrl: document.getElementById('sermon-youtube-id').value,
            date: document.getElementById('sermon-date').value,
            createdTimestamp: serverTimestamp()
        });
        adminSermonForm.reset();
        showNotification("Sermon archived.");
    });
}