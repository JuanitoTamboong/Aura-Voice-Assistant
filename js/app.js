// Global Application State
const ASSISTANT_NAME = "Aura";
let isListening = false;
let wavePhase = 0;
let youtubeTab = null;

// NEW: Hold data from the database
let auraDatabase = {};

const historyData = [
    { name: "WEATHER", val: 62 }, { name: "MEDICAL EQUIPMENT", val: 48 },
    { name: "TRAFFIC SIGNALS", val: 84 }, { name: "DATA RECOGNITION", val: 56 },
    { name: "ALARM", val: 39 }, { name: "FACTS", val: 72 },
    { name: "MOVIES", val: 45 }, { name: "CARTOONS", val: 88 },
    { name: "RESTAURANTS", val: 61 }, { name: "CLOTH STORES", val: 35 }
];

const historyContainer = document.getElementById('historyContainer');
const scrollHistoryBtn = document.getElementById('scrollHistoryBtn');
const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');
const micBtn = document.getElementById('micBtn');
const orbContainer = document.getElementById('orbContainer');
const statusText = document.getElementById('statusText');
const transcriptText = document.getElementById('transcriptText');
const commandTitle = document.getElementById('commandTitle');
const commandCategory = document.getElementById('commandCategory');
const matchPercentage = document.getElementById('matchPercentage');
const videoResultsList = document.getElementById('videoResultsList');
const pipBtn = document.getElementById('pipBtn');

// NEW: Fetch the database on startup
async function loadDatabase() {
    try {
        const response = await fetch('./database/aura.json');
        auraDatabase = await response.json();
        console.log("Database loaded successfully:", auraDatabase);
    } catch (error) {
        console.error("Failed to load database:", error);
    }
}

function renderHistoryCards() {
    if (!historyContainer) return;
    historyContainer.innerHTML = historyData.map((item) => `
        <div class="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3 flex flex-col justify-between h-24 transition-all glass-card-hover group cursor-pointer" onclick="handleCardClick('${item.name}')">
            <span class="text-[11px] font-bold text-slate-300 tracking-wide uppercase group-hover:text-cyan-400 transition-colors">${item.name}</span>
            <div>
                <div class="text-[11px] font-orbitron text-slate-400 mb-1">${item.val}%</div>
                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-1000" style="width: ${item.val}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function drawParticleWave() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particleCount = 180;
    const radius = 90;

    wavePhase += isListening ? 0.08 : 0.02;

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const amp = isListening ? 25 : 8;
        const waveOffset = Math.sin(angle * 6 + wavePhase) * Math.cos(angle * 4 + wavePhase) * amp;
        
        const r = radius + waveOffset;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        const size = isListening ? Math.random() * 2.5 + 1 : 1.5;
        const colorRatio = i / particleCount;
        ctx.fillStyle = colorRatio > 0.5 ? `rgba(0, 240, 255, ${0.4 + Math.random() * 0.4})` : `rgba(168, 85, 247, ${0.4 + Math.random() * 0.4})`;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(drawParticleWave);
}

const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognitionClass) {
    recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        statusText.innerText = `${ASSISTANT_NAME} Listening...`;
        statusText.classList.add('text-cyan-400');
        orbContainer.classList.add('listening-active');
        micBtn.classList.add('ring-4', 'ring-cyan-400/50');
    };

    recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        transcriptText.innerText = `"${transcript}"`;

        if (event.results[current].isFinal) {
            processCommand(transcript.toLowerCase());
        }
    };

    recognition.onerror = (event) => {
        statusText.innerText = `${ASSISTANT_NAME} Error`;
        console.error("Speech Error:", event.error);
        resetMicState();
    };

    recognition.onend = () => {
        resetMicState();
    };
} else {
    statusText.innerText = "Speech Unsupported";
    transcriptText.innerText = "Browser does not support Web Speech API.";
}

function toggleListening() {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
        resetMicState();
    } else {
        auraSpeak(""); 
        recognition.start();
    }
}

function resetMicState() {
    isListening = false;
    statusText.innerText = `${ASSISTANT_NAME} Ready`;
    statusText.classList.remove('text-cyan-400');
    orbContainer.classList.remove('listening-active');
    micBtn.classList.remove('ring-4', 'ring-cyan-400/50');
}

function auraSpeak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function processCommand(cmd) {
    statusText.innerText = `${ASSISTANT_NAME} Processing...`;

    // --- NEW: AURA PERSONALITY VIA DATABASE ---
    if (cmd.includes('who are you') || cmd.includes('your name') || cmd.includes('what are you') || cmd.includes('tell me about yourself')) {
        // Pull the response from the JSON database
        const responseText = auraDatabase.greeting || "I am Aura, your virtual assistant. My database is currently offline.";
        const creatorName = auraDatabase.creator || "Unknown";
        
        updateDashboardDetails("Aura AI", "Virtual Assistant", "100%", [
            { title: "Aura Introduction", query: "Aura AI Assistant", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80" }
        ]);
        
        auraSpeak(`${responseText} I was created by ${creatorName}.`);
        return;
    }

    // --- CLOSE AURA / FLOATING WINDOW ONLY ---
    if (cmd.includes('close aura') || cmd.includes('close window') || cmd.includes('close the window')) {
        auraSpeak("Closing the floating window.");
        updateDashboardDetails("Closed Window", "System", "100%", []);
        
        if ('documentPictureInPicture' in window && documentPictureInPicture.window) {
            documentPictureInPicture.window.close();
        }
        return;
    }

    // --- CLOSE YOUTUBE ONLY ---
    if (cmd.includes('close') && cmd.includes('youtube')) {
        if (youtubeTab && !youtubeTab.closed) {
            youtubeTab.close();
            youtubeTab = null;
            auraSpeak("Closing YouTube.");
            updateDashboardDetails("Closed YouTube", "System", "100%", []);
        } else {
            auraSpeak("I cannot close YouTube because the browser blocked it or I didn't open it.");
            updateDashboardDetails("Action Blocked", "Browser Security", "0%", []);
        }
        return;
    }

    // --- OPEN YOUTUBE ---
    if (cmd.includes('open youtube') || (cmd.includes('youtube') && !cmd.includes('close'))) {
        updateDashboardDetails("YouTube", "Video Streaming", "99.9%", [
            { title: "YouTube Home", query: "youtube", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=120&q=80" }
        ]);
        auraSpeak("Opening YouTube for you now.");
        youtubeTab = window.open("https://www.youtube.com", "_blank");
        return;
    }

    // --- GOOGLE SEARCH ---
    if (cmd.startsWith('search for ') || cmd.startsWith('look up ')) {
        const query = cmd.replace('search for ', '').replace('look up ', '');
        updateDashboardDetails(`Search: ${query}`, "Web Search", "95.0%", []);
        auraSpeak(`Searching Google for ${query}`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
        return;
    }

    // --- HOVERBOARD ---
    if (cmd.includes('hoverboard') || cmd.includes('hover board') || cmd.includes('price')) {
        updateDashboardDetails("Hover Board", "Personal Transporter", "92.8%", [
            { title: "Hover Board Review", query: "hoverboard review", img: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=120&q=80" },
            { title: "Hover Board Unboxing", query: "hoverboard unboxing", img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80" }
        ]);
        auraSpeak("Aura is displaying pricing and video reviews for hoverboards.");
    } 
    // --- WEATHER ---
    else if (cmd.includes('weather')) {
        updateDashboardDetails("Current Weather", "Meteorology & Climate", "98.1%", [
            { title: "Local Weather Forecast", query: "weather forecast", img: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=120&q=80" }
        ]);
        auraSpeak("Aura retrieved the local weather forecast for you.");
    } 
    // --- RESTAURANTS ---
    else if (cmd.includes('restaurant') || cmd.includes('food')) {
        updateDashboardDetails("Top Restaurants", "Dining & Food", "89.4%", [
            { title: "Best Dining Spots Nearby", query: "restaurants near me", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80" }
        ]);
        auraSpeak("Aura found top-rated dining spots nearby.");
    } 
    // --- FALLBACK (General Search) ---
    else {
        // Use database fallback message if it exists
        const fallback = auraDatabase.fallback_message || `Aura processing query for ${cmd}`;
        updateDashboardDetails(cmd.toUpperCase(), "General Search", "85.0%", [
            { title: `Search for ${cmd}`, query: cmd, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80" }
        ]);
        auraSpeak(fallback);
    }
}

window.handleCardClick = (category) => {
    transcriptText.innerText = `"${category.toLowerCase()}"`;
    processCommand(category.toLowerCase());
};

window.playVideo = (url) => {
    window.open(url, '_blank');
};

function updateDashboardDetails(title, category, match, videos) {
    commandTitle.innerText = title;
    commandCategory.innerText = category;
    matchPercentage.innerText = match;

    if (videos.length === 0) {
        videoResultsList.innerHTML = `<p class="text-xs text-slate-500 italic">No videos available.</p>`;
        return;
    }

    videoResultsList.innerHTML = videos.map((vid) => `
        <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
            <div class="flex items-center gap-3">
                <img src="${vid.img}" class="w-12 h-10 rounded-lg object-cover">
                <div>
                    <h4 class="text-xs font-semibold text-slate-200">${vid.title}</h4>
                    <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold">YOUTUBE</span>
                </div>
            </div>
            <button onclick="playVideo('https://www.youtube.com/results?search_query=${encodeURIComponent(vid.query)}')" class="w-7 h-7 rounded-full bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all">
                <i class="fa-solid fa-play text-xs"></i>
            </button>
        </div>
    `).join('');
}

// 6. Document Picture-in-Picture Logic
if (pipBtn) {
    pipBtn.addEventListener('click', async () => {
        if (!('documentPictureInPicture' in window)) {
            alert("Your browser does not support the Pop-out feature. Please use Google Chrome or Microsoft Edge, and ensure you are running this on a Local Server (like VS Code Live Server), not just double-clicking the file.");
            return;
        }
        try {
            const pipWindow = await documentPictureInPicture.requestWindow({
                width: 400,
                height: 500,
            });

            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            const centerPanel = document.querySelector('.col-span-6');
            pipWindow.document.body.appendChild(centerPanel);
            
            pipWindow.document.body.style.backgroundColor = "#05060f";
            pipWindow.document.body.style.display = "flex";
            pipWindow.document.body.style.justifyContent = "center";
            pipWindow.document.body.style.alignItems = "center";
            pipWindow.document.body.style.height = "100vh";
            pipWindow.document.body.style.margin = "0";
            pipWindow.document.body.style.overflow = "hidden";

            setTimeout(() => {
                const newCanvas = document.getElementById('waveCanvas');
                if (newCanvas) {
                    newCanvas.width = newCanvas.offsetWidth;
                    newCanvas.height = newCanvas.offsetHeight;
                }
                drawParticleWave();
            }, 200);

            pipWindow.addEventListener("pagehide", () => {
                document.querySelector('main').appendChild(centerPanel);
                setTimeout(() => {
                    resizeCanvas();
                    drawParticleWave();
                }, 100);
            });

        } catch (error) {
            console.error("PiP Error:", error);
            alert("Failed to open Pop-out. Make sure you are using a Local Server (http://) and not a file (file:///).");
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // NEW: Load the database when the page starts
    loadDatabase();

    renderHistoryCards();
    resizeCanvas();
    drawParticleWave();

    window.addEventListener('resize', resizeCanvas);
    micBtn.addEventListener('click', toggleListening);

    if (scrollHistoryBtn && historyContainer) {
        scrollHistoryBtn.addEventListener('click', () => {
            historyContainer.scrollBy({ top: 120, behavior: 'smooth' });
        });
    }
});