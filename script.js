// 1. CONFIGURATION
const BLYNK_AUTH_TOKEN = "YOUR_BLYNK_AUTH_TOKEN_HERE"; 
const BLYNK_API_URL = `https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&v1`;

// 2. DATABASE: All 4 Original Indian Cities Restored
const bins = [
    { 
        id: "PUN-KT-01", 
        location: "Katraj", 
        city: "Pune", 
        ward: "Zone 2", 
        level: 0,
        type: "dry",
        lastCleaned: "08:30 AM",
        status: "Connecting to GSM..." 
    },
    { 
        
        id: "PUN-AW-02", 
        location: "Sadashiv Peth", 
        city: "Pune", 
        ward: "A-Ward", 
        level: 85,
        type: "wet",
        lastCleaned: "06:15 AM",
        status: "Active"
    },
    { 
        id: "PUN-SG-03", 
        location: "Swargate", 
        city: "Pune", 
        ward: "Zone 3", 
        level: 45, 
        type: "dry",
        lastCleaned: "09:45 AM",
        status: "Simulated"
    },
    { 
        id: "PUN-SN-04", 
        location: "FC Road, Shivajinagar", 
        city: "Pune", 
        ward: "Zone 4", 
        level: 92, 
        type: "wet",
        lastCleaned: "07:00 AM",
        status: "Simulated"
    }

];

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = new Date().toLocaleDateString('en-IN', options);
    
    setupNavigation();
    renderDashboard();
    
    // Fetch real GSM data for the 1st bin
    fetchGSMData(); 
    setInterval(fetchGSMData, 15000); 

    // Simulate slow growth for the other 3 mock bins
    setInterval(simulateMockBins, 10000);
});

// 4. REAL DATA FETCH (Bin 1 - Bengaluru)
async function fetchGSMData() {
    try {
        const response = await fetch(BLYNK_API_URL);
        if (!response.ok) throw new Error("Blynk Offline");
        
        const data = await response.json();
        const freshLevel = parseInt(data);

        bins[0].level = freshLevel;
        bins[0].status = "Online (GSM)";
        
        if (freshLevel >= 90) notifyMunicipality(bins[0]);

        renderDashboard();
    } catch (error) {
        console.error("Blynk Error:", error);
        bins[0].status = "Offline (Check SIM)";
        renderDashboard();
    }
}

// 5. MOCK DATA SIMULATION (Bins 2, 3, 4)
function simulateMockBins() {
    for(let i = 1; i < bins.length; i++) {
        if(bins[i].level < 100) {
            bins[i].level += Math.floor(Math.random() * 3);
        }
    }
    renderDashboard();
}

// 6. NAVIGATION LOGIC
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.page-view');
    const viewTitle = document.getElementById('view-title');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const target = link.getAttribute('data-view');
            views.forEach(v => v.style.display = 'none');
            document.getElementById(target).style.display = 'block';

            viewTitle.innerText = link.innerText;
        });
    });
}

// 7. RENDERING LOGIC
function renderDashboard() {
    const grid = document.getElementById('bin-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    let fullCount = 0;

    bins.forEach(bin => {
        const isCritical = bin.level > 80;
        if(isCritical) fullCount++;
        
        let levelColor = 'var(--accent-green)'; 
        if(bin.level > 50) levelColor = 'var(--accent-blue)'; 
        if(bin.level > 80) levelColor = 'var(--accent-red)'; 
        
        const typeLabelColor = bin.type === 'dry' ? '#3498db' : '#27ae60';

        const card = document.createElement('div');
        card.className = `bin-card glass-card ${isCritical ? 'highlight' : ''}`;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <span style="color: var(--accent-blue); font-size: 0.7rem; font-weight: 700;">${bin.id}</span>
                    <div style="font-size: 1.1rem; font-weight: 600; color: #fff; margin-top: 4px;">${bin.location}</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">${bin.status}</div>
                </div>
                <span style="background: ${typeLabelColor}; color: white; font-size: 0.6rem; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; font-weight: bold;">
                    ${bin.type}
                </span>
            </div>

            <div class="visual-container">
                <div class="water-fill" style="height: ${bin.level}%; background: ${levelColor}; box-shadow: 0 0 20px ${levelColor}88;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 1.8rem; font-weight: 800;">${bin.level}%</span>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">City: ${bin.city}</div>
                </div>
                <button class="action-btn" onclick="requestPickup('${bin.id}')" 
                    style="background: ${isCritical ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)'}; 
                           color: ${isCritical ? 'white' : 'var(--text-main)'}">
                    ${isCritical ? 'Dispatch' : 'Details'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    document.getElementById('total-count').innerText = bins.length;
    document.getElementById('full-count').innerText = fullCount;
}

// 8. NOTIFICATIONS
function notifyMunicipality(bin) {
    const feed = document.getElementById('alert-list');
    if (!feed) return;
    
    const time = new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit' });
    const alertItem = document.createElement('div');
    alertItem.className = 'feed-item';
    alertItem.innerHTML = `<strong style="color:var(--accent-red)">[ALERT]</strong> ${bin.location} (${bin.city}) is reaching capacity. <span style="float:right">${time}</span>`;
    
    if (feed.firstChild?.innerText.indexOf(bin.location) === -1 || !feed.firstChild) {
        feed.prepend(alertItem);
    }
}

function requestPickup(binId) {
    alert("🚛 Routing Municipal Truck to " + binId + ".");
}