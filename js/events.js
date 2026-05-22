import { db, showNotification } from './app.js';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    where, 
    addDoc, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const eventsGrid = document.getElementById('events-grid');
const adminForm = document.getElementById('admin-event-form');
const cleanupBtn = document.getElementById('cleanup-events-btn');
const today = new Date().toISOString().split('T')[0];

// 1. RENDER EVENTS
if (eventsGrid) {
    const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));

    onSnapshot(eventsQuery, (snapshot) => {
        eventsGrid.innerHTML = '';
        let hasEvents = false;

        snapshot.forEach((docSnapshot) => {
            const event = docSnapshot.data();
            if (event.date >= today) {
                hasEvents = true;
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p>${event.description}</p>
                    ${sessionStorage.getItem('adminAuthenticated') === 'true' ? 
                      `<button class="delete-event-btn" data-id="${docSnapshot.id}">Delete Event</button>` : ''}
                `;
                eventsGrid.appendChild(card);
            }
        });

        if (!hasEvents) {
            eventsGrid.innerHTML = `<p>No upcoming events.</p>`;
        }
    });
}

// 2. ADMIN: PUBLISH EVENT
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "events"), {
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value,
                time: document.getElementById('event-time').value,
                location: document.getElementById('event-location').value,
                description: document.getElementById('event-desc').value
            });
            adminForm.reset();
            showNotification("Event published successfully!");
        } catch (error) {
            console.error("Error creating event: ", error);
        }
    });
}

// 3. ADMIN: CLEANUP PAST EVENTS
if (cleanupBtn) {
    cleanupBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm("Delete all events prior to today?")) return;

        const q = query(collection(db, "events"), where("date", "<", today));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(async (d) => {
            await deleteDoc(doc(db, "events", d.id));
        });
        showNotification("Cleanup complete!");
    });
}

// 4. ADMIN: DELETE SINGLE EVENT
document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-event-btn')) {
        const id = e.target.getAttribute('data-id');
        if (confirm("Delete this event?")) {
            await deleteDoc(doc(db, "events", id));
            showNotification("Event deleted.");
        }
    }
});