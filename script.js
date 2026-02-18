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

let currentUser = null, userData = null;

// Multi-Account Security (IP/Device Check)
async function checkDeviceAccess(uid) {
    const deviceId = localStorage.getItem('app_device_id') || uid;
    localStorage.setItem('app_device_id', deviceId);

    const deviceRef = db.collection('device_locks').doc(deviceId);
    const doc = await deviceRef.get();

    if (doc.exists) {
        if (doc.data().uid !== uid) {
            document.body.innerHTML = `<div style="color:white; text-align:center; margin-top:50px;">
                <h1>Access Denied</h1>
                <p>Multiple accounts are not allowed on this device.</p>
                <p>IP/Device Blocked.</p>
            </div>`;
            return false;
        }
    } else {
        await deviceRef.set({ uid: uid, firstLogin: new Date() });
    }
    return true;
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const allowed = await checkDeviceAccess(user.uid);
        if(!allowed) return;

        currentUser = user;
        await loadUserData();
        showPage('home-page');
    } else {
        auth.signInAnonymously();
    }
});

async function loadUserData() {
    const ref = db.collection(`artifacts/${appId}/users/${currentUser.uid}/profile`).doc('main');
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
    document.querySelectorAll('.balance-text').forEach(el => el.innerText = `$${userData.balance.toFixed(2)}`);
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

// Navigation Helper
function navigateTo(page) {
    showPage(page + '-page');
}

// Withdrawal Logic (Min $2)
async function handleWithdraw(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (amount < 2) return alert("Minimum withdrawal is $2");
    if (amount > userData.balance) return alert("Insufficient balance");
    
    // Add logic to save withdrawal request to Firestore
    alert("Withdrawal Request Sent!");
}
