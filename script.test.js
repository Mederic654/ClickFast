describe("ClickFast - script.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="score">0</div>
      <p id="timer">5.0 s</p>
      <button id="button-clicker">Clique pour démarrer</button>
    `;

    // Module rechargé à chaque test pour repartir d'un état propre
    // (script.js capture le DOM et ses variables au chargement)
    jest.resetModules();
    require("./script.js");
  });

  test("le premier clic démarre la partie sans compter de point", () => {
    const bouton = document.getElementById("button-clicker");
    const score = document.getElementById("score");

    bouton.click();

    expect(bouton.textContent).toBe("CLIC !");
    expect(score.textContent).toBe("0");
  });

  test("le score s'incrémente à partir du deuxième clic", () => {
    const bouton = document.getElementById("button-clicker");
    const score = document.getElementById("score");

    bouton.click(); // démarre la partie
    bouton.click(); // 1er point
    bouton.click(); // 2e point

    expect(score.textContent).toBe("2");
  });

  test("le chrono affiche la fin de partie une fois les 5 secondes écoulées", () => {
    jest.useFakeTimers();

    const bouton = document.getElementById("button-clicker");
    const timer = document.getElementById("timer");

    bouton.click(); // démarre la partie
    jest.advanceTimersByTime(5000);

    expect(timer.textContent).toBe("Terminé ! 0 clics en 5 s");
    expect(bouton.textContent).toBe("Rejouer");

    jest.useRealTimers();
  });
});
