import { db } from './app.js';
import { collection, query, orderBy, limit, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const liveSection = document.getElementById('live-stream-section');

// This robust function forces every URL into a compatible embed format
function getUniversalEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';

    try {
        const urlObj = new URL(url);
        // Handle youtube.com/watch?v=...
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/')[2];
        } 
        // Handle youtu.be/...
        else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.substring(1);
        }
    } catch (e) {
        // Fallback if the string isn't a valid URL
        videoId = url.split('/').pop();
    }

    // Set autoplay to 0 to keep it paused
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`;
}

if (liveSection) {
    // Listen for changes in Live status OR Archive
    onSnapshot(doc(db, "liveBroadcast", "current"), (liveDoc) => {
        const liveData = liveDoc.data();
        
        if (liveData && liveData.isLive && liveData.videoUrl) {
            renderVideo(liveData.videoUrl, "🔴 Currently Live");
        } else {
            // Fallback: Latest Archive
            const q = query(collection(db, "sermons"), orderBy("date", "desc"), limit(1));
            onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const latest = snapshot.docs[0].data();
                    renderVideo(latest.videoUrl, `Latest Sermon: ${latest.title}`);
                }
            });
        }
    });
}

function renderVideo(url, title) {
    liveSection.innerHTML = `
        <h3>${title}</h3>
        <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000;">
            <iframe 
                src="${getUniversalEmbedUrl(url)}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
    `;
}