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
let currentScale = 1; // Tracker variable

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
            
            card.querySelector('.gallery-img-wrapper').addEventListener('click', () => {
                openLightbox(photo.url, photo.title);
            });

            galleryGrid.appendChild(card);
        });
    });    
}

// 2. GLOBAL DELETE LISTENER
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

// --- UI HELPER FUNCTIONS & MODAL LOGIC ---
function openLightbox(imgUrl, title) {
    const modal = document.getElementById('image-modal');
    const fullImg = document.getElementById('full-image');
    
    if (modal && fullImg) {
        currentScale = 1; // Always reset when opening a new image
        fullImg.style.transform = `scale(${currentScale})`; 
        fullImg.src = imgUrl;
        document.getElementById('caption').innerText = title;
        modal.classList.add('active');
    }
}

// --- ZOOM CONTROLLERS ---
document.addEventListener('click', (e) => {
    const fullImg = document.getElementById('full-image');
    
    // Ensure the modal is actually active so we don't zoom background images
    if (!document.getElementById('image-modal').classList.contains('active')) return;

    if (e.target && e.target.id === 'zoom-in-btn') {
        if (currentScale < 3) {
            currentScale += 0.5;
            fullImg.style.transform = `scale(${currentScale})`;
        }
    }

    if (e.target && e.target.id === 'zoom-out-btn') {
        if (currentScale > 1) {
            currentScale -= 0.5;
            fullImg.style.transform = `scale(${currentScale})`;
        }
    }
});
// Add this near your zoom event listener in gallery.js
const modal = document.getElementById('image-modal');
const closeBtn = document.querySelector('.close-modal');

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

// Optional: Close when clicking outside the image
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});