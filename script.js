// --- NAVIGATION LOGIC ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
 const firebaseConfig = {
  apiKey: "AIzaSyCapNbMuYR4Hz0bERj0SVPE6CiqSAUxK-k",
  authDomain: "tcg-pocket-d358c.firebaseapp.com",
  databaseURL: "https://tcg-pocket-d358c-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "tcg-pocket-d358c",
  storageBucket: "tcg-pocket-d358c.firebasestorage.app",
  messagingSenderId: "463561133468",
  appId: "1:463561133468:web:0748d3157516bef3ca0c59",
  measurementId: "G-MEE71X7GWH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// This makes the "Sign In" button work
window.loginWithGoogle = function() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Logged in as:", user.displayName);
      document.getElementById('login-overlay').style.display = 'none';
      loadBinderFromCloud(user.uid); 
      alert("Welcome, " + user.displayName + "!");
    })
    .catch((error) => {
      console.error("Login failed:", error.message);
    });
}

window.openBinder = function(binderId) {
  const openSfx = document.getElementById('sfx-open');
  if (openSfx) { openSfx.currentTime = 0; openSfx.play(); }

  document.getElementById('home-screen').style.display = 'none';
  document.querySelectorAll('.binder-page').forEach(page => {
    page.style.display = 'none';
  });

  const target = document.getElementById(binderId);
  if (target) {
    target.style.display = 'block';
    const title = target.querySelector('h4');
    if (title) {
      title.style.animation = 'none';
      void title.offsetWidth;
      title.style.animation = 'typing 3s steps(30, end) forwards';
    }
  }
}

window.filterCards = function() {
  const query = document.getElementById('main-search').value.toLowerCase().trim();
  const menuCards = document.querySelectorAll('.menu-card');

  menuCards.forEach(card => {
    const pokemonName = card.querySelector('h2').textContent.toLowerCase();
    if (pokemonName.includes(query)) {
      card.style.display = "flex"; 
    } else {
      card.style.display = "none";
    }
  });
}

window.goHome = function() {
  const backSfx = document.getElementById('sfx-back');
  if (backSfx) { backSfx.currentTime = 0; backSfx.play(); }

  document.querySelectorAll('.binder-page').forEach(page => {
    page.style.display = 'none';
  });
  document.getElementById('home-screen').style.display = 'block';
}

// --- MUSIC LOGIC ---
const bgm = new Audio("https://files.catbox.moe/f13ary.mp3");
bgm.loop = true;

window.toggleMusic = function() {
  const btn = document.getElementById('music-circle');
  const playSfx = document.getElementById('sfx-play');

  if (bgm.paused) {
    if (playSfx) { playSfx.currentTime = 0; playSfx.play(); }
    bgm.play().then(() => {
      btn.innerHTML = "||";
      btn.style.fontSize = "3rem";
    });
  } else {
    bgm.pause();
    btn.innerHTML = "▶";
    btn.style.fontSize = "3rem";
  }
}

// --- COLLECTION LOGIC ---
// Adding "window." makes this function public for your buttons
window.setObtained = async function(cardId, method) {
  const user = auth.currentUser;
  
  // If the user isn't logged in, the buttons won't do anything
  if (!user) {
    alert("Please sign in with Google to save your cards!");
    return;
  }

  const card = document.getElementById(cardId);
  const gachaBtn = card.querySelector('.gacha-btn');
  const pointsBtn = card.querySelector('.points-btn');
  
  // Create a reference to this specific card in your Firebase database
  const cardRef = ref(db, `users/${user.uid}/cards/${cardId}`);

  // Check if we are "unselecting" a button that is already active
  const isRemoving = (method === 'gacha' && gachaBtn.classList.contains('gacha-active')) || 
                     (method === 'points' && pointsBtn.classList.contains('points-active'));

  if (isRemoving) {
    await set(cardRef, null); // Remove from database
    updateCardUI(cardId, null); // Update the screen
  } else {
    await set(cardRef, method); // Save to database
    updateCardUI(cardId, method); // Update the screen
    
    // Play the specific sound effect for Gacha or Points
    const sfx = document.getElementById(`sfx-${method}`);
    if (sfx) { sfx.currentTime = 0; sfx.play(); }
  }
};

// This helper function updates the visual "active" state of the buttons
function updateCardUI(cardId, method) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const gachaBtn = card.querySelector('.gacha-btn');
  const pointsBtn = card.querySelector('.points-btn');

  // Reset both buttons first
  gachaBtn.classList.remove('gacha-active');
  pointsBtn.classList.remove('points-active');
  card.classList.remove('is-obtained');

  // Activate the correct one based on what was clicked
  if (method === 'gacha') {
    gachaBtn.classList.add('gacha-active');
    card.classList.add('is-obtained');
  } else if (method === 'points') {
    pointsBtn.classList.add('points-active');
    card.classList.add('is-obtained');
  }
}

function updateCardUI(cardId, method) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const gachaBtn = card.querySelector('.gacha-btn');
  const pointsBtn = card.querySelector('.points-btn');

  gachaBtn.classList.remove('gacha-active');
  pointsBtn.classList.remove('points-active');
  card.classList.remove('is-obtained');

  if (method === 'gacha') {
    gachaBtn.classList.add('gacha-active');
    card.classList.add('is-obtained');
  } else if (method === 'points') {
    pointsBtn.classList.add('points-active');
    card.classList.add('is-obtained');
  }
}

function loadBinderFromCloud(uid) {
  const userCardsRef = ref(db, `users/${uid}/cards`);
  get(userCardsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const cardId in data) {
        updateCardUI(cardId, data[cardId]);
      }
    }
  }).catch((error) => {
    console.error("Error loading binder:", error);
  });
}

onAuthStateChanged(auth, (user) => {
  const overlay = document.getElementById('login-overlay');
  if (user) {
    // THIS IS THE KEY CHANGE:
    overlay.style.display = 'none'; 
    overlay.style.pointerEvents = 'none'; // This tells the "glass" to let clicks pass through
    loadBinderFromCloud(user.uid);
  } else {
    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'all'; // This turns the "glass" back on so you can type
  }
});
