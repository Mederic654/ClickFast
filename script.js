// Durée 
const DUREE_PARTIE = 5000;

const bouton = document.getElementById("button-clicker");
const affichageScore = document.getElementById("score");
const affichageChrono = document.getElementById("timer");

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
}
