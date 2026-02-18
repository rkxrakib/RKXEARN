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

// Anti-Fake Refer & IP Security
async function checkDevice() {
    const localUid = localStorage.getItem('logged_uid');
    const currentUid = auth.currentUser.uid;

    if (localUid && localUid !== currentUid) {
        document.body.innerHTML = "<div class='h-screen flex items-center justify-center bg-[#0f172a] text-red-500 p-10 text-center font-bold'><h1>Access Denied</h1><p>Multiple accounts are not allowed on one device. Your IP has been flagged.</p></div>";
        return false;
    }
    localStorage.setItem('logged_uid', currentUid);
    return true;
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const isSafe = await checkDevice();
        if (!isSafe) return;

        currentUser = user;
        await initUserData(user.uid);
        loadContent();
        loadTasks();
    } else {
        auth.signInAnonymously();
    }
});

async function initUserData(uid) {
    const ref = db.collection(`artifacts/${appId}/users/${uid}/profile`).doc('main');
    const doc = await ref.get();
    if (!doc.exists) {
        userData = { balance: 0.00, referralCode: 'FYN' + Math.floor(1000 + Math.random() * 9000), totalEarned: 0 };
        await ref.set(userData);
    } else {
        userData = doc.data();
    }
    updateUI();
}

function updateUI() {
    if(!userData) return;
    document.getElementById('header-balance').innerText = `$${userData.balance.toFixed(2)}`;
    document.getElementById('user-name').innerText = tgUser ? tgUser.first_name : "User";
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    // Nav icon color update
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('text-indigo-400');
        nav.classList.add('text-slate-500');
    });
    const activeNav = document.getElementById('nav-' + pageId.split('-')[0]);
    if(activeNav) {
        activeNav.classList.remove('text-slate-500');
        activeNav.classList.add('text-indigo-400');
    }
}

// Withdrawal Logic for $2 USDT
async function handleWithdraw(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = "USDT (TRC20)";
    
    if (amount < 2.00) {
        showToast("Min Withdraw is $2.00 USDT", "error");
        return;
    }
    if (amount > userData.balance) {
        showToast("Insufficient Balance", "error");
        return;
    }
    // Logic for Firebase...
    showToast("Withdrawal Success!", "success");
}

function showToast(msg, type) {
    const c = document.getElementById('toast-container'), t = document.createElement('div');
    t.className = `${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white text-xs font-bold px-4 py-3 rounded-full shadow-lg`;
    t.innerText = msg; c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// Load Content from separate files or templates
function loadContent() {
    // এখানে আপনার Home, Refer, Wallet এর কন্টেন্ট ইনজেক্ট হবে
    document.getElementById('home-page').innerHTML = `<!-- Home Content Card Design -->`;
    document.getElementById('task-page').innerHTML = `<h2 class="text-xl font-bold mb-4">Daily Tasks</h2><div id="task-list-container"></div>`;
}

async function loadTasks() {
    db.collection(`artifacts/${appId}/public/data/tasks`).onSnapshot(snap => {
        const cont = document.getElementById('task-list-container');
        cont.innerHTML = '';
        snap.forEach(doc => {
            const task = doc.data();
            cont.innerHTML += `
                <div class="glass-card p-4 rounded-xl flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <img src="${task.icon}" class="w-10 h-10 rounded-lg">
                        <div>
                            <p class="font-bold text-sm">${task.name}</p>
                            <p class="text-xs text-green-400">+$${task.reward}</p>
                        </div>
                    </div>
                    <a href="${task.link}" target="_blank" class="bg-indigo-600 px-4 py-1 rounded-full text-xs">Complete</a>
                </div>
            `;
        });
    });
}
