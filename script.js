const firebaseConfig = {
  apiKey: "AIzaSyDvtZJhIN850tU7cETuiqRyCyjCBdlFt-Y",
  authDomain: "fynora-81313.firebaseapp.com",
  databaseURL: "https://fynora-81313-default-rtdb.firebaseio.com",
  projectId: "fynora-81313",
  storageBucket: "fynora-81313.firebasestorage.app",
  messagingSenderId: "593306264446",
  appId: "1:593306264446:web:da476d4c77ae4ede6b492f",
  measurementId: "G-BX0FWR2YMT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();
const appId = "fynora-81313";

let currentUser = null, userData = null, tgUser = null;

// IP & Device Block Logic (Anti-Multi Account)
async function checkSecurity(uid) {
    const deviceId = localStorage.getItem('app_device_token');
    if (deviceId && deviceId !== uid) {
        document.body.innerHTML = `<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#0f172a; color:red; text-align:center; padding:20px;">
            <h1>Access Denied</h1><p>You are already using another account on this device. Blocked.</p>
        </div>`;
        return false;
    }
    localStorage.setItem('app_device_token', uid);
    return true;
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const isSafe = await checkSecurity(user.uid);
        if (!isSafe) return;
        
        currentUser = user;
        await initUserData(user.uid);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        loadSettings();
    } else {
        auth.signInAnonymously();
    }
});

// Original Data Initializer (Modified for $)
async function initUserData(uid) {
    const ref = db.collection(`artifacts/${appId}/users/${uid}/profile`).doc('main');
    const doc = await ref.get();
    if (!doc.exists) {
        userData = { balance: 0.00, referralCode: 'FYN' + Math.floor(Math.random() * 9000), totalEarned: 0 };
        await ref.set(userData);
    } else {
        userData = doc.data();
    }
    updateHeader();
    ref.onSnapshot(s => { if(s.exists) { userData = s.data(); updateHeader(); }});
}

function updateHeader() {
    document.getElementById('header-balance').innerText = '$' + (userData.balance || 0).toFixed(2);
    document.getElementById('wallet-balance').innerText = (userData.balance || 0).toFixed(2);
}

// Global showPage Function
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('text-indigo-400'));
    const navId = 'nav-' + pageId.replace('-page', '');
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('text-indigo-400');
}

// Task Loading Logic
function loadTasks() {
    db.collection(`artifacts/${appId}/public/data/tasks`).onSnapshot(snap => {
        const container = document.getElementById('task-list-container');
        container.innerHTML = '';
        snap.forEach(doc => {
            const task = doc.data();
            container.innerHTML += `
                <div class="glass-card p-4 rounded-xl flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <img src="${task.icon}" class="w-10 h-10 rounded-lg">
                        <div>
                            <p class="font-bold text-sm text-white">${task.name}</p>
                            <p class="text-xs text-green-400">Reward: $${task.reward}</p>
                        </div>
                    </div>
                    <button onclick="window.open('${task.link}')" class="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs">GO</button>
                </div>`;
        });
    });
}
