import { db, auth } from './app.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const galleryGrid = document.getElementById('gallery-grid');
const adminGalleryForm = document.getElementById('admin-gallery-form');

// 1. Fetch and Render Gallery
if (galleryGrid) {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        galleryGrid.innerHTML = ''; 
        
        snapshot.forEach((docSnap) => {
            const photo = docSnap.data();
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `
                <div class="gallery-img-wrapper" style="cursor: pointer;">
                    <img src="${photo.url}" alt="${photo.title}">
                </div>
                <div class="gallery-info">
                    <h4>${photo.title}</h4>
                </div>
            `;

            // Open modal on click
            card.querySelector('.gallery-img-wrapper').addEventListener('click', () => {
                openLightbox(photo.url, photo.title);
            });

            galleryGrid.appendChild(card);
        });
    });    
}

// 2. GLOBAL UI LISTENERS (Moved outside the snapshot loop)
// Close modal logic
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('image-modal').classList.remove('active');
    resetZoom(); // Helper to reset image
});

// Zoom Logic
let zoomLevel = 1;
document.getElementById('zoom-in-btn').addEventListener('click', () => {
    const fullImg = document.getElementById('full-image');
    zoomLevel = (zoomLevel === 1) ? 2 : 1;
    fullImg.style.transform = `scale(${zoomLevel})`;
    document.getElementById('zoom-in-btn').innerText = (zoomLevel === 1) ? "Zoom In" : "Zoom Out";
});

// Helper functions
// Ensure this function centers the image correctly
function openLightbox(imgUrl, title) {
    const modal = document.getElementById('image-modal');
    const fullImg = document.getElementById('full-image');
    
    fullImg.src = imgUrl;
    document.getElementById('caption').innerText = title;
    
    // Just add the class; CSS handles the centering and display
    modal.classList.add('active');
}

// Ensure the close button hides it
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('image-modal').classList.remove('active');
});

// ... Keep your deletePhoto and Admin Upload Logic below ...