// --- NAVIGATION LOGIC ---
// This makes the "Sign In" button work
function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Logged in as:", user.displayName);
      
      // 1. Hide the login screen
      document.getElementById('login-overlay').style.display = 'none';
      
      // 2. Load the cards from the cloud for THIS specific user
      loadBinderFromCloud(user.uid); 
      
      alert("Welcome, " + user.displayName + "!");
    })
    .catch((error) => {
      console.error("Login failed:", error.message);
    });
}

function openBinder(binderId) {
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

function filterCards() {
  // 1. Get the text from the search bar
  const query = document.getElementById('main-search').value.toLowerCase().trim();
  
  // 2. Select all the menu cards (the icons on the home screen)
  const menuCards = document.querySelectorAll('.menu-card');

  menuCards.forEach(card => {
    // 3. Find the name inside the <h2> tag of each card
    const pokemonName = card.querySelector('h2').textContent.toLowerCase();

    // 4. If the name contains the search letters, show it. Otherwise, hide it.
 if (pokemonName.includes(query)) {
  card.style.display = "flex"; // Match this to your .menu-card display type
} else {
  card.style.display = "none";
}
  });
}



function goHome() {
  const backSfx = document.getElementById('sfx-back');
  if (backSfx) { backSfx.currentTime = 0; backSfx.play(); }

  document.querySelectorAll('.binder-page').forEach(page => {
    page.style.display = 'none';
  });
  document.getElementById('home-screen').style.display = 'block';
}

// --- MUSIC LOGIC ---
// 1. Define the music at the VERY TOP of your JS tab (outside any functions)
const bgm = new Audio("https://files.catbox.moe/f13ary.mp3");
bgm.loop = true;

function toggleMusic() {
  const btn = document.getElementById('music-circle');
  const playSfx = document.getElementById('sfx-play');

  if (bgm.paused) {
    // Play button sound
    if (playSfx) { playSfx.currentTime = 0; playSfx.play(); }

    // Play BGM
    bgm.play().then(() => {
      btn.innerHTML = "||";
      btn.style.fontSize = "3rem";
    });
  } else {
    // THE KILL SWITCH
    bgm.pause();
    // Ecosia workaround: We reset the source to "empty" for a millisecond 
    // to force the browser to release the audio stream.
    btn.innerHTML = "▶";
    btn.style.fontSize = "3rem";
  }
}

// --- COLLECTION LOGIC ---
async function setObtained(cardId, method) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in with Google to save your cards!");
    return;
  }

  const card = document.getElementById(cardId);
  const gachaBtn = card.querySelector('.gacha-btn');
  const pointsBtn = card.querySelector('.points-btn');
  
  // Reference to this specific card in the Cloud
  const cardRef = ref(db, `users/${user.uid}/cards/${cardId}`);

  // Check if we are clicking an already active button (to remove it)
  const isRemoving = (method === 'gacha' && gachaBtn.classList.contains('gacha-active')) || 
                     (method === 'points' && pointsBtn.classList.contains('points-active'));

  if (isRemoving) {
    // REMOVE FROM CLOUD
    await set(cardRef, null); 
    updateCardUI(cardId, null); // Helper function to fix the look
  } else {
    // SAVE TO CLOUD
    await set(cardRef, method);
    updateCardUI(cardId, method);
    
    // Play Sounds
    const sfx = document.getElementById(`sfx-${method}`);
    if (sfx) { sfx.currentTime = 0; sfx.play(); }
  }
}

// for CSS
function updateCardUI(cardId, method) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const gachaBtn = card.querySelector('.gacha-btn');
  const pointsBtn = card.querySelector('.points-btn');

  // Reset everything first
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

// sync logic
function loadBinderFromCloud(uid) {
  const userCardsRef = ref(db, `users/${uid}/cards`);
  
  get(userCardsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Loop through all saved cards and update the UI
      for (const cardId in data) {
        updateCardUI(cardId, data[cardId]);
      }
    }
  }).catch((error) => {
    console.error("Error loading binder:", error);
  });
}

// This runs automatically whenever the "Login State" changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, hide login and load cards
    document.getElementById('login-overlay').style.display = 'none';
    loadBinderFromCloud(user.uid);
  } else {
    // No user, show the login screen
    document.getElementById('login-overlay').style.display = 'flex';
  }
});