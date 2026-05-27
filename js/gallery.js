import { db, showNotification } from './app.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const galleryGrid = document.getElementById('gallery-grid');

// 1. Fetch and Render Gallery
if (galleryGrid) {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        galleryGrid.innerHTML = ''; 
        
        snapshot.forEach((docSnap) => {
            const photo = docSnap.data();
            const isAdmin = document.body.classList.contains('admin-mode');
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `
                <div class="gallery-img-wrapper" style="cursor: pointer;">
                    <img src="${photo.url}" alt="${photo.title}">
                </div>
                <div class="gallery-info">
                    <h4>${photo.title}</h4>
                    ${isAdmin ? `<button class="delete-gallery-btn" data-id="${docSnap.id}">Delete</button>` : ''}
                </div>
            `;
            
            // Re-attach Modal Click Logic
            card.querySelector('.gallery-img-wrapper').addEventListener('click', () => {
                openLightbox(photo.url, photo.title);
            });

            galleryGrid.appendChild(card);
        });
    });    
}

// 2. GLOBAL DELETE LISTENER (Moved OUTSIDE of onSnapshot)
document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-gallery-btn')) {
        const id = e.target.getAttribute('data-id');
        if (confirm("Delete this image permanently?")) {
            try {
                await deleteDoc(doc(db, "gallery", id));
                showNotification("Image deleted successfully.");
            } catch (err) {
                console.error("Delete error:", err);
                showNotification("Failed to delete image.");
            }
        }
    }
});

// 3. UI HELPER FUNCTIONS
function openLightbox(imgUrl, title) {
    const modal = document.getElementById('image-modal');
    const fullImg = document.getElementById('full-image');
    if (modal && fullImg) {
        fullImg.src = imgUrl;
        document.getElementById('caption').innerText = title;
        modal.classList.add('active');
    }
}

// Ensure close logic is clean
const closeBtn = document.querySelector('.close-modal');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('image-modal').classList.remove('active');
    });
}