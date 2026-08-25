// Durée
const DUREE_PARTIE = 5000;
// URL 'API scores
const API_URL = "http://localhost:4000";

const bouton = document.getElementById("button-clicker");
const affichageScore = document.getElementById("score");
const affichageChrono = document.getElementById("timer");
const champPseudo = document.getElementById("username");
const classement = document.getElementById("leaderboard");

let count = 0;
let partieEnCours = false;
let finPartie = 0; // horodatage fin de partie
let intervalChrono = null;

// Premier clic qui lance le chrono, les suivants comptent les points
bouton.addEventListener("click", () => {
  if (!partieEnCours) {
    demarrerPartie();
    return;
  }
  count++;
  affichageScore.textContent = count;
});

function demarrerPartie() {
  count = 0;
  partieEnCours = true;
  finPartie = Date.now() + DUREE_PARTIE;
  bouton.textContent = "CLIC !";

  //rafraîchit souvent la lisibilité du compteur
  intervalChrono = setInterval(rafraichirChrono, 50);
  rafraichirChrono();
}

function rafraichirChrono() {
  const restant = Math.max(0, finPartie - Date.now());
  affichageChrono.textContent = (restant / 1000).toFixed(1) + " s";

  if (restant === 0) {
    terminerPartie();
  }
}

function terminerPartie() {
  clearInterval(intervalChrono);
  partieEnCours = false;
  affichageChrono.textContent = "Terminé ! " + count + " clics en 5 s";
  bouton.textContent = "Rejouer";

  envoyerScore(champPseudo.value, count);
}

async function envoyerScore(username, score) {
  try {
    await fetch(API_URL + "/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username || "Anonyme", score }),
    });
  } catch (err) {
    console.error("Envoi du score impossible :", err);
  } finally {
    chargerClassement();
  }
}

async function chargerClassement() {
  try {
    const reponse = await fetch(API_URL + "/scores");
    if (!reponse.ok) throw new Error("réponse HTTP " + reponse.status);
    const scores = await reponse.json();

    classement.innerHTML = "";
    scores.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${s.username} — ${s.score}`;
      classement.appendChild(li);
    });
  } catch (err) {
    console.error("Classement indisponible :", err);
    classement.innerHTML = "<li>Classement indisponible</li>";
  }
}

// Premier chargement du classement à l'ouverture de la page
chargerClassement();
